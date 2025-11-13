# Agent Orchestration Plan - Claude Flow & AgentDB Integration

## Overview

This document outlines the comprehensive orchestration strategy for building and managing all 110 NPM packages using [claude-flow](https://www.npmjs.com/package/claude-flow) (alpha) and [agentdb](https://www.npmjs.com/package/agentdb) for distributed agent coordination.

---

## Architecture

### High-Level Components

```
┌────────────────────────────────────────────────────────────────┐
│                    Orchestration Control Plane                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Main Orchestrator (orchestrate.ts)                      │  │
│  │  - Load 110 crate specifications                         │  │
│  │  - Build dependency graph                                │  │
│  │  - Coordinate agent swarm                                │  │
│  │  - Monitor build progress                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Claude Flow Agent Swarm                                 │  │
│  │  ┌────────────┐  ┌────────────┐       ┌────────────┐    │  │
│  │  │  Agent 1   │  │  Agent 2   │  ...  │  Agent 110 │    │  │
│  │  │  builder   │  │  builder   │       │  builder   │    │  │
│  │  └────────────┘  └────────────┘       └────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AgentDB (Coordination & Memory)                         │  │
│  │  - SQLite/PostgreSQL database                            │  │
│  │  - Vector store (Chroma/Pinecone)                        │  │
│  │  - Build state management                                │  │
│  │  - Dependency tracking                                   │  │
│  │  - Artifact registry                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    E2B Sandbox Cluster                          │
│  (Managed via OpenRouter API)                                   │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ Sandbox 1  │  │ Sandbox 2  │  │ Sandbox 30 │               │
│  │ rust+napi  │  │ rust+napi  │  │ rust+napi  │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### 1. Main Orchestration Script

**File**: `scripts/orchestrate.ts`

```typescript
#!/usr/bin/env node
/**
 * Main orchestration script for building all 110 @ruv.io packages
 *
 * Uses:
 * - npx claude-flow@alpha for agent coordination
 * - npm agentdb for state management
 * - E2B sandboxes via OpenRouter API for isolated builds
 */

import { ClaudeFlow, Agent, Task } from 'claude-flow'
import { AgentDB, VectorStore } from 'agentdb'
import { E2BSandbox } from '@e2b/sdk'
import { promises as fs } from 'fs'
import path from 'path'
import YAML from 'yaml'

// ============================================================================
// Configuration
// ============================================================================

interface OrchestratorConfig {
  // Claude Flow configuration
  claudeFlow: {
    apiKey: string
    model: string
    maxConcurrentAgents: number
    retryPolicy: {
      maxRetries: number
      backoffMs: number
    }
  }

  // AgentDB configuration
  agentDB: {
    databaseUrl: string
    vectorStore: {
      provider: 'chroma' | 'pinecone' | 'local'
      apiKey?: string
      endpoint?: string
    }
  }

  // E2B Sandbox configuration
  e2b: {
    apiKey: string
    template: string
    maxConcurrentSandboxes: number
    timeoutMs: number
  }

  // Build configuration
  build: {
    parallelBatches: boolean
    skipTests: boolean
    targetPlatforms: string[]
  }
}

const config: OrchestratorConfig = {
  claudeFlow: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022',
    maxConcurrentAgents: 30,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 2000
    }
  },
  agentDB: {
    databaseUrl: process.env.DATABASE_URL || 'sqlite://agents.db',
    vectorStore: {
      provider: 'local'
    }
  },
  e2b: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    template: 'rust-napi-builder',
    maxConcurrentSandboxes: 30,
    timeoutMs: 3600000 // 1 hour per package
  },
  build: {
    parallelBatches: true,
    skipTests: false,
    targetPlatforms: [
      'linux-x64-gnu',
      'linux-x64-musl',
      'linux-arm64-gnu',
      'darwin-x64',
      'darwin-arm64',
      'win32-x64-msvc',
      'wasm32'
    ]
  }
}

