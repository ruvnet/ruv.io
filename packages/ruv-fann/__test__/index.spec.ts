import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  NeuralNetwork,
  createNetwork,
  validateConfig,
  NeuralNetworkError,
  NetworkConfig,
  TrainingConfig,
} from '../src/index'

describe('RUV-FANN Neural Network', () => {
  let network: NeuralNetwork

  const basicConfig: NetworkConfig = {
    layers: [10, 20, 5],
    activation: 'relu',
    learning_rate: 0.01,
  }

  const simpleConfig: NetworkConfig = {
    layers: [5, 10, 3],
  }

  describe('Network Creation', () => {
    it('should create a neural network with valid configuration', () => {
      const net = new NeuralNetwork(basicConfig)
      expect(net).toBeDefined()
      expect(net.inner).toBeDefined()
    })

    it('should create network using createNetwork utility', () => {
      const net = createNetwork(basicConfig)
      expect(net).toBeDefined()
      expect(net instanceof NeuralNetwork).toBe(true)
    })

    it('should throw error with empty layers', () => {
      expect(() => {
        new NeuralNetwork({ layers: [] })
      }).toThrow()
    })

    it('should throw error with zero-sized layer', () => {
      expect(() => {
        new NeuralNetwork({ layers: [10, 0, 5] })
      }).toThrow()
    })

    it('should throw error with invalid configuration', () => {
      expect(() => {
        new NeuralNetwork('invalid' as any)
      }).toThrow()
    })

    it('should support different activation functions', () => {
      const configs = [
        { layers: [10, 20, 5], activation: 'sigmoid' },
        { layers: [10, 20, 5], activation: 'relu' },
        { layers: [10, 20, 5], activation: 'tanh' },
      ]

      configs.forEach((config) => {
        const net = new NeuralNetwork(config)
        expect(net).toBeDefined()
      })
    })

    it('should support different layer configurations', () => {
      const configs = [
        { layers: [10, 5] }, // 2 layers
        { layers: [10, 20, 5] }, // 3 layers
        { layers: [10, 20, 15, 10, 5] }, // 5 layers
        { layers: [100, 50, 25, 10, 5, 3] }, // 6 layers
      ]

      configs.forEach((config) => {
        const net = new NeuralNetwork(config)
        expect(net).toBeDefined()
      })
    })
  })

  describe('Network Statistics', () => {
    beforeEach(() => {
      network = new NeuralNetwork(basicConfig)
    })

    it('should retrieve network statistics', async () => {
      const stats = await network.getStats()

      expect(stats).toBeDefined()
      expect(stats.num_layers).toBe(3)
      expect(stats.total_neurons).toBeGreaterThan(0)
      expect(stats.total_connections).toBeGreaterThan(0)
      expect(stats.network_type).toBeDefined()
    })

    it('should have correct layer count in stats', async () => {
      const stats = await network.getStats()
      expect(stats.num_layers).toBe(basicConfig.layers.length)
    })

    it('should have correct neuron count in stats', async () => {
      const stats = await network.getStats()
      const expectedNeurons = basicConfig.layers.reduce((a, b) => a + b, 0)
      expect(stats.total_neurons).toBe(expectedNeurons)
    })

    it('should have positive connection count', async () => {
      const stats = await network.getStats()
      expect(stats.total_connections).toBeGreaterThan(0)
    })
  })

  describe('Forward Pass', () => {
    beforeEach(() => {
      network = new NeuralNetwork(simpleConfig)
    })

    it('should perform forward pass with valid input', async () => {
      const input = [0.5, 0.3, 0.8, 0.2, 0.6]
      const output = await network.forward(input)

      expect(Array.isArray(output)).toBe(true)
      expect(output.length).toBeGreaterThan(0)
    })

    it('should return correct output size', async () => {
      const input = [0.5, 0.3, 0.8, 0.2, 0.6]
      const output = await network.forward(input)

      // Output should match last layer size
      expect(output.length).toBe(simpleConfig.layers[simpleConfig.layers.length - 1])
    })

    it('should handle normalized input', async () => {
      const input = [0.1, 0.2, 0.3, 0.4, 0.5]
      const output = await network.forward(input)

      expect(Array.isArray(output)).toBe(true)
      expect(output.every((v) => typeof v === 'number')).toBe(true)
    })

    it('should handle extreme input values', async () => {
      const inputs = [
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [-1, -1, -1, -1, -1],
        [100, -100, 100, -100, 100],
      ]

      for (const input of inputs) {
        const output = await network.forward(input)
        expect(Array.isArray(output)).toBe(true)
      }
    })

    it('should throw error with empty input', async () => {
      await expect(network.forward([])).rejects.toThrow()
    })

    it('should throw error with wrong input size', async () => {
      const input = [0.5, 0.3] // Too small for this network
      await expect(network.forward(input)).rejects.toThrow()
    })
  })

  describe('Training', () => {
    beforeEach(() => {
      network = new NeuralNetwork(simpleConfig)
    })

    it('should train network with valid data', async () => {
      const trainingData = [
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [0.2, 0.3, 0.4, 0.5, 0.6],
        [0.3, 0.4, 0.5, 0.6, 0.7],
      ]

      const result = await network.train(trainingData, { epochs: 10 })

      expect(result).toBeDefined()
      expect(result.epochs_trained).toBeGreaterThan(0)
      expect(result.final_error).toBeGreaterThanOrEqual(0)
      expect(result.total_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should track training epochs', async () => {
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      const epochs = 50

      const result = await network.train(trainingData, { epochs })

      expect(result.epochs_trained).toBe(epochs)
    })

    it('should handle default training config', async () => {
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]

      const result = await network.train(trainingData)

      expect(result).toBeDefined()
      expect(result.epochs_trained).toBeGreaterThan(0)
    })

    it('should improve error over epochs', async () => {
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]

      const result1 = await network.train(trainingData, { epochs: 10 })
      const result2 = await network.train(trainingData, { epochs: 50 })

      expect(result2.final_error).toBeLessThanOrEqual(result1.final_error)
    })

    it('should accept training configuration', async () => {
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      const config: TrainingConfig = {
        epochs: 20,
        batch_size: 32,
        learning_rate: 0.01,
        validation_split: 0.2,
      }

      const result = await network.train(trainingData, config)

      expect(result.epochs_trained).toBe(config.epochs)
    })

    it('should set trained status after training', async () => {
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      await network.train(trainingData, { epochs: 10 })

      const isTrained = await network.isTrained()
      expect(isTrained).toBe(true)
    })

    it('should handle multiple training sessions', async () => {
      const trainingData1 = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      const trainingData2 = [[0.2, 0.3, 0.4, 0.5, 0.6]]

      const result1 = await network.train(trainingData1, { epochs: 10 })
      const result2 = await network.train(trainingData2, { epochs: 20 })

      expect(result1.epochs_trained).toBe(10)
      expect(result2.epochs_trained).toBe(20)
    })
  })

  describe('Prediction', () => {
    beforeEach(async () => {
      network = new NeuralNetwork(simpleConfig)
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      await network.train(trainingData, { epochs: 10 })
    })

    it('should make predictions after training', async () => {
      const input = [0.5, 0.3, 0.8, 0.2, 0.6]
      const prediction = await network.predict(input)

      expect(Array.isArray(prediction)).toBe(true)
      expect(prediction.length).toBe(simpleConfig.layers[simpleConfig.layers.length - 1])
    })

    it('should return numeric predictions', async () => {
      const input = [0.5, 0.3, 0.8, 0.2, 0.6]
      const prediction = await network.predict(input)

      expect(prediction.every((v) => typeof v === 'number')).toBe(true)
    })

    it('should throw error when not trained', async () => {
      const untrained = new NeuralNetwork(simpleConfig)
      const input = [0.5, 0.3, 0.8, 0.2, 0.6]

      await expect(untrained.predict(input)).rejects.toThrow()
    })

    it('should handle different input values', async () => {
      const inputs = [
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [0.9, 0.8, 0.7, 0.6, 0.5],
        [0.5, 0.5, 0.5, 0.5, 0.5],
      ]

      for (const input of inputs) {
        const prediction = await network.predict(input)
        expect(Array.isArray(prediction)).toBe(true)
      }
    })
  })

  describe('Training Status', () => {
    beforeEach(() => {
      network = new NeuralNetwork(simpleConfig)
    })

    it('should return false for untrained network', async () => {
      const isTrained = await network.isTrained()
      expect(isTrained).toBe(false)
    })

    it('should return true after training', async () => {
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      await network.train(trainingData, { epochs: 5 })

      const isTrained = await network.isTrained()
      expect(isTrained).toBe(true)
    })
  })

  describe('Batch Prediction', () => {
    beforeEach(async () => {
      network = new NeuralNetwork(simpleConfig)
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      await network.train(trainingData, { epochs: 10 })
    })

    it('should predict batch of inputs', async () => {
      const inputs = [
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [0.2, 0.3, 0.4, 0.5, 0.6],
        [0.3, 0.4, 0.5, 0.6, 0.7],
      ]

      const predictions = await network.batchPredict(inputs)

      expect(Array.isArray(predictions)).toBe(true)
      expect(predictions.length).toBe(inputs.length)
      predictions.forEach((pred) => {
        expect(Array.isArray(pred)).toBe(true)
        expect(pred.length).toBe(simpleConfig.layers[simpleConfig.layers.length - 1])
      })
    })

    it('should match single predictions', async () => {
      const input = [0.5, 0.3, 0.8, 0.2, 0.6]

      const singlePred = await network.predict(input)
      const batchPred = await network.batchPredict([input])

      expect(batchPred[0]).toEqual(singlePred)
    })

    it('should handle large batches', async () => {
      const inputs = Array(100)
        .fill(null)
        .map((_, i) => [(i * 0.01) % 1, (i * 0.02) % 1, (i * 0.03) % 1, (i * 0.04) % 1, (i * 0.05) % 1])

      const predictions = await network.batchPredict(inputs)

      expect(predictions.length).toBe(100)
    })
  })

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const config = { layers: [10, 20, 5] }
      const isValid = validateConfig(config)
      expect(isValid).toBe(true)
    })

    it('should reject empty layers', () => {
      const config = { layers: [] }
      const isValid = validateConfig(config)
      expect(isValid).toBe(false)
    })

    it('should reject zero-sized layers', () => {
      const config = { layers: [10, 0, 5] }
      const isValid = validateConfig(config)
      expect(isValid).toBe(false)
    })

    it('should reject invalid configuration format', () => {
      const config = { invalid: 'format' } as any
      const isValid = validateConfig(config)
      expect(isValid).toBe(false)
    })

    it('should handle various layer sizes', () => {
      const configs = [
        { layers: [1, 1] },
        { layers: [100, 200, 300] },
        { layers: [10, 20, 30, 40, 50] },
      ]

      configs.forEach((config) => {
        const isValid = validateConfig(config)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      network = new NeuralNetwork(simpleConfig)
    })

    it('should throw NeuralNetworkError on invalid input', async () => {
      try {
        await network.forward([])
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error instanceof NeuralNetworkError).toBe(true)
        if (error instanceof NeuralNetworkError) {
          expect(error.code).toBe('FORWARD_FAILED')
        }
      }
    })

    it('should provide error messages', () => {
      try {
        new NeuralNetwork({ layers: [] })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error instanceof Error).toBe(true)
        if (error instanceof Error) {
          expect(error.message.length).toBeGreaterThan(0)
        }
      }
    })

    it('should maintain error context', async () => {
      try {
        await network.predict([])
        expect.fail('Should have thrown')
      } catch (error) {
        if (error instanceof NeuralNetworkError) {
          expect(error.name).toBe('NeuralNetworkError')
          expect(error.code).toBeDefined()
        }
      }
    })
  })

  describe('Performance Characteristics', () => {
    beforeEach(async () => {
      network = new NeuralNetwork(simpleConfig)
      const trainingData = [[0.1, 0.2, 0.3, 0.4, 0.5]]
      await network.train(trainingData, { epochs: 5 })
    })

    it('should handle large networks', async () => {
      const largeConfig: NetworkConfig = {
        layers: [100, 200, 150, 100, 50, 10],
      }

      const largeNet = new NeuralNetwork(largeConfig)
      const stats = await largeNet.getStats()

      expect(stats.num_layers).toBe(6)
      expect(stats.total_neurons).toBeGreaterThan(600)
    })

    it('should complete forward pass quickly', async () => {
      const input = [0.5, 0.3, 0.8, 0.2, 0.6]
      const start = Date.now()

      await network.forward(input)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle rapid predictions', async () => {
      const input = [0.5, 0.3, 0.8, 0.2, 0.6]
      const count = 100

      const start = Date.now()

      for (let i = 0; i < count; i++) {
        await network.predict(input)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(10000) // Should complete 100 predictions in < 10 seconds
    })
  })

  describe('Network Properties', () => {
    it('should maintain configuration', () => {
      const config = { layers: [10, 20, 5], activation: 'relu' }
      const net = new NeuralNetwork(config)

      expect(net.inner).toBeDefined()
    })

    it('should create independent instances', () => {
      const net1 = new NeuralNetwork(basicConfig)
      const net2 = new NeuralNetwork(basicConfig)

      expect(net1).not.toBe(net2)
      expect(net1.inner).not.toBe(net2.inner)
    })

    it('should support configuration options', () => {
      const configs = [
        { layers: [10, 20, 5], learning_rate: 0.01 },
        { layers: [10, 20, 5], momentum: 0.9 },
        { layers: [10, 20, 5], learning_rate: 0.01, momentum: 0.9 },
      ]

      configs.forEach((config) => {
        const net = new NeuralNetwork(config)
        expect(net).toBeDefined()
      })
    })
  })

  describe('Integration Tests', () => {
    it('should complete full workflow', async () => {
      // Create network
      const net = new NeuralNetwork({ layers: [5, 10, 3] })
      expect(net).toBeDefined()

      // Get stats
      const stats = await net.getStats()
      expect(stats.num_layers).toBe(3)

      // Train
      const trainingData = [
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [0.2, 0.3, 0.4, 0.5, 0.6],
      ]
      const trainResult = await net.train(trainingData, { epochs: 10 })
      expect(trainResult.epochs_trained).toBe(10)

      // Predict
      const prediction = await net.predict([0.3, 0.3, 0.3, 0.3, 0.3])
      expect(prediction.length).toBe(3)

      // Check trained status
      const isTrained = await net.isTrained()
      expect(isTrained).toBe(true)
    })

    it('should handle multiple operations', async () => {
      const net = new NeuralNetwork({ layers: [5, 10, 5] })

      // Multiple forward passes
      for (let i = 0; i < 5; i++) {
        const output = await net.forward([0.1 + i * 0.1, 0.2, 0.3, 0.4, 0.5])
        expect(output.length).toBe(5)
      }

      // Train and predict
      await net.train([[0.1, 0.2, 0.3, 0.4, 0.5]], { epochs: 10 })
      const predictions = await net.batchPredict([
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [0.2, 0.3, 0.4, 0.5, 0.6],
      ])
      expect(predictions.length).toBe(2)
    })
  })
})
