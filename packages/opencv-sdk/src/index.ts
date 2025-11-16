// OpenCV SDK - High-level computer vision APIs
// TypeScript bindings for the napi-rs module

export interface PipelineConfig {
  name: string
  steps: string[]
  parallel?: boolean
  timeout_ms?: number
  cache_enabled?: boolean
}

export interface ProcessingResult {
  success: boolean
  image_id: string
  width: number
  height: number
  processing_time_ms: number
  metadata?: Record<string, string>
  error?: string
}

export interface CvPreset {
  preset_type: string
  config: Record<string, string>
  description: string
}

export interface BatchJob {
  job_id: string
  image_ids: string[]
  pipeline_config: string
  status: string
  progress: number
  results_count: number
}

export interface WorkflowConfig {
  workflow_id: string
  name: string
  stages: string[]
  error_handling?: string
  retry_count?: number
}

export interface WorkflowResult {
  workflow_id: string
  success: boolean
  stages_completed: number
  execution_time_ms: number
  results: ProcessingResult[]
  error?: string
}

export interface SdkConfig {
  max_threads?: number
  max_batch_size?: number
  cache_size_mb?: number
  gpu_enabled?: boolean
  debug_mode?: boolean
}

/**
 * Native bindings from opencv_sdk Rust module
 */
let opencvSdk: any

try {
  // Load the native module via platform loader
  opencvSdk = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native opencv_sdk module not loaded. Build the project first.')
  opencvSdk = null
}

/**
 * OpenCV SDK - High-level computer vision API
 * Provides workflow management, image processing pipelines, and batch operations
 */
export class OpenCvSdk {
  private inner: any

  /**
   * Create a new OpenCV SDK instance
   * @param config - SDK configuration options
   */
  constructor(config?: SdkConfig) {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const configJson = config ? JSON.stringify(config) : undefined
    this.inner = new opencvSdk.OpenCvSdk(configJson)
  }

  /**
   * Get SDK configuration
   * @returns Current SDK configuration
   */
  getConfig(): SdkConfig {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getConfig()
    return JSON.parse(result)
  }

  /**
   * Create a new image processing pipeline
   * @param pipeline - Pipeline configuration
   * @returns Creation result with pipeline ID
   */
  createPipeline(pipeline: PipelineConfig): Record<string, any> {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const pipelineJson = JSON.stringify(pipeline)
    const result = this.inner.createPipeline(pipelineJson)
    return JSON.parse(result)
  }

  /**
   * Get pipeline by ID
   * @param pipelineId - Pipeline ID to retrieve
   * @returns Pipeline configuration
   */
  getPipeline(pipelineId: string): PipelineConfig {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getPipeline(pipelineId)
    return JSON.parse(result)
  }

  /**
   * List all pipelines
   * @returns Array of pipeline IDs
   */
  listPipelines(): string[] {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.listPipelines()
    return JSON.parse(result)
  }

  /**
   * Process image with a specific pipeline
   * @param imageId - Image identifier
   * @param pipelineId - Pipeline to apply
   * @param width - Image width
   * @param height - Image height
   * @returns Processing result
   */
  processImage(
    imageId: string,
    pipelineId: string,
    width: number,
    height: number
  ): ProcessingResult {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.processImage(imageId, pipelineId, width, height)
    return JSON.parse(result)
  }

  /**
   * Create a batch processing job
   * @param imageIds - Array of image IDs to process
   * @param pipelineId - Pipeline to apply to all images
   * @returns Batch job details
   */
  createBatchJob(imageIds: string[], pipelineId: string): Record<string, any> {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const imageIdsJson = JSON.stringify(imageIds)
    const result = this.inner.createBatchJob(imageIdsJson, pipelineId)
    return JSON.parse(result)
  }

  /**
   * Get batch job status
   * @param jobId - Job ID to query
   * @returns Batch job details
   */
  getBatchJobStatus(jobId: string): BatchJob {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getBatchJobStatus(jobId)
    return JSON.parse(result)
  }

  /**
   * Process batch with progress tracking
   * @param jobId - Job ID to process
   * @returns Processing progress update
   */
  processBatch(jobId: string): Record<string, any> {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.processBatch(jobId)
    return JSON.parse(result)
  }

  /**
   * Complete batch job
   * @param jobId - Job ID to complete
   * @returns Completion result
   */
  completeBatch(jobId: string): Record<string, any> {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.completeBatch(jobId)
    return JSON.parse(result)
  }

  /**
   * Register a computer vision preset
   * @param preset - Preset configuration
   * @returns Registration result
   */
  registerPreset(preset: CvPreset): Record<string, any> {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const presetJson = JSON.stringify(preset)
    const result = this.inner.registerPreset(presetJson)
    return JSON.parse(result)
  }

  /**
   * Get preset by type
   * @param presetType - Type of preset to retrieve
   * @returns Preset configuration
   */
  getPreset(presetType: string): CvPreset {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getPreset(presetType)
    return JSON.parse(result)
  }

