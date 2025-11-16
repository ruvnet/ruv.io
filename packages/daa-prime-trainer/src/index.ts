// DAA Prime Trainer - TypeScript bindings for napi-rs module

export interface TrainingConfig {
  learning_rate: number
  batch_size: number
  num_epochs: number
  validation_split: number
  early_stopping_patience: number
  optimizer: string
}

export interface TrainingData {
  num_epochs?: number
  learning_rate?: number
  [key: string]: any
}

export interface ValidationData {
  num_samples?: number
  [key: string]: any
}

export interface EpochResult {
  epoch: number
  train_loss: number
  train_accuracy: number
  val_loss: number
  val_accuracy: number
  duration_ms: number
}

export interface TrainingResult {
  model_id: string
  total_epochs: number
  final_train_loss: number
  final_train_accuracy: number
  final_val_loss: number
  final_val_accuracy: number
  total_duration_ms: number
  best_epoch: number
  stopped_early: boolean
}

export interface EvaluationMetrics {
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  loss: number
  inference_time_ms: number
}

export interface HyperparameterDef {
  name: string
  param_type: 'float' | 'int' | 'choice'
  min_value?: number
  max_value?: number
  values?: string[]
}

export interface TuningResult {
  best_params: Record<string, string>
  best_score: number
  trials_completed: number
  total_duration_ms: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface OptimizationSuggestion {
  model_id: string
  suggestions: string[]
  current_metrics: EvaluationMetrics
}

/**
 * Native bindings from daa_prime_trainer Rust module
 */
let daaPrimeTrainer: any

try {
  // Load the native module via platform loader
  daaPrimeTrainer = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native daa_prime_trainer module not loaded. Build the project first.')
  daaPrimeTrainer = null
}

/**
 * Initialize a new trainer with configuration
 * @param config - Training configuration
 * @returns Trainer instance ID
 */
export function initializeTrainer(config: TrainingConfig): string {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  return daaPrimeTrainer.initializeTrainer(configJson)
}

/**
 * Train a model with the given configuration
 * @param trainerId - Trainer instance ID
 * @param trainingData - Training data and parameters
 * @returns Training result with metrics
 */
export function trainModel(trainerId: string, trainingData: TrainingData): TrainingResult {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const dataJson = JSON.stringify(trainingData)
  const result = daaPrimeTrainer.trainModel(trainerId, dataJson)

  return JSON.parse(result)
}

/**
 * Evaluate model performance on validation set
 * @param modelId - Model instance ID
 * @param validationData - Validation data
 * @returns Evaluation metrics
 */
export function evaluateModel(modelId: string, validationData: ValidationData): EvaluationMetrics {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const dataJson = JSON.stringify(validationData)
  const result = daaPrimeTrainer.evaluateModel(modelId, dataJson)

  return JSON.parse(result)
}

/**
 * Run hyperparameter tuning with grid search
 * @param hyperparameters - Hyperparameter definitions
 * @param numTrials - Number of trials to run
 * @returns Best hyperparameters and score
 */
export function hyperparameterTuning(
  hyperparameters: HyperparameterDef[],
  numTrials: number
): TuningResult {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const hyperparamsJson = JSON.stringify(hyperparameters)
  const result = daaPrimeTrainer.hyperparameterTuning(hyperparamsJson, numTrials)

  return JSON.parse(result)
}

/**
 * Perform optimization on existing model with new hyperparameters
 * @param modelId - Model instance ID
 * @param hyperparameters - New hyperparameters
 * @returns Optimized model metrics
 */
export function optimizeModel(
  modelId: string,
  hyperparameters: Record<string, number>
): EvaluationMetrics {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const hyperparamsJson = JSON.stringify(hyperparameters)
  const result = daaPrimeTrainer.optimizeModel(modelId, hyperparamsJson)

  return JSON.parse(result)
}

/**
 * Get training history for a model
 * @param modelId - Model instance ID
 * @returns Training history epochs
 */
export function getTrainingHistory(modelId: string): EpochResult[] {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const result = daaPrimeTrainer.getTrainingHistory(modelId)

  return JSON.parse(result)
}

/**
 * Batch evaluate multiple models
 * @param modelIds - Array of model IDs
 * @param validationData - Validation data
 * @returns Array of evaluation results
 */
export function batchEvaluateModels(
  modelIds: string[],
  validationData: ValidationData
): EvaluationMetrics[] {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const modelsJson = JSON.stringify(modelIds)
  const dataJson = JSON.stringify(validationData)
  const result = daaPrimeTrainer.batchEvaluateModels(modelsJson, dataJson)

  return JSON.parse(result)
}

/**
 * Validate trainer configuration
 * @param config - Training configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateTrainingConfig(config: TrainingConfig): ValidationResult {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const result = daaPrimeTrainer.validateTrainingConfig(configJson)

  return JSON.parse(result)
}

/**
 * Get optimization suggestions for a model
 * @param modelId - Model instance ID
 * @param metrics - Current model metrics
 * @returns Optimization suggestions
 */
export function getOptimizationSuggestions(
  modelId: string,
  metrics: EvaluationMetrics
): OptimizationSuggestion {
  if (!daaPrimeTrainer) {
    throw new Error('Native module not available')
  }

  const metricsJson = JSON.stringify(metrics)
  const result = daaPrimeTrainer.getOptimizationSuggestions(modelId, metricsJson)

  return JSON.parse(result)
}

/**
 * DAA Prime Trainer class for advanced use cases
 */
export class DaaPrimeTrainer {
  private trainerId: string
  private config: TrainingConfig

