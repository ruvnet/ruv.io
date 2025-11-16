// Code Mesh WASM - WebAssembly Bindings for Code Mesh
// TypeScript bindings for the napi-rs module

export interface WasmModuleConfig {
  id: string
  name: string
  version: string
  entry_point: string
  permissions: string[]
  metadata?: Record<string, any>
}

export interface SerializableData {
  id: string
  data_type: string
  content: string
  encoding: string
  compression?: string
  metadata?: Record<string, any>
}

export interface WasmMeshConfig {
  enable_browser_api?: boolean
  enable_caching?: boolean
  cache_size?: number
  max_module_size?: number
  performance_optimizations?: string[]
}

export interface WasmMeshInitResult {
  id: string
  initialized_at: string
  browser_api_enabled: boolean
  caching_enabled: boolean
  status: string
  config: WasmMeshConfig
}

export interface ModuleLoadResult {
  module_id: string
  module_name: string
  loaded_at: string
  status: string
  message: string
}

export interface ModuleUnloadResult {
  module_id: string
  unloaded_at: string
  status: string
  message: string
}

export interface ModuleExecutionResult {
  module_id: string
  executed_at: string
  status: string
  output: Record<string, any>
  duration_ms: number
}

export interface DataSerializationResult {
  id: string
  original_size: number
  serialized_data: string
  serialized_size: number
  timestamp: string
}

export interface DataDeserializationResult {
  deserialized_data: string
  status: string
  timestamp: string
}

export interface BrowserVersions {
  chrome: string
  firefox: string
  safari: string
  edge: string
}

export interface BrowserCompatibilityInfo {
  supported: boolean
  wasm_support: boolean
  web_workers: boolean
  shared_array_buffer: boolean
  features: string[]
  min_browser_versions: BrowserVersions
}

export interface PerformanceMetrics {
  module_id: string
  total_executions: number
  average_duration_ms: number
  min_duration_ms: number
  max_duration_ms: number
  success_rate: number
  memory_usage_mb: number
  timestamp: string
}

export interface BatchLoadResult {
  total_modules: number
  loaded_modules: number
  failed_modules: number
  loaded_at: string
  status: string
}

export interface ValidationResult {
  module_id: string
  is_valid: boolean
  errors: string[]
  validated_at: string
}

/**
 * Native bindings from code_mesh_wasm Rust module
 */
let wasmMesh: any

try {
  // Load the native module via platform loader
  wasmMesh = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native code_mesh_wasm module not loaded. Build the project first.')
  wasmMesh = null
}

/**
 * Initialize the WASM mesh with configuration
 * @param config - WASM mesh configuration options
 * @returns WASM mesh initialization result
 */
export function initializeWasmMesh(config?: WasmMeshConfig): WasmMeshInitResult {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const configJson = config ? JSON.stringify(config) : undefined
  const result = wasmMesh.initializeWasmMesh(configJson)

  return JSON.parse(result)
}

/**
 * Load a WASM module into the mesh
 * @param module - WASM module configuration
 * @returns Module loading result
 */
export function loadWasmModule(module: WasmModuleConfig): ModuleLoadResult {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const moduleJson = JSON.stringify(module)
  const result = wasmMesh.loadWasmModule(moduleJson)

  return JSON.parse(result)
}

/**
 * Unload a WASM module from the mesh
 * @param moduleId - ID of the module to unload
 * @returns Module unloading result
 */
export function unloadWasmModule(moduleId: string): ModuleUnloadResult {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const result = wasmMesh.unloadWasmModule(moduleId)

  return JSON.parse(result)
}

/**
 * Execute a WASM module
 * @param moduleId - ID of the module to execute
 * @param input - Input data for the module
 * @returns Module execution result
 */
export function executeWasmModule(moduleId: string, input?: Record<string, any>): ModuleExecutionResult {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const inputJson = JSON.stringify(input || {})
  const result = wasmMesh.executeWasmModule(moduleId, inputJson)

  return JSON.parse(result)
}

