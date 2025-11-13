// Geometric Langlands - TypeScript bindings for the napi-rs module

export interface Config {
  timeout?: number
  retries?: number
  logLevel?: string
  maxConcurrency?: number
}

export interface ComputationResult {
  id: string
  input_size: number
  output_size: number
  computation_time: number
  metadata?: Record<string, any>
  timestamp: string
}

export interface AutomorphicForm {
  id: string
  dimension: number
  coefficients: number[]
  norm: number
}

export interface HeckeOperatorResult {
  operator_id: string
  eigenvalues: number[]
  eigenvectors: number[][]
  computation_time: number
}

export interface GeometricObject {
  id: string
  object_type: string
  dimension: number
  properties?: Record<string, any>
}

export class GeometricLanglandsError extends Error {
  code: string
  details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'GeometricLanglandsError'
  }
}

/**
 * Native bindings from geometric_langlands Rust module
 */
let geometricLanglandsNative: any

try {
  // Load the native module via platform loader
  geometricLanglandsNative = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native geometric_langlands module not loaded. Build the project first.')
  geometricLanglandsNative = null
}

/**
 * Process Geometric Langlands data
 * @param config - Configuration options
 * @param data - Input data to process
 * @returns Computation result with metrics
 */
export function processGeometricLanglands(config: Config, data: string): ComputationResult {
  if (!geometricLanglandsNative) {
    throw new GeometricLanglandsError('MODULE_NOT_LOADED', 'Native module not available')
  }

  try {
    const configJson = JSON.stringify(config || {})
    const result = geometricLanglandsNative.processGeometricLanglands(configJson, data)
    return JSON.parse(result)
  } catch (error: any) {
    throw new GeometricLanglandsError('PROCESSING_FAILED', error.message, error)
  }
}

/**
 * Compute automorphic forms
 * @param dimension - Dimension of the automorphic form
 * @param numCoefficients - Number of coefficients to compute
 * @returns Array of automorphic forms
 */
export function computeAutomorphicForms(dimension: number, numCoefficients: number): AutomorphicForm[] {
  if (!geometricLanglandsNative) {
    throw new GeometricLanglandsError('MODULE_NOT_LOADED', 'Native module not available')
  }

  if (dimension <= 0 || numCoefficients <= 0) {
    throw new GeometricLanglandsError('INVALID_INPUT', 'Dimension and numCoefficients must be positive')
  }

  try {
    const result = geometricLanglandsNative.computeAutomorphicForms(dimension, numCoefficients)
    return JSON.parse(result)
  } catch (error: any) {
    throw new GeometricLanglandsError('COMPUTATION_FAILED', error.message, error)
  }
}

/**
 * Apply Hecke operators to automorphic forms
 * @param forms - Array of automorphic forms
 * @param operatorName - Name of the Hecke operator
 * @returns Hecke operator results with eigenvalues and eigenvectors
 */
export function applyHeckeOperators(forms: AutomorphicForm[], operatorName: string): HeckeOperatorResult {
  if (!geometricLanglandsNative) {
    throw new GeometricLanglandsError('MODULE_NOT_LOADED', 'Native module not available')
  }

  try {
    const formsJson = JSON.stringify(forms)
    const result = geometricLanglandsNative.applyHeckeOperators(formsJson, operatorName)
    return JSON.parse(result)
  } catch (error: any) {
    throw new GeometricLanglandsError('OPERATOR_FAILED', error.message, error)
  }
}

/**
 * Compute geometric objects from spectral data
 * @param spectralData - Spectral data input
 * @param objectType - Type of geometric object to compute
 * @returns Array of computed geometric objects
 */
export function computeGeometricObjects(spectralData: any, objectType: string): GeometricObject[] {
  if (!geometricLanglandsNative) {
    throw new GeometricLanglandsError('MODULE_NOT_LOADED', 'Native module not available')
  }

  try {
    const spectralDataJson = JSON.stringify(spectralData)
    const result = geometricLanglandsNative.computeGeometricObjects(spectralDataJson, objectType)
    return JSON.parse(result)
  } catch (error: any) {
    throw new GeometricLanglandsError('COMPUTATION_FAILED', error.message, error)
  }
}

/**
 * Verify Langlands correspondence
 * @param data1 - First set of data
 * @param data2 - Second set of data
 * @returns Correspondence score (0.0 to 1.0)
 */
