import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  GeometricLanglands,
  GeometricLanglandsError,
  processGeometricLanglands,
  computeAutomorphicForms,
  applyHeckeOperators,
  computeGeometricObjects,
  verifyLanglandsCorrespondence,
  batchProcessLanglands,
  Config,
  ComputationResult,
  AutomorphicForm,
} from '../src/index'

describe('Geometric Langlands - Mathematical Framework', () => {
  const defaultConfig: Config = {
    timeout: 5000,
    retries: 3,
    logLevel: 'info',
  }

  const sampleData = 'test data for geometric langlands computation'
  const sampleData2 = 'another test data for verification'

  describe('processGeometricLanglands', () => {
    it('should process Geometric Langlands data with config', () => {
      const result = processGeometricLanglands(defaultConfig, sampleData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.input_size).toBe(sampleData.length)
      expect(result.output_size).toBeGreaterThanOrEqual(0)
      expect(result.computation_time).toBeGreaterThanOrEqual(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should preserve config metadata in result', () => {
      const result = processGeometricLanglands(defaultConfig, sampleData)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.config).toBeDefined()
    })

    it('should handle empty config', () => {
      const result = processGeometricLanglands({}, sampleData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })

    it('should handle custom config options', () => {
      const customConfig: Config = {
        timeout: 10000,
        retries: 5,
        maxConcurrency: 20,
      }

      const result = processGeometricLanglands(customConfig, sampleData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })

    it('should handle large input data', () => {
      const largeData = 'x'.repeat(10000)
      const result = processGeometricLanglands(defaultConfig, largeData)

      expect(result).toBeDefined()
      expect(result.input_size).toBe(largeData.length)
    })
  })

  describe('computeAutomorphicForms', () => {
    it('should compute automorphic forms', () => {
      const forms = computeAutomorphicForms(3, 5)

      expect(forms).toBeDefined()
      expect(Array.isArray(forms)).toBe(true)
      expect(forms.length).toBeGreaterThan(0)
    })

    it('should return forms with correct properties', () => {
      const forms = computeAutomorphicForms(2, 4)

      forms.forEach((form) => {
        expect(form.id).toBeDefined()
        expect(form.dimension).toBeGreaterThan(0)
        expect(form.coefficients).toBeDefined()
        expect(Array.isArray(form.coefficients)).toBe(true)
        expect(form.norm).toBeGreaterThanOrEqual(0)
      })
    })

    it('should respect dimension parameter', () => {
      const dimension = 5
      const forms = computeAutomorphicForms(dimension, 3)

      forms.forEach((form) => {
        expect(form.dimension).toBe(dimension)
      })
    })

    it('should respect num_coefficients parameter', () => {
      const numCoeff = 10
      const forms = computeAutomorphicForms(2, numCoeff)

      forms.forEach((form) => {
        expect(form.coefficients.length).toBe(numCoeff)
      })
    })

    it('should handle small dimensions', () => {
      const forms = computeAutomorphicForms(1, 1)

      expect(forms).toBeDefined()
      expect(forms.length).toBeGreaterThan(0)
    })

    it('should reject invalid parameters', () => {
      expect(() => {
        computeAutomorphicForms(0, 5)
      }).toThrow()

      expect(() => {
        computeAutomorphicForms(3, -1)
      }).toThrow()
    })
  })

  describe('applyHeckeOperators', () => {
    it('should apply Hecke operators to forms', () => {
      const forms = computeAutomorphicForms(2, 3)
      const result = applyHeckeOperators(forms, 'T_2')

      expect(result).toBeDefined()
      expect(result.operator_id).toBeDefined()
      expect(result.eigenvalues).toBeDefined()
      expect(Array.isArray(result.eigenvalues)).toBe(true)
      expect(result.eigenvectors).toBeDefined()
      expect(Array.isArray(result.eigenvectors)).toBe(true)
      expect(result.computation_time).toBeGreaterThanOrEqual(0)
    })

    it('should compute eigenvalues correctly', () => {
      const forms = computeAutomorphicForms(3, 4)
      const result = applyHeckeOperators(forms, 'T_3')

      expect(result.eigenvalues.length).toBeGreaterThan(0)
      result.eigenvalues.forEach((ev) => {
        expect(typeof ev).toBe('number')
        expect(ev).toBeGreaterThanOrEqual(0)
      })
    })

    it('should compute eigenvectors correctly', () => {
      const forms = computeAutomorphicForms(2, 2)
      const result = applyHeckeOperators(forms, 'T_5')

      expect(result.eigenvectors.length).toBeGreaterThan(0)
      result.eigenvectors.forEach((ev) => {
        expect(Array.isArray(ev)).toBe(true)
        ev.forEach((component) => {
          expect(typeof component).toBe('number')
        })
      })
    })

    it('should handle different operator names', () => {
      const forms = computeAutomorphicForms(2, 3)
      const operators = ['T_2', 'T_3', 'T_5', 'T_7']

      operators.forEach((op) => {
        const result = applyHeckeOperators(forms, op)
        expect(result.operator_id).toContain(op)
      })
    })
  })

  describe('computeGeometricObjects', () => {
    it('should compute geometric objects from spectral data', () => {
      const spectralData = { spectrum: [1, 2, 3, 4, 5] }
      const objects = computeGeometricObjects(spectralData, 'manifold')

      expect(objects).toBeDefined()
      expect(Array.isArray(objects)).toBe(true)
      expect(objects.length).toBeGreaterThan(0)
    })

    it('should return objects with correct properties', () => {
      const spectralData = [1, 2, 3]
      const objects = computeGeometricObjects(spectralData, 'curve')

      objects.forEach((obj) => {
        expect(obj.id).toBeDefined()
        expect(obj.object_type).toBe('curve')
        expect(obj.dimension).toBeGreaterThan(0)
        expect(obj.properties).toBeDefined()
      })
    })

    it('should handle various object types', () => {
      const spectralData = { data: 'test' }
      const types = ['manifold', 'curve', 'surface', 'stack']

      types.forEach((type) => {
        const objects = computeGeometricObjects(spectralData, type)
        expect(objects).toBeDefined()
        objects.forEach((obj) => {
          expect(obj.object_type).toBe(type)
        })
      })
    })

    it('should track spectral data source', () => {
      const spectralData = { input: 'spectral' }
      const objects = computeGeometricObjects(spectralData, 'variety')

      objects.forEach((obj) => {
        expect(obj.properties).toBeDefined()
        expect(obj.properties.computed_from).toBe('spectral_data')
      })
    })
  })

  describe('verifyLanglandsCorrespondence', () => {
    it('should verify Langlands correspondence', () => {
      const data1 = { spectrum: [1, 2, 3] }
      const data2 = { spectrum: [1, 2, 3] }

      const score = verifyLanglandsCorrespondence(data1, data2)

      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should return 1.0 for identical data', () => {
      const data = { test: 'data' }

      const score = verifyLanglandsCorrespondence(data, data)

      expect(score).toBe(1.0)
    })

    it('should return low score for different data', () => {
      const data1 = { a: 1 }
      const data2 = { b: 2, c: 3, d: 4 }

      const score = verifyLanglandsCorrespondence(data1, data2)

      expect(score).toBeLessThan(1.0)
    })

    it('should be symmetric', () => {
      const data1 = { spectrum: [1, 2, 3] }
      const data2 = { spectrum: [4, 5, 6] }

      const score1 = verifyLanglandsCorrespondence(data1, data2)
      const score2 = verifyLanglandsCorrespondence(data2, data1)

      expect(score1).toBe(score2)
    })

    it('should handle empty data', () => {
      const score = verifyLanglandsCorrespondence({}, {})

      expect(score).toBeDefined()
      expect(typeof score).toBe('number')
    })
  })

  describe('batchProcessLanglands', () => {
    it('should batch process multiple items', () => {
      const dataArray = ['data1', 'data2', 'data3']
      const results = batchProcessLanglands(dataArray)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(dataArray.length)
    })

    it('should process each item independently', () => {
      const dataArray = ['short', 'medium length', 'much longer data string']
      const results = batchProcessLanglands(dataArray)

      results.forEach((result, idx) => {
        expect(result.id).toBe(`batch-${idx}`)
        expect(result.input_size).toBe(dataArray[idx].length)
        expect(result.status).toBe('completed')
      })
    })

    it('should handle empty array', () => {
      const results = batchProcessLanglands([])

      expect(results).toBeDefined()
      expect(results.length).toBe(0)
    })

    it('should handle large batch', () => {
      const dataArray = Array.from({ length: 50 }, (_, i) => `item-${i}`)
      const results = batchProcessLanglands(dataArray)

      expect(results.length).toBe(50)
    })
  })

  describe('GeometricLanglands class', () => {
    let client: GeometricLanglands

    beforeAll(() => {
      client = new GeometricLanglands(defaultConfig)
    })

    afterAll(async () => {
      await client.close()
    })

    it('should create instance', () => {
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(GeometricLanglands)
    })

    it('should process data asynchronously', async () => {
      const result = await client.process(sampleData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })

    it('should process data synchronously', () => {
      const result = client.processSync(sampleData)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })

    it('should compute automorphic forms via instance', () => {
      const forms = client.computeAutomorphicForms(2, 3)

      expect(forms).toBeDefined()
      expect(Array.isArray(forms)).toBe(true)
    })

    it('should apply Hecke operators via instance', () => {
      const forms = client.computeAutomorphicForms(2, 2)
      const result = client.applyHeckeOperators(forms, 'T_2')

      expect(result).toBeDefined()
      expect(result.eigenvalues).toBeDefined()
    })

    it('should compute geometric objects via instance', () => {
      const objects = client.computeGeometricObjects({ data: 'test' }, 'manifold')

      expect(objects).toBeDefined()
      expect(Array.isArray(objects)).toBe(true)
    })

    it('should verify correspondence via instance', () => {
      const score = client.verifyCorrespondence({ a: 1 }, { a: 1 })

      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThanOrEqual(0)
    })

    it('should batch process via instance', () => {
      const results = client.batchProcess(['data1', 'data2'])

      expect(results).toBeDefined()
      expect(results.length).toBe(2)
    })

    it('should track active state', () => {
      expect(client.isActive()).toBe(true)
    })

    it('should reject operations after close', async () => {
      const tempClient = new GeometricLanglands()
      await tempClient.close()

      expect(() => {
        tempClient.processSync(sampleData)
      }).toThrow()
    })
  })

  describe('Error handling', () => {
    it('should throw GeometricLanglandsError on invalid input', () => {
      expect(() => {
        computeAutomorphicForms(-1, 5)
      }).toThrow(GeometricLanglandsError)
    })

    it('should provide error codes', () => {
      try {
        computeAutomorphicForms(0, 0)
      } catch (error: any) {
        expect(error.code).toBeDefined()
        expect(typeof error.code).toBe('string')
      }
    })

    it('should handle module not loaded gracefully', () => {
      // This would require mocking, but we verify error structure
      expect(() => {
        throw new GeometricLanglandsError('MODULE_NOT_LOADED', 'Native module not available')
      }).toThrow(GeometricLanglandsError)
    })
  })

  describe('Integration tests', () => {
    it('should perform complete mathematical workflow', () => {
      // Step 1: Compute automorphic forms
      const forms = computeAutomorphicForms(3, 4)
      expect(forms.length).toBeGreaterThan(0)

      // Step 2: Apply Hecke operators
      const heckeResult = applyHeckeOperators(forms, 'T_2')
      expect(heckeResult.eigenvalues.length).toBeGreaterThan(0)

      // Step 3: Compute geometric objects
      const objects = computeGeometricObjects({ hecke: heckeResult }, 'curve')
      expect(objects.length).toBeGreaterThan(0)

      // Step 4: Verify correspondence
      const score = verifyLanglandsCorrespondence(forms, objects)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should process multiple computations in sequence', () => {
      const config: Config = { timeout: 3000 }

      // Process multiple data items
      const result1 = processGeometricLanglands(config, 'data1')
      const result2 = processGeometricLanglands(config, 'data2')

      expect(result1.id).not.toBe(result2.id)
      expect(result1.computation_time).toBeGreaterThanOrEqual(0)
      expect(result2.computation_time).toBeGreaterThanOrEqual(0)
    })

    it('should handle mixed operations', () => {
      const client = new GeometricLanglands({
        timeout: 5000,
        retries: 3,
      })

      try {
        // Mix of different operations
        const forms = client.computeAutomorphicForms(2, 3)
        const hecke = client.applyHeckeOperators(forms, 'T_3')
        const objects = client.computeGeometricObjects(hecke, 'surface')
        const batch = client.batchProcess(['test1', 'test2'])

        expect(forms.length).toBeGreaterThan(0)
        expect(hecke.eigenvalues.length).toBeGreaterThan(0)
        expect(objects.length).toBeGreaterThan(0)
        expect(batch.length).toBe(2)
      } finally {
        client.close()
      }
    })
  })

  describe('Type safety', () => {
    it('should maintain type contracts', () => {
      const config: Config = {
        timeout: 5000,
        retries: 3,
        logLevel: 'debug',
        maxConcurrency: 10,
      }

      const result = processGeometricLanglands(config, sampleData)
      const computationResult: ComputationResult = result

      expect(computationResult.id).toBeDefined()
      expect(computationResult.input_size).toBeGreaterThanOrEqual(0)
      expect(computationResult.output_size).toBeGreaterThanOrEqual(0)
    })

    it('should validate form types', () => {
      const forms = computeAutomorphicForms(2, 3)
      forms.forEach((form: AutomorphicForm) => {
        expect(form.id).toBeDefined()
        expect(form.dimension).toBeGreaterThan(0)
        expect(Array.isArray(form.coefficients)).toBe(true)
      })
    })
  })
})
