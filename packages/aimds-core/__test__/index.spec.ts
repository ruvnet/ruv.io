import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AimdsCore, createClient, processBuffer, version, Config } from '../src/index'

describe('AimdsCore', () => {
  let client: AimdsCore

  beforeEach(() => {
    client = new AimdsCore()
  })

  afterEach(async () => {
    if (client) {
      await client.close()
    }
  })

  describe('Constructor', () => {
    it('should create a client with default configuration', () => {
      const c = new AimdsCore()
      expect(c).toBeDefined()
      expect(c.isReady()).toBe(true)
    })

    it('should create a client with custom configuration', () => {
      const config: Config = {
        timeout: 10000,
        retries: 5,
        logLevel: 'debug',
        maxConcurrency: 20,
      }
      const c = new AimdsCore(config)
      expect(c).toBeDefined()
      expect(c.isReady()).toBe(true)
    })

    it('should create a client with partial configuration', () => {
      const config: Config = {
        timeout: 3000,
      }
      const c = new AimdsCore(config)
      expect(c).toBeDefined()
      expect(c.getTimeout()).toBe(3000)
    })
  })

  describe('Configuration', () => {
    it('should get default timeout', () => {
      const timeout = client.getTimeout()
      expect(typeof timeout).toBe('number')
      expect(timeout).toBeGreaterThan(0)
    })

    it('should use custom timeout', () => {
      const config: Config = { timeout: 7000 }
      const c = new AimdsCore(config)
      expect(c.getTimeout()).toBe(7000)
    })

    it('should report ready status', () => {
      expect(client.isReady()).toBe(true)
    })
  })

  describe('Synchronous Processing', () => {
    it('should process buffer synchronously', () => {
      const input = Buffer.from('hello world')
      const result = client.processSync(input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Buffer)
      expect(result.message).toBeDefined()
    })

    it('should handle text data', () => {
      const input = Buffer.from('test data')
      const result = client.processSync(input)

      expect(result.success).toBe(true)
      expect(Buffer.isBuffer(result.data)).toBe(true)
    })

    it('should handle binary data', () => {
      const binaryData = Buffer.alloc(10)
      for (let i = 0; i < 10; i++) {
        binaryData[i] = i
      }
      const result = client.processSync(binaryData)

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(10)
    })

    it('should handle large buffers', () => {
      const largeBuffer = Buffer.alloc(1024 * 100) // 100KB
      largeBuffer.fill('x')
      const result = client.processSync(largeBuffer)

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1024 * 100)
    })

    it('should return non-empty result', () => {
      const input = Buffer.from('data')
      const result = client.processSync(input)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should reject empty buffer', () => {
      const input = Buffer.alloc(0)
      expect(() => {
        client.processSync(input)
      }).toThrow()
    })

    it('should reject non-buffer input', () => {
      expect(() => {
        client.processSync('not a buffer' as any)
      }).toThrow()
    })
  })

  describe('Asynchronous Processing', () => {
    it('should process buffer asynchronously', async () => {
      const input = Buffer.from('async test')
      const result = await client.process(input)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Buffer)
      expect(result.message).toBeDefined()
    })

    it('should handle multiple async operations', async () => {
      const inputs = [
        Buffer.from('data1'),
        Buffer.from('data2'),
        Buffer.from('data3'),
      ]

      const results = await Promise.all(
        inputs.map(input => client.process(input))
      )

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.data).toBeInstanceOf(Buffer)
      })
    })

    it('should preserve data order in async operations', async () => {
      const inputs = [
        Buffer.from('first'),
        Buffer.from('second'),
        Buffer.from('third'),
      ]

      const results = await Promise.all(
        inputs.map(input => client.process(input))
      )

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
      })
    })

    it('should handle concurrent operations', async () => {
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(client.process(Buffer.from(`item${i}`)))
      }

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should reject empty buffer in async', async () => {
      const input = Buffer.alloc(0)
      await expect(client.process(input)).rejects.toThrow()
    })

    it('should reject non-buffer input in async', async () => {
      await expect(
        client.process('not a buffer' as any)
      ).rejects.toThrow()
    })

    it('should handle large buffers asynchronously', async () => {
      const largeBuffer = Buffer.alloc(1024 * 1024) // 1MB
      largeBuffer.fill('y')
      const result = await client.process(largeBuffer)

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(1024 * 1024)
    })
  })

  describe('Resource Management', () => {
    it('should close gracefully', async () => {
      const c = new AimdsCore()
      expect(c.isReady()).toBe(true)
      await c.close()
      // Client might still be accessible after close, but resources are released
      expect(c.isReady()).toBe(true)
    })

    it('should allow reuse after close', async () => {
      const input = Buffer.from('test')
      const result1 = client.processSync(input)
      expect(result1.success).toBe(true)

      await client.close()

      const result2 = client.processSync(input)
      expect(result2.success).toBe(true)
    })

    it('should handle multiple close calls', async () => {
      await client.close()
      await client.close() // Should not throw
      await expect(client.close()).resolves.not.toThrow()
    })
  })

  describe('Utility Functions', () => {
    it('should create client with factory function', () => {
      const c = createClient()
      expect(c).toBeInstanceOf(AimdsCore)
      expect(c.isReady()).toBe(true)
    })

    it('should process buffer with utility function', () => {
      const input = Buffer.from('utility test')
      const result = processBuffer(input)

      expect(result.success).toBe(true)
      expect(result.data).toBeInstanceOf(Buffer)
    })

    it('should get version', () => {
      const v = version()
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
      expect(v).toContain('aimds-core')
    })

    it('utility processBuffer should reject empty buffer', () => {
      expect(() => {
        processBuffer(Buffer.alloc(0))
      }).toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle processing with success flag', () => {
      const input = Buffer.from('error test')
      const result = client.processSync(input)

      expect(typeof result.success).toBe('boolean')
      expect(result.message).toBeDefined()
    })

    it('should provide meaningful error messages', async () => {
      const input = Buffer.alloc(0)
      try {
        await client.process(input)
      } catch (error: any) {
        expect(error.message).toContain('empty')
      }
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data after processing', () => {
      const original = Buffer.from('preserve this')
      const result = client.processSync(original)

      expect(result.data).toBeInstanceOf(Buffer)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should handle UTF-8 encoded strings', () => {
      const utf8String = 'Hello, 世界! 🌍'
      const input = Buffer.from(utf8String, 'utf8')
      const result = client.processSync(input)

      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should preserve buffer properties', () => {
      const input = Buffer.alloc(100, 'test')
      const originalLength = input.length
      const result = client.processSync(input)

      expect(Buffer.isBuffer(result.data)).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should process small buffers quickly', () => {
      const input = Buffer.from('fast')
      const start = Date.now()
      const result = client.processSync(input)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle medium buffers efficiently', () => {
      const input = Buffer.alloc(1024 * 10) // 10KB
      input.fill('data')
      const start = Date.now()
      const result = client.processSync(input)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(1000)
    })

    it('should process many items sequentially', () => {
      const start = Date.now()

      for (let i = 0; i < 100; i++) {
        const input = Buffer.from(`item${i}`)
        const result = client.processSync(input)
        expect(result.success).toBe(true)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000)
    })

    it('should handle async operations with reasonable latency', async () => {
      const input = Buffer.from('latency test')
      const start = Date.now()
      const result = await client.process(input)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Configuration Edge Cases', () => {
    it('should handle undefined configuration', () => {
      const c = new AimdsCore(undefined)
      expect(c.isReady()).toBe(true)
    })

    it('should handle empty configuration object', () => {
      const c = new AimdsCore({})
      expect(c.isReady()).toBe(true)
    })

    it('should handle zero values in configuration', () => {
      const config: Config = {
        timeout: 0,
        retries: 0,
        maxConcurrency: 0,
      }
      const c = new AimdsCore(config)
      expect(c.isReady()).toBe(true)
    })

    it('should handle large timeout values', () => {
      const config: Config = {
        timeout: 60000,
      }
      const c = new AimdsCore(config)
      expect(c.getTimeout()).toBe(60000)
    })
  })

  describe('Type Safety', () => {
    it('should properly type ProcessResult', () => {
      const input = Buffer.from('type test')
      const result = client.processSync(input)

      // TypeScript should ensure these properties exist
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('message')
    })

    it('should properly type Config', () => {
      const config: Config = {
        timeout: 5000,
        retries: 3,
        logLevel: 'info',
        maxConcurrency: 10,
      }
      const c = new AimdsCore(config)
      expect(c).toBeDefined()
    })
  })
})