  /**
   * List all registered presets
   * @returns Array of preset types
   */
  listPresets(): string[] {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.listPresets()
    return JSON.parse(result)
  }

  /**
   * Apply edge detection preset to image
   * @param imageId - Image to process
   * @param method - Edge detection method (e.g., "canny")
   * @returns Processing result
   */
  applyEdgeDetection(imageId: string, method: string): ProcessingResult {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.applyEdgeDetection(imageId, method)
    return JSON.parse(result)
  }

  /**
   * Apply blur filter preset to image
   * @param imageId - Image to process
   * @param kernelSize - Blur kernel size
   * @returns Processing result
   */
  applyBlurFilter(imageId: string, kernelSize: number): ProcessingResult {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.applyBlurFilter(imageId, kernelSize)
    return JSON.parse(result)
  }

  /**
   * Apply color space conversion preset
   * @param imageId - Image to process
   * @param colorSpace - Target color space (e.g., "HSV", "LAB")
   * @returns Processing result
   */
  applyColorConversion(imageId: string, colorSpace: string): ProcessingResult {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.applyColorConversion(imageId, colorSpace)
    return JSON.parse(result)
  }

  /**
   * Start a workflow execution
   * @param workflow - Workflow configuration
   * @returns Workflow execution result
   */
  startWorkflow(workflow: WorkflowConfig): WorkflowResult {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const workflowJson = JSON.stringify(workflow)
    const result = this.inner.startWorkflow(workflowJson)
    return JSON.parse(result)
  }

  /**
   * Execute next stage in workflow
   * @param workflowId - Workflow ID
   * @param stageIndex - Stage index to execute
   * @returns Stage execution result
   */
  executeWorkflowStage(workflowId: string, stageIndex: number): Record<string, any> {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.executeWorkflowStage(workflowId, stageIndex)
    return JSON.parse(result)
  }

  /**
   * Get workflow execution result
   * @param workflowId - Workflow ID to query
   * @returns Workflow result with all stage results
   */
  getWorkflowResult(workflowId: string): WorkflowResult {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getWorkflowResult(workflowId)
    return JSON.parse(result)
  }

  /**
   * Validate pipeline configuration
   * @param pipeline - Pipeline to validate
   * @returns Validation result
   */
  validatePipeline(pipeline: PipelineConfig): Record<string, any> {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const pipelineJson = JSON.stringify(pipeline)
    const result = this.inner.validatePipeline(pipelineJson)
    return JSON.parse(result)
  }

  /**
   * Clear all internal caches
   * @returns True if caches were cleared
   */
  clearCaches(): boolean {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    return this.inner.clearCaches()
  }

  /**
   * Get session ID
   * @returns Current session ID
   */
  getSessionId(): string {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    return this.inner.getSessionId()
  }

  /**
   * Get SDK statistics
   * @returns Statistics about SDK state
   */
  getStatistics(): Record<string, any> {
    if (!opencvSdk) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getStatistics()
    return JSON.parse(result)
  }
}

/**
 * Create default edge detection preset
 * @returns Edge detection preset configuration
 */
export function createEdgeDetectionPreset(): CvPreset {
  if (!opencvSdk) {
    throw new Error('Native module not available')
  }

  const result = opencvSdk.createEdgeDetectionPreset()
  return JSON.parse(result)
}

/**
 * Create default face detection preset
 * @returns Face detection preset configuration
 */
export function createFaceDetectionPreset(): CvPreset {
  if (!opencvSdk) {
    throw new Error('Native module not available')
  }

  const result = opencvSdk.createFaceDetectionPreset()
  return JSON.parse(result)
}

/**
 * Create default object tracking preset
 * @returns Object tracking preset configuration
 */
export function createObjectTrackingPreset(): CvPreset {
  if (!opencvSdk) {
    throw new Error('Native module not available')
  }

  const result = opencvSdk.createObjectTrackingPreset()
  return JSON.parse(result)
}

/**
 * Create default thresholding preset
 * @returns Thresholding preset configuration
 */
export function createThresholdingPreset(): CvPreset {
  if (!opencvSdk) {
    throw new Error('Native module not available')
  }

  const result = opencvSdk.createThresholdingPreset()
  return JSON.parse(result)
}

/**
 * Get default SDK configuration
 * @returns Default configuration
 */
export function getDefaultSdkConfig(): SdkConfig {
  if (!opencvSdk) {
    throw new Error('Native module not available')
  }

  const result = opencvSdk.getDefaultSdkConfig()
  return JSON.parse(result)
}

// Export all types and classes
export default {
  OpenCvSdk,
  createEdgeDetectionPreset,
  createFaceDetectionPreset,
  createObjectTrackingPreset,
  createThresholdingPreset,
  getDefaultSdkConfig,
}
