import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  LanglandsCli,
  createSheaf,
  computeCohomology,
  tensorProductSheaves,
  restrictSheaf,
  formatResultForDisplay,
  createVisualization,
  batchExecuteTasks,
  parseLanglandsSpec,
  createCliConfig,
  createSheafObject,
  createComputationTask,
  parseComputationResult,
  parseSheafOperationResult,
  parseDisplayResult,
  parseVisualizationMetadata,
  createModularForm,
  computeHeckeEigenvalues,
  createGaloisRepresentation,
  analyzeRepresentationIrreducibility,
  compareGaloisRepresentations,
  createModularFormObject,
  parseModularFormResult,
  createGaloisRepresentationObject,
  parseGaloisAnalysisResult,
} from '../src/index'

describe('Geometric Langlands CLI', () => {
  let cli: LanglandsCli
  let sampleSheaf: string
  let sampleSheaf2: string

  beforeAll(() => {
    cli = new LanglandsCli()
    const config = createCliConfig({ verbose: true })
    cli = new LanglandsCli(JSON.stringify(config))
    sampleSheaf = createSheaf('sheaf-001', 'flag-variety', 3)
    sampleSheaf2 = createSheaf('sheaf-002', 'grassmannian', 2)
  })

  describe('LanglandsCli Initialization', () => {
    it('should create LanglandsCli instance with default config', () => {
      const instance = new LanglandsCli()
      expect(instance).toBeDefined()
    })

    it('should create LanglandsCli instance with custom config', () => {
      const config = createCliConfig({ verbose: true, max_iterations: 200 })
      const instance = new LanglandsCli(JSON.stringify(config))
      expect(instance).toBeDefined()
    })

    it('should retrieve CLI configuration', () => {
      const configStr = cli.getConfig()
      expect(configStr).toBeDefined()
      const config = JSON.parse(configStr)
      expect(config).toHaveProperty('verbose')
      expect(config).toHaveProperty('output_format')
    })

    it('should handle configuration with all options', () => {
      const config = createCliConfig({
        verbose: true,
        output_format: 'table',
        max_iterations: 500,
        timeout_ms: 60000,
        parallel_jobs: 8,
      })
      const instance = new LanglandsCli(JSON.stringify(config))
      const retrievedConfig = JSON.parse(instance.getConfig())
      expect(retrievedConfig.max_iterations).toBe(500)
      expect(retrievedConfig.parallel_jobs).toBe(8)
    })
  })

  describe('Sheaf Creation', () => {
    it('should create a sheaf with proper structure', () => {
      const sheafJson = createSheaf('sheaf-test', 'base-space', 4)
      expect(sheafJson).toBeDefined()
      const sheaf = JSON.parse(sheafJson)
      expect(sheaf.id).toBe('sheaf-test')
      expect(sheaf.base_space).toBe('base-space')
      expect(sheaf.dimension).toBe(4)
      expect(sheaf.sections).toHaveLength(4)
    })

    it('should create sheaf with different dimensions', () => {
      const sheaf1 = JSON.parse(createSheaf('s1', 'base', 2))
      const sheaf2 = JSON.parse(createSheaf('s2', 'base', 5))
      expect(sheaf1.dimension).toBe(2)
      expect(sheaf2.dimension).toBe(5)
      expect(sheaf1.sections).toHaveLength(2)
      expect(sheaf2.sections).toHaveLength(5)
    })

    it('should generate unique section identifiers', () => {
      const sheaf = JSON.parse(createSheaf('sheaf-sections', 'base', 3))
      const sections = sheaf.sections
      const uniqueSections = new Set(sections)
      expect(uniqueSections.size).toBe(sections.length)
    })

    it('should create sheaf object helper correctly', () => {
      const sheafObj = createSheafObject('sheaf-obj', 'variety', 3, ['s1', 's2', 's3'])
      expect(sheafObj.id).toBe('sheaf-obj')
      expect(sheafObj.base_space).toBe('variety')
      expect(sheafObj.sections).toEqual(['s1', 's2', 's3'])
    })
  })

  describe('Cohomology Computation', () => {
    it('should compute cohomology groups for a sheaf', () => {
      const cohomologyJson = computeCohomology(sampleSheaf)
      expect(cohomologyJson).toBeDefined()
      const result = JSON.parse(cohomologyJson)
      expect(result.sheaf_id).toBe('sheaf-001')
      expect(result.cohomology_groups).toBeDefined()
      expect(Array.isArray(result.cohomology_groups)).toBe(true)
    })

    it('should include dimension information in cohomology result', () => {
      const cohomologyJson = computeCohomology(sampleSheaf)
      const result = JSON.parse(cohomologyJson)
      expect(result.dimension).toBe(3)
      expect(result.base_space).toBe('flag-variety')
    })

    it('should measure computation time', () => {
      const cohomologyJson = computeCohomology(sampleSheaf)
      const result = JSON.parse(cohomologyJson)
      expect(result).toHaveProperty('computation_time_ms')
      expect(typeof result.computation_time_ms).toBe('number')
      expect(result.computation_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should compute cohomology for different sheaves independently', () => {
      const coh1 = JSON.parse(computeCohomology(sampleSheaf))
      const coh2 = JSON.parse(computeCohomology(sampleSheaf2))
      expect(coh1.sheaf_id).toBe('sheaf-001')
      expect(coh2.sheaf_id).toBe('sheaf-002')
      expect(coh1.dimension).not.toBe(coh2.dimension)
    })
  })

  describe('Tensor Product Operations', () => {
    it('should compute tensor product of two sheaves', () => {
      const resultJson = tensorProductSheaves(sampleSheaf, sampleSheaf2)
      expect(resultJson).toBeDefined()
      const result = parseSheafOperationResult(resultJson)
      expect(result.operation_type).toBe('tensor_product')
      expect(result.status).toBe('completed')
    })

    it('should have correct operation ID format', () => {
      const resultJson = tensorProductSheaves(sampleSheaf, sampleSheaf2)
      const result = JSON.parse(resultJson)
      expect(result.operation_id).toMatch(/^tensor-/)
    })

    it('should compute correct output dimension', () => {
      const resultJson = tensorProductSheaves(sampleSheaf, sampleSheaf2)
      const result = JSON.parse(resultJson)
      expect(result.result_data.dimension).toBe(6) // 3 * 2
    })

    it('should preserve base space information', () => {
      const resultJson = tensorProductSheaves(sampleSheaf, sampleSheaf2)
      const result = JSON.parse(resultJson)
      expect(result.result_data.base_space).toBe('flag-variety')
    })

    it('should handle self-tensor product', () => {
      const resultJson = tensorProductSheaves(sampleSheaf, sampleSheaf)
      const result = JSON.parse(resultJson)
      expect(result.result_data.dimension).toBe(9) // 3 * 3
    })
  })

  describe('Sheaf Restriction', () => {
    it('should restrict a sheaf to a subspace', () => {
      const restriction = { target: 'subspace-1', codimension: 1 }
      const resultJson = restrictSheaf(sampleSheaf, JSON.stringify(restriction))
      expect(resultJson).toBeDefined()
      const result = parseSheafOperationResult(resultJson)
      expect(result.operation_type).toBe('restriction')
    })

    it('should mark restriction operation as completed', () => {
      const restriction = { target: 'divisor', codimension: 2 }
      const resultJson = restrictSheaf(sampleSheaf, JSON.stringify(restriction))
      const result = JSON.parse(resultJson)
      expect(result.status).toBe('completed')
    })

    it('should preserve original dimension info', () => {
      const restriction = { target: 'closed-subvariety' }
      const resultJson = restrictSheaf(sampleSheaf, JSON.stringify(restriction))
      const result = JSON.parse(resultJson)
      expect(result.result_data.original_dimension).toBe(3)
    })

    it('should include restriction details in result', () => {
      const restriction = { type: 'codimension-1', codim: 1 }
      const resultJson = restrictSheaf(sampleSheaf, JSON.stringify(restriction))
      const result = JSON.parse(resultJson)
      expect(result.result_data).toHaveProperty('restriction')
    })
  })

  describe('Computation Task Management', () => {
    it('should create a computation task', () => {
      const taskJson = cli.createTask('cohomology_computation', JSON.stringify({ dimension: 5 }))
      expect(taskJson).toBeDefined()
      const task = parseComputationResult(taskJson)
      expect(task.task_type).toBe('cohomology_computation')
    })

    it('should assign unique task IDs', () => {
      const task1Json = cli.createTask('task1', JSON.stringify({}))
      const task2Json = cli.createTask('task2', JSON.stringify({}))
      const task1 = JSON.parse(task1Json)
      const task2 = JSON.parse(task2Json)
      expect(task1.task_id).not.toBe(task2.task_id)
    })

    it('should set initial progress to zero', () => {
      const taskJson = cli.createTask('test-task', JSON.stringify({}))
      const task = JSON.parse(taskJson)
      expect(task.progress).toBe(0)
      expect(task.status).toBe('created')
    })

    it('should execute a computation task', () => {
      const taskJson = cli.createTask('langlands_compute', JSON.stringify({ param: 'value' }))
      const task = JSON.parse(taskJson)
      const resultJson = cli.executeTask(taskJson)
      const result = JSON.parse(resultJson)
      expect(result.status).toBe('completed')
      expect(result.task_id).toBe(task.task_id)
    })

    it('should track execution time for tasks', () => {
      const taskJson = cli.createTask('timing-test', JSON.stringify({}))
      const resultJson = cli.executeTask(taskJson)
      const result = JSON.parse(resultJson)
      expect(result).toHaveProperty('execution_time_ms')
      expect(typeof result.execution_time_ms).toBe('number')
    })
  })

  describe('Batch Task Execution', () => {
    it('should execute multiple tasks in batch', () => {
      const task1 = createComputationTask('batch-task-1', 'compute1', { param: 1 })
      const task2 = createComputationTask('batch-task-2', 'compute2', { param: 2 })
      const tasksJson = JSON.stringify([task1, task2])
      const resultsJson = batchExecuteTasks(tasksJson)
      const results = JSON.parse(resultsJson)
      expect(Array.isArray(results)).toBe(true)
      expect(results).toHaveLength(2)
    })

    it('should maintain task order in batch execution', () => {
      const tasks = Array.from({ length: 5 }, (_, i) =>
        createComputationTask(`task-${i}`, 'type', { index: i })
      )
      const resultsJson = batchExecuteTasks(JSON.stringify(tasks))
      const results = JSON.parse(resultsJson)
      results.forEach((result: any, index: number) => {
        expect(result.task_id).toBe(`task-${index}`)
      })
    })

    it('should mark all batch results as completed', () => {
      const tasks = Array.from({ length: 3 }, (_, i) =>
        createComputationTask(`batch-${i}`, 'task', {})
      )
      const resultsJson = batchExecuteTasks(JSON.stringify(tasks))
      const results = JSON.parse(resultsJson)
      results.forEach((result: any) => {
        expect(result.status).toBe('completed')
      })
    })

    it('should handle empty batch', () => {
      const resultsJson = batchExecuteTasks(JSON.stringify([]))
      const results = JSON.parse(resultsJson)
      expect(results).toHaveLength(0)
    })

    it('should include execution times for all batch tasks', () => {
      const tasks = Array.from({ length: 2 }, (_, i) =>
        createComputationTask(`timed-${i}`, 'task', {})
      )
      const resultsJson = batchExecuteTasks(JSON.stringify(tasks))
      const results = JSON.parse(resultsJson)
      results.forEach((result: any) => {
        expect(result).toHaveProperty('execution_time_ms')
      })
    })
  })

  describe('Result Display Formatting', () => {
    it('should format result as JSON', () => {
      const sampleResult = { data: 'test', value: 123 }
      const displayJson = formatResultForDisplay(JSON.stringify(sampleResult), 'json')
      const display = parseDisplayResult(displayJson)
      expect(display.format).toBe('json')
      expect(display.content).toBeDefined()
      expect(display.content).toContain('data')
    })

    it('should format result as text', () => {
      const sampleResult = { field1: 'value1', field2: 'value2' }
      const displayJson = formatResultForDisplay(JSON.stringify(sampleResult), 'text')
      const display = parseDisplayResult(displayJson)
      expect(display.format).toBe('text')
      expect(display.content).toContain('field1')
    })

    it('should format result as table', () => {
      const sampleResult = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]
      const displayJson = formatResultForDisplay(JSON.stringify(sampleResult), 'table')
      const display = parseDisplayResult(displayJson)
      expect(display.format).toBe('table')
      expect(display.content).toBeDefined()
    })

    it('should include display ID in result', () => {
      const sampleResult = { test: 'data' }
      const displayJson = formatResultForDisplay(JSON.stringify(sampleResult), 'json')
      const display = JSON.parse(displayJson)
      expect(display.display_id).toMatch(/^display-/)
    })

    it('should include metadata with timestamp', () => {
      const sampleResult = { data: 'test' }
      const displayJson = formatResultForDisplay(JSON.stringify(sampleResult), 'json')
      const display = JSON.parse(displayJson)
      expect(display.metadata).toHaveProperty('formatted_at')
    })
  })

  describe('Visualization Creation', () => {
    it('should create visualization metadata', () => {
      const visJson = createVisualization('sheaf_diagram', 800, 600, 'viridis')
      expect(visJson).toBeDefined()
      const vis = parseVisualizationMetadata(visJson)
      expect(vis.visualization_type).toBe('sheaf_diagram')
      expect(vis.width).toBe(800)
      expect(vis.height).toBe(600)
    })

    it('should assign unique visualization IDs', () => {
      const vis1 = JSON.parse(createVisualization('type1', 800, 600, 'color1'))
      const vis2 = JSON.parse(createVisualization('type2', 800, 600, 'color1'))
      expect(vis1.visualization_id).not.toBe(vis2.visualization_id)
    })

    it('should preserve color scheme setting', () => {
      const vis = JSON.parse(createVisualization('plot', 600, 400, 'plasma'))
      expect(vis.color_scheme).toBe('plasma')
    })

    it('should handle different visualization types', () => {
      const types = ['sheaf_diagram', 'cohomology_chart', 'tensor_lattice', 'automorphic_form']
      types.forEach((type) => {
        const vis = JSON.parse(createVisualization(type, 640, 480, 'default'))
        expect(vis.visualization_type).toBe(type)
      })
    })
  })

  describe('Langlands Specification Parsing', () => {
    it('should parse Langlands specification', () => {
      const spec = {
        group: 'GLn',
        dual_group: 'PGL',
        automorphic_forms: ['cusp_form', 'eisenstein'],
      }
      const resultJson = parseLanglandsSpec(JSON.stringify(spec))
      const result = JSON.parse(resultJson)
      expect(result.is_valid).toBe(true)
      expect(result).toHaveProperty('spec_id')
      expect(result.errors).toHaveLength(0)
    })

    it('should include validation metadata', () => {
      const spec = { base_change: 'minimal' }
      const resultJson = parseLanglandsSpec(JSON.stringify(spec))
      const result = JSON.parse(resultJson)
      expect(result).toHaveProperty('spec_id')
      expect(result).toHaveProperty('validated_at')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
    })

    it('should preserve specification in result', () => {
      const spec = { automorphic: true, hecke_algebra: 'spherical' }
      const resultJson = parseLanglandsSpec(JSON.stringify(spec))
      const result = JSON.parse(resultJson)
      expect(result.spec).toEqual(spec)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete workflow: create, process, display', () => {
      // Create sheaf
      const sheafJson = createSheaf('int-test-1', 'variety', 2)
      expect(sheafJson).toBeDefined()

      // Compute cohomology
      const cohomologyJson = computeCohomology(sheafJson)
      expect(cohomologyJson).toBeDefined()

      // Format for display
      const displayJson = formatResultForDisplay(cohomologyJson, 'json')
      const display = parseDisplayResult(displayJson)
      expect(display.format).toBe('json')
    })

    it('should chain multiple sheaf operations', () => {
      const sheaf1 = createSheaf('chain-1', 'base', 2)
      const sheaf2 = createSheaf('chain-2', 'base', 3)

      const tensor = tensorProductSheaves(sheaf1, sheaf2)
      const tensorResult = JSON.parse(tensor)
      expect(tensorResult.result_data.dimension).toBe(6)

      const restriction = restrictSheaf(sheaf1, JSON.stringify({ target: 'subspace' }))
      const restrictResult = JSON.parse(restriction)
      expect(restrictResult.operation_type).toBe('restriction')
    })

    it('should maintain data integrity through multiple operations', () => {
      const cohomologyJson = computeCohomology(sampleSheaf)
      const cohomology = JSON.parse(cohomologyJson)
      expect(cohomology.sheaf_id).toBe('sheaf-001')

      const displayJson = formatResultForDisplay(cohomologyJson, 'text')
      const display = parseDisplayResult(displayJson)
      expect(display.content).toContain('sheaf_id') || expect(display.content).toBeDefined()
    })
  })

  describe('Modular Form Operations', () => {
    it('should create a modular form', () => {
      const formJson = createModularForm(2, 11, 'trivial')
      expect(formJson).toBeDefined()
      const form = JSON.parse(formJson)
      expect(form).toBeDefined()
    })

    it('should create modular forms with different weights', () => {
      const form1 = JSON.parse(createModularForm(2, 11, 'trivial'))
      const form2 = JSON.parse(createModularForm(4, 11, 'trivial'))
      expect(form1.id).toBeDefined()
      expect(form2.id).toBeDefined()
      expect(form1.id).not.toBe(form2.id)
    })

    it('should compute Hecke eigenvalues for modular form', () => {
      const formJson = createModularForm(2, 11, 'trivial')
      const eigenvaluesJson = computeHeckeEigenvalues(formJson, 5)
      const eigenvalues = JSON.parse(eigenvaluesJson)
      expect(eigenvalues.eigenvalues).toBeDefined()
      expect(Array.isArray(eigenvalues.eigenvalues)).toBe(true)
      expect(eigenvalues.eigenvalues.length).toBe(5)
    })

    it('should include computation time in Hecke eigenvalues', () => {
      const formJson = createModularForm(2, 11, 'trivial')
      const eigenvaluesJson = computeHeckeEigenvalues(formJson, 3)
      const eigenvalues = JSON.parse(eigenvaluesJson)
      expect(eigenvalues).toHaveProperty('computation_time_ms')
      expect(typeof eigenvalues.computation_time_ms).toBe('number')
    })

    it('should create modular form object helper', () => {
      const form = createModularFormObject('mf-test', 2, 11, 'trivial', [1, 2, 3])
      expect(form.weight).toBe(2)
      expect(form.level).toBe(11)
      expect(form.character).toBe('trivial')
      expect(form.coefficients).toHaveLength(3)
    })

    it('should handle modular forms with various levels', () => {
      const levels = [1, 11, 37, 101]
      levels.forEach((level) => {
        const formJson = createModularForm(2, level, 'trivial')
        const form = JSON.parse(formJson)
        expect(form.level).toBe(level)
      })
    })
  })

  describe('Galois Representation Analysis', () => {
    it('should create a Galois representation', () => {
      const repJson = createGaloisRepresentation('artin', 2, 'QP')
      expect(repJson).toBeDefined()
      const rep = JSON.parse(repJson)
      expect(rep.id).toBeDefined()
      expect(rep.dimension).toBe(2)
    })

    it('should create Galois representations with different dimensions', () => {
      const rep1 = JSON.parse(createGaloisRepresentation('artin', 1, 'QP'))
      const rep2 = JSON.parse(createGaloisRepresentation('artin', 3, 'QP'))
      const rep3 = JSON.parse(createGaloisRepresentation('artin', 4, 'QP'))
      expect(rep1.dimension).toBe(1)
      expect(rep2.dimension).toBe(3)
      expect(rep3.dimension).toBe(4)
    })

    it('should analyze representation irreducibility', () => {
      const repJson = createGaloisRepresentation('artin', 2, 'QP')
      const analysisJson = analyzeRepresentationIrreducibility(repJson)
      const analysis = JSON.parse(analysisJson)
      expect(analysis).toHaveProperty('is_irreducible')
      expect(analysis).toHaveProperty('decomposition')
      expect(Array.isArray(analysis.decomposition)).toBe(true)
    })

    it('should mark 1-dimensional representation as irreducible', () => {
      const repJson = createGaloisRepresentation('artin', 1, 'QP')
      const analysisJson = analyzeRepresentationIrreducibility(repJson)
      const analysis = JSON.parse(analysisJson)
      expect(analysis.is_irreducible).toBe(true)
    })

    it('should compute decomposition for 2-dimensional representation', () => {
      const repJson = createGaloisRepresentation('artin', 2, 'QP')
      const analysisJson = analyzeRepresentationIrreducibility(repJson)
      const analysis = JSON.parse(analysisJson)
      expect(analysis.decomposition).toHaveLength(2)
    })

    it('should compare two Galois representations', () => {
      const rep1Json = createGaloisRepresentation('artin', 2, 'QP')
      const rep2Json = createGaloisRepresentation('artin', 2, 'QP')
      const comparisonJson = compareGaloisRepresentations(rep1Json, rep2Json)
      const comparison = JSON.parse(comparisonJson)
      expect(comparison).toHaveProperty('isomorphic')
      expect(comparison.dimension_match).toBe(true)
    })

    it('should detect non-isomorphic representations', () => {
      const rep1Json = createGaloisRepresentation('artin', 2, 'QP')
      const rep2Json = createGaloisRepresentation('artin', 3, 'QP')
      const comparisonJson = compareGaloisRepresentations(rep1Json, rep2Json)
      const comparison = JSON.parse(comparisonJson)
      expect(comparison.isomorphic).toBe(false)
    })

    it('should create Galois representation object helper', () => {
      const rep = createGaloisRepresentationObject('rep-1', 'artin', 2, 'QP', ['zeta_1', 'zeta_2'])
      expect(rep.representation_type).toBe('artin')
      expect(rep.dimension).toBe(2)
      expect(rep.roots_of_unity).toHaveLength(2)
    })

    it('should track analysis time for Galois representations', () => {
      const repJson = createGaloisRepresentation('artin', 3, 'QP')
      const analysisJson = analyzeRepresentationIrreducibility(repJson)
      const analysis = JSON.parse(analysisJson)
      expect(analysis).toHaveProperty('analysis_time_ms')
      expect(typeof analysis.analysis_time_ms).toBe('number')
    })
  })

  describe('CLI Modular Form Integration', () => {
    it('should compute modular form via CLI', () => {
      const resultJson = cli.computeModularForm(2, 11, JSON.stringify({ type: 'trivial' }))
      expect(resultJson).toBeDefined()
      const result = JSON.parse(resultJson)
      expect(result.status).toBe('completed')
    })

    it('should include computation time for CLI modular form', () => {
      const resultJson = cli.computeModularForm(4, 37, JSON.stringify({}))
      const result = JSON.parse(resultJson)
      expect(result).toHaveProperty('computation_time_ms')
      expect(result.computation_time_ms).toBeGreaterThanOrEqual(0)
    })
  })

  describe('CLI Galois Representation Integration', () => {
    it('should analyze Galois representation via CLI', () => {
      const repJson = JSON.stringify(createGaloisRepresentationObject('rep-1', 'artin', 2, 'QP'))
      const resultJson = cli.analyzeGaloisRepresentation(repJson, 'irreducibility')
      expect(resultJson).toBeDefined()
      const result = JSON.parse(resultJson)
      expect(result.status).toBe('completed')
    })

    it('should track analysis time for CLI Galois analysis', () => {
      const repJson = JSON.stringify(
        createGaloisRepresentationObject('rep-2', 'artin', 3, 'QP')
      )
      const resultJson = cli.analyzeGaloisRepresentation(repJson, 'decomposition')
      const result = JSON.parse(resultJson)
      expect(result).toHaveProperty('analysis_time_ms')
    })
  })

  describe('Error Handling', () => {
    it('should handle large dimension sheaves', () => {
      const sheaf = createSheaf('large-dim', 'variety', 100)
      const sheafObj = JSON.parse(sheaf)
      expect(sheafObj.dimension).toBe(100)
      expect(sheafObj.sections).toHaveLength(100)
    })

    it('should handle complex task parameters', () => {
      const complexParams = {
        nested: {
          level1: { level2: { level3: 'value' } },
          array: [1, 2, 3],
        },
      }
      const taskJson = cli.createTask('complex', JSON.stringify(complexParams))
      const task = JSON.parse(taskJson)
      expect(task.input_params).toBeDefined()
    })

    it('should handle result formatting edge cases', () => {
      const nullResult = null
      const emptyResult = {}
      const arrayResult = []

      const display1 = formatResultForDisplay(JSON.stringify(nullResult), 'json')
      const display2 = formatResultForDisplay(JSON.stringify(emptyResult), 'json')
      const display3 = formatResultForDisplay(JSON.stringify(arrayResult), 'json')

      expect(display1).toBeDefined()
      expect(display2).toBeDefined()
      expect(display3).toBeDefined()
    })

    it('should handle high-dimension Galois representations', () => {
      const repJson = createGaloisRepresentation('artin', 10, 'QP')
      const analysisJson = analyzeRepresentationIrreducibility(repJson)
      const analysis = JSON.parse(analysisJson)
      expect(analysis.dimension).toBe(10)
      expect(analysis.decomposition).toBeDefined()
    })

    it('should handle modular forms with large weights', () => {
      const formJson = createModularForm(24, 1, 'trivial')
      const form = JSON.parse(formJson)
      expect(form.weight).toBe(24)
      expect(form.coefficients).toBeDefined()
    })
  })
})