export function verifyLanglandsCorrespondence(data1: any, data2: any): number {
  if (!geometricLanglandsNative) {
    throw new GeometricLanglandsError('MODULE_NOT_LOADED', 'Native module not available')
  }

  try {
    const data1Json = JSON.stringify(data1)
    const data2Json = JSON.stringify(data2)
    return geometricLanglandsNative.verifyLanglandsCorrespondence(data1Json, data2Json)
  } catch (error: any) {
    throw new GeometricLanglandsError('VERIFICATION_FAILED', error.message, error)
  }
}

/**
 * Batch process multiple Geometric Langlands computations
 * @param dataArray - Array of data items to process
 * @returns Array of computation results
 */
export function batchProcessLanglands(dataArray: string[]): ComputationResult[] {
  if (!geometricLanglandsNative) {
    throw new GeometricLanglandsError('MODULE_NOT_LOADED', 'Native module not available')
  }

  try {
    const dataArrayJson = JSON.stringify(dataArray)
    const result = geometricLanglandsNative.batchProcessLanglands(dataArrayJson)
    return JSON.parse(result)
  } catch (error: any) {
    throw new GeometricLanglandsError('BATCH_FAILED', error.message, error)
  }
}

/**
 * Async wrapper for processing Geometric Langlands data
 * @param config - Configuration options
 * @param data - Input data to process
 * @returns Promise resolving to computation result
 */
export async function process(config: Config, data: string): Promise<ComputationResult> {
  return Promise.resolve(processGeometricLanglands(config, data))
}

/**
 * Sync wrapper for processing Geometric Langlands data
 * @param config - Configuration options
 * @param data - Input data to process
 * @returns Computation result
 */
export function processSync(config: Config, data: string): ComputationResult {
  return processGeometricLanglands(config, data)
}

/**
 * Create a new GeometricLanglands instance for advanced use cases
 */
export class GeometricLanglands {
  private config: Config
  private closed: boolean = false

  /**
   * Create a new GeometricLanglands instance
   * @param config - Configuration options
   */
  constructor(config?: Config) {
    if (!geometricLanglandsNative) {
      throw new GeometricLanglandsError('MODULE_NOT_LOADED', 'Native module not available')
    }
    this.config = config || {}
  }

  /**
   * Process data asynchronously
   * @param data - Input data
   * @returns Promise resolving to computation result
   */
  async process(data: string): Promise<ComputationResult> {
    this.checkClosed()
    return process(this.config, data)
  }

  /**
   * Process data synchronously
   * @param data - Input data
   * @returns Computation result
   */
  processSync(data: string): ComputationResult {
    this.checkClosed()
    return processSync(this.config, data)
  }

  /**
   * Compute automorphic forms
   */
  computeAutomorphicForms(dimension: number, numCoefficients: number): AutomorphicForm[] {
    this.checkClosed()
    return computeAutomorphicForms(dimension, numCoefficients)
  }

  /**
   * Apply Hecke operators
   */
  applyHeckeOperators(forms: AutomorphicForm[], operatorName: string): HeckeOperatorResult {
    this.checkClosed()
    return applyHeckeOperators(forms, operatorName)
  }

  /**
   * Compute geometric objects
   */
  computeGeometricObjects(spectralData: any, objectType: string): GeometricObject[] {
    this.checkClosed()
    return computeGeometricObjects(spectralData, objectType)
  }

  /**
   * Verify Langlands correspondence
   */
  verifyCorrespondence(data1: any, data2: any): number {
    this.checkClosed()
    return verifyLanglandsCorrespondence(data1, data2)
  }

  /**
   * Batch process multiple items
   */
  batchProcess(dataArray: string[]): ComputationResult[] {
    this.checkClosed()
    return batchProcessLanglands(dataArray)
  }

  /**
   * Close the instance and release resources
   */
  async close(): Promise<void> {
    this.closed = true
  }

  /**
   * Check if instance is closed
   */
  private checkClosed(): void {
    if (this.closed) {
      throw new GeometricLanglandsError('ALREADY_CLOSED', 'Instance has been closed')
    }
  }

  /**
   * Check if instance is active
   */
  isActive(): boolean {
    return !this.closed
  }
}

// Export all types and functions
export default {
  GeometricLanglands,
  GeometricLanglandsError,
  processGeometricLanglands,
  computeAutomorphicForms,
  applyHeckeOperators,
  computeGeometricObjects,
  verifyLanglandsCorrespondence,
  batchProcessLanglands,
  process,
  processSync,
}
