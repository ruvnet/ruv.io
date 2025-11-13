// Midstreamer Neural Solver - TypeScript bindings for the napi-rs module

export interface TemporalEvent {
  timestamp: number
  value: number
  data?: Record<string, any>
}

export interface NeuralConfig {
  layers: number[]
  activation: string
  learning_rate?: number
  momentum?: number
}

export interface TrainingData {
  inputs: number[][]
  outputs: number[][]
}

export interface PredictionResult {
  predictions: number[]
  confidence: number[]
  timestamp: string
}

export interface TemporalPattern {
  events: TemporalEvent[]
  pattern_type: string
  confidence: number
}

export interface PerformanceMetrics {
  mse: number
  rmse: number
  mae: number
  r_squared: number
  sample_count: number
  timestamp: string
}

export interface TrainingConfig {
  epochs: number
  batch_size: number
  learning_rate?: number
  validation_split?: number
}

/**
 * Native bindings from midstreamer_neural_solver Rust module
 */
let midstreamerNeuralSolver: any

try {
  // Load the native module via platform loader
  midstreamerNeuralSolver = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native midstreamer_neural_solver module not loaded. Build the project first.')
  midstreamerNeuralSolver = null
}

/**
 * Initialize a neural network solver
 * @param config - Neural network configuration
 * @returns Initialization result with status and parameters
 */
export function initializeSolver(config: NeuralConfig): Record<string, any> {
  if (!midstreamerNeuralSolver) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const result = midstreamerNeuralSolver.initializeSolver(configJson)

  return JSON.parse(result)
}

/**
 * Process temporal events through neural network
 * @param events - Array of temporal events
 * @returns Processing result with statistics
 */
export function processTemporalEvents(events: TemporalEvent[]): Record<string, any> {
  if (!midstreamerNeuralSolver) {
    throw new Error('Native module not available')
  }

  const eventsJson = JSON.stringify(events)
  const result = midstreamerNeuralSolver.processTemporalEvents(eventsJson)

  return JSON.parse(result)
}

/**
 * Train temporal model on data
 * @param trainingData - Training data with inputs and outputs
 * @param config - Training configuration
 * @returns Training result with metrics
 */
export function trainTemporalModel(
  trainingData: TrainingData,
  config: TrainingConfig
): Record<string, any> {
  if (!midstreamerNeuralSolver) {
    throw new Error('Native module not available')
  }

  const trainingDataJson = JSON.stringify(trainingData)
  const configJson = JSON.stringify(config)
  const result = midstreamerNeuralSolver.trainTemporalModel(trainingDataJson, configJson)

  return JSON.parse(result)
}

/**
 * Make predictions on temporal data
 * @param input - Input features for prediction
 * @param model - Model configuration
 * @returns Prediction result with predictions and confidence
 */
export function predictTemporal(
  input: number[],
  model: Record<string, any> = {}
): Record<string, any> {
  if (!midstreamerNeuralSolver) {
    throw new Error('Native module not available')
  }

  const inputJson = JSON.stringify(input)
  const modelJson = JSON.stringify(model)
  const result = midstreamerNeuralSolver.predictTemporal(inputJson, modelJson)

  return JSON.parse(result)
}

/**
 * Detect temporal patterns in event sequence
 * @param events - Array of temporal events
 * @param patternType - Type of pattern to detect (periodic, trend, anomaly)
 * @returns Detection result with confidence
 */
export function detectTemporalPatterns(events: TemporalEvent[], patternType: string): Record<string, any> {
  if (!midstreamerNeuralSolver) {
    throw new Error('Native module not available')
  }

  const eventsJson = JSON.stringify(events)
  const result = midstreamerNeuralSolver.detectTemporalPatterns(eventsJson, patternType)

  return JSON.parse(result)
}

/**
 * Calculate neural network performance metrics
 * @param predictions - Array of predicted values
 * @param actual - Array of actual values
 * @returns Performance metrics including MSE, RMSE, MAE, R²
 */
export function calculatePerformanceMetrics(predictions: number[], actual: number[]): PerformanceMetrics {
  if (!midstreamerNeuralSolver) {
    throw new Error('Native module not available')
  }

  const predictionsJson = JSON.stringify(predictions)
  const actualJson = JSON.stringify(actual)
  const result = midstreamerNeuralSolver.calculatePerformanceMetrics(predictionsJson, actualJson)

  return JSON.parse(result)
}

/**
 * Batch process multiple temporal sequences
 * @param sequences - Array of temporal event sequences
 * @returns Array of processing results
 */
export function batchProcessSequences(sequences: TemporalEvent[][]): Record<string, any>[] {
  if (!midstreamerNeuralSolver) {
    throw new Error('Native module not available')
  }

  const sequencesJson = JSON.stringify(sequences)
  const result = midstreamerNeuralSolver.batchProcessSequences(sequencesJson)

  return JSON.parse(result)
}

/**
 * MidstreamerNeuralSolver class for advanced use cases
 */
export class MidstreamerNeuralSolver {
  private config: NeuralConfig

  /**
   * Create a new MidstreamerNeuralSolver instance
   * @param config - Neural network configuration
   */
  constructor(config: NeuralConfig) {
    if (!midstreamerNeuralSolver) {
      throw new Error('Native module not available')
    }
    this.config = config
    initializeSolver(config)
  }

  /**
   * Process temporal events
   */
  processEvents(events: TemporalEvent[]): Record<string, any> {
    return processTemporalEvents(events)
  }

  /**
   * Train the model
   */
  train(trainingData: TrainingData, config: TrainingConfig): Record<string, any> {
    return trainTemporalModel(trainingData, config)
  }

  /**
   * Make predictions
   */
  predict(input: number[]): Record<string, any> {
    return predictTemporal(input, this.config as any)
  }

  /**
   * Detect patterns
   */
  detectPatterns(events: TemporalEvent[], patternType: string = 'periodic'): Record<string, any> {
    return detectTemporalPatterns(events, patternType)
  }

  /**
   * Calculate metrics
   */
  metrics(predictions: number[], actual: number[]): PerformanceMetrics {
    return calculatePerformanceMetrics(predictions, actual)
  }

  /**
   * Batch process sequences
   */
  batchProcess(sequences: TemporalEvent[][]): Record<string, any>[] {
    return batchProcessSequences(sequences)
  }
}

// Export all types and functions
export default {
  initializeSolver,
  processTemporalEvents,
  trainTemporalModel,
  predictTemporal,
  detectTemporalPatterns,
  calculatePerformanceMetrics,
  batchProcessSequences,
  MidstreamerNeuralSolver,
}
