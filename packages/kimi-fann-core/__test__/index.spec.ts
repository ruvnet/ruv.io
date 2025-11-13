import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  KimiFannCore,
  KimiFannCoreError,
  Config,
  TrainingOptions,
  ExecutionResult,
  TrainingResult,
  ProcessResult,
  PredictionResult,
} from '../src/index'

describe('KimiFannCore - Basic Functionality', () => {
  let client: KimiFannCore

  beforeEach(() => {
    client = new KimiFannCore()
  })

  afterEach(async () => {
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore close errors in cleanup
      }
    }
  })

  describe('Constructor', () => {
    it('should create client with default config', () => {
      const newClient = new KimiFannCore()
      expect(newClient).toBeDefined()
      expect(newClient).toBeInstanceOf(KimiFannCore)
    })

    it('should create client with custom config', () => {
      const config: Config = {
        timeout: 10000,
        retries: 5,
        logLevel: 'debug',
        maxConcurrency: 20,
      }
      const newClient = new KimiFannCore(config)
      expect(newClient).toBeDefined()
      expect(newClient).toBeInstanceOf(KimiFannCore)
    })
  })

  describe('process', () => {
    it('should process data asynchronously', async () => {
      const input = Buffer.from('test data')
      const output = await client.process(input)

      expect(output).toBeDefined()
      expect(output).toHaveProperty('data')
      expect(output).toHaveProperty('original_size')
      expect(output).toHaveProperty('processed_size')
      expect(output).toHaveProperty('timestamp')
      expect(Array.isArray(output.data)).toBe(true)
    })

    it('should handle empty buffer', async () => {
      const input = Buffer.alloc(0)
      const output = await client.process(input)

      expect(output).toBeDefined()
      expect(output).toHaveProperty('data')
      expect(Array.isArray(output.data)).toBe(true)
    })

    it('should handle large buffer', async () => {
      const input = Buffer.alloc(1024 * 100) // 100KB
      input.fill(0xAB)

      const output = await client.process(input)

      expect(output).toBeDefined()
      expect(output.original_size).toBe(input.length)
      expect(output.processed_size).toBe(input.length)
    })

    it('should process different data types', async () => {
      const inputs = [
        Buffer.from('string data'),
        Buffer.from([1, 2, 3, 4, 5]),
        Buffer.from([0xFF, 0x00, 0xFF, 0x00]),
      ]

      for (const input of inputs) {
        const output = await client.process(input)
        expect(output).toBeDefined()
        expect(output.original_size).toBe(input.length)
      }
    })

    it('should throw error on closed client', async () => {
      await client.close()

      const input = Buffer.from('test')
      await expect(client.process(input)).rejects.toThrow(KimiFannCoreError)
    })
  })

  describe('processSync', () => {
    it('should process data synchronously', () => {
      const input = Buffer.from('test data')
      const output = client.processSync(input)

      expect(output).toBeDefined()
      expect(output).toHaveProperty('data')
      expect(output.original_size).toBeGreaterThan(0)
    })

    it('should handle empty buffer', () => {
      const input = Buffer.alloc(0)
      const output = client.processSync(input)

      expect(output).toBeDefined()
      expect(output.original_size).toBe(0)
    })

    it('should handle large buffer', () => {
      const input = Buffer.alloc(1024 * 50) // 50KB
      input.fill(0xCD)

      const output = client.processSync(input)

      expect(output).toBeDefined()
      expect(output.original_size).toBe(input.length)
      expect(output.processed_size).toBe(input.length)
    })

    it('should throw error on closed client', async () => {
      await client.close()

      const input = Buffer.from('test')
      expect(() => client.processSync(input)).toThrow(KimiFannCoreError)
    })
  })

  describe('execute', () => {
    it('should execute operation successfully', async () => {
      const result = await client.execute()

      expect(result).toBeDefined()
      expect(result.status).toBe('success')
      expect(result.timestamp).toBeDefined()
      expect(result.duration_ms).toBeGreaterThanOrEqual(0)
    })

    it('should execute multiple times', async () => {
      const results = await Promise.all([
        client.execute(),
        client.execute(),
        client.execute(),
      ])

      expect(results).toHaveLength(3)
      results.forEach((result) => {
        expect(result.status).toBe('success')
        expect(result.timestamp).toBeDefined()
      })
    })

    it('should throw error on closed client', async () => {
      await client.close()

      await expect(client.execute()).rejects.toThrow(KimiFannCoreError)
    })
  })

  describe('train', () => {
    it('should train model with default options', async () => {
      const trainingData = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const result = await client.train(trainingData)

      expect(result).toBeDefined()
      expect(result.epochs).toBeGreaterThan(0)
      expect(result.final_loss).toBeGreaterThanOrEqual(0)
      expect(result.accuracy).toBeGreaterThanOrEqual(0)
      expect(result.accuracy).toBeLessThanOrEqual(1)
      expect(result.training_time_ms).toBeGreaterThanOrEqual(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should train model with custom options', async () => {
      const trainingData = Buffer.from([1, 2, 3, 4, 5])
      const options: TrainingOptions = {
        epochs: 50,
        batchSize: 16,
        learningRate: 0.01,
      }

      const result = await client.train(trainingData, options)

      expect(result).toBeDefined()
      expect(result.epochs).toBe(50)
      expect(result.accuracy).toBeGreaterThanOrEqual(0)
    })

    it('should train with large dataset', async () => {
      const trainingData = Buffer.alloc(10000)
      trainingData.fill(0xAB)

      const result = await client.train(trainingData, {
        epochs: 10,
        batchSize: 32,
      })

      expect(result).toBeDefined()
      expect(result.epochs).toBe(10)
    })

    it('should throw error on closed client', async () => {
      await client.close()

      const data = Buffer.from([1, 2, 3])
      await expect(client.train(data)).rejects.toThrow(KimiFannCoreError)
    })
  })

  describe('predict', () => {
    it('should make predictions', async () => {
      const inputData = Buffer.from('prediction input')
      const predictions = await client.predict(inputData)

      expect(predictions).toBeDefined()
      expect(predictions).toHaveProperty('predictions')
      expect(predictions).toHaveProperty('confidence')
      expect(predictions).toHaveProperty('timestamp')
      expect(Array.isArray(predictions.predictions)).toBe(true)
    })

    it('should handle multiple predictions', async () => {
      const inputs = [
        Buffer.from('input 1'),
        Buffer.from('input 2'),
        Buffer.from('input 3'),
      ]

      const results = await Promise.all(
        inputs.map((input) => client.predict(input))
      )

      expect(results).toHaveLength(3)
      results.forEach((result) => {
        expect(result).toHaveProperty('predictions')
        expect(result).toHaveProperty('confidence')
      })
    })

    it('should throw error on closed client', async () => {
      await client.close()

      const data = Buffer.from('test')
      await expect(client.predict(data)).rejects.toThrow(KimiFannCoreError)
    })
  })

  describe('close', () => {
    it('should close client successfully', async () => {
      const isClosed = await client.isClosed()
      expect(isClosed).toBe(false)

      await client.close()

      const isClosedAfter = await client.isClosed()
      expect(isClosedAfter).toBe(true)
    })

    it('should prevent operations on closed client', async () => {
      await client.close()

      const input = Buffer.from('test')

      expect(() => client.processSync(input)).toThrow(KimiFannCoreError)
      await expect(client.process(input)).rejects.toThrow(KimiFannCoreError)
      await expect(client.execute()).rejects.toThrow(KimiFannCoreError)
    })
  })

  describe('isClosed', () => {
    it('should return false for open client', async () => {
      const isClosed = await client.isClosed()
      expect(isClosed).toBe(false)
    })

    it('should return true for closed client', async () => {
      await client.close()
      const isClosed = await client.isClosed()
      expect(isClosed).toBe(true)
    })
  })

  describe('getConfig', () => {
    it('should return configuration', async () => {
      const config = await client.getConfig()

      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })

    it('should return config with custom values', async () => {
      const customConfig: Config = {
        timeout: 15000,
        retries: 7,
        logLevel: 'debug',
      }
      const newClient = new KimiFannCore(customConfig)

      try {
        const config = await newClient.getConfig()
        expect(config).toBeDefined()
      } finally {
        await newClient.close()
      }
    })
  })
})

