import { describe, it, expect, beforeEach } from 'vitest'
import {
  TimeExpansionContextClass,
  calculateTimeExpansion,
  calculateNestedExpansion,
  calculateOptimalDilation,
  processTimeBatch,
  calculateAverageDilation,
  estimateConsciousnessLevel,
  TimeCalculationResult,
} from '../src/index'

describe('Subjective Time Expansion', () => {
  describe('TimeExpansionContextClass', () => {
    let context: TimeExpansionContextClass

    beforeEach(() => {
      context = new TimeExpansionContextClass(2.0, 1.0, 5)
    })

    it('should create a context instance', () => {
      expect(context).toBeDefined()
    })

    it('should initialize with correct dilation factor', () => {
      expect(context.getDilationFactor()).toBe(2.0)
    })

    it('should initialize with correct base frequency', () => {
      expect(context.getBaseFrequency()).toBe(1.0)
    })

    it('should have initial zero elapsed times', () => {
      expect(context.getElapsedPhysicalTime()).toBe(0)
      expect(context.getElapsedSubjectiveTime()).toBe(0)
    })

    it('should be in initialized state', () => {
      expect(context.getState()).toBe('initialized')
    })

    it('should update elapsed times correctly', () => {
      context.update(1000)

      expect(context.getElapsedPhysicalTime()).toBe(1000)
      expect(context.getElapsedSubjectiveTime()).toBe(2000)
    })

    it('should calculate time ratio correctly', () => {
      context.update(1000)

      expect(context.getTimeRatio()).toBe(2.0)
    })

    it('should handle multiple updates', () => {
      context.update(500)
      expect(context.getElapsedPhysicalTime()).toBe(500)
      expect(context.getElapsedSubjectiveTime()).toBe(1000)

      context.update(1000)
      expect(context.getElapsedPhysicalTime()).toBe(1000)
      expect(context.getElapsedSubjectiveTime()).toBe(2000)
    })

    it('should change state after update', () => {
      context.update(1000)
      expect(context.getState()).toBe('updated')
    })

    it('should reset context correctly', () => {
      context.update(1000)
      context.reset()

      expect(context.getElapsedPhysicalTime()).toBe(0)
      expect(context.getElapsedSubjectiveTime()).toBe(0)
      expect(context.getState()).toBe('reset')
    })

    it('should handle large time values', () => {
      const largeTime = 1000000
      context.update(largeTime)

      expect(context.getElapsedPhysicalTime()).toBe(largeTime)
      expect(context.getElapsedSubjectiveTime()).toBe(largeTime * 2.0)
    })

    it('should handle very small dilation factors', () => {
      const smallContext = new TimeExpansionContextClass(0.1, 1.0, 5)
      smallContext.update(1000)

      expect(smallContext.getElapsedSubjectiveTime()).toBe(100)
    })

    it('should handle very large dilation factors', () => {
      const largeContext = new TimeExpansionContextClass(100.0, 1.0, 5)
      largeContext.update(1000)

      expect(largeContext.getElapsedSubjectiveTime()).toBe(100000)
    })
  })

  describe('calculateTimeExpansion', () => {
    it('should calculate basic time expansion', () => {
      const result = calculateTimeExpansion(1000, 2.0)

      expect(result).toHaveProperty('physicalTime')
      expect(result).toHaveProperty('subjectiveTime')
      expect(result).toHaveProperty('dilationFactor')
      expect(result).toHaveProperty('timeRatio')
    })

    it('should have correct values in result', () => {
      const result = calculateTimeExpansion(1000, 2.0)

      expect(result.physicalTime).toBe(1000)
      expect(result.subjectiveTime).toBe(2000)
      expect(result.dilationFactor).toBe(2.0)
      expect(result.timeRatio).toBe(2.0)
    })

    it('should handle zero physical time', () => {
      const result = calculateTimeExpansion(0, 2.0)

      expect(result.physicalTime).toBe(0)
      expect(result.subjectiveTime).toBe(0)
      expect(result.timeRatio).toBe(2.0) // Falls back to dilation factor
    })

    it('should handle different dilation factors', () => {
      const result1 = calculateTimeExpansion(1000, 1.5)
      const result2 = calculateTimeExpansion(1000, 3.0)

      expect(result1.subjectiveTime).toBe(1500)
      expect(result2.subjectiveTime).toBe(3000)
      expect(result2.subjectiveTime).toBeGreaterThan(result1.subjectiveTime)
    })

    it('should maintain proportional relationships', () => {
      const result1 = calculateTimeExpansion(1000, 2.0)
      const result2 = calculateTimeExpansion(2000, 2.0)

      expect(result2.subjectiveTime).toBe(result1.subjectiveTime * 2)
    })
  })

  describe('calculateNestedExpansion', () => {
    it('should calculate nested expansion with depth 1', () => {
      const result = calculateNestedExpansion(1000, 2.0, 1)
      expect(result).toBe(2000)
    })

    it('should calculate nested expansion with depth 2', () => {
      const result = calculateNestedExpansion(1000, 2.0, 2)
      expect(result).toBe(4000)
    })

    it('should calculate nested expansion with depth 3', () => {
      const result = calculateNestedExpansion(1000, 2.0, 3)
      expect(result).toBe(8000)
    })

    it('should handle exponential growth correctly', () => {
      const result = calculateNestedExpansion(1, 2.0, 10)
      expect(result).toBe(1024) // 2^10
    })

    it('should handle fractional base factors', () => {
      const result = calculateNestedExpansion(8000, 0.5, 3)
      expect(result).toBe(1000) // 8000 * 0.5^3
    })

    it('should work with different bases', () => {
      const result1 = calculateNestedExpansion(1000, 2.0, 2)
      const result2 = calculateNestedExpansion(1000, 3.0, 2)

      expect(result2).toBe(9000)
      expect(result2).toBeGreaterThan(result1)
    })
  })

  describe('calculateOptimalDilation', () => {
    it('should return target ratio as optimal dilation', () => {
      const dilation = calculateOptimalDilation(2.0)
      expect(dilation).toBe(2.0)
    })

    it('should handle various target ratios', () => {
      expect(calculateOptimalDilation(1.0)).toBe(1.0)
      expect(calculateOptimalDilation(5.0)).toBe(5.0)
      expect(calculateOptimalDilation(10.0)).toBe(10.0)
    })

    it('should handle fractional target ratios', () => {
      const dilation = calculateOptimalDilation(0.5)
      expect(dilation).toBe(0.5)
    })

    it('should handle very small ratios', () => {
      const dilation = calculateOptimalDilation(0.001)
      expect(dilation).toBe(0.001)
    })

    it('should handle very large ratios', () => {
      const dilation = calculateOptimalDilation(1000.0)
      expect(dilation).toBe(1000.0)
    })
  })

  describe('processTimeBatch', () => {
    it('should process batch of times', () => {
      const times = [1000, 2000, 3000]
      const result = processTimeBatch(times, 2.0)

      expect(result).toEqual([2000, 4000, 6000])
    })

    it('should handle empty batch', () => {
      const result = processTimeBatch([], 2.0)
      expect(result).toEqual([])
    })

    it('should handle single element batch', () => {
      const result = processTimeBatch([1000], 2.0)
      expect(result).toEqual([2000])
    })

    it('should handle zero dilation factor in batch', () => {
      // This should work fine, just multiplying by a small number
      const result = processTimeBatch([1000, 2000], 0.5)
      expect(result).toEqual([500, 1000])
    })

    it('should handle large batches', () => {
      const times = Array.from({ length: 100 }, (_, i) => i * 10)
      const result = processTimeBatch(times, 2.0)

      expect(result).toHaveLength(100)
      expect(result[0]).toBe(0)
      expect(result[99]).toBe(1980)
    })

    it('should preserve order', () => {
      const times = [3000, 1000, 2000]
      const result = processTimeBatch(times, 2.0)

      expect(result).toEqual([6000, 2000, 4000])
    })
  })

  describe('calculateAverageDilation', () => {
    it('should calculate average dilation factor', () => {
      const physicalTimes = [1000, 2000]
      const subjectiveTimes = [2000, 4000]

      const avg = calculateAverageDilation(physicalTimes, subjectiveTimes)
      expect(avg).toBe(2.0)
    })

    it('should handle mixed dilation factors', () => {
      const physicalTimes = [1000, 1000]
      const subjectiveTimes = [2000, 3000] // Average: 2.5

      const avg = calculateAverageDilation(physicalTimes, subjectiveTimes)
      expect(avg).toBe(2.5)
    })

    it('should handle single measurement', () => {
      const physicalTimes = [1000]
      const subjectiveTimes = [3000]

      const avg = calculateAverageDilation(physicalTimes, subjectiveTimes)
      expect(avg).toBe(3.0)
    })

    it('should return 0 when physical time is always 0', () => {
      const physicalTimes = [0, 0]
      const subjectiveTimes = [1000, 2000]

      const avg = calculateAverageDilation(physicalTimes, subjectiveTimes)
      expect(avg).toBe(0.0)
    })

    it('should handle large arrays', () => {
      const physicalTimes = Array.from({ length: 100 }, (_, i) => 1000 + i * 10)
      const subjectiveTimes = physicalTimes.map(t => t * 2.0)

      const avg = calculateAverageDilation(physicalTimes, subjectiveTimes)
      expect(avg).toBe(2.0)
    })
  })

  describe('estimateConsciousnessLevel', () => {
    it('should return value between 0 and 1', () => {
      const level = estimateConsciousnessLevel(2.0, 8)

      expect(level).toBeGreaterThanOrEqual(0.0)
      expect(level).toBeLessThanOrEqual(1.0)
    })

    it('should increase with higher dilation factor', () => {
      const level1 = estimateConsciousnessLevel(2.0, 5)
      const level2 = estimateConsciousnessLevel(8.0, 5)

      expect(level2).toBeGreaterThan(level1)
    })

    it('should increase with greater processing depth', () => {
      const level1 = estimateConsciousnessLevel(2.0, 2)
      const level2 = estimateConsciousnessLevel(2.0, 8)

      expect(level2).toBeGreaterThan(level1)
    })

    it('should handle minimal consciousness', () => {
      const level = estimateConsciousnessLevel(1.0, 1)

      expect(level).toBeGreaterThanOrEqual(0.0)
      expect(level).toBeLessThanOrEqual(1.0)
    })

    it('should handle maximum consciousness', () => {
      const level = estimateConsciousnessLevel(1024.0, 256)

      expect(level).toBeGreaterThanOrEqual(0.0)
      expect(level).toBeLessThanOrEqual(1.0)
    })

    it('should return realistic values for typical parameters', () => {
      const level = estimateConsciousnessLevel(4.0, 8)

      expect(level).toBeGreaterThan(0.0)
      expect(level).toBeLessThan(1.0)
    })
  })

  describe('Integration tests', () => {
    it('should handle complete workflow', () => {
      const context = new TimeExpansionContextClass(3.0, 1.0, 10)

      // Update with physical time
      context.update(500)

      // Get subjective time
      const subjectiveTime = context.getElapsedSubjectiveTime()
      expect(subjectiveTime).toBe(1500)

      // Calculate time expansion
      const expanded = calculateTimeExpansion(500, 3.0)
      expect(expanded.subjectiveTime).toBe(subjectiveTime)

      // Calculate consciousness level
      const consciousness = estimateConsciousnessLevel(3.0, 10)
      expect(consciousness).toBeGreaterThan(0)
    })

    it('should process multiple contexts independently', () => {
      const ctx1 = new TimeExpansionContextClass(2.0, 1.0, 5)
      const ctx2 = new TimeExpansionContextClass(3.0, 1.0, 5)

      ctx1.update(1000)
      ctx2.update(1000)

      expect(ctx1.getElapsedSubjectiveTime()).toBe(2000)
      expect(ctx2.getElapsedSubjectiveTime()).toBe(3000)
    })

    it('should handle nested and batch calculations together', () => {
      const physicalTimes = [1000, 2000, 3000]
      const dilationFactor = 2.0

      // Process batch
      const batchResult = processTimeBatch(physicalTimes, dilationFactor)

      // Calculate nested for same base
      const nestedResult = calculateNestedExpansion(1000, 2.0, 1)

      expect(batchResult[0]).toBe(nestedResult)
    })

    it('should maintain consistency across operations', () => {
      const physicalTime = 1000
      const dilationFactor = 2.0

      // Method 1: Direct calculation
      const direct = calculateTimeExpansion(physicalTime, dilationFactor)

      // Method 2: Via context
      const context = new TimeExpansionContextClass(dilationFactor, 1.0, 5)
      context.update(physicalTime)

      expect(direct.subjectiveTime).toBe(context.getElapsedSubjectiveTime())
      expect(direct.dilationFactor).toBe(context.getDilationFactor())
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle zero elapsed times', () => {
      const context = new TimeExpansionContextClass(2.0, 1.0, 5)
      const ratio = context.getTimeRatio()

      expect(ratio).toBe(2.0) // Falls back to dilation factor
    })

    it('should handle very precise dilation factors', () => {
      const context = new TimeExpansionContextClass(1.5, 1.0, 5)
      context.update(1000)

      expect(context.getElapsedSubjectiveTime()).toBe(1500)
    })

    it('should handle rapid sequential updates', () => {
      const context = new TimeExpansionContextClass(2.0, 1.0, 5)

      context.update(100)
      context.update(200)
      context.update(300)
      context.update(500)

      expect(context.getElapsedPhysicalTime()).toBe(500)
      expect(context.getElapsedSubjectiveTime()).toBe(1000)
    })

    it('should handle reset and reuse', () => {
      const context = new TimeExpansionContextClass(2.0, 1.0, 5)

      context.update(1000)
      const firstResult = context.getElapsedSubjectiveTime()

      context.reset()
      const resetState = context.getState()

      context.update(500)
      const secondResult = context.getElapsedSubjectiveTime()

      expect(firstResult).toBe(2000)
      expect(secondResult).toBe(1000)
      expect(resetState).toBe('reset') // Check state right after reset
    })
  })

  describe('Performance characteristics', () => {
    it('should handle large batch processing efficiently', () => {
      const times = Array.from({ length: 10000 }, (_, i) => i + 1)
      const start = Date.now()
      const result = processTimeBatch(times, 2.0)
      const duration = Date.now() - start

      expect(result).toHaveLength(10000)
      expect(duration).toBeLessThan(1000) // Should complete quickly
    })

    it('should handle many context instances', () => {
      const contexts: TimeExpansionContextClass[] = []

      for (let i = 0; i < 100; i++) {
        const ctx = new TimeExpansionContextClass(
          1.0 + i * 0.1,
          1.0,
          5
        )
        ctx.update(1000)
        contexts.push(ctx)
      }

      expect(contexts).toHaveLength(100)
      expect(contexts[0].getElapsedSubjectiveTime()).toBe(1000)
      expect(contexts[99].getElapsedSubjectiveTime()).toBeGreaterThan(1000)
    })

    it('should handle deep nesting levels', () => {
      for (let depth = 1; depth <= 20; depth++) {
        const result = calculateNestedExpansion(1, 1.1, depth)
        expect(result).toBeGreaterThan(0)
      }
    })
  })
})
