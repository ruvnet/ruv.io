// FACT Tools - Fast Augmented Context Tools
// TypeScript bindings for the napi-rs module

export interface Context {
  id: string
  content: string
  metadata?: Record<string, any>
}

export interface OptimizationOptions {
  remove_duplicates?: boolean
  compress_whitespace?: boolean
  remove_empty_lines?: boolean
  max_length?: number
}

export interface ProcessedContext {
  id: string
  original_length: number
  processed_content: string
  token_count: number
  metadata?: Record<string, any>
  timestamp: string
}

export interface OptimizationResult {
  id: string
  original_size: number
  optimized_size: number
  compression_ratio: number
  optimized_content: string
  metadata?: Record<string, any>
  timestamp: string
}

/**
 * Native bindings from fact_tools Rust module
 */
let factTools: any

try {
  // Load the native module via platform loader
  factTools = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native fact_tools module not loaded. Build the project first.')
  factTools = null
}

/**
 * Process context data and extract key information
 * @param context - Context object to process
 * @returns Processed context with metadata
 */
export function processContext(context: Context): ProcessedContext {
  if (!factTools) {
    throw new Error('Native module not available')
  }

  const contextJson = JSON.stringify(context)
  const result = factTools.processContext(contextJson)

  return JSON.parse(result)
}

/**
 * Optimize context for better performance and reduced size
 * @param context - Context object to optimize
 * @param options - Optimization options
 * @returns Optimization result with metrics
 */
export function optimizeContext(
  context: Context,
  options?: OptimizationOptions
): OptimizationResult {
  if (!factTools) {
    throw new Error('Native module not available')
  }

  const contextJson = JSON.stringify(context)
  const optionsJson = JSON.stringify(options || {})
  const result = factTools.optimizeContext(contextJson, optionsJson)

  return JSON.parse(result)
}

/**
 * Batch process multiple contexts
 * @param contexts - Array of context objects
 * @returns Array of processed contexts
 */
export function batchProcessContexts(contexts: Context[]): ProcessedContext[] {
  if (!factTools) {
    throw new Error('Native module not available')
  }

  const contextsJson = JSON.stringify(contexts)
  const result = factTools.batchProcessContexts(contextsJson)

  return JSON.parse(result)
}

/**
 * Extract key phrases from context
 * @param context - Context object
 * @param maxPhrases - Maximum number of phrases to extract
 * @returns Array of extracted phrases
 */
export function extractKeyPhrases(context: Context, maxPhrases: number = 10): string[] {
  if (!factTools) {
    throw new Error('Native module not available')
  }

  const contextJson = JSON.stringify(context)
  const result = factTools.extractKeyPhrases(contextJson, maxPhrases)

  return JSON.parse(result)
}

/**
 * Calculate similarity between two contexts
 * @param context1 - First context
 * @param context2 - Second context
 * @returns Similarity score (0.0 to 1.0)
 */
export function calculateSimilarity(context1: Context, context2: Context): number {
  if (!factTools) {
    throw new Error('Native module not available')
  }

  const context1Json = JSON.stringify(context1)
  const context2Json = JSON.stringify(context2)

  return factTools.calculateSimilarity(context1Json, context2Json)
}

/**
 * Create a new FactTools instance for advanced use cases
 */
export class FactTools {
  /**
   * Create a new FactTools instance
   */
  constructor() {
    if (!factTools) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Process a single context
   */
  process(context: Context): ProcessedContext {
    return processContext(context)
  }

  /**
   * Optimize a single context
   */
  optimize(context: Context, options?: OptimizationOptions): OptimizationResult {
    return optimizeContext(context, options)
  }

  /**
   * Process multiple contexts
   */
  processBatch(contexts: Context[]): ProcessedContext[] {
    return batchProcessContexts(contexts)
  }

  /**
   * Extract key phrases
   */
  extractPhrases(context: Context, maxPhrases?: number): string[] {
    return extractKeyPhrases(context, maxPhrases)
  }

  /**
   * Calculate similarity between contexts
   */
  similarity(context1: Context, context2: Context): number {
    return calculateSimilarity(context1, context2)
  }
}

// Export all types and functions
export default {
  processContext,
  optimizeContext,
  batchProcessContexts,
  extractKeyPhrases,
  calculateSimilarity,
  FactTools,
}
