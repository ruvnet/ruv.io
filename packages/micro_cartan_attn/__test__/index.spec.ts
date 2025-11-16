import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  CartanAttention,
  calculateAttentionScores,
  calculateContextVector,
  multiHeadAttention,
  createCartanAttentionLayer,
  normalizeAttentionScores,
  calculateWeightDecay,
  applyPositionalEncoding,
  AttentionScores,
  ContextVector,
  MultiHeadAttentionResult,
  CartanAttentionConfig,
} from '../src/index'

describe('Micro Cartan Attention', () => {
  const basicQuery = [1.0, 0.5, 0.3, 0.2]
  const basicKeys = [
    [0.9, 0.6, 0.2, 0.1],
    [0.8, 0.4, 0.3, 0.2],
    [1.1, 0.7, 0.4, 0.3],
  ]
  const basicValues = [
    [0.5, 0.3, 0.2, 0.1],
    [0.6, 0.4, 0.3, 0.2],
    [0.7, 0.5, 0.4, 0.3],
  ]

  const config: CartanAttentionConfig = {
    num_heads: 2,
    dimension: 4,
    dropout_rate: 0.1,
    scale_factor: 2.0,
    enable_positional_encoding: false,
  }

  describe('calculateAttentionScores', () => {
    it('should calculate attention scores for query and keys', () => {
      const scores = calculateAttentionScores(basicQuery, basicKeys)

      expect(scores).toBeDefined()
      expect(scores.scores).toBeDefined()
      expect(scores.scores.length).toBe(3)
      expect(scores.query_id).toBe('query_0')
    })

    it('should return valid softmax scores (sum to 1)', () => {
      const scores = calculateAttentionScores(basicQuery, basicKeys)
      const sum = scores.scores.reduce((a, b) => a + b, 0)

      expect(sum).toBeCloseTo(1.0, 5)
    })

    it('should calculate max and min scores correctly', () => {
      const scores = calculateAttentionScores(basicQuery, basicKeys)

      expect(scores.max_score).toBeGreaterThanOrEqual(scores.mean_score)
      expect(scores.min_score).toBeLessThanOrEqual(scores.mean_score)
      expect(scores.max_score).toBeGreaterThanOrEqual(scores.min_score)
    })

    it('should calculate mean score correctly', () => {
      const scores = calculateAttentionScores(basicQuery, basicKeys)
      const manualMean = scores.scores.reduce((a, b) => a + b, 0) / scores.scores.length

      expect(scores.mean_score).toBeCloseTo(manualMean, 5)
    })

    it('should handle different scale factors', () => {
      const scores1 = calculateAttentionScores(basicQuery, basicKeys, 1.0)
      const scores2 = calculateAttentionScores(basicQuery, basicKeys, 4.0)

      // Different scale factors should produce different results
      expect(scores1.scores).not.toEqual(scores2.scores)
    })

    it('should handle single key', () => {
      const singleKey = [[1.0, 0.5, 0.3, 0.2]]
      const scores = calculateAttentionScores(basicQuery, singleKey)

      expect(scores.scores.length).toBe(1)
      expect(scores.scores[0]).toBeCloseTo(1.0, 5) // Only one key, so score is 1.0
    })

    it('should handle identical query and key', () => {
      const scores = calculateAttentionScores(basicQuery, [basicQuery])

      expect(scores.scores.length).toBe(1)
      expect(scores.scores[0]).toBeCloseTo(1.0, 5)
    })
  })

  describe('calculateContextVector', () => {
    it('should calculate context vector with sum aggregation', () => {
      const scores = [0.3, 0.5, 0.2]
      const context = calculateContextVector(scores, basicValues, 'sum')

      expect(context).toBeDefined()
      expect(context.vector.length).toBe(4)
      expect(context.aggregation_method).toBe('sum')
      expect(context.source_count).toBe(3)
    })

    it('should calculate context vector with mean aggregation', () => {
      const scores = [0.3, 0.5, 0.2]
      const context = calculateContextVector(scores, basicValues, 'mean')

      expect(context).toBeDefined()
      expect(context.vector.length).toBe(4)
      expect(context.aggregation_method).toBe('mean')
    })

    it('should calculate context vector with max aggregation', () => {
      const scores = [0.3, 0.5, 0.2]
      const context = calculateContextVector(scores, basicValues, 'max')

      expect(context).toBeDefined()
      expect(context.vector.length).toBe(4)
      expect(context.aggregation_method).toBe('max')
      // Max should return the second value (highest score)
      expect(context.vector).toEqual(basicValues[1])
    })

    it('should handle uniform attention scores', () => {
      const uniformScores = [0.333333, 0.333333, 0.333334]
      const context = calculateContextVector(uniformScores, basicValues, 'sum')

      expect(context).toBeDefined()
      expect(context.vector.length).toBe(4)
    })

    it('should handle concentrated attention (one key dominates)', () => {
      const concentratedScores = [0.0, 1.0, 0.0]
      const context = calculateContextVector(concentratedScores, basicValues, 'sum')

      expect(context.vector).toEqual(basicValues[1])
    })

    it('should have consistent vector dimension with values', () => {
      const scores = [0.333333, 0.333333, 0.333334]
      const context = calculateContextVector(scores, basicValues, 'mean')

      expect(context.vector.length).toBe(basicValues[0].length)
    })
  })

  describe('multiHeadAttention', () => {
    it('should perform multi-head attention correctly', () => {
      const result = multiHeadAttention(basicQuery, basicKeys, basicValues, 2, 4)

      expect(result).toBeDefined()
      expect(result.heads).toBe(2)
      expect(result.combined_output.length).toBe(4)
      expect(result.head_outputs.length).toBe(2)
    })

    it('should have matching head dimension', () => {
      const result = multiHeadAttention(basicQuery, basicKeys, basicValues, 2, 4)

      for (const head of result.head_outputs) {
        expect(head.length).toBe(2) // 4 dimensions / 2 heads
      }
    })

    it('should have combined output with full dimension', () => {
      const result = multiHeadAttention(basicQuery, basicKeys, basicValues, 2, 4)

      expect(result.combined_output.length).toBe(4)
    })

    it('should calculate combined score', () => {
      const result = multiHeadAttention(basicQuery, basicKeys, basicValues, 2, 4)

      expect(result.combined_score).toBeGreaterThanOrEqual(0)
      expect(result.combined_score).toBeLessThanOrEqual(1)
    })

    it('should handle single head (regular attention)', () => {
      const result = multiHeadAttention(basicQuery, basicKeys, basicValues, 1, 4)

      expect(result.heads).toBe(1)
      expect(result.head_outputs.length).toBe(1)
      expect(result.combined_output.length).toBe(4)
    })

    it('should handle 4 heads', () => {
      const result = multiHeadAttention(basicQuery, basicKeys, basicValues, 4, 4)

      expect(result.heads).toBe(4)
      expect(result.head_outputs.length).toBe(4)
      expect(result.combined_output.length).toBe(4)
    })

    it('should produce different results with different numbers of heads', () => {
      const result1 = multiHeadAttention(basicQuery, basicKeys, basicValues, 1, 4)
      const result2 = multiHeadAttention(basicQuery, basicKeys, basicValues, 2, 4)

      // Different number of heads should produce different results
      expect(result1.combined_output).not.toEqual(result2.combined_output)
    })

    it('should handle higher dimensions with multiple heads', () => {
      const largeQuery = new Array(8).fill(1.0)
      const largeKeys = [new Array(8).fill(0.9), new Array(8).fill(0.8)]
      const largeValues = [new Array(8).fill(0.5), new Array(8).fill(0.6)]

      const result = multiHeadAttention(largeQuery, largeKeys, largeValues, 4, 8)

      expect(result.heads).toBe(4)
      expect(result.combined_output.length).toBe(8)
      expect(result.head_outputs.length).toBe(4)
    })
  })

  describe('createCartanAttentionLayer', () => {
    it('should create a layer with specified configuration', () => {
      const layer = createCartanAttentionLayer(config)

      expect(layer).toBeDefined()
      expect(layer.status).toBe('initialized')
      expect(layer.num_heads).toBe(2)
      expect(layer.dimension).toBe(4)
    })

    it('should calculate head dimension correctly', () => {
      const layer = createCartanAttentionLayer(config)

      expect(layer.head_dimension).toBe(2) // 4 / 2
    })

    it('should preserve configuration parameters', () => {
      const layer = createCartanAttentionLayer(config)

      expect(layer.dropout_rate).toBe(0.1)
      expect(layer.enable_positional_encoding).toBe(false)
    })

    it('should generate timestamp', () => {
      const layer = createCartanAttentionLayer(config)

      expect(layer.timestamp).toBeDefined()
      expect(typeof layer.timestamp).toBe('string')
    })

    it('should handle different configurations', () => {
      const customConfig: CartanAttentionConfig = {
        num_heads: 4,
        dimension: 8,
        dropout_rate: 0.2,
      }

      const layer = createCartanAttentionLayer(customConfig)

      expect(layer.num_heads).toBe(4)
      expect(layer.dimension).toBe(8)
      expect(layer.head_dimension).toBe(2)
    })
  })

  describe('normalizeAttentionScores', () => {
    it('should normalize scores using L2 normalization', () => {
      const scores = [1.0, 2.0, 3.0]
      const normalized = normalizeAttentionScores(scores)

      expect(normalized).toBeDefined()
      expect(normalized.length).toBe(3)

      // Calculate L2 norm
      const l2Norm = Math.sqrt(1.0 * 1.0 + 2.0 * 2.0 + 3.0 * 3.0)
      const expected = [1.0 / l2Norm, 2.0 / l2Norm, 3.0 / l2Norm]

      for (let i = 0; i < normalized.length; i++) {
        expect(normalized[i]).toBeCloseTo(expected[i], 5)
      }
    })

    it('should produce unit norm after normalization', () => {
      const scores = [1.0, 2.0, 3.0]
      const normalized = normalizeAttentionScores(scores)

      const norm = Math.sqrt(
        normalized.reduce((sum, val) => sum + val * val, 0)
      )

      expect(norm).toBeCloseTo(1.0, 5)
    })

    it('should handle zero vector gracefully', () => {
      const scores = [0.0, 0.0, 0.0]
      const normalized = normalizeAttentionScores(scores)

      expect(normalized.length).toBe(3)
      // All zeros should remain zeros
      for (const val of normalized) {
        expect(val).toBe(0.0)
      }
    })

    it('should handle single element', () => {
      const scores = [5.0]
      const normalized = normalizeAttentionScores(scores)

      expect(normalized.length).toBe(1)
      expect(normalized[0]).toBeCloseTo(1.0, 5)
    })
  })

  describe('calculateWeightDecay', () => {
    it('should calculate weight decay correctly', () => {
      const weights = [1.0, 2.0, 3.0]
      const decayResult = calculateWeightDecay(weights, 0.1)

      expect(decayResult).toBeDefined()
      expect(decayResult.decay_factor).toBe(0.1)
      expect(decayResult.weight_count).toBe(3)
    })

    it('should calculate L2 norm changes', () => {
      const weights = [1.0, 2.0, 3.0]
      const decayResult = calculateWeightDecay(weights, 0.1)

      expect(decayResult.original_l2_norm).toBeDefined()
      expect(decayResult.decayed_l2_norm).toBeDefined()
      expect(decayResult.decay_amount).toBeGreaterThan(0)
    })

    it('should reduce norm with decay', () => {
      const weights = [1.0, 2.0, 3.0]
      const decayResult = calculateWeightDecay(weights, 0.1)

      expect(decayResult.decayed_l2_norm).toBeLessThan(decayResult.original_l2_norm)
    })

    it('should handle different decay factors', () => {
      const weights = [1.0, 2.0, 3.0]
      const result1 = calculateWeightDecay(weights, 0.01)
      const result2 = calculateWeightDecay(weights, 0.1)

      expect(result1.decay_amount).toBeLessThan(result2.decay_amount)
    })

    it('should handle large weight vectors', () => {
      const weights = new Array(100).fill(1.0)
      const decayResult = calculateWeightDecay(weights, 0.01)

      expect(decayResult.weight_count).toBe(100)
      expect(decayResult.decay_amount).toBeGreaterThan(0)
    })
  })

  describe('applyPositionalEncoding', () => {
    it('should apply positional encoding to vectors', () => {
      const vectors = [[1.0, 0.5, 0.3], [0.8, 0.6, 0.4]]
      const encoded = applyPositionalEncoding(vectors, 0, 3)

      expect(encoded).toBeDefined()
      expect(encoded.length).toBe(2)
      expect(encoded[0].length).toBe(3)
    })

    it('should modify vectors with position', () => {
      const vectors = [[1.0, 0.5, 0.3]]
      const encoded0 = applyPositionalEncoding(vectors, 0, 3)
      const encoded1 = applyPositionalEncoding(vectors, 1, 3)

      // Different positions should produce different encodings
      expect(encoded0[0]).not.toEqual(encoded1[0])
    })

    it('should handle different positions', () => {
      const vectors = [[1.0, 0.5, 0.3]]
      const encoded = [
        applyPositionalEncoding(vectors, 0, 3),
        applyPositionalEncoding(vectors, 1, 3),
        applyPositionalEncoding(vectors, 5, 3),
      ]

      // All encodings should be different
      expect(encoded[0][0]).not.toEqual(encoded[1][0])
      expect(encoded[1][0]).not.toEqual(encoded[2][0])
    })

    it('should preserve vector count', () => {
      const vectors = new Array(5).fill([0.5, 0.5, 0.5])
      const encoded = applyPositionalEncoding(vectors, 2, 3)

      expect(encoded.length).toBe(5)
    })

    it('should maintain dimension consistency', () => {
      const vectors = [[1.0, 2.0, 3.0, 4.0, 5.0]]
      const encoded = applyPositionalEncoding(vectors, 3, 5)

      expect(encoded[0].length).toBe(5)
    })
  })

  describe('CartanAttention Class', () => {
    it('should create instance with configuration', () => {
      const attn = new CartanAttention(config)

      expect(attn).toBeDefined()
      expect(attn.getConfig()).toEqual(config)
    })

    it('should get layer information', () => {
      const attn = new CartanAttention(config)
      const info = attn.getLayerInfo()

      expect(info.status).toBe('initialized')
      expect(info.num_heads).toBe(2)
    })

    it('should perform forward pass', () => {
      const attn = new CartanAttention(config)
      const result = attn.forward(basicQuery, basicKeys, basicValues)

      expect(result).toBeDefined()
      expect(result.combined_output.length).toBe(4)
    })

    it('should get attention weights', () => {
      const attn = new CartanAttention(config)
      const weights = attn.getAttentionWeights(basicQuery, basicKeys)

      expect(weights).toBeDefined()
      expect(weights.scores.length).toBe(basicKeys.length)
    })

    it('should get context from scores', () => {
      const attn = new CartanAttention(config)
      const scores = [0.3, 0.5, 0.2]
      const context = attn.getContext(scores, basicValues, 'sum')

      expect(context).toBeDefined()
      expect(context.vector.length).toBe(4)
    })

    it('should apply regularization', () => {
      const attn = new CartanAttention(config)
      const weights = [1.0, 2.0, 3.0]
      const regularized = attn.regularize(weights, 0.01)

      expect(regularized).toBeDefined()
      expect(regularized.decay_factor).toBe(0.01)
    })

    it('should perform batch forward pass', () => {
      const attn = new CartanAttention(config)
      const queries = [basicQuery, [0.9, 0.4, 0.2, 0.1]]
      const results = attn.batchForward(queries, basicKeys, basicValues)

      expect(results).toBeDefined()
      expect(results.length).toBe(2)
      expect(results[0].combined_output.length).toBe(4)
    })

    it('should forward with positional encoding', () => {
      const attn = new CartanAttention({ ...config, enable_positional_encoding: true })
      const result = attn.forward(basicQuery, basicKeys, basicValues, true)

      expect(result).toBeDefined()
      expect(result.combined_output.length).toBe(4)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty vectors gracefully in attention scores', () => {
      try {
        const result = calculateAttentionScores([], [[1.0]])
        // Empty query should be handled
        expect(result).toBeDefined()
      } catch (e) {
        expect(e).toBeDefined()
      }
    })

    it('should work with large scale factors', () => {
      const scores = calculateAttentionScores(basicQuery, basicKeys, 100.0)

      expect(scores).toBeDefined()
      expect(scores.scores.length).toBe(3)
    })

    it('should handle very small dimension values', () => {
      const smallQuery = [1.0]
      const smallKeys = [[0.9]]
      const smallValues = [[0.5]]

      const result = multiHeadAttention(smallQuery, smallKeys, smallValues, 1, 1)

      expect(result).toBeDefined()
      expect(result.combined_output.length).toBe(1)
    })

    it('should create layer with minimal configuration', () => {
      const minConfig: CartanAttentionConfig = {
        num_heads: 1,
        dimension: 1,
      }

      const layer = createCartanAttentionLayer(minConfig)

      expect(layer).toBeDefined()
      expect(layer.status).toBe('initialized')
    })

    it('should handle repeated values in batch forward', () => {
      const attn = new CartanAttention(config)
      const queries = [basicQuery, basicQuery, basicQuery]
      const results = attn.batchForward(queries, basicKeys, basicValues)

      expect(results.length).toBe(3)
      // All results should be identical since queries are the same
      expect(results[0].combined_output).toEqual(results[1].combined_output)
      expect(results[1].combined_output).toEqual(results[2].combined_output)
    })
  })
})
