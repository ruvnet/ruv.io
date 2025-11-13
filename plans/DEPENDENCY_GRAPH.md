# Dependency Graph & Build Order Plan

## Overview

This document provides a comprehensive dependency analysis and optimal build order for all 110 @ruv.io packages. The build order is determined through topological sorting to ensure dependencies are built before dependent packages.

---

## Build Strategy

### Batch-Based Parallel Builds

The 110 packages are organized into **4 major batches** based on dependency depth:

```
Batch 1 (Tier 0): 35 packages - No dependencies, build in parallel
Batch 2 (Tier 1): 28 packages - Single-level dependencies
Batch 3 (Tier 2): 32 packages - Multi-level dependencies
Batch 4 (Tier 3): 15 packages - Deep dependencies (CLI tools, integrations)
```

**Total Estimated Build Time**:
- Sequential: ~220 hours
- Parallel (30 concurrent): ~5-6 hours
- Optimized with caching: ~3-4 hours

---

## Batch 1: Foundation Packages (35 packages)

### Build Priority: HIGHEST
### Parallelization: Full (30+ concurrent builds)
### Dependencies: None

These packages have no internal dependencies and form the foundation for all other packages.

#### Core Libraries (15 packages)

1. **ruv-fann** (2,966 downloads)
   - Neural network foundation
   - Used by: neuro-divergent-*, micro_*, ruv-swarm-ml

2. **aimds-core** (157 downloads)
   - AIMDS foundation
   - Used by: aimds-detection, aimds-analysis, aimds-response

3. **daa-prime-core** (1,051 downloads)
   - DAA Prime foundation
   - Used by: daa-prime-*, daa-ai

4. **micro_core** (889 downloads)
   - Micro-neural foundation
   - Used by: micro_cartan_attn, micro_metrics, micro_routing, micro_swarm

5. **nt-core** (11 downloads)
   - Neural Trader foundation
   - Used by: All nt-* packages

6. **ruv-swarm-core** (2,319 downloads)
   - Swarm orchestration foundation
   - Used by: All ruv-swarm-* packages

7. **qudag-protocol** (3,059 downloads)
   - QuDAG protocol foundation
   - Used by: qudag, qudag-mcp, qudag-network, etc.

8. **qudag-crypto** (4,403 downloads)
   - Quantum-resistant cryptography
   - Used by: qudag-*, bitchat-qudag

9. **code-mesh-core** (723 downloads)
   - Distributed swarm core
   - Used by: code-mesh-cli, code-mesh-tui, code-mesh-wasm

10. **opencv-core** (947 downloads)
    - Computer vision foundation
    - Used by: opencv-sdk, opencv-wasm

11. **geometric-langlands** (1,442 downloads)
    - Mathematical framework
    - Used by: geometric-langlands-cli

12. **temporal-compare** (996 downloads)
    - Temporal benchmarking
    - Independent package

13. **fact-tools** (445 downloads)
    - Context processing
    - Used by: fact-wasm-core

14. **sublinear** (845 downloads)
    - Sublinear solvers
    - Used by: temporal-lead-solver

15. **lean-agentic** (183 downloads)
    - Dependent types foundation
    - Used by: leanr-rag-gateway, leanr-wasm

#### AI/ML Systems (4 packages)

16. **goalie** (770 downloads)
    - AI research assistant (independent)

17. **veritas-nexus** (505 downloads)
    - Lie detection system (independent)

18. **neurodna** (780 downloads)
    - Evolutionary neural networks (independent)

19. **kimi-fann-core** (1,151 downloads)
    - Kimi neural architecture
    - Used by: kimi-expert-analyzer

#### Temporal Systems (8 packages)

20. **nanosecond-scheduler** (668 downloads)
    - Ultra-low latency scheduler
    - Used by: nano-consciousness

21. **temporal-neural-solver** (660 downloads)
    - Fast neural inference (independent)

22. **temporal-attractor-studio** (284 downloads)
    - Temporal dynamics (independent)

23. **strange-loop** (1,370 downloads)
    - Strange loop systems (independent)

24. **subjective-time-expansion** (788 downloads)
    - Time dilation framework (independent)

25. **midstreamer-attractor** (149 downloads)
    - Dynamical systems (independent)

26. **midstreamer-neural-solver** (147 downloads)
    - Neural temporal logic (independent)

27. **midstreamer-quic** (114 downloads)
    - QUIC multi-stream (independent)

28. **midstreamer-scheduler** (166 downloads)
    - Real-time scheduler (independent)

29. **midstreamer-strange-loop** (138 downloads)
    - Self-referential systems (independent)

