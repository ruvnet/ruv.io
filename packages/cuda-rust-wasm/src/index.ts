// CUDA to Rust transpiler - TypeScript bindings
// High-performance CUDA to Rust transpilation with WebGPU/WASM support

export interface TranspileConfig {
  timeout?: number
  retries?: number
  logLevel?: string
  maxConcurrency?: number
  bufferSize?: number
  enableCaching?: boolean
  cacheSize?: number
}

export interface TranspileResult {
  success: boolean
  output: string
  processing_time_ms: number
  input_size: number
  output_size: number
  metadata?: Record<string, any>
}

export interface ProcessingOptions {
  priority?: string
  cache?: boolean
  timeout?: number
}

export interface TranspilationStats {
  total_processed: number
  total_time_ms: number
  average_time_ms: number
  success_count: number
  error_count: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  line_count: number
  timestamp: string
}

export class CudaRustWasmError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'CudaRustWasmError'
  }
}

/**
 * Native bindings from cuda_rust_wasm Rust module
 */
let cudaWasm: any

try {
  // Load the native module via platform loader
  cudaWasm = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native cuda_rust_wasm module not loaded. Build the project first.')
  cudaWasm = null
}

/**
 * Transpile CUDA code to Rust
 * @param cudaCode - CUDA code string
 * @returns Transpilation result
 */
export function transpileCudaToRust(cudaCode: string): TranspileResult {
  if (!cudaWasm) {
    throw new CudaRustWasmError('Native module not available', 'MODULE_NOT_LOADED')
  }

  if (!cudaCode || typeof cudaCode !== 'string') {
    throw new CudaRustWasmError('Invalid CUDA code provided', 'INVALID_INPUT')
  }

  try {
    const result = cudaWasm.transpileCudaToRust(cudaCode)
    return JSON.parse(result)
  } catch (error: any) {
    throw new CudaRustWasmError(`Transpilation failed: ${error.message}`, 'TRANSPILATION_FAILED', {
      originalError: error,
    })
  }
}

/**
 * Process CUDA code with configuration
 * @param cudaCode - CUDA code to process
 * @param config - Configuration options
 * @returns Processing result
 */
export function processCudaCode(cudaCode: string, config?: TranspileConfig): TranspileResult {
  if (!cudaWasm) {
    throw new CudaRustWasmError('Native module not available', 'MODULE_NOT_LOADED')
  }

  if (!cudaCode || typeof cudaCode !== 'string') {
    throw new CudaRustWasmError('Invalid CUDA code provided', 'INVALID_INPUT')
  }

  try {
    const configJson = JSON.stringify(config || {})
    const result = cudaWasm.processCudaCode(cudaCode, configJson)
    return JSON.parse(result)
  } catch (error: any) {
    throw new CudaRustWasmError(`Processing failed: ${error.message}`, 'PROCESSING_FAILED', {
      originalError: error,
    })
  }
}

/**
 * Batch transpile multiple CUDA files
 * @param cudaFiles - Array of CUDA code strings
 * @returns Array of transpilation results
 */
export function batchTranspileCuda(cudaFiles: string[]): TranspileResult[] {
  if (!cudaWasm) {
    throw new CudaRustWasmError('Native module not available', 'MODULE_NOT_LOADED')
  }

  if (!Array.isArray(cudaFiles)) {
    throw new CudaRustWasmError('Expected array of CUDA files', 'INVALID_INPUT')
  }

  try {
    const filesJson = JSON.stringify(cudaFiles)
    const result = cudaWasm.batchTranspileCuda(filesJson)
    return JSON.parse(result)
  } catch (error: any) {
    throw new CudaRustWasmError(`Batch processing failed: ${error.message}`, 'BATCH_PROCESSING_FAILED', {
      originalError: error,
    })
  }
}

/**
 * Validate CUDA code syntax
 * @param cudaCode - CUDA code to validate
 * @returns Validation result
 */
