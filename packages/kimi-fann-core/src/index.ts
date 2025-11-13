// KimiFannCore - Optimized micro-expert neural architecture
// TypeScript bindings for the napi-rs module

export interface Config {
  timeout?: number
  retries?: number
  logLevel?: string
  maxConcurrency?: number
}

export interface TrainingOptions {
  epochs?: number
  batchSize?: number
  learningRate?: number
}

export interface ProcessResult {
  data: number[]
  original_size: number
  processed_size: number
  timestamp: string
}

export interface ExecutionResult {
  status: string
  timestamp: string
  duration_ms: number
}

export interface TrainingResult {
  epochs: number
  final_loss: number
  accuracy: number
  training_time_ms: number
  timestamp: string
}

export interface PredictionResult {
  predictions: number[]
  confidence: number
  timestamp: string
}

/**
 * Error class for KimiFannCore
 */
export class KimiFannCoreError extends Error {
  constructor(message: string, public code: string = 'UNKNOWN_ERROR') {
    super(message)
    this.name = 'KimiFannCoreError'
  }
}

/**
 * Native bindings from kimi_fann_core Rust module
 */
let kimiFannCore: any

try {
  // Load the native module via platform loader
  kimiFannCore = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native kimi_fann_core module not loaded. Build the project first.')
  kimiFannCore = null
}

/**
 * KimiFannCore - Optimized micro-expert neural architecture for Kimi-K2
 *
 * Example:
 * ```typescript
 * const client = new KimiFannCore({
 *   timeout: 5000,
 *   retries: 3
 * })
 *
 * const result = await client.process(Buffer.from('data'))
 * await client.close()
 * ```
 */
export class KimiFannCore {
  private nativeClient: any = null

  /**
   * Create a new KimiFannCore instance
   * @param config Configuration options
   * @throws {KimiFannCoreError} If native module is not available
   */
  constructor(config?: Config) {
    if (!kimiFannCore) {
      throw new KimiFannCoreError('Native module not available', 'MODULE_NOT_AVAILABLE')
    }

    try {
      this.nativeClient = new kimiFannCore.KimiFannCore(config)
    } catch (error) {
      throw new KimiFannCoreError(
        `Failed to create client: ${error}`,
        'INITIALIZATION_ERROR'
      )
    }
  }

  /**
   * Process input data
   * @param input Input buffer to process
   * @returns Processed data result
   * @throws {KimiFannCoreError} If processing fails
   *
   * Example:
   * ```typescript
   * const input = Buffer.from('Hello, World!')
   * const result = await client.process(input)
   * ```
   */
  async process(input: Buffer): Promise<ProcessResult> {
    if (!this.nativeClient) {
      throw new KimiFannCoreError('Client not initialized', 'NOT_INITIALIZED')
    }

    try {
      // Convert buffer to JSON format
      const inputJson = JSON.stringify({
        data: Array.from(input),
      })

      const resultJson = this.nativeClient.process(inputJson)
      return JSON.parse(resultJson)
    } catch (error) {
      throw new KimiFannCoreError(
        `Processing failed: ${error}`,
        'PROCESSING_FAILED'
      )
    }
  }

  /**
   * Process input data synchronously
   * @param input Input buffer to process
   * @returns Processed data result
   * @throws {KimiFannCoreError} If processing fails
   *
   * Example:
   * ```typescript
   * const input = Buffer.from('Hello, World!')
   * const result = client.processSync(input)
   * ```
   */
  processSync(input: Buffer): ProcessResult {
    if (!this.nativeClient) {
      throw new KimiFannCoreError('Client not initialized', 'NOT_INITIALIZED')
    }

    try {
      // Convert buffer to JSON format
      const inputJson = JSON.stringify({
        data: Array.from(input),
      })

      const resultJson = this.nativeClient.processSync(inputJson)
      return JSON.parse(resultJson)
    } catch (error) {
      throw new KimiFannCoreError(
        `Sync processing failed: ${error}`,
        'PROCESSING_FAILED'
      )
    }
  }

