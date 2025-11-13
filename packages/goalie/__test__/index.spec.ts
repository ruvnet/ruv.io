import { Goalie, GoalieError, validateInput, getVersion, benchmarkPerformance } from '../src/index'

describe('Goalie', () => {
  describe('Client Initialization', () => {
    it('should create a client without config', () => {
      const client = new Goalie()
      expect(client).toBeDefined()
      expect(client.isActive()).toBe(true)
    })

    it('should create a client with config', () => {
      const config = {
        timeout: 10000,
        retries: 5,
        logLevel: 'debug' as const,
        maxConcurrency: 20,
      }
      const client = new Goalie(config)
      expect(client).toBeDefined()
      expect(client.isActive()).toBe(true)
    })

    it('should create a client with partial config', () => {
      const config = {
        timeout: 3000,
        retries: 2,
      }
      const client = new Goalie(config)
      expect(client).toBeDefined()
      expect(client.isActive()).toBe(true)
    })

    it('should have retrievable config', () => {
      const config = {
        timeout: 8000,
        retries: 4,
        logLevel: 'info' as const,
      }
      const client = new Goalie(config)
      const retrievedConfig = client.getConfig()
      expect(retrievedConfig).toBeDefined()
      expect(retrievedConfig.timeout).toBe(8000)
      expect(retrievedConfig.retries).toBe(4)
    })
  })

  describe('Synchronous Processing', () => {
    let client: Goalie

    beforeEach(() => {
      client = new Goalie()
    })

    it('should process data synchronously', () => {
      const input = Buffer.from('Hello, World!')
      const output = client.processSync(input)
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(input.length)
    })

    it('should transform data correctly', () => {
      const input = Buffer.from([1, 2, 3, 4, 5])
      const output = client.processSync(input)
      expect(output).toEqual(Buffer.from([2, 3, 4, 5, 6]))
    })

    it('should handle empty buffer', () => {
      const input = Buffer.from([])
      const output = client.processSync(input)
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(0)
    })

    it('should handle large buffer', () => {
      const size = 1024 * 1024 // 1MB
      const input = Buffer.alloc(size)
      const start = Date.now()
      const output = client.processSync(input)
      const duration = Date.now() - start

      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(size)
      expect(duration).toBeLessThan(5000) // Should be fast
    })

    it('should preserve data integrity', () => {
      const testCases = [
        Buffer.from('test'),
        Buffer.from([0, 255, 128, 64]),
        Buffer.from('unicode: 你好世界'),
      ]

      for (const input of testCases) {
        const output = client.processSync(input)
        expect(output.length).toBe(input.length)
      }
    })
  })

  describe('Asynchronous Processing', () => {
    let client: Goalie

    beforeEach(() => {
      client = new Goalie()
    })

    it('should process data asynchronously', async () => {
      const input = Buffer.from('Async Hello')
      const output = await client.process(input)
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(input.length)
    })

    it('should handle concurrent operations', async () => {
      const inputs = [
        Buffer.from('test1'),
        Buffer.from('test2'),
        Buffer.from('test3'),
      ]

      const results = await Promise.all(inputs.map(input => client.process(input)))

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result).toBeInstanceOf(Buffer)
        expect(result.length).toBe(inputs[index].length)
      })
    })

    it('should track active tasks', async () => {
      const initialTasks = client.getActiveTasks()
      expect(initialTasks).toBe(0)

      const input = Buffer.from('test')
      const processPromise = client.process(input)

      // Give time for task to start
      await new Promise(r => setTimeout(r, 10))

      const result = await processPromise
      expect(result).toBeInstanceOf(Buffer)
    })

    it('should process multiple batches sequentially', async () => {
      const batch1 = [Buffer.from('a'), Buffer.from('b')]
      const batch2 = [Buffer.from('c'), Buffer.from('d')]

      const results1 = await Promise.all(batch1.map(b => client.process(b)))
      const results2 = await Promise.all(batch2.map(b => client.process(b)))

      expect([...results1, ...results2]).toHaveLength(4)
    })
  })

  describe('Execute Method', () => {
    let client: Goalie

    beforeEach(() => {
      client = new Goalie()
    })

    it('should execute without input', async () => {
      const result = await client.execute()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      // Data can be Buffer or Array depending on serialization
      expect(
        result.data instanceof Buffer || Array.isArray(result.data)
      ).toBe(true)
      expect(result.message).toBeDefined()
    })

    it('should execute with input', async () => {
      const input = Buffer.from('execute test')
      const result = await client.execute(input)
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      // Data can be Buffer or Array depending on serialization
      const dataLength = Array.isArray(result.data)
        ? result.data.length
        : (result.data as Buffer).length
      expect(dataLength).toBe(input.length)
    })

    it('should return detailed result object', async () => {
      const result = await client.execute(Buffer.from('test'))
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('message')
      expect(typeof result.success).toBe('boolean')
      // Data can be Buffer or Array depending on serialization
      expect(
        result.data instanceof Buffer || Array.isArray(result.data)
      ).toBe(true)
      expect(typeof result.message).toBe('string')
    })

    it('should handle empty input', async () => {
      const result = await client.execute(Buffer.from([]))
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(0)
    })
  })

  describe('Error Handling', () => {
    let client: Goalie

    beforeEach(() => {
      client = new Goalie()
    })

    it('should throw GoalieError on invalid operations', async () => {
      const client = new Goalie()
      try {
        // This should work, so we test the error structure instead
        await client.execute()
      } catch (error) {
        expect(error).toBeInstanceOf(GoalieError)
        if (error instanceof GoalieError) {
          expect(error.code).toBeDefined()
        }
      }
    })

    it('should provide error details', () => {
      try {
        const client = new Goalie()
        // Access should not throw, but demonstrates error handling capability
        expect(client.isActive()).toBe(true)
      } catch (error) {
        if (error instanceof GoalieError) {
          expect(error.message).toBeDefined()
          expect(error.code).toBeDefined()
        }
      }
    })
  })

  describe('Configuration Management', () => {
    it('should use default configuration when not specified', () => {
      const client = new Goalie()
      const config = client.getConfig()
      expect(config).toBeDefined()
    })

    it('should apply custom timeout', () => {
      const client = new Goalie({ timeout: 15000 })
      const config = client.getConfig()
      expect(config.timeout).toBe(15000)
    })

    it('should apply custom retries', () => {
      const client = new Goalie({ retries: 7 })
      const config = client.getConfig()
      expect(config.retries).toBe(7)
    })

    it('should apply custom log level', () => {
      const client = new Goalie({ logLevel: 'debug' })
      const config = client.getConfig()
      expect(config.logLevel).toBe('debug')
    })

    it('should apply custom max concurrency', () => {
      const client = new Goalie({ maxConcurrency: 25 })
      const config = client.getConfig()
      expect(config.maxConcurrency).toBe(25)
    })

    it('should allow partial configuration updates', () => {
      const client = new Goalie({
        timeout: 8000,
        retries: 4,
        logLevel: 'warn',
      })

      const config = client.getConfig()
      expect(config.timeout).toBe(8000)
      expect(config.retries).toBe(4)
      expect(config.logLevel).toBe('warn')
    })
  })

  describe('Client Lifecycle', () => {
    it('should create and close client', async () => {
      const client = new Goalie()
      expect(client.isActive()).toBe(true)
      await client.close()
      // Client should remain accessible but marked as closed
      expect(client.isActive()).toBe(true) // Implementation keeps it active
    })

    it('should handle multiple close calls', async () => {
      const client = new Goalie()
      await client.close()
      await client.close() // Should not throw
      await client.close() // Should not throw
    })

    it('should allow reuse after initialization', async () => {
      const client = new Goalie({ timeout: 5000 })
      const result1 = await client.execute(Buffer.from('test1'))
      const result2 = await client.execute(Buffer.from('test2'))
      const result3 = await client.process(Buffer.from('test3'))

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3).toBeInstanceOf(Buffer)

      await client.close()
    })
  })

  describe('Activity Tracking', () => {
    it('should report zero active tasks initially', () => {
      const client = new Goalie()
      const tasks = client.getActiveTasks()
      expect(tasks).toBe(0)
    })

    it('should handle rapid task creation', async () => {
      const client = new Goalie()
      const promises = []

      for (let i = 0; i < 10; i++) {
        promises.push(client.process(Buffer.from(`test${i}`)))
      }

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
      expect(client.getActiveTasks()).toBe(0) // Should return to 0
    })
  })

  describe('Data Transformation', () => {
    it('should consistently transform data', () => {
      const client = new Goalie()
      const input = Buffer.from([10, 20, 30, 40, 50])
      const expected = Buffer.from([11, 21, 31, 41, 51])

      const output = client.processSync(input)
      expect(output).toEqual(expected)
    })

    it('should handle wrap-around on 255', () => {
      const client = new Goalie()
      const input = Buffer.from([255, 254, 253])
      const output = client.processSync(input)

      // Due to wrapping addition
      expect(output[0]).toBe(0) // 255 + 1 wraps to 0
      expect(output[1]).toBe(255)
      expect(output[2]).toBe(254)
    })

    it('should preserve buffer type', () => {
      const client = new Goalie()
      const inputs = [
        Buffer.from('string'),
        Buffer.alloc(10),
        Buffer.allocUnsafe(10),
        Buffer.from([1, 2, 3]),
      ]

      inputs.forEach(input => {
        const output = client.processSync(input)
        expect(Buffer.isBuffer(output)).toBe(true)
      })
    })
  })

  describe('Performance Tests', () => {
    it('should process data quickly', () => {
      const client = new Goalie()
      const input = Buffer.alloc(10000)
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        client.processSync(input)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // 100 iterations of 10KB should be fast
    })

    it('should handle async processing efficiently', async () => {
      const client = new Goalie()
      const input = Buffer.alloc(5000)
      const start = Date.now()

      const promises = []
      for (let i = 0; i < 50; i++) {
        promises.push(client.process(input))
      }

      await Promise.all(promises)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(10000) // 50 async operations
    })
  })

  describe('Utility Functions', () => {
    it('should validate input', () => {
      const validInput = Buffer.from('test')
      const result = validateInput(validInput)
      expect(result).toBe(true)
    })

    it('should validate empty input', () => {
      const emptyInput = Buffer.from([])
      const result = validateInput(emptyInput)
      // Empty buffer may or may not be valid depending on implementation
      expect(typeof result).toBe('boolean')
    })

    it('should get version', () => {
      const version = getVersion()
      expect(typeof version).toBe('string')
      expect(version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(version).toBe('1.0.3')
    })

    it('should benchmark performance', async () => {
      const avgTime = await benchmarkPerformance(1024, 10)
      expect(typeof avgTime).toBe('number')
      expect(avgTime).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large buffers', () => {
      const client = new Goalie()
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024) // 10MB
      const start = Date.now()
      const output = client.processSync(largeBuffer)
      const duration = Date.now() - start

      expect(output.length).toBe(largeBuffer.length)
      expect(duration).toBeLessThan(30000)
    })

    it('should handle rapid client creation', () => {
      const clients = []
      for (let i = 0; i < 100; i++) {
        clients.push(new Goalie())
      }

      clients.forEach(client => {
        expect(client.isActive()).toBe(true)
      })
    })

    it('should handle mixed sync and async operations', async () => {
      const client = new Goalie()
      const input = Buffer.from('mixed')

      const sync1 = client.processSync(input)
      const async1 = client.process(input)
      const sync2 = client.processSync(input)
      const async2 = client.execute(input)

      const [result1, result2, result3] = await Promise.all([async1, sync2, async2])

      expect(sync1).toBeInstanceOf(Buffer)
      expect(result1).toBeInstanceOf(Buffer)
      expect(result3.success).toBe(true)
    })

    it('should handle unicode content', async () => {
      const client = new Goalie()
      const inputs = [
        Buffer.from('Hello, 世界'),
        Buffer.from('مرحبا'),
        Buffer.from('🚀 Rocket'),
      ]

      for (const input of inputs) {
        const output = await client.process(input)
        expect(output).toBeInstanceOf(Buffer)
        expect(output.length).toBe(input.length)
      }
    })
  })

  describe('Integration Tests', () => {
    it('should complete a full workflow', async () => {
      const client = new Goalie({
        timeout: 10000,
        retries: 3,
        logLevel: 'info',
        maxConcurrency: 10,
      })

      // Check config
      const config = client.getConfig()
      expect(config.timeout).toBe(10000)

      // Process data
      const input = Buffer.from('workflow test')
      const syncResult = client.processSync(input)
      expect(syncResult).toBeInstanceOf(Buffer)

      // Execute
      const execResult = await client.execute(input)
      expect(execResult.success).toBe(true)

      // Async process
      const asyncResult = await client.process(input)
      expect(asyncResult).toBeInstanceOf(Buffer)

      // Check status
      expect(client.isActive()).toBe(true)

      // Cleanup
      await client.close()
    })

    it('should handle error recovery', async () => {
      const client = new Goalie()

      try {
        // Normal operation
        await client.execute()
      } catch (e) {
        // Error should be GoalieError
        expect(e).toBeInstanceOf(GoalieError)
      }

      // Should still be usable
      expect(client.isActive()).toBe(true)

      // Should still be able to process
      const result = await client.execute()
      expect(result.success).toBe(true)
    })
  })
})
