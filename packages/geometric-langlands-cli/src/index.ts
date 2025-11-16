export interface CLIConfig {
  verbose?: boolean
  output_format?: string
  max_iterations?: number
  timeout_ms?: number
  parallel_jobs?: number
}

export interface Sheaf {
  id: string
  base_space: string
  sections: string[]
  dimension: number
}

export interface SheafOperationResult {
  operation_id: string
  operation_type: string
  input_sheaf_id: string
  output_sheaf_id: string
  status: string
  duration_ms: number
  result_data: Record<string, any>
}

export interface ComputationTask {
  task_id: string
  task_type: string
  status: string
  progress: number
  input_params: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ComputationResultData {
  task_id: string
  task_type: string
  status: string
  output: Record<string, any>
  execution_time_ms: number
  completed_at: string
}

export interface VisualizationMetadata {
  visualization_id: string
  visualization_type: string
  width: number
  height: number
  color_scheme: string
}

export interface DisplayResult {
  display_id: string
  format: string
  content: string
  metadata: Record<string, any>
}

export interface ModularForm {
  id: string
  weight: number
  level: number
  character: string
  coefficients: number[]
}

export interface ModularFormResult {
  form_id: string
  operation: string
  weight: number
  level: number
  status: string
  result_data: Record<string, any>
  computation_time_ms: number
}

export interface GaloisRepresentation {
  id: string
  representation_type: string
  dimension: number
  field: string
  roots_of_unity: string[]
  frobenius_data: Record<string, any>
}

export interface GaloisAnalysisResult {
  rep_id: string
  analysis_type: string
  dimension: number
  irreducible: boolean
  decomposition: string[]
  status: string
  analysis_time_ms: number
}

// Re-export from compiled napi-rs bindings
export { LanglandsCli } from '../index'
export {
  createSheaf,
  computeCohomology,
  tensorProductSheaves,
  restrictSheaf,
  formatResultForDisplay,
  createVisualization,
  batchExecuteTasks,
  parseLanglandsSpec,
  createModularForm,
  computeHeckeEigenvalues,
  createGaloisRepresentation,
  analyzeRepresentationIrreducibility,
  compareGaloisRepresentations,
} from '../index'

// Helper functions for convenience
export function createCliConfig(overrides?: Partial<CLIConfig>): CLIConfig {
  return {
    verbose: false,
    output_format: 'json',
    max_iterations: 100,
    timeout_ms: 30000,
    parallel_jobs: 4,
    ...overrides,
  }
}

export function createSheafObject(
  id: string,
  baseSpace: string,
  dimension: number,
  sections?: string[]
): Sheaf {
  return {
    id,
    base_space: baseSpace,
    sections: sections || Array.from({ length: dimension }, (_, i) => `section_${i}`),
    dimension,
  }
}

export function createComputationTask(
  taskId: string,
  taskType: string,
  inputParams?: Record<string, any>
): ComputationTask {
  return {
    task_id: taskId,
    task_type: taskType,
    status: 'created',
    progress: 0,
    input_params: inputParams || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function parseComputationResult(jsonStr: string): ComputationResultData {
  return JSON.parse(jsonStr)
}

export function parseSheafOperationResult(jsonStr: string): SheafOperationResult {
  return JSON.parse(jsonStr)
}

export function parseDisplayResult(jsonStr: string): DisplayResult {
  return JSON.parse(jsonStr)
}

export function parseVisualizationMetadata(jsonStr: string): VisualizationMetadata {
  return JSON.parse(jsonStr)
}

export function createModularFormObject(
  id: string,
  weight: number,
  level: number,
  character: string,
  coefficients?: number[]
): ModularForm {
  return {
    id,
    weight,
    level,
    character,
    coefficients: coefficients || [],
  }
}

export function parseModularFormResult(jsonStr: string): ModularFormResult {
  return JSON.parse(jsonStr)
}

export function createGaloisRepresentationObject(
  id: string,
  representationType: string,
  dimension: number,
  field: string,
  rootsOfUnity?: string[]
): GaloisRepresentation {
  return {
    id,
    representation_type: representationType,
    dimension,
    field,
    roots_of_unity: rootsOfUnity || [],
    frobenius_data: {},
  }
}

export function parseGaloisAnalysisResult(jsonStr: string): GaloisAnalysisResult {
  return JSON.parse(jsonStr)
}
