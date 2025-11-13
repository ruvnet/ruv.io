// Nanosecond Scheduler - TypeScript bindings for the napi-rs module

export interface SchedulerConfig {
  timeout?: number
  retries?: number
  maxConcurrency?: number
  logLevel?: string
}

export interface Task {
  id: string
  data: string
  priority?: number
  scheduledAt?: number
}

export interface TaskResult {
  task_id: string
  status: string
  result_data: string
  executed_at: number
  duration_ns: number
  success: boolean
}

export interface ExecutionStats {
  total_tasks: number
  successful_tasks: number
  failed_tasks: number
  total_duration_ns: number
  average_latency_ns: number
  min_latency_ns: number
  max_latency_ns: number
}

/**
 * Native bindings from nanosecond_scheduler Rust module
 */
let nanosecondScheduler: any

try {
  // Load the native module via platform loader
  nanosecondScheduler = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nanosecond_scheduler module not loaded. Build the project first.')
  nanosecondScheduler = null
}

/**
 * Process a single task
 * @param task - Task to process
 * @returns Task result with timing information
 */
export function processTask(task: Task): TaskResult {
  if (!nanosecondScheduler) {
    throw new Error('Native module not available')
  }

  const taskJson = JSON.stringify(task)
  const result = nanosecondScheduler.processTask(taskJson)

  return JSON.parse(result)
}

/**
 * Schedule and execute multiple tasks
 * @param tasks - Array of tasks to execute
 * @returns Array of task results
 */
export function scheduleTasks(tasks: Task[]): TaskResult[] {
  if (!nanosecondScheduler) {
    throw new Error('Native module not available')
  }

  const tasksJson = JSON.stringify(tasks)
  const result = nanosecondScheduler.scheduleTasks(tasksJson)

  return JSON.parse(result)
}

/**
 * Get execution statistics for a batch of tasks
 * @param tasks - Array of tasks to measure
 * @returns Execution statistics
 */
export function getExecutionStats(tasks: Task[]): ExecutionStats {
  if (!nanosecondScheduler) {
    throw new Error('Native module not available')
  }

  const tasksJson = JSON.stringify(tasks)
  const result = nanosecondScheduler.getExecutionStats(tasksJson)

  return JSON.parse(result)
}

/**
 * Create and validate a scheduler configuration
 * @param config - Configuration options
 * @returns Validated configuration with defaults
 */
export function createConfig(config: SchedulerConfig): SchedulerConfig {
  if (!nanosecondScheduler) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const result = nanosecondScheduler.createConfig(configJson)

  return JSON.parse(result)
}

export interface LatencyMeasurement {
  latency_ns: number
  total_duration_ns: number
  iterations: number
}

/**
 * Measure latency of task execution
 * @param task - Task to measure
 * @param iterations - Number of iterations (default: 1)
 * @returns Latency measurement details
 */
export function measureLatency(task: Task, iterations: number = 1): LatencyMeasurement {
  if (!nanosecondScheduler) {
    throw new Error('Native module not available')
  }

  const taskJson = JSON.stringify(task)
  const result = nanosecondScheduler.measureLatency(taskJson, iterations)
  return JSON.parse(result)
}

/**
 * Process a task with automatic retry logic
 * @param task - Task to process
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Task result
 */
export function processTaskWithRetries(task: Task, maxRetries: number = 3): TaskResult {
  if (!nanosecondScheduler) {
    throw new Error('Native module not available')
  }

  const taskJson = JSON.stringify(task)
  const result = nanosecondScheduler.processTaskWithRetries(taskJson, maxRetries)

  return JSON.parse(result)
}

/**
 * NanosecondScheduler class for advanced usage
 */
export class NanosecondScheduler {
  private config: SchedulerConfig

  /**
   * Create a new NanosecondScheduler instance
   * @param config - Configuration options
   */
  constructor(config?: SchedulerConfig) {
    if (!nanosecondScheduler) {
      throw new Error('Native module not available')
    }

    this.config = createConfig(config || {})
  }

  /**
   * Process a single task
   * @param task - Task to process
   * @returns Task result with timing information
   */
  process(task: Task): TaskResult {
    return processTask(task)
  }

  /**
   * Schedule and execute multiple tasks
   * @param tasks - Array of tasks to execute
   * @returns Array of task results
   */
  schedule(tasks: Task[]): TaskResult[] {
    return scheduleTasks(tasks)
  }

  /**
   * Get execution statistics
   * @param tasks - Array of tasks to measure
   * @returns Execution statistics
   */
  stats(tasks: Task[]): ExecutionStats {
    return getExecutionStats(tasks)
  }

  /**
   * Measure task latency
   * @param task - Task to measure
   * @param iterations - Number of iterations
   * @returns Latency measurement details
   */
  latency(task: Task, iterations?: number): LatencyMeasurement {
    return measureLatency(task, iterations)
  }

  /**
   * Process with retry logic
   * @param task - Task to process
   * @param maxRetries - Maximum number of retries
   * @returns Task result
   */
  withRetries(task: Task, maxRetries?: number): TaskResult {
    return processTaskWithRetries(task, maxRetries)
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): SchedulerConfig {
    return { ...this.config }
  }
}

/**
 * Create a new NanosecondScheduler instance
 * @param config - Configuration options
 * @returns NanosecondScheduler instance
 */
export function create(config?: SchedulerConfig): NanosecondScheduler {
  return new NanosecondScheduler(config)
}

// Export all types and functions
export default {
  processTask,
  scheduleTasks,
  getExecutionStats,
  createConfig,
  measureLatency,
  processTaskWithRetries,
  NanosecondScheduler,
  create,
}