30. **midstreamer-temporal-compare** (168 downloads)
    - Temporal pattern matching (independent)

#### Development Tools (5 packages)

31. **agentic-jujutsu** (42 downloads)
    - Jujutsu VCS wrapper (independent)

32. **agentic-payments** (285 downloads)
    - Ed25519 signature verification (independent)

33. **cuda-rust-wasm** (2,031 downloads)
    - CUDA to Rust transpiler (independent)

34. **claude-parser** (873 downloads)
    - JSON parser (independent)

35. **bit-parallel-search** (286 downloads)
    - String search algorithms (independent)

#### Blockchain/Finance (3 packages)

36. **claude_market** (540 downloads)
    - P2P Claude API marketplace (independent)

37. **intrinsic-dim** (226 downloads)
    - Dimensionality estimation (independent)

38. **governance** (0 downloads)
    - Governance system (independent)

#### Quantum Computing (1 package)

39. **qvm-scheduler** (417 downloads)
    - Quantum circuit scheduler (independent)

#### Other (1 package)

40. **swe-bench-adapter** (470 downloads)
    - SWE-Bench integration (independent)

---

## Batch 2: First-Level Dependencies (28 packages)

### Build Priority: HIGH
### Parallelization: Full (30 concurrent builds)
### Dependencies: Only Batch 1 packages

These packages depend on one or more Batch 1 packages.

#### AIMDS Suite (3 packages)

41. **aimds-detection** (138 downloads)
    - Dependencies: aimds-core

42. **aimds-response** (123 downloads)
    - Dependencies: aimds-core

43. **aimds-analysis** (138 downloads)
    - Dependencies: aimds-core, aimds-detection

#### DAA Suite (5 packages)

44. **daa-chain** (971 downloads)
    - Dependencies: None (independent, placed here for grouping)

45. **daa-economy** (1,399 downloads)
    - Dependencies: None (independent)

46. **daa-rules** (1,664 downloads)
    - Dependencies: None (independent)

47. **daa-prime-dht** (999 downloads)
    - Dependencies: None (independent)

48. **daa-prime-trainer** (923 downloads)
    - Dependencies: daa-prime-core

#### Neural Networks (9 packages)

49. **neuro-divergent-core** (741 downloads)
    - Dependencies: ruv-fann

50. **micro_cartan_attn** (722 downloads)
    - Dependencies: micro_core

51. **micro_metrics** (794 downloads)
    - Dependencies: micro_core

52. **micro_routing** (792 downloads)
    - Dependencies: micro_core

53. **micro_swarm** (734 downloads)
    - Dependencies: micro_core

54. **kimi-expert-analyzer** (430 downloads)
    - Dependencies: kimi-fann-core

55. **nano-consciousness** (302 downloads)
    - Dependencies: nanosecond-scheduler

56. **temporal-lead-solver** (313 downloads)
    - Dependencies: sublinear

57. **fact-wasm-core** (406 downloads)
    - Dependencies: fact-tools

#### QuDAG Suite (5 packages)

58. **qudag-dag** (3,426 downloads)
    - Dependencies: qudag-crypto

59. **qudag-network** (3,631 downloads)
    - Dependencies: qudag-crypto

60. **qudag-vault-core** (3,019 downloads)
    - Dependencies: qudag-crypto

61. **qudag-exchange-core** (1,950 downloads)
    - Dependencies: qudag-crypto

62. **qudag** (3,921 downloads)
    - Dependencies: qudag-protocol, qudag-crypto, qudag-dag, qudag-network

#### Synaptic Suite (3 packages)

63. **synaptic-neural-mesh** (607 downloads)
    - Dependencies: None (independent)

64. **synaptic-qudag-core** (641 downloads)
    - Dependencies: qudag-protocol

65. **synaptic-neural-wasm** (534 downloads)
    - Dependencies: synaptic-neural-mesh

#### Type Systems (2 packages)

66. **leanr-rag-gateway** (159 downloads)
    - Dependencies: lean-agentic

67. **leanr-wasm** (159 downloads)
    - Dependencies: lean-agentic

#### Other (1 package)

68. **geometric-langlands-cli** (429 downloads)
    - Dependencies: geometric-langlands

---

## Batch 3: Multi-Level Dependencies (32 packages)

### Build Priority: MEDIUM
### Parallelization: Moderate (20-25 concurrent)
### Dependencies: Batch 1 & 2 packages

These packages have deeper dependency chains.

#### Neural Trader Suite (11 packages)

69. **nt-agentdb-client** (0 downloads)
    - Dependencies: nt-core

70. **nt-market-data** (7 downloads)
    - Dependencies: nt-core

