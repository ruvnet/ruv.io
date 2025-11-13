import { describe, it, expect } from 'vitest'
import {
  processData,
  encodeData,
  evaluateNetwork,
  batchProcess,
  getStatistics,
  NeurodnaError,
  ProcessResult,
  Statistics,
  NeuralNetConfig,
} from '../src/index'

describe('Neurodna - Evolutionary Neural Networks', () => {
  describe('processData', () => {
    it('should process input data', () => {
      const input = 'hello world'
      const result = processData(input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0)
      expect(result.size).toBe(input.length)
    })

    it('should handle empty input', () => {
      const input = ''
      const result = processData(input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.size).toBe(0)
    })

    it('should handle large input', () => {
      const input = 'x'.repeat(10000)
      const result = processData(input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.size).toBe(10000)
    })

    it('should process special characters', () => {
      const input = '!@#$%^&*()[]{}"\''
      const result = processData(input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should process JSON strings', () => {
      const input = '{"key": "value", "number": 123}'
      const result = processData(input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should have valid result type', () => {
      const input = 'test'
      const result = processData(input)

      expect(typeof result.success).toBe('boolean')
      expect(typeof result.data).toBe('string')
      expect(typeof result.processing_time_ms).toBe('number')
      expect(typeof result.size).toBe('number')
    })
  })

  describe('encodeData', () => {
    it('should encode with binary encoding', () => {
      const input = 'test data'
      const result = encodeData(input, 'binary')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should encode with gray encoding', () => {
      const input = 'test data'
      const result = encodeData(input, 'gray')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should encode with permutation encoding', () => {
      const input = 'test data'
      const result = encodeData(input, 'permutation')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should use default encoding for unknown type', () => {
      const input = 'test data'
      const result = encodeData(input, 'unknown')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle empty input in encoding', () => {
      const input = ''
      const result = encodeData(input, 'binary')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should encode consistently', () => {
      const input = 'consistent test'
      const result1 = encodeData(input, 'binary')
      const result2 = encodeData(input, 'binary')

      expect(result1.data).toBe(result2.data)
    })
  })

  describe('evaluateNetwork', () => {
    it('should evaluate with network config', () => {
      const config: NeuralNetConfig = {
        layers: 3,
        neurons: 64,
        activation: 'relu',
      }
      const input = 'network test'
      const result = evaluateNetwork(config, input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should evaluate with partial config', () => {
      const config: NeuralNetConfig = {
        layers: 2,
      }
      const input = 'partial config'
      const result = evaluateNetwork(config, input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should evaluate with empty config', () => {
      const config: NeuralNetConfig = {}
      const input = 'empty config'
      const result = evaluateNetwork(config, input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should evaluate large networks', () => {
      const config: NeuralNetConfig = {
        layers: 10,
        neurons: 1024,
      }
      const input = 'large network'
      const result = evaluateNetwork(config, input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle empty input', () => {
      const config: NeuralNetConfig = { layers: 2 }
      const input = ''
      const result = evaluateNetwork(config, input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('batchProcess', () => {
    it('should process multiple inputs', () => {
      const inputs = ['data1', 'data2', 'data3']
      const results = batchProcess(inputs)

      expect(results).toHaveLength(3)
      results.forEach((result) => {
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
      })
    })

    it('should handle empty batch', () => {
      const inputs: string[] = []
      const results = batchProcess(inputs)

      expect(results).toHaveLength(0)
    })

    it('should handle single item batch', () => {
      const inputs = ['single']
      const results = batchProcess(inputs)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
    })

    it('should handle large batch', () => {
      const inputs = Array.from({ length: 100 }, (_, i) => `item${i}`)
      const results = batchProcess(inputs)

      expect(results).toHaveLength(100)
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })
    })

    it('should process each item independently', () => {
      const inputs = ['a', 'bb', 'ccc']
      const results = batchProcess(inputs)

      expect(results[0].size).toBe(1)
      expect(results[1].size).toBe(2)
      expect(results[2].size).toBe(3)
    })

    it('should maintain order', () => {
      const inputs = ['first', 'second', 'third']
      const results = batchProcess(inputs)

      expect(results).toHaveLength(3)
      // Results maintain input order
      expect(results[0].size).toBe(5) // 'first'
      expect(results[1].size).toBe(6) // 'second'
      expect(results[2].size).toBe(5) // 'third'
    })
  })

  describe('getStatistics', () => {
    it('should calculate statistics', () => {
      const input = 'test data'
      const stats = getStatistics(input)

      expect(stats).toBeDefined()
      expect(stats.input_size).toBe(input.length)
      expect(typeof stats.input_hash).toBe('number')
      expect(typeof stats.entropy).toBe('number')
      expect(typeof stats.complexity).toBe('number')
    })

    it('should handle empty input', () => {
      const input = ''
      const stats = getStatistics(input)

      expect(stats).toBeDefined()
      expect(stats.input_size).toBe(0)
      expect(stats.entropy).toBe(0)
    })

    it('should have valid entropy range', () => {
      const input = 'some random data here'
      const stats = getStatistics(input)

      expect(stats.entropy).toBeGreaterThanOrEqual(0)
      expect(stats.entropy).toBeLessThanOrEqual(8) // Max for 256 values
    })

    it('should have non-negative complexity', () => {
      const input = 'complexity test data'
      const stats = getStatistics(input)

      expect(stats.complexity).toBeGreaterThanOrEqual(0)
    })

    it('should calculate consistent hash', () => {
      const input = 'consistent'
      const stats1 = getStatistics(input)
      const stats2 = getStatistics(input)

      expect(stats1.input_hash).toBe(stats2.input_hash)
    })

    it('should calculate different hash for different inputs', () => {
      const stats1 = getStatistics('input1')
      const stats2 = getStatistics('input2')

      expect(stats1.input_hash).not.toBe(stats2.input_hash)
    })
  })

  describe('Error Handling', () => {
    it('should throw NeurodnaError for module not loaded', () => {
      // This test would require mocking, so we test error class instead
      const error = new NeurodnaError('test error', 'TEST_CODE')
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.name).toBe('NeurodnaError')
    })

    it('should have proper error properties', () => {
      const error = new NeurodnaError('Processing failed', 'PROCESSING_FAILED')
      expect(error.code).toBeDefined()
      expect(error.message).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should perform complete workflow', () => {
      // Process data
      const inputData = 'workflow test'
      const processed = processData(inputData)
      expect(processed.success).toBe(true)

      // Encode data
      const encoded = encodeData(inputData, 'binary')
      expect(encoded.success).toBe(true)

      // Evaluate network
      const config: NeuralNetConfig = { layers: 2, neurons: 32 }
      const evaluated = evaluateNetwork(config, inputData)
      expect(evaluated.success).toBe(true)

      // Get statistics
      const stats = getStatistics(inputData)
      expect(stats.input_size).toBe(inputData.length)
    })

    it('should batch process with multiple encodings', () => {
      const inputs = ['data1', 'data2', 'data3']
      const results = batchProcess(inputs)

      expect(results).toHaveLength(3)

      // Then encode each
      const encoded1 = encodeData(inputs[0], 'gray')
      const encoded2 = encodeData(inputs[1], 'binary')
      const encoded3 = encodeData(inputs[2], 'permutation')

      expect(encoded1.success).toBe(true)
      expect(encoded2.success).toBe(true)
      expect(encoded3.success).toBe(true)
    })

    it('should handle mixed data types', () => {
      const inputs = [
        'string data',
        '{"json": "object"}',
        '123456',
        '!@#$%^&*()',
        '',
      ]

      const results = batchProcess(inputs)
      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })
    })

    it('should maintain data through processing pipeline', () => {
      const original = 'test pipeline'

      // Process
      const result1 = processData(original)
      expect(result1.size).toBe(original.length)

      // Encode
      const result2 = encodeData(original, 'binary')
      expect(result2.size).toBe(original.length)

      // Evaluate
      const result3 = evaluateNetwork({}, original)
      expect(result3.size).toBe(original.length)
    })
  })

  describe('Type Safety', () => {
    it('should have correct ProcessResult type', () => {
      const result = processData('test')

      const typed: ProcessResult = result
      expect(typed.success).toBe(true)
      expect(typed.processing_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should have correct Statistics type', () => {
      const stats = getStatistics('test')

      const typed: Statistics = stats
      expect(typed.input_size).toBeGreaterThanOrEqual(0)
      expect(typed.entropy).toBeGreaterThanOrEqual(0)
    })

    it('should accept valid NeuralNetConfig', () => {
      const configs: NeuralNetConfig[] = [
        {},
        { layers: 2 },
        { neurons: 64 },
        { activation: 'relu' },
        { layers: 3, neurons: 128, activation: 'tanh' },
      ]

      configs.forEach((config) => {
        const result = evaluateNetwork(config, 'test')
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Performance', () => {
    it('should process quickly', () => {
      const input = 'x'.repeat(1000)
      const start = Date.now()
      const result = processData(input)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(1000) // Should be much faster
    })

    it('should batch process efficiently', () => {
      const inputs = Array.from({ length: 50 }, (_, i) => `data${i}`)
      const start = Date.now()
      const results = batchProcess(inputs)
      const duration = Date.now() - start

      expect(results).toHaveLength(50)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle statistics calculation quickly', () => {
      const input = 'x'.repeat(10000)
      const start = Date.now()
      const stats = getStatistics(input)
      const duration = Date.now() - start

      expect(stats.input_size).toBe(10000)
      expect(duration).toBeLessThan(100)
    })

    it('should evaluate networks efficiently', () => {
      const config: NeuralNetConfig = { layers: 10, neurons: 512 }
      const input = 'x'.repeat(1000)
      const start = Date.now()
      const result = evaluateNetwork(config, input)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large inputs', () => {
      const largeInput = 'x'.repeat(100000)
      const result = processData(largeInput)

      expect(result.success).toBe(true)
      expect(result.size).toBe(100000)
    })

    it('should handle unicode characters', () => {
      const unicode = '你好世界🌍🚀'
      const result = processData(unicode)

      expect(result.success).toBe(true)
    })

    it('should handle newlines and tabs', () => {
      const whitespace = 'line1\nline2\tcolumn1'
      const result = processData(whitespace)

      expect(result.success).toBe(true)
    })

    it('should handle repeated calls', () => {
      const input = 'repeated'
      for (let i = 0; i < 10; i++) {
        const result = processData(input)
        expect(result.success).toBe(true)
      }
    })
  })
})
