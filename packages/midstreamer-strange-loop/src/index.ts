// Midstreamer Strange Loop - Self-referential systems and meta-learning
// TypeScript bindings for the napi-rs module

export interface LoopState {
  id: string
  depth: number
  data: any
}

export interface StrangeLoopConfig {
  max_depth?: number
  enable_recursion?: boolean
  timeout_ms?: number
  cache_enabled?: boolean
}

export interface ProcessedLoop {
  id: string
  iterations: number
  depth_reached: number
  result: any
  processing_time_ms: number
  timestamp: string
}

export interface MetaContext {
  id: string
  level: number
  content: string
  self_reference?: MetaContext
  metadata?: Record<string, any>
}

export interface MetaLearningResult {
  id: string
  levels_analyzed: number
  self_references_found: number
  insights: string[]
  confidence_score: number
  timestamp: string
}

export interface PatternDetectionResult {
  patterns: string[]
  cycle_detected: boolean
  confidence: number
  timestamp: string
}

export interface ParadoxResolution {
  resolution_steps: Array<{
    step: number
    value: any
  }>
  converged: boolean
  final_value: any
  timestamp: string
}

/**
 * Native bindings from midstreamer_strange_loop Rust module
 */
let strangeLoop: any

try {
  // Load the native module via platform loader
  strangeLoop = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native midstreamer_strange_loop module not loaded. Build the project first.')
  strangeLoop = null
}

/**
 * Process a self-referential loop structure
 * @param loopState - Loop state object to process
 * @param config - Configuration options
 * @returns Processed loop with results
 */
export function processStrangeLoop(
  loopState: LoopState,
  config?: StrangeLoopConfig
): ProcessedLoop {
  if (!strangeLoop) {
    throw new Error('Native module not available')
  }

  const loopJson = JSON.stringify(loopState)
  const configJson = JSON.stringify(config || {})
  const result = strangeLoop.processStrangeLoop(loopJson, configJson)

  return JSON.parse(result)
}

/**
 * Analyze meta-learning with self-referential structure
 * @param context - Meta context to analyze
 * @returns Meta-learning analysis results
 */
export function analyzeMetaLearning(context: MetaContext): MetaLearningResult {
  if (!strangeLoop) {
    throw new Error('Native module not available')
  }

  const contextJson = JSON.stringify(context)
  const result = strangeLoop.analyzeMetaLearning(contextJson)

  return JSON.parse(result)
}

/**
 * Detect strange loop patterns in data
 * @param data - Data to analyze
 * @returns Pattern detection results
 */
export function detectPatterns(data: any): PatternDetectionResult {
  if (!strangeLoop) {
    throw new Error('Native module not available')
  }

  const dataJson = JSON.stringify(data)
  const result = strangeLoop.detectPatterns(dataJson)

  return JSON.parse(result)
}

/**
 * Extract self-referential layers from nested structure
 * @param data - Data with nested structure
 * @returns Array of extracted layers
 */
export function extractLayers(data: any): any[] {
  if (!strangeLoop) {
    throw new Error('Native module not available')
  }

  const dataJson = JSON.stringify(data)
  const result = strangeLoop.extractLayers(dataJson)

  return JSON.parse(result)
}

/**
 * Resolve strange loop paradox with iterative approximation
 * @param loopData - Loop data containing paradox
 * @returns Paradox resolution steps and result
 */
export function resolveParadox(loopData: any): ParadoxResolution {
  if (!strangeLoop) {
    throw new Error('Native module not available')
  }

  const loopDataJson = JSON.stringify(loopData)
  const result = strangeLoop.resolveParadox(loopDataJson)

  return JSON.parse(result)
}

/**
 * Create a new MidstreamerStrangeLoop instance for advanced use cases
 */
export class MidstreamerStrangeLoop {
  private config: StrangeLoopConfig

  /**
   * Create a new MidstreamerStrangeLoop instance
   * @param config - Configuration options
   */
  constructor(config?: StrangeLoopConfig) {
    if (!strangeLoop) {
      throw new Error('Native module not available')
    }

    this.config = config || {}
  }

  /**
   * Process a self-referential loop
   * @param loopState - Loop state to process
   * @returns Processed loop result
   */
  process(loopState: LoopState): ProcessedLoop {
    return processStrangeLoop(loopState, this.config)
  }

  /**
   * Analyze meta-learning
   * @param context - Meta context to analyze
   * @returns Meta-learning analysis results
   */
  analyzeMeta(context: MetaContext): MetaLearningResult {
    return analyzeMetaLearning(context)
  }

  /**
   * Detect patterns in data
   * @param data - Data to analyze
   * @returns Pattern detection results
   */
  detectPatterns(data: any): PatternDetectionResult {
    return detectPatterns(data)
  }

  /**
   * Extract layers from nested structure
   * @param data - Data with nested structure
   * @returns Array of extracted layers
   */
  extractLayers(data: any): any[] {
    return extractLayers(data)
  }

  /**
   * Resolve paradox
   * @param loopData - Loop data containing paradox
   * @returns Paradox resolution result
   */
  resolveParadox(loopData: any): ParadoxResolution {
    return resolveParadox(loopData)
  }

  /**
   * Batch process multiple loops
   * @param loopStates - Array of loop states
   * @returns Array of processed loops
   */
  batchProcess(loopStates: LoopState[]): ProcessedLoop[] {
    return loopStates.map((state) => this.process(state))
  }
}

// Export all types and functions
export default {
  processStrangeLoop,
  analyzeMetaLearning,
  detectPatterns,
  extractLayers,
  resolveParadox,
  MidstreamerStrangeLoop,
}