  /**
   * Create a new DAA Prime Trainer instance
   * @param config - Training configuration
   */
  constructor(config: TrainingConfig) {
    if (!daaPrimeTrainer) {
      throw new Error('Native module not available')
    }

    this.config = config
    this.trainerId = initializeTrainer(config)
  }

  /**
   * Get the trainer ID
   */
  getTrainerId(): string {
    return this.trainerId
  }

  /**
   * Get the trainer configuration
   */
  getConfig(): TrainingConfig {
    return this.config
  }

  /**
   * Validate the current configuration
   */
  validateConfig(): ValidationResult {
    return validateTrainingConfig(this.config)
  }

  /**
   * Train a model
   */
  train(trainingData: TrainingData): TrainingResult {
    return trainModel(this.trainerId, trainingData)
  }

  /**
   * Evaluate a model
   */
  evaluate(modelId: string, validationData: ValidationData): EvaluationMetrics {
    return evaluateModel(modelId, validationData)
  }

  /**
   * Tune hyperparameters
   */
  tuneHyperparameters(hyperparameters: HyperparameterDef[], numTrials: number): TuningResult {
    return hyperparameterTuning(hyperparameters, numTrials)
  }

  /**
   * Optimize model
   */
  optimizeModelWithParams(modelId: string, hyperparameters: Record<string, number>): EvaluationMetrics {
    return optimizeModel(modelId, hyperparameters)
  }

  /**
   * Get training history
   */
  getHistory(modelId: string): EpochResult[] {
    return getTrainingHistory(modelId)
  }

  /**
   * Batch evaluate models
   */
  batchEvaluate(modelIds: string[], validationData: ValidationData): EvaluationMetrics[] {
    return batchEvaluateModels(modelIds, validationData)
  }

  /**
   * Get optimization suggestions
   */
  getSuggestions(modelId: string, metrics: EvaluationMetrics): OptimizationSuggestion {
    return getOptimizationSuggestions(modelId, metrics)
  }
}

// Export all types and functions
export default {
  initializeTrainer,
  trainModel,
  evaluateModel,
  hyperparameterTuning,
  optimizeModel,
  getTrainingHistory,
  batchEvaluateModels,
  validateTrainingConfig,
  getOptimizationSuggestions,
  DaaPrimeTrainer,
}
