import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  CodeMeshWasm,
  initializeWasmMesh,
  loadWasmModule,
  unloadWasmModule,
  executeWasmModule,
  serializeData,
  deserializeData,
  getBrowserCompatibility,
  getPerformanceMetrics,
  batchLoadModules,
  validateWasmModule,
  WasmModuleConfig,
  WasmMeshConfig,
  SerializableData,
} from '../src/index'

describe('Code Mesh WASM - WebAssembly Bindings', () => {
  const sampleModule: WasmModuleConfig = {
    id: 'module-001',
    name: 'sample-module',
    version: '1.0.0',
    entry_point: '_start',
    permissions: ['read', 'write'],
    metadata: {
      author: 'test',
      description: 'Sample WASM module',
    },
  }

  const sampleModule2: WasmModuleConfig = {
    id: 'module-002',
    name: 'compute-module',
    version: '2.0.0',
    entry_point: 'compute',
    permissions: ['read', 'compute'],
    metadata: {
      author: 'test',
      type: 'compute',
    },
  }

  const sampleData: SerializableData = {
    id: 'data-001',
    data_type: 'json',
    content: 'Hello WASM World',
    encoding: 'utf-8',
    metadata: {
      source: 'test',
    },
  }

  describe('initializeWasmMesh', () => {
    it('should initialize WASM mesh with default config', () => {
      const result = initializeWasmMesh()

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.initialized_at).toBeDefined()
      expect(result.browser_api_enabled).toBe(true)
      expect(result.caching_enabled).toBe(true)
      expect(result.status).toBe('initialized')
    })

    it('should initialize WASM mesh with custom config', () => {
      const config: WasmMeshConfig = {
        enable_browser_api: true,
        enable_caching: false,
        cache_size: 500,
        max_module_size: 10485760, // 10MB
      }

      const result = initializeWasmMesh(config)

      expect(result).toBeDefined()
      expect(result.browser_api_enabled).toBe(true)
      expect(result.caching_enabled).toBe(false)
      expect(result.config.cache_size).toBe(500)
    })

    it('should include performance optimizations', () => {
      const result = initializeWasmMesh()

      expect(result.config.performance_optimizations).toBeDefined()
      expect(Array.isArray(result.config.performance_optimizations)).toBe(true)
      expect(result.config.performance_optimizations!.length).toBeGreaterThan(0)
    })
  })

  describe('loadWasmModule', () => {
    it('should load a WASM module', () => {
      const result = loadWasmModule(sampleModule)

      expect(result).toBeDefined()
      expect(result.module_id).toBe('module-001')
      expect(result.module_name).toBe('sample-module')
      expect(result.status).toBe('loaded')
      expect(result.message).toBeDefined()
    })

    it('should load different WASM modules', () => {
      const result1 = loadWasmModule(sampleModule)
      const result2 = loadWasmModule(sampleModule2)

      expect(result1.module_id).toBe('module-001')
      expect(result2.module_id).toBe('module-002')
      expect(result1.module_id).not.toBe(result2.module_id)
    })

    it('should record loading timestamp', () => {
      const result = loadWasmModule(sampleModule)

      expect(result.loaded_at).toBeDefined()
      expect(typeof result.loaded_at).toBe('string')
      expect(parseInt(result.loaded_at)).toBeGreaterThan(0)
    })
  })

  describe('unloadWasmModule', () => {
    it('should unload a WASM module', () => {
      const result = unloadWasmModule('module-001')

      expect(result).toBeDefined()
      expect(result.module_id).toBe('module-001')
      expect(result.status).toBe('unloaded')
      expect(result.message).toBeDefined()
    })

    it('should record unloading timestamp', () => {
      const result = unloadWasmModule('module-002')

      expect(result.unloaded_at).toBeDefined()
      expect(typeof result.unloaded_at).toBe('string')
    })
  })

  describe('executeWasmModule', () => {
    it('should execute a WASM module', () => {
      const result = executeWasmModule('module-001')

      expect(result).toBeDefined()
      expect(result.module_id).toBe('module-001')
      expect(result.status).toBe('completed')
      expect(result.output).toBeDefined()
      expect(result.duration_ms).toBeGreaterThan(0)
    })

    it('should execute module with input data', () => {
      const input = { action: 'compute', value: 42 }
      const result = executeWasmModule('module-002', input)

      expect(result).toBeDefined()
      expect(result.module_id).toBe('module-002')
      expect(result.output).toBeDefined()
    })

    it('should measure execution time', () => {
      const result = executeWasmModule('module-001')

      expect(typeof result.duration_ms).toBe('number')
      expect(result.duration_ms).toBeGreaterThan(0)
      expect(result.duration_ms).toBeLessThan(1000)
    })

    it('should return execution output', () => {
      const result = executeWasmModule('module-001')

      expect(result.output).toBeDefined()
      expect(typeof result.output).toBe('object')
      expect(result.output.result).toBeDefined()
    })
  })

  describe('serializeData', () => {
    it('should serialize data for WASM transmission', () => {
      const result = serializeData(sampleData)

      expect(result).toBeDefined()
      expect(result.id).toBe('data-001')
      expect(result.original_size).toBeGreaterThan(0)
      expect(result.serialized_data).toBeDefined()
      expect(result.serialized_size).toBeGreaterThan(0)
    })

    it('should preserve data ID during serialization', () => {
      const result = serializeData(sampleData)

      expect(result.id).toBe(sampleData.id)
    })

    it('should calculate size metrics', () => {
      const result = serializeData(sampleData)

      expect(result.original_size).toBeGreaterThan(0)
      expect(result.serialized_size).toBeGreaterThan(0)
      expect(typeof result.original_size).toBe('number')
      expect(typeof result.serialized_size).toBe('number')
    })

    it('should record serialization timestamp', () => {
      const result = serializeData(sampleData)

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })

    it('should serialize large data', () => {
      const largeData: SerializableData = {
        id: 'data-large',
        data_type: 'binary',
        content: 'x'.repeat(10000),
        encoding: 'utf-8',
      }

      const result = serializeData(largeData)

      expect(result).toBeDefined()
      expect(result.original_size).toBeGreaterThan(5000)
    })
  })

  describe('deserializeData', () => {
    it('should deserialize serialized data', () => {
      const serialized = serializeData(sampleData)
      const result = deserializeData(serialized)

      expect(result).toBeDefined()
      expect(result.deserialized_data).toBeDefined()
      expect(result.status).toBe('success')
    })

    it('should record deserialization timestamp', () => {
      const serialized = serializeData(sampleData)
      const result = deserializeData(serialized)

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })
  })

  describe('getBrowserCompatibility', () => {
    it('should return browser compatibility information', () => {
      const info = getBrowserCompatibility()

      expect(info).toBeDefined()
      expect(info.supported).toBe(true)
      expect(info.wasm_support).toBe(true)
    })

    it('should include supported features', () => {
      const info = getBrowserCompatibility()

      expect(info.features).toBeDefined()
      expect(Array.isArray(info.features)).toBe(true)
      expect(info.features.length).toBeGreaterThan(0)
    })

    it('should include browser version requirements', () => {
      const info = getBrowserCompatibility()

      expect(info.min_browser_versions).toBeDefined()
      expect(info.min_browser_versions.chrome).toBeDefined()
      expect(info.min_browser_versions.firefox).toBeDefined()
      expect(info.min_browser_versions.safari).toBeDefined()
      expect(info.min_browser_versions.edge).toBeDefined()
    })

    it('should indicate web worker support', () => {
      const info = getBrowserCompatibility()

      expect(info.web_workers).toBe(true)
    })

    it('should indicate shared array buffer support', () => {
      const info = getBrowserCompatibility()

      expect(info.shared_array_buffer).toBe(true)
    })
  })

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', () => {
      const metrics = getPerformanceMetrics('module-001')

      expect(metrics).toBeDefined()
      expect(metrics.module_id).toBe('module-001')
      expect(metrics.total_executions).toBeGreaterThan(0)
    })

    it('should include execution statistics', () => {
      const metrics = getPerformanceMetrics('module-001')

      expect(metrics.average_duration_ms).toBeGreaterThan(0)
      expect(metrics.min_duration_ms).toBeGreaterThan(0)
      expect(metrics.max_duration_ms).toBeGreaterThan(0)
    })

    it('should include success rate', () => {
      const metrics = getPerformanceMetrics('module-001')

      expect(metrics.success_rate).toBeGreaterThanOrEqual(0)
      expect(metrics.success_rate).toBeLessThanOrEqual(100)
    })

    it('should include memory usage', () => {
      const metrics = getPerformanceMetrics('module-001')

      expect(metrics.memory_usage_mb).toBeGreaterThan(0)
      expect(typeof metrics.memory_usage_mb).toBe('number')
    })

    it('should record metrics timestamp', () => {
      const metrics = getPerformanceMetrics('module-001')

      expect(metrics.timestamp).toBeDefined()
      expect(typeof metrics.timestamp).toBe('string')
    })
  })

  describe('batchLoadModules', () => {
    it('should batch load multiple modules', () => {
      const modules = [sampleModule, sampleModule2]
      const result = batchLoadModules(modules)

      expect(result).toBeDefined()
      expect(result.total_modules).toBe(2)
      expect(result.loaded_modules).toBe(2)
      expect(result.failed_modules).toBe(0)
    })

    it('should load empty batch', () => {
      const result = batchLoadModules([])

      expect(result).toBeDefined()
      expect(result.total_modules).toBe(0)
    })

    it('should handle large batch', () => {
      const modules = Array.from({ length: 50 }, (_, i) => ({
        id: `module-${i}`,
        name: `module-${i}`,
        version: '1.0.0',
        entry_point: 'main',
        permissions: [],
      }))

      const result = batchLoadModules(modules)

      expect(result.total_modules).toBe(50)
      expect(result.loaded_modules).toBe(50)
    })

    it('should record batch loading timestamp', () => {
      const result = batchLoadModules([sampleModule])

      expect(result.loaded_at).toBeDefined()
      expect(typeof result.loaded_at).toBe('string')
    })

    it('should return batch status', () => {
      const result = batchLoadModules([sampleModule])

      expect(result.status).toBe('completed')
    })
  })

  describe('validateWasmModule', () => {
    it('should validate valid module', () => {
      const result = validateWasmModule(sampleModule)

      expect(result).toBeDefined()
      expect(result.module_id).toBe('module-001')
      expect(result.is_valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('should detect invalid module with missing ID', () => {
      const invalidModule: WasmModuleConfig = {
        id: '',
        name: 'test',
        version: '1.0.0',
        entry_point: 'main',
        permissions: [],
      }

      const result = validateWasmModule(invalidModule)

      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect invalid module with missing entry point', () => {
      const invalidModule: WasmModuleConfig = {
        id: 'test',
        name: 'test',
        version: '1.0.0',
        entry_point: '',
        permissions: [],
      }

      const result = validateWasmModule(invalidModule)

      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should record validation timestamp', () => {
      const result = validateWasmModule(sampleModule)

      expect(result.validated_at).toBeDefined()
      expect(typeof result.validated_at).toBe('string')
    })
  })

  describe('CodeMeshWasm class', () => {
    let instance: CodeMeshWasm

    beforeAll(() => {
      instance = new CodeMeshWasm()
    })

    it('should create instance', () => {
      expect(instance).toBeDefined()
      expect(instance).toBeInstanceOf(CodeMeshWasm)
    })

    it('should initialize instance', () => {
      const result = instance.init()

      expect(result).toBeDefined()
      expect(result.status).toBe('initialized')
    })

    it('should load module via instance method', () => {
      const result = instance.loadModule(sampleModule)

      expect(result).toBeDefined()
      expect(result.module_id).toBe('module-001')
    })

    it('should execute module via instance method', () => {
      const result = instance.execute('module-001')

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })

    it('should serialize data via instance method', () => {
      const result = instance.serialize(sampleData)

      expect(result).toBeDefined()
      expect(result.id).toBe('data-001')
    })

    it('should deserialize data via instance method', () => {
      const serialized = instance.serialize(sampleData)
      const result = instance.deserialize(serialized)

      expect(result).toBeDefined()
      expect(result.status).toBe('success')
    })

    it('should check browser compatibility via instance method', () => {
      const info = instance.checkBrowserCompatibility()

      expect(info).toBeDefined()
      expect(info.supported).toBe(true)
    })

    it('should get metrics via instance method', () => {
      const metrics = instance.getMetrics('module-001')

      expect(metrics).toBeDefined()
      expect(metrics.module_id).toBe('module-001')
    })

    it('should batch load modules via instance method', () => {
      const result = instance.batchLoad([sampleModule, sampleModule2])

      expect(result).toBeDefined()
      expect(result.total_modules).toBe(2)
    })

    it('should validate module via instance method', () => {
      const result = instance.validate(sampleModule)

      expect(result).toBeDefined()
      expect(result.is_valid).toBe(true)
    })

    it('should report initialization status', () => {
      expect(instance.isInitialized()).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    it('should initialize, load, and execute module in sequence', () => {
      const init = initializeWasmMesh()
      expect(init.status).toBe('initialized')

      const loaded = loadWasmModule(sampleModule)
      expect(loaded.status).toBe('loaded')

      const executed = executeWasmModule(sampleModule.id)
      expect(executed.status).toBe('completed')
    })

    it('should serialize, deserialize, and validate data workflow', () => {
      const serialized = serializeData(sampleData)
      expect(serialized.serialized_data).toBeDefined()

      const deserialized = deserializeData(serialized)
      expect(deserialized.status).toBe('success')
    })

    it('should perform complete workflow', () => {
      // Initialize
      const init = initializeWasmMesh({
        enable_browser_api: true,
        enable_caching: true,
      })
      expect(init.browser_api_enabled).toBe(true)

      // Validate
      const validation = validateWasmModule(sampleModule)
      expect(validation.is_valid).toBe(true)

      // Load
      const loaded = loadWasmModule(sampleModule)
      expect(loaded.status).toBe('loaded')

      // Execute
      const executed = executeWasmModule(sampleModule.id)
      expect(executed.status).toBe('completed')

      // Get metrics
      const metrics = getPerformanceMetrics(sampleModule.id)
      expect(metrics.module_id).toBe(sampleModule.id)

      // Check browser compatibility
      const compat = getBrowserCompatibility()
      expect(compat.supported).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle execution of non-existent module', () => {
      const result = executeWasmModule('non-existent-module')

      expect(result).toBeDefined()
      expect(result.module_id).toBe('non-existent-module')
    })

    it('should handle batch load with mixed modules', () => {
      const modules = [sampleModule, sampleModule2]
      const result = batchLoadModules(modules)

      expect(result).toBeDefined()
      expect(result.total_modules).toBe(2)
      expect(result.loaded_modules).toBe(2)
    })

    it('should handle validation with incomplete module', () => {
      const incompleteModule: WasmModuleConfig = {
        id: 'incomplete',
        name: '',
        version: '1.0.0',
        entry_point: '',
        permissions: [],
      }

      const result = validateWasmModule(incompleteModule)

      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