71. **nt-features** (8 downloads)
    - Dependencies: nt-core, nt-market-data

72. **nt-memory** (0 downloads)
    - Dependencies: nt-core

73. **nt-neural** (0 downloads)
    - Dependencies: nt-core

74. **nt-backtesting** (8 downloads)
    - Dependencies: nt-core, nt-features

75. **nt-execution** (9 downloads)
    - Dependencies: nt-core, nt-market-data

76. **nt-portfolio** (7 downloads)
    - Dependencies: nt-core

77. **nt-streaming** (0 downloads)
    - Dependencies: nt-core

78. **nt-utils** (7 downloads)
    - Dependencies: nt-core

79. **nt-napi-bindings** (0 downloads)
    - Dependencies: All nt-* packages

#### Neuro-Divergent Suite (4 packages)

80. **neuro-divergent-models** (676 downloads)
    - Dependencies: neuro-divergent-core, ruv-fann

81. **neuro-divergent-registry** (703 downloads)
    - Dependencies: neuro-divergent-core

82. **neuro-divergent-training** (469 downloads)
    - Dependencies: neuro-divergent-core

83. **neuro-divergent** (492 downloads)
    - Dependencies: All neuro-divergent-* packages

#### RUV Swarm Suite (9 packages)

84. **ruv-swarm-agents** (1,540 downloads)
    - Dependencies: ruv-swarm-core

85. **ruv-swarm-ml** (1,311 downloads)
    - Dependencies: ruv-swarm-core, ruv-fann

86. **ruv-swarm-ml-training** (860 downloads)
    - Dependencies: ruv-swarm-ml

87. **ruv-swarm-persistence** (1,313 downloads)
    - Dependencies: ruv-swarm-core

88. **ruv-swarm-transport** (1,248 downloads)
    - Dependencies: ruv-swarm-core

89. **ruv-swarm-wasm** (1,217 downloads)
    - Dependencies: ruv-swarm-core

90. **ruv-swarm-mcp** (886 downloads)
    - Dependencies: ruv-swarm-core

91. **ruv-swarm-daa** (481 downloads)
    - Dependencies: ruv-swarm-core, daa-ai

92. **daa-ai** (1,650 downloads)
    - Dependencies: daa-prime-core

#### DAA Suite Continued (3 packages)

93. **daa-orchestrator** (933 downloads)
    - Dependencies: daa-ai, daa-chain, daa-economy, daa-rules

94. **daa-prime-coordinator** (863 downloads)
    - Dependencies: daa-prime-core, daa-ai

95. **daa-prime-cli** (886 downloads)
    - Dependencies: daa-prime-coordinator

#### Code Mesh Suite (3 packages)

96. **code-mesh-cli** (475 downloads)
    - Dependencies: code-mesh-core

97. **code-mesh-tui** (469 downloads)
    - Dependencies: code-mesh-core

98. **code-mesh-wasm** (442 downloads)
    - Dependencies: code-mesh-core

#### OpenCV Suite (2 packages)

99. **opencv-sdk** (796 downloads)
    - Dependencies: opencv-core

100. **opencv-wasm** (873 downloads)
     - Dependencies: opencv-core

---

## Batch 4: Deep Dependencies (15 packages)

### Build Priority: LOW
### Parallelization: Limited (10-15 concurrent)
### Dependencies: Batch 1, 2, & 3 packages

Final integration packages, CLI tools, and meta-packages.

#### CLI Tools (4 packages)

101. **daa-cli** (884 downloads)
     - Dependencies: daa-orchestrator

102. **ruv-swarm-cli** (930 downloads)
     - Dependencies: ruv-swarm-core, ruv-swarm-agents

103. **qudag-cli** (4,045 downloads)
     - Dependencies: qudag

104. **synaptic-mesh-cli** (829 downloads)
     - Dependencies: synaptic-neural-mesh

#### QuDAG Extended (6 packages)

105. **qudag-exchange** (558 downloads)
     - Dependencies: qudag-exchange-core, qudag

106. **qudag-exchange-standalone-cli** (1,218 downloads)
     - Dependencies: qudag-exchange

107. **qudag-mcp** (2,314 downloads)
     - Dependencies: qudag-protocol, qudag

108. **qudag-wasm** (507 downloads)
     - Dependencies: qudag

109. **bitchat-qudag** (459 downloads)
     - Dependencies: qudag

#### Synaptic (1 package)

110. **synaptic-daa-swarm** (539 downloads)
     - Dependencies: synaptic-neural-mesh, daa-ai

---

## Dependency Matrix

### Core Dependencies (used by 5+ packages)

