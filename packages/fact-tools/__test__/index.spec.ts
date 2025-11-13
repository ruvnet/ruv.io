import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  FactTools,
  processContext,
  optimizeContext,
  batchProcessContexts,
  extractKeyPhrases,
  calculateSimilarity,
  Context,
  OptimizationOptions,
  ProcessedContext,
  OptimizationResult,
} from '../src/index'

describe('FACT Tools - Context Processing', () => {
  const sampleContext: Context = {
    id: 'ctx-001',
    content: 'The quick brown fox jumps over the lazy dog. This is a test context.',
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  const sampleContext2: Context = {
    id: 'ctx-002',
    content: 'The quick brown fox jumps over the lazy dog and runs away quickly.',
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  describe('processContext', () => {
    it('should process a context and return processed data', () => {
      const result = processContext(sampleContext)

      expect(result).toBeDefined()
      expect(result.id).toBe('ctx-001')
      expect(result.original_length).toBeGreaterThan(0)
      expect(result.processed_content).toBeDefined()
      expect(result.token_count).toBeGreaterThan(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should preserve context metadata', () => {
      const result = processContext(sampleContext)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.source).toBe('test')
      expect(result.metadata.version).toBe('1.0')
    })

    it('should handle empty content', () => {
      const emptyContext: Context = {
        id: 'ctx-empty',
        content: '',
        metadata: {},
      }

      const result = processContext(emptyContext)

      expect(result).toBeDefined()
      expect(result.id).toBe('ctx-empty')
      expect(result.original_length).toBe(0)
      expect(result.token_count).toBe(0)
    })

    it('should handle content with special characters', () => {
      const specialContext: Context = {
        id: 'ctx-special',
        content: 'Special chars: !@#$%^&*() "quotes" and\ttabs\nand\nnewlines',
        metadata: {},
      }

      const result = processContext(specialContext)

      expect(result).toBeDefined()
      expect(result.processed_content).toBeDefined()
    })
  })

  describe('optimizeContext', () => {
    it('should optimize context with default options', () => {
      const result = optimizeContext(sampleContext)

      expect(result).toBeDefined()
      expect(result.id).toBe('ctx-001')
      expect(result.original_size).toBeGreaterThan(0)
      expect(result.optimized_size).toBeGreaterThanOrEqual(0)
      expect(result.compression_ratio).toBeDefined()
      expect(result.optimized_content).toBeDefined()
    })

    it('should compress content when optimizing', () => {
      const result = optimizeContext(sampleContext)

      expect(result.optimized_size).toBeLessThanOrEqual(result.original_size)
      expect(result.compression_ratio).toBeGreaterThanOrEqual(0)
      expect(result.compression_ratio).toBeLessThanOrEqual(1)
    })

    it('should respect remove_duplicates option', () => {
      const contextWithDuplicates: Context = {
        id: 'ctx-dup',
        content: 'line one\nline two\nline one\nline three\nline two',
        metadata: {},
      }

      const result = optimizeContext(contextWithDuplicates, {
        remove_duplicates: true,
      })

      expect(result).toBeDefined()
      expect(result.optimized_content).toBeDefined()
    })

    it('should respect compress_whitespace option', () => {
      const contextWithSpaces: Context = {
        id: 'ctx-spaces',
        content: 'word1    word2     word3',
        metadata: {},
      }

      const result = optimizeContext(contextWithSpaces, {
        compress_whitespace: true,
      })

      expect(result).toBeDefined()
      // Whitespace should be compressed
      expect(result.optimized_content).not.toContain('    ')
    })

    it('should respect max_length option', () => {
      const result = optimizeContext(sampleContext, {
        max_length: 20,
      })

      expect(result.optimized_content.length).toBeLessThanOrEqual(23) // 20 + "..."
    })

    it('should handle custom optimization options', () => {
      const options: OptimizationOptions = {
        remove_duplicates: false,
        compress_whitespace: true,
        remove_empty_lines: true,
        max_length: 100,
      }

      const result = optimizeContext(sampleContext, options)

      expect(result).toBeDefined()
      expect(result.optimized_content).toBeDefined()
    })
  })

  describe('batchProcessContexts', () => {
    it('should process multiple contexts', () => {
      const contexts = [sampleContext, sampleContext2]
      const results = batchProcessContexts(contexts)

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('ctx-001')
      expect(results[1].id).toBe('ctx-002')
    })

    it('should process each context independently', () => {
      const contexts = [sampleContext, sampleContext2]
      const results = batchProcessContexts(contexts)

      // Both contexts have different lengths and should be processed independently
      expect(results[0].original_length).toBeGreaterThan(0)
      expect(results[1].original_length).toBeGreaterThan(0)
      expect(results[0].token_count).not.toBe(results[1].token_count)
    })

    it('should handle empty array', () => {
      const results = batchProcessContexts([])

      expect(results).toHaveLength(0)
    })

    it('should handle large batch', () => {
      const contexts = Array.from({ length: 100 }, (_, i) => ({
        id: `ctx-${i}`,
        content: `Context number ${i}`,
        metadata: { index: i },
      }))

      const results = batchProcessContexts(contexts)

      expect(results).toHaveLength(100)
    })
  })

  describe('extractKeyPhrases', () => {
    it('should extract key phrases from context', () => {
      const phrases = extractKeyPhrases(sampleContext, 5)

      expect(phrases).toBeDefined()
      expect(Array.isArray(phrases)).toBe(true)
      expect(phrases.length).toBeLessThanOrEqual(5)
    })

    it('should handle default max phrases', () => {
      const phrases = extractKeyPhrases(sampleContext)

      expect(phrases).toBeDefined()
      expect(Array.isArray(phrases)).toBe(true)
    })

    it('should extract phrases as strings', () => {
      const phrases = extractKeyPhrases(sampleContext, 3)

      phrases.forEach((phrase) => {
        expect(typeof phrase).toBe('string')
        expect(phrase.length).toBeGreaterThan(0)
      })
    })

    it('should respect max phrases limit', () => {
      const phrases = extractKeyPhrases(sampleContext, 2)

      expect(phrases.length).toBeLessThanOrEqual(2)
    })
  })

  describe('calculateSimilarity', () => {
    it('should calculate similarity between contexts', () => {
      const similarity = calculateSimilarity(sampleContext, sampleContext2)

      expect(typeof similarity).toBe('number')
      expect(similarity).toBeGreaterThanOrEqual(0)
      expect(similarity).toBeLessThanOrEqual(1)
    })

    it('should return 1.0 for identical contexts', () => {
      const similarity = calculateSimilarity(sampleContext, sampleContext)

      expect(similarity).toBe(1.0)
    })

    it('should return high similarity for similar contexts', () => {
      const similarity = calculateSimilarity(sampleContext, sampleContext2)

      // Both contexts share many words, so similarity should be moderate
      expect(similarity).toBeGreaterThan(0.3)
      expect(similarity).toBeLessThan(1.0)
    })

    it('should return low similarity for different contexts', () => {
      const ctx1: Context = {
        id: 'ctx-1',
        content: 'apple banana cherry',
        metadata: {},
      }

      const ctx2: Context = {
        id: 'ctx-2',
        content: 'xyz abc def',
        metadata: {},
      }

      const similarity = calculateSimilarity(ctx1, ctx2)

      expect(similarity).toBeLessThan(0.1)
    })

    it('should be symmetric', () => {
      const similarity1 = calculateSimilarity(sampleContext, sampleContext2)
      const similarity2 = calculateSimilarity(sampleContext2, sampleContext)

      expect(similarity1).toBe(similarity2)
    })
  })

  describe('FactTools class', () => {
    let factTools: FactTools

    beforeAll(() => {
      factTools = new FactTools()
    })

    it('should create instance', () => {
      expect(factTools).toBeDefined()
      expect(factTools).toBeInstanceOf(FactTools)
    })

    it('should process context via instance method', () => {
      const result = factTools.process(sampleContext)

      expect(result).toBeDefined()
      expect(result.id).toBe('ctx-001')
    })

    it('should optimize context via instance method', () => {
      const result = factTools.optimize(sampleContext)

      expect(result).toBeDefined()
      expect(result.id).toBe('ctx-001')
    })

    it('should batch process via instance method', () => {
      const results = factTools.processBatch([sampleContext, sampleContext2])

      expect(results).toHaveLength(2)
    })

    it('should extract phrases via instance method', () => {
      const phrases = factTools.extractPhrases(sampleContext, 5)

      expect(phrases).toBeDefined()
      expect(Array.isArray(phrases)).toBe(true)
    })

    it('should calculate similarity via instance method', () => {
      const similarity = factTools.similarity(sampleContext, sampleContext2)

      expect(typeof similarity).toBe('number')
      expect(similarity).toBeGreaterThanOrEqual(0)
      expect(similarity).toBeLessThanOrEqual(1)
    })
  })

  describe('Integration tests', () => {
    it('should process, optimize, and analyze context in sequence', () => {
      // Process
      const processed = processContext(sampleContext)
      expect(processed).toBeDefined()

      // Optimize
      const optimized = optimizeContext(sampleContext)
      expect(optimized.compression_ratio).toBeGreaterThanOrEqual(0)

      // Extract phrases
      const phrases = extractKeyPhrases(sampleContext, 5)
      expect(phrases.length).toBeGreaterThan(0)
    })

    it('should handle complete workflow', () => {
      const contexts = [sampleContext, sampleContext2]

      // Batch process
      const processed = batchProcessContexts(contexts)
      expect(processed).toHaveLength(2)

      // Calculate similarity
      const similarity = calculateSimilarity(sampleContext, sampleContext2)
      expect(similarity).toBeGreaterThan(0)

      // Optimize
      const optimized = optimizeContext(sampleContext, {
        remove_duplicates: true,
        compress_whitespace: true,
        max_length: 100,
      })
      expect(optimized).toBeDefined()
    })

    it('should maintain data integrity through processing', () => {
      const result = processContext(sampleContext)

      expect(result.id).toBe(sampleContext.id)
      expect(result.metadata).toEqual(sampleContext.metadata)
      expect(result.original_length).toBe(sampleContext.content.length)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid context gracefully', () => {
      expect(() => {
        const invalidContext = { id: 'invalid' } as any
        processContext(invalidContext)
      }).toThrow()
    })

    it('should handle processing of large content', () => {
      const largeContent = 'word '.repeat(10000)
      const largeContext: Context = {
        id: 'large',
        content: largeContent,
        metadata: {},
      }

      const result = processContext(largeContext)

      expect(result).toBeDefined()
      expect(result.token_count).toBe(10000)
    })
  })
})
