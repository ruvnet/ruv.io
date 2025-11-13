// Sublinear Solver - TypeScript bindings for napi-rs module

export interface SolverConfig {
  timeout?: number
  retries?: number
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  maxConcurrency?: number
  tolerance?: number
  maxIterations?: number
}

export interface SystemMatrix {
  id: string
  dimension: number
  data: number[][]
  metadata?: Record<string, any>
}

export interface SolutionResult {
  id: string
  solution: number[]
  residual: number
  iterations: number
  converged: boolean
  elapsed_time_ms: number
  metadata?: Record<string, any>
}

export interface SystemAnalysis {
  id: string
  dimension: number
  diagonal_dominance: number
  max_norm: number
  is_diagonally_dominant: boolean
  sparsity: number
  condition_estimate: number
  timestamp: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  matrix_id: string
  dimension: number
  timestamp: string
}

export interface ProcessResult {
  id: string
  status: string
  data: Buffer
  metadata?: Record<string, any>
  timestamp: string
}

/**
 * Native bindings from sublinear Rust module
 */
let sublinear: any

try {
  // Load the native module via platform loader
  sublinear = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native sublinear module not loaded. Build the project first.')
  sublinear = null
}

/**
 * Initialize the sublinear solver
 * @param config - Configuration options
 * @returns Initialization status
 */
export function initializeSolver(config?: SolverConfig): Record<string, any> {
  if (!sublinear) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config || {})
  const result = sublinear.initializeSolver(configJson)

  return JSON.parse(result)
}

/**
 * Solve a linear system using sublinear algorithm
 * @param matrix - System matrix
 * @param rhs - Right-hand side vector
 * @returns Solution result with convergence information
 */
export function solveSystem(
  matrix: SystemMatrix,
  rhs: number[]
): SolutionResult {
  if (!sublinear) {
    throw new Error('Native module not available')
  }

  const matrixJson = JSON.stringify(matrix)
  const rhsJson = JSON.stringify(rhs)
  const result = sublinear.solveSystem(matrixJson, rhsJson)

  return JSON.parse(result)
}

/**
 * Process input buffer data
 * @param data - Input buffer/array to process
 * @param options - Processing options
 * @returns Processed buffer/array
 */
export function processBuffer(
  data: Buffer | number[],
  options?: Record<string, any>
): Buffer | number[] {
  if (!sublinear) {
    throw new Error('Native module not available')
  }

  const optionsJson = JSON.stringify(options || {})
  return sublinear.processBuffer(data, optionsJson)
}

/**
 * Batch solve multiple linear systems
 * @param systems - Array of system matrices
 * @param rhsVectors - Array of right-hand side vectors
 * @returns Array of solution results
 */
export function batchSolve(
  systems: SystemMatrix[],
  rhsVectors: number[][]
): SolutionResult[] {
  if (!sublinear) {
    throw new Error('Native module not available')
  }

  const systemsJson = JSON.stringify(systems)
  const rhsArrayJson = JSON.stringify(rhsVectors)
  const result = sublinear.batchSolve(systemsJson, rhsArrayJson)

  return JSON.parse(result)
}

/**
 * Analyze system properties and characteristics
 * @param matrix - System matrix to analyze
 * @returns System analysis with properties
 */
export function analyzeSystem(matrix: SystemMatrix): SystemAnalysis {
  if (!sublinear) {
    throw new Error('Native module not available')
  }

  const matrixJson = JSON.stringify(matrix)
  const result = sublinear.analyzeSystem(matrixJson)

  return JSON.parse(result)
}

/**
 * Validate system feasibility before solving
 * @param matrix - System matrix
 * @param rhs - Right-hand side vector
 * @returns Validation result with error list
 */
export function validateSystem(
  matrix: SystemMatrix,
  rhs: number[]
): ValidationResult {
  if (!sublinear) {
    throw new Error('Native module not available')
  }

  const matrixJson = JSON.stringify(matrix)
  const rhsJson = JSON.stringify(rhs)
  const result = sublinear.validateSystem(matrixJson, rhsJson)

  return JSON.parse(result)
}

/**
 * Create a new Sublinear solver instance for advanced use cases
 */
export class Sublinear {
  private config: SolverConfig
  private initialized: boolean = false

  /**
   * Create a new Sublinear solver instance
   */
  constructor(config?: SolverConfig) {
    if (!sublinear) {
      throw new Error('Native module not available')
    }

    this.config = {
      timeout: 5000,
      retries: 3,
      logLevel: 'info',
      maxConcurrency: 10,
      tolerance: 1e-8,
      maxIterations: 1000,
      ...config,
    }

    this.initialize()
  }

  /**
   * Initialize the solver with current config
   */
  private initialize(): void {
    if (!this.initialized) {
      initializeSolver(this.config)
      this.initialized = true
    }
  }

  /**
   * Solve a single system
   */
  solve(matrix: SystemMatrix, rhs: number[]): SolutionResult {
    return solveSystem(matrix, rhs)
  }

  /**
   * Solve multiple systems in batch
   */
  solveBatch(systems: SystemMatrix[], rhsVectors: number[][]): SolutionResult[] {
    return batchSolve(systems, rhsVectors)
  }

  /**
   * Analyze system properties
   */
  analyze(matrix: SystemMatrix): SystemAnalysis {
    return analyzeSystem(matrix)
  }

  /**
   * Validate system before solving
   */
  validate(matrix: SystemMatrix, rhs: number[]): ValidationResult {
    return validateSystem(matrix, rhs)
  }

  /**
   * Process buffer data
   */
  process(data: Buffer | number[], options?: Record<string, any>): Buffer | number[] {
    return processBuffer(data, options)
  }

  /**
   * Close the solver and clean up resources
   */
  async close(): Promise<void> {
    // Cleanup if needed
    this.initialized = false
  }

  /**
   * Create a stream processor
   */
  createStream() {
    // Return a simple stream-like object
    const chunks: Buffer[] = []

    return {
      write: (data: Buffer) => {
        const processed = processBuffer(data)
        chunks.push(processed)
      },
      read: () => {
        if (chunks.length === 0) return null
        return chunks.shift()
      },
      on: (event: string, callback: Function) => {
        // Mock stream events
        if (event === 'data' && chunks.length > 0) {
          callback(chunks.shift())
        }
      },
    }
  }
}

/**
 * Custom error class for Sublinear errors
 */
export class SublinearError extends Error {
  code: string
  details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'SublinearError'
  }
}

// Export all types and functions
export default {
  Sublinear,
  SublinearError,
  initializeSolver,
  solveSystem,
  processBuffer,
  batchSolve,
  analyzeSystem,
  validateSystem,
}