| Package | Used By Count | Dependents |
|---------|---------------|------------|
| **ruv-fann** | 12 | neuro-divergent-*, micro_*, ruv-swarm-ml |
| **ruv-swarm-core** | 9 | All ruv-swarm-* packages |
| **nt-core** | 12 | All nt-* packages |
| **qudag-protocol** | 8 | qudag-*, synaptic-qudag-core |
| **qudag-crypto** | 10 | All qudag-* packages |
| **aimds-core** | 3 | aimds-detection, aimds-analysis, aimds-response |
| **micro_core** | 4 | micro_cartan_attn, micro_metrics, micro_routing, micro_swarm |

### Critical Path Analysis

**Longest Dependency Chain** (5 levels):
```
nt-core
  → nt-features (depends on nt-core, nt-market-data)
    → nt-backtesting (depends on nt-features)
      → nt-napi-bindings (depends on all nt-*)
```

**Most Complex Package** (highest dependency count):
- **nt-napi-bindings**: Depends on 11 other nt-* packages
- **ruv-swarm-daa**: Depends on ruv-swarm-core + daa-ai
- **daa-orchestrator**: Depends on 4 daa-* packages

---

## Build Order Visualization

```
Batch 1 (35 packages)              Estimated: 1.5-2 hours
┌────────────────────────────────────────────────────────┐
│ ruv-fann, aimds-core, daa-prime-core, micro_core,     │
│ nt-core, ruv-swarm-core, qudag-protocol, qudag-crypto,│
│ code-mesh-core, opencv-core, geometric-langlands,     │
│ temporal-compare, fact-tools, sublinear, lean-agentic,│
│ goalie, veritas-nexus, neurodna, kimi-fann-core,      │
│ nanosecond-scheduler, temporal-neural-solver,         │
│ temporal-attractor-studio, strange-loop,              │
│ subjective-time-expansion, midstreamer-*,             │
│ agentic-jujutsu, agentic-payments, cuda-rust-wasm,   │
│ claude-parser, bit-parallel-search, claude_market,    │
│ intrinsic-dim, governance, qvm-scheduler,             │
│ swe-bench-adapter                                      │
└────────────────────────────────────────────────────────┘
                    ↓
Batch 2 (28 packages)              Estimated: 1-1.5 hours
┌────────────────────────────────────────────────────────┐
│ aimds-detection, aimds-response, aimds-analysis,      │
│ daa-chain, daa-economy, daa-rules, daa-prime-dht,     │
│ daa-prime-trainer, neuro-divergent-core,              │
│ micro_cartan_attn, micro_metrics, micro_routing,      │
│ micro_swarm, kimi-expert-analyzer, nano-consciousness,│
│ temporal-lead-solver, fact-wasm-core, qudag-dag,      │
│ qudag-network, qudag-vault-core, qudag-exchange-core, │
│ qudag, synaptic-neural-mesh, synaptic-qudag-core,     │
│ synaptic-neural-wasm, leanr-rag-gateway, leanr-wasm,  │
│ geometric-langlands-cli                                │
└────────────────────────────────────────────────────────┘
                    ↓
Batch 3 (32 packages)              Estimated: 1.5-2 hours
┌────────────────────────────────────────────────────────┐
│ nt-agentdb-client, nt-market-data, nt-features,       │
│ nt-memory, nt-neural, nt-backtesting, nt-execution,   │
│ nt-portfolio, nt-streaming, nt-utils, nt-napi-bindings│
│ neuro-divergent-models, neuro-divergent-registry,     │
│ neuro-divergent-training, neuro-divergent,            │
│ ruv-swarm-agents, ruv-swarm-ml,                       │
│ ruv-swarm-ml-training, ruv-swarm-persistence,         │
│ ruv-swarm-transport, ruv-swarm-wasm, ruv-swarm-mcp,   │
│ ruv-swarm-daa, daa-ai, daa-orchestrator,              │
│ daa-prime-coordinator, daa-prime-cli, code-mesh-cli,  │
│ code-mesh-tui, code-mesh-wasm, opencv-sdk,            │
│ opencv-wasm                                            │
└────────────────────────────────────────────────────────┘
                    ↓
Batch 4 (15 packages)              Estimated: 0.5-1 hour
┌────────────────────────────────────────────────────────┐
│ daa-cli, ruv-swarm-cli, qudag-cli, synaptic-mesh-cli, │
│ qudag-exchange, qudag-exchange-standalone-cli,        │
│ qudag-mcp, qudag-wasm, bitchat-qudag,                 │
│ synaptic-daa-swarm                                     │
└────────────────────────────────────────────────────────┘

TOTAL ESTIMATED TIME: 5-6 hours (parallel with 30 concurrent builds)
```