describe('KimiFannCore - Error Handling', () => {
  let client: KimiFannCore

  beforeEach(() => {
    client = new KimiFannCore()
  })

  afterEach(async () => {
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore
      }
    }
  })

  describe('KimiFannCoreError', () => {
    it('should create error with message and code', () => {
      const error = new KimiFannCoreError('Test error', 'TEST_ERROR')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(KimiFannCoreError)
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.name).toBe('KimiFannCoreError')
    })

    it('should create error with default code', () => {
      const error = new KimiFannCoreError('Test error')

      expect(error.code).toBe('UNKNOWN_ERROR')
    })
  })

  describe('Error Scenarios', () => {
    it('should throw on operations after close', async () => {
      await client.close()

      const input = Buffer.from('test')

      expect(() => client.processSync(input)).toThrow(KimiFannCoreError)
      await expect(client.process(input)).rejects.toThrow(KimiFannCoreError)
      await expect(client.execute()).rejects.toThrow(KimiFannCoreError)
    })
  })
})

describe('KimiFannCore - Concurrency', () => {
  let client: KimiFannCore

  beforeEach(() => {
    client = new KimiFannCore({ maxConcurrency: 10 })
  })

  afterEach(async () => {
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore
      }
    }
  })

  it('should handle concurrent process operations', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      client.process(Buffer.from(`data ${i}`))
    )

    const results = await Promise.all(operations)

    expect(results).toHaveLength(10)
    results.forEach((result) => {
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('original_size')
    })
  })

  it('should handle mixed concurrent operations', async () => {
    const operations = [
      client.execute(),
      client.process(Buffer.from('data')),
      client.train(Buffer.from([1, 2, 3])),
      client.predict(Buffer.from('input')),
      client.execute(),
    ]

    const results = await Promise.all(operations)

    expect(results).toHaveLength(5)
  })

  it('should handle rapid fire operations', async () => {
    const operations = []
    for (let i = 0; i < 20; i++) {
      operations.push(client.process(Buffer.from(`data ${i}`)))
    }

    const results = await Promise.all(operations)

    expect(results).toHaveLength(20)
    results.forEach((result) => {
      expect(result).toHaveProperty('data')
    })
  })
})

