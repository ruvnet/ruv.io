// NT Neural - Neural Network models for Neural Trader
// TypeScript bindings for the napi-rs module

export interface ModelConfig {
  inputSize: number
  outputSize: number
  hiddenLayers: number[]
  activation: 'relu' | 'sigmoid' | 'tanh'
  learningRate: number
}

export interface TrainingOptions {
  epochs: number
  batchSize: number
  validationSplit?: number
  earlyStop?: boolean
}

export interface PredictionResult {
  output: number[]
  confidence: number
  timestamp: string
}

export interface TrainingHistory {
  epoch: number
  loss: number
  validationLoss?: number
  accuracy: number
}

export interface ModelCheckpoint {
  version: number
  modelState: Uint8Array
  trainableParams: number
  trainingEpoch: number
  timestamp: string
  loss: number
}

export interface ModelInfo {
  modelId: string
  version: number
  inputSize: number
  outputSize: number
  hiddenLayers: number[]
  activation: string
  learningRate: number
  trainedEpochs: number
  bestLoss: number
  trainableParams: number
  checkpointCount: number
  timestamp: string
}

/**
 * Native bindings from nt_neural Rust module
 */
let ntNeural: any

try {
  // Load the native module via platform loader
  ntNeural = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_neural module not loaded. Build the project first.')
  ntNeural = null
}

/**
 * Neural Engine class wrapping the Rust implementation
 */
export class NeuralEngine {
  private _engine: any

  /**
   * Create a new NeuralEngine instance
   */
  constructor() {
    if (!ntNeural) {
      throw new Error('Native module not available')
    }
    this._engine = new ntNeural.NeuralEngine()
  }

  /**
   * Create a new model
   * @param modelId - Unique identifier for the model
   * @param config - Model configuration
   * @returns Creation result
   */
  createModel(modelId: string, config: ModelConfig): any {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const configJson = JSON.stringify({
      inputSize: config.inputSize,
      outputSize: config.outputSize,
      hiddenLayers: config.hiddenLayers,
      activation: config.activation,
      learningRate: config.learningRate,
    })

    const result = this._engine.createModel(modelId, configJson)
    return JSON.parse(result)
  }

  /**
   * Get model information
   * @param modelId - Model ID
   * @returns Model information
   */
  getModelInfo(modelId: string): ModelInfo {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const result = this._engine.getModelInfo(modelId)
    return JSON.parse(result)
  }

  /**
   * Make predictions with the model
   * @param modelId - Model ID
   * @param input - Input data
   * @returns Prediction result
   */
  predict(modelId: string, input: number[]): PredictionResult {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const inputJson = JSON.stringify(input)
    const result = this._engine.predict(modelId, inputJson)
    return JSON.parse(result)
  }

  /**
   * Make batch predictions
   * @param modelId - Model ID
   * @param inputs - Array of input data
   * @returns Array of prediction results
   */
  predictBatch(modelId: string, inputs: number[][]): PredictionResult[] {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const inputsJson = JSON.stringify(inputs)
    const result = this._engine.predictBatch(modelId, inputsJson)
    return JSON.parse(result)
  }

  /**
   * Train the model
   * @param modelId - Model ID
   * @param trainingData - Training data (input-output pairs)
   * @param options - Training options
   * @returns Training history
   */
  train(
    modelId: string,
    trainingData: Array<[number[], number[]]>,
    options?: TrainingOptions,
  ): TrainingHistory[] {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const trainingDataJson = JSON.stringify(trainingData)
    const optionsJson = JSON.stringify(options || {})
    const result = this._engine.train(modelId, trainingDataJson, optionsJson)
    return JSON.parse(result)
  }

  /**
   * Save a checkpoint of the model
   * @param modelId - Model ID
   * @param checkpointName - Name for the checkpoint
   * @returns Checkpoint info
   */
  saveCheckpoint(modelId: string, checkpointName: string): any {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const result = this._engine.saveCheckpoint(modelId, checkpointName)
    return JSON.parse(result)
  }

  /**
   * Load a checkpoint
   * @param modelId - Model ID
   * @param version - Version number of checkpoint
   * @returns Checkpoint info
   */
  loadCheckpoint(modelId: string, version: number): any {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const result = this._engine.loadCheckpoint(modelId, version)
    return JSON.parse(result)
  }

  /**
   * List all checkpoints for a model
   * @param modelId - Model ID
   * @returns Array of checkpoints
   */
  listCheckpoints(modelId: string): any[] {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const result = this._engine.listCheckpoints(modelId)
    return JSON.parse(result)
  }

  /**
   * Optimize model hyperparameters
   * @param modelId - Model ID
   * @param params - Optimization parameters
   * @returns Optimization result
   */
  optimizeHyperparameters(modelId: string, params: Record<string, number>): any {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const paramsJson = JSON.stringify(params)
    const result = this._engine.optimizeHyperparameters(modelId, paramsJson)
    return JSON.parse(result)
  }

  /**
   * Delete a model
   * @param modelId - Model ID
   * @returns Deletion result
   */
  deleteModel(modelId: string): any {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const result = this._engine.deleteModel(modelId)
    return JSON.parse(result)
  }

  /**
   * List all models
   * @returns Array of model information
   */
  listModels(): any[] {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const result = this._engine.listModels()
    return JSON.parse(result)
  }

  /**
   * Evaluate model performance
   * @param modelId - Model ID
   * @param testData - Test data (input-output pairs)
   * @returns Evaluation metrics
   */
  evaluate(modelId: string, testData: Array<[number[], number[]]>): any {
    if (!this._engine) {
      throw new Error('Native module not available')
    }

    const testDataJson = JSON.stringify(testData)
    const result = this._engine.evaluate(modelId, testDataJson)
    return JSON.parse(result)
  }
}

// Export all types and functions
export default {
  NeuralEngine,
}
