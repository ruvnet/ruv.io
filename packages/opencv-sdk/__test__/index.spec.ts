import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  OpenCvSdk,
  PipelineConfig,
  ProcessingResult,
  CvPreset,
  BatchJob,
  WorkflowConfig,
  WorkflowResult,
  SdkConfig,
  createEdgeDetectionPreset,
  createFaceDetectionPreset,
  createObjectTrackingPreset,
  createThresholdingPreset,
  getDefaultSdkConfig,
} from '../src/index'

describe('OpenCV SDK - Computer Vision and Workflow Automation', () => {
  let sdk: OpenCvSdk

  beforeAll(() => {
    sdk = new OpenCvSdk()
  })

  describe('SDK Initialization', () => {
    it('should create an OpenCvSdk instance with default config', () => {
      expect(sdk).toBeDefined()
    })

    it('should create an OpenCvSdk with custom config', () => {
      const config: SdkConfig = {
        max_threads: 16,
        max_batch_size: 200,
        cache_size_mb: 1024,
        gpu_enabled: true,
        debug_mode: true,
      }
      const customSdk = new OpenCvSdk(config)
      expect(customSdk).toBeDefined()
    })

    it('should get configuration from SDK', () => {
      const config = sdk.getConfig()
      expect(config).toBeDefined()
      expect(config.max_threads).toBeGreaterThan(0)
    })

    it('should have default configuration values', () => {
      const config = sdk.getConfig()
      expect(config.max_batch_size).toBe(100)
      expect(config.cache_size_mb).toBe(512)
      expect(config.gpu_enabled).toBe(false)
    })

    it('should get default SDK configuration', () => {
      const config = getDefaultSdkConfig()
      expect(config).toBeDefined()
      expect(config.max_threads).toBe(8)
    })

    it('should get session ID', () => {
      const sessionId = sdk.getSessionId()
      expect(sessionId).toBeDefined()
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })
  })

  describe('Pipeline Management', () => {
    it('should create an image processing pipeline', () => {
      const pipeline: PipelineConfig = {
        name: 'edge_detection_pipeline',
        steps: ['grayscale', 'blur', 'canny_edge'],
        parallel: false,
        timeout_ms: 5000,
        cache_enabled: true,
      }
      const result = sdk.createPipeline(pipeline)
      expect(result.success).toBe(true)
      expect(result.pipeline_id).toBe('edge_detection_pipeline')
    })

    it('should retrieve created pipeline', () => {
      const pipeline: PipelineConfig = {
        name: 'test_pipeline_1',
        steps: ['step1', 'step2'],
      }
      sdk.createPipeline(pipeline)
      const retrieved = sdk.getPipeline('test_pipeline_1')
      expect(retrieved.name).toBe('test_pipeline_1')
      expect(retrieved.steps).toContain('step1')
    })

    it('should list all pipelines', () => {
      sdk.createPipeline({
        name: 'pipeline_a',
        steps: ['step1'],
      })
      sdk.createPipeline({
        name: 'pipeline_b',
        steps: ['step2'],
      })
      const pipelines = sdk.listPipelines()
      expect(Array.isArray(pipelines)).toBe(true)
      expect(pipelines.length).toBeGreaterThan(0)
    })

    it('should validate valid pipeline configuration', () => {
      const pipeline: PipelineConfig = {
        name: 'valid_pipeline',
        steps: ['step1', 'step2'],
      }
      const result = sdk.validatePipeline(pipeline)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate invalid pipeline configuration', () => {
      const pipeline: PipelineConfig = {
        name: '',
        steps: [],
      }
      const result = sdk.validatePipeline(pipeline)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Image Processing', () => {
    it('should process single image with pipeline', () => {
      sdk.createPipeline({
        name: 'single_image_pipeline',
        steps: ['normalize', 'enhance'],
      })
      const result = sdk.processImage(
        'image_001',
        'single_image_pipeline',
        640,
        480
      )
      expect(result.success).toBe(true)
      expect(result.image_id).toBe('image_001')
      expect(result.width).toBe(640)
      expect(result.height).toBe(480)
    })

    it('should process image and return processing time', () => {
      sdk.createPipeline({
        name: 'timed_pipeline',
        steps: ['process'],
      })
      const result = sdk.processImage(
        'image_002',
        'timed_pipeline',
        800,
        600
      )
      expect(result.processing_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should include metadata in processing result', () => {
      sdk.createPipeline({
        name: 'metadata_pipeline',
        steps: ['analyze'],
      })
      const result = sdk.processImage(
        'image_003',
        'metadata_pipeline',
        1920,
        1080
      )
      expect(result.metadata).toBeDefined()
      expect(result.metadata?.pipeline_id).toBe('metadata_pipeline')
    })
  })

  describe('Preset Management', () => {
    it('should register a custom preset', () => {
      const preset: CvPreset = {
        preset_type: 'custom_blur',
        config: {
          method: 'gaussian',
          kernel_size: '5',
        },
        description: 'Custom Gaussian blur',
      }
      const result = sdk.registerPreset(preset)
      expect(result.success).toBe(true)
      expect(result.preset_id).toBe('custom_blur')
    })

    it('should retrieve registered preset', () => {
      const preset: CvPreset = {
        preset_type: 'test_preset',
        config: { threshold: '127' },
        description: 'Test preset',
      }
      sdk.registerPreset(preset)
      const retrieved = sdk.getPreset('test_preset')
      expect(retrieved.preset_type).toBe('test_preset')
      expect(retrieved.description).toBe('Test preset')
    })

    it('should list all registered presets', () => {
      sdk.registerPreset({
        preset_type: 'preset_x',
        config: {},
        description: 'Preset X',
      })
      sdk.registerPreset({
        preset_type: 'preset_y',
        config: {},
        description: 'Preset Y',
      })
      const presets = sdk.listPresets()
      expect(Array.isArray(presets)).toBe(true)
      expect(presets.length).toBeGreaterThan(0)
    })

    it('should create edge detection preset', () => {
      const preset = createEdgeDetectionPreset()
      expect(preset.preset_type).toBe('edge_detection')
      expect(preset.config.method).toBe('canny')
    })

    it('should create face detection preset', () => {
      const preset = createFaceDetectionPreset()
      expect(preset.preset_type).toBe('face_detection')
      expect(preset.config.cascade).toBe('haarcascade')
    })

    it('should create object tracking preset', () => {
      const preset = createObjectTrackingPreset()
      expect(preset.preset_type).toBe('object_tracking')
      expect(preset.config.algorithm).toBe('optical_flow')
    })

    it('should create thresholding preset', () => {
      const preset = createThresholdingPreset()
      expect(preset.preset_type).toBe('thresholding')
      expect(preset.config.method).toBe('binary')
    })
  })

  describe('Preset Application', () => {
    it('should apply edge detection to image', () => {
      const result = sdk.applyEdgeDetection('image_edge_001', 'canny')
      expect(result.success).toBe(true)
      expect(result.image_id).toBe('image_edge_001')
      expect(result.metadata?.method).toBe('canny')
    })

    it('should apply blur filter to image', () => {
      const result = sdk.applyBlurFilter('image_blur_001', 5)
      expect(result.success).toBe(true)
      expect(result.image_id).toBe('image_blur_001')
      expect(result.metadata?.kernel_size).toBe('5')
    })

    it('should apply color space conversion', () => {
      const result = sdk.applyColorConversion('image_hsv_001', 'HSV')
      expect(result.success).toBe(true)
      expect(result.image_id).toBe('image_hsv_001')
      expect(result.metadata?.color_space).toBe('HSV')
    })

    it('should apply LAB color space conversion', () => {
      const result = sdk.applyColorConversion('image_lab_001', 'LAB')
      expect(result.success).toBe(true)
      expect(result.metadata?.color_space).toBe('LAB')
    })
  })

  describe('Batch Processing', () => {
    it('should create batch job for multiple images', () => {
      sdk.createPipeline({
        name: 'batch_pipeline',
        steps: ['process'],
      })
      const imageIds = ['img1', 'img2', 'img3', 'img4', 'img5']
      const result = sdk.createBatchJob(imageIds, 'batch_pipeline')
      expect(result.success).toBe(true)
      expect(result.image_count).toBe(5)
      expect(result.job_id).toBeDefined()
    })

    it('should get batch job status', () => {
      const imageIds = ['img_a', 'img_b', 'img_c']
      const createResult = sdk.createBatchJob(imageIds, 'batch_pipeline')
      const jobId = createResult.job_id
      const status = sdk.getBatchJobStatus(jobId)
      expect(status.job_id).toBe(jobId)
      expect(status.image_ids.length).toBe(3)
    })

    it('should process batch with progress tracking', () => {
      const imageIds = ['batch_img_1', 'batch_img_2']
      const createResult = sdk.createBatchJob(imageIds, 'batch_pipeline')
      const progressResult = sdk.processBatch(createResult.job_id)
      expect(progressResult.success).toBe(true)
      expect(progressResult.progress).toBeGreaterThan(0)
    })

    it('should complete batch job', () => {
      const imageIds = ['complete_img_1', 'complete_img_2', 'complete_img_3']
      const createResult = sdk.createBatchJob(imageIds, 'batch_pipeline')
      const completeResult = sdk.completeBatch(createResult.job_id)
      expect(completeResult.success).toBe(true)
      expect(completeResult.status).toBe('completed')
    })

    it('should track results count in batch', () => {
      const imageIds = ['res1', 'res2', 'res3', 'res4']
      const createResult = sdk.createBatchJob(imageIds, 'batch_pipeline')
      sdk.processBatch(createResult.job_id)
      const finalResult = sdk.completeBatch(createResult.job_id)
      expect(finalResult.results_count).toBe(4)
    })
  })

  describe('Workflow Management', () => {
    it('should start a workflow', () => {
      const workflow: WorkflowConfig = {
        workflow_id: 'wf_001',
        name: 'image_analysis_workflow',
        stages: ['load', 'preprocess', 'analyze', 'export'],
      }
      const result = sdk.startWorkflow(workflow)
      expect(result.success).toBe(true)
      expect(result.workflow_id).toBe('wf_001')
    })

    it('should execute workflow stage', () => {
      const workflow: WorkflowConfig = {
        workflow_id: 'wf_002',
        name: 'processing_workflow',
        stages: ['stage1', 'stage2', 'stage3'],
      }
      sdk.startWorkflow(workflow)
      const result = sdk.executeWorkflowStage('wf_002', 0)
      expect(result.success).toBe(true)
      expect(result.stage_status).toBe('completed')
    })

    it('should execute multiple workflow stages sequentially', () => {
      const workflow: WorkflowConfig = {
        workflow_id: 'wf_003',
        name: 'multi_stage_workflow',
        stages: ['detect', 'track', 'classify'],
      }
      sdk.startWorkflow(workflow)
      sdk.executeWorkflowStage('wf_003', 0)
      sdk.executeWorkflowStage('wf_003', 1)
      const finalResult = sdk.executeWorkflowStage('wf_003', 2)
      expect(finalResult.success).toBe(true)
    })

    it('should get workflow result', () => {
      const workflow: WorkflowConfig = {
        workflow_id: 'wf_004',
        name: 'complete_workflow',
        stages: ['start', 'middle', 'end'],
      }
      sdk.startWorkflow(workflow)
      const result = sdk.getWorkflowResult('wf_004')
      expect(result.workflow_id).toBe('wf_004')
      expect(result.success).toBe(true)
    })

    it('should track workflow execution time', () => {
      const workflow: WorkflowConfig = {
        workflow_id: 'wf_time_001',
        name: 'timed_workflow',
        stages: ['process'],
      }
      sdk.startWorkflow(workflow)
      const result = sdk.getWorkflowResult('wf_time_001')
      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should track stages completed in workflow', () => {
      const workflow: WorkflowConfig = {
        workflow_id: 'wf_stages_001',
        name: 'stage_tracking_workflow',
        stages: ['s1', 's2', 's3', 's4'],
      }
      sdk.startWorkflow(workflow)
      const result = sdk.getWorkflowResult('wf_stages_001')
      expect(result.stages_completed).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Cache Management', () => {
    it('should clear all caches', () => {
      sdk.createPipeline({
        name: 'cache_pipeline',
        steps: ['step1'],
      })
      sdk.registerPreset({
        preset_type: 'cache_preset',
        config: {},
        description: 'Cache test',
      })
      const result = sdk.clearCaches()
      expect(result).toBe(true)
    })

    it('should have empty state after cache clear', () => {
      sdk.clearCaches()
      const pipelines = sdk.listPipelines()
      expect(pipelines.length).toBe(0)
    })
  })

  describe('Statistics and Monitoring', () => {
    it('should get SDK statistics', () => {
      sdk.clearCaches()
      sdk.createPipeline({
        name: 'stats_pipeline',
        steps: ['analyze'],
      })
      sdk.registerPreset({
        preset_type: 'stats_preset',
        config: {},
        description: 'Stats test',
      })
      const stats = sdk.getStatistics()
      expect(stats).toBeDefined()
      expect(stats.session_id).toBeDefined()
      expect(stats.pipelines_count).toBeGreaterThan(0)
      expect(stats.presets_count).toBeGreaterThan(0)
    })

    it('should track configuration in statistics', () => {
      const stats = sdk.getStatistics()
      expect(stats.config).toBeDefined()
      expect(stats.config.max_threads).toBeGreaterThan(0)
    })

    it('should track batch jobs count in statistics', () => {
      sdk.clearCaches()
      sdk.createPipeline({
        name: 'job_stats_pipeline',
        steps: ['process'],
      })
      sdk.createBatchJob(['img1', 'img2'], 'job_stats_pipeline')
      const stats = sdk.getStatistics()
      expect(stats.jobs_count).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should throw on non-existent pipeline retrieval', () => {
      expect(() => {
        sdk.getPipeline('non_existent_pipeline')
      }).toThrow()
    })

    it('should throw on non-existent preset retrieval', () => {
      expect(() => {
        sdk.getPreset('non_existent_preset')
      }).toThrow()
    })

    it('should throw on non-existent batch job status', () => {
      expect(() => {
        sdk.getBatchJobStatus('non_existent_job_id')
      }).toThrow()
    })
  })

  describe('Complex Workflows', () => {
    it('should execute complete image analysis workflow', () => {
      sdk.clearCaches()

      // Setup
      sdk.createPipeline({
        name: 'analysis_pipeline',
        steps: ['load', 'enhance', 'detect', 'track'],
      })

      // Process
      const result = sdk.processImage('analysis_img_1', 'analysis_pipeline', 1280, 720)

      expect(result.success).toBe(true)
      expect(result.width).toBe(1280)
      expect(result.height).toBe(720)
    })

    it('should execute batch workflow with multiple presets', () => {
      sdk.clearCaches()

      // Register presets
      const edgePreset = createEdgeDetectionPreset()
      const facePreset = createFaceDetectionPreset()

      sdk.registerPreset(edgePreset)
      sdk.registerPreset(facePreset)

      // Create batch
      const imageIds = ['batch_multi_1', 'batch_multi_2', 'batch_multi_3']
      const jobResult = sdk.createBatchJob(imageIds, 'multi_preset_pipeline')

      expect(jobResult.job_id).toBeDefined()
      expect(jobResult.image_count).toBe(3)
    })

    it('should execute multi-stage detection workflow', () => {
      const workflow: WorkflowConfig = {
        workflow_id: 'detection_wf',
        name: 'multi_stage_detection',
        stages: ['capture', 'preprocess', 'edge_detect', 'object_detect', 'classify'],
        error_handling: 'continue',
        retry_count: 3,
      }

      const result = sdk.startWorkflow(workflow)
      expect(result.success).toBe(true)

      // Execute stages
      for (let i = 0; i < workflow.stages.length; i++) {
        const stageResult = sdk.executeWorkflowStage(workflow.workflow_id, i)
        expect(stageResult.success).toBe(true)
      }

      const finalResult = sdk.getWorkflowResult(workflow.workflow_id)
      expect(finalResult.stages_completed).toBeGreaterThan(0)
    })
  })
})
