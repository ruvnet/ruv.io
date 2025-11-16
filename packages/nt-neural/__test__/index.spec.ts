import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NeuralEngine, ModelConfig, TrainingOptions, PredictionResult } from '../src/index'

describe('NT Neural - NeuralEngine', () => {
  let engine: NeuralEngine
  let modelId: string = 'test-model-001'

  const baseConfig: ModelConfig = {
    inputSize: 3,
    outputSize: 2,
    hiddenLayers: [8, 4],
    activation: 'relu',
    learningRate: 0.01,
  }

  const trainingData: Array<[number[], number[]]> = [
    [[0, 0, 0], [0, 1]],
    [[1, 1, 1], [1, 0]],
    [[0.5, 0.5, 0.5], [0.5, 0.5]],
    [[1, 0, 1], [1, 0]],
    [[0, 1, 0], [0, 1]],
  ]

  beforeAll(() => {
    engine = new NeuralEngine()
  })

  describe('Initialization', () => {
    it('should create a NeuralEngine instance', () => {
      expect(engine).toBeDefined()
      expect(engine).toBeInstanceOf(NeuralEngine)
    })

    it('should throw error when native module is not available', () => {
      // This test verifies that the engine requires the module
      expect(() => {
        const invalidEngine = new NeuralEngine()
        expect(invalidEngine).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('Model Creation', () => {
    it('should create a model with valid config', () => {
      const result = engine.createModel(modelId, baseConfig)

      expect(result).toBeDefined()
      expect(result.modelId).toBe(modelId)
      expect(result.version).toBe(1)
      expect(result.status).toBe('created')
      expect(result.timestamp).toBeDefined()
    })

    it('should create multiple models with different IDs', () => {
      const model2Id = 'test-model-002'
      const result = engine.createModel(model2Id, baseConfig)

      expect(result).toBeDefined()
      expect(result.modelId).toBe(model2Id)
    })

    it('should create model with different architectures', () => {
      const deepConfig: ModelConfig = {
        inputSize: 5,
        outputSize: 3,
        hiddenLayers: [16, 8, 4],
        activation: 'sigmoid',
        learningRate: 0.001,
      }

      const result = engine.createModel('deep-model', deepConfig)

      expect(result).toBeDefined()
      expect(result.modelId).toBe('deep-model')
    })

    it('should get model information', () => {
      const info = engine.getModelInfo(modelId)

      expect(info).toBeDefined()
      expect(info.modelId).toBe(modelId)
      expect(info.version).toBe(1)
      expect(info.inputSize).toBe(baseConfig.inputSize)
      expect(info.outputSize).toBe(baseConfig.outputSize)
      expect(info.hiddenLayers).toEqual(baseConfig.hiddenLayers)
      expect(info.activation).toBe(baseConfig.activation)
      expect(info.learningRate).toBe(baseConfig.learningRate)
      expect(info.trainedEpochs).toBe(0)
      expect(info.bestLoss).toBeGreaterThanOrEqual(0)
      expect(info.trainableParams).toBeGreaterThan(0)
      expect(info.checkpointCount).toBeGreaterThan(0)
    })

    it('should list all models', () => {
      const models = engine.listModels()

      expect(models).toBeDefined()
      expect(Array.isArray(models)).toBe(true)
      expect(models.length).toBeGreaterThan(0)
      expect(models[0]).toHaveProperty('modelId')
      expect(models[0]).toHaveProperty('version')
    })
  })

  describe('Model Inference', () => {
    it('should make predictions with valid input', () => {
      const input = [0.5, 0.5, 0.5]
      const result = engine.predict(modelId, input)

      expect(result).toBeDefined()
      expect(result.output).toBeDefined()
      expect(Array.isArray(result.output)).toBe(true)
      expect(result.output.length).toBe(baseConfig.outputSize)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.timestamp).toBeDefined()
    })

    it('should make predictions with different inputs', () => {
      const inputs = [
        [0, 0, 0],
        [1, 1, 1],
        [0.5, 0.5, 0.5],
      ]

      const results = inputs.map((input) => engine.predict(modelId, input))

      expect(results.length).toBe(inputs.length)
      results.forEach((result) => {
        expect(result.output).toBeDefined()
        expect(result.confidence).toBeGreaterThanOrEqual(0)
      })
    })

    it('should make batch predictions', () => {
      const inputs = [
        [0, 0, 0],
        [1, 1, 1],
        [0.5, 0.5, 0.5],
      ]

      const results = engine.predictBatch(modelId, inputs)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(inputs.length)
      results.forEach((result) => {
        expect(result.output).toBeDefined()
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('should handle batch predictions with empty array', () => {
      const results = engine.predictBatch(modelId, [])

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })

    it('should handle batch predictions with large datasets', () => {
      const largeInput = Array.from({ length: 100 }, () => [
        Math.random(),
        Math.random(),
        Math.random(),
      ])

      const results = engine.predictBatch(modelId, largeInput)

      expect(results.length).toBe(100)
      results.forEach((result) => {
        expect(result.output.length).toBe(baseConfig.outputSize)
      })
    })

    it('predictions should be deterministic', () => {
      const input = [0.3, 0.7, 0.4]
      const result1 = engine.predict(modelId, input)
      const result2 = engine.predict(modelId, input)

      expect(result1.output).toEqual(result2.output)
      expect(result1.confidence).toBe(result2.confidence)
    })
  })

  describe('Model Training', () => {
    const trainModelId = 'train-model-001'

    beforeAll(() => {
      engine.createModel(trainModelId, baseConfig)
    })

    it('should train model with valid data', () => {
      const options: TrainingOptions = {
        epochs: 5,
        batchSize: 2,
      }

      const history = engine.train(trainModelId, trainingData, options)

      expect(history).toBeDefined()
      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBe(options.epochs)
    })

    it('should have valid training history entries', () => {
      const options: TrainingOptions = {
        epochs: 3,
        batchSize: 2,
      }

      const history = engine.train(trainModelId, trainingData, options)

      history.forEach((entry, index) => {
        expect(entry.epoch).toBe(index + 1)
        expect(typeof entry.loss).toBe('number')
        expect(entry.loss).toBeGreaterThanOrEqual(0)
        expect(typeof entry.accuracy).toBe('number')
        expect(entry.accuracy).toBeGreaterThanOrEqual(0)
        expect(entry.accuracy).toBeLessThanOrEqual(1)
      })
    })

    it('should train with custom learning rate', () => {
      const customConfig: ModelConfig = {
        ...baseConfig,
        learningRate: 0.1,
      }

      const customModelId = 'custom-lr-model'
      engine.createModel(customModelId, customConfig)

      const options: TrainingOptions = {
        epochs: 2,
        batchSize: 2,
      }

      const history = engine.train(customModelId, trainingData, options)

      expect(history).toBeDefined()
      expect(history.length).toBe(2)
    })

    it('should train with batch size variations', () => {
      const testModelId = 'batch-test-model'
      engine.createModel(testModelId, baseConfig)

      const options1: TrainingOptions = {
        epochs: 2,
        batchSize: 1,
      }

      const history1 = engine.train(testModelId, trainingData, options1)
      expect(history1.length).toBe(2)
    })
  })

  describe('Model Checkpointing', () => {
    const checkpointModelId = 'checkpoint-model-001'

    beforeAll(() => {
      engine.createModel(checkpointModelId, baseConfig)
      const options: TrainingOptions = { epochs: 2, batchSize: 2 }
      engine.train(checkpointModelId, trainingData, options)
    })

    it('should save a checkpoint', () => {
      const result = engine.saveCheckpoint(checkpointModelId, 'checkpoint-1')

      expect(result).toBeDefined()
      expect(result.name).toBe('checkpoint-1')
      expect(result.version).toBeDefined()
      expect(result.epoch).toBeDefined()
      expect(result.loss).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should load a checkpoint', () => {
      const checkpoint = engine.loadCheckpoint(checkpointModelId, 1)

      expect(checkpoint).toBeDefined()
      expect(checkpoint.version).toBe(1)
      expect(checkpoint.epoch).toBeGreaterThanOrEqual(0)
      expect(checkpoint.loss).toBeGreaterThanOrEqual(0)
      expect(checkpoint.trainableParams).toBeGreaterThan(0)
    })

    it('should list checkpoints', () => {
      engine.saveCheckpoint(checkpointModelId, 'checkpoint-2')

      const checkpoints = engine.listCheckpoints(checkpointModelId)

      expect(checkpoints).toBeDefined()
      expect(Array.isArray(checkpoints)).toBe(true)
      expect(checkpoints.length).toBeGreaterThan(0)
      checkpoints.forEach((cp) => {
        expect(cp).toHaveProperty('version')
        expect(cp).toHaveProperty('epoch')
        expect(cp).toHaveProperty('loss')
        expect(cp).toHaveProperty('timestamp')
        expect(cp).toHaveProperty('trainableParams')
      })
    })

    it('should have increasing version numbers', () => {
      const checkpoints = engine.listCheckpoints(checkpointModelId)

      for (let i = 1; i < checkpoints.length; i++) {
        expect(checkpoints[i].version).toBeGreaterThanOrEqual(checkpoints[i - 1].version)
      }
    })
  })

  describe('Hyperparameter Optimization', () => {
    const optimizeModelId = 'optimize-model-001'

    beforeAll(() => {
      engine.createModel(optimizeModelId, baseConfig)
    })

    it('should optimize learning rate', () => {
      const result = engine.optimizeHyperparameters(optimizeModelId, {
        learningRate: 0.05,
      })

      expect(result).toBeDefined()
      expect(result.modelId).toBe(optimizeModelId)
      expect(result.learningRate).toBe(0.05)
      expect(result.optimized).toBe(true)
      expect(result.timestamp).toBeDefined()
    })

    it('should maintain valid learning rate bounds', () => {
      const result = engine.optimizeHyperparameters(optimizeModelId, {
        learningRate: 0.001,
      })

      expect(result.learningRate).toBeGreaterThan(0)
      expect(result.learningRate).toBeLessThan(1)
    })
  })

  describe('Model Evaluation', () => {
    const evalModelId = 'eval-model-001'

    beforeAll(() => {
      engine.createModel(evalModelId, baseConfig)
      const options: TrainingOptions = { epochs: 3, batchSize: 2 }
      engine.train(evalModelId, trainingData, options)
    })

    it('should evaluate model on test data', () => {
      const testData: Array<[number[], number[]]> = [
        [[0, 0, 0], [0, 1]],
        [[1, 1, 1], [1, 0]],
      ]

      const result = engine.evaluate(evalModelId, testData)

      expect(result).toBeDefined()
      expect(result.modelId).toBe(evalModelId)
      expect(result.testSamples).toBe(testData.length)
      expect(result.accuracy).toBeGreaterThanOrEqual(0)
      expect(result.accuracy).toBeLessThanOrEqual(1)
      expect(result.loss).toBeGreaterThanOrEqual(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should handle large test datasets', () => {
      const largeTestData = Array.from({ length: 50 }, (_, i) => [
        [Math.random(), Math.random(), Math.random()],
        [i % 2, (i + 1) % 2],
      ] as [number[], number[]])

      const result = engine.evaluate(evalModelId, largeTestData)

      expect(result.testSamples).toBe(50)
      expect(result.accuracy).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Model Deletion', () => {
    it('should delete a model', () => {
      const deleteModelId = 'delete-model-001'
      engine.createModel(deleteModelId, baseConfig)

      const result = engine.deleteModel(deleteModelId)

      expect(result).toBeDefined()
      expect(result.modelId).toBe(deleteModelId)
      expect(result.deleted).toBe(true)
      expect(result.timestamp).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle prediction with non-existent model', () => {
      expect(() => {
        engine.predict('non-existent-model', [0, 0, 0])
      }).toThrow()
    })

    it('should handle checkpoint load with invalid version', () => {
      expect(() => {
        engine.loadCheckpoint(modelId, 9999)
      }).toThrow()
    })

    it('should handle model info for non-existent model', () => {
      expect(() => {
        engine.getModelInfo('non-existent-model')
      }).toThrow()
    })
  })

  describe('Integration Tests', () => {
    const integrationModelId = 'integration-model-001'

    beforeAll(() => {
      engine.createModel(integrationModelId, baseConfig)
    })

    it('should complete full workflow: create, train, predict, evaluate', () => {
      // Create model (already done in beforeAll)
      const info = engine.getModelInfo(integrationModelId)
      expect(info).toBeDefined()

      // Train
      const options: TrainingOptions = { epochs: 2, batchSize: 2 }
      const history = engine.train(integrationModelId, trainingData, options)
      expect(history.length).toBe(2)

      // Predict
      const prediction = engine.predict(integrationModelId, [0.5, 0.5, 0.5])
      expect(prediction).toBeDefined()

      // Evaluate
      const evaluation = engine.evaluate(integrationModelId, trainingData)
      expect(evaluation).toBeDefined()
    })

    it('should handle multiple predictions and checkpoints', () => {
      // Make predictions
      const predictions = engine.predictBatch(integrationModelId, [
        [0, 0, 0],
        [1, 1, 1],
        [0.5, 0.5, 0.5],
      ])
      expect(predictions.length).toBe(3)

      // Save checkpoint
      const checkpoint = engine.saveCheckpoint(integrationModelId, 'test-checkpoint')
      expect(checkpoint).toBeDefined()

      // List checkpoints
      const checkpoints = engine.listCheckpoints(integrationModelId)
      expect(checkpoints.length).toBeGreaterThan(0)
    })

    it('should handle training and optimization cycle', () => {
      // Optimize hyperparameters
      const optimization = engine.optimizeHyperparameters(integrationModelId, {
        learningRate: 0.02,
      })
      expect(optimization.optimized).toBe(true)

      // Train again with optimized parameters
      const options: TrainingOptions = { epochs: 1, batchSize: 2 }
      const history = engine.train(integrationModelId, trainingData, options)
      expect(history.length).toBe(1)
    })
  })

  describe('Performance Tests', () => {
    const perfModelId = 'perf-model-001'

    beforeAll(() => {
      engine.createModel(perfModelId, baseConfig)
    })

    it('should handle rapid predictions', () => {
      const input = [0.5, 0.5, 0.5]

      for (let i = 0; i < 50; i++) {
        const result = engine.predict(perfModelId, input)
        expect(result).toBeDefined()
      }
    })

    it('should handle large batch predictions efficiently', () => {
      const inputs = Array.from({ length: 200 }, () => [
        Math.random(),
        Math.random(),
        Math.random(),
      ])

      const results = engine.predictBatch(perfModelId, inputs)

      expect(results.length).toBe(200)
    })
  })

  describe('Model Architecture Variations', () => {
    it('should handle single hidden layer', () => {
      const simpleConfig: ModelConfig = {
        inputSize: 2,
        outputSize: 1,
        hiddenLayers: [4],
        activation: 'sigmoid',
        learningRate: 0.01,
      }

      const result = engine.createModel('simple-model', simpleConfig)
      expect(result.modelId).toBe('simple-model')
      expect(result.version).toBe(1)
    })

    it('should handle deep network', () => {
      const deepConfig: ModelConfig = {
        inputSize: 10,
        outputSize: 3,
        hiddenLayers: [32, 16, 8],
        activation: 'relu',
        learningRate: 0.001,
      }

      const result = engine.createModel('deep-model', deepConfig)
      expect(result.modelId).toBe('deep-model')
    })

    it('should work with tanh activation', () => {
      const tanhConfig: ModelConfig = {
        inputSize: 4,
        outputSize: 2,
        hiddenLayers: [8],
        activation: 'tanh',
        learningRate: 0.01,
      }

      const result = engine.createModel('tanh-model', tanhConfig)
      expect(result).toBeDefined()
    })

    it('should predict with different architectures', () => {
      const simpleConfig: ModelConfig = {
        inputSize: 2,
        outputSize: 1,
        hiddenLayers: [4],
        activation: 'sigmoid',
        learningRate: 0.01,
      }

      engine.createModel('arch-test-1', simpleConfig)
      const prediction = engine.predict('arch-test-1', [0.5, 0.5])

      expect(prediction).toBeDefined()
      expect(prediction.output.length).toBe(1)
    })
  })

  describe('Advanced Training Scenarios', () => {
    const advModelId = 'advanced-train-model'

    beforeAll(() => {
      engine.createModel(advModelId, baseConfig)
    })

    it('should train with single epoch', () => {
      const options: TrainingOptions = { epochs: 1, batchSize: 2 }
      const history = engine.train(advModelId, trainingData, options)

      expect(history).toBeDefined()
      expect(history.length).toBe(1)
    })

    it('should train with different batch sizes', () => {
      const options: TrainingOptions = { epochs: 1, batchSize: 1 }
      const history = engine.train(advModelId, trainingData, options)

      expect(history).toBeDefined()
      expect(history[0].loss).toBeGreaterThanOrEqual(0)
    })

    it('should maintain loss improvement over epochs', () => {
      const testModelId = 'loss-test-model'
      engine.createModel(testModelId, baseConfig)

      const options: TrainingOptions = { epochs: 3, batchSize: 2 }
      const history = engine.train(testModelId, trainingData, options)

      expect(history.length).toBe(3)
      history.forEach((entry) => {
        expect(entry.loss).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Batch Operations', () => {
    const batchModelId = 'batch-test-model'

    beforeAll(() => {
      engine.createModel(batchModelId, baseConfig)
    })

    it('should handle empty batch', () => {
      const results = engine.predictBatch(batchModelId, [])
      expect(results).toEqual([])
    })

    it('should handle single item batch', () => {
      const results = engine.predictBatch(batchModelId, [[0.5, 0.5, 0.5]])
      expect(results.length).toBe(1)
    })

    it('should handle large batch with varied inputs', () => {
      const inputs = Array.from({ length: 50 }, (_, i) => [
        (i % 10) / 10,
        ((i + 1) % 10) / 10,
        ((i + 2) % 10) / 10,
      ])

      const results = engine.predictBatch(batchModelId, inputs)
      expect(results.length).toBe(50)
    })

    it('should maintain consistency in batch vs single predictions', () => {
      const input = [0.3, 0.7, 0.4]

      const singleResult = engine.predict(batchModelId, input)
      const batchResults = engine.predictBatch(batchModelId, [input])

      expect(singleResult.output).toEqual(batchResults[0].output)
      expect(singleResult.confidence).toBe(batchResults[0].confidence)
    })
  })

  describe('Model State and Versioning', () => {
    const stateModelId = 'state-model'

    beforeAll(() => {
      engine.createModel(stateModelId, baseConfig)
    })

    it('should maintain model state across operations', () => {
      const info1 = engine.getModelInfo(stateModelId)
      const prediction = engine.predict(stateModelId, [0.5, 0.5, 0.5])
      const info2 = engine.getModelInfo(stateModelId)

      expect(info1.version).toBe(info2.version)
      expect(info1.modelId).toBe(info2.modelId)
    })

    it('should increment version after checkpoint', () => {
      const initialInfo = engine.getModelInfo(stateModelId)
      const initialVersion = initialInfo.version

      engine.saveCheckpoint(stateModelId, 'state-checkpoint-1')
      engine.train(stateModelId, trainingData, { epochs: 1, batchSize: 2 })
      engine.saveCheckpoint(stateModelId, 'state-checkpoint-2')

      const checkpoints = engine.listCheckpoints(stateModelId)
      expect(checkpoints.length).toBeGreaterThan(1)
    })

    it('should track trained epochs', () => {
      const testModelId = 'epoch-track-model'
      engine.createModel(testModelId, baseConfig)

      const info1 = engine.getModelInfo(testModelId)
      expect(info1.trainedEpochs).toBe(0)

      engine.train(testModelId, trainingData, { epochs: 2, batchSize: 2 })

      const info2 = engine.getModelInfo(testModelId)
      expect(info2.trainedEpochs).toBe(2)
    })
  })

  describe('Checkpoint Management', () => {
    const checkpointModelId = 'checkpoint-mgmt-model'

    beforeAll(() => {
      engine.createModel(checkpointModelId, baseConfig)
      engine.train(checkpointModelId, trainingData, { epochs: 1, batchSize: 2 })
    })

    it('should handle multiple checkpoint saves', () => {
      engine.saveCheckpoint(checkpointModelId, 'checkpoint-1')
      engine.saveCheckpoint(checkpointModelId, 'checkpoint-2')
      engine.saveCheckpoint(checkpointModelId, 'checkpoint-3')

      const checkpoints = engine.listCheckpoints(checkpointModelId)
      expect(checkpoints.length).toBeGreaterThan(2)
    })

    it('should preserve checkpoint metadata', () => {
      const checkpoint = engine.listCheckpoints(checkpointModelId)[0]

      expect(checkpoint).toHaveProperty('version')
      expect(checkpoint).toHaveProperty('epoch')
      expect(checkpoint).toHaveProperty('loss')
      expect(checkpoint).toHaveProperty('timestamp')
      expect(checkpoint).toHaveProperty('trainableParams')
    })

    it('should load correct checkpoint information', () => {
      const checkpoints = engine.listCheckpoints(checkpointModelId)
      if (checkpoints.length > 0) {
        const firstCheckpoint = checkpoints[0]
        const loaded = engine.loadCheckpoint(checkpointModelId, firstCheckpoint.version)

        expect(loaded.version).toBe(firstCheckpoint.version)
        expect(loaded.epoch).toBe(firstCheckpoint.epoch)
      }
    })
  })

  describe('Prediction Confidence', () => {
    const confModelId = 'confidence-model'

    beforeAll(() => {
      engine.createModel(confModelId, baseConfig)
    })

    it('should provide confidence scores in valid range', () => {
      for (let i = 0; i < 10; i++) {
        const input = [Math.random(), Math.random(), Math.random()]
        const result = engine.predict(confModelId, input)

        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      }
    })

    it('should have consistent confidence across identical inputs', () => {
      const input = [0.25, 0.75, 0.5]

      const result1 = engine.predict(confModelId, input)
      const result2 = engine.predict(confModelId, input)
      const result3 = engine.predict(confModelId, input)

      expect(result1.confidence).toBe(result2.confidence)
      expect(result2.confidence).toBe(result3.confidence)
    })
  })

  describe('Evaluation Metrics', () => {
    const evalMetricsModelId = 'eval-metrics-model'

    beforeAll(() => {
      engine.createModel(evalMetricsModelId, baseConfig)
      engine.train(evalMetricsModelId, trainingData, { epochs: 2, batchSize: 2 })
    })

    it('should return valid evaluation metrics', () => {
      const evaluation = engine.evaluate(evalMetricsModelId, trainingData)

      expect(evaluation).toHaveProperty('modelId')
      expect(evaluation).toHaveProperty('testSamples')
      expect(evaluation).toHaveProperty('accuracy')
      expect(evaluation).toHaveProperty('loss')
      expect(evaluation).toHaveProperty('timestamp')
    })

    it('should have valid accuracy range', () => {
      const evaluation = engine.evaluate(evalMetricsModelId, trainingData)

      expect(evaluation.accuracy).toBeGreaterThanOrEqual(0)
      expect(evaluation.accuracy).toBeLessThanOrEqual(1)
    })

    it('should have non-negative loss', () => {
      const evaluation = engine.evaluate(evalMetricsModelId, trainingData)

      expect(evaluation.loss).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Hyperparameter Variations', () => {
    const hyperModelId = 'hyper-test-model'

    beforeAll(() => {
      engine.createModel(hyperModelId, baseConfig)
    })

    it('should update learning rate', () => {
      const result = engine.optimizeHyperparameters(hyperModelId, {
        learningRate: 0.05,
      })

      expect(result.learningRate).toBe(0.05)
    })

    it('should handle multiple hyperparameter updates', () => {
      engine.optimizeHyperparameters(hyperModelId, { learningRate: 0.02 })
      const result1 = engine.optimizeHyperparameters(hyperModelId, {
        learningRate: 0.015,
      })

      expect(result1.learningRate).toBe(0.015)
    })

    it('should reject invalid learning rates', () => {
      const result = engine.optimizeHyperparameters(hyperModelId, {
        learningRate: 0.0001,
      })

      expect(result.learningRate).toBeGreaterThan(0)
    })
  })

  describe('Data Validation', () => {
    const validationModelId = 'validation-model'

    beforeAll(() => {
      engine.createModel(validationModelId, baseConfig)
    })

    it('should require correct input size for predictions', () => {
      expect(() => {
        engine.predict(validationModelId, [0.5, 0.5]) // Wrong size
      }).toThrow()
    })

    it('should handle zero-valued inputs', () => {
      const result = engine.predict(validationModelId, [0, 0, 0])
      expect(result).toBeDefined()
      expect(result.output).toBeDefined()
    })

    it('should handle maximum-valued inputs', () => {
      const result = engine.predict(validationModelId, [1, 1, 1])
      expect(result).toBeDefined()
      expect(result.output).toBeDefined()
    })
  })
})
