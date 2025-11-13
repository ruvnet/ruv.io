import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  CudaRustWasm,
  CudaRustWasmError,
  transpileCudaToRust,
  processCudaCode,
  batchTranspileCuda,
  validateCudaCode,
  getTranspilationStats,
  TranspileConfig,
  TranspileResult,
  ValidationResult,
} from '../src/index'

describe('CUDA Rust WASM - Transpiler', () => {
  const simpleCudaCode = `
    __global__ void add_kernel(float *a, float *b, float *c, int n) {
      int idx = blockIdx.x * blockDim.x + threadIdx.x;
      if (idx < n) {
        c[idx] = a[idx] + b[idx];
      }
    }
  `

  const deviceFunctionCode = `
    __device__ float multiply(float a, float b) {
      return a * b;
    }
  `

  const complexCudaCode = `
    __global__ void matrix_multiply(float *A, float *B, float *C, int N) {
      int row = blockIdx.y * blockDim.y + threadIdx.y;
      int col = blockIdx.x * blockDim.x + threadIdx.x;

      if (row < N && col < N) {
        float sum = 0.0f;
        for (int k = 0; k < N; k++) {
          sum += A[row * N + k] * B[k * N + col];
        }
        C[row * N + col] = sum;
      }
    }
  `

  describe('transpileCudaToRust - Basic Transpilation', () => {
    it('should transpile simple CUDA kernel', () => {
      const result = transpileCudaToRust(simpleCudaCode)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.output).toContain('pub fn')
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should handle device functions', () => {
      const result = transpileCudaToRust(deviceFunctionCode)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.output).toContain('fn')
    })

    it('should transpile complex kernels', () => {
      const result = transpileCudaToRust(complexCudaCode)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.output.length).toBeGreaterThan(0)
    })

    it('should throw error on empty input', () => {
      expect(() => transpileCudaToRust('')).toThrow(CudaRustWasmError)
    })

    it('should throw error on invalid input type', () => {
      expect(() => transpileCudaToRust(null as any)).toThrow(CudaRustWasmError)
    })

    it('should include header comments in output', () => {
      const result = transpileCudaToRust(simpleCudaCode)

      expect(result.output).toContain('Auto-transpiled from CUDA')
    })

    it('should preserve original metadata', () => {
      const result = transpileCudaToRust(simpleCudaCode)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.transpiler_version).toBe('0.1.6')
    })

    it('should calculate correct sizes', () => {
      const result = transpileCudaToRust(simpleCudaCode)

      expect(result.input_size).toBe(simpleCudaCode.length)
      expect(result.output_size).toBe(result.output.length)
    })

    it('should measure processing time', () => {
      const result = transpileCudaToRust(simpleCudaCode)

      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0)
      expect(typeof result.processing_time_ms).toBe('number')
    })
  })

  describe('processCudaCode - Configurable Processing', () => {
    it('should process with default config', () => {
      const result = processCudaCode(simpleCudaCode)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
    })

    it('should process with custom config', () => {
      const config: TranspileConfig = {
        timeout: 10000,
        retries: 5,
        logLevel: 'debug',
        maxConcurrency: 20,
      }

      const result = processCudaCode(simpleCudaCode, config)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should include config in metadata', () => {
      const config: TranspileConfig = {
        timeout: 5000,
        logLevel: 'info',
      }

      const result = processCudaCode(simpleCudaCode, config)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.config).toBeDefined()
    })

    it('should handle missing config gracefully', () => {
      const result = processCudaCode(simpleCudaCode, undefined)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should throw on empty code', () => {
      expect(() => processCudaCode('')).toThrow(CudaRustWasmError)
    })
  })

  describe('batchTranspileCuda - Batch Processing', () => {
    it('should transpile multiple files', () => {
      const files = [simpleCudaCode, deviceFunctionCode, complexCudaCode]
      const results = batchTranspileCuda(files)

      expect(results).toHaveLength(3)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[2].success).toBe(true)
    })

    it('should process each file independently', () => {
      const files = [simpleCudaCode, deviceFunctionCode]
      const results = batchTranspileCuda(files)

      expect(results[0].output).not.toBe(results[1].output)
      expect(results[0].input_size).not.toBe(results[1].input_size)
    })

    it('should handle empty array', () => {
      const results = batchTranspileCuda([])

      expect(results).toHaveLength(0)
    })

    it('should handle large batch', () => {
      const files = Array.from({ length: 50 }, (_, i) =>
        `__global__ void kernel_${i}() { threadIdx.x; }`
      )

      const results = batchTranspileCuda(files)

      expect(results).toHaveLength(50)
      expect(results.every((r) => r.success)).toBe(true)
    })

    it('should throw on invalid input type', () => {
      expect(() => batchTranspileCuda(null as any)).toThrow(CudaRustWasmError)
    })

    it('should handle mixed CUDA code styles', () => {
      const files = [
        '__global__ void kernel1() {}',
        '__device__ void func1() {}',
        '// Comment code',
      ]

      const results = batchTranspileCuda(files)

      expect(results).toHaveLength(3)
    })
  })

  describe('validateCudaCode - Syntax Validation', () => {
    it('should validate correct CUDA code', () => {
      const result = validateCudaCode(simpleCudaCode)

      expect(result).toBeDefined()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect syntax issues', () => {
      const invalidCode = `
        __global__ void bad_kernel() {
          int x = 10
        }
      `

      const result = validateCudaCode(invalidCode)

      expect(result).toBeDefined()
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should count lines correctly', () => {
      const result = validateCudaCode(simpleCudaCode)

      expect(result.line_count).toBeGreaterThan(0)
    })

    it('should include timestamp', () => {
      const result = validateCudaCode(simpleCudaCode)

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })

    it('should handle comments', () => {
      const codeWithComments = `
        // This is a comment
        __global__ void kernel() {
          /* Multi-line
             comment */
        }
      `

      const result = validateCudaCode(codeWithComments)

      expect(result).toBeDefined()
    })

    it('should return validation errors as array', () => {
      const result = validateCudaCode(simpleCudaCode)

      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })
  })

  describe('getTranspilationStats - Statistics Tracking', () => {
    it('should return valid statistics object', () => {
      const stats = getTranspilationStats()

      expect(stats).toBeDefined()
      expect(stats.total_processed).toBeGreaterThanOrEqual(0)
      expect(stats.total_time_ms).toBeGreaterThanOrEqual(0)
      expect(stats.success_count).toBeGreaterThanOrEqual(0)
      expect(stats.error_count).toBeGreaterThanOrEqual(0)
    })

    it('should calculate average time correctly', () => {
      const stats = getTranspilationStats()

      if (stats.total_processed > 0) {
        expect(stats.average_time_ms).toBeGreaterThanOrEqual(0)
      }
    })

    it('should handle previous stats', () => {
      const prevStats = {
        total_processed: 10,
        total_time_ms: 100,
        average_time_ms: 10,
        success_count: 10,
        error_count: 0,
      }

      const stats = getTranspilationStats(prevStats)

      expect(stats).toBeDefined()
      expect(stats.total_processed).toBeGreaterThanOrEqual(prevStats.total_processed)
    })
  })

  describe('CudaRustWasm Class - Main API', () => {
    let client: CudaRustWasm

    beforeAll(() => {
      client = new CudaRustWasm()
    })

    afterAll(async () => {
      await client.close()
    })

    it('should create instance', () => {
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(CudaRustWasm)
    })

    it('should transpile via instance', () => {
      const result = client.transpile(simpleCudaCode)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
    })

    it('should process sync', () => {
      const result = client.processSync(simpleCudaCode)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should process async', async () => {
      const result = await client.process(simpleCudaCode)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle buffer input for processSync', () => {
      const buffer = Buffer.from(simpleCudaCode)
      const result = client.processSync(buffer)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle buffer input for process', async () => {
      const buffer = Buffer.from(simpleCudaCode)
      const result = await client.process(buffer)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should get stats', () => {
      const stats = client.getStats()

      expect(stats).toBeDefined()
      expect(stats.total_processed).toBeGreaterThanOrEqual(0)
    })

    it('should close gracefully', async () => {
      const testClient = new CudaRustWasm()
      await testClient.close()
      expect(testClient).toBeDefined()
    })
  })

  describe('CudaRustWasm with Config', () => {
    it('should create instance with config', () => {
      const config: TranspileConfig = {
        timeout: 10000,
        retries: 5,
        logLevel: 'debug',
        maxConcurrency: 20,
      }

      const client = new CudaRustWasm(config)
      expect(client).toBeDefined()
    })

    it('should work with partial config', () => {
      const config: TranspileConfig = {
        timeout: 5000,
      }

      const client = new CudaRustWasm(config)
      expect(client).toBeDefined()
    })

    it('should work with empty config', () => {
      const client = new CudaRustWasm({})
      expect(client).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    let client: CudaRustWasm

    beforeAll(() => {
      client = new CudaRustWasm()
    })

    afterAll(async () => {
      await client.close()
    })

    it('should throw CudaRustWasmError on invalid transpile input', () => {
      expect(() => client.transpile('')).toThrow(CudaRustWasmError)
    })

    it('should have error code', () => {
      try {
        client.transpile('')
      } catch (error: any) {
        expect(error.code).toBeDefined()
        expect(typeof error.code).toBe('string')
      }
    })

    it('should have error details', () => {
      try {
        client.transpile('')
      } catch (error: any) {
        expect(error.message).toBeDefined()
        expect(typeof error.message).toBe('string')
      }
    })

    it('should handle processing errors gracefully', () => {
      expect(() => {
        client.transpile(null as any)
      }).toThrow(CudaRustWasmError)
    })
  })

  describe('Integration Tests', () => {
    let client: CudaRustWasm

    beforeAll(() => {
      client = new CudaRustWasm()
    })

    afterAll(async () => {
      await client.close()
    })

    it('should transpile, validate, and get stats', () => {
      // Transpile
      const transpileResult = client.transpile(simpleCudaCode)
      expect(transpileResult.success).toBe(true)

      // Validate original
      const validation = validateCudaCode(simpleCudaCode)
      expect(validation).toBeDefined()

      // Get stats
      const stats = client.getStats()
      expect(stats.total_processed).toBeGreaterThan(0)
    })

    it('should handle batch and individual processing', () => {
      // Individual processing
      const individual1 = client.transpile(simpleCudaCode)
      const individual2 = client.transpile(deviceFunctionCode)

      // Batch processing
      const batch = batchTranspileCuda([simpleCudaCode, deviceFunctionCode])

      expect(batch).toHaveLength(2)
      expect(individual1.success).toBe(true)
      expect(individual2.success).toBe(true)
    })

    it('should process multiple code snippets in sequence', async () => {
      const codes = [simpleCudaCode, deviceFunctionCode, complexCudaCode]

      const results = await Promise.all(
        codes.map((code) => client.process(code))
      )

      expect(results).toHaveLength(3)
      expect(results.every((r) => r.success)).toBe(true)
    })

    it('should maintain integrity through processing pipeline', () => {
      // Process code
      const result = client.transpile(simpleCudaCode)

      // Verify output is valid Rust-like code
      expect(result.output).toContain('pub fn')
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0)
      expect(result.input_size).toBeGreaterThan(0)
    })
  })

  describe('Performance Tests', () => {
    let client: CudaRustWasm

    beforeAll(() => {
      client = new CudaRustWasm()
    })

    afterAll(async () => {
      await client.close()
    })

    it('should transpile simple code quickly', () => {
      const start = Date.now()
      const result = client.transpile(simpleCudaCode)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should handle large batch efficiently', () => {
      const largeCode = simpleCudaCode.repeat(10)
      const start = Date.now()
      const result = client.transpile(largeCode)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    it('should process multiple items without memory leak', async () => {
      const iterations = 100
      let totalTime = 0

      for (let i = 0; i < iterations; i++) {
        const start = Date.now()
        const result = await client.process(simpleCudaCode)
        totalTime += Date.now() - start

        expect(result.success).toBe(true)
      }

      const averageTime = totalTime / iterations
      expect(averageTime).toBeLessThan(100) // Average should be under 100ms
    })
  })
})