/**
 * Serialize data for WASM transmission
 * @param data - Data to serialize
 * @returns Serialization result
 */
export function serializeData(data: SerializableData): DataSerializationResult {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const dataJson = JSON.stringify(data)
  const result = wasmMesh.serializeData(dataJson)

  return JSON.parse(result)
}

/**
 * Deserialize WASM data
 * @param serializedData - Serialized data to deserialize
 * @returns Deserialization result
 */
export function deserializeData(serializedData: Record<string, any>): DataDeserializationResult {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const serializedJson = JSON.stringify(serializedData)
  const result = wasmMesh.deserializeData(serializedJson)

  return JSON.parse(result)
}

/**
 * Get browser compatibility information
 * @returns Browser compatibility info
 */
export function getBrowserCompatibility(): BrowserCompatibilityInfo {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const result = wasmMesh.getBrowserCompatibility()

  return JSON.parse(result)
}

/**
 * Get performance metrics for a WASM module
 * @param moduleId - ID of the module
 * @returns Performance metrics
 */
export function getPerformanceMetrics(moduleId: string): PerformanceMetrics {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const result = wasmMesh.getPerformanceMetrics(moduleId)

  return JSON.parse(result)
}

/**
 * Batch load multiple WASM modules
 * @param modules - Array of module configurations
 * @returns Batch load result
 */
export function batchLoadModules(modules: WasmModuleConfig[]): BatchLoadResult {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const modulesJson = JSON.stringify(modules)
  const result = wasmMesh.batchLoadModules(modulesJson)

  return JSON.parse(result)
}

/**
 * Validate a WASM module before loading
 * @param module - Module to validate
 * @returns Validation result
 */
export function validateWasmModule(module: WasmModuleConfig): ValidationResult {
  if (!wasmMesh) {
    throw new Error('Native module not available')
  }

  const moduleJson = JSON.stringify(module)
  const result = wasmMesh.validateWasmModule(moduleJson)

  return JSON.parse(result)
}

/**
 * Create a new CodeMeshWasm instance for advanced use cases
 */
export class CodeMeshWasm {
  private initialized: boolean = false

  /**
   * Create a new CodeMeshWasm instance
   */
  constructor(config?: WasmMeshConfig) {
    if (!wasmMesh) {
      throw new Error('Native module not available')
    }

    // Initialize the WASM mesh
    this.initialized = true
  }

  /**
   * Initialize the WASM mesh
   */
  init(config?: WasmMeshConfig): WasmMeshInitResult {
    return initializeWasmMesh(config)
  }

  /**
   * Load a WASM module
   */
  loadModule(module: WasmModuleConfig): ModuleLoadResult {
    return loadWasmModule(module)
  }

  /**
   * Unload a WASM module
   */
  unloadModule(moduleId: string): ModuleUnloadResult {
    return unloadWasmModule(moduleId)
  }

  /**
   * Execute a WASM module
   */
  execute(moduleId: string, input?: Record<string, any>): ModuleExecutionResult {
    return executeWasmModule(moduleId, input)
  }

  /**
   * Serialize data
   */
  serialize(data: SerializableData): DataSerializationResult {
    return serializeData(data)
  }

  /**
   * Deserialize data
   */
  deserialize(serializedData: Record<string, any>): DataDeserializationResult {
    return deserializeData(serializedData)
  }

  /**
   * Get browser compatibility
   */
  checkBrowserCompatibility(): BrowserCompatibilityInfo {
    return getBrowserCompatibility()
  }

  /**
   * Get performance metrics
   */
  getMetrics(moduleId: string): PerformanceMetrics {
    return getPerformanceMetrics(moduleId)
  }

  /**
   * Batch load modules
   */
  batchLoad(modules: WasmModuleConfig[]): BatchLoadResult {
    return batchLoadModules(modules)
  }

  /**
   * Validate a module
   */
  validate(module: WasmModuleConfig): ValidationResult {
    return validateWasmModule(module)
  }

  /**
   * Check if WASM mesh is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }
}

// Export all types and functions
export default {
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
  CodeMeshWasm,
}
