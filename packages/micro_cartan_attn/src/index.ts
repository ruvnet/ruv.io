// Micro Cartan Attention - TypeScript bindings for napi-rs module

export interface AttentionVector {
  id: string
  values: number[]
  dimension: number
}

export interface AttentionScores {
  query_id: string
  scores: number[]
  max_score: number
  min_score: number
  mean_score: number
}

export interface ContextVector {
  id: string
  vector: number[]
  source_count: number
  aggregation_method: string
}

export interface MultiHeadAttentionResult {
  token_id: string
  heads: number
  combined_output: number[]
  head_outputs: number[][]
  combined_score: number
}

export interface CartanAttentionConfig {
  num_heads: number
  dimension: number
  dropout_rate?: number
  scale_factor?: number
  enable_positional_encoding?: boolean
}

/**
 * Native bindings from micro_cartan_attn Rust module
 */
let cartanAttn: any

try {
  // Load the native module
  cartanAttn = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native micro_cartan_attn module not loaded. Build the project first.')
  cartanAttn = null
}

/**
 * Calculate attention scores between query and keys
 * @param query - Query vector
 * @param keys - Array of key vectors
 * @param scaleFactor - Scaling factor (typically sqrt(dimension))
 * @returns Attention scores with statistics
 */
export function calculateAttentionScores(
  query: number[],
  keys: number[][],
  scaleFactor?: number
): AttentionScores {
  if (!cartanAttn) {
    throw new Error('Native module not available')
  }

  const scale = scaleFactor ?? Math.sqrt(query.length)
  const queryJson = JSON.stringify(query)
  const keysJson = JSON.stringify(keys)

  const result = cartanAttn.calculateAttentionScores(queryJson, keysJson, scale)
  return JSON.parse(result)
}

/**
 * Calculate context vector by aggregating attention-weighted values
 * @param attentionScores - Attention scores (must be softmaxed)
 * @param values - Array of value vectors
 * @param aggregationMethod - "sum", "mean", or "max"
 * @returns Aggregated context vector
 */
export function calculateContextVector(
  attentionScores: number[],
  values: number[][],
  aggregationMethod: string = 'sum'
): ContextVector {
  if (!cartanAttn) {
    throw new Error('Native module not available')
  }

  const scoresJson = JSON.stringify(attentionScores)
  const valuesJson = JSON.stringify(values)

  const result = cartanAttn.calculateContextVector(scoresJson, valuesJson, aggregationMethod)
  return JSON.parse(result)
}

/**
 * Compute multi-head attention for a query
 * @param query - Query vector
 * @param keys - Array of key vectors
 * @param values - Array of value vectors
 * @param numHeads - Number of attention heads
 * @param dimension - Dimension of vectors
 * @returns Multi-head attention result
 */
export function multiHeadAttention(
  query: number[],
  keys: number[][],
  values: number[][],
  numHeads: number,
  dimension: number
): MultiHeadAttentionResult {
  if (!cartanAttn) {
    throw new Error('Native module not available')
  }

  const queryJson = JSON.stringify(query)
  const keysJson = JSON.stringify(keys)
  const valuesJson = JSON.stringify(values)

  const result = cartanAttn.multiHeadAttention(
    queryJson,
    keysJson,
    valuesJson,
    numHeads,
    dimension
  )
  return JSON.parse(result)
}

/**
 * Create a CartanAttention layer with specified configuration
 * @param config - Attention layer configuration
 * @returns Layer initialization result
 */
export function createCartanAttentionLayer(config: CartanAttentionConfig): any {
  if (!cartanAttn) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify({
    num_heads: config.num_heads,
    dimension: config.dimension,
    dropout_rate: config.dropout_rate ?? 0.1,
    scale_factor: config.scale_factor ?? Math.sqrt(config.dimension / config.num_heads),
    enable_positional_encoding: config.enable_positional_encoding ?? false,
  })

  const result = cartanAttn.createCartanAttentionLayer(configJson)
  return JSON.parse(result)
}

/**
 * Normalize attention scores using L2 normalization
 * @param scores - Raw attention scores
 * @returns L2-normalized scores
 */
export function normalizeAttentionScores(scores: number[]): number[] {
  if (!cartanAttn) {
    throw new Error('Native module not available')
  }

  const scoresJson = JSON.stringify(scores)
  const result = cartanAttn.normalizeAttentionScores(scoresJson)
  return JSON.parse(result)
}

/**
 * Calculate weight decay for regularization
 * @param weights - Weight vector
 * @param decayFactor - Decay factor (typically 0.01)
 * @returns Decay statistics
 */
export function calculateWeightDecay(weights: number[], decayFactor: number = 0.01): any {
  if (!cartanAttn) {
    throw new Error('Native module not available')
  }

  const weightsJson = JSON.stringify(weights)
  const result = cartanAttn.calculateWeightDecay(weightsJson, decayFactor)
  return JSON.parse(result)
}

/**
 * Apply positional encoding to attention vectors
 * @param vectors - Array of vectors
 * @param position - Position in sequence
 * @param dimension - Dimension of vectors
 * @returns Position-encoded vectors
 */
export function applyPositionalEncoding(
  vectors: number[][],
  position: number,
  dimension: number
): number[][] {
  if (!cartanAttn) {
    throw new Error('Native module not available')
  }

  const vectorsJson = JSON.stringify(vectors)
  const result = cartanAttn.applyPositionalEncoding(vectorsJson, position, dimension)
  return JSON.parse(result)
}

/**
 * Advanced CartanAttention class for managing attention layers
 */
export class CartanAttention {
  private config: CartanAttentionConfig
  private layer: any

  /**
   * Create a new CartanAttention instance
   */
  constructor(config: CartanAttentionConfig) {
    if (!cartanAttn) {
      throw new Error('Native module not available')
    }

    this.config = config
    this.layer = createCartanAttentionLayer(config)
  }

  /**
   * Get layer configuration
   */
  getConfig(): CartanAttentionConfig {
    return this.config
  }

  /**
   * Get layer details
   */
  getLayerInfo(): any {
    return this.layer
  }

  /**
   * Forward pass through attention layer
   */
  forward(
    query: number[],
    keys: number[][],
    values: number[][],
    usePositionalEncoding: boolean = false
  ): MultiHeadAttentionResult {
    let q = query
    let v = values

    if (usePositionalEncoding) {
      v = applyPositionalEncoding(values, 0, this.config.dimension)
    }

    return multiHeadAttention(q, keys, v, this.config.num_heads, this.config.dimension)
  }

  /**
   * Calculate attention weights
   */
  getAttentionWeights(query: number[], keys: number[][]): AttentionScores {
    return calculateAttentionScores(query, keys, this.layer.scale_factor)
  }

  /**
   * Get context from attention weights and values
   */
  getContext(scores: number[], values: number[][], method: string = 'sum'): ContextVector {
    return calculateContextVector(scores, values, method)
  }

  /**
   * Apply weight regularization
   */
  regularize(weights: number[], decayFactor?: number): any {
    return calculateWeightDecay(weights, decayFactor ?? 0.01)
  }

  /**
   * Batch forward pass
   */
  batchForward(
    queries: number[][],
    keys: number[][],
    values: number[][]
  ): MultiHeadAttentionResult[] {
    return queries.map((query) => this.forward(query, keys, values))
  }
}

// Export all types and functions
export default {
  calculateAttentionScores,
  calculateContextVector,
  multiHeadAttention,
  createCartanAttentionLayer,
  normalizeAttentionScores,
  calculateWeightDecay,
  applyPositionalEncoding,
  CartanAttention,
}
