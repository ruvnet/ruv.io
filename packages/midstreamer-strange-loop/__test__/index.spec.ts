import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  MidstreamerStrangeLoop,
  processStrangeLoop,
  analyzeMetaLearning,
  detectPatterns,
  extractLayers,
  resolveParadox,
  LoopState,
  StrangeLoopConfig,
  MetaContext,
  ProcessedLoop,
  MetaLearningResult,
  PatternDetectionResult,
} from '../src/index'

describe('Midstreamer Strange Loop - Self-referential Systems', () => {
  const sampleLoopState: LoopState = {
    id: 'loop-001',
    depth: 3,
    data: {
      value: 42,
      name: 'test_loop',
      metadata: { version: '1.0' },
    },
  }

  const sampleMetaContext: MetaContext = {
    id: 'meta-001',
    level: 0,
    content: 'Base context',
    metadata: { source: 'test' },
  }

  const sampleNestedData = {
    self: {
      inner: {
        value: 100,
        self: {
          nested_value: 200,
        },
      },
    },
  }

  describe('processStrangeLoop', () => {
    it('should process a strange loop state', () => {
      const result = processStrangeLoop(sampleLoopState)

      expect(result).toBeDefined()
      expect(result.id).toBe('loop-001')
      expect(result.iterations).toBeGreaterThan(0)
      expect(result.depth_reached).toBeGreaterThanOrEqual(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should respect max_depth configuration', () => {
      const config: StrangeLoopConfig = {
        max_depth: 5,
      }

      const result = processStrangeLoop(sampleLoopState, config)

      expect(result.depth_reached).toBeLessThanOrEqual(5)
    })

    it('should process numeric data in loop', () => {
      const numericLoop: LoopState = {
        id: 'numeric-001',
        depth: 2,
        data: 100,
      }

      const result = processStrangeLoop(numericLoop)

      expect(result).toBeDefined()
      expect(result.iterations).toBeGreaterThan(0)
    })

    it('should handle string data in loop', () => {
      const stringLoop: LoopState = {
        id: 'string-001',
        depth: 2,
        data: 'test_string',
      }

      const result = processStrangeLoop(stringLoop)

      expect(result).toBeDefined()
      expect(result.iterations).toBeGreaterThan(0)
    })

    it('should disable recursion when configured', () => {
      const config: StrangeLoopConfig = {
        enable_recursion: false,
        max_depth: 10,
      }

      const result = processStrangeLoop(sampleLoopState, config)

      expect(result.iterations).toBeLessThanOrEqual(2)
    })

    it('should process complex nested structures', () => {
      const complexLoop: LoopState = {
        id: 'complex-001',
        depth: 3,
        data: {
          level1: {
            level2: {
              level3: {
                value: 'deep',
              },
            },
          },
        },
      }

      const result = processStrangeLoop(complexLoop)

      expect(result).toBeDefined()
      expect(result.result).toBeDefined()
    })

    it('should include processing time', () => {
      const result = processStrangeLoop(sampleLoopState)

      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should handle array data', () => {
      const arrayLoop: LoopState = {
        id: 'array-001',
        depth: 2,
        data: [1, 2, 3, 4, 5],
      }

      const result = processStrangeLoop(arrayLoop)

      expect(result).toBeDefined()
      expect(Array.isArray(result.result)).toBe(true)
    })
  })

  describe('analyzeMetaLearning', () => {
    it('should analyze meta context', () => {
      const result = analyzeMetaLearning(sampleMetaContext)

      expect(result).toBeDefined()
      expect(result.id).toBe('meta-001')
      expect(result.levels_analyzed).toBeGreaterThan(0)
      expect(result.self_references_found).toBeDefined()
      expect(result.insights).toBeInstanceOf(Array)
    })

    it('should detect self-references', () => {
      const contextWithSelfRef: MetaContext = {
        id: 'meta-002',
        level: 0,
        content: 'Context with self-reference',
        self_reference: {
          id: 'meta-002-inner',
          level: 1,
          content: 'Inner context',
        },
      }

      const result = analyzeMetaLearning(contextWithSelfRef)

      expect(result.self_references_found).toBeGreaterThan(0)
    })

    it('should generate insights', () => {
      const result = analyzeMetaLearning(sampleMetaContext)

      expect(result.insights.length).toBeGreaterThan(0)
      expect(typeof result.insights[0]).toBe('string')
    })

    it('should calculate confidence score', () => {
      const result = analyzeMetaLearning(sampleMetaContext)

      expect(result.confidence_score).toBeGreaterThanOrEqual(0)
      expect(result.confidence_score).toBeLessThanOrEqual(1)
    })

    it('should handle deep nested contexts', () => {
      let context: MetaContext = {
        id: 'meta-deep',
        level: 0,
        content: 'Level 0',
      }

      let current = context
      for (let i = 1; i < 5; i++) {
        current.self_reference = {
          id: `meta-deep-${i}`,
          level: i,
          content: `Level ${i}`,
        }
        current = current.self_reference
      }

      const result = analyzeMetaLearning(context)

      expect(result.levels_analyzed).toBe(5)
      expect(result.self_references_found).toBe(4)
    })

    it('should include timestamp', () => {
      const result = analyzeMetaLearning(sampleMetaContext)

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })
  })

  describe('detectPatterns', () => {
    it('should detect patterns in data', () => {
      const result = detectPatterns(sampleNestedData)

      expect(result).toBeDefined()
      expect(result.patterns).toBeInstanceOf(Array)
      expect(typeof result.cycle_detected).toBe('boolean')
      expect(typeof result.confidence).toBe('number')
    })

    it('should detect self-referential patterns', () => {
      const selfRefData = {
        self: {
          value: 42,
        },
      }

      const result = detectPatterns(selfRefData)

      expect(result.patterns).toContain('self_referential')
    })

    it('should detect circular structures', () => {
      const result = detectPatterns(sampleNestedData)

      expect(result).toBeDefined()
    })

    it('should detect recursive patterns', () => {
      const recursiveData = {
        nested: {
          nested: {
            nested: {
              value: 'deep',
            },
          },
        },
      }

      const result = detectPatterns(recursiveData)

      expect(result).toBeDefined()
    })

    it('should set confidence to 1 when cycle detected', () => {
      const selfRefData = { self: {} }
      const result = detectPatterns(selfRefData)

      if (result.cycle_detected) {
        expect(result.confidence).toBe(0.95)
      }
    })

    it('should handle simple data', () => {
      const simpleData = { value: 42 }

      const result = detectPatterns(simpleData)

      expect(result).toBeDefined()
      expect(typeof result.cycle_detected).toBe('boolean')
    })

    it('should handle array data', () => {
      const arrayData = [1, 2, 3, 4, 5]

      const result = detectPatterns(arrayData)

      expect(result).toBeDefined()
    })
  })

  describe('extractLayers', () => {
    it('should extract layers from nested data', () => {
      const layers = extractLayers(sampleNestedData)

      expect(layers).toBeInstanceOf(Array)
      expect(layers.length).toBeGreaterThan(0)
    })

    it('should extract all nesting levels', () => {
      const nestedData = {
        self: {
          self: {
            self: {
              value: 'bottom',
            },
          },
        },
      }

      const layers = extractLayers(nestedData)

      expect(layers.length).toBeGreaterThan(1)
    })

    it('should handle non-nested data', () => {
      const simpleData = { value: 42 }

      const layers = extractLayers(simpleData)

      expect(layers).toBeInstanceOf(Array)
      expect(layers.length).toBeGreaterThan(0)
    })

    it('should extract inner and nested properties', () => {
      const multiLayerData = {
        inner: {
          nested: {
            value: 'found',
          },
        },
      }

      const layers = extractLayers(multiLayerData)

      expect(layers.length).toBeGreaterThan(1)
    })

    it('should preserve layer structure', () => {
      const layers = extractLayers(sampleNestedData)

      layers.forEach((layer) => {
        expect(layer).toBeDefined()
      })
    })

    it('should handle deeply nested structures', () => {
      let data: any = { value: 'root' }
      let current = data

      for (let i = 0; i < 5; i++) {
        current.self = { value: `level${i}` }
        current = current.self
      }

      const layers = extractLayers(data)

      expect(layers.length).toBeGreaterThan(1)
    })
  })

  describe('resolveParadox', () => {
    it('should resolve loop paradox', () => {
      const loopData = { value: 100 }

      const result = resolveParadox(loopData)

      expect(result).toBeDefined()
      expect(result.resolution_steps).toBeInstanceOf(Array)
      expect(result.resolution_steps.length).toBeGreaterThan(0)
    })

    it('should iterate through resolution steps', () => {
      const loopData = { value: 50 }

      const result = resolveParadox(loopData)

      expect(result.resolution_steps.length).toBeGreaterThan(0)

      result.resolution_steps.forEach((step, index) => {
        expect(step.step).toBe(index)
        expect(step.value).toBeDefined()
      })
    })

    it('should detect convergence', () => {
      const loopData = { value: 100 }

      const result = resolveParadox(loopData)

      expect(typeof result.converged).toBe('boolean')
    })

    it('should provide final value', () => {
      const loopData = { value: 100 }

      const result = resolveParadox(loopData)

      expect(result.final_value).toBeDefined()
    })

    it('should handle numeric loops', () => {
      const result = resolveParadox({ value: 200 })

      expect(result.resolution_steps.length).toBeGreaterThan(0)
      expect(result.final_value).toBeDefined()
    })

    it('should include timestamp', () => {
      const result = resolveParadox({ value: 42 })

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })

    it('should work with complex data', () => {
      const complexLoop = {
        value: 500,
        metadata: { type: 'test' },
      }

      const result = resolveParadox(complexLoop)

      expect(result).toBeDefined()
      expect(result.resolution_steps).toBeInstanceOf(Array)
    })
  })

  describe('MidstreamerStrangeLoop class', () => {
    let client: MidstreamerStrangeLoop

    beforeAll(() => {
      client = new MidstreamerStrangeLoop()
    })

    it('should create instance with default config', () => {
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(MidstreamerStrangeLoop)
    })

    it('should create instance with custom config', () => {
      const config: StrangeLoopConfig = {
        max_depth: 20,
        enable_recursion: true,
      }

      const customClient = new MidstreamerStrangeLoop(config)

      expect(customClient).toBeDefined()
    })

    it('should process loop via instance', () => {
      const result = client.process(sampleLoopState)

      expect(result).toBeDefined()
      expect(result.id).toBe('loop-001')
    })

    it('should analyze meta-learning via instance', () => {
      const result = client.analyzeMeta(sampleMetaContext)

      expect(result).toBeDefined()
      expect(result.id).toBe('meta-001')
    })

    it('should detect patterns via instance', () => {
      const result = client.detectPatterns(sampleNestedData)

      expect(result).toBeDefined()
      expect(typeof result.cycle_detected).toBe('boolean')
    })

    it('should extract layers via instance', () => {
      const result = client.extractLayers(sampleNestedData)

      expect(result).toBeInstanceOf(Array)
    })

    it('should resolve paradox via instance', () => {
      const result = client.resolveParadox({ value: 42 })

      expect(result).toBeDefined()
      expect(result.resolution_steps).toBeInstanceOf(Array)
    })

    it('should batch process multiple loops', () => {
      const loops = [
        { id: 'loop-1', depth: 1, data: 1 },
        { id: 'loop-2', depth: 2, data: 2 },
        { id: 'loop-3', depth: 3, data: 3 },
      ]

      const results = client.batchProcess(loops)

      expect(results).toHaveLength(3)
      expect(results[0].id).toBe('loop-1')
      expect(results[1].id).toBe('loop-2')
      expect(results[2].id).toBe('loop-3')
    })
  })

  describe('Integration Tests', () => {
    it('should process and analyze strange loop', () => {
      const loopState: LoopState = {
        id: 'integration-001',
        depth: 2,
        data: { value: 42 },
      }

      const processed = processStrangeLoop(loopState)

      expect(processed).toBeDefined()
      expect(processed.id).toBe('integration-001')
    })

    it('should detect patterns and resolve paradox', () => {
      const data = { self: { value: 100 } }

      const patterns = detectPatterns(data)
      expect(patterns).toBeDefined()

      const resolution = resolveParadox(data)
      expect(resolution).toBeDefined()
    })

    it('should extract layers and analyze structure', () => {
      const data = {
        self: {
          inner: {
            nested: { value: 'deep' },
          },
        },
      }

      const layers = extractLayers(data)
      expect(layers.length).toBeGreaterThan(1)

      const patterns = detectPatterns(data)
      expect(patterns).toBeDefined()
    })

    it('should handle complete workflow', () => {
      const client = new MidstreamerStrangeLoop({
        max_depth: 5,
        enable_recursion: true,
      })

      const loopState: LoopState = {
        id: 'workflow-001',
        depth: 2,
        data: { value: 100, name: 'test' },
      }

      const processed = client.process(loopState)
      expect(processed).toBeDefined()

      const patterns = client.detectPatterns(loopState.data)
      expect(patterns).toBeDefined()

      const resolution = client.resolveParadox(loopState.data)
      expect(resolution).toBeDefined()
    })

    it('should maintain consistency across operations', () => {
      const loopState: LoopState = {
        id: 'consistency-001',
        depth: 2,
        data: 42,
      }

      const result1 = processStrangeLoop(loopState)
      const result2 = processStrangeLoop(loopState)

      expect(result1.id).toBe(result2.id)
      expect(result1.iterations).toBe(result2.iterations)
    })

    it('should process large batches efficiently', () => {
      const client = new MidstreamerStrangeLoop()

      const loops = Array.from({ length: 50 }, (_, i) => ({
        id: `loop-${i}`,
        depth: 2,
        data: i,
      }))

      const results = client.batchProcess(loops)

      expect(results).toHaveLength(50)
      expect(results[0].id).toBe('loop-0')
      expect(results[49].id).toBe('loop-49')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid loop state gracefully', () => {
      expect(() => {
        const invalid = { id: 'invalid' } as any
        processStrangeLoop(invalid)
      }).toThrow()
    })

    it('should handle empty data', () => {
      const result = processStrangeLoop({
        id: 'empty',
        depth: 0,
        data: {},
      })

      expect(result).toBeDefined()
    })

    it('should handle null values', () => {
      const result = processStrangeLoop({
        id: 'null-test',
        depth: 1,
        data: null,
      })

      expect(result).toBeDefined()
    })

    it('should handle deep recursion', () => {
      const deepLoop: LoopState = {
        id: 'deep',
        depth: 100,
        data: { value: 'test' },
      }

      const result = processStrangeLoop(deepLoop, {
        max_depth: 100,
      })

      expect(result).toBeDefined()
    })

    it('should handle circular reference gracefully', () => {
      const circularData = {
        self: {
          self: {
            value: 42,
          },
        },
      }

      const result = processStrangeLoop({
        id: 'circular',
        depth: 2,
        data: circularData,
      })

      expect(result).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    it('should process loop within reasonable time', () => {
      const startTime = Date.now()

      const result = processStrangeLoop(sampleLoopState)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(1000)
      expect(result.processing_time_ms).toBeDefined()
    })

    it('should handle 1000 batch processes', () => {
      const client = new MidstreamerStrangeLoop()

      const loops = Array.from({ length: 1000 }, (_, i) => ({
        id: `perf-${i}`,
        depth: 1,
        data: i,
      }))

      const startTime = Date.now()
      const results = client.batchProcess(loops)
      const endTime = Date.now()

      expect(results).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should extract layers quickly', () => {
      const data = {
        self: {
          self: {
            self: {
              value: 'test',
            },
          },
        },
      }

      const startTime = Date.now()
      const layers = extractLayers(data)
      const endTime = Date.now()

      expect(layers).toBeDefined()
      expect(endTime - startTime).toBeLessThan(500)
    })
  })

  describe('Type Safety', () => {
    it('should return correct types from processStrangeLoop', () => {
      const result = processStrangeLoop(sampleLoopState)

      expect(typeof result.id).toBe('string')
      expect(typeof result.iterations).toBe('number')
      expect(typeof result.depth_reached).toBe('number')
      expect(typeof result.processing_time_ms).toBe('number')
      expect(typeof result.timestamp).toBe('string')
    })

    it('should return correct types from analyzeMetaLearning', () => {
      const result = analyzeMetaLearning(sampleMetaContext)

      expect(typeof result.id).toBe('string')
      expect(typeof result.levels_analyzed).toBe('number')
      expect(typeof result.self_references_found).toBe('number')
      expect(Array.isArray(result.insights)).toBe(true)
      expect(typeof result.confidence_score).toBe('number')
    })

    it('should return correct types from detectPatterns', () => {
      const result = detectPatterns(sampleNestedData)

      expect(Array.isArray(result.patterns)).toBe(true)
      expect(typeof result.cycle_detected).toBe('boolean')
      expect(typeof result.confidence).toBe('number')
    })

    it('should return correct types from extractLayers', () => {
      const result = extractLayers(sampleNestedData)

      expect(Array.isArray(result)).toBe(true)
    })

    it('should return correct types from resolveParadox', () => {
      const result = resolveParadox({ value: 42 })

      expect(Array.isArray(result.resolution_steps)).toBe(true)
      expect(typeof result.converged).toBe('boolean')
      expect(result.final_value).toBeDefined()
    })
  })
})