export function validateCudaCode(cudaCode: string): ValidationResult {
  if (!cudaWasm) {
    throw new CudaRustWasmError('Native module not available', 'MODULE_NOT_LOADED')
  }

  if (!cudaCode || typeof cudaCode !== 'string') {
    throw new CudaRustWasmError('Invalid CUDA code provided', 'INVALID_INPUT')
  }

  try {
    const result = cudaWasm.validateCudaCode(cudaCode)
    return JSON.parse(result)
  } catch (error: any) {
    throw new CudaRustWasmError(`Validation failed: ${error.message}`, 'VALIDATION_FAILED', {
      originalError: error,
    })
  }
}

/**
 * Get transpilation statistics
 * @param previousStats - Previous statistics object
 * @returns Updated statistics
 */
export function getTranspilationStats(previousStats?: TranspilationStats): TranspilationStats {
  if (!cudaWasm) {
    throw new CudaRustWasmError('Native module not available', 'MODULE_NOT_LOADED')
  }

  try {
    const statsJson = JSON.stringify(previousStats || {})
    const result = cudaWasm.getTranspilationStats(statsJson)
    return JSON.parse(result)
  } catch (error: any) {
    throw new CudaRustWasmError(`Failed to get stats: ${error.message}`, 'STATS_FAILED', {
      originalError: error,
    })
  }
}

/**
 * Main CUDA to Rust transpiler client
 */
export class CudaRustWasm {
  private client: any
  private cache: Map<string, TranspileResult>

  /**
   * Create a new CudaRustWasm instance
   * @param config - Configuration options
   */
  constructor(config?: TranspileConfig) {
    if (!cudaWasm) {
      throw new CudaRustWasmError('Native module not available', 'MODULE_NOT_LOADED')
    }

    try {
      const configJson = JSON.stringify(config || {})
      this.client = new cudaWasm.CudaClient(configJson)
      this.cache = new Map()
    } catch (error: any) {
      throw new CudaRustWasmError(`Failed to create client: ${error.message}`, 'CLIENT_CREATION_FAILED', {
        originalError: error,
      })
    }
  }

  /**
   * Transpile CUDA code
   * @param cudaCode - CUDA code to transpile
   * @returns Transpilation result
   */
  transpile(cudaCode: string): TranspileResult {
    if (!cudaCode || typeof cudaCode !== 'string') {
      throw new CudaRustWasmError('Invalid CUDA code provided', 'INVALID_INPUT')
    }

    try {
      const result = this.client.transpile(cudaCode)
      return JSON.parse(result)
    } catch (error: any) {
      throw new CudaRustWasmError(`Transpilation failed: ${error.message}`, 'TRANSPILATION_FAILED', {
        originalError: error,
      })
    }
  }

  /**
   * Process data synchronously
   * @param data - Input data
   * @returns Processed result
   */
  processSync(data: Buffer | string): TranspileResult {
    const cudaCode = typeof data === 'string' ? data : data.toString()
    return this.transpile(cudaCode)
  }

  /**
   * Process data asynchronously
   * @param data - Input data
   * @returns Promise with processed result
   */
  async process(data: Buffer | string): Promise<TranspileResult> {
    return new Promise((resolve, reject) => {
      try {
        const result = this.processSync(data)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Get current statistics
   * @returns Transpilation statistics
   */
  getStats(): TranspilationStats {
    try {
      const result = this.client.getStats()
      return JSON.parse(result)
    } catch (error: any) {
      throw new CudaRustWasmError(`Failed to get stats: ${error.message}`, 'STATS_FAILED', {
        originalError: error,
      })
    }
  }

  /**
   * Close the client and release resources
   * @returns Promise that resolves when cleanup is complete
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      // Clear cache
      this.cache.clear()
      // Client cleanup (napi clients auto-cleanup)
      resolve()
    })
  }
}

// Export all types and functions
export default {
  transpileCudaToRust,
  processCudaCode,
  batchTranspileCuda,
  validateCudaCode,
  getTranspilationStats,
  CudaRustWasm,
  CudaRustWasmError,
}