describe('KimiFannCore - Data Processing', () => {
  let client: KimiFannCore

  beforeEach(() => {
    client = new KimiFannCore()
  })

  afterEach(async () => {
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore
      }
    }
  })

  it('should preserve data size information', async () => {
    const input = Buffer.from('test data')
    const output = await client.process(input)

    expect(output.original_size).toBe(input.length)
    expect(output.processed_size).toBe(input.length)
  })

  it('should handle binary data', async () => {
    const input = Buffer.from([0x00, 0xFF, 0x7F, 0x80, 0x01])
    const output = await client.process(input)

    expect(output.original_size).toBe(input.length)
    expect(Array.isArray(output.data)).toBe(true)
    expect(output.data.length).toBeGreaterThan(0)
  })

  it('should process UTF-8 encoded strings', async () => {
    const text = 'Hello, World! 你好，世界！'
    const input = Buffer.from(text, 'utf-8')
    const output = await client.process(input)

    expect(output.original_size).toBe(input.length)
  })

  it('should process JSON data', async () => {
    const data = { key: 'value', number: 42, array: [1, 2, 3] }
    const input = Buffer.from(JSON.stringify(data))
    const output = await client.process(input)

    expect(output.original_size).toBe(input.length)
  })
})

describe('KimiFannCore - Lifecycle', () => {
  it('should handle multiple instances', async () => {
    const client1 = new KimiFannCore()
    const client2 = new KimiFannCore()
    const client3 = new KimiFannCore()

    const results = await Promise.all([
      client1.process(Buffer.from('data1')),
      client2.process(Buffer.from('data2')),
      client3.process(Buffer.from('data3')),
    ])

    expect(results).toHaveLength(3)

    await Promise.all([client1.close(), client2.close(), client3.close()])
  })

  it('should handle resource cleanup properly', async () => {
    const client = new KimiFannCore()

    // Perform some operations
    await client.process(Buffer.from('data'))
    await client.execute()

    // Close
    await client.close()

    // Verify closed
    const isClosed = await client.isClosed()
    expect(isClosed).toBe(true)
  })

  it('should handle immediate close after creation', async () => {
    const client = new KimiFannCore()
    await client.close()

    const isClosed = await client.isClosed()
    expect(isClosed).toBe(true)
  })
})

describe('KimiFannCore - Performance', () => {
  let client: KimiFannCore

  beforeEach(() => {
    client = new KimiFannCore()
  })

  afterEach(async () => {
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore
      }
    }
  })

  it('should process 1KB in reasonable time', async () => {
    const input = Buffer.alloc(1024)
    const start = Date.now()
    await client.process(input)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(5000) // 5 seconds
  })

  it('should process 100KB in reasonable time', async () => {
    const input = Buffer.alloc(100 * 1024)
    const start = Date.now()
    await client.process(input)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(10000) // 10 seconds
  })

  it('should handle sync operations quickly', () => {
    const input = Buffer.from('test data')
    const start = Date.now()
    client.processSync(input)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(1000) // 1 second
  })
})

describe('KimiFannCore - Result Types', () => {
  let client: KimiFannCore

  beforeEach(() => {
    client = new KimiFannCore()
  })

  afterEach(async () => {
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore
      }
    }
  })

  it('should return ProcessResult from process', async () => {
    const result = await client.process(Buffer.from('test'))
    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('original_size')
    expect(result).toHaveProperty('processed_size')
    expect(result).toHaveProperty('timestamp')
  })

  it('should return ExecutionResult from execute', async () => {
    const result = await client.execute()
    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('timestamp')
    expect(result).toHaveProperty('duration_ms')
  })

  it('should return TrainingResult from train', async () => {
    const result = await client.train(Buffer.from([1, 2, 3]))
    expect(result).toHaveProperty('epochs')
    expect(result).toHaveProperty('final_loss')
    expect(result).toHaveProperty('accuracy')
    expect(result).toHaveProperty('training_time_ms')
    expect(result).toHaveProperty('timestamp')
  })

  it('should return PredictionResult from predict', async () => {
    const result = await client.predict(Buffer.from('test'))
    expect(result).toHaveProperty('predictions')
    expect(result).toHaveProperty('confidence')
    expect(result).toHaveProperty('timestamp')
  })
})
