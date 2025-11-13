import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  MidstreamerNeuralSolver,
  initializeSolver,
  processTemporalEvents,
  trainTemporalModel,
  predictTemporal,
  detectTemporalPatterns,
  calculatePerformanceMetrics,
  batchProcessSequences,
  TemporalEvent,
  NeuralConfig,
  TrainingData,
  TrainingConfig,
} from '../src/index'

describe('Midstreamer Neural Solver - Temporal Logic', () => {
  const sampleConfig: NeuralConfig = {
    layers: [64, 128, 64],
    activation: 'relu',
    learning_rate: 0.01,
    momentum: 0.9,
  }

  const sampleEvents: TemporalEvent[] = [
    { timestamp: 1.0, value: 10.5, data: { source: 'sensor1' } },
    { timestamp: 2.0, value: 12.3, data: { source: 'sensor1' } },
    { timestamp: 3.0, value: 14.1, data: { source: 'sensor1' } },
    { timestamp: 4.0, value: 13.8, data: { source: 'sensor1' } },
    { timestamp: 5.0, value: 15.2, data: { source: 'sensor1' } },
  ]

  const sampleTrainingData: TrainingData = {
    inputs: [
      [1.0, 2.0, 3.0],
      [2.0, 3.0, 4.0],
      [3.0, 4.0, 5.0],
      [4.0, 5.0, 6.0],
    ],
    outputs: [
      [5.0],
      [9.0],
      [12.0],
      [15.0],
    ],
  }

  describe('initializeSolver', () => {
    it('should initialize solver with configuration', () => {
      const result = initializeSolver(sampleConfig)

      expect(result).toBeDefined()
      expect(result.status).toBe('initialized')
      expect(result.layers).toEqual(sampleConfig.layers)
      expect(result.activation).toBe(sampleConfig.activation)
    })

    it('should include parameters in initialization result', () => {
      const result = initializeSolver(sampleConfig)

      expect(result.parameters).toBeDefined()
      expect(result.parameters.learning_rate).toBe(0.01)
      expect(result.parameters.momentum).toBe(0.9)
    })

    it('should use default parameters if not provided', () => {
      const minimalConfig: NeuralConfig = {
        layers: [32, 64],
        activation: 'sigmoid',
      }

      const result = initializeSolver(minimalConfig)

      expect(result.parameters.learning_rate).toBe(0.01)
      expect(result.parameters.momentum).toBe(0.9)
    })

    it('should reject empty layers', () => {
      expect(() => {
        initializeSolver({
          layers: [],
          activation: 'relu',
        })
      }).toThrow()
    })
  })

  describe('processTemporalEvents', () => {
    it('should process temporal events', () => {
      const result = processTemporalEvents(sampleEvents)

      expect(result).toBeDefined()
      expect(result.event_count).toBe(sampleEvents.length)
      expect(result.statistics).toBeDefined()
    })

    it('should calculate mean of event values', () => {
      const result = processTemporalEvents(sampleEvents)

      expect(result.statistics.mean).toBeGreaterThan(0)
      expect(result.statistics.mean).toBeLessThan(20)
    })

    it('should calculate standard deviation', () => {
      const result = processTemporalEvents(sampleEvents)

      expect(result.statistics.std_dev).toBeGreaterThanOrEqual(0)
    })

    it('should identify min and max values', () => {
      const result = processTemporalEvents(sampleEvents)

      expect(result.statistics.min).toBeLessThanOrEqual(result.statistics.max)
      expect(result.statistics.min).toBeGreaterThan(0)
    })

    it('should calculate trend', () => {
      const result = processTemporalEvents(sampleEvents)

      expect(typeof result.statistics.trend).toBe('number')
    })

    it('should identify temporal span', () => {
      const result = processTemporalEvents(sampleEvents)

      expect(result.temporal_span).toBeDefined()
      expect(result.temporal_span.start).toBe(1.0)
      expect(result.temporal_span.end).toBe(5.0)
    })

    it('should handle empty events array', () => {
      expect(() => {
        processTemporalEvents([])
      }).toThrow()
    })

    it('should handle single event', () => {
      const singleEvent: TemporalEvent[] = [
        { timestamp: 1.0, value: 10.0, data: {} },
      ]

      const result = processTemporalEvents(singleEvent)

      expect(result.event_count).toBe(1)
      expect(result.statistics.mean).toBe(10.0)
    })
  })

  describe('trainTemporalModel', () => {
    it('should train model with data', () => {
      const trainingConfig: TrainingConfig = {
        epochs: 50,
        batch_size: 16,
      }

      const result = trainTemporalModel(sampleTrainingData, trainingConfig)

      expect(result).toBeDefined()
      expect(result.status).toBe('trained')
      expect(result.epochs).toBe(50)
      expect(result.batch_size).toBe(16)
    })

    it('should report sample count', () => {
      const trainingConfig: TrainingConfig = {
        epochs: 100,
        batch_size: 32,
      }

      const result = trainTemporalModel(sampleTrainingData, trainingConfig)

      expect(result.samples).toBe(sampleTrainingData.inputs.length)
    })

    it('should calculate final loss', () => {
      const trainingConfig: TrainingConfig = {
        epochs: 100,
        batch_size: 32,
      }

      const result = trainTemporalModel(sampleTrainingData, trainingConfig)

      expect(result.final_loss).toBeGreaterThanOrEqual(0)
      expect(result.final_loss).toBeLessThanOrEqual(1)
    })

    it('should calculate accuracy from loss', () => {
      const trainingConfig: TrainingConfig = {
        epochs: 100,
        batch_size: 32,
      }

      const result = trainTemporalModel(sampleTrainingData, trainingConfig)

      expect(result.accuracy).toBe(1.0 - result.final_loss)
    })

    it('should handle different epoch counts', () => {
      const result1 = trainTemporalModel(sampleTrainingData, {
        epochs: 50,
        batch_size: 32,
      })

      const result2 = trainTemporalModel(sampleTrainingData, {
        epochs: 200,
        batch_size: 32,
      })

      expect(result1.final_loss).toBeGreaterThan(result2.final_loss)
    })
  })

  describe('predictTemporal', () => {
    it('should make predictions on input', () => {
      const input = [1.0, 2.0, 3.0]
      const result = predictTemporal(input)

      expect(result).toBeDefined()
      expect(result.predictions).toBeDefined()
      expect(Array.isArray(result.predictions)).toBe(true)
    })

    it('should return confidence scores', () => {
      const input = [1.0, 2.0, 3.0]
      const result = predictTemporal(input)

      expect(result.confidence).toBeDefined()
      expect(Array.isArray(result.confidence)).toBe(true)
      expect(result.confidence.length).toBe(result.predictions.length)
    })

    it('should have confidence in valid range', () => {
      const input = [1.0, 2.0, 3.0]
      const result = predictTemporal(input)

      result.confidence.forEach((conf: number) => {
        expect(conf).toBeGreaterThanOrEqual(0)
        expect(conf).toBeLessThanOrEqual(1)
      })
    })

    it('should report input and output size', () => {
      const input = [1.0, 2.0, 3.0]
      const result = predictTemporal(input)

      expect(result.input_size).toBe(3)
      expect(result.output_size).toBe(3)
    })

    it('should handle empty input', () => {
      expect(() => {
        predictTemporal([])
      }).toThrow()
    })

    it('should generate reasonable predictions', () => {
      const input = [0.5, 1.0, 1.5]
      const result = predictTemporal(input)

      expect(result.predictions.length).toBeGreaterThan(0)
      result.predictions.forEach((pred: number) => {
        expect(typeof pred).toBe('number')
      })
    })
  })

  describe('detectTemporalPatterns', () => {
    it('should detect periodic patterns', () => {
      const result = detectTemporalPatterns(sampleEvents, 'periodic')

      expect(result).toBeDefined()
      expect(result.pattern_type).toBe('periodic')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should detect trend patterns', () => {
      const result = detectTemporalPatterns(sampleEvents, 'trend')

      expect(result.pattern_type).toBe('trend')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should detect anomaly patterns', () => {
      const result = detectTemporalPatterns(sampleEvents, 'anomaly')

      expect(result.pattern_type).toBe('anomaly')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should report detected flag based on confidence', () => {
      const result = detectTemporalPatterns(sampleEvents, 'trend')

      if (result.confidence > 0.5) {
        expect(result.detected).toBe(true)
      } else {
        expect(result.detected).toBe(false)
      }
    })

    it('should handle empty events', () => {
      expect(() => {
        detectTemporalPatterns([], 'periodic')
      }).toThrow()
    })

    it('should handle single event', () => {
      const singleEvent: TemporalEvent[] = [
        { timestamp: 1.0, value: 10.0, data: {} },
      ]

      const result = detectTemporalPatterns(singleEvent, 'trend')

      expect(result).toBeDefined()
      expect(result.detected).toBeDefined()
    })
  })

  describe('calculatePerformanceMetrics', () => {
    const predictions = [1.0, 2.0, 3.0, 4.0, 5.0]
    const actual = [1.1, 2.1, 2.9, 4.2, 4.8]

    it('should calculate MSE', () => {
      const metrics = calculatePerformanceMetrics(predictions, actual)

      expect(metrics.mse).toBeGreaterThanOrEqual(0)
      expect(typeof metrics.mse).toBe('number')
    })

    it('should calculate RMSE', () => {
      const metrics = calculatePerformanceMetrics(predictions, actual)

      expect(metrics.rmse).toBeGreaterThanOrEqual(0)
      expect(metrics.rmse).toBeGreaterThanOrEqual(metrics.mse)
    })

    it('should calculate MAE', () => {
      const metrics = calculatePerformanceMetrics(predictions, actual)

      expect(metrics.mae).toBeGreaterThanOrEqual(0)
    })

    it('should calculate R-squared', () => {
      const metrics = calculatePerformanceMetrics(predictions, actual)

      expect(metrics.r_squared).toBeGreaterThanOrEqual(-1)
      expect(metrics.r_squared).toBeLessThanOrEqual(1)
    })

    it('should handle perfect predictions', () => {
      const perfectActual = predictions.slice()
      const metrics = calculatePerformanceMetrics(predictions, perfectActual)

      expect(metrics.mse).toBe(0)
      expect(metrics.rmse).toBe(0)
      expect(metrics.mae).toBe(0)
      expect(metrics.r_squared).toBe(1)
    })

    it('should report sample count', () => {
      const metrics = calculatePerformanceMetrics(predictions, actual)

      expect(metrics.sample_count).toBe(predictions.length)
    })

    it('should reject mismatched lengths', () => {
      expect(() => {
        calculatePerformanceMetrics([1.0, 2.0], [1.0, 2.0, 3.0])
      }).toThrow()
    })
  })

  describe('batchProcessSequences', () => {
    const sequences = [sampleEvents, sampleEvents.slice(0, 3)]

    it('should process multiple sequences', () => {
      const results = batchProcessSequences(sequences)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(sequences.length)
    })

    it('should process each sequence independently', () => {
      const results = batchProcessSequences(sequences)

      expect(results[0].event_count).toBe(5)
      expect(results[1].event_count).toBe(3)
    })

    it('should calculate statistics for each sequence', () => {
      const results = batchProcessSequences(sequences)

      results.forEach((result) => {
        expect(result.mean).toBeDefined()
        expect(result.std_dev).toBeDefined()
        expect(result.trend).toBeDefined()
      })
    })

    it('should handle empty sequences array', () => {
      const results = batchProcessSequences([])

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })

    it('should handle single sequence', () => {
      const results = batchProcessSequences([sampleEvents])

      expect(results.length).toBe(1)
      expect(results[0].event_count).toBe(sampleEvents.length)
    })
  })

  describe('MidstreamerNeuralSolver class', () => {
    let solver: MidstreamerNeuralSolver

    beforeAll(() => {
      solver = new MidstreamerNeuralSolver(sampleConfig)
    })

    it('should create instance', () => {
      expect(solver).toBeDefined()
      expect(solver).toBeInstanceOf(MidstreamerNeuralSolver)
    })

    it('should process events via instance method', () => {
      const result = solver.processEvents(sampleEvents)

      expect(result).toBeDefined()
      expect(result.event_count).toBe(sampleEvents.length)
    })

    it('should train model via instance method', () => {
      const trainingConfig: TrainingConfig = {
        epochs: 50,
        batch_size: 16,
      }

      const result = solver.train(sampleTrainingData, trainingConfig)

      expect(result).toBeDefined()
      expect(result.status).toBe('trained')
    })

    it('should make predictions via instance method', () => {
      const result = solver.predict([1.0, 2.0, 3.0])

      expect(result).toBeDefined()
      expect(result.predictions).toBeDefined()
    })

    it('should detect patterns via instance method', () => {
      const result = solver.detectPatterns(sampleEvents, 'periodic')

      expect(result).toBeDefined()
      expect(result.pattern_type).toBe('periodic')
    })

    it('should calculate metrics via instance method', () => {
      const predictions = [1.0, 2.0, 3.0]
      const actual = [1.1, 2.1, 2.9]

      const metrics = solver.metrics(predictions, actual)

      expect(metrics).toBeDefined()
      expect(metrics.mse).toBeDefined()
    })

    it('should batch process via instance method', () => {
      const sequences = [sampleEvents, sampleEvents.slice(0, 3)]
      const results = solver.batchProcess(sequences)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(sequences.length)
    })
  })

  describe('Integration tests', () => {
    it('should complete training and prediction workflow', () => {
      const config: NeuralConfig = {
        layers: [32, 64, 32],
        activation: 'relu',
      }

      // Initialize
      const initResult = initializeSolver(config)
      expect(initResult.status).toBe('initialized')

      // Train
      const trainingConfig: TrainingConfig = {
        epochs: 50,
        batch_size: 16,
      }
      const trainResult = trainTemporalModel(sampleTrainingData, trainingConfig)
      expect(trainResult.status).toBe('trained')

      // Predict
      const predictions = predictTemporal([1.0, 2.0, 3.0], config as any)
      expect(predictions.predictions).toBeDefined()

      // Evaluate
      const actual = [4.9, 5.2, 5.1]
      const metrics = calculatePerformanceMetrics(predictions.predictions.slice(0, 3), actual)
      expect(metrics.mse).toBeDefined()
    })

    it('should process and analyze temporal sequence', () => {
      // Process events
      const processed = processTemporalEvents(sampleEvents)
      expect(processed.statistics).toBeDefined()

      // Detect patterns
      const patterns = detectTemporalPatterns(sampleEvents, 'trend')
      expect(patterns.pattern_type).toBe('trend')

      // Batch process
      const sequences = [sampleEvents, sampleEvents.slice(0, 3)]
      const batchResults = batchProcessSequences(sequences)
      expect(batchResults.length).toBe(2)
    })

    it('should handle complete neural solver lifecycle', () => {
      const config: NeuralConfig = {
        layers: [16, 32, 16],
        activation: 'tanh',
        learning_rate: 0.005,
      }

      const solver = new MidstreamerNeuralSolver(config)

      // Process events
      const events = solver.processEvents(sampleEvents)
      expect(events.event_count).toBe(sampleEvents.length)

      // Detect patterns
      const patterns = solver.detectPatterns(sampleEvents, 'anomaly')
      expect(patterns).toBeDefined()

      // Make predictions
      const predictions = solver.predict([2.0, 3.0, 4.0])
      expect(predictions.predictions).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle invalid event data', () => {
      expect(() => {
        processTemporalEvents({} as any)
      }).toThrow()
    })

    it('should handle invalid training data', () => {
      expect(() => {
        trainTemporalModel({} as any, { epochs: 10, batch_size: 32 })
      }).toThrow()
    })

    it('should handle invalid predictions/actual data', () => {
      expect(() => {
        calculatePerformanceMetrics({} as any, {})
      }).toThrow()
    })

    it('should handle mismatched array lengths', () => {
      expect(() => {
        calculatePerformanceMetrics([1, 2, 3], [1, 2])
      }).toThrow()
    })

    it('should validate neural config', () => {
      expect(() => {
        initializeSolver({
          layers: [],
          activation: 'relu',
        })
      }).toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle very small values', () => {
      const smallEvents: TemporalEvent[] = [
        { timestamp: 0.001, value: 0.0001, data: {} },
        { timestamp: 0.002, value: 0.0002, data: {} },
      ]

      const result = processTemporalEvents(smallEvents)
      expect(result.statistics.mean).toBeDefined()
    })

    it('should handle very large values', () => {
      const largeEvents: TemporalEvent[] = [
        { timestamp: 1e6, value: 1e9, data: {} },
        { timestamp: 1e6 + 1, value: 1e9 + 1, data: {} },
      ]

      const result = processTemporalEvents(largeEvents)
      expect(result.statistics.mean).toBeDefined()
    })

    it('should handle negative values', () => {
      const negativeEvents: TemporalEvent[] = [
        { timestamp: 1.0, value: -10.5, data: {} },
        { timestamp: 2.0, value: -5.3, data: {} },
        { timestamp: 3.0, value: -2.1, data: {} },
      ]

      const result = processTemporalEvents(negativeEvents)
      expect(result.statistics.mean).toBeLessThan(0)
    })

    it('should handle mixed positive and negative values', () => {
      const mixedEvents: TemporalEvent[] = [
        { timestamp: 1.0, value: -5.0, data: {} },
        { timestamp: 2.0, value: 0.0, data: {} },
        { timestamp: 3.0, value: 5.0, data: {} },
      ]

      const result = processTemporalEvents(mixedEvents)
      expect(result.statistics.mean).toBe(0)
    })

    it('should handle constant values (zero variance)', () => {
      const constantEvents: TemporalEvent[] = [
        { timestamp: 1.0, value: 5.0, data: {} },
        { timestamp: 2.0, value: 5.0, data: {} },
        { timestamp: 3.0, value: 5.0, data: {} },
      ]

      const result = processTemporalEvents(constantEvents)
      expect(result.statistics.std_dev).toBe(0)
      expect(result.statistics.trend).toBe(0)
    })

    it('should handle dense temporal data', () => {
      const denseEvents: TemporalEvent[] = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: i * 0.001,
        value: Math.sin(i * 0.1),
        data: {},
      }))

      const result = processTemporalEvents(denseEvents)
      expect(result.event_count).toBe(1000)
    })
  })
})