// ============================================================================
// Types
// ============================================================================

interface CrateSpec {
  name: string
  version: string
  description: string
  downloads: number
  categories: string[]
  packageType: string[]
  complexity: string
  estimatedTime: string
  dependencies: string[]
  planPath: string
}

interface BuildResult {
  crateName: string
  success: boolean
  duration: number
  artifacts: string[]
  errors?: string[]
  warnings?: string[]
  metrics: {
    testCoverage?: number
    binarySize?: number
    buildTime: number
  }
}

interface DependencyGraph {
  nodes: Map<string, CrateSpec>
  edges: Map<string, string[]> // crate -> dependencies
  batches: CrateSpec[][] // Topologically sorted batches
}

// ============================================================================
// AgentDB Setup
// ============================================================================

class BuildStateManager {
  private db: AgentDB

  constructor(config: OrchestratorConfig['agentDB']) {
    this.db = new AgentDB({
      connection: config.databaseUrl,
      vectorStore: config.vectorStore
    })
  }

  async initialize(): Promise<void> {
    // Create tables for build state management
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS builds (
        id TEXT PRIMARY KEY,
        crate_name TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        duration_ms INTEGER,
        artifacts JSON,
        errors JSON,
        warnings JSON,
        metrics JSON,
        platform TEXT,
        agent_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_builds_status
        ON builds(status);

      CREATE INDEX IF NOT EXISTS idx_builds_crate
        ON builds(crate_name);
    `)

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS dependencies (
        from_crate TEXT NOT NULL,
        to_crate TEXT NOT NULL,
        version_requirement TEXT,
        PRIMARY KEY (from_crate, to_crate)
      );
    `)

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        build_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        file_path TEXT NOT NULL,
        size_bytes INTEGER,
        checksum TEXT,
        created_at TIMESTAMP,
        FOREIGN KEY (build_id) REFERENCES builds(id)
      );
    `)
  }

  async recordBuildStart(
    crateName: string,
    version: string,
    agentId: string,
    platform: string
  ): Promise<string> {
    const buildId = `${crateName}-${version}-${platform}-${Date.now()}`
    await this.db.insert('builds', {
      id: buildId,
      crate_name: crateName,
      version,
      status: 'building',
      started_at: new Date(),
      platform,
      agent_id: agentId
    })
    return buildId
  }

  async recordBuildComplete(
    buildId: string,
    result: BuildResult
  ): Promise<void> {
    await this.db.update('builds', {
      id: buildId
    }, {
      status: result.success ? 'success' : 'failed',
      completed_at: new Date(),
      duration_ms: result.duration,
      artifacts: JSON.stringify(result.artifacts),
      errors: JSON.stringify(result.errors || []),
      warnings: JSON.stringify(result.warnings || []),
      metrics: JSON.stringify(result.metrics)
    })
  }

  async getBuildStatus(crateName: string): Promise<string | null> {
    const result = await this.db.query(
      'SELECT status FROM builds WHERE crate_name = ? ORDER BY started_at DESC LIMIT 1',
      [crateName]
    )
    return result[0]?.status || null
  }

  async getAllBuilds(): Promise<any[]> {
    return this.db.query('SELECT * FROM builds ORDER BY started_at DESC')
  }
}

// ============================================================================
// Dependency Graph Builder
// ============================================================================

class DependencyGraphBuilder {
  private stateManager: BuildStateManager

  constructor(stateManager: BuildStateManager) {
    this.stateManager = stateManager
  }

  async buildGraph(specs: CrateSpec[]): Promise<DependencyGraph> {
    const nodes = new Map<string, CrateSpec>()
    const edges = new Map<string, string[]>()

    // Build nodes
    for (const spec of specs) {
      nodes.set(spec.name, spec)
    }

    // Build edges
    for (const spec of specs) {
      const deps = this.extractDependencies(spec)
      edges.set(spec.name, deps)

      // Store in AgentDB
      for (const dep of deps) {
        await this.stateManager.db.insert('dependencies', {
          from_crate: spec.name,
          to_crate: dep,
          version_requirement: '*'
        })
      }
    }

    // Topological sort to create build batches
    const batches = this.topologicalSort(nodes, edges)

    return { nodes, edges, batches }
  }

  private extractDependencies(spec: CrateSpec): string[] {
    // Extract dependencies from spec
    // This is a simplified version - real implementation would parse Cargo.toml
    const deps: string[] = []

    // Infer from naming patterns
    if (spec.name.includes('-wasm')) {
      const baseName = spec.name.replace('-wasm', '')
      if (baseName !== spec.name) deps.push(baseName)
    }

    if (spec.name.includes('-cli')) {
      const baseName = spec.name.replace('-cli', '')
      if (baseName !== spec.name) deps.push(baseName)
    }

    // Core dependencies
    if (spec.name.startsWith('aimds-') && spec.name !== 'aimds-core') {
      deps.push('aimds-core')
    }

    if (spec.name.startsWith('ruv-swarm-') && spec.name !== 'ruv-swarm-core') {
      deps.push('ruv-swarm-core')
    }

    if (spec.name.startsWith('nt-') && spec.name !== 'nt-core') {
      deps.push('nt-core')
    }

    return deps
  }

  private topologicalSort(
    nodes: Map<string, CrateSpec>,
    edges: Map<string, string[]>
  ): CrateSpec[][] {
    const batches: CrateSpec[][] = []
    const visited = new Set<string>()
    const inProgress = new Set<string>()

    // Find nodes with no dependencies (Tier 0)
    let currentBatch: CrateSpec[] = []
    for (const [name, spec] of nodes) {
      const deps = edges.get(name) || []
      if (deps.length === 0) {
        currentBatch.push(spec)
        visited.add(name)
      }
    }
    batches.push(currentBatch)

    // Build subsequent batches
    while (visited.size < nodes.size) {
      currentBatch = []

      for (const [name, spec] of nodes) {
        if (visited.has(name)) continue

        const deps = edges.get(name) || []
        const allDepsBuilt = deps.every(dep => visited.has(dep))

        if (allDepsBuilt) {
          currentBatch.push(spec)
          visited.add(name)
        }
      }

      if (currentBatch.length === 0) {
        // Circular dependency or error
        console.error('Unable to resolve dependencies for remaining packages')
        break
      }

      batches.push(currentBatch)
    }

    return batches
  }
}

// ============================================================================
// Build Agent
// ============================================================================

class BuildAgent {
  private id: string
  private spec: CrateSpec
  private sandbox: E2BSandbox | null = null
  private stateManager: BuildStateManager
  private config: OrchestratorConfig

  constructor(
    id: string,
    spec: CrateSpec,
    stateManager: BuildStateManager,
    config: OrchestratorConfig
  ) {
    this.id = id
    this.spec = spec
    this.stateManager = stateManager
    this.config = config
  }

  async execute(): Promise<BuildResult> {
    const startTime = Date.now()

    try {
      console.log(`[${this.id}] Starting build for ${this.spec.name}`)

      // Record build start
      const buildId = await this.stateManager.recordBuildStart(
        this.spec.name,
        this.spec.version,
        this.id,
        'multi' // Will build for all platforms
      )

      // Create E2B sandbox
      this.sandbox = await E2BSandbox.create({
        template: this.config.e2b.template,
        envVars: {
          OPENROUTER_API_KEY: this.config.e2b.apiKey,
          CRATE_NAME: this.spec.name,
          CRATE_VERSION: this.spec.version
        },
        timeout: this.config.e2b.timeoutMs
      })

      // Upload build files
      await this.setupBuildEnvironment()

      // Run build
      const buildResult = await this.runBuild()

      // Collect artifacts
      const artifacts = await this.collectArtifacts()

      // Run tests
      if (!this.config.build.skipTests) {
        await this.runTests()
      }

      const duration = Date.now() - startTime

      const result: BuildResult = {
        crateName: this.spec.name,
        success: true,
        duration,
        artifacts,
        metrics: {
          buildTime: duration,
          binarySize: await this.calculateArtifactSize(artifacts),
          testCoverage: await this.getTestCoverage()
        }
      }

      // Record completion
      await this.stateManager.recordBuildComplete(buildId, result)

      console.log(`[${this.id}] ✅ Completed ${this.spec.name} in ${duration}ms`)

      return result

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      console.error(`[${this.id}] ❌ Failed ${this.spec.name}: ${errorMessage}`)

      const result: BuildResult = {
        crateName: this.spec.name,
        success: false,
        duration,
        artifacts: [],
        errors: [errorMessage],
        metrics: {
          buildTime: duration
        }
      }

      return result

    } finally {
      // Cleanup sandbox
      if (this.sandbox) {
        await this.sandbox.close()
      }
    }
  }

  private async setupBuildEnvironment(): Promise<void> {
    if (!this.sandbox) throw new Error('Sandbox not initialized')

    // Create package directory
    await this.sandbox.filesystem.makeDir(`/workspace/${this.spec.name}`)

    // Upload template files
    const templateDir = path.join(__dirname, '../templates/napi-package')
    await this.sandbox.filesystem.write(
      `/workspace/${this.spec.name}/Cargo.toml`,
      await this.generateCargoToml()
    )

    await this.sandbox.filesystem.write(
      `/workspace/${this.spec.name}/package.json`,
      await this.generatePackageJson()
    )

    await this.sandbox.filesystem.write(
      `/workspace/${this.spec.name}/src/lib.rs`,
      await this.generateLibRs()
    )
  }

  private async runBuild(): Promise<void> {
    if (!this.sandbox) throw new Error('Sandbox not initialized')

    const platforms = this.config.build.targetPlatforms

    for (const platform of platforms) {
      console.log(`[${this.id}] Building ${this.spec.name} for ${platform}`)

      const result = await this.sandbox.process.start({
        cmd: `cd /workspace/${this.spec.name} && pnpm build --target ${platform}`
      })

      if (result.exitCode !== 0) {
        throw new Error(`Build failed for ${platform}: ${result.stderr}`)
      }
    }
  }

  private async runTests(): Promise<void> {
    if (!this.sandbox) throw new Error('Sandbox not initialized')

    const result = await this.sandbox.process.start({
      cmd: `cd /workspace/${this.spec.name} && pnpm test`
    })

    if (result.exitCode !== 0) {
      throw new Error(`Tests failed: ${result.stderr}`)
    }
  }

  private async collectArtifacts(): Promise<string[]> {
    if (!this.sandbox) throw new Error('Sandbox not initialized')

    // Download built artifacts
    const artifactDir = await this.sandbox.filesystem.list(
      `/workspace/${this.spec.name}/target/release`
    )

    return artifactDir.map(f => f.name)
  }

  private async calculateArtifactSize(artifacts: string[]): Promise<number> {
    // Calculate total size of artifacts
    return artifacts.reduce((total, artifact) => {
      // Simplified - would actually check file sizes
      return total + 1024 * 1024 // 1MB placeholder
    }, 0)
  }

  private async getTestCoverage(): Promise<number> {
    // Parse test coverage from output
    return 95.0 // Placeholder
  }

  private async generateCargoToml(): Promise<string> {
    return `
[package]
name = "${this.spec.name.replace('-', '_')}"
version = "${this.spec.version}"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
napi = "2.16"
napi-derive = "2.16"
${this.spec.name} = "${this.spec.version}"

[build-dependencies]
napi-build = "2.1"
`
  }

  private async generatePackageJson(): Promise<string> {
    return JSON.stringify({
      name: `@ruv.io/${this.spec.name}`,
      version: this.spec.version,
      description: this.spec.description,
      main: 'index.js',
      types: 'index.d.ts',
      napi: {
        name: this.spec.name.replace('-', '_'),
        triples: {
          defaults: true
        }
      }
    }, null, 2)
  }

  private async generateLibRs(): Promise<string> {
    return `
#[macro_use]
extern crate napi_derive;

// Re-export original crate
pub use ${this.spec.name.replace('-', '_')}::*;

// Add napi bindings here
`
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

class SwarmOrchestrator {
  private config: OrchestratorConfig
  private stateManager: BuildStateManager
  private graphBuilder: DependencyGraphBuilder
  private claudeFlow: ClaudeFlow

  constructor(config: OrchestratorConfig) {
    this.config = config
    this.stateManager = new BuildStateManager(config.agentDB)
    this.graphBuilder = new DependencyGraphBuilder(this.stateManager)
    this.claudeFlow = new ClaudeFlow({
      apiKey: config.claudeFlow.apiKey,
      model: config.claudeFlow.model,
      maxConcurrentAgents: config.claudeFlow.maxConcurrentAgents
    })
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing orchestrator...')
    await this.stateManager.initialize()
    console.log('✅ AgentDB initialized')
  }

  async loadCrateSpecs(): Promise<CrateSpec[]> {
    console.log('📦 Loading crate specifications...')

    const plansDir = path.join(__dirname, '../plans')
    const files = await fs.readdir(plansDir)
    const planFiles = files.filter(f => f.match(/^\d{3}-.*\.md$/))

    const specs: CrateSpec[] = []

    for (const file of planFiles) {
      const content = await fs.readFile(path.join(plansDir, file), 'utf-8')
      const spec = this.parsePlanFile(content, file)
      specs.push(spec)
    }

    console.log(`✅ Loaded ${specs.length} crate specifications`)
    return specs
  }

  private parsePlanFile(content: string, filename: string): CrateSpec {
    // Parse markdown plan file to extract metadata
    // Simplified version - real implementation would use proper markdown parser

    const nameMatch = content.match(/\*\*Crate Name\*\*: `(.+?)`/)
    const versionMatch = content.match(/\*\*Version\*\*: (.+)/)
    const downloadsMatch = content.match(/\*\*Downloads\*\*: ([\d,]+)/)
    const categoriesMatch = content.match(/\*\*Categories\*\*: (.+)/)
    const complexityMatch = content.match(/\*\*Complexity\*\*: (.+)/)
    const timeMatch = content.match(/\*\*Estimated Time\*\*: (.+)/)

    return {
      name: nameMatch?.[1] || 'unknown',
      version: versionMatch?.[1]?.trim() || '0.1.0',
      description: '',
      downloads: parseInt(downloadsMatch?.[1]?.replace(/,/g, '') || '0'),
      categories: categoriesMatch?.[1]?.split(',').map(c => c.trim()) || [],
      packageType: [],
      complexity: complexityMatch?.[1]?.trim() || 'Medium',
      estimatedTime: timeMatch?.[1]?.trim() || '2-3 days',
      dependencies: [],
      planPath: filename
    }
  }

  async executeBuild(): Promise<void> {
    console.log('🏗️  Starting build orchestration...')

    // Load specifications
    const specs = await this.loadCrateSpecs()

    // Build dependency graph
    console.log('📊 Building dependency graph...')
    const graph = await this.graphBuilder.buildGraph(specs)
    console.log(`✅ Dependency graph created with ${graph.batches.length} batches`)

    // Execute builds batch by batch
    const results: BuildResult[] = []

    for (let i = 0; i < graph.batches.length; i++) {
      const batch = graph.batches[i]
      console.log(`\n📦 Batch ${i + 1}/${graph.batches.length}: ${batch.length} packages`)

      // Build all packages in batch in parallel
      const batchResults = await this.executeBatch(batch, i)
      results.push(...batchResults)

      // Check for failures
      const failures = batchResults.filter(r => !r.success)
      if (failures.length > 0) {
        console.error(`❌ ${failures.length} packages failed in batch ${i + 1}`)
        for (const failure of failures) {
          console.error(`   - ${failure.crateName}`)
        }

        if (failures.length > batch.length * 0.3) {
          throw new Error(`Too many failures in batch ${i + 1}, aborting`)
        }
      }
    }

    // Generate report
    await this.generateReport(results)
  }

  private async executeBatch(
    batch: CrateSpec[],
    batchIndex: number
  ): Promise<BuildResult[]> {
    const agents: BuildAgent[] = []

    // Create agents for each package
    for (let i = 0; i < batch.length; i++) {
      const spec = batch[i]
      const agentId = `builder-${spec.name}-batch${batchIndex}`
      const agent = new BuildAgent(agentId, spec, this.stateManager, this.config)
      agents.push(agent)
    }

    // Execute agents in parallel (with concurrency limit)
    const results: BuildResult[] = []
    const concurrency = this.config.claudeFlow.maxConcurrentAgents

    for (let i = 0; i < agents.length; i += concurrency) {
      const chunk = agents.slice(i, i + concurrency)
      const chunkResults = await Promise.all(
        chunk.map(agent => agent.execute())
      )
      results.push(...chunkResults)
    }

    return results
  }

  private async generateReport(results: BuildResult[]): Promise<void> {
    console.log('\n' + '='.repeat(80))
    console.log('📊 BUILD REPORT')
    console.log('='.repeat(80))

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    console.log(`\nTotal Packages: ${results.length}`)
    console.log(`✅ Successful: ${successful.length}`)
    console.log(`❌ Failed: ${failed.length}`)
    console.log(`📈 Success Rate: ${(successful.length / results.length * 100).toFixed(1)}%`)

    if (failed.length > 0) {
      console.log('\n❌ Failed Packages:')
      for (const result of failed) {
        console.log(`   - ${result.crateName}`)
        if (result.errors) {
          for (const error of result.errors) {
            console.log(`     Error: ${error}`)
          }
        }
      }
    }

    const totalTime = results.reduce((sum, r) => sum + r.duration, 0)
    console.log(`\n⏱️  Total Build Time: ${(totalTime / 1000 / 60).toFixed(1)} minutes`)
    console.log(`⏱️  Avg Build Time: ${(totalTime / results.length / 1000).toFixed(1)} seconds`)

    // Save report to file
    const reportPath = path.join(__dirname, '../BUILD_REPORT.md')
    await fs.writeFile(reportPath, this.formatReportMarkdown(results))
    console.log(`\n📝 Full report saved to: ${reportPath}`)
  }

  private formatReportMarkdown(results: BuildResult[]): string {
    // Generate detailed markdown report
    return `
# Build Report - @ruv.io/* Packages

Generated: ${new Date().toISOString()}

## Summary

- Total Packages: ${results.length}
- Successful: ${results.filter(r => r.success).length}
- Failed: ${results.filter(r => !r.success).length}
- Success Rate: ${(results.filter(r => r.success).length / results.length * 100).toFixed(1)}%

## Results

${results.map(r => `
### ${r.crateName}

- Status: ${r.success ? '✅ Success' : '❌ Failed'}
- Duration: ${(r.duration / 1000).toFixed(2)}s
- Artifacts: ${r.artifacts.length}
${r.errors ? `- Errors: ${r.errors.join(', ')}` : ''}
`).join('\n')}
`
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  console.log('🎯 RUV.IO Package Orchestrator')
  console.log('=' .repeat(80))

  try {
    const orchestrator = new SwarmOrchestrator(config)
    await orchestrator.initialize()
    await orchestrator.executeBuild()

    console.log('\n✅ Orchestration completed successfully!')
    process.exit(0)

  } catch (error) {
    console.error('\n❌ Orchestration failed:', error)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { SwarmOrchestrator, BuildAgent, DependencyGraphBuilder, BuildStateManager }
```

---

## Usage

### Installation

```bash
# Install dependencies
npm install -g npx
npx claude-flow@alpha --version
npm install agentdb @e2b/sdk

# Install project dependencies
pnpm install
```

### Running the Orchestrator

```bash
# Set environment variables
export ANTHROPIC_API_KEY=your_api_key
export OPENROUTER_API_KEY=your_openrouter_key
export DATABASE_URL=sqlite://agents.db

# Run orchestration
pnpm orchestrate

# Or with options
pnpm orchestrate --skip-tests --max-concurrent=20
```

### Monitoring Progress

```bash
# View AgentDB status
sqlite3 agents.db "SELECT * FROM builds ORDER BY started_at DESC LIMIT 10"

# View dependency graph
sqlite3 agents.db "SELECT * FROM dependencies"

# View real-time logs
tail -f orchestrator.log
```

---

## Configuration

### Claude Flow Settings

```typescript
{
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  maxConcurrentAgents: 30,
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 2000
  }
}
```

### AgentDB Settings

```typescript
{
  databaseUrl: 'sqlite://agents.db', // or PostgreSQL
  vectorStore: {
    provider: 'local', // or 'chroma', 'pinecone'
    apiKey: process.env.VECTOR_DB_KEY,
    endpoint: process.env.VECTOR_DB_ENDPOINT
  }
}
```

### E2B Settings

```typescript
{
  apiKey: process.env.OPENROUTER_API_KEY,
  template: 'rust-napi-builder',
  maxConcurrentSandboxes: 30,
  timeoutMs: 3600000 // 1 hour
}
```

---

## Advanced Features

### Retry Logic

```typescript
async executeWithRetry(
  fn: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, 2000 * Math.pow(2, i)))
    }
  }
}
```

### Build Caching

```typescript
// Cache successful builds to avoid rebuilds
const cacheKey = `${crateName}-${version}-${platform}`
const cached = await cache.get(cacheKey)
if (cached) return cached
```

### Incremental Builds

```typescript
// Only rebuild packages that have changed
const hasChanged = await checkForChanges(crateName)
if (!hasChanged) {
  console.log(`Skipping ${crateName} (no changes)`)
  return
}
```

---

## Troubleshooting

### Common Issues

1. **Sandbox timeout**: Increase `timeoutMs` in config
2. **Memory issues**: Reduce `maxConcurrentSandboxes`
3. **Dependency resolution**: Check dependency graph in AgentDB
4. **Build failures**: Check sandbox logs and error messages

### Debug Mode

```bash
# Run with debug logging
DEBUG=* pnpm orchestrate

# Save logs
pnpm orchestrate > orchestrator.log 2>&1
```

---

## Performance Optimization

### Parallel Execution

- **Batch 1** (30 packages): ~1 hour (30 concurrent)
- **Batch 2** (25 packages): ~50 minutes
- **Batch 3** (35 packages): ~1.5 hours
- **Batch 4** (20 packages): ~40 minutes

**Total Estimated Time**: ~4-5 hours (with 30 concurrent sandboxes)

### Resource Requirements

- **CPU**: 30+ cores recommended
- **Memory**: 128GB+ recommended
- **Disk**: 500GB+ for artifacts
- **Network**: High-speed connection for E2B API

---

## Next Steps

1. ✅ Complete orchestration script
2. ⏳ Test with small batch (5 packages)
3. ⏳ Test with full batch (110 packages)
4. ⏳ Optimize performance
5. ⏳ Add monitoring dashboard
6. ⏳ Implement caching layer

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-13
**Status**: Planning Phase
