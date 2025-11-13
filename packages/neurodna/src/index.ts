// Neurodna - High-performance evolutionary neural networks
// TypeScript bindings for the napi-rs module

export interface ProcessResult {
  success: boolean
  data: string
  processing_time_ms: number
  size: number
}

export interface Statistics {
  input_size: number
  input_hash: number
  entropy: number
  complexity: number
}

export interface NeuralNetConfig {
  layers?: number
  neurons?: number
  activation?: string
}

export class NeurodnaError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'NeurodnaError'
  }
}

/**
 * Native bindings from neurodna Rust module
 */
let neurodnaModule: any

try {
  // Load the native module via platform loader
  neurodnaModule = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native neurodna module not loaded. Build the project first.')
  neurodnaModule = null
}

/**
 * Process input data with evolutionary neural network encoding
 * @param input - Input data string
 * @returns Process result with metadata
 */
export function processData(input: string): ProcessResult {
  if (!neurodnaModule) {
    throw new NeurodnaError(
      'Native module not available. Make sure to build the project first.',
      'MODULE_NOT_LOADED'
    )
  }

  try {
    const result = neurodnaModule.processData(input)
    return JSON.parse(result)
  } catch (error) {
    throw new NeurodnaError(
      `Processing failed: ${error instanceof Error ? error.message : String(error)}`,
      'PROCESSING_FAILED'
    )
  }
}

/**
 * Encode data with genetic encoding
 * @param input - Input data string
 * @param encodingType - Type of encoding (binary, gray, permutation)
 * @returns Encoded result
 */
export function encodeData(input: string, encodingType: string): ProcessResult {
  if (!neurodnaModule) {
    throw new NeurodnaError(
      'Native module not available',
      'MODULE_NOT_LOADED'
    )
  }

  try {
    const result = neurodnaModule.encodeData(input, encodingType)
    return JSON.parse(result)
  } catch (error) {
    throw new NeurodnaError(
      `Encoding failed: ${error instanceof Error ? error.message : String(error)}`,
      'ENCODING_FAILED'
    )
  }
}

/**
 * Evaluate neural network with input data
 * @param networkConfig - Neural network configuration
 * @param input - Input data string
 * @returns Evaluation result
 */
export function evaluateNetwork(networkConfig: NeuralNetConfig, input: string): ProcessResult {
  if (!neurodnaModule) {
    throw new NeurodnaError(
      'Native module not available',
      'MODULE_NOT_LOADED'
    )
  }

  try {
    const configJson = JSON.stringify(networkConfig)
    const result = neurodnaModule.evaluateNetwork(configJson, input)
    return JSON.parse(result)
  } catch (error) {
    throw new NeurodnaError(
      `Network evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
      'EVALUATION_FAILED'
    )
  }
}

/**
 * Batch process multiple inputs
 * @param inputs - Array of input strings
 * @returns Array of process results
 */
export function batchProcess(inputs: string[]): ProcessResult[] {
  if (!neurodnaModule) {
    throw new NeurodnaError(
      'Native module not available',
      'MODULE_NOT_LOADED'
    )
  }

  try {
    const inputsJson = JSON.stringify(inputs)
    const result = neurodnaModule.batchProcess(inputsJson)
    return JSON.parse(result)
  } catch (error) {
    throw new NeurodnaError(
      `Batch processing failed: ${error instanceof Error ? error.message : String(error)}`,
      'BATCH_FAILED'
    )
  }
}

/**
 * Get statistics for input data
 * @param input - Input data string
 * @returns Statistics object
 */
export function getStatistics(input: string): Statistics {
  if (!neurodnaModule) {
    throw new NeurodnaError(
      'Native module not available',
      'MODULE_NOT_LOADED'
    )
  }

  try {
    const result = neurodnaModule.getStatistics(input)
    return JSON.parse(result)
  } catch (error) {
    throw new NeurodnaError(
      `Failed to get statistics: ${error instanceof Error ? error.message : String(error)}`,
      'STATISTICS_FAILED'
    )
  }
}

// Export all types and functions
export default {
  processData,
  encodeData,
  evaluateNetwork,
  batchProcess,
  getStatistics,
  NeurodnaError,
}
