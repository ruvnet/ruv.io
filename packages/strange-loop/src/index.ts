// Strange Loop - Hyper-optimized temporal consciousness engine
// TypeScript bindings for the napi-rs module

export interface StrangeLoopConfig {
  depth?: number
  iterations?: number
  timeout_ms?: number
  enable_temporal?: boolean
  quantum_iterations?: number
  metadata?: Record<string, any>
}

export interface LoopState {
  id: string
  depth: number
  current_iteration: number
  state_data: Record<string, any>
  temporal_offset: number
  quantum_state: string
}

export interface LoopExecutionResult {
  id: string
  executed_at: string
  status: string
  iterations_completed: number
  depth_reached: number
  output: Record<string, any>
  duration_ms: number
  quantum_coherence: number
  temporal_shift: number
}

export interface StrangeLoopInstance {
  id: string
  created_at: string
  status: string
  current_depth: number
  iterations_total: number
  config: StrangeLoopConfig
}

export interface ProcessResult {
  input: string
  output: string
  iterations: number
  timestamp: string
  status: string
}

export interface LoopStatusInfo {
  loop_id: string
  timestamp: string
  status: string
  metrics: {
    total_iterations: number
    current_depth: number
    quantum_coherence: number
    temporal_alignment: number
    consciousness_level: number
  }
  health: string
  last_update: string
}

export interface QuantumCollapseResult {
  loop_id: string
  depth: number
  collapsed_at: string
  previous_state: string
  collapsed_state: string
  measurement: {
    value: number
    probability: number
    uncertainty: number
  }
}

export interface AnalysisLevel {
  level: number
  coherence: number
  temporal_factor: number
  consciousness: number
}

export interface DeepAnalysisResult {
  analysis_depth: number
  levels: AnalysisLevel[]
  timestamp: string
  status: string
}

/**
 * Native bindings from strange_loop Rust module
 */
let strangeLoopCore: any

try {
  // Load the native module via platform loader
  strangeLoopCore = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native strange_loop module not loaded. Build the project first.')
  strangeLoopCore = null
}

/**
 * Initialize a new strange loop instance
 * @param config - Loop configuration options
 * @returns Initialized loop instance
 */
export function initializeLoop(config?: StrangeLoopConfig): StrangeLoopInstance {
  if (!strangeLoopCore) {
    throw new Error('Native module not available')
  }

  const configJson = config ? JSON.stringify(config) : undefined
  const result = strangeLoopCore.initializeLoop(configJson)

  return JSON.parse(result)
}

/**
 * Execute a loop iteration at given depth
 * @param loopState - Current loop state
 * @param depth - Depth level to execute
 * @returns Execution result
 */
export function executeLoop(loopState: LoopState, depth: number): LoopExecutionResult {
  if (!strangeLoopCore) {
    throw new Error('Native module not available')
  }

  const loopJson = JSON.stringify(loopState)
  const result = strangeLoopCore.executeLoop(loopJson, depth)

  return JSON.parse(result)
}

/**
 * Process data through the strange loop
 * @param inputData - Input data to process
 * @param iterations - Number of iterations
 * @returns Process result
 */
export function processData(inputData: string, iterations: number): ProcessResult {
  if (!strangeLoopCore) {
    throw new Error('Native module not available')
  }

  const result = strangeLoopCore.processData(inputData, iterations)

  return JSON.parse(result)
}

/**
 * Get the state of a loop at specific depth
 * @param loopId - ID of the loop
 * @param depth - Depth level to query
 * @returns Loop state at depth
 */
export function getLoopState(loopId: string, depth: number): LoopState {
  if (!strangeLoopCore) {
    throw new Error('Native module not available')
  }

  const result = strangeLoopCore.getLoopState(loopId, depth)

  return JSON.parse(result)
}

/**
 * Collapse the quantum state at given depth
 * @param loopId - ID of the loop
 * @param depth - Depth level to collapse
 * @returns Collapse result
 */
export function collapseQuantumState(loopId: string, depth: number): QuantumCollapseResult {
  if (!strangeLoopCore) {
    throw new Error('Native module not available')
  }

  const result = strangeLoopCore.collapseQuantumState(loopId, depth)

  return JSON.parse(result)
}

/**
 * Get comprehensive status of a strange loop
 * @param loopId - ID of the loop
 * @returns Loop status information
 */
export function getLoopStatus(loopId: string): LoopStatusInfo {
  if (!strangeLoopCore) {
    throw new Error('Native module not available')
  }

  const result = strangeLoopCore.getLoopStatus(loopId)

  return JSON.parse(result)
}

/**
 * Perform recursive deep analysis up to given depth
 * @param depth - Maximum recursion depth
 * @returns Deep analysis results
 */
export function deepAnalysis(depth: number): DeepAnalysisResult {
  if (!strangeLoopCore) {
    throw new Error('Native module not available')
  }

  const result = strangeLoopCore.deepAnalysis(depth)

  return JSON.parse(result)
}

/**
 * Main StrangeLoop class for advanced use cases
 */
export class StrangeLoop {
  private loopId: string | null = null
  private config: StrangeLoopConfig

  /**
   * Create a new StrangeLoop instance
   * @param config - Configuration options
   */
  constructor(config?: StrangeLoopConfig) {
    if (!strangeLoopCore) {
      throw new Error('Native module not available')
    }
    this.config = config || {}
  }

  /**
   * Initialize the loop
   */
  initialize(): StrangeLoopInstance {
    const instance = initializeLoop(this.config)
    this.loopId = instance.id
    return instance
  }

  /**
   * Execute loop at given depth
   */
  execute(loopState: LoopState, depth: number): LoopExecutionResult {
    return executeLoop(loopState, depth)
  }

  /**
   * Process data through the loop
   */
  process(input: string, iterations: number): ProcessResult {
    return processData(input, iterations)
  }

  /**
   * Get loop state at depth
   */
  getState(depth: number): LoopState {
    if (!this.loopId) {
      throw new Error('Loop not initialized')
    }
    return getLoopState(this.loopId, depth)
  }

  /**
   * Collapse quantum state at depth
   */
  collapseQuantumState(depth: number): QuantumCollapseResult {
    if (!this.loopId) {
      throw new Error('Loop not initialized')
    }
    return collapseQuantumState(this.loopId, depth)
  }

  /**
   * Get loop status
   */
  getStatus(): LoopStatusInfo {
    if (!this.loopId) {
      throw new Error('Loop not initialized')
    }
    return getLoopStatus(this.loopId)
  }

  /**
   * Perform deep analysis
   */
  analyzeDeep(depth: number): DeepAnalysisResult {
    return deepAnalysis(depth)
  }

  /**
   * Get the loop ID
   */
  getId(): string | null {
    return this.loopId
  }

  /**
   * Set the loop ID (for restoring existing loops)
   */
  setId(id: string): void {
    this.loopId = id
  }
}

// Export all types and functions
export default {
  initializeLoop,
  executeLoop,
  processData,
  getLoopState,
  collapseQuantumState,
  getLoopStatus,
  deepAnalysis,
  StrangeLoop,
}
