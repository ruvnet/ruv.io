// Midstreamer Temporal Compare
// TypeScript bindings for the napi-rs module

export interface TemporalSequence {
  id: string
  timestamps: number[]
  values: number[]
  metadata?: Record<string, any>
}

export interface ComparisonConfig {
  threshold?: number
  similarity_method?: 'euclidean' | 'cosine'
  normalize?: boolean
}

export interface ComparisonResult {
  sequence1_id: string
  sequence2_id: string
  similarity_score: number
  distance: number
  pattern_match: boolean
  alignment_offset: number
  metadata?: Record<string, any>
}

export interface PatternResult {
  sequence_id: string
  pattern_found: boolean
  occurrences: number[]
  pattern_confidence: number
  matched_indices: number[]
}

export interface StatisticsResult {
  sequence_id: string
  mean: number
  variance: number
  std_dev: number
  min_value: number
  max_value: number
  length: number
}

/**
 * Native bindings from midstreamer_temporal_compare Rust module
 */
let temporalCompare: any

try {
  // Load the native module via platform loader
  temporalCompare = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native midstreamer_temporal_compare module not loaded. Build the project first.')
  temporalCompare = null
}

/**
 * Compare two temporal sequences
 * @param sequence1 - First temporal sequence
 * @param sequence2 - Second temporal sequence
 * @param config - Comparison configuration
 * @returns Comparison result with similarity metrics
 */
export function compareSequences(
  sequence1: TemporalSequence,
  sequence2: TemporalSequence,
  config?: ComparisonConfig
): ComparisonResult {
  if (!temporalCompare) {
    throw new Error('Native module not available')
  }

  const sequence1Json = JSON.stringify(sequence1)
  const sequence2Json = JSON.stringify(sequence2)
  const configJson = JSON.stringify(config || {})

  const result = temporalCompare.compareSequences(sequence1Json, sequence2Json, configJson)

  return JSON.parse(result)
}

/**
 * Detect repeating patterns in a temporal sequence
 * @param sequence - Temporal sequence to analyze
 * @param patternLength - Length of pattern to detect
 * @returns Pattern detection result
 */
export function detectPattern(sequence: TemporalSequence, patternLength: number): PatternResult {
  if (!temporalCompare) {
    throw new Error('Native module not available')
  }

  const sequenceJson = JSON.stringify(sequence)
  const result = temporalCompare.detectPattern(sequenceJson, patternLength)

  return JSON.parse(result)
}

/**
 * Analyze temporal sequence statistics
 * @param sequence - Temporal sequence to analyze
 * @returns Statistical analysis of the sequence
 */
export function analyzeSequence(sequence: TemporalSequence): StatisticsResult {
  if (!temporalCompare) {
    throw new Error('Native module not available')
  }

  const sequenceJson = JSON.stringify(sequence)
  const result = temporalCompare.analyzeSequence(sequenceJson)

  return JSON.parse(result)
}

/**
 * Normalize a temporal sequence
 * @param sequence - Temporal sequence to normalize
 * @returns Normalized temporal sequence
 */
export function normalizeSequence(sequence: TemporalSequence): TemporalSequence {
  if (!temporalCompare) {
    throw new Error('Native module not available')
  }

  const sequenceJson = JSON.stringify(sequence)
  const result = temporalCompare.normalizeSequence(sequenceJson)

  return JSON.parse(result)
}

/**
 * Batch compare multiple sequences
 * @param sequences - Array of temporal sequences
 * @param config - Comparison configuration
 * @returns Array of pairwise comparison results
 */
export function batchCompareSequences(
  sequences: TemporalSequence[],
  config?: ComparisonConfig
): ComparisonResult[] {
  if (!temporalCompare) {
    throw new Error('Native module not available')
  }

  const sequencesJson = JSON.stringify(sequences)
  const configJson = JSON.stringify(config || {})

  const result = temporalCompare.batchCompareSequences(sequencesJson, configJson)

  return JSON.parse(result)
}

/**
 * Create a new TemporalCompare instance for advanced use cases
 */
export class TemporalCompare {
  /**
   * Create a new TemporalCompare instance
   */
  constructor() {
    if (!temporalCompare) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Compare two temporal sequences
   */
  compare(
    sequence1: TemporalSequence,
    sequence2: TemporalSequence,
    config?: ComparisonConfig
  ): ComparisonResult {
    return compareSequences(sequence1, sequence2, config)
  }

  /**
   * Detect patterns in a sequence
   */
  detectPattern(sequence: TemporalSequence, patternLength: number): PatternResult {
    return detectPattern(sequence, patternLength)
  }

  /**
   * Analyze sequence statistics
   */
  analyze(sequence: TemporalSequence): StatisticsResult {
    return analyzeSequence(sequence)
  }

  /**
   * Normalize a sequence
   */
  normalize(sequence: TemporalSequence): TemporalSequence {
    return normalizeSequence(sequence)
  }

  /**
   * Batch compare multiple sequences
   */
  batchCompare(sequences: TemporalSequence[], config?: ComparisonConfig): ComparisonResult[] {
    return batchCompareSequences(sequences, config)
  }
}

// Export all types and functions
export default {
  compareSequences,
  detectPattern,
  analyzeSequence,
  normalizeSequence,
  batchCompareSequences,
  TemporalCompare,
}
