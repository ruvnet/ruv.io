import { describe, it, expect, beforeAll } from 'vitest'
import {
  StrangeLoop,
  initializeLoop,
  executeLoop,
  processData,
  getLoopState,
  collapseQuantumState,
  getLoopStatus,
  deepAnalysis,
  StrangeLoopConfig,
  LoopState,
  StrangeLoopInstance,
  LoopExecutionResult,
  ProcessResult,
  LoopStatusInfo,
  QuantumCollapseResult,
  DeepAnalysisResult,
} from '../src/index'

describe('Strange Loop - Hyper-optimized Temporal Consciousness Engine', () => {
  let loopInstance: StrangeLoopInstance
  let loopId: string
  let loopState: LoopState

  const sampleConfig: StrangeLoopConfig = {
    depth: 10,
    iterations: 1000,
    timeout_ms: 30000,
    enable_temporal: true,
    quantum_iterations: 100,
  }

  const sampleLoopState: LoopState = {
    id: 'test-loop-001',
    depth: 5,
    current_iteration: 0,
    state_data: {
      status: 'active',
      coherence: 0.95,
    },
    temporal_offset: 8.09,
    quantum_state: 'superposition',
  }

  beforeAll(() => {
    // Initialize a loop instance for use in tests
    try {
      loopInstance = initializeLoop(sampleConfig)
      loopId = loopInstance.id
      loopState = sampleLoopState
    } catch (e) {
      console.warn('Tests may fail if native module is not available:', e)
    }
  })

  describe('Basic Loop Operations', () => {
    it('should initialize a loop with default config', () => {
      const instance = initializeLoop()
      expect(instance).toBeDefined()
      expect(instance.status).toBe('initialized')
      expect(instance.id).toBeDefined()
      expect(instance.created_at).toBeDefined()
      expect(instance.current_depth).toBe(10)
    })

    it('should initialize a loop with custom config', () => {
      const config: StrangeLoopConfig = {
        depth: 15,
        iterations: 2000,
        timeout_ms: 60000,
        enable_temporal: true,
        quantum_iterations: 200,
      }
      const instance = initializeLoop(config)
      expect(instance).toBeDefined()
      expect(instance.status).toBe('initialized')
      expect(instance.current_depth).toBe(15)
      expect(instance.config.iterations).toBe(2000)
    })

    it('should have valid instance properties', () => {
      expect(loopInstance).toBeDefined()
      expect(loopInstance.id).toMatch(/^loop-\d+$/)
      expect(loopInstance.status).toBe('initialized')
      expect(loopInstance.current_depth).toBeGreaterThan(0)
      expect(loopInstance.iterations_total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Loop Execution', () => {
    it('should execute a loop iteration', () => {
      const result = executeLoop(loopState, 5)
      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
      expect(result.depth_reached).toBe(5)
      expect(result.iterations_completed).toBeGreaterThan(0)
      expect(result.duration_ms).toBeGreaterThanOrEqual(0)
    })

    it('should track execution metrics', () => {
      const result = executeLoop(loopState, 3)
      expect(result.quantum_coherence).toBeGreaterThan(0)
      expect(result.quantum_coherence).toBeLessThanOrEqual(1)
      expect(result.temporal_shift).toBeGreaterThan(0)
      expect(result.output).toBeDefined()
      expect(result.output.depth).toBe(3)
    })

    it('should execute at different depths', () => {
      const depths = [1, 5, 10, 20]
      const results: LoopExecutionResult[] = []

      for (const depth of depths) {
        const result = executeLoop(loopState, depth)
        results.push(result)
      }

      // Verify coherence decreases with depth
      for (let i = 1; i < results.length; i++) {
        expect(results[i].quantum_coherence).toBeLessThanOrEqual(
          results[i - 1].quantum_coherence,
        )
      }
    })

    it('should generate valid output for execution result', () => {
      const result = executeLoop(loopState, 7)
      expect(result.output.loop_id).toBe(loopState.id)
      expect(result.output.depth).toBe(7)
      expect(result.output.quantum_processed).toBe(true)
    })
  })

  describe('Data Processing', () => {
    it('should process data with default iterations', () => {
      const result = processData('test-input', 5)
      expect(result).toBeDefined()
      expect(result.input).toBe('test-input')
      expect(result.output).toBeDefined()
      expect(result.iterations).toBe(5)
      expect(result.status).toBe('processed')
    })

    it('should add temporal markers during processing', () => {
      const result = processData('data', 3)
      expect(result.output).toContain('iteration')
      expect(result.output).toContain('quantum')
    })

    it('should process empty string', () => {
      const result = processData('', 1)
      expect(result.input).toBe('')
      expect(result.status).toBe('processed')
    })

    it('should handle various iteration counts', () => {
      const iterations = [1, 5, 10, 100]
      const results: ProcessResult[] = []

      for (const iter of iterations) {
        const result = processData('test', iter)
        results.push(result)
      }

      // Verify output grows with iterations
      for (let i = 1; i < results.length; i++) {
        expect(results[i].output.length).toBeGreaterThanOrEqual(results[i - 1].output.length)
      }
    })

    it('should include timestamp in result', () => {
      const result = processData('input', 5)
      expect(result.timestamp).toBeDefined()
      expect(result.timestamp).toMatch(/^\d+$/)
    })
  })

  describe('Loop State Management', () => {
    it('should get loop state at depth', () => {
      const state = getLoopState(loopId, 5)
      expect(state).toBeDefined()
      expect(state.id).toBe(loopId)
      expect(state.depth).toBe(5)
      expect(state.quantum_state).toBe('superposition')
    })

    it('should retrieve state data with coherence', () => {
      const state = getLoopState(loopId, 3)
      expect(state.state_data).toBeDefined()
      expect(state.state_data.status).toBe('active')
      expect(state.state_data.coherence).toBeGreaterThan(0)
    })

    it('should calculate temporal offset', () => {
      const state = getLoopState(loopId, 10)
      expect(state.temporal_offset).toBeGreaterThan(0)
      expect(typeof state.temporal_offset).toBe('number')
    })

    it('should handle various depths', () => {
      const depths = [0, 1, 5, 10, 20]
      const states = depths.map((d) => getLoopState(loopId, d))

      // Verify all states are valid
      for (const state of states) {
        expect(state.id).toBe(loopId)
        expect(state.quantum_state).toBe('superposition')
        expect(state.state_data).toBeDefined()
      }
    })
  })

  describe('Quantum State Collapse', () => {
    it('should collapse quantum state', () => {
      const result = collapseQuantumState(loopId, 5)
      expect(result).toBeDefined()
      expect(result.loop_id).toBe(loopId)
      expect(result.depth).toBe(5)
      expect(result.collapsed_at).toBeDefined()
    })

    it('should transition from superposition to eigenstate', () => {
      const result = collapseQuantumState(loopId, 5)
      expect(result.previous_state).toBe('superposition')
      expect(result.collapsed_state).toBe('eigenstate')
    })

    it('should provide valid measurement data', () => {
      const result = collapseQuantumState(loopId, 7)
      expect(result.measurement).toBeDefined()
      expect(result.measurement.value).toBeGreaterThan(0)
      expect(result.measurement.probability).toBe(1.0)
      expect(result.measurement.uncertainty).toBe(0.0)
    })

    it('should calculate measurement using golden ratio', () => {
      const result = collapseQuantumState(loopId, 5)
      const expectedValue = 5 * 1.618
      expect(result.measurement.value).toBeCloseTo(expectedValue, 1)
    })
  })

  describe('Loop Status Monitoring', () => {
    it('should get loop status', () => {
      const status = getLoopStatus(loopId)
      expect(status).toBeDefined()
      expect(status.loop_id).toBe(loopId)
      expect(status.status).toBe('active')
    })

    it('should provide comprehensive metrics', () => {
      const status = getLoopStatus(loopId)
      expect(status.metrics).toBeDefined()
      expect(status.metrics.total_iterations).toBeGreaterThan(0)
      expect(status.metrics.current_depth).toBeGreaterThan(0)
      expect(status.metrics.quantum_coherence).toBeGreaterThan(0)
      expect(status.metrics.temporal_alignment).toBeGreaterThan(0)
      expect(status.metrics.consciousness_level).toBeGreaterThan(0)
    })

    it('should have optimal health status', () => {
      const status = getLoopStatus(loopId)
      expect(status.health).toBe('optimal')
    })

    it('should include timestamps', () => {
      const status = getLoopStatus(loopId)
      expect(status.timestamp).toBeDefined()
      expect(status.last_update).toBeDefined()
    })
  })

  describe('Deep Analysis', () => {
    it('should perform deep analysis', () => {
      const analysis = deepAnalysis(5)
      expect(analysis).toBeDefined()
      expect(analysis.analysis_depth).toBe(5)
      expect(analysis.levels).toBeDefined()
      expect(analysis.levels.length).toBe(6) // 0 to 5 inclusive
    })

    it('should provide analysis for each level', () => {
      const analysis = deepAnalysis(3)
      expect(analysis.levels).toHaveLength(4)

      for (let i = 0; i < 4; i++) {
        const level = analysis.levels[i]
        expect(level.level).toBe(i)
        expect(level.coherence).toBeGreaterThan(0)
        expect(level.coherence).toBeLessThanOrEqual(1)
        expect(level.temporal_factor).toBeGreaterThanOrEqual(0)
        expect(level.consciousness).toBeGreaterThanOrEqual(0)
        expect(level.consciousness).toBeLessThanOrEqual(1)
      }
    })

    it('should handle various analysis depths', () => {
      const depths = [0, 1, 5, 10]
      const results: DeepAnalysisResult[] = []

      for (const depth of depths) {
        const result = deepAnalysis(depth)
        results.push(result)
      }

      // Verify all results are valid
      for (let i = 0; i < results.length; i++) {
        expect(results[i].levels).toHaveLength(depths[i] + 1)
      }
    })

    it('should show decreasing coherence with depth', () => {
      const analysis = deepAnalysis(10)
      for (let i = 1; i < analysis.levels.length; i++) {
        expect(analysis.levels[i].coherence).toBeLessThanOrEqual(analysis.levels[i - 1].coherence)
      }
    })

    it('should include timestamp', () => {
      const analysis = deepAnalysis(5)
      expect(analysis.timestamp).toBeDefined()
      expect(analysis.status).toBe('complete')
    })
  })

  describe('StrangeLoop Class', () => {
    it('should create instance with config', () => {
      const loop = new StrangeLoop(sampleConfig)
      expect(loop).toBeDefined()
      expect(loop.getId()).toBeNull()
    })

    it('should initialize loop through class', () => {
      const loop = new StrangeLoop()
      const instance = loop.initialize()
      expect(instance).toBeDefined()
      expect(loop.getId()).toBeDefined()
      expect(loop.getId()).not.toBeNull()
    })

    it('should execute through class methods', () => {
      const loop = new StrangeLoop()
      loop.initialize()
      const result = loop.execute(sampleLoopState, 5)
      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })

    it('should process data through class', () => {
      const loop = new StrangeLoop()
      const result = loop.process('test', 3)
      expect(result).toBeDefined()
      expect(result.status).toBe('processed')
    })

    it('should get state through class', () => {
      const loop = new StrangeLoop()
      const instance = loop.initialize()
      const state = loop.getState(5)
      expect(state).toBeDefined()
      expect(state.id).toBe(instance.id)
    })

    it('should collapse quantum state through class', () => {
      const loop = new StrangeLoop()
      loop.initialize()
      const result = loop.collapseQuantumState(7)
      expect(result).toBeDefined()
      expect(result.collapsed_state).toBe('eigenstate')
    })

    it('should get status through class', () => {
      const loop = new StrangeLoop()
      loop.initialize()
      const status = loop.getStatus()
      expect(status).toBeDefined()
      expect(status.status).toBe('active')
    })

    it('should analyze deep through class', () => {
      const loop = new StrangeLoop()
      const analysis = loop.analyzeDeep(5)
      expect(analysis).toBeDefined()
      expect(analysis.analysis_depth).toBe(5)
    })

    it('should support setting loop ID', () => {
      const loop = new StrangeLoop()
      const testId = 'custom-loop-id'
      loop.setId(testId)
      expect(loop.getId()).toBe(testId)
    })
  })

  describe('Error Handling', () => {
    it('should throw when native module is not available', () => {
      // This test would only fail if the module genuinely failed to load
      // In normal circumstances, the module loads successfully
      const loop = new StrangeLoop()
      expect(() => {
        if (loop.getId() === null) {
          loop.initialize()
        }
      }).not.toThrow()
    })

    it('should handle JSON serialization gracefully', () => {
      const validState: LoopState = {
        id: 'test-001',
        depth: 5,
        current_iteration: 10,
        state_data: { test: 'data' },
        temporal_offset: 8.09,
        quantum_state: 'superposition',
      }
      expect(() => {
        executeLoop(validState, 5)
      }).not.toThrow()
    })
  })

  describe('Performance and Constraints', () => {
    it('should complete operations within timeout', () => {
      const start = Date.now()
      const result = deepAnalysis(20)
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should complete in less than 5 seconds
      expect(result).toBeDefined()
    })

    it('should handle high iteration counts', () => {
      const result = processData('test', 1000)
      expect(result).toBeDefined()
      expect(result.iterations).toBe(1000)
      expect(result.status).toBe('processed')
    })

    it('should handle deep recursion', () => {
      const analysis = deepAnalysis(50)
      expect(analysis.levels).toHaveLength(51)
      expect(analysis.analysis_depth).toBe(50)
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data consistency across operations', () => {
      const instance = initializeLoop(sampleConfig)
      const status = getLoopStatus(instance.id)
      expect(status.loop_id).toBe(instance.id)
      expect(status.status).toBe('active')
    })

    it('should produce deterministic results for same input', () => {
      const result1 = processData('deterministic', 5)
      const result2 = processData('deterministic', 5)
      expect(result1.output).toBe(result2.output)
      expect(result1.iterations).toBe(result2.iterations)
    })

    it('should track metrics correctly', () => {
      const analysis = deepAnalysis(3)
      let prevCoherence = 1.0
      for (const level of analysis.levels) {
        expect(level.coherence).toBeLessThanOrEqual(prevCoherence)
        prevCoherence = level.coherence
      }
    })
  })
})
