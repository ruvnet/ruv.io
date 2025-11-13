import { TemporalNeuralSolverClass, process, processSync, processWithResult, version } from '../src/index'

describe('TemporalNeuralSolver', () => {
  describe('TemporalNeuralSolverClass', () => {
    it('should create a solver instance', () => {
      const solver = new TemporalNeuralSolverClass()
      expect(solver).toBeDefined()
    })

    it('should create a solver with configuration', () => {
      const solver = new TemporalNeuralSolverClass({
        timeout: 10000,
        retries: 5,
        logLevel: 'debug',
        maxConcurrency: 20
      })
      expect(solver).toBeDefined()
    })

    it('should process data', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.from('test data')
      const result = solver.process(input)
      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
    })

    it('should process data synchronously', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.from('test data')
      const result = solver.processSync(input)
      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
    })

    it('should return the same data after processing', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.from('test data')
      const result = solver.process(input)
      expect(result).toEqual(input)
    })

    it('should get configuration', () => {
      const config = {
        timeout: 8000,
        retries: 4,
        logLevel: 'trace',
        maxConcurrency: 15
      }
      const solver = new TemporalNeuralSolverClass(config)
      const retrieved = solver.getConfig()
      expect(retrieved).toBeDefined()
      expect(retrieved.timeout).toBe(config.timeout)
    })

    it('should check if solver is ready', () => {
      const solver = new TemporalNeuralSolverClass()
      const ready = solver.isReady()
      expect(ready).toBe(true)
    })

    it('should close solver gracefully', () => {
      const solver = new TemporalNeuralSolverClass()
      expect(() => solver.close()).not.toThrow()
    })

    it('should handle empty buffer', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.alloc(0)
      const result = solver.process(input)
      expect(result).toBeDefined()
    })

    it('should handle large buffer', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.alloc(100000, 'a')
      const result = solver.process(input)
      expect(result).toBeDefined()
      expect(result.length).toBe(input.length)
    })
  })

  describe('process utility function', () => {
    it('should process data with default settings', () => {
      const input = Buffer.from('test data')
      const result = process(input)
      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
    })

    it('should return processed data', () => {
      const input = Buffer.from('hello world')
      const result = process(input)
      expect(result).toEqual(input)
    })

    it('should handle multiple calls', () => {
      const input1 = Buffer.from('data 1')
      const input2 = Buffer.from('data 2')
      const result1 = process(input1)
      const result2 = process(input2)
      expect(result1).toEqual(input1)
      expect(result2).toEqual(input2)
    })
  })

  describe('processSync utility function', () => {
    it('should process data synchronously', () => {
      const input = Buffer.from('test data')
      const result = processSync(input)
      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result)).toBe(true)
    })

    it('should return processed data', () => {
      const input = Buffer.from('hello world')
      const result = processSync(input)
      expect(result).toEqual(input)
    })

    it('should handle unicode data', () => {
      const input = Buffer.from('hello world 你好')
      const result = processSync(input)
      expect(result).toBeDefined()
    })
  })

  describe('processWithResult utility function', () => {
    it('should return detailed result', () => {
      const input = Buffer.from('test data')
      const result = processWithResult(input)
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('data')
    })

    it('should return success on valid input', () => {
      const input = Buffer.from('test data')
      const result = processWithResult(input)
      expect(result.success).toBe(true)
    })

    it('should contain data on success', () => {
      const input = Buffer.from('test data')
      const result = processWithResult(input)
      if (result.success) {
        expect(result.data).toBeDefined()
        expect(result.data).toEqual(Array.from(input))
      }
    })

    it('should not have error on success', () => {
      const input = Buffer.from('test data')
      const result = processWithResult(input)
      if (result.success) {
        expect(result.error == null).toBe(true)
      }
    })
  })

  describe('version utility function', () => {
    it('should return version string', () => {
      const ver = version()
      expect(typeof ver).toBe('string')
      expect(ver.length).toBeGreaterThan(0)
    })

    it('should have valid version format', () => {
      const ver = version()
      expect(/^\d+\.\d+\.\d+/.test(ver)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle multiple solver instances', () => {
      const solver1 = new TemporalNeuralSolverClass()
      const solver2 = new TemporalNeuralSolverClass()

      const input = Buffer.from('test')
      const result1 = solver1.process(input)
      const result2 = solver2.process(input)

      expect(result1).toEqual(result2)
    })

    it('should handle rapid sequential operations', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.from('rapid test')

      const results = [
        solver.process(input),
        solver.process(input),
        solver.process(input)
      ]

      expect(results).toHaveLength(3)
      results.forEach(r => {
        expect(r).toEqual(input)
      })
    })

    it('should handle mixed sync and process operations', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.from('mixed test')

      const syncResult = solver.processSync(input)
      const result = solver.process(input)

      expect(syncResult).toEqual(result)
    })

    it('should maintain state across operations', () => {
      const config = {
        timeout: 6000,
        retries: 2,
        logLevel: 'warn'
      }
      const solver = new TemporalNeuralSolverClass(config)

      solver.process(Buffer.from('data1'))
      const cfg = solver.getConfig()

      expect(cfg.timeout).toBe(config.timeout)
      expect(cfg.retries).toBe(config.retries)
    })

    it('should handle special buffer content', () => {
      const solver = new TemporalNeuralSolverClass()

      // Buffer with null bytes
      const nullBuffer = Buffer.from([0, 1, 2, 0, 3, 4])
      const result = solver.process(nullBuffer)
      expect(result).toEqual(nullBuffer)
    })
  })

  describe('performance characteristics', () => {
    it('should complete processing quickly', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.alloc(50000, 'a')

      const start = Date.now()
      solver.process(input)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
    })

    it('should handle rapid sequential operations efficiently', () => {
      const solver = new TemporalNeuralSolverClass()

      const start = Date.now()
      for (let i = 0; i < 100; i++) {
        solver.process(Buffer.from(`data ${i}`))
      }
      const duration = Date.now() - start

      expect(duration).toBeLessThan(2000)
    })

    it('should efficiently handle repeated operations', () => {
      const solver = new TemporalNeuralSolverClass()
      const input = Buffer.from('repeated')

      const start = Date.now()
      for (let i = 0; i < 1000; i++) {
        solver.processSync(input)
      }
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
    })
  })

  describe('error scenarios', () => {
    it('should handle processing gracefully', () => {
      const solver = new TemporalNeuralSolverClass()
      expect(() => solver.process(Buffer.from('safe data'))).not.toThrow()
    })

    it('should recover after operations', () => {
      const solver = new TemporalNeuralSolverClass()

      // First operation
      const result1 = solver.process(Buffer.from('data1'))
      expect(result1).toBeDefined()

      // Second operation should work fine
      const result2 = solver.process(Buffer.from('data2'))
      expect(result2).toBeDefined()
    })
  })
})
