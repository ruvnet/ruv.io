import { BitParallelSearchClass, search, searchDetailed } from '../src/index'

describe('BitParallelSearch', () => {
  describe('BitParallelSearchClass', () => {
    it('should create a searcher instance', () => {
      const searcher = new BitParallelSearchClass('hello')
      expect(searcher).toBeDefined()
    })

    it('should find single occurrence', () => {
      const searcher = new BitParallelSearchClass('hello')
      const result = searcher.searchAll('hello world')
      expect(result).toEqual([0])
    })

    it('should find multiple occurrences', () => {
      const searcher = new BitParallelSearchClass('lo')
      const result = searcher.searchAll('hello world, hello')
      expect(result).toContain(3) // 'hel[lo]' first occurrence
      expect(result).toContain(16) // 'hel[lo]' second occurrence
    })

    it('should return empty array when pattern not found', () => {
      const searcher = new BitParallelSearchClass('xyz')
      const result = searcher.searchAll('hello world')
      expect(result).toEqual([])
    })

    it('should find first occurrence', () => {
      const searcher = new BitParallelSearchClass('o')
      const result = searcher.searchFirst('hello world')
      expect(result).toBe(4)
    })

    it('should return null when first occurrence not found', () => {
      const searcher = new BitParallelSearchClass('xyz')
      const result = searcher.searchFirst('hello world')
      expect(result).toBeNull()
    })

    it('should count occurrences', () => {
      const searcher = new BitParallelSearchClass('l')
      const count = searcher.count('hello world')
      expect(count).toBe(3) // 'l' appears 3 times
    })

    it('should return 0 for count when pattern not found', () => {
      const searcher = new BitParallelSearchClass('xyz')
      const count = searcher.count('hello world')
      expect(count).toBe(0)
    })

    it('should check if pattern contains', () => {
      const searcher = new BitParallelSearchClass('world')
      const result = searcher.contains('hello world')
      expect(result).toBe(true)
    })

    it('should return false for contains when pattern not found', () => {
      const searcher = new BitParallelSearchClass('xyz')
      const result = searcher.contains('hello world')
      expect(result).toBe(false)
    })
  })

  describe('search utility function', () => {
    it('should find pattern in text', () => {
      const result = search('hello world', 'hello')
      expect(result).toEqual([0])
    })

    it('should find multiple patterns', () => {
      const result = search('hello hello hello', 'hello')
      expect(result).toEqual([0, 6, 12])
    })

    it('should return empty array when pattern not found', () => {
      const result = search('hello world', 'xyz')
      expect(result).toEqual([])
    })

    it('should handle empty strings', () => {
      const result = search('hello', '')
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('searchDetailed utility function', () => {
    it('should return detailed search result', () => {
      const result = searchDetailed('hello world, hello', 'hello')
      expect(result).toHaveProperty('positions')
      expect(result).toHaveProperty('count')
      expect(result).toHaveProperty('found')
      expect(Array.isArray(result.positions)).toBe(true)
      expect(typeof result.count).toBe('number')
      expect(typeof result.found).toBe('boolean')
    })

    it('should correctly populate result when pattern found', () => {
      const result = searchDetailed('hello world, hello', 'hello')
      expect(result.found).toBe(true)
      expect(result.count).toBeGreaterThan(0)
      expect(result.positions.length).toBeGreaterThan(0)
    })

    it('should correctly populate result when pattern not found', () => {
      const result = searchDetailed('hello world', 'xyz')
      expect(result.found).toBe(false)
      expect(result.count).toBe(0)
      expect(result.positions).toEqual([])
    })

    it('should have matching count and positions length', () => {
      const result = searchDetailed('the quick brown fox jumps over the lazy dog', 'the')
      expect(result.count).toBe(result.positions.length)
    })
  })

  describe('edge cases', () => {
    it('should handle special characters', () => {
      const searcher = new BitParallelSearchClass('.')
      const result = searcher.searchAll('hello.world.test')
      expect(result.length).toBe(2)
    })

    it('should handle unicode characters', () => {
      const searcher = new BitParallelSearchClass('hello')
      const result = searcher.searchAll('hello world 你好')
      expect(result).toEqual([0])
    })

    it('should handle pattern at boundaries', () => {
      const searcher = new BitParallelSearchClass('hello')
      const result1 = searcher.searchAll('helloworld')
      const result2 = searcher.searchAll('worldhello')
      expect(result1).toEqual([0])
      expect(result2).toEqual([5])
    })

    it('should handle case sensitivity', () => {
      const searcher = new BitParallelSearchClass('Hello')
      const result = searcher.searchAll('hello HELLO Hello')
      expect(result.length).toBe(1) // Only the exact match
    })

    it('should handle long patterns and texts', () => {
      // bit-parallel-search supports patterns up to 64 bytes
      const longPattern = 'x'.repeat(60)
      const longText = 'a'.repeat(1000) + longPattern + 'b'.repeat(1000)
      const searcher = new BitParallelSearchClass(longPattern)
      const result = searcher.searchAll(longText)
      expect(result).toEqual([1000])
    })
  })

  describe('performance characteristics', () => {
    it('should handle large texts efficiently', () => {
      const largeText = 'a'.repeat(100000) + 'needle' + 'a'.repeat(100000)
      const searcher = new BitParallelSearchClass('needle')
      const start = Date.now()
      const result = searcher.searchAll(largeText)
      const duration = Date.now() - start
      expect(result).toEqual([100000])
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle many occurrences', () => {
      const pattern = 'a'
      const text = pattern.repeat(10000)
      const searcher = new BitParallelSearchClass(pattern)
      const count = searcher.count(text)
      expect(count).toBe(10000)
    })
  })
})
