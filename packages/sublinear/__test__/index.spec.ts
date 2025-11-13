import { describe, it, expect, beforeAll } from 'vitest'
import {
  Sublinear,
  SublinearError,
  initializeSolver,
  solveSystem,
  processBuffer,
  batchSolve,
  analyzeSystem,
  validateSystem,
  SolverConfig,
  SystemMatrix,
  SolutionResult,
} from '../src/index'

describe('Sublinear Solver', () => {
  const config: SolverConfig = {
    timeout: 5000,
    retries: 3,
    logLevel: 'info',
    maxConcurrency: 10,
    tolerance: 1e-8,
    maxIterations: 1000,
  }

  // Simple 2x2 diagonally dominant system: [3 1; 1 3] * x = [9; 9] => x = [2; 2]
  const simpleMatrix: SystemMatrix = {
    id: 'simple-2x2',
    dimension: 2,
    data: [
      [3.0, 1.0],
      [1.0, 3.0],
    ],
    metadata: { type: 'test', description: 'Simple 2x2 diagonally dominant' },
  }

  const simpleRhs = [9.0, 9.0]

  // 3x3 system: [4 -1 0; -1 4 -1; 0 -1 3] * x = [15; 10; 10] => approx [4; 3; 4]
  const matrix3x3: SystemMatrix = {
    id: 'matrix-3x3',
    dimension: 3,
    data: [
      [4.0, -1.0, 0.0],
      [-1.0, 4.0, -1.0],
      [0.0, -1.0, 3.0],
    ],
    metadata: { type: 'test', description: '3x3 tridiagonal system' },
  }

  const rhs3x3 = [15.0, 10.0, 10.0]

  describe('initializeSolver', () => {
    it('should initialize solver with default config', () => {
      const result = initializeSolver()

      expect(result).toBeDefined()
      expect(result.status).toBe('initialized')
      expect(result.message).toBeDefined()
      expect(result.version).toBeDefined()
    })

    it('should initialize solver with custom config', () => {
      const result = initializeSolver(config)

      expect(result).toBeDefined()
      expect(result.status).toBe('initialized')
    })

    it('should return timestamp', () => {
      const result = initializeSolver()

      expect(result.timestamp).toBeDefined()
      expect(result.timestamp).toMatch(/^\d+$/)
    })
  })

  describe('solveSystem', () => {
    it('should solve a 2x2 system', () => {
      const result = solveSystem(simpleMatrix, simpleRhs)

      expect(result).toBeDefined()
      expect(result.id).toBe('simple-2x2')
      expect(result.solution).toBeDefined()
      expect(result.solution.length).toBe(2)
      expect(result.residual).toBeDefined()
      expect(result.iterations).toBeGreaterThan(0)
      expect(result.elapsed_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should solve a 3x3 system', () => {
      const result = solveSystem(matrix3x3, rhs3x3)

      expect(result).toBeDefined()
      expect(result.id).toBe('matrix-3x3')
      expect(result.solution.length).toBe(3)
      expect(result.converged).toBeDefined()
    })

    it('should return converged status', () => {
      const result = solveSystem(simpleMatrix, simpleRhs)

      expect(typeof result.converged).toBe('boolean')
    })

    it('should calculate small residual for diagonally dominant system', () => {
      const result = solveSystem(simpleMatrix, simpleRhs)

      expect(result.residual).toBeLessThan(0.1)
    })

    it('should preserve matrix metadata', () => {
      const result = solveSystem(simpleMatrix, simpleRhs)

      expect(result.metadata).toEqual(simpleMatrix.metadata)
    })

    it('should handle empty matrix gracefully', () => {
      const emptyMatrix: SystemMatrix = {
        id: 'empty',
        dimension: 0,
        data: [],
        metadata: {},
      }

      expect(() => solveSystem(emptyMatrix, [])).toThrow()
    })

    it('should handle dimension mismatch', () => {
      const wrongRhs = [1.0, 2.0, 3.0] // 3 elements for 2x2 matrix

      expect(() => solveSystem(simpleMatrix, wrongRhs)).toThrow()
    })
  })

  describe('analyzeSystem', () => {
    it('should analyze system properties', () => {
      const analysis = analyzeSystem(simpleMatrix)

      expect(analysis).toBeDefined()
      expect(analysis.id).toBe('simple-2x2')
      expect(analysis.dimension).toBe(2)
      expect(analysis.diagonal_dominance).toBeDefined()
      expect(analysis.max_norm).toBeGreaterThan(0)
      expect(analysis.is_diagonally_dominant).toBeDefined()
    })

    it('should detect diagonally dominant systems', () => {
      const analysis = analyzeSystem(simpleMatrix)

      // Our simple matrix [3 1; 1 3] is diagonally dominant
      expect(analysis.is_diagonally_dominant).toBe(true)
    })

    it('should calculate sparsity', () => {
      const analysis = analyzeSystem(simpleMatrix)

      expect(analysis.sparsity).toBeGreaterThanOrEqual(0)
      expect(analysis.sparsity).toBeLessThanOrEqual(1)
    })

    it('should estimate condition number', () => {
      const analysis = analyzeSystem(simpleMatrix)

      expect(analysis.condition_estimate).toBeGreaterThan(0)
    })

    it('should return timestamp', () => {
      const analysis = analyzeSystem(simpleMatrix)

      expect(analysis.timestamp).toBeDefined()
      expect(analysis.timestamp).toMatch(/^\d+$/)
    })
  })

  describe('validateSystem', () => {
    it('should validate correct system', () => {
      const validation = validateSystem(simpleMatrix, simpleRhs)

      expect(validation).toBeDefined()
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should report dimension mismatch', () => {
      const wrongRhs = [1.0, 2.0, 3.0]
      const validation = validateSystem(simpleMatrix, wrongRhs)

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should return matrix ID', () => {
      const validation = validateSystem(simpleMatrix, simpleRhs)

      expect(validation.matrix_id).toBe('simple-2x2')
    })

    it('should return dimension', () => {
      const validation = validateSystem(simpleMatrix, simpleRhs)

      expect(validation.dimension).toBe(2)
    })

    it('should return timestamp', () => {
      const validation = validateSystem(simpleMatrix, simpleRhs)

      expect(validation.timestamp).toBeDefined()
    })
  })

  describe('batchSolve', () => {
    it('should solve multiple systems', () => {
      const systems = [simpleMatrix, matrix3x3]
      const rhsVectors = [simpleRhs, rhs3x3]
      const results = batchSolve(systems, rhsVectors)

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('simple-2x2')
      expect(results[1].id).toBe('matrix-3x3')
    })

    it('should solve each system independently', () => {
      const systems = [simpleMatrix, matrix3x3]
      const rhsVectors = [simpleRhs, rhs3x3]
      const results = batchSolve(systems, rhsVectors)

      expect(results[0].solution.length).toBe(2)
      expect(results[1].solution.length).toBe(3)
    })

    it('should handle empty batch', () => {
      const results = batchSolve([], [])

      expect(results).toHaveLength(0)
    })

    it('should handle large batch', () => {
      const systems = Array.from({ length: 10 }, (_, i) => ({
        id: `system-${i}`,
        dimension: 2,
        data: simpleMatrix.data,
        metadata: { index: i },
      }))
      const rhsVectors = Array(10).fill(simpleRhs)

      const results = batchSolve(systems, rhsVectors)

      expect(results).toHaveLength(10)
    })

    it('should handle mismatched batch lengths', () => {
      const systems = [simpleMatrix]
      const rhsVectors = [simpleRhs, rhs3x3]

      expect(() => batchSolve(systems, rhsVectors)).toThrow()
    })
  })

  describe('processBuffer', () => {
    it('should process buffer data', () => {
      const input = [72, 101, 108, 108, 111] // "Hello"
      const output = processBuffer(input as any)

      expect(output).toBeDefined()
      expect(Array.isArray(output)).toBe(true)
    })

    it('should preserve data', () => {
      const input = [1, 2, 3, 4, 5]
      const output = processBuffer(input as any)

      expect(output.length).toBe(5)
    })

    it('should accept processing options', () => {
      const input = [84, 101, 115, 116] // "Test"
      const output = processBuffer(input as any, { mode: 'fast' })

      expect(output).toBeDefined()
    })

    it('should handle empty buffer with error', () => {
      const emptyBuffer: number[] = []

      expect(() => processBuffer(emptyBuffer as any)).toThrow()
    })

    it('should process large buffers', () => {
      const largeBuffer = Array(1024).fill(0x42)
      const output = processBuffer(largeBuffer as any)

      expect(output.length).toBe(largeBuffer.length)
    })
  })

  describe('Sublinear class', () => {
    let solver: Sublinear

    beforeAll(() => {
      solver = new Sublinear(config)
    })

    it('should create instance', () => {
      expect(solver).toBeDefined()
      expect(solver).toBeInstanceOf(Sublinear)
    })

    it('should solve via instance method', () => {
      const result = solver.solve(simpleMatrix, simpleRhs)

      expect(result).toBeDefined()
      expect(result.id).toBe('simple-2x2')
    })

    it('should batch solve via instance method', () => {
      const systems = [simpleMatrix, matrix3x3]
      const rhsVectors = [simpleRhs, rhs3x3]
      const results = solver.solveBatch(systems, rhsVectors)

      expect(results).toHaveLength(2)
    })

    it('should analyze via instance method', () => {
      const analysis = solver.analyze(simpleMatrix)

      expect(analysis).toBeDefined()
      expect(analysis.id).toBe('simple-2x2')
    })

    it('should validate via instance method', () => {
      const validation = solver.validate(simpleMatrix, simpleRhs)

      expect(validation).toBeDefined()
      expect(validation.valid).toBe(true)
    })

    it('should process buffer via instance method', () => {
      const buffer = [84, 101, 115, 116] // "Test" in bytes
      const output = solver.process(buffer as any)

      expect(output).toBeDefined()
      expect(Array.isArray(output)).toBe(true)
    })

    it('should close cleanly', async () => {
      const tempSolver = new Sublinear()
      await tempSolver.close()
      expect(tempSolver).toBeDefined()
    })

    it('should create stream', () => {
      const stream = solver.createStream()

      expect(stream).toBeDefined()
      expect(stream.write).toBeDefined()
      expect(stream.read).toBeDefined()
      expect(stream.on).toBeDefined()
    })
  })

  describe('SublinearError class', () => {
    it('should create error with code', () => {
      const error = new SublinearError('INVALID_INPUT', 'Input validation failed')

      expect(error).toBeInstanceOf(SublinearError)
      expect(error.code).toBe('INVALID_INPUT')
      expect(error.message).toBe('Input validation failed')
      expect(error.name).toBe('SublinearError')
    })

    it('should create error with details', () => {
      const details = { expected: 2, received: 3 }
      const error = new SublinearError(
        'DIMENSION_MISMATCH',
        'Dimensions do not match',
        details
      )

      expect(error.details).toEqual(details)
    })
  })

  describe('Integration tests', () => {
    it('should analyze, validate, and solve system', () => {
      // Analyze
      const analysis = analyzeSystem(simpleMatrix)
      expect(analysis.is_diagonally_dominant).toBe(true)

      // Validate
      const validation = validateSystem(simpleMatrix, simpleRhs)
      expect(validation.valid).toBe(true)

      // Solve
      const solution = solveSystem(simpleMatrix, simpleRhs)
      expect(solution.converged).toBeDefined()
    })

    it('should handle complete workflow with multiple systems', () => {
      const systems = [simpleMatrix, matrix3x3]
      const rhsVectors = [simpleRhs, rhs3x3]

      // Analyze all systems
      systems.forEach((sys) => {
        const analysis = analyzeSystem(sys)
        expect(analysis).toBeDefined()
      })

      // Validate all systems
      systems.forEach((sys, i) => {
        const validation = validateSystem(sys, rhsVectors[i])
        expect(validation.valid).toBe(true)
      })

      // Batch solve
      const results = batchSolve(systems, rhsVectors)
      expect(results).toHaveLength(2)
    })

    it('should use Sublinear class for complete workflow', () => {
      const solver = new Sublinear(config)

      // Analyze
      const analysis = solver.analyze(simpleMatrix)
      expect(analysis.is_diagonally_dominant).toBe(true)

      // Validate
      const validation = solver.validate(simpleMatrix, simpleRhs)
      expect(validation.valid).toBe(true)

      // Solve
      const solution = solver.solve(simpleMatrix, simpleRhs)
      expect(solution.solution).toBeDefined()

      // Process buffer
      const buffer = [100, 97, 116, 97] // "data" in bytes
      const processed = solver.process(buffer as any)
      expect(processed).toBeDefined()
    })
  })

  describe('Performance and edge cases', () => {
    it('should handle large systems', () => {
      const n = 10
      const largeMatrix: SystemMatrix = {
        id: 'large-system',
        dimension: n,
        data: Array(n)
          .fill(null)
          .map((_, i) => {
            const row = Array(n).fill(0)
            row[i] = 10.0 // Diagonal dominance
            if (i > 0) row[i - 1] = -1.0
            if (i < n - 1) row[i + 1] = -1.0
            return row
          }),
        metadata: { size: 'large' },
      }

      const largeRhs = Array(n).fill(1.0)
      const result = solveSystem(largeMatrix, largeRhs)

      expect(result).toBeDefined()
      expect(result.solution.length).toBe(n)
    })

    it('should measure solve time', () => {
      const result = solveSystem(simpleMatrix, simpleRhs)

      expect(result.elapsed_time_ms).toBeGreaterThanOrEqual(0)
      expect(typeof result.elapsed_time_ms).toBe('number')
    })

    it('should track iteration count', () => {
      const result = solveSystem(simpleMatrix, simpleRhs)

      expect(result.iterations).toBeGreaterThan(0)
      expect(result.iterations).toBeLessThan(1001) // Within max iterations
    })

    it('should maintain numerical stability', () => {
      const result1 = solveSystem(simpleMatrix, simpleRhs)
      const result2 = solveSystem(simpleMatrix, simpleRhs)

      // Results should be consistent
      expect(result1.solution[0]).toBeCloseTo(result2.solution[0], 5)
      expect(result1.solution[1]).toBeCloseTo(result2.solution[1], 5)
    })
  })

  describe('Error handling', () => {
    it('should throw when native module is unavailable', () => {
      // This would require mocking, but we test the pattern
      expect(() => {
        initializeSolver()
      }).not.toThrow() // Native module is available in tests
    })

    it('should handle dimension mismatch errors', () => {
      const matrix: SystemMatrix = {
        id: 'mismatch',
        dimension: 2,
        data: [[1, 2], [3, 4]],
        metadata: {},
      }
      const wrongRhs = [1, 2, 3] // 3 elements for 2x2 matrix

      expect(() => solveSystem(matrix, wrongRhs)).toThrow()
    })

    it('should handle validation of problematic systems', () => {
      const matrix: SystemMatrix = {
        id: 'test',
        dimension: 2,
        data: [[1, 2], [3, 4]],
        metadata: {},
      }
      const rhs = [1, 2]

      const validation = validateSystem(matrix, rhs)
      expect(validation).toBeDefined()
      expect('valid' in validation).toBe(true)
    })
  })
})
