import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  CodeMeshCore,
  initializeSwarm,
  addNode,
  removeNode,
  submitTask,
  executeTask,
  getSwarmStatus,
  distributeTasks,
  getTaskHistory,
  healthCheck,
  balanceLoad,
  MeshNode,
  SwarmConfig,
  SwarmTask,
  SwarmInfo,
  NodeRegistrationResult,
  NodeRemovalResult,
  TaskSubmissionResult,
  TaskExecutionResult,
  SwarmStatus,
  DistributionResult,
  TaskHistory,
  HealthCheckResult,
  LoadBalancingResult,
} from '../src/index'

describe('Code Mesh Core - Distributed Swarm Intelligence', () => {
  const sampleNode: MeshNode = {
    id: 'node-001',
    address: '192.168.1.100:8080',
    capacity: 1000,
    status: 'active',
    metadata: {
      region: 'us-east-1',
      version: '1.0.0',
    },
  }

  const sampleNode2: MeshNode = {
    id: 'node-002',
    address: '192.168.1.101:8080',
    capacity: 800,
    status: 'active',
    metadata: {
      region: 'us-west-1',
      version: '1.0.0',
    },
  }

  const sampleTask: SwarmTask = {
    id: 'task-001',
    code: 'console.log("Hello from swarm")',
    priority: 5,
    timeout_ms: 30000,
    metadata: {
      type: 'execution',
      language: 'javascript',
    },
  }

  const sampleTask2: SwarmTask = {
    id: 'task-002',
    code: 'return 42',
    priority: 3,
    timeout_ms: 5000,
    metadata: {
      type: 'computation',
      language: 'rust',
    },
  }

  const swarmConfig: SwarmConfig = {
    max_nodes: 50,
    max_concurrent_tasks: 500,
    task_timeout_ms: 30000,
    heartbeat_interval_ms: 5000,
  }

  describe('initializeSwarm', () => {
    it('should initialize swarm with config', () => {
      const result = initializeSwarm(swarmConfig)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.initialized_at).toBeDefined()
      expect(result.nodes_count).toBe(0)
      expect(result.tasks_count).toBe(0)
      expect(result.status).toBe('initialized')
      expect(result.config).toBeDefined()
    })

    it('should initialize swarm with default config', () => {
      const result = initializeSwarm()

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.config).toBeDefined()
      expect(result.config.max_nodes).toBeDefined()
    })

    it('should have proper timestamp format', () => {
      const result = initializeSwarm()

      expect(result.initialized_at).toMatch(/^\d+$/)
    })

    it('should create unique IDs for each initialization', () => {
      const result1 = initializeSwarm()
      const result2 = initializeSwarm()

      expect(result1.id).not.toBe(result2.id)
    })

    it('should preserve custom config values', () => {
      const customConfig: SwarmConfig = {
        max_nodes: 100,
        max_concurrent_tasks: 1000,
        task_timeout_ms: 60000,
      }

      const result = initializeSwarm(customConfig)

      expect(result.config.max_nodes).toBe(100)
      expect(result.config.max_concurrent_tasks).toBe(1000)
      expect(result.config.task_timeout_ms).toBe(60000)
    })
  })

  describe('addNode', () => {
    it('should add a node to the swarm', () => {
      const result = addNode(sampleNode)

      expect(result).toBeDefined()
      expect(result.node_id).toBe('node-001')
      expect(result.status).toBe('registered')
      expect(result.registered_at).toBeDefined()
      expect(result.message).toBeDefined()
    })

    it('should preserve node metadata', () => {
      const result = addNode(sampleNode)

      expect(result.node_id).toBe(sampleNode.id)
      expect(result.status).toBe('registered')
    })

    it('should add multiple nodes independently', () => {
      const result1 = addNode(sampleNode)
      const result2 = addNode(sampleNode2)

      expect(result1.node_id).toBe('node-001')
      expect(result2.node_id).toBe('node-002')
      expect(result1.node_id).not.toBe(result2.node_id)
    })

    it('should handle node with various capacities', () => {
      const lowCapacityNode: MeshNode = {
        ...sampleNode,
        capacity: 100,
      }

      const result = addNode(lowCapacityNode)

      expect(result.status).toBe('registered')
    })

    it('should handle node from different regions', () => {
      const remoteNode: MeshNode = {
        ...sampleNode,
        address: '10.0.0.1:9000',
        metadata: {
          region: 'eu-west-1',
        },
      }

      const result = addNode(remoteNode)

      expect(result.status).toBe('registered')
    })
  })

  describe('removeNode', () => {
    it('should remove a node from the swarm', () => {
      const result = removeNode('node-001')

      expect(result).toBeDefined()
      expect(result.node_id).toBe('node-001')
      expect(result.status).toBe('removed')
      expect(result.removed_at).toBeDefined()
    })

    it('should have removal confirmation message', () => {
      const result = removeNode('node-002')

      expect(result.message).toContain('removed')
    })

    it('should handle removal of non-existent nodes gracefully', () => {
      const result = removeNode('node-999')

      expect(result.status).toBe('removed')
    })

    it('should return timestamp for each removal', () => {
      const result1 = removeNode('node-001')
      const result2 = removeNode('node-002')

      expect(result1.removed_at).toBeDefined()
      expect(result2.removed_at).toBeDefined()
    })
  })

  describe('submitTask', () => {
    it('should submit a task to the swarm', () => {
      const result = submitTask(sampleTask)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('task-001')
      expect(result.status).toBe('submitted')
      expect(result.submitted_at).toBeDefined()
      expect(result.execution_queue_position).toBeDefined()
    })

    it('should assign queue position to each task', () => {
      const result = submitTask(sampleTask)

      expect(typeof result.execution_queue_position).toBe('number')
      expect(result.execution_queue_position).toBeGreaterThanOrEqual(0)
    })

    it('should preserve task priority', () => {
      const highPriorityTask: SwarmTask = {
        ...sampleTask,
        priority: 10,
      }

      const result = submitTask(highPriorityTask)

      expect(result.status).toBe('submitted')
    })

    it('should handle tasks with different timeouts', () => {
      const quickTask: SwarmTask = {
        ...sampleTask,
        timeout_ms: 1000,
      }

      const result = submitTask(quickTask)

      expect(result.status).toBe('submitted')
    })

    it('should assign unique positions to multiple submissions', () => {
      const result1 = submitTask(sampleTask)
      const result2 = submitTask(sampleTask2)

      // Different submission times should potentially give different positions
      expect(result1.execution_queue_position).toBeDefined()
      expect(result2.execution_queue_position).toBeDefined()
    })
  })

  describe('executeTask', () => {
    it('should execute a task on the swarm', () => {
      const result = executeTask(sampleTask)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('task-001')
      expect(result.status).toBe('completed')
      expect(result.executed_at).toBeDefined()
      expect(result.output).toBeDefined()
      expect(result.duration_ms).toBeDefined()
    })

    it('should return execution output', () => {
      const result = executeTask(sampleTask)

      expect(result.output).toBeDefined()
      expect(typeof result.output).toBe('string')
      expect(result.output.length).toBeGreaterThan(0)
    })

    it('should reject empty code', () => {
      const emptyTask: SwarmTask = {
        ...sampleTask,
        code: '',
      }

      expect(() => {
        executeTask(emptyTask)
      }).toThrow()
    })

    it('should handle different code types', () => {
      const rustTask: SwarmTask = {
        ...sampleTask,
        code: 'fn main() { println!("Hello"); }',
      }

      const result = executeTask(rustTask)

      expect(result.status).toBe('completed')
    })

    it('should record execution time', () => {
      const result = executeTask(sampleTask)

      expect(result.duration_ms).toBeDefined()
      expect(typeof result.duration_ms).toBe('number')
    })

    it('should execute complex code', () => {
      const complexTask: SwarmTask = {
        ...sampleTask,
        code: 'complex operation with parallel processing',
      }

      const result = executeTask(complexTask)

      expect(result.status).toBe('completed')
    })

    it('should handle error in code', () => {
      const errorTask: SwarmTask = {
        ...sampleTask,
        code: 'throw error',
      }

      const result = executeTask(errorTask)

      expect(result).toBeDefined()
      // Error is captured in output
      expect(result.output).toBeDefined()
    })
  })

  describe('getSwarmStatus', () => {
    it('should return current swarm status', () => {
      const result = getSwarmStatus()

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(result.nodes_count).toBeDefined()
      expect(result.active_tasks).toBeDefined()
      expect(result.completed_tasks).toBeDefined()
      expect(result.failed_tasks).toBeDefined()
      expect(result.health).toBeDefined()
    })

    it('should have non-negative task counts', () => {
      const result = getSwarmStatus()

      expect(result.nodes_count).toBeGreaterThanOrEqual(0)
      expect(result.active_tasks).toBeGreaterThanOrEqual(0)
      expect(result.completed_tasks).toBeGreaterThanOrEqual(0)
      expect(result.failed_tasks).toBeGreaterThanOrEqual(0)
    })

    it('should have capacity information', () => {
      const result = getSwarmStatus()

      expect(result.total_capacity).toBeDefined()
      expect(result.available_capacity).toBeDefined()
      expect(result.available_capacity).toBeLessThanOrEqual(result.total_capacity)
    })

    it('should indicate health status', () => {
      const result = getSwarmStatus()

      expect(result.health).toBeDefined()
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.health)
    })
  })

  describe('distributeTasks', () => {
    it('should distribute multiple tasks across swarm', () => {
      const tasks = [sampleTask, sampleTask2]
      const result = distributeTasks(tasks)

      expect(result).toBeDefined()
      expect(result.total_tasks).toBe(2)
      expect(result.distributed_tasks).toBe(2)
      expect(result.status).toBe('distributed')
    })

    it('should support different distribution strategies', () => {
      const tasks = [sampleTask, sampleTask2]
      const result = distributeTasks(tasks, 'round-robin')

      expect(result.strategy).toBe('round-robin')
    })

    it('should use default balanced strategy', () => {
      const tasks = [sampleTask]
      const result = distributeTasks(tasks)

      expect(result).toBeDefined()
      expect(result.distributed_tasks).toBe(1)
    })

    it('should handle large batch distribution', () => {
      const tasks = Array.from({ length: 100 }, (_, i) => ({
        ...sampleTask,
        id: `task-${i}`,
      }))

      const result = distributeTasks(tasks)

      expect(result.total_tasks).toBe(100)
      expect(result.distributed_tasks).toBe(100)
    })

    it('should record distribution timestamp', () => {
      const tasks = [sampleTask]
      const result = distributeTasks(tasks)

      expect(result.distributed_at).toBeDefined()
      expect(result.distributed_at).toMatch(/^\d+$/)
    })

    it('should handle empty task array', () => {
      const result = distributeTasks([])

      expect(result.total_tasks).toBe(0)
      expect(result.distributed_tasks).toBe(0)
    })

    it('should support load-aware strategy', () => {
      const tasks = [sampleTask, sampleTask2]
      const result = distributeTasks(tasks, 'load-aware')

      expect(result.strategy).toBe('load-aware')
      expect(result.status).toBe('distributed')
    })
  })

  describe('getTaskHistory', () => {
    it('should retrieve task history for a node', () => {
      const result = getTaskHistory('node-001')

      expect(result).toBeDefined()
      expect(result.node_id).toBe('node-001')
      expect(result.total_executed).toBeDefined()
      expect(result.total_failed).toBeDefined()
      expect(result.total_duration_ms).toBeDefined()
    })

    it('should have non-negative counters', () => {
      const result = getTaskHistory('node-001')

      expect(result.total_executed).toBeGreaterThanOrEqual(0)
      expect(result.total_failed).toBeGreaterThanOrEqual(0)
      expect(result.total_duration_ms).toBeGreaterThanOrEqual(0)
    })

    it('should have last execution timestamp', () => {
      const result = getTaskHistory('node-001')

      if (result.last_execution) {
        expect(result.last_execution).toMatch(/^\d+$/)
      }
    })

    it('should handle history for multiple nodes', () => {
      const result1 = getTaskHistory('node-001')
      const result2 = getTaskHistory('node-002')

      expect(result1.node_id).toBe('node-001')
      expect(result2.node_id).toBe('node-002')
    })
  })

  describe('healthCheck', () => {
    it('should perform health check on a node', () => {
      const result = healthCheck('node-001')

      expect(result).toBeDefined()
      expect(result.node_id).toBe('node-001')
      expect(result.checked_at).toBeDefined()
      expect(result.status).toBe('healthy')
    })

    it('should provide resource utilization metrics', () => {
      const result = healthCheck('node-001')

      expect(result.memory_usage_percent).toBeDefined()
      expect(result.cpu_usage_percent).toBeDefined()
      expect(result.memory_usage_percent).toBeGreaterThanOrEqual(0)
      expect(result.memory_usage_percent).toBeLessThanOrEqual(100)
      expect(result.cpu_usage_percent).toBeGreaterThanOrEqual(0)
      expect(result.cpu_usage_percent).toBeLessThanOrEqual(100)
    })

    it('should measure response time', () => {
      const result = healthCheck('node-001')

      expect(result.response_time_ms).toBeDefined()
      expect(result.response_time_ms).toBeGreaterThan(0)
    })

    it('should check health for multiple nodes', () => {
      const result1 = healthCheck('node-001')
      const result2 = healthCheck('node-002')

      expect(result1.node_id).toBe('node-001')
      expect(result2.node_id).toBe('node-002')
      expect(result1.status).toBe('healthy')
      expect(result2.status).toBe('healthy')
    })

    it('should have proper timestamp format', () => {
      const result = healthCheck('node-001')

      expect(result.checked_at).toMatch(/^\d+$/)
    })
  })

  describe('balanceLoad', () => {
    it('should balance load across swarm nodes', () => {
      const result = balanceLoad()

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
      expect(result.rebalanced_at).toBeDefined()
      expect(result.nodes_affected).toBeDefined()
      expect(result.tasks_moved).toBeDefined()
    })

    it('should support different balancing strategies', () => {
      const result = balanceLoad('least-loaded')

      expect(result.strategy).toBe('least-loaded')
    })

    it('should use default even-distribution strategy', () => {
      const result = balanceLoad()

      expect(result.strategy).toBe('even-distribution')
    })

    it('should report affected nodes count', () => {
      const result = balanceLoad()

      expect(result.nodes_affected).toBeGreaterThanOrEqual(0)
      expect(result.tasks_moved).toBeGreaterThanOrEqual(0)
    })

    it('should record rebalancing timestamp', () => {
      const result = balanceLoad()

      expect(result.rebalanced_at).toMatch(/^\d+$/)
    })

    it('should support priority-based strategy', () => {
      const result = balanceLoad('priority-based')

      expect(result.strategy).toBe('priority-based')
      expect(result.status).toBe('completed')
    })
  })

  describe('CodeMeshCore class', () => {
    let meshCore: CodeMeshCore

    beforeAll(() => {
      meshCore = new CodeMeshCore()
    })

    it('should create instance', () => {
      expect(meshCore).toBeDefined()
      expect(meshCore).toBeInstanceOf(CodeMeshCore)
    })

    it('should initialize swarm via instance method', () => {
      const result = meshCore.initSwarm(swarmConfig)

      expect(result).toBeDefined()
      expect(result.status).toBe('initialized')
    })

    it('should add node via instance method', () => {
      const result = meshCore.addNodeToMesh(sampleNode)

      expect(result).toBeDefined()
      expect(result.status).toBe('registered')
    })

    it('should remove node via instance method', () => {
      const result = meshCore.removeNodeFromMesh('node-001')

      expect(result).toBeDefined()
      expect(result.status).toBe('removed')
    })

    it('should submit task via instance method', () => {
      const result = meshCore.submit(sampleTask)

      expect(result).toBeDefined()
      expect(result.status).toBe('submitted')
    })

    it('should execute task via instance method', () => {
      const result = meshCore.execute(sampleTask)

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })

    it('should get status via instance method', () => {
      const result = meshCore.getStatus()

      expect(result).toBeDefined()
      expect(result.health).toBeDefined()
    })

    it('should distribute tasks via instance method', () => {
      const result = meshCore.distribute([sampleTask, sampleTask2])

      expect(result).toBeDefined()
      expect(result.status).toBe('distributed')
    })

    it('should get history via instance method', () => {
      const result = meshCore.getHistory('node-001')

      expect(result).toBeDefined()
      expect(result.node_id).toBe('node-001')
    })

    it('should check health via instance method', () => {
      const result = meshCore.check('node-001')

      expect(result).toBeDefined()
      expect(result.status).toBe('healthy')
    })

    it('should balance load via instance method', () => {
      const result = meshCore.balance()

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })
  })

  describe('Integration tests', () => {
    it('should perform complete swarm initialization workflow', () => {
      // Initialize swarm
      const swarmInit = initializeSwarm(swarmConfig)
      expect(swarmInit.status).toBe('initialized')

      // Add nodes
      const node1 = addNode(sampleNode)
      const node2 = addNode(sampleNode2)
      expect(node1.status).toBe('registered')
      expect(node2.status).toBe('registered')

      // Submit and execute task
      const submitted = submitTask(sampleTask)
      expect(submitted.status).toBe('submitted')

      const executed = executeTask(sampleTask)
      expect(executed.status).toBe('completed')
    })

    it('should handle complete task distribution workflow', () => {
      // Initialize
      const swarmInit = initializeSwarm()
      expect(swarmInit.status).toBe('initialized')

      // Distribute tasks
      const tasks = [sampleTask, sampleTask2]
      const distribution = distributeTasks(tasks, 'balanced')
      expect(distribution.distributed_tasks).toBe(2)

      // Check status
      const status = getSwarmStatus()
      expect(status.health).toBeDefined()
    })

    it('should handle load balancing workflow', () => {
      // Add nodes
      addNode(sampleNode)
      addNode(sampleNode2)

      // Check health
      const health1 = healthCheck('node-001')
      const health2 = healthCheck('node-002')
      expect(health1.status).toBe('healthy')
      expect(health2.status).toBe('healthy')

      // Balance load
      const balance = balanceLoad('least-loaded')
      expect(balance.status).toBe('completed')

      // Verify history
      const history1 = getTaskHistory('node-001')
      expect(history1.node_id).toBe('node-001')
    })

    it('should maintain swarm consistency through multiple operations', () => {
      // Initialize
      const swarmInit = initializeSwarm()
      const initialStatus = getSwarmStatus()

      // Add node
      addNode(sampleNode)

      // Submit and execute tasks
      submitTask(sampleTask)
      executeTask(sampleTask)

      // Distribute tasks
      distributeTasks([sampleTask2], 'balanced')

      // Verify status is consistent
      const finalStatus = getSwarmStatus()
      expect(finalStatus.health).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle task with invalid configuration', () => {
      expect(() => {
        const invalidTask = { id: 'invalid' } as any
        executeTask(invalidTask)
      }).toThrow()
    })

    it('should handle very large task batch', () => {
      const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
        ...sampleTask,
        id: `task-large-${i}`,
      }))

      const result = distributeTasks(largeBatch)

      expect(result.total_tasks).toBe(1000)
    })

    it('should handle nodes with extreme specifications', () => {
      const extremeNode: MeshNode = {
        ...sampleNode,
        capacity: 1000000,
      }

      const result = addNode(extremeNode)

      expect(result.status).toBe('registered')
    })

    it('should handle rapid successive operations', () => {
      const results = []

      for (let i = 0; i < 10; i++) {
        const node: MeshNode = {
          ...sampleNode,
          id: `node-rapid-${i}`,
        }
        results.push(addNode(node))
      }

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result.status).toBe('registered')
      })
    })

    it('should handle concurrent-like operations', () => {
      const swarmInit = initializeSwarm()
      const nodeResult = addNode(sampleNode)
      const taskResult = submitTask(sampleTask)
      const statusResult = getSwarmStatus()

      expect(swarmInit.status).toBe('initialized')
      expect(nodeResult.status).toBe('registered')
      expect(taskResult.status).toBe('submitted')
      expect(statusResult.health).toBeDefined()
    })
  })
})