---

## Implementation Strategy

### Phase 1: Verify Build Order

```bash
# Generate dependency graph
pnpm run analyze:dependencies

# Visualize graph
pnpm run visualize:graph

# Validate topological sort
pnpm run validate:build-order
```

### Phase 2: Test with Subset

```bash
# Test Batch 1 (5 packages)
pnpm run test:batch --packages="ruv-fann,aimds-core,nt-core,micro_core,qudag-crypto" --concurrent=5

# Verify dependencies work
pnpm run test:batch --packages="aimds-detection" --verify-deps
```

### Phase 3: Full Build

```bash
# Build all packages in optimal order
pnpm run build:all --concurrent=30 --batched

# Monitor progress
pnpm run monitor:builds
```

---

## Monitoring & Alerts

### Build Status Dashboard

```typescript
interface BuildStatus {
  batch: number
  packageName: string
  status: 'pending' | 'building' | 'success' | 'failed'
  startTime?: Date
  endTime?: Date
  duration?: number
  dependencies: string[]
  blockedBy: string[]
}

// Track all builds
const buildStatuses = new Map<string, BuildStatus>()

// Check if package can build
function canBuild(packageName: string): boolean {
  const status = buildStatuses.get(packageName)
  if (!status) return false

  // Check all dependencies are successful
  return status.dependencies.every(dep => {
    const depStatus = buildStatuses.get(dep)
    return depStatus?.status === 'success'
  })
}

// Find blocked packages
function findBlockedPackages(): string[] {
  return Array.from(buildStatuses.values())
    .filter(status => {
      return status.blockedBy.some(blocker => {
        const blockerStatus = buildStatuses.get(blocker)
        return blockerStatus?.status === 'failed'
      })
    })
    .map(status => status.packageName)
}
```

---

## Optimization Opportunities

### Parallel Build Groups

Within each batch, packages with no inter-dependencies can build in parallel:

**Batch 1 Sub-Groups:**
- Group A (Core Libs): ruv-fann, aimds-core, daa-prime-core, micro_core, nt-core, ruv-swarm-core
- Group B (Crypto): qudag-protocol, qudag-crypto
- Group C (AI Tools): goalie, veritas-nexus, neurodna
- Group D (Temporal): All midstreamer-*, nanosecond-scheduler, etc.

All groups can build concurrently (30+ sandboxes).

### Build Caching

```typescript
// Cache compiled artifacts
const cacheKey = `${packageName}-${version}-${platform}-${rustVersion}`

// Check cache before building
const cached = await cache.get(cacheKey)
if (cached) {
  console.log(`Using cached build for ${packageName}`)
  return cached
}

// Build and cache
const result = await build(packageName)
await cache.set(cacheKey, result, { ttl: 86400 * 7 }) // 7 days
```

### Incremental Builds

```typescript
// Only rebuild if source changed
const lastBuildHash = await getLastBuildHash(packageName)
const currentHash = await calculateSourceHash(packageName)

if (lastBuildHash === currentHash) {
  console.log(`Skipping ${packageName} (no changes)`)
  return
}
```

---

## Risk Mitigation

### Handling Build Failures

1. **Isolated Failures**: Continue building independent packages
2. **Blocked Packages**: Mark as "waiting" and retry after fixing blocker
3. **Critical Failures**: If core package fails, pause batch and fix immediately

### Retry Strategy

```typescript
async function buildWithDependencyRetry(
  packageName: string,
  maxRetries: number = 3
): Promise<BuildResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check dependencies are available
      const depsAvailable = await verifyDependencies(packageName)
      if (!depsAvailable && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 60000)) // Wait 1 minute
        continue
      }

      return await build(packageName)
    } catch (error) {
      if (attempt === maxRetries) throw error
    }
  }
}
```

---

## Success Metrics

### Build Quality Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Success Rate | 95% | TBD |
| Avg Build Time | <30min | TBD |
| Total Build Time | <6hrs | TBD |
| Failed Builds | <5% | TBD |
| Retry Success | 80% | TBD |

### Dependency Metrics

| Metric | Value |
|--------|-------|
| Max Dependency Depth | 4 levels |
| Avg Dependencies per Package | 1.8 |
| Circular Dependencies | 0 |
| Orphaned Packages | 0 |

---

## Next Steps

1. ✅ Generate dependency graph
2. ⏳ Validate build order
3. ⏳ Test with subset (5-10 packages)
4. ⏳ Run full build (110 packages)
5. ⏳ Optimize based on results
6. ⏳ Document lessons learned

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-13
**Status**: Planning Phase
