// Midstreamer Scheduler - Real-time task scheduling
// TypeScript bindings for the napi-rs module

export interface TaskConfig {
  id: string
  priority?: number
  max_retries?: number
  timeout_ms?: number
}

export interface ScheduledTask {
  id: string
  priority: number
  max_retries: number
  timeout_ms: number
  created_at: number
  scheduled_at: number
}

export interface ExecutionResult {
  id: string
  status: string
  output_size: number
  execution_time_ms: number
  retries: number
  timestamp: number
}

export interface SchedulerStats {
  total_tasks: number
  queued_tasks: number
  completed_tasks: number
  failed_tasks: number
  average_latency_ms: number
  uptime_ms: number
}

export interface Config {
  timeout_ms?: number
  retries?: number
  log_level?: string
  max_concurrency?: number
}

export interface BatchResult {
  processed: number
  remaining: number
  total_completed: number
  timestamp: number
}

export interface FailResult {
  id: string
  status: string
  error: string
  timestamp: number
  should_retry: boolean
}

/**
 * Native bindings from midstreamer_scheduler Rust module
 */
let schedulerModule: any

try {
  // Load the native module via platform loader
  schedulerModule = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native midstreamer_scheduler module not loaded. Build the project first.')
  schedulerModule = null
}

/**
 * Ultra-low-latency real-time task scheduler
 */
export class MidstreamerScheduler {
  private nativeScheduler: any

  /**
   * Create a new scheduler instance
   * @param config - Scheduler configuration
   */
  constructor(config?: Config) {
    if (!schedulerModule) {
      throw new Error('Native module not available')
    }

    const configJson = config ? JSON.stringify(config) : undefined
    this.nativeScheduler = new schedulerModule.MidstreamerScheduler(configJson)
  }

  /**
   * Process data synchronously
   * @param data - Input buffer to process
   * @returns Processed data as base64 string
   */
  processSync(data: Buffer): string {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    // Convert buffer to base64 for native processing
    const dataB64 = data.toString('base64')
    return this.nativeScheduler.processSync(dataB64)
  }

  /**
   * Process data asynchronously (Promise wrapper)
   * @param data - Input buffer to process
   * @returns Promise resolving to processed data as base64 string
   */
  async process(data: Buffer): Promise<string> {
    // Wrap synchronous operation in Promise for async API
    return Promise.resolve(this.processSync(data))
  }

  /**
   * Process data and return as buffer
   * @param data - Input buffer to process
   * @returns Processed buffer
   */
  processSyncBuffer(data: Buffer): Buffer {
    const resultB64 = this.processSync(data)
    return Buffer.from(resultB64, 'base64')
  }

  /**
   * Process data asynchronously and return as buffer
   * @param data - Input buffer to process
   * @returns Promise resolving to processed buffer
   */
  async processBuffer(data: Buffer): Promise<Buffer> {
    const result = await this.process(data)
    return Buffer.from(result, 'base64')
  }

  /**
   * Schedule a new task
   * @param taskConfig - Task configuration
   * @returns Task ID
   */
  scheduleTask(taskConfig: TaskConfig): string {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    const configJson = JSON.stringify(taskConfig)
    return this.nativeScheduler.scheduleTask(configJson)
  }

  /**
   * Get next task from queue
   * @returns Next scheduled task or null if queue is empty
   */
  nextTask(): ScheduledTask | null {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    const result = this.nativeScheduler.nextTask()
    return result ? JSON.parse(result) : null
  }

  /**
   * Get current queue size
   * @returns Number of tasks in queue
   */
  queueSize(): number {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    return this.nativeScheduler.queueSize()
  }

  /**
   * Mark a task as completed
   * @param task - Completed task
   * @param outputSize - Size of task output
   * @param executionTimeMs - Execution time in milliseconds
   * @returns Execution result
   */
  completeTask(task: ScheduledTask, outputSize: number = 0, executionTimeMs: number = 0): ExecutionResult {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    const taskJson = JSON.stringify(task)
    const result = this.nativeScheduler.completeTask(taskJson, outputSize, executionTimeMs)
    return JSON.parse(result)
  }

  /**
   * Mark a task as failed
   * @param taskId - Task ID
   * @param errorMessage - Error message
   * @returns Failure result with retry decision
   */
  failTask(taskId: string, errorMessage: string): FailResult {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    const result = this.nativeScheduler.failTask(taskId, errorMessage)
    return JSON.parse(result)
  }

  /**
   * Get scheduler statistics
   * @returns Current scheduler statistics
   */
  getStats(): SchedulerStats {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    const result = this.nativeScheduler.getStats()
    return JSON.parse(result)
  }

  /**
   * Reset scheduler state and statistics
   */
  reset(): void {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    this.nativeScheduler.reset()
  }

  /**
   * Process a batch of tasks
   * @param count - Number of tasks to process
   * @returns Batch processing result
   */
  processBatch(count: number): BatchResult {
    if (!this.nativeScheduler) {
      throw new Error('Native scheduler not available')
    }

    const result = this.nativeScheduler.processBatch(count)
    return JSON.parse(result)
  }

  /**
   * Close scheduler and clean up resources
   */
  async close(): Promise<void> {
    // Cleanup in case native resources need it
    if (this.nativeScheduler) {
      this.reset()
      this.nativeScheduler = null
    }
  }
}

/**
 * Create a stream processor wrapper
 */
export function createScheduler(config?: Config): MidstreamerScheduler {
  return new MidstreamerScheduler(config)
}

/**
 * Process data with default scheduler configuration
 */
export async function processData(data: Buffer): Promise<Buffer> {
  const scheduler = new MidstreamerScheduler()
  try {
    return await scheduler.processBuffer(data)
  } finally {
    await scheduler.close()
  }
}

// Export all types and functions
export default {
  MidstreamerScheduler,
  createScheduler,
  processData,
}
