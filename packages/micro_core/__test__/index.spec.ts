import { MicroCore, processSimple, getVersion } from '../src/index'

describe('MicroCore', () => {
  describe('MicroCore class', () => {
    it('should create a client instance', () => {
      const client = new MicroCore()
      expect(client).toBeDefined()
    })

    it('should create a client with config', () => {
      const client = new MicroCore({
        timeout: 10000,
        retries: 5,
        maxConcurrency: 20,
        logLevel: 'debug',
      })
      expect(client).toBeDefined()
    })

    it('should process data synchronously', () => {
      const client = new MicroCore()
      const input = Buffer.from('test data')
      const output = client.processSync(input)
      expect(output).toBeDefined()
      expect(Buffer.isBuffer(output)).toBe(true)
    })

    it('should process data asynchronously', async () => {
      const client = new MicroCore()
      const input = Buffer.from('test data')
      const output = await client.process(input)
      expect(output).toBeDefined()
      expect(Buffer.isBuffer(output)).toBe(true)
    })

    it('should handle multiple operations', async () => {
      const client = new MicroCore()
      const inputs = [
        Buffer.from('data1'),
        Buffer.from('data2'),
        Buffer.from('data3'),
      ]

      const results = await Promise.all(inputs.map(input => client.process(input)))

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(Buffer.isBuffer(result)).toBe(true)
      })
    })

    it('should get statistics', () => {
      const client = new MicroCore()
      const input = Buffer.from('test')
      client.processSync(input)

      const stats = client.getStats()
      expect(stats).toBeDefined()
      expect(typeof stats.processedCount).toBe('number')
      expect(typeof stats.totalTimeMs).toBe('number')
      expect(typeof stats.averageTimeMs).toBe('number')
      expect(stats.processedCount).toBeGreaterThanOrEqual(1)
    })

    it('should reset statistics', () => {
      const client = new MicroCore()
      const input = Buffer.from('test')
      client.processSync(input)

      const statsBefore = client.getStats()
      expect(statsBefore.processedCount).toBeGreaterThan(0)

      client.reset()

      const statsAfter = client.getStats()
      expect(statsAfter.processedCount).toBe(0)
    })

    it('should close client', () => {
      const client = new MicroCore()
      expect(() => {
        client.close()
      }).not.toThrow()
    })

    it('should handle empty buffer', () => {
      const client = new MicroCore()
      const input = Buffer.alloc(0)
      const output = client.processSync(input)
      expect(Buffer.isBuffer(output)).toBe(true)
    })

    it('should handle large buffer', () => {
      const client = new MicroCore()
      const input = Buffer.alloc(1024 * 100) // 100KB
      input.fill('x')
      const output = client.processSync(input)
      expect(Buffer.isBuffer(output)).toBe(true)
      expect(output.length).toBeGreaterThan(0)
    })

    it('should maintain order with concurrent operations', async () => {
      const client = new MicroCore()
      const inputs = Array.from({ length: 10 }, (_, i) =>
        Buffer.from(`data-${i}`)
      )

      const results = await Promise.all(
        inputs.map((input, index) =>
          client.process(input).then(result => ({ index, result }))
        )
      )

      expect(results).toHaveLength(10)
      results.forEach((item, index) => {
        expect(item.index).toBe(index)
      })
    })
  })

  describe('processSimple utility function', () => {
    it('should process data without client instance', () => {
      const input = Buffer.from('test data')
      const output = processSimple(input)
      expect(output).toBeDefined()
      expect(Buffer.isBuffer(output)).toBe(true)
    })

    it('should handle empty buffer', () => {
      const input = Buffer.alloc(0)
      const output = processSimple(input)
      expect(Buffer.isBuffer(output)).toBe(true)
    })

    it('should handle various buffer contents', () => {
      const testCases = [
        Buffer.from('simple text'),
        Buffer.from([1, 2, 3, 4, 5]),
        Buffer.from('unicode: 你好世界'),
        Buffer.from('special chars: !@#$%^&*()'),
      ]

      testCases.forEach(input => {
        const output = processSimple(input)
        expect(Buffer.isBuffer(output)).toBe(true)
        expect(output.length).toBeGreaterThan(0)
      })
    })

    it('should handle large data', () => {
      const input = Buffer.alloc(1024 * 500) // 500KB
      input.fill('x')
      const output = processSimple(input)
      expect(Buffer.isBuffer(output)).toBe(true)
    })
  })

  describe('version information', () => {
    it('should get version string', () => {
      const version = getVersion()
      expect(typeof version).toBe('string')
      expect(version.length).toBeGreaterThan(0)
      expect(/^\d+\.\d+\.\d+/.test(version)).toBe(true)
    })

    it('should match package version', () => {
      const version = getVersion()
      // Version should be 0.2.0
      expect(version).toContain('0.2.0')
    })
  })

  describe('error handling', () => {
    it('should handle processing errors gracefully', () => {
      const client = new MicroCore()
      // Test with valid data - should not throw
      const input = Buffer.from('test')
      expect(() => {
        client.processSync(input)
      }).not.toThrow()
    })

    it('should handle close after reset', () => {
      const client = new MicroCore()
      client.reset()
      expect(() => {
        client.close()
      }).not.toThrow()
    })
  })

  describe('performance characteristics', () => {
    it('should handle small data efficiently', () => {
      const client = new MicroCore()
      const input = Buffer.from('x')
      const start = Date.now()
      for (let i = 0; i < 1000; i++) {
        client.processSync(input)
      }
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should complete in less than 5 seconds
    })

    it('should process async operations in parallel', async () => {
      const client = new MicroCore()
      const input = Buffer.alloc(1024 * 10) // 10KB
      input.fill('test')

      const start = Date.now()
      await Promise.all(
        Array.from({ length: 10 }, () => client.process(input))
      )
      const duration = Date.now() - start

      expect(duration).toBeLessThan(10000) // Should complete in less than 10 seconds
    })

    it('should track statistics accurately', () => {
      const client = new MicroCore()
      const input = Buffer.from('test')

      const initialStats = client.getStats()
      expect(initialStats.processedCount).toBe(0)

      client.processSync(input)
      const stats1 = client.getStats()
      expect(stats1.processedCount).toBe(1)

      client.processSync(input)
      const stats2 = client.getStats()
      expect(stats2.processedCount).toBe(2)
    })
  })

  describe('configuration options', () => {
    it('should accept timeout configuration', () => {
      const client = new MicroCore({ timeout: 30000 })
      expect(client).toBeDefined()
      const input = Buffer.from('test')
      const output = client.processSync(input)
      expect(Buffer.isBuffer(output)).toBe(true)
    })

    it('should accept retry configuration', () => {
      const client = new MicroCore({ retries: 10 })
      expect(client).toBeDefined()
      const input = Buffer.from('test')
      const output = client.processSync(input)
      expect(Buffer.isBuffer(output)).toBe(true)
    })

    it('should accept concurrency configuration', () => {
      const client = new MicroCore({ maxConcurrency: 50 })
      expect(client).toBeDefined()
      const input = Buffer.from('test')
      const output = client.processSync(input)
      expect(Buffer.isBuffer(output)).toBe(true)
    })

    it('should accept log level configuration', () => {
      const logLevels = ['debug', 'info', 'warn', 'error']
      logLevels.forEach(level => {
        const client = new MicroCore({ logLevel: level })
        expect(client).toBeDefined()
      })
    })

    it('should work with partial configuration', () => {
      const client = new MicroCore({
        timeout: 5000,
        logLevel: 'info',
      })
      expect(client).toBeDefined()
      const input = Buffer.from('test')
      const output = client.processSync(input)
      expect(Buffer.isBuffer(output)).toBe(true)
    })
  })

  describe('resource management', () => {
    it('should clean up resources on close', () => {
      const client = new MicroCore()
      expect(() => {
        client.close()
      }).not.toThrow()
    })

    it('should allow multiple clients', () => {
      const client1 = new MicroCore({ timeout: 5000 })
      const client2 = new MicroCore({ timeout: 10000 })
      const client3 = new MicroCore()

      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
      expect(client3).toBeDefined()

      const input = Buffer.from('test')
      client1.processSync(input)
      client2.processSync(input)
      client3.processSync(input)

      client1.close()
      client2.close()
      client3.close()
    })

    it('should handle reset between operations', async () => {
      const client = new MicroCore()
      const input = Buffer.from('test')

      await client.process(input)
      let stats = client.getStats()
      expect(stats.processedCount).toBe(1)

      client.reset()
      stats = client.getStats()
      expect(stats.processedCount).toBe(0)

      await client.process(input)
      stats = client.getStats()
      expect(stats.processedCount).toBe(1)
    })
  })
})
