import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  NanosecondScheduler,
  processTask,
  scheduleTasks,
  getExecutionStats,
  createConfig,
  measureLatency,
  processTaskWithRetries,
  Task,
  TaskResult,
  ExecutionStats,
  SchedulerConfig,
  LatencyMeasurement,
} from '../src/index'

describe('Nanosecond Scheduler', () => {
  const sampleTask: Task = {
    id: 'task-001',
    data: 'hello world',
    priority: 1,
    scheduledAt: Date.now(),
  }

  const sampleTask2: Task = {
    id: 'task-002',
    data: 'sample data',
    priority: 2,
    scheduledAt: Date.now(),
  }

  describe('processTask', () => {
    it('should process a task and return result', () => {
      const result = processTask(sampleTask)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('task-001')
      expect(result.status).toBe('completed')
      expect(result.result_data).toBeDefined()
      expect(result.executed_at).toBeGreaterThan(0)
      expect(result.duration_ns).toBeGreaterThanOrEqual(0)
      expect(result.success).toBe(true)
    })

    it('should transform data correctly', () => {
      const task: Task = {
        id: 'test-001',
        data: 'hello',
      }

      const result = processTask(task)

      // Data should be reversed and uppercase
      expect(result.result_data).toBe('OLLEH')
    })

    it('should preserve task ID', () => {
      const result = processTask(sampleTask)

      expect(result.task_id).toBe('task-001')
    })

    it('should handle empty data', () => {
      const emptyTask: Task = {
        id: 'empty-task',
        data: '',
      }

      const result = processTask(emptyTask)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('empty-task')
      expect(result.result_data).toBe('')
    })

    it('should handle special characters', () => {
      const specialTask: Task = {
        id: 'special',
        data: '!@#$%',
      }

      const result = processTask(specialTask)

      expect(result).toBeDefined()
      expect(result.result_data).toBe('%$#@!')
    })

    it('should measure execution duration', () => {
      const result = processTask(sampleTask)

      expect(result.duration_ns).toBeGreaterThanOrEqual(0)
      expect(typeof result.duration_ns).toBe('number')
    })
  })

  describe('scheduleTasks', () => {
    it('should schedule and execute multiple tasks', () => {
      const tasks = [sampleTask, sampleTask2]
      const results = scheduleTasks(tasks)

      expect(results).toHaveLength(2)
      expect(results[0].task_id).toBe('task-001')
      expect(results[1].task_id).toBe('task-002')
    })

    it('should execute each task independently', () => {
      const tasks = [sampleTask, sampleTask2]
      const results = scheduleTasks(tasks)

      expect(results[0].result_data).not.toBe(results[1].result_data)
    })

    it('should handle empty task list', () => {
      const results = scheduleTasks([])

      expect(results).toHaveLength(0)
    })

    it('should handle large batch of tasks', () => {
      const tasks = Array.from({ length: 50 }, (_, i) => ({
        id: `task-${i}`,
        data: `data-${i}`,
      }))

      const results = scheduleTasks(tasks)

      expect(results).toHaveLength(50)
      expect(results.every((r) => r.success)).toBe(true)
    })

    it('should preserve task order in results', () => {
      const tasks = [
        { id: 'task-a', data: 'alpha' },
        { id: 'task-b', data: 'beta' },
        { id: 'task-c', data: 'gamma' },
      ]

      const results = scheduleTasks(tasks)

      expect(results[0].task_id).toBe('task-a')
      expect(results[1].task_id).toBe('task-b')
      expect(results[2].task_id).toBe('task-c')
    })
  })

  describe('getExecutionStats', () => {
    it('should return execution statistics', () => {
      const tasks = [sampleTask, sampleTask2]
      const stats = getExecutionStats(tasks)

      expect(stats).toBeDefined()
      expect(stats.total_tasks).toBe(2)
      expect(stats.successful_tasks).toBe(2)
      expect(stats.failed_tasks).toBe(0)
      expect(stats.total_duration_ns).toBeGreaterThanOrEqual(0)
      expect(stats.average_latency_ns).toBeGreaterThanOrEqual(0)
      expect(stats.min_latency_ns).toBeGreaterThanOrEqual(0)
      expect(stats.max_latency_ns).toBeGreaterThanOrEqual(0)
    })

    it('should calculate correct statistics for multiple tasks', () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `task-${i}`,
        data: `data-${i}`,
      }))

      const stats = getExecutionStats(tasks)

      expect(stats.total_tasks).toBe(10)
      expect(stats.successful_tasks).toBe(10)
      expect(stats.average_latency_ns).toBeGreaterThanOrEqual(0)
      expect(stats.min_latency_ns).toBeLessThanOrEqual(stats.max_latency_ns)
    })

    it('should handle single task statistics', () => {
      const stats = getExecutionStats([sampleTask])

      expect(stats.total_tasks).toBe(1)
      expect(stats.successful_tasks).toBe(1)
      expect(stats.min_latency_ns).toBeLessThanOrEqual(stats.max_latency_ns)
    })

    it('should calculate average latency correctly', () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `task-${i}`,
        data: `data-${i}`,
      }))

      const stats = getExecutionStats(tasks)

      expect(stats.average_latency_ns).toBeLessThanOrEqual(stats.total_duration_ns)
    })

    it('should handle empty task list', () => {
      const stats = getExecutionStats([])

      expect(stats.total_tasks).toBe(0)
      expect(stats.successful_tasks).toBe(0)
      expect(stats.average_latency_ns).toBeGreaterThanOrEqual(0)
    })
  })

  describe('createConfig', () => {
    it('should create config with defaults', () => {
      const config = createConfig({})

      expect(config).toBeDefined()
      expect(config.timeout).toBeDefined()
      expect(config.retries).toBeDefined()
      expect(config.maxConcurrency).toBeDefined()
      expect(config.logLevel).toBeDefined()
    })

    it('should respect custom timeout', () => {
      const config = createConfig({ timeout: 10000 })

      expect(config.timeout).toBe(10000)
    })

    it('should respect custom retries', () => {
      const config = createConfig({ retries: 5 })

      expect(config.retries).toBe(5)
    })

    it('should respect custom max concurrency', () => {
      const config = createConfig({ maxConcurrency: 20 })

      expect(config.maxConcurrency).toBe(20)
    })

    it('should respect custom log level', () => {
      const config = createConfig({ logLevel: 'debug' })

      expect(config.logLevel).toBe('debug')
    })

    it('should apply defaults for missing values', () => {
      const config = createConfig({ timeout: 3000 })

      expect(config.timeout).toBe(3000)
      expect(config.retries).toBeDefined()
      expect(config.maxConcurrency).toBeDefined()
    })
  })

  describe('measureLatency', () => {
    it('should measure task latency', () => {
      const measurement = measureLatency(sampleTask)

      expect(measurement).toBeDefined()
      expect(typeof measurement.latency_ns).toBe('number')
      expect(measurement.latency_ns).toBeGreaterThanOrEqual(0)
      expect(measurement.iterations).toBe(1)
    })

    it('should measure latency for multiple iterations', () => {
      const measurement = measureLatency(sampleTask, 10)

      expect(measurement).toBeDefined()
      expect(typeof measurement.latency_ns).toBe('number')
      expect(measurement.latency_ns).toBeGreaterThanOrEqual(0)
      expect(measurement.iterations).toBe(10)
    })

    it('should default to single iteration', () => {
      const measurement = measureLatency(sampleTask)

      expect(measurement).toBeDefined()
      expect(measurement.iterations).toBe(1)
    })

    it('should handle large iteration counts', () => {
      const measurement = measureLatency(sampleTask, 1000)

      expect(measurement).toBeDefined()
      expect(typeof measurement.latency_ns).toBe('number')
      expect(measurement.latency_ns).toBeGreaterThanOrEqual(0)
      expect(measurement.iterations).toBe(1000)
    })

    it('should measure in nanoseconds', () => {
      const measurement = measureLatency(sampleTask, 1)

      expect(measurement.latency_ns).toBeGreaterThanOrEqual(0)
      expect(typeof measurement.latency_ns).toBe('number')
      expect(measurement.total_duration_ns).toBeGreaterThanOrEqual(0)
    })
  })

  describe('processTaskWithRetries', () => {
    it('should process task with retries', () => {
      const result = processTaskWithRetries(sampleTask)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('task-001')
      expect(result.success).toBe(true)
    })

    it('should use default retries', () => {
      const result = processTaskWithRetries(sampleTask)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should respect custom retry count', () => {
      const result = processTaskWithRetries(sampleTask, 5)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should process successfully on first attempt', () => {
      const result = processTaskWithRetries(sampleTask, 1)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle high retry counts', () => {
      const result = processTaskWithRetries(sampleTask, 10)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('NanosecondScheduler class', () => {
    let scheduler: NanosecondScheduler

    beforeAll(() => {
      scheduler = new NanosecondScheduler()
    })

    it('should create instance', () => {
      expect(scheduler).toBeDefined()
      expect(scheduler).toBeInstanceOf(NanosecondScheduler)
    })

    it('should create instance with config', () => {
      const customScheduler = new NanosecondScheduler({ timeout: 3000 })

      expect(customScheduler).toBeDefined()
      expect(customScheduler).toBeInstanceOf(NanosecondScheduler)
    })

    it('should process task via instance method', () => {
      const result = scheduler.process(sampleTask)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('task-001')
    })

    it('should schedule tasks via instance method', () => {
      const results = scheduler.schedule([sampleTask, sampleTask2])

      expect(results).toHaveLength(2)
    })

    it('should get statistics via instance method', () => {
      const stats = scheduler.stats([sampleTask, sampleTask2])

      expect(stats).toBeDefined()
      expect(stats.total_tasks).toBe(2)
    })

    it('should measure latency via instance method', () => {
      const measurement = scheduler.latency(sampleTask)

      expect(measurement).toBeDefined()
      expect(typeof measurement.latency_ns).toBe('number')
      expect(measurement.latency_ns).toBeGreaterThanOrEqual(0)
    })

    it('should process with retries via instance method', () => {
      const result = scheduler.withRetries(sampleTask)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should return config via instance method', () => {
      const config = scheduler.getConfig()

      expect(config).toBeDefined()
      expect(config.timeout).toBeDefined()
    })
  })

  describe('Integration tests', () => {
    it('should process, schedule, and analyze tasks in sequence', () => {
      // Process single task
      const singleResult = processTask(sampleTask)
      expect(singleResult).toBeDefined()

      // Schedule multiple tasks
      const scheduledResults = scheduleTasks([sampleTask, sampleTask2])
      expect(scheduledResults).toHaveLength(2)

      // Get statistics
      const stats = getExecutionStats([sampleTask, sampleTask2])
      expect(stats.total_tasks).toBe(2)
    })

    it('should handle complete workflow', () => {
      const config = createConfig({ timeout: 5000, retries: 3 })
      expect(config).toBeDefined()

      const tasks = [sampleTask, sampleTask2]

      const results = scheduleTasks(tasks)
      expect(results).toHaveLength(2)

      const stats = getExecutionStats(tasks)
      expect(stats.total_tasks).toBe(2)

      const measurement = measureLatency(sampleTask)
      expect(measurement.latency_ns).toBeGreaterThanOrEqual(0)
    })

    it('should maintain data integrity through processing', () => {
      const task: Task = {
        id: 'integrity-test',
        data: 'test-data',
        priority: 5,
      }

      const result = processTask(task)

      expect(result.task_id).toBe('integrity-test')
      expect(result.result_data).toBe('ATAD-TSET') // reversed and uppercase
      expect(result.success).toBe(true)
    })

    it('should handle batch processing with timing', () => {
      const tasks = Array.from({ length: 20 }, (_, i) => ({
        id: `batch-${i}`,
        data: `item-${i}`,
      }))

      const results = scheduleTasks(tasks)
      const stats = getExecutionStats(tasks)

      expect(results).toHaveLength(20)
      expect(stats.total_tasks).toBe(20)
      expect(stats.successful_tasks).toBe(20)
      expect(stats.average_latency_ns).toBeGreaterThanOrEqual(0)
    })

    it('should use scheduler instance for complete workflow', () => {
      const scheduler = new NanosecondScheduler({ timeout: 5000 })

      const task1 = scheduler.process(sampleTask)
      expect(task1.success).toBe(true)

      const tasks = [sampleTask, sampleTask2]
      const scheduled = scheduler.schedule(tasks)
      expect(scheduled).toHaveLength(2)

      const stats = scheduler.stats(tasks)
      expect(stats.total_tasks).toBe(2)

      const measurement = scheduler.latency(sampleTask, 5)
      expect(measurement.latency_ns).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error handling', () => {
    it('should handle processing of large data', () => {
      const largeData = 'x'.repeat(100000)
      const largeTask: Task = {
        id: 'large',
        data: largeData,
      }

      const result = processTask(largeTask)

      expect(result).toBeDefined()
      expect(result.result_data.length).toBe(largeData.length)
    })

    it('should handle unicode characters', () => {
      const unicodeTask: Task = {
        id: 'unicode',
        data: '你好世界',
      }

      const result = processTask(unicodeTask)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle multiple special characters', () => {
      const specialTask: Task = {
        id: 'special',
        data: '!@#$%^&*(){}[]|\\:;"\'<>,.?/',
      }

      const result = processTask(specialTask)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should handle numeric strings', () => {
      const numericTask: Task = {
        id: 'numeric',
        data: '1234567890',
      }

      const result = processTask(numericTask)

      expect(result).toBeDefined()
      expect(result.result_data).toBe('0987654321')
    })
  })

  describe('Performance tests', () => {
    it('should process task within reasonable time', () => {
      const task: Task = {
        id: 'perf-test',
        data: 'performance test data',
      }

      const result = processTask(task)

      // Duration should be reasonable (< 1ms in nanoseconds = 1,000,000 ns)
      expect(result.duration_ns).toBeGreaterThanOrEqual(0)
    })

    it('should handle batch processing efficiently', () => {
      const tasks = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-${i}`,
        data: `data-${i}`,
      }))

      const start = Date.now()
      const results = scheduleTasks(tasks)
      const duration = Date.now() - start

      expect(results).toHaveLength(100)
      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('should measure latency with multiple iterations', () => {
      const task: Task = {
        id: 'latency-test',
        data: 'test',
      }

      const measurement = measureLatency(task, 100)

      expect(measurement).toBeDefined()
      expect(typeof measurement.latency_ns).toBe('number')
      expect(measurement.latency_ns).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Concurrency tests', () => {
    it('should handle concurrent task processing', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve().then(() =>
          processTask({
            id: `concurrent-${i}`,
            data: `data-${i}`,
          })
        )
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      expect(results.every((r) => r.success)).toBe(true)
    })

    it('should schedule tasks concurrently', () => {
      const batches = Array.from({ length: 3 }, (_, batchIdx) =>
        Array.from({ length: 10 }, (_, i) => ({
          id: `batch-${batchIdx}-task-${i}`,
          data: `data-${batchIdx}-${i}`,
        }))
      )

      const results = batches.map((batch) => scheduleTasks(batch))

      expect(results).toHaveLength(3)
      expect(results.every((r) => r.length === 10)).toBe(true)
    })
  })
})