  /**
   * Execute a neural network operation
   * @returns Execution result
   * @throws {KimiFannCoreError} If execution fails
   *
   * Example:
   * ```typescript
   * const result = await client.execute()
   * ```
   */
  async execute(): Promise<ExecutionResult> {
    if (!this.nativeClient) {
      throw new KimiFannCoreError('Client not initialized', 'NOT_INITIALIZED')
    }

    try {
      const resultJson = this.nativeClient.execute()
      return JSON.parse(resultJson)
    } catch (error) {
      throw new KimiFannCoreError(
        `Execution failed: ${error}`,
        'EXECUTION_FAILED'
      )
    }
  }

  /**
   * Train the neural network model
   * @param trainingData Training data
   * @param options Training options
   * @returns Training result with metrics
   * @throws {KimiFannCoreError} If training fails
   *
   * Example:
   * ```typescript
   * const trainingData = Buffer.from('...')
   * const result = await client.train(trainingData, {
   *   epochs: 100,
   *   batchSize: 32
   * })
   * ```
   */
  async train(
    trainingData: Buffer,
    options?: TrainingOptions
  ): Promise<TrainingResult> {
    if (!this.nativeClient) {
      throw new KimiFannCoreError('Client not initialized', 'NOT_INITIALIZED')
    }

    try {
      // Convert buffer to JSON format
      const trainingDataJson = JSON.stringify({
        samples: [Array.from(trainingData).map(b => b / 255.0)],
      })

      const optionsJson = options ? JSON.stringify(options) : undefined

      const resultJson = this.nativeClient.train(trainingDataJson, optionsJson)
      return JSON.parse(resultJson)
    } catch (error) {
      throw new KimiFannCoreError(
        `Training failed: ${error}`,
        'TRAINING_FAILED'
      )
    }
  }

  /**
   * Make predictions on input data
   * @param inputData Input data buffer
   * @returns Prediction result with confidence
   * @throws {KimiFannCoreError} If prediction fails
   *
   * Example:
   * ```typescript
   * const input = Buffer.from('test data')
   * const result = await client.predict(input)
   * ```
   */
  async predict(inputData: Buffer): Promise<PredictionResult> {
    if (!this.nativeClient) {
      throw new KimiFannCoreError('Client not initialized', 'NOT_INITIALIZED')
    }

    try {
      // Convert buffer to JSON format
      const inputJson = JSON.stringify({
        data: Array.from(inputData),
      })

      const resultJson = this.nativeClient.predict(inputJson)
      return JSON.parse(resultJson)
    } catch (error) {
      throw new KimiFannCoreError(
        `Prediction failed: ${error}`,
        'PREDICTION_FAILED'
      )
    }
  }

  /**
   * Close the client and release resources
   * @throws {KimiFannCoreError} If close fails
   *
   * Example:
   * ```typescript
   * try {
   *   const result = await client.process(data)
   * } finally {
   *   await client.close()
   * }
   * ```
   */
  async close(): Promise<void> {
    if (!this.nativeClient) {
      throw new KimiFannCoreError('Client not initialized', 'NOT_INITIALIZED')
    }

    try {
      this.nativeClient.close()
    } catch (error) {
      throw new KimiFannCoreError(
        `Close failed: ${error}`,
        'CLOSE_FAILED'
      )
    }
  }

  /**
   * Check if client is closed
   * @returns Closed status
   * @throws {KimiFannCoreError} If check fails
   */
  async isClosed(): Promise<boolean> {
    if (!this.nativeClient) {
      throw new KimiFannCoreError('Client not initialized', 'NOT_INITIALIZED')
    }

    try {
      return this.nativeClient.isClosed()
    } catch (error) {
      throw new KimiFannCoreError(
        `Status check failed: ${error}`,
        'STATUS_CHECK_FAILED'
      )
    }
  }

  /**
   * Get current configuration
   * @returns Configuration object
   * @throws {KimiFannCoreError} If retrieval fails
   */
  async getConfig(): Promise<Config> {
    if (!this.nativeClient) {
      throw new KimiFannCoreError('Client not initialized', 'NOT_INITIALIZED')
    }

    try {
      const resultJson = this.nativeClient.getConfig()
      return JSON.parse(resultJson)
    } catch (error) {
      throw new KimiFannCoreError(
        `Config retrieval failed: ${error}`,
        'CONFIG_ERROR'
      )
    }
  }
}

// Export all types and the main class
export default {
  KimiFannCore,
  KimiFannCoreError,
}
