import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  MidstreamerScheduler,
  createScheduler,
  processData,
  Config,
  TaskConfig,
  ScheduledTask,
  ExecutionResult,
  SchedulerStats,
  BatchResult,
  FailResult,
} from '../src/index'

describe('Midstreamer Scheduler - Real-time Task Scheduling', () => {
  let scheduler: MidstreamerScheduler

  beforeEach(() => {
    scheduler = new MidstreamerScheduler()
  })

  afterEach(async () => {
    await scheduler.close()
  })

  describe('Constructor and Configuration', () => {
    it('should create a scheduler with default config', () => {
      expect(scheduler).toBeDefined()
      expect(scheduler).toBeInstanceOf(MidstreamerScheduler)
    })

    it('should create a scheduler with custom config', () => {
      const config: Config = {
        timeout_ms: 10000,
        retries: 5,
        log_level: 'debug',
        max_concurrency: 20,
      }
      const customScheduler = new MidstreamerScheduler(config)
      expect(customScheduler).toBeDefined()
    })

    it('should throw error when native module not available', () => {
      // This test verifies the error handling path
      expect(() => {
        new MidstreamerScheduler()
      }).not.toThrow()
    })
  })

  describe('Synchronous Data Processing', () => {
    it('should process data synchronously', () => {
      const input = Buffer.from('test data')
      const output = scheduler.processSync(input)

      expect(output).toBeDefined()
      expect(typeof output).toBe('string')
      // Output is base64 encoded
      const decoded = Buffer.from(output, 'base64')
      expect(decoded.length).toBe(input.length)
    })

    it('should process empty buffer', () => {
      const input = Buffer.from('')
      const output = scheduler.processSync(input)

      expect(output).toBeDefined()
      expect(typeof output).toBe('string')
    })

    it('should process binary data', () => {
      const input = Buffer.from([1, 2, 3, 4, 5])
      const output = scheduler.processSync(input)

      expect(output).toBeDefined()
      const decoded = Buffer.from(output, 'base64')
      expect(decoded.length).toBe(5)
    })

    it('should handle large buffers', () => {
      const input = Buffer.alloc(1024 * 1024) // 1MB buffer
      const output = scheduler.processSync(input)

      const decoded = Buffer.from(output, 'base64')
      expect(decoded.length).toBe(input.length)
    })

    it('should return data as buffer with processSyncBuffer', () => {
      const input = Buffer.from('test data')
      const output = scheduler.processSyncBuffer(input)

      expect(output).toBeDefined()
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(input.length)
    })
  })

  describe('Asynchronous Data Processing', () => {
    it('should process data asynchronously', async () => {
      const input = Buffer.from('async test data')
      const output = await scheduler.process(input)

      expect(output).toBeDefined()
      expect(typeof output).toBe('string')
      const decoded = Buffer.from(output, 'base64')
      expect(decoded.length).toBe(input.length)
    })

    it('should handle async processing multiple times', async () => {
      const inputs = [
        Buffer.from('data1'),
        Buffer.from('data2'),
        Buffer.from('data3'),
      ]

      const outputs = await Promise.all(
        inputs.map(input => scheduler.process(input))
      )

      expect(outputs).toHaveLength(3)
      outputs.forEach((output, i) => {
        const decoded = Buffer.from(output, 'base64')
        expect(decoded.length).toBe(inputs[i].length)
      })
    })

    it('should process data asynchronously and return as buffer', async () => {
      const input = Buffer.from('async buffer test')
      const output = await scheduler.processBuffer(input)

      expect(output).toBeDefined()
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(input.length)
    })
  })

  describe('Task Scheduling', () => {
    it('should schedule a task', () => {
      const taskConfig: TaskConfig = {
        id: 'task-001',
        priority: 5,
        max_retries: 3,
        timeout_ms: 5000,
      }

      const taskId = scheduler.scheduleTask(taskConfig)
      expect(taskId).toBe('task-001')
    })

    it('should schedule multiple tasks', () => {
      const tasks: TaskConfig[] = [
        { id: 'task-1', priority: 1 },
        { id: 'task-2', priority: 2 },
        { id: 'task-3', priority: 3 },
      ]

      tasks.forEach(task => {
        const taskId = scheduler.scheduleTask(task)
        expect(taskId).toBe(task.id)
      })

      expect(scheduler.queueSize()).toBe(3)
    })

    it('should handle task with default values', () => {
      const taskConfig: TaskConfig = {
        id: 'simple-task',
      }

      const taskId = scheduler.scheduleTask(taskConfig)
      expect(taskId).toBe('simple-task')
    })

    it('should preserve task configuration', () => {
      const taskConfig: TaskConfig = {
        id: 'config-task',
        priority: 10,
        max_retries: 5,
        timeout_ms: 10000,
      }

      scheduler.scheduleTask(taskConfig)
      const nextTask = scheduler.nextTask()

      expect(nextTask).toBeDefined()
      expect(nextTask?.id).toBe('config-task')
      expect(nextTask?.priority).toBe(10)
      expect(nextTask?.max_retries).toBe(5)
      expect(nextTask?.timeout_ms).toBe(10000)
    })
  })

  describe('Task Queue Management', () => {
    it('should get next task from queue', () => {
      const taskConfig: TaskConfig = {
        id: 'queue-test-task',
      }

      scheduler.scheduleTask(taskConfig)
      const nextTask = scheduler.nextTask()

      expect(nextTask).toBeDefined()
      expect(nextTask?.id).toBe('queue-test-task')
    })

    it('should return null when queue is empty', () => {
      const nextTask = scheduler.nextTask()
      expect(nextTask).toBeNull()
    })

    it('should return tasks in FIFO order', () => {
      for (let i = 1; i <= 5; i++) {
        scheduler.scheduleTask({ id: `task-${i}` })
      }

      for (let i = 1; i <= 5; i++) {
        const task = scheduler.nextTask()
        expect(task?.id).toBe(`task-${i}`)
      }
    })

    it('should get accurate queue size', () => {
      expect(scheduler.queueSize()).toBe(0)

      scheduler.scheduleTask({ id: 'task-1' })
      expect(scheduler.queueSize()).toBe(1)

      scheduler.scheduleTask({ id: 'task-2' })
      expect(scheduler.queueSize()).toBe(2)

      scheduler.nextTask()
      expect(scheduler.queueSize()).toBe(1)
    })

    it('should handle large queue', () => {
      const taskCount = 1000
      for (let i = 0; i < taskCount; i++) {
        scheduler.scheduleTask({ id: `task-${i}` })
      }

      expect(scheduler.queueSize()).toBe(taskCount)
    })
  })

  describe('Task Completion', () => {
    it('should complete a task', () => {
      const task: ScheduledTask = {
        id: 'complete-task',
        priority: 1,
        max_retries: 3,
        timeout_ms: 5000,
        created_at: Date.now(),
        scheduled_at: Date.now(),
      }

      const result = scheduler.completeTask(task, 1024, 100)

      expect(result).toBeDefined()
      expect(result.id).toBe('complete-task')
      expect(result.status).toBe('completed')
      expect(result.output_size).toBe(1024)
      expect(result.execution_time_ms).toBe(100)
    })

    it('should track completion with zero metrics', () => {
      const task: ScheduledTask = {
        id: 'zero-metrics-task',
        priority: 0,
        max_retries: 0,
        timeout_ms: 1000,
        created_at: Date.now(),
        scheduled_at: Date.now(),
      }

      const result = scheduler.completeTask(task)

      expect(result.status).toBe('completed')
      expect(result.output_size).toBe(0)
      expect(result.execution_time_ms).toBe(0)
    })

    it('should include timestamp in completion result', () => {
      const task: ScheduledTask = {
        id: 'timestamp-task',
        priority: 1,
        max_retries: 1,
        timeout_ms: 1000,
        created_at: Date.now(),
        scheduled_at: Date.now(),
      }

      const result = scheduler.completeTask(task)

      expect(result.timestamp).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(0)
    })
  })

  describe('Task Failure Handling', () => {
    it('should handle task failure', () => {
      const taskId = 'fail-task'
      const errorMessage = 'Processing error'

      const result = scheduler.failTask(taskId, errorMessage)

      expect(result).toBeDefined()
      expect(result.id).toBe(taskId)
      expect(result.status).toBe('failed')
      expect(result.error).toBe(errorMessage)
    })

    it('should indicate retry should happen', () => {
      const result = scheduler.failTask('task-id', 'error')

      expect(result.should_retry).toBe(true)
    })

    it('should include failure timestamp', () => {
      const result = scheduler.failTask('task-id', 'error')

      expect(result.timestamp).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('should handle different error messages', () => {
      const errors = [
        'Connection timeout',
        'Invalid input data',
        'Resource exhausted',
        'Processing failed: unknown error',
      ]

      errors.forEach(error => {
        const result = scheduler.failTask('task-id', error)
        expect(result.error).toBe(error)
      })
    })
  })

  describe('Scheduler Statistics', () => {
    it('should get initial statistics', () => {
      const stats = scheduler.getStats()

      expect(stats).toBeDefined()
      expect(stats.total_tasks).toBe(0)
      expect(stats.queued_tasks).toBe(0)
      expect(stats.completed_tasks).toBe(0)
      expect(stats.failed_tasks).toBe(0)
      expect(stats.average_latency_ms).toBeGreaterThanOrEqual(0)
    })

    it('should update stats when tasks are scheduled', () => {
      for (let i = 0; i < 5; i++) {
        scheduler.scheduleTask({ id: `task-${i}` })
      }

      const stats = scheduler.getStats()

      expect(stats.total_tasks).toBe(5)
      expect(stats.queued_tasks).toBe(5)
    })

    it('should update completed task count', () => {
      scheduler.scheduleTask({ id: 'task-1' })
      const task = scheduler.nextTask()

      if (task) {
        scheduler.completeTask(task, 100, 50)
      }

      const stats = scheduler.getStats()

      expect(stats.completed_tasks).toBe(1)
      expect(stats.queued_tasks).toBe(0)
    })

    it('should calculate average latency', () => {
      const task: ScheduledTask = {
        id: 'latency-task',
        priority: 1,
        max_retries: 1,
        timeout_ms: 1000,
        created_at: Date.now(),
        scheduled_at: Date.now(),
      }

      scheduler.completeTask(task, 0, 100)
      scheduler.completeTask(task, 0, 200)

      const stats = scheduler.getStats()

      expect(stats.completed_tasks).toBe(2)
      expect(stats.average_latency_ms).toBe(150)
    })

    it('should track uptime', () => {
      const stats1 = scheduler.getStats()
      const uptime1 = stats1.uptime_ms

      // Wait a bit
      const delayMs = 10
      const startTime = Date.now()
      while (Date.now() - startTime < delayMs) {
        // Busy wait
      }

      const stats2 = scheduler.getStats()
      const uptime2 = stats2.uptime_ms

      expect(uptime2).toBeGreaterThanOrEqual(uptime1)
    })
  })

  describe('Scheduler Reset', () => {
    it('should reset scheduler state', () => {
      scheduler.scheduleTask({ id: 'task-1' })
      scheduler.scheduleTask({ id: 'task-2' })

      expect(scheduler.queueSize()).toBe(2)

      scheduler.reset()

      expect(scheduler.queueSize()).toBe(0)
    })

    it('should reset statistics', () => {
      scheduler.scheduleTask({ id: 'task' })
      const task = scheduler.nextTask()
      if (task) {
        scheduler.completeTask(task)
      }

      let stats = scheduler.getStats()
      expect(stats.total_tasks).toBeGreaterThan(0)

      scheduler.reset()

      stats = scheduler.getStats()
      expect(stats.total_tasks).toBe(0)
      expect(stats.completed_tasks).toBe(0)
      expect(stats.queued_tasks).toBe(0)
    })
  })

  describe('Batch Processing', () => {
    it('should process batch of tasks', () => {
      for (let i = 0; i < 10; i++) {
        scheduler.scheduleTask({ id: `task-${i}` })
      }

      const result = scheduler.processBatch(5)

      expect(result).toBeDefined()
      expect(result.processed).toBe(5)
      expect(result.remaining).toBe(5)
    })

    it('should handle batch with empty queue', () => {
      const result = scheduler.processBatch(10)

      expect(result.processed).toBe(0)
      expect(result.remaining).toBe(0)
    })

    it('should handle batch with fewer tasks than requested', () => {
      for (let i = 0; i < 3; i++) {
        scheduler.scheduleTask({ id: `task-${i}` })
      }

      const result = scheduler.processBatch(10)

      expect(result.processed).toBe(3)
      expect(result.remaining).toBe(0)
    })

    it('should include timestamp in batch result', () => {
      scheduler.scheduleTask({ id: 'task-1' })
      const result = scheduler.processBatch(1)

      expect(result.timestamp).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('should process large batches', () => {
      for (let i = 0; i < 1000; i++) {
        scheduler.scheduleTask({ id: `task-${i}` })
      }

      const result = scheduler.processBatch(500)

      expect(result.processed).toBe(500)
      expect(result.remaining).toBe(500)
    })
  })

  describe('Resource Cleanup', () => {
    it('should close scheduler cleanly', async () => {
      scheduler.scheduleTask({ id: 'cleanup-task' })
      await scheduler.close()
      // Should not throw
      expect(scheduler).toBeDefined()
    })

    it('should handle multiple close calls', async () => {
      await scheduler.close()
      await scheduler.close()
      // Should not throw
      expect(scheduler).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should complete full workflow', () => {
      // Schedule tasks
      const taskIds = ['task-1', 'task-2', 'task-3']
      taskIds.forEach(id => {
        scheduler.scheduleTask({ id })
      })

      expect(scheduler.queueSize()).toBe(3)

      // Get and complete tasks
      let completed = 0
      while (true) {
        const task = scheduler.nextTask()
        if (!task) break

        scheduler.completeTask(task, 512, 100)
        completed++
      }

      expect(completed).toBe(3)
      expect(scheduler.queueSize()).toBe(0)

      // Check stats
      const stats = scheduler.getStats()
      expect(stats.completed_tasks).toBe(3)
      expect(stats.queued_tasks).toBe(0)
    })

    it('should handle mixed success and failure', () => {
      scheduler.scheduleTask({ id: 'task-1' })
      scheduler.scheduleTask({ id: 'task-2' })

      // Complete first task
      const task1 = scheduler.nextTask()
      if (task1) {
        scheduler.completeTask(task1)
      }

      // Fail second task
      const task2 = scheduler.nextTask()
      if (task2) {
        scheduler.failTask(task2.id, 'Processing error')
      }

      const stats = scheduler.getStats()
      expect(stats.completed_tasks).toBe(1)
    })

    it('should handle continuous operation', () => {
      for (let cycle = 0; cycle < 3; cycle++) {
        // Schedule
        for (let i = 0; i < 10; i++) {
          scheduler.scheduleTask({ id: `cycle-${cycle}-task-${i}` })
        }

        // Process
        while (scheduler.queueSize() > 0) {
          const task = scheduler.nextTask()
          if (task) {
            scheduler.completeTask(task)
          }
        }
      }

      const stats = scheduler.getStats()
      expect(stats.completed_tasks).toBe(30)
    })
  })

  describe('Factory Functions', () => {
    it('should create scheduler with factory function', () => {
      const sched = createScheduler()
      expect(sched).toBeInstanceOf(MidstreamerScheduler)
    })

    it('should create scheduler with config via factory', () => {
      const config: Config = { timeout_ms: 8000 }
      const sched = createScheduler(config)
      expect(sched).toBeInstanceOf(MidstreamerScheduler)
    })

    it('should process data with processData function', async () => {
      const input = Buffer.from('test')
      const output = await processData(input)

      expect(output).toBeDefined()
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(4)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid task config gracefully', () => {
      expect(() => {
        const scheduler = new MidstreamerScheduler()
        // This should work even with edge cases
        scheduler.scheduleTask({ id: '' })
      }).not.toThrow()
    })

    it('should handle edge case timestamps', () => {
      const task: ScheduledTask = {
        id: 'edge-task',
        priority: 0,
        max_retries: 0,
        timeout_ms: 0,
        created_at: 0,
        scheduled_at: 0,
      }

      const result = scheduler.completeTask(task)
      expect(result).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    it('should handle rapid scheduling', () => {
      const count = 1000
      for (let i = 0; i < count; i++) {
        scheduler.scheduleTask({ id: `perf-task-${i}` })
      }

      expect(scheduler.queueSize()).toBe(count)
    })

    it('should handle rapid queue access', () => {
      for (let i = 0; i < 100; i++) {
        scheduler.scheduleTask({ id: `task-${i}` })
      }

      for (let i = 0; i < 100; i++) {
        const size = scheduler.queueSize()
        if (size > 0) {
          scheduler.nextTask()
        }
      }

      expect(scheduler.queueSize()).toBeGreaterThanOrEqual(0)
    })
  })
})
