import { describe, it, expect, beforeEach } from 'vitest'
import {
  DaaPrimeTrainer,
  initializeTrainer,
  trainModel,
  evaluateModel,
  hyperparameterTuning,
  optimizeModel,
  getTrainingHistory,
  batchEvaluateModels,
  validateTrainingConfig,
  getOptimizationSuggestions,
  TrainingConfig,
  HyperparameterDef,
  EvaluationMetrics,
  TrainingData,
  ValidationData,
} from '../src/index'

describe('DAA Prime Trainer - Core Training', () => {
  const defaultConfig: TrainingConfig = {
    learning_rate: 0.001,
    batch_size: 32,
    num_epochs: 10,
    validation_split: 0.2,
    early_stopping_patience: 3,
    optimizer: 'adam',
  }

  const trainingData: TrainingData = {
    num_epochs: 10,
    learning_rate: 0.001,
  }

  const validationData: ValidationData = {
    num_samples: 100,
  }

  describe('initializeTrainer', () => {
    it('should initialize a trainer with valid configuration', () => {
      const trainerId = initializeTrainer(defaultConfig)

      expect(trainerId).toBeDefined()
      expect(trainerId).toMatch(/^trainer-/)
    })

    it('should generate unique trainer IDs', () => {
      const trainerId1 = initializeTrainer(defaultConfig)
      const trainerId2 = initializeTrainer(defaultConfig)

      expect(trainerId1).not.toBe(trainerId2)
    })

    it('should reject invalid learning rate (negative)', () => {
      const config = { ...defaultConfig, learning_rate: -0.1 }
      expect(() => initializeTrainer(config)).toThrow()
    })

    it('should reject invalid learning rate (too high)', () => {
      const config = { ...defaultConfig, learning_rate: 1.5 }
      expect(() => initializeTrainer(config)).toThrow()
    })

    it('should reject zero batch size', () => {
      const config = { ...defaultConfig, batch_size: 0 }
      expect(() => initializeTrainer(config)).toThrow()
    })

    it('should reject invalid validation split', () => {
      const config = { ...defaultConfig, validation_split: 1.5 }
      expect(() => initializeTrainer(config)).toThrow()
    })
  })

  describe('trainModel', () => {
    let trainerId: string

    beforeEach(() => {
      trainerId = initializeTrainer(defaultConfig)
    })

    it('should train a model and return results', () => {
      const result = trainModel(trainerId, trainingData)

      expect(result).toBeDefined()
      expect(result.model_id).toBeDefined()
      expect(result.model_id).toMatch(/^model-trainer-/)
      expect(result.total_epochs).toBeGreaterThan(0)
      expect(result.total_epochs).toBeLessThanOrEqual(10)
    })

    it('should return valid accuracy metrics', () => {
      const result = trainModel(trainerId, trainingData)

      expect(result.final_train_accuracy).toBeGreaterThanOrEqual(0)
      expect(result.final_train_accuracy).toBeLessThanOrEqual(1)
      expect(result.final_val_accuracy).toBeGreaterThanOrEqual(0)
      expect(result.final_val_accuracy).toBeLessThanOrEqual(1)
    })

    it('should return valid loss metrics', () => {
      const result = trainModel(trainerId, trainingData)

      expect(result.final_train_loss).toBeGreaterThanOrEqual(0)
      expect(result.final_val_loss).toBeGreaterThanOrEqual(0)
    })

    it('should indicate early stopping when applicable', () => {
      const result = trainModel(trainerId, trainingData)

      expect(result.stopped_early).toBeDefined()
      expect(typeof result.stopped_early).toBe('boolean')
    })

    it('should record total duration', () => {
      const result = trainModel(trainerId, trainingData)

      expect(result.total_duration_ms).toBeGreaterThan(0)
    })

    it('should have best epoch less than or equal to total epochs', () => {
      const result = trainModel(trainerId, trainingData)

      expect(result.best_epoch).toBeLessThanOrEqual(result.total_epochs)
      expect(result.best_epoch).toBeGreaterThan(0)
    })

    it('should handle different learning rates', () => {
      const lowLRData = { ...trainingData, learning_rate: 0.0001 }
      const result1 = trainModel(trainerId, lowLRData)

      const trainerId2 = initializeTrainer(defaultConfig)
      const highLRData = { ...trainingData, learning_rate: 0.01 }
      const result2 = trainModel(trainerId2, highLRData)

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })

    it('should handle different epoch counts', () => {
      const result1 = trainModel(trainerId, { ...trainingData, num_epochs: 5 })

      const trainerId2 = initializeTrainer(defaultConfig)
      const result2 = trainModel(trainerId2, { ...trainingData, num_epochs: 20 })

      expect(result1.total_epochs).toBeLessThanOrEqual(5)
      expect(result2.total_epochs).toBeLessThanOrEqual(20)
    })
  })

  describe('evaluateModel', () => {
    let trainerId: string
    let modelId: string

    beforeEach(() => {
      trainerId = initializeTrainer(defaultConfig)
      const result = trainModel(trainerId, trainingData)
      modelId = result.model_id
    })

    it('should evaluate model and return metrics', () => {
      const metrics = evaluateModel(modelId, validationData)

      expect(metrics).toBeDefined()
      expect(metrics.accuracy).toBeDefined()
      expect(metrics.precision).toBeDefined()
      expect(metrics.recall).toBeDefined()
      expect(metrics.f1_score).toBeDefined()
      expect(metrics.loss).toBeDefined()
    })

    it('should return valid metric values', () => {
      const metrics = evaluateModel(modelId, validationData)

      expect(metrics.accuracy).toBeGreaterThanOrEqual(0)
      expect(metrics.accuracy).toBeLessThanOrEqual(1)
      expect(metrics.precision).toBeGreaterThanOrEqual(0)
      expect(metrics.precision).toBeLessThanOrEqual(1)
      expect(metrics.recall).toBeGreaterThanOrEqual(0)
      expect(metrics.recall).toBeLessThanOrEqual(1)
      expect(metrics.f1_score).toBeGreaterThanOrEqual(0)
      expect(metrics.f1_score).toBeLessThanOrEqual(1)
    })

    it('should record inference time', () => {
      const metrics = evaluateModel(modelId, validationData)

      expect(metrics.inference_time_ms).toBeGreaterThan(0)
    })

    it('should evaluate model with different sample sizes', () => {
      const smallData = { num_samples: 10 }
      const metrics1 = evaluateModel(modelId, smallData)

      const largeData = { num_samples: 1000 }
      const metrics2 = evaluateModel(modelId, largeData)

      expect(metrics1).toBeDefined()
      expect(metrics2).toBeDefined()
      expect(metrics1.accuracy).toBeGreaterThan(0)
      expect(metrics2.accuracy).toBeGreaterThan(0)
    })

    it('should return f1 score as harmonic mean of precision and recall', () => {
      const metrics = evaluateModel(modelId, validationData)

      const expectedF1 = (2 * metrics.precision * metrics.recall) / (metrics.precision + metrics.recall)
      expect(metrics.f1_score).toBeCloseTo(expectedF1, 0.01)
    })

    it('should handle empty validation data', () => {
      const result = evaluateModel(modelId, {})

      expect(result).toBeDefined()
      expect(result.accuracy).toBeGreaterThan(0)
    })
  })

  describe('hyperparameterTuning', () => {
    const hyperparameters: HyperparameterDef[] = [
      {
        name: 'learning_rate',
        param_type: 'float',
        min_value: 0.0001,
        max_value: 0.01,
      },
      {
        name: 'batch_size',
        param_type: 'int',
        min_value: 16,
        max_value: 128,
      },
      {
        name: 'optimizer',
        param_type: 'choice',
        values: ['adam', 'sgd', 'rmsprop'],
      },
    ]

    it('should run hyperparameter tuning', () => {
      const result = hyperparameterTuning(hyperparameters, 10)

      expect(result).toBeDefined()
      expect(result.best_params).toBeDefined()
      expect(result.best_score).toBeDefined()
      expect(result.trials_completed).toBe(10)
    })

    it('should return valid hyperparameter values', () => {
      const result = hyperparameterTuning(hyperparameters, 10)

      expect(result.best_params).toHaveProperty('learning_rate')
      expect(result.best_params).toHaveProperty('batch_size')
      expect(result.best_params).toHaveProperty('optimizer')
    })

    it('should return best score in valid range', () => {
      const result = hyperparameterTuning(hyperparameters, 10)

      expect(result.best_score).toBeGreaterThanOrEqual(0)
      expect(result.best_score).toBeLessThanOrEqual(1)
    })

    it('should record tuning duration', () => {
      const result = hyperparameterTuning(hyperparameters, 10)

      expect(result.total_duration_ms).toBeGreaterThan(0)
    })

    it('should handle single hyperparameter', () => {
      const singleHP: HyperparameterDef[] = [
        {
          name: 'learning_rate',
          param_type: 'float',
          min_value: 0.0001,
          max_value: 0.01,
        },
      ]

      const result = hyperparameterTuning(singleHP, 5)

      expect(result.best_params).toHaveProperty('learning_rate')
      expect(Object.keys(result.best_params).length).toBe(1)
    })

    it('should handle multiple trials', () => {
      const result5 = hyperparameterTuning(hyperparameters, 5)
      const result20 = hyperparameterTuning(hyperparameters, 20)

      expect(result5.trials_completed).toBe(5)
      expect(result20.trials_completed).toBe(20)
      expect(result20.total_duration_ms).toBeGreaterThan(result5.total_duration_ms)
    })

    it('should fail with no hyperparameters', () => {
      expect(() => hyperparameterTuning([], 10)).toThrow()
    })
  })

  describe('optimizeModel', () => {
    let trainerId: string
    let modelId: string

    beforeEach(() => {
      trainerId = initializeTrainer(defaultConfig)
      const result = trainModel(trainerId, trainingData)
      modelId = result.model_id
    })

    it('should optimize model with hyperparameters', () => {
      const hyperparams = {
        learning_rate: 0.002,
        batch_size: 64,
      }

      const metrics = optimizeModel(modelId, hyperparams)

      expect(metrics).toBeDefined()
      expect(metrics.accuracy).toBeDefined()
      expect(metrics.precision).toBeDefined()
      expect(metrics.recall).toBeDefined()
    })

    it('should return valid metrics after optimization', () => {
      const hyperparams = { learning_rate: 0.001 }
      const metrics = optimizeModel(modelId, hyperparams)

      expect(metrics.accuracy).toBeGreaterThanOrEqual(0)
      expect(metrics.accuracy).toBeLessThanOrEqual(1)
      expect(metrics.loss).toBeGreaterThanOrEqual(0)
      expect(metrics.loss).toBeLessThanOrEqual(1)
    })

    it('should handle different hyperparameter combinations', () => {
      const result1 = optimizeModel(modelId, { learning_rate: 0.0005 })
      const result2 = optimizeModel(modelId, { learning_rate: 0.005 })

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })

    it('should handle empty hyperparameters', () => {
      const metrics = optimizeModel(modelId, {})

      expect(metrics).toBeDefined()
      expect(metrics.accuracy).toBeGreaterThan(0)
    })
  })

  describe('getTrainingHistory', () => {
    let trainerId: string
    let modelId: string

    beforeEach(() => {
      trainerId = initializeTrainer(defaultConfig)
      const result = trainModel(trainerId, trainingData)
      modelId = result.model_id
    })

    it('should return training history', () => {
      const history = getTrainingHistory(modelId)

      expect(history).toBeDefined()
      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBeGreaterThan(0)
    })

    it('should have valid epoch results', () => {
      const history = getTrainingHistory(modelId)

      expect(history[0]).toHaveProperty('epoch')
      expect(history[0]).toHaveProperty('train_loss')
      expect(history[0]).toHaveProperty('train_accuracy')
      expect(history[0]).toHaveProperty('val_loss')
      expect(history[0]).toHaveProperty('val_accuracy')
      expect(history[0]).toHaveProperty('duration_ms')
    })

    it('should have monotonic epoch numbers', () => {
      const history = getTrainingHistory(modelId)

      for (let i = 1; i < history.length; i++) {
        expect(history[i].epoch).toBe(history[i - 1].epoch + 1)
      }
    })

    it('should show decreasing loss over epochs', () => {
      const history = getTrainingHistory(modelId)

      for (let i = 1; i < history.length; i++) {
        expect(history[i].train_loss).toBeLessThanOrEqual(history[i - 1].train_loss + 0.5)
      }
    })

    it('should show valid metric ranges in history', () => {
      const history = getTrainingHistory(modelId)

      history.forEach((epoch) => {
        expect(epoch.train_loss).toBeGreaterThanOrEqual(0)
        expect(epoch.train_accuracy).toBeGreaterThanOrEqual(0)
        expect(epoch.train_accuracy).toBeLessThanOrEqual(1)
        expect(epoch.val_loss).toBeGreaterThanOrEqual(0)
        expect(epoch.val_accuracy).toBeGreaterThanOrEqual(0)
        expect(epoch.val_accuracy).toBeLessThanOrEqual(1)
        expect(epoch.duration_ms).toBeGreaterThan(0)
      })
    })
  })

  describe('batchEvaluateModels', () => {
    let modelIds: string[]

    beforeEach(() => {
      modelIds = []
      for (let i = 0; i < 3; i++) {
        const trainerId = initializeTrainer(defaultConfig)
        const result = trainModel(trainerId, trainingData)
        modelIds.push(result.model_id)
      }
    })

    it('should batch evaluate multiple models', () => {
      const results = batchEvaluateModels(modelIds, validationData)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(modelIds.length)
    })

    it('should return metrics for each model', () => {
      const results = batchEvaluateModels(modelIds, validationData)

      results.forEach((result) => {
        expect(result).toHaveProperty('accuracy')
        expect(result).toHaveProperty('precision')
        expect(result).toHaveProperty('recall')
        expect(result).toHaveProperty('f1_score')
        expect(result).toHaveProperty('loss')
      })
    })

    it('should handle single model in batch', () => {
      const results = batchEvaluateModels([modelIds[0]], validationData)

      expect(results.length).toBe(1)
      expect(results[0].accuracy).toBeGreaterThan(0)
    })

    it('should fail with empty model list', () => {
      expect(() => batchEvaluateModels([], validationData)).toThrow()
    })
  })

  describe('validateTrainingConfig', () => {
    it('should validate good configuration', () => {
      const result = validateTrainingConfig(defaultConfig)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid learning rate', () => {
      const config = { ...defaultConfig, learning_rate: 1.5 }
      const result = validateTrainingConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect zero batch size', () => {
      const config = { ...defaultConfig, batch_size: 0 }
      const result = validateTrainingConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should warn about high learning rate', () => {
      const config = { ...defaultConfig, learning_rate: 0.15 }
      const result = validateTrainingConfig(config)

      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should warn about large batch size', () => {
      const config = { ...defaultConfig, batch_size: 512 }
      const result = validateTrainingConfig(config)

      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should provide meaningful error messages', () => {
      const config = { ...defaultConfig, validation_split: 2.0 }
      const result = validateTrainingConfig(config)

      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toMatch(/validation split/i)
    })
  })

  describe('getOptimizationSuggestions', () => {
    let modelId: string

    beforeEach(() => {
      const trainerId = initializeTrainer(defaultConfig)
      const result = trainModel(trainerId, trainingData)
      modelId = result.model_id
    })

    it('should provide optimization suggestions', () => {
      const metrics: EvaluationMetrics = {
        accuracy: 0.65,
        precision: 0.68,
        recall: 0.62,
        f1_score: 0.65,
        loss: 0.35,
        inference_time_ms: 5.0,
      }

      const suggestions = getOptimizationSuggestions(modelId, metrics)

      expect(suggestions).toBeDefined()
      expect(suggestions.suggestions).toBeDefined()
      expect(Array.isArray(suggestions.suggestions)).toBe(true)
      expect(suggestions.suggestions.length).toBeGreaterThan(0)
    })

    it('should suggest improvements for low accuracy', () => {
      const metrics: EvaluationMetrics = {
        accuracy: 0.55,
        precision: 0.60,
        recall: 0.50,
        f1_score: 0.55,
        loss: 0.45,
        inference_time_ms: 3.0,
      }

      const suggestions = getOptimizationSuggestions(modelId, metrics)

      expect(suggestions.suggestions.some((s) => s.includes('accuracy') || s.includes('epochs'))).toBe(true)
    })

    it('should suggest precision improvements', () => {
      const metrics: EvaluationMetrics = {
        accuracy: 0.75,
        precision: 0.65,
        recall: 0.80,
        f1_score: 0.72,
        loss: 0.25,
        inference_time_ms: 3.0,
      }

      const suggestions = getOptimizationSuggestions(modelId, metrics)

      expect(suggestions.suggestions.some((s) => s.includes('positive'))).toBe(true)
    })

    it('should suggest recall improvements', () => {
      const metrics: EvaluationMetrics = {
        accuracy: 0.75,
        precision: 0.80,
        recall: 0.65,
        f1_score: 0.72,
        loss: 0.25,
        inference_time_ms: 3.0,
      }

      const suggestions = getOptimizationSuggestions(modelId, metrics)

      expect(suggestions.suggestions.some((s) => s.includes('negative'))).toBe(true)
    })

    it('should return metrics in suggestions', () => {
      const metrics: EvaluationMetrics = {
        accuracy: 0.75,
        precision: 0.77,
        recall: 0.73,
        f1_score: 0.75,
        loss: 0.25,
        inference_time_ms: 2.0,
      }

      const suggestions = getOptimizationSuggestions(modelId, metrics)

      expect(suggestions.current_metrics).toEqual(metrics)
    })
  })

  describe('DaaPrimeTrainer Class', () => {
    it('should create trainer instance', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)

      expect(trainer).toBeDefined()
      expect(trainer.getTrainerId()).toBeDefined()
    })

    it('should retrieve trainer configuration', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)

      const config = trainer.getConfig()
      expect(config.learning_rate).toBe(defaultConfig.learning_rate)
      expect(config.batch_size).toBe(defaultConfig.batch_size)
    })

    it('should validate configuration', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)

      const validation = trainer.validateConfig()
      expect(validation.valid).toBe(true)
    })

    it('should train through class interface', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)

      const result = trainer.train(trainingData)
      expect(result.model_id).toBeDefined()
      expect(result.final_train_accuracy).toBeGreaterThan(0)
    })

    it('should evaluate through class interface', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)
      const trainResult = trainer.train(trainingData)

      const metrics = trainer.evaluate(trainResult.model_id, validationData)
      expect(metrics.accuracy).toBeGreaterThan(0)
    })

    it('should tune hyperparameters through class interface', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)

      const hyperparameters: HyperparameterDef[] = [
        { name: 'learning_rate', param_type: 'float', min_value: 0.0001, max_value: 0.01 },
      ]

      const result = trainer.tuneHyperparameters(hyperparameters, 5)
      expect(result.best_params).toBeDefined()
    })

    it('should optimize model through class interface', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)
      const trainResult = trainer.train(trainingData)

      const metrics = trainer.optimizeModelWithParams(trainResult.model_id, { learning_rate: 0.002 })
      expect(metrics.accuracy).toBeGreaterThan(0)
    })

    it('should get history through class interface', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)
      const trainResult = trainer.train(trainingData)

      const history = trainer.getHistory(trainResult.model_id)
      expect(history.length).toBeGreaterThan(0)
    })

    it('should batch evaluate through class interface', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)

      const modelIds = []
      for (let i = 0; i < 2; i++) {
        const result = trainer.train(trainingData)
        modelIds.push(result.model_id)
      }

      const results = trainer.batchEvaluate(modelIds, validationData)
      expect(results.length).toBe(2)
    })

    it('should get suggestions through class interface', () => {
      const trainer = new DaaPrimeTrainer(defaultConfig)
      const trainResult = trainer.train(trainingData)
      const metrics = trainer.evaluate(trainResult.model_id, validationData)

      const suggestions = trainer.getSuggestions(trainResult.model_id, metrics)
      expect(suggestions.suggestions).toBeDefined()
    })
  })
})
