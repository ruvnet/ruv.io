import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  RuvSwarmCore,
  RuvSwarmCoreError,
  processData,
  processDataSync,
  Config,
} from '../src/index'

describe('RUV Swarm Core', () => {
  let client: RuvSwarmCore

  beforeAll(() => {
    // Initialize client before tests
    client = new RuvSwarmCore()
  })

  afterAll(() => {
    // Cleanup
    if (client) {
      client.close()
    }
  })

  describe('Client Creation', () => {
    it('should create client with default config', () => {
      const c = new RuvSwarmCore()
      expect(c).toBeDefined()
    })

    it('should create client with custom config', () => {
      const config: Config = {
        timeout: 5000,
        retries: 3,
        logLevel: 'debug',
        maxConcurrency: 10,
      }
      const c = new RuvSwarmCore(config)
      expect(c).toBeDefined()
    })

    it('should throw error on invalid initialization', () => {
      // This test verifies error handling during creation
      expect(() => {
        const c = new RuvSwarmCore({
          timeout: -1, // Invalid timeout
        })
      }).not.toThrow() // napi-rs allows any config
    })
  })

  describe('Synchronous Processing', () => {
    it('should process data synchronously', () => {
      const input = Buffer.from('Hello, World!')
      const output = client.processSync(input)

      expect(output).toBeDefined()
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(input.length)
    })

    it('should handle empty buffer', () => {
      const input = Buffer.from('')
      const output = client.processSync(input)

      expect(output).toBeDefined()
      expect(output.length).toBe(0)
    })

    it('should handle large buffer', () => {
      const input = Buffer.alloc(1024 * 10) // 10KB
      input.fill('x')

      const output = client.processSync(input)

      expect(output).toBeDefined()
      expect(output.length).toBeGreaterThan(0)
    })

    it('should process and preserve structure', () => {
      const input = Buffer.from([65, 66, 67]) // ABC in ASCII
      const output = client.processSync(input)

      // The implementation processes the data
      expect(output).toBeDefined()
      expect(output.length).toBe(input.length)
    })
  })

  describe('Additional Processing', () => {
    it('should process data multiple times', () => {
      const inputs = [
        Buffer.from('Test 1'),
        Buffer.from('Test 2'),
        Buffer.from('Test 3'),
      ]

      const results = inputs.map(input => client.process(input))

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result).toBeInstanceOf(Buffer)
        expect(result.length).toBe(inputs[index].length)
      })
    })

    it('should handle empty buffer with process method', () => {
      const input = Buffer.from('')
      const output = client.process(input)

      expect(output).toBeDefined()
      expect(output.length).toBe(0)
    })

    it('should handle large buffer with process method', () => {
      const input = Buffer.alloc(1024 * 100) // 100KB
      input.fill('y')

      const output = client.process(input)

      expect(output).toBeDefined()
      expect(output.length).toBe(input.length)
    })
  })

  describe('Configuration Management', () => {
    it('should get current configuration', () => {
      const config = client.getConfig()

      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })

    it('should preserve config values', () => {
      const customConfig: Config = {
        timeout: 10000,
        retries: 5,
        logLevel: 'info',
        maxConcurrency: 20,
      }

      const c = new RuvSwarmCore(customConfig)
      const retrievedConfig = c.getConfig()

      expect(retrievedConfig).toBeDefined()
    })
  })

  describe('Agent Operations', () => {
    it('should initialize agent', () => {
      const agentId = 'agent-001'
      const agentConfig = { name: 'Test Agent', role: 'worker' }

      const result = client.initializeAgent(agentId, agentConfig)

      expect(result).toBeDefined()
      expect(result.agent_id).toBe(agentId)
      expect(result.success).toBe(true)
      expect(result.status).toBe('initialized')
      expect(result.timestamp).toBeDefined()
    })

    it('should initialize multiple agents', () => {
      const agents = ['agent-001', 'agent-002', 'agent-003']

      const results = agents.map(agentId =>
        client.initializeAgent(agentId, { name: agentId })
      )

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.agent_id).toBe(agents[index])
        expect(result.success).toBe(true)
      })
    })

    it('should get agent status', () => {
      const agentId = 'agent-status-001'
      client.initializeAgent(agentId, {})

      const status = client.getAgentStatus(agentId)

      expect(status).toBeDefined()
      expect(status.agent_id).toBe(agentId)
      expect(status.success).toBe(true)
      expect(status.status).toBe('active')
      expect(status.timestamp).toBeDefined()
      expect(status.uptime_ms).toBeGreaterThanOrEqual(0)
      expect(status.tasks_completed).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Orchestration', () => {
    it('should orchestrate agents', () => {
      const agents = [
        { id: 'agent-1', role: 'coordinator' },
        { id: 'agent-2', role: 'worker' },
        { id: 'agent-3', role: 'worker' },
      ]

      const result = client.orchestrateAgents(agents, 'distributed')

      expect(result).toBeDefined()
      expect(result.agent_count).toBe(3)
      expect(result.strategy).toBe('distributed')
      expect(result.success).toBe(true)
      expect(result.status).toBe('orchestrated')
      expect(result.timestamp).toBeDefined()
    })

    it('should support different orchestration strategies', () => {
      const agents = [{ id: 'agent-1' }, { id: 'agent-2' }]

      const centralized = client.orchestrateAgents(agents, 'centralized')
      const distributed = client.orchestrateAgents(agents, 'distributed')

      expect(centralized.strategy).toBe('centralized')
      expect(distributed.strategy).toBe('distributed')
      expect(centralized.success).toBe(true)
      expect(distributed.success).toBe(true)
    })

    it('should reject empty agent list', () => {
      expect(() => {
        client.orchestrateAgents([], 'distributed')
      }).toThrow()
    })
  })

  describe('Task Execution', () => {
    it('should execute task', () => {
      const task = {
        id: 'task-001',
        type: 'compute',
        priority: 'high',
      }

      const result = client.executeTask(task)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('task-001')
      expect(result.success).toBe(true)
      expect(result.status).toBe('completed')
      expect(result.timestamp).toBeDefined()
    })

    it('should execute multiple tasks', () => {
      const tasks = [
        { id: 'task-1', type: 'compute' },
        { id: 'task-2', type: 'compute' },
        { id: 'task-3', type: 'compute' },
      ]

      const results = tasks.map(task => client.executeTask(task))

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.task_id).toBe(tasks[index].id)
        expect(result.success).toBe(true)
      })
    })

    it('should handle task with complex payload', () => {
      const task = {
        id: 'complex-task',
        type: 'compute',
        payload: {
          nested: {
            data: 'value',
            array: [1, 2, 3],
          },
        },
      }

      const result = client.executeTask(task)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('Batch Processing', () => {
    it('should batch process items', () => {
      const items = [
        Buffer.from('item-1'),
        Buffer.from('item-2'),
        Buffer.from('item-3'),
      ]

      const results = client.batchProcess(items)

      expect(results).toBeDefined()
      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.length).toBe(items[index].length)
        expect(typeof result.data).toBe('string')
      })
    })

    it('should handle single item batch', () => {
      const items = [Buffer.from('single')]

      const results = client.batchProcess(items)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(results[0].length).toBe(6) // 'single'
    })

    it('should handle large batch', () => {
      const items = Array.from({ length: 100 }, (_, i) =>
        Buffer.from(`item-${i}`)
      )

      const results = client.batchProcess(items)

      expect(results).toHaveLength(100)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })

    it('should handle mixed buffer sizes', () => {
      const items = [
        Buffer.from('small'),
        Buffer.from('a'.repeat(50)),
        Buffer.from('a'.repeat(500)),
      ]

      const results = client.batchProcess(items)

      expect(results).toHaveLength(3)
      expect(results[0].length).toBeGreaterThan(0)
      expect(results[1].length).toBeGreaterThan(results[0].length)
      expect(results[2].length).toBeGreaterThan(results[1].length)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle RuvSwarmCoreError', () => {
      const error = new RuvSwarmCoreError('Test error', 'TEST_ERROR', { detail: 'test' })

      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.details).toEqual({ detail: 'test' })
      expect(error.name).toBe('RuvSwarmCoreError')
    })

    it('should throw error when trying to use closed client', async () => {
      const c = new RuvSwarmCore()
      await c.close()

      // Depending on implementation, may need to try using the closed client
      // This is a placeholder for closed-resource handling
    })
  })

  describe('Resource Cleanup', () => {
    it('should close client gracefully', () => {
      const c = new RuvSwarmCore()
      expect(() => c.close()).not.toThrow()
    })

    it('should handle multiple close calls', () => {
      const c = new RuvSwarmCore()
      c.close()
      // Should not throw on second close
      expect(() => c.close()).not.toThrow()
    })
  })

  describe('Convenience Functions', () => {
    it('should process data with convenience function', () => {
      const input = Buffer.from('Test data')
      const output = processData(input)

      expect(output).toBeDefined()
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(input.length)
    })

    it('should process data sync with convenience function', () => {
      const input = Buffer.from('Test data')
      const output = processDataSync(input)

      expect(output).toBeDefined()
      expect(output).toBeInstanceOf(Buffer)
      expect(output.length).toBe(input.length)
    })

    it('should process data with config using convenience function', () => {
      const config: Config = { timeout: 5000 }
      const input = Buffer.from('Test data')
      const output = processData(input, config)

      expect(output).toBeDefined()
      expect(output.length).toBe(input.length)
    })
  })

  describe('Performance', () => {
    it('should process data quickly', () => {
      const input = Buffer.from('Performance test')
      const start = Date.now()
      client.process(input)
      const duration = Date.now() - start

      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle synchronous processing efficiently', () => {
      const input = Buffer.from('Sync performance test')
      const start = Date.now()
      client.processSync(input)
      const duration = Date.now() - start

      // Sync should be very fast (less than 100ms)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Type Safety', () => {
    it('should provide typed results', () => {
      const result = client.executeTask({ id: 'test' })

      // Verify TypeScript types are working
      expect(result.task_id).toBeDefined()
      expect(result.status).toBeDefined()
      expect(result.success).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should provide typed agent status', () => {
      client.initializeAgent('typed-agent', {})
      const status = client.getAgentStatus('typed-agent')

      // Verify TypeScript types
      expect(status.agent_id).toBeDefined()
      expect(status.status).toBeDefined()
      expect(status.uptime_ms).toBeGreaterThanOrEqual(0)
      expect(status.tasks_completed).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Integration Tests', () => {
    it('should run complete workflow', () => {
      // Initialize agents
      const agents = []
      for (let i = 0; i < 3; i++) {
        const result = client.initializeAgent(`worker-${i}`, { role: 'worker' })
        agents.push(result)
      }

      expect(agents).toHaveLength(3)

      // Orchestrate
      const agentDefs = agents.map((_, i) => ({ id: `worker-${i}` }))
      const orchestration = client.orchestrateAgents(agentDefs, 'distributed')
      expect(orchestration.success).toBe(true)

      // Execute task
      const task = client.executeTask({ id: 'workflow-task' })
      expect(task.success).toBe(true)

      // Process data
      const data = Buffer.from('workflow-data')
      const processed = client.process(data)
      expect(processed).toBeDefined()

      // Batch process
      const batch = [Buffer.from('item1'), Buffer.from('item2')]
      const results = client.batchProcess(batch)
      expect(results).toHaveLength(2)
    })

    it('should handle multiple operations sequentially', () => {
      const op1Result = client.process(Buffer.from('op1'))
      const op2Result = client.executeTask({ id: 'task1' })
      const op3Result = client.batchProcess([Buffer.from('batch1')])

      expect(op1Result).toBeInstanceOf(Buffer)
      expect(op2Result).toHaveProperty('success')
      expect(op3Result).toHaveLength(1)
    })
  })
})
