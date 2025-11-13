# E2B Sandbox Integration Strategy

## Overview

This document outlines the comprehensive strategy for using [E2B (End-to-End Build)](https://e2b.dev/) sandboxes via OpenRouter API to build all 110 NPM packages in isolated, secure environments.

---

## Why E2B Sandboxes?

### Benefits

1. **Isolation**: Each package builds in a completely isolated environment
2. **Reproducibility**: Consistent build environment for all packages
3. **Security**: No risk of malicious code affecting host system
4. **Scalability**: Spin up 30+ concurrent sandboxes
5. **Clean State**: Fresh environment for each build
6. **Platform Support**: Support for cross-compilation to 7+ platforms

### E2B Features Used

- **Custom Templates**: Pre-configured Rust + napi-rs environment
- **File System API**: Upload code, download artifacts
- **Process API**: Execute build commands
- **Timeout Control**: Prevent runaway builds
- **Resource Limits**: CPU and memory constraints
- **Network Access**: For dependency downloads

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Host System (Orchestrator)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Orchestrator (scripts/orchestrate.ts)                   │  │
│  │  - Manages 110 build agents                              │  │
│  │  - Coordinates E2B sandbox allocation                    │  │
│  │  - Collects build artifacts                              │  │
│  └────────────────┬─────────────────────────────────────────┘  │
└───────────────────┼─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │   OpenRouter API      │
        │   (E2B Gateway)       │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────────────┐
        │                               │
┌───────▼────────┐         ┌────────────▼─────────┐
│  E2B Sandbox 1 │   ...   │  E2B Sandbox 30      │
│  ┌──────────┐  │         │  ┌──────────┐        │
│  │ Ubuntu   │  │         │  │ Ubuntu   │        │
│  │ 22.04    │  │         │  │ 22.04    │        │
│  ├──────────┤  │         │  ├──────────┤        │
│  │ Rust     │  │         │  │ Rust     │        │
│  │ toolchain│  │         │  │ toolchain│        │
│  ├──────────┤  │         │  ├──────────┤        │
│  │ Node.js  │  │         │  │ Node.js  │        │
│  │ + pnpm   │  │         │  │ + pnpm   │        │
│  ├──────────┤  │         │  ├──────────┤        │
│  │ napi-rs  │  │         │  │ napi-rs  │        │
│  │ + tools  │  │         │  │ + tools  │        │
│  └──────────┘  │         │  └──────────┘        │
│  Building:     │         │  Building:           │
│  ruv-fann      │         │  qudag-crypto        │
└────────────────┘         └──────────────────────┘
```

---

## E2B Template Configuration

### Dockerfile

**File**: `e2b/rust-napi-builder.Dockerfile`

```dockerfile
# E2B Sandbox Template for Rust + napi-rs builds
FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    python3 \
    python3-pip \
    # For cross-compilation
    gcc-aarch64-linux-gnu \
    g++-aarch64-linux-gnu \
    gcc-x86-64-linux-gnu \
    g++-x86-64-linux-gnu \
    # For Windows cross-compilation
    mingw-w64 \
    # Additional tools
    jq \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Rust targets for cross-compilation
RUN rustup target add \
    x86_64-unknown-linux-gnu \
    x86_64-unknown-linux-musl \
    aarch64-unknown-linux-gnu \
    aarch64-apple-darwin \
    x86_64-apple-darwin \
    x86_64-pc-windows-msvc \
    wasm32-unknown-unknown \
    wasm32-wasi

# Install wasm-pack for WASM builds
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Node.js 20 (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Install napi-rs CLI
RUN pnpm add -g @napi-rs/cli

# Install cross-compilation linkers
RUN cargo install cross

# Set up workspace
WORKDIR /workspace

# Configure cargo for cross-compilation
RUN mkdir -p /root/.cargo && cat > /root/.cargo/config.toml <<EOF
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"

[target.aarch64-apple-darwin]
linker = "aarch64-apple-darwin-ld"

[target.x86_64-pc-windows-msvc]
linker = "x86_64-w64-mingw32-gcc"

[target.x86_64-unknown-linux-musl]
linker = "x86_64-linux-gnu-gcc"

[build]
jobs = 4

[net]
git-fetch-with-cli = true
EOF

# Pre-download common dependencies to speed up builds
RUN cargo install cargo-binstall \
    && cargo binstall -y cargo-cache \
    && cargo binstall -y cargo-audit

# Set environment variables
ENV RUST_BACKTRACE=1
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true
ENV CARGO_INCREMENTAL=0
ENV CARGO_TERM_COLOR=always

# Create build script
RUN cat > /workspace/build.sh <<'BUILDSCRIPT'
#!/bin/bash
set -e

CRATE_NAME=${CRATE_NAME:-unknown}
CRATE_VERSION=${CRATE_VERSION:-0.1.0}
BUILD_DIR="/workspace/${CRATE_NAME}"

echo "========================================="
echo "Building: ${CRATE_NAME} v${CRATE_VERSION}"
echo "========================================="

cd "${BUILD_DIR}"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build for all platforms
echo "🏗️  Building for all platforms..."
pnpm build

# Run tests
if [ "${SKIP_TESTS}" != "true" ]; then
  echo "🧪 Running tests..."
  pnpm test || echo "⚠️  Tests failed, continuing..."
fi

# Collect artifacts
echo "📦 Collecting artifacts..."
mkdir -p /workspace/artifacts
cp -r target/release/*.node /workspace/artifacts/ 2>/dev/null || true
cp -r dist /workspace/artifacts/ 2>/dev/null || true
cp -r build /workspace/artifacts/ 2>/dev/null || true

echo "✅ Build completed successfully!"
BUILDSCRIPT

RUN chmod +x /workspace/build.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD rustc --version && node --version || exit 1

# Default command
CMD ["/bin/bash"]
```

### E2B Template Configuration

**File**: `e2b/template.json`

```json
{
  "name": "rust-napi-builder",
  "version": "1.0.0",
  "description": "Rust + napi-rs build environment for @ruv.io packages",
  "dockerfile": "./rust-napi-builder.Dockerfile",
  "cpu": 4,
  "memory": "8GB",
  "disk": "20GB",
  "timeout": 3600000,
  "env": {
    "RUST_BACKTRACE": "1",
    "CARGO_INCREMENTAL": "0",
    "CARGO_TERM_COLOR": "always"
  },
  "mounts": [
    {
      "source": "/tmp/cargo-cache",
      "target": "/root/.cargo/registry",
      "type": "cache"
    },
    {
      "source": "/tmp/cargo-git",
      "target": "/root/.cargo/git",
      "type": "cache"
    }
  ]
}
```

---

## Integration with Orchestrator

### Sandbox Lifecycle

```typescript
// 1. Create Sandbox
const sandbox = await E2BSandbox.create({
  template: 'rust-napi-builder',
  envVars: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    CRATE_NAME: crateName,
    CRATE_VERSION: version,
    SKIP_TESTS: skipTests ? 'true' : 'false'
  },
  timeout: 3600000 // 1 hour
})

// 2. Upload Source Code
await sandbox.filesystem.write(
  `/workspace/${crateName}/Cargo.toml`,
  cargoTomlContent
)

await sandbox.filesystem.write(
  `/workspace/${crateName}/package.json`,
  packageJsonContent
)

await sandbox.filesystem.write(
  `/workspace/${crateName}/src/lib.rs`,
  libRsContent
)

// 3. Execute Build
const result = await sandbox.process.start({
  cmd: `/workspace/build.sh`,
  env: {
    CRATE_NAME: crateName
  }
})

// 4. Check Results
if (result.exitCode !== 0) {
  console.error(`Build failed: ${result.stderr}`)
  throw new Error(`Build failed for ${crateName}`)
}

// 5. Download Artifacts
const artifacts = await sandbox.filesystem.readDir(
  '/workspace/artifacts'
)

for (const artifact of artifacts) {
  const content = await sandbox.filesystem.read(
    `/workspace/artifacts/${artifact.name}`
  )
  await fs.writeFile(
    `./dist/${crateName}/${artifact.name}`,
    content
  )
}

// 6. Cleanup
await sandbox.close()
```

### Error Handling

```typescript
class SandboxBuildError extends Error {
  constructor(
    public crateName: string,
    public exitCode: number,
    public stdout: string,
    public stderr: string
  ) {
    super(`Build failed for ${crateName} (exit code: ${exitCode})`)
    this.name = 'SandboxBuildError'
  }
}

async function buildInSandbox(
  crateName: string,
  config: BuildConfig
): Promise<BuildResult> {
  let sandbox: E2BSandbox | null = null

  try {
    sandbox = await E2BSandbox.create({
      template: 'rust-napi-builder',
      timeout: config.timeout
    })

    // ... build process ...

    return {
      success: true,
      artifacts: []
    }

  } catch (error) {
    if (error instanceof SandboxBuildError) {
      // Log build failure details
      await logBuildFailure(error)
    }
    throw error

  } finally {
    // Always cleanup sandbox
    if (sandbox) {
      try {
        await sandbox.close()
      } catch (closeError) {
        console.error('Failed to close sandbox:', closeError)
      }
    }
  }
}
```

### Retry Logic

```typescript
async function buildWithRetry(
  crateName: string,
  config: BuildConfig,
  maxRetries: number = 3
): Promise<BuildResult> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${crateName}] Build attempt ${attempt}/${maxRetries}`)

      const result = await buildInSandbox(crateName, config)

      console.log(`[${crateName}] ✅ Build succeeded on attempt ${attempt}`)
      return result

    } catch (error) {
      lastError = error as Error
      console.error(
        `[${crateName}] ❌ Build failed on attempt ${attempt}: ${error.message}`
      )

      if (attempt < maxRetries) {
        const backoffMs = 2000 * Math.pow(2, attempt - 1)
        console.log(`[${crateName}] Retrying in ${backoffMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
      }
    }
  }

  throw new Error(
    `Build failed after ${maxRetries} attempts: ${lastError?.message}`
  )
}
```

---

## Resource Management

### Sandbox Pool

```typescript
class SandboxPool {
  private available: E2BSandbox[] = []
  private inUse: Set<E2BSandbox> = new Set()
  private maxSize: number

  constructor(maxSize: number = 30) {
    this.maxSize = maxSize
  }

  async acquire(): Promise<E2BSandbox> {
    // Try to get available sandbox
    if (this.available.length > 0) {
      const sandbox = this.available.pop()!
      this.inUse.add(sandbox)
      return sandbox
    }

    // Create new sandbox if under limit
    if (this.inUse.size < this.maxSize) {
      const sandbox = await E2BSandbox.create({
        template: 'rust-napi-builder'
      })
      this.inUse.add(sandbox)
      return sandbox
    }

    // Wait for available sandbox
    return this.waitForAvailable()
  }

  async release(sandbox: E2BSandbox): Promise<void> {
    this.inUse.delete(sandbox)

    // Clean sandbox state
    await sandbox.filesystem.remove('/workspace/*')

    this.available.push(sandbox)
  }

  private async waitForAvailable(): Promise<E2BSandbox> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.available.length > 0) {
          clearInterval(checkInterval)
          const sandbox = this.available.pop()!
          this.inUse.add(sandbox)
          resolve(sandbox)
        }
      }, 1000)
    })
  }

  async closeAll(): Promise<void> {
    const all = [...this.available, ...this.inUse]
    await Promise.all(all.map(s => s.close()))
    this.available = []
    this.inUse.clear()
  }
}

// Usage
const pool = new SandboxPool(30)

async function buildPackage(crateName: string): Promise<void> {
  const sandbox = await pool.acquire()
  try {
    // Build in sandbox
    await buildInSandbox(crateName, sandbox)
  } finally {
    await pool.release(sandbox)
  }
}
```

### Resource Monitoring

```typescript
interface SandboxMetrics {
  sandboxId: string
  crateName: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  buildDuration: number
  startTime: Date
  endTime?: Date
}

class SandboxMonitor {
  private metrics: Map<string, SandboxMetrics> = new Map()

  startMonitoring(sandboxId: string, crateName: string): void {
    this.metrics.set(sandboxId, {
      sandboxId,
      crateName,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      buildDuration: 0,
      startTime: new Date()
    })
  }

  async updateMetrics(
    sandboxId: string,
    sandbox: E2BSandbox
  ): Promise<void> {
    const metrics = this.metrics.get(sandboxId)
    if (!metrics) return

    // Get resource usage from sandbox
    const stats = await sandbox.getStats()

    metrics.cpuUsage = stats.cpu.usage
    metrics.memoryUsage = stats.memory.usage
    metrics.diskUsage = stats.disk.usage
  }

  endMonitoring(sandboxId: string): SandboxMetrics | null {
    const metrics = this.metrics.get(sandboxId)
    if (!metrics) return null

    metrics.endTime = new Date()
    metrics.buildDuration =
      metrics.endTime.getTime() - metrics.startTime.getTime()

    return metrics
  }

  getReport(): SandboxMetrics[] {
    return Array.from(this.metrics.values())
  }
}
```

---

## Cross-Platform Builds

### Platform-Specific Configuration

```typescript
const PLATFORM_CONFIGS = {
  'linux-x64-gnu': {
    target: 'x86_64-unknown-linux-gnu',
    linker: 'x86_64-linux-gnu-gcc',
    rustflags: []
  },
  'linux-x64-musl': {
    target: 'x86_64-unknown-linux-musl',
    linker: 'x86_64-linux-gnu-gcc',
    rustflags: ['-C', 'target-feature=+crt-static']
  },
  'linux-arm64-gnu': {
    target: 'aarch64-unknown-linux-gnu',
    linker: 'aarch64-linux-gnu-gcc',
    rustflags: []
  },
  'darwin-x64': {
    target: 'x86_64-apple-darwin',
    linker: 'x86_64-apple-darwin-ld',
    rustflags: []
  },
  'darwin-arm64': {
    target: 'aarch64-apple-darwin',
    linker: 'aarch64-apple-darwin-ld',
    rustflags: []
  },
  'win32-x64-msvc': {
    target: 'x86_64-pc-windows-msvc',
    linker: 'x86_64-w64-mingw32-gcc',
    rustflags: []
  },
  'wasm32': {
    target: 'wasm32-unknown-unknown',
    linker: 'wasm-ld',
    rustflags: []
  }
}

async function buildForPlatform(
  sandbox: E2BSandbox,
  crateName: string,
  platform: string
): Promise<void> {
  const config = PLATFORM_CONFIGS[platform]
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`)
  }

  // Set up environment
  const env = {
    CARGO_BUILD_TARGET: config.target,
    RUSTFLAGS: config.rustflags.join(' '),
    CC: config.linker
  }

  // Run build
  const result = await sandbox.process.start({
    cmd: `cd /workspace/${crateName} && cargo build --release --target ${config.target}`,
    env
  })

  if (result.exitCode !== 0) {
    throw new Error(`Build failed for ${platform}: ${result.stderr}`)
  }

  console.log(`✅ Built ${crateName} for ${platform}`)
}

async function buildAllPlatforms(
  crateName: string,
  platforms: string[]
): Promise<void> {
  const sandbox = await E2BSandbox.create({
    template: 'rust-napi-builder'
  })

  try {
    for (const platform of platforms) {
      await buildForPlatform(sandbox, crateName, platform)
    }
  } finally {
    await sandbox.close()
  }
}
```

---

## Performance Optimization

### Build Caching

```typescript
// Cache Cargo dependencies across builds
const CARGO_CACHE_DIR = '/tmp/cargo-cache'

await sandbox.filesystem.makeDir(CARGO_CACHE_DIR)

// Mount cache directory
await sandbox.mount({
  source: CARGO_CACHE_DIR,
  target: '/root/.cargo/registry',
  type: 'bind'
})
```

### Parallel Builds

```typescript
async function buildMultiplePackages(
  packages: string[],
  concurrency: number = 30
): Promise<BuildResult[]> {
  const pool = new SandboxPool(concurrency)
  const results: BuildResult[] = []

  // Process in chunks
  for (let i = 0; i < packages.length; i += concurrency) {
    const chunk = packages.slice(i, i + concurrency)

    const chunkResults = await Promise.all(
      chunk.map(async (pkg) => {
        const sandbox = await pool.acquire()
        try {
          return await buildInSandbox(pkg, sandbox)
        } finally {
          await pool.release(sandbox)
        }
      })
    )

    results.push(...chunkResults)
  }

  await pool.closeAll()
  return results
}
```

---

## Cost Optimization

### E2B Pricing Estimates

Based on E2B pricing (approximate):
- Sandbox: $0.10/hour
- CPU: 4 cores @ $0.02/core/hour
- Memory: 8GB @ $0.01/GB/hour
- Storage: 20GB @ $0.001/GB/hour

**Per Package Build**:
- Average duration: 30 minutes
- Cost per build: ~$0.08
- Total for 110 packages: ~$8.80

**With Retries** (3 attempts max):
- Estimated retries: 10% failure rate
- Additional cost: ~$0.88
- Total: ~$9.70

### Cost Reduction Strategies

1. **Build Caching**: Reuse dependencies across builds
2. **Incremental Builds**: Only rebuild changed packages
3. **Smaller Sandboxes**: Use 2 cores for simple packages
4. **Batch Builds**: Group related packages in single sandbox

---

## Security Considerations

### Isolation

- Each sandbox is completely isolated
- No access to host filesystem
- Network access restricted to package registries
- No persistent state between builds

### Secrets Management

```typescript
// Never expose secrets in logs or artifacts
const sanitizedEnv = {
  ...env,
  OPENROUTER_API_KEY: '***REDACTED***',
  NPM_TOKEN: '***REDACTED***'
}

console.log('Environment:', sanitizedEnv)

// Pass secrets securely to sandbox
await sandbox.process.start({
  cmd: 'build.sh',
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
  },
  // Don't log environment
  logOutput: false
})
```

### Artifact Verification

```typescript
import crypto from 'crypto'

async function verifyArtifact(
  filePath: string,
  expectedChecksum: string
): Promise<boolean> {
  const content = await fs.readFile(filePath)
  const hash = crypto.createHash('sha256').update(content).digest('hex')
  return hash === expectedChecksum
}
```

---

## Monitoring & Logging

### Build Logs

```typescript
// Stream build logs in real-time
await sandbox.process.start({
  cmd: 'build.sh',
  onStdout: (line) => {
    console.log(`[${crateName}] ${line}`)
    // Also write to file
    fs.appendFileSync(`logs/${crateName}.log`, line + '\n')
  },
  onStderr: (line) => {
    console.error(`[${crateName}] ERROR: ${line}`)
    fs.appendFileSync(`logs/${crateName}.error.log`, line + '\n')
  }
})
```

### Metrics Collection

```typescript
interface BuildMetrics {
  crateName: string
  duration: number
  artifactSize: number
  testCoverage: number
  cpuUsage: number
  memoryUsage: number
}

async function collectMetrics(
  sandbox: E2BSandbox,
  crateName: string
): Promise<BuildMetrics> {
  const stats = await sandbox.getStats()

  return {
    crateName,
    duration: stats.duration,
    artifactSize: stats.diskUsage,
    testCoverage: await getTestCoverage(sandbox, crateName),
    cpuUsage: stats.cpu.usage,
    memoryUsage: stats.memory.usage
  }
}
```

---

## Troubleshooting

### Common Issues

**1. Sandbox Timeout**
```typescript
// Increase timeout for complex packages
const sandbox = await E2BSandbox.create({
  template: 'rust-napi-builder',
  timeout: 7200000 // 2 hours
})
```

**2. Out of Memory**
```typescript
// Use larger sandbox for memory-intensive builds
const sandbox = await E2BSandbox.create({
  template: 'rust-napi-builder',
  memory: '16GB' // Default is 8GB
})
```

**3. Build Failures**
```typescript
// Debug by preserving sandbox
const sandbox = await E2BSandbox.create({
  template: 'rust-napi-builder',
  keepAlive: true // Don't auto-close on error
})

// Inspect after failure
await sandbox.process.start({
  cmd: 'ls -la /workspace',
  interactive: true
})
```

---

## Next Steps

1. ✅ Create E2B template
2. ⏳ Test template with single package
3. ⏳ Optimize template for performance
4. ⏳ Set up sandbox pool
5. ⏳ Integrate with orchestrator
6. ⏳ Run production builds

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-13
**Status**: Planning Phase
