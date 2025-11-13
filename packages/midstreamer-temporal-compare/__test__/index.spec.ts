import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  TemporalCompare,
  compareSequences,
  detectPattern,
  analyzeSequence,
  normalizeSequence,
  batchCompareSequences,
  TemporalSequence,
  ComparisonConfig,
  ComparisonResult,
  PatternResult,
  StatisticsResult,
} from '../src/index'

describe('Midstreamer Temporal Compare', () => {
  const sampleSequence1: TemporalSequence = {
    id: 'seq-001',
    timestamps: [0, 1, 2, 3, 4, 5],
    values: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  const sampleSequence2: TemporalSequence = {
    id: 'seq-002',
    timestamps: [0, 1, 2, 3, 4, 5],
    values: [1.1, 2.1, 3.1, 4.1, 5.1, 6.1],
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  const sampleSequence3: TemporalSequence = {
    id: 'seq-003',
    timestamps: [0, 1, 2, 3, 4, 5],
    values: [1.0, 2.0, 1.0, 2.0, 1.0, 2.0],
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  describe('compareSequences', () => {
    it('should compare two similar sequences', () => {
      const result = compareSequences(sampleSequence1, sampleSequence2)

      expect(result).toBeDefined()
      expect(result.sequence1_id).toBe('seq-001')
      expect(result.sequence2_id).toBe('seq-002')
      expect(result.similarity_score).toBeGreaterThan(0)
      expect(result.similarity_score).toBeLessThanOrEqual(1)
      expect(result.distance).toBeDefined()
      expect(result.alignment_offset).toBeDefined()
    })

    it('should detect pattern match with similar sequences', () => {
      const config: ComparisonConfig = {
        threshold: 0.5,
        similarity_method: 'euclidean',
        normalize: true,
      }

      const result = compareSequences(sampleSequence1, sampleSequence2, config)

      expect(result).toBeDefined()
      expect(result.pattern_match).toBe(true)
    })

    it('should use cosine similarity when specified', () => {
      const config: ComparisonConfig = {
        similarity_method: 'cosine',
        normalize: false,
      }

      const result = compareSequences(sampleSequence1, sampleSequence2, config)

      expect(result).toBeDefined()
      expect(result.similarity_score).toBeDefined()
    })

    it('should handle different sequence lengths', () => {
      const shortSeq: TemporalSequence = {
        id: 'short',
        timestamps: [0, 1],
        values: [1.0, 2.0],
      }

      const result = compareSequences(sampleSequence1, shortSeq)

      expect(result).toBeDefined()
      expect(result.similarity_score).toBeDefined()
    })

    it('should handle empty metadata', () => {
      const seqNoMeta1: TemporalSequence = {
        id: 'nometa1',
        timestamps: [0, 1, 2],
        values: [1.0, 2.0, 3.0],
      }

      const seqNoMeta2: TemporalSequence = {
        id: 'nometa2',
        timestamps: [0, 1, 2],
        values: [1.0, 2.0, 3.0],
      }

      const result = compareSequences(seqNoMeta1, seqNoMeta2)

      expect(result).toBeDefined()
      expect(result.similarity_score).toBeGreaterThan(0.9)
    })
  })

  describe('detectPattern', () => {
    it('should detect repeating patterns', () => {
      const result = detectPattern(sampleSequence3, 2)

      expect(result).toBeDefined()
      expect(result.sequence_id).toBe('seq-003')
      expect(result.pattern_found).toBe(true)
      expect(result.occurrences.length).toBeGreaterThan(0)
      expect(result.pattern_confidence).toBeGreaterThan(0)
      expect(result.matched_indices).toBeDefined()
    })

    it('should find correct number of occurrences', () => {
      const result = detectPattern(sampleSequence3, 2)

      expect(result.occurrences.length).toBeGreaterThan(0)
      expect(result.matched_indices.length).toBeGreaterThanOrEqual(result.occurrences.length * 2)
    })

    it('should handle pattern length equal to sequence length', () => {
      const result = detectPattern(sampleSequence1, sampleSequence1.values.length)

      expect(result).toBeDefined()
      expect(result.pattern_found).toBeDefined()
    })

    it('should have high confidence for repeating patterns', () => {
      const result = detectPattern(sampleSequence3, 2)

      if (result.pattern_found) {
        expect(result.pattern_confidence).toBeGreaterThan(0.5)
      }
    })

    it('should calculate matched indices correctly', () => {
      const result = detectPattern(sampleSequence3, 2)

      expect(Array.isArray(result.matched_indices)).toBe(true)
      if (result.occurrences.length > 0) {
        expect(result.matched_indices.length).toBeGreaterThan(0)
      }
    })
  })

  describe('analyzeSequence', () => {
    it('should calculate sequence statistics', () => {
      const result = analyzeSequence(sampleSequence1)

      expect(result).toBeDefined()
      expect(result.sequence_id).toBe('seq-001')
      expect(result.mean).toBeGreaterThan(0)
      expect(result.variance).toBeDefined()
      expect(result.std_dev).toBeDefined()
      expect(result.min_value).toBeDefined()
      expect(result.max_value).toBeDefined()
      expect(result.length).toBe(6)
    })

    it('should calculate correct mean', () => {
      const result = analyzeSequence(sampleSequence1)

      // Mean of [1, 2, 3, 4, 5, 6] = 3.5
      expect(result.mean).toBe(3.5)
    })

    it('should identify min and max correctly', () => {
      const result = analyzeSequence(sampleSequence1)

      expect(result.min_value).toBe(1.0)
      expect(result.max_value).toBe(6.0)
    })

    it('should calculate variance and std_dev', () => {
      const result = analyzeSequence(sampleSequence1)

      expect(result.variance).toBeGreaterThan(0)
      expect(result.std_dev).toBeGreaterThan(0)
      // std_dev should be sqrt(variance)
      expect(Math.abs(result.std_dev - Math.sqrt(result.variance))).toBeLessThan(0.0001)
    })

    it('should handle single value sequence', () => {
      const singleSeq: TemporalSequence = {
        id: 'single',
        timestamps: [0],
        values: [5.0],
      }

      const result = analyzeSequence(singleSeq)

      expect(result).toBeDefined()
      expect(result.mean).toBe(5.0)
      expect(result.min_value).toBe(5.0)
      expect(result.max_value).toBe(5.0)
      expect(result.length).toBe(1)
    })

    it('should handle constant sequence', () => {
      const constSeq: TemporalSequence = {
        id: 'const',
        timestamps: [0, 1, 2, 3],
        values: [5.0, 5.0, 5.0, 5.0],
      }

      const result = analyzeSequence(constSeq)

      expect(result.mean).toBe(5.0)
      expect(result.variance).toBe(0)
      expect(result.std_dev).toBe(0)
    })
  })

  describe('normalizeSequence', () => {
    it('should normalize sequence values', () => {
      const result = normalizeSequence(sampleSequence1)

      expect(result).toBeDefined()
      expect(result.id).toBe('seq-001')
      expect(result.values).toBeDefined()
      expect(result.values.length).toBe(6)
    })

    it('should produce z-score normalized values', () => {
      const result = normalizeSequence(sampleSequence1)

      // After z-score normalization, mean should be close to 0
      const mean = result.values.reduce((a, b) => a + b, 0) / result.values.length
      expect(Math.abs(mean)).toBeLessThan(0.0001)
    })

    it('should preserve sequence metadata and timestamps', () => {
      const result = normalizeSequence(sampleSequence1)

      expect(result.id).toBe(sampleSequence1.id)
      expect(result.timestamps).toEqual(sampleSequence1.timestamps)
      expect(result.metadata).toEqual(sampleSequence1.metadata)
    })

    it('should handle constant sequence gracefully', () => {
      const constSeq: TemporalSequence = {
        id: 'const',
        timestamps: [0, 1, 2],
        values: [5.0, 5.0, 5.0],
      }

      const result = normalizeSequence(constSeq)

      expect(result).toBeDefined()
      // Constant sequence should remain constant after normalization
      expect(result.values).toBeDefined()
    })

    it('should handle negative values', () => {
      const negSeq: TemporalSequence = {
        id: 'neg',
        timestamps: [0, 1, 2, 3],
        values: [-2.0, -1.0, 1.0, 2.0],
      }

      const result = normalizeSequence(negSeq)

      expect(result).toBeDefined()
      expect(result.values.length).toBe(4)
    })
  })

  describe('batchCompareSequences', () => {
    it('should compare multiple sequences', () => {
      const sequences = [sampleSequence1, sampleSequence2, sampleSequence3]
      const result = batchCompareSequences(sequences)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      // For 3 sequences, we expect 3 pairwise comparisons
      expect(result.length).toBe(3)
    })

    it('should contain valid comparison results', () => {
      const sequences = [sampleSequence1, sampleSequence2]
      const result = batchCompareSequences(sequences)

      expect(result.length).toBeGreaterThan(0)
      const comparison = result[0]

      expect(comparison.sequence1_id).toBeDefined()
      expect(comparison.sequence2_id).toBeDefined()
      expect(comparison.similarity_score).toBeGreaterThanOrEqual(0)
      expect(comparison.similarity_score).toBeLessThanOrEqual(1)
      expect(comparison.distance).toBeDefined()
    })

    it('should apply config to all comparisons', () => {
      const sequences = [sampleSequence1, sampleSequence2, sampleSequence3]
      const config: ComparisonConfig = {
        threshold: 0.7,
        similarity_method: 'euclidean',
        normalize: true,
      }

      const result = batchCompareSequences(sequences, config)

      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle single sequence', () => {
      const sequences = [sampleSequence1]
      const result = batchCompareSequences(sequences)

      // Single sequence should produce 0 comparisons
      expect(result.length).toBe(0)
    })

    it('should handle two sequences', () => {
      const sequences = [sampleSequence1, sampleSequence2]
      const result = batchCompareSequences(sequences)

      // Two sequences should produce 1 comparison
      expect(result.length).toBe(1)
    })
  })

  describe('TemporalCompare class', () => {
    let instance: TemporalCompare

    beforeAll(() => {
      instance = new TemporalCompare()
    })

    it('should create instance successfully', () => {
      expect(instance).toBeDefined()
      expect(instance).toBeInstanceOf(TemporalCompare)
    })

    it('should compare sequences via class method', () => {
      const result = instance.compare(sampleSequence1, sampleSequence2)

      expect(result).toBeDefined()
      expect(result.similarity_score).toBeGreaterThan(0)
    })

    it('should detect patterns via class method', () => {
      const result = instance.detectPattern(sampleSequence3, 2)

      expect(result).toBeDefined()
      expect(result.pattern_found).toBeDefined()
    })

    it('should analyze sequences via class method', () => {
      const result = instance.analyze(sampleSequence1)

      expect(result).toBeDefined()
      expect(result.mean).toBeDefined()
    })

    it('should normalize sequences via class method', () => {
      const result = instance.normalize(sampleSequence1)

      expect(result).toBeDefined()
      expect(result.values).toBeDefined()
    })

    it('should batch compare via class method', () => {
      const sequences = [sampleSequence1, sampleSequence2]
      const result = instance.batchCompare(sequences)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should chain multiple operations', () => {
      const normalized = instance.normalize(sampleSequence1)
      const analyzed = instance.analyze(normalized)

      expect(analyzed).toBeDefined()
      expect(analyzed.mean).toBeDefined()
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle sequences with large values', () => {
      const largeSeq: TemporalSequence = {
        id: 'large',
        timestamps: [0, 1, 2],
        values: [1000000.0, 2000000.0, 3000000.0],
      }

      const result = analyzeSequence(largeSeq)

      expect(result).toBeDefined()
      expect(result.mean).toBeDefined()
    })

    it('should handle sequences with small values', () => {
      const smallSeq: TemporalSequence = {
        id: 'small',
        timestamps: [0, 1, 2],
        values: [0.001, 0.002, 0.003],
      }

      const result = analyzeSequence(smallSeq)

      expect(result).toBeDefined()
      expect(result.mean).toBeGreaterThan(0)
    })

    it('should handle mixed positive and negative values', () => {
      const mixedSeq: TemporalSequence = {
        id: 'mixed',
        timestamps: [0, 1, 2, 3],
        values: [-10.0, -5.0, 5.0, 10.0],
      }

      const result = analyzeSequence(mixedSeq)

      expect(result).toBeDefined()
      expect(result.mean).toBe(0)
    })

    it('should handle zero values', () => {
      const zeroSeq: TemporalSequence = {
        id: 'zeros',
        timestamps: [0, 1, 2],
        values: [0.0, 0.0, 0.0],
      }

      const result = analyzeSequence(zeroSeq)

      expect(result).toBeDefined()
      expect(result.mean).toBe(0)
      expect(result.std_dev).toBe(0)
    })
  })

  describe('Type safety', () => {
    it('should maintain type information in results', () => {
      const result: ComparisonResult = compareSequences(sampleSequence1, sampleSequence2)

      expect(typeof result.similarity_score).toBe('number')
      expect(typeof result.sequence1_id).toBe('string')
      expect(typeof result.pattern_match).toBe('boolean')
    })

    it('should maintain type information in pattern results', () => {
      const result: PatternResult = detectPattern(sampleSequence3, 2)

      expect(typeof result.pattern_found).toBe('boolean')
      expect(typeof result.pattern_confidence).toBe('number')
      expect(Array.isArray(result.occurrences)).toBe(true)
    })

    it('should maintain type information in statistics results', () => {
      const result: StatisticsResult = analyzeSequence(sampleSequence1)

      expect(typeof result.mean).toBe('number')
      expect(typeof result.variance).toBe('number')
      expect(typeof result.std_dev).toBe('number')
      expect(typeof result.length).toBe('number')
    })
  })

  describe('Performance and stress tests', () => {
    it('should handle large sequences', () => {
      const largeSeq: TemporalSequence = {
        id: 'large-stress',
        timestamps: Array.from({ length: 1000 }, (_, i) => i),
        values: Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.1)),
      }

      const start = Date.now()
      const result = analyzeSequence(largeSeq)
      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle multiple rapid comparisons', () => {
      for (let i = 0; i < 10; i++) {
        const result = compareSequences(sampleSequence1, sampleSequence2)
        expect(result).toBeDefined()
      }
    })
  })
})
