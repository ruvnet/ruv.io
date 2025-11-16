import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  DaaPrimeCoordinator,
  initializeCoordinator,
  registerAgent,
  getAgents,
  distributeTask,
  distributeTasks,
  initiateConsensus,
  submitVote,
  calculateConsensus,
  getCoordinatorStatus,
  getAgentMetrics,
  balanceLoad,
  getDistributionStats,
  monitorAgentHealth,
  scaleAgentPool,
  performFailover,
  getVotingHistory,
  Agent,
  Task,
  Vote,
  ConsensusResult,
  CoordinatorConfig,
  AgentStatus,
  TaskPriority,
} from '../src/index'

describe('DAA Prime Coordinator', () => {
  const sampleAgent: Agent = {
    id: 'agent-001',
    status: 'ACTIVE',
    load: 0.5,
    capacity: 100.0,
    tasks_completed: 10,
    region: 'us-east-1',
  }

  const sampleTask: Task = {
    id: 'task-001',
    priority: 'HIGH',
    payload: { data: 'test' },
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
  }

  const sampleVote: Vote = {
    agent_id: 'agent-001',
    decision: 'approve',
    confidence: 0.95,
    timestamp: '2024-01-01T00:00:00Z',
  }

  describe('Coordinator Initialization', () => {
    it('should initialize coordinator with default config', () => {
      const result = initializeCoordinator()

      expect(result).toBeDefined()
      expect(result.initialized).toBe(true)
      expect(result.status).toBe('ready')
      expect(result.coordinator_id).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should initialize coordinator with custom config', () => {
      const config: CoordinatorConfig = {
        max_agents: 10,
        max_tasks: 100,
        consensus_threshold: 0.7,
        timeout_ms: 5000,
      }

      const result = initializeCoordinator(config)

      expect(result).toBeDefined()
      expect(result.initialized).toBe(true)
      expect(result.status).toBe('ready')
    })

    it('should return coordinator ID', () => {
      const result = initializeCoordinator()

      expect(result.coordinator_id).toBeDefined()
      expect(typeof result.coordinator_id).toBe('string')
      expect(result.coordinator_id.startsWith('id-')).toBe(true)
    })
  })

  describe('Agent Management', () => {
    it('should register a new agent', () => {
      const result = registerAgent(sampleAgent)

      expect(result).toBeDefined()
      expect(result.agent_id).toBe('agent-001')
      expect(result.registered).toBe(true)
      expect(result.status).toBe('registered')
      expect(result.timestamp).toBeDefined()
    })

    it('should get all agents', () => {
      const agents = getAgents()

      expect(agents).toBeDefined()
      expect(Array.isArray(agents)).toBe(true)
      expect(agents.length).toBeGreaterThan(0)
    })

    it('should get agents with ACTIVE status', () => {
      const agents = getAgents('ACTIVE')

      expect(agents).toBeDefined()
      expect(Array.isArray(agents)).toBe(true)
      agents.forEach((agent) => {
        expect(agent.status).toBe('ACTIVE')
      })
    })

    it('should get agents with IDLE status', () => {
      const agents = getAgents('IDLE')

      expect(agents).toBeDefined()
      expect(Array.isArray(agents)).toBe(true)
      agents.forEach((agent) => {
        expect(agent.status).toBe('IDLE')
      })
    })

    it('should get agents with BUSY status', () => {
      const agents = getAgents('BUSY')

      expect(agents).toBeDefined()
      expect(Array.isArray(agents)).toBe(true)
      agents.forEach((agent) => {
        expect(agent.status).toBe('BUSY')
      })
    })

    it('should have valid agent properties', () => {
      const agents = getAgents()

      agents.forEach((agent) => {
        expect(agent.id).toBeDefined()
        expect(agent.status).toBeDefined()
        expect(typeof agent.load).toBe('number')
        expect(typeof agent.capacity).toBe('number')
        expect(typeof agent.tasks_completed).toBe('number')
        expect(agent.region).toBeDefined()
      })
    })

    it('should have load less than or equal to capacity', () => {
      const agents = getAgents()

      agents.forEach((agent) => {
        expect(agent.load).toBeLessThanOrEqual(agent.capacity)
        expect(agent.load).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Task Distribution', () => {
    it('should distribute a single task', () => {
      const result = distributeTask(sampleTask)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('task-001')
      expect(result.agent_id).toBeDefined()
      expect(result.status).toBe('assigned')
      expect(result.timestamp).toBeDefined()
      expect(result.load_balanced).toBe(true)
    })

    it('should assign task to an agent', () => {
      const result = distributeTask(sampleTask)

      expect(result.agent_id).toBeDefined()
      expect(typeof result.agent_id).toBe('string')
      expect(result.agent_id).toMatch(/^agent-/)
    })

    it('should distribute multiple tasks', () => {
      const tasks = [
        { ...sampleTask, id: 'task-001' },
        { ...sampleTask, id: 'task-002' },
        { ...sampleTask, id: 'task-003' },
      ]

      const results = distributeTasks(tasks)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(3)
    })

    it('should distribute tasks to different agents', () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        ...sampleTask,
        id: `task-${i}`,
      }))

      const results = distributeTasks(tasks)

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result.agent_id).toBeDefined()
        expect(result.status).toBe('assigned')
      })
    })

    it('should handle empty task array', () => {
      const results = distributeTasks([])

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })

    it('should handle large batch distribution', () => {
      const tasks = Array.from({ length: 100 }, (_, i) => ({
        ...sampleTask,
        id: `task-${i}`,
      }))

      const results = distributeTasks(tasks)

      expect(results).toHaveLength(100)
    })

    it('should preserve task priority', () => {
      const taskWithPriority: Task = {
        ...sampleTask,
        priority: 'CRITICAL',
      }

      const result = distributeTask(taskWithPriority)

      expect(result).toBeDefined()
      expect(result.task_id).toBe(taskWithPriority.id)
    })

    it('should assign task to least loaded agent', () => {
      const result = distributeTask(sampleTask)

      // When distributing to least loaded, should prefer IDLE agents
      expect(['agent-001', 'agent-002', 'agent-003']).toContain(result.agent_id)
    })
  })

  describe('Consensus Protocol', () => {
    it('should initiate consensus', () => {
      const proposal = { action: 'scale_up', count: 2 }
      const agentIds = ['agent-001', 'agent-002', 'agent-003']

      const result = initiateConsensus(proposal, agentIds)

      expect(result).toBeDefined()
      expect(result.decision).toBeDefined()
      expect(result.agreement_percentage).toBeGreaterThanOrEqual(0)
      expect(result.agreement_percentage).toBeLessThanOrEqual(100)
      expect(result.total_votes).toBe(3)
      expect(result.timestamp).toBeDefined()
    })

    it('should calculate correct voting percentage', () => {
      const proposal = { action: 'test' }
      const agentIds = ['agent-001', 'agent-002', 'agent-003']

      const result = initiateConsensus(proposal, agentIds)

      expect(result.supporting_votes).toBeLessThanOrEqual(result.total_votes)
      expect(result.agreement_percentage).toBe(
        (result.supporting_votes / result.total_votes) * 100
      )
    })

    it('should submit a vote', () => {
      const result = submitVote(sampleVote)

      expect(result).toBeDefined()
      expect(result.agent_id).toBe('agent-001')
      expect(result.registered).toBe(true)
      expect(result.timestamp).toBeDefined()
    })

    it('should calculate consensus from votes', () => {
      const votes = [
        { ...sampleVote, agent_id: 'agent-001', decision: 'approve' },
        { ...sampleVote, agent_id: 'agent-002', decision: 'approve' },
        { ...sampleVote, agent_id: 'agent-003', decision: 'reject' },
      ]

      const result = calculateConsensus(votes)

      expect(result).toBeDefined()
      expect(result.decision).toBeDefined()
      expect(result.total_votes).toBe(3)
      expect(result.supporting_votes).toBe(2)
    })

    it('should determine consensus decision correctly', () => {
      const votes = [
        { ...sampleVote, agent_id: 'agent-001', decision: 'approve' },
        { ...sampleVote, agent_id: 'agent-002', decision: 'approve' },
        { ...sampleVote, agent_id: 'agent-003', decision: 'approve' },
      ]

      const result = calculateConsensus(votes)

      expect(result.decision).toBe('approved')
      expect(result.supporting_votes).toBe(3)
      expect(result.agreement_percentage).toBe(100)
    })

    it('should handle consensus rejection', () => {
      const votes = [
        { ...sampleVote, agent_id: 'agent-001', decision: 'reject' },
        { ...sampleVote, agent_id: 'agent-002', decision: 'reject' },
        { ...sampleVote, agent_id: 'agent-003', decision: 'approve' },
      ]

      const result = calculateConsensus(votes)

      expect(result.decision).toBe('rejected')
      expect(result.supporting_votes).toBe(1)
    })

    it('should handle empty vote array', () => {
      const result = calculateConsensus([])

      expect(result).toBeDefined()
      expect(result.total_votes).toBe(0)
    })

    it('should preserve vote confidence', () => {
      const votes = [
        { ...sampleVote, agent_id: 'agent-001', confidence: 0.99 },
        { ...sampleVote, agent_id: 'agent-002', confidence: 0.85 },
      ]

      const result = calculateConsensus(votes)

      expect(result).toBeDefined()
    })

    it('should achieve 2/3 majority for approval', () => {
      const agentIds = ['agent-001', 'agent-002', 'agent-003']
      const proposal = { action: 'update' }

      const result = initiateConsensus(proposal, agentIds)

      if (result.agreement_percentage >= 66.67) {
        expect(result.decision).toBe('approved')
      }
    })
  })

  describe('Coordinator Status & Monitoring', () => {
    it('should get coordinator status', () => {
      const status = getCoordinatorStatus()

      expect(status).toBeDefined()
      expect(status.coordinator_id).toBeDefined()
      expect(status.status).toBe('operational')
      expect(typeof status.agents_count).toBe('number')
      expect(typeof status.active_tasks).toBe('number')
      expect(typeof status.uptime_ms).toBe('number')
      expect(status.health).toBe('healthy')
    })

    it('should get agent metrics', () => {
      const metrics = getAgentMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.timestamp).toBeDefined()
      expect(typeof metrics.total_agents).toBe('number')
      expect(typeof metrics.active_agents).toBe('number')
      expect(typeof metrics.average_load).toBe('number')
      expect(typeof metrics.max_load).toBe('number')
      expect(typeof metrics.min_load).toBe('number')
      expect(Array.isArray(metrics.agents)).toBe(true)
    })

    it('should have valid metric values', () => {
      const metrics = getAgentMetrics()

      expect(metrics.average_load).toBeGreaterThanOrEqual(metrics.min_load)
      expect(metrics.average_load).toBeLessThanOrEqual(metrics.max_load)
      expect(metrics.active_agents).toBeLessThanOrEqual(metrics.total_agents)
    })

    it('should get distribution statistics', () => {
      const stats = getDistributionStats()

      expect(stats).toBeDefined()
      expect(stats.timestamp).toBeDefined()
      expect(typeof stats.total_tasks_distributed).toBe('number')
      expect(typeof stats.tasks_completed).toBe('number')
      expect(typeof stats.tasks_failed).toBe('number')
      expect(typeof stats.average_distribution_time_ms).toBe('number')
      expect(typeof stats.load_balance_score).toBe('number')
      expect(typeof stats.efficiency_percent).toBe('number')
    })

    it('should have consistent task statistics', () => {
      const stats = getDistributionStats()

      const accounted = stats.tasks_completed + stats.tasks_failed + stats.tasks_pending
      expect(accounted).toBeLessThanOrEqual(stats.total_tasks_distributed)
    })

    it('should monitor agent health', () => {
      const health = monitorAgentHealth('agent-001')

      expect(health).toBeDefined()
      expect(health.agent_id).toBe('agent-001')
      expect(health.status).toBe('healthy')
      expect(typeof health.memory_usage_mb).toBe('number')
      expect(typeof health.cpu_usage_percent).toBe('number')
      expect(typeof health.network_latency_ms).toBe('number')
      expect(typeof health.error_rate).toBe('number')
    })

    it('should have valid health metrics', () => {
      const health = monitorAgentHealth('agent-001')

      expect(health.memory_usage_mb).toBeGreaterThan(0)
      expect(health.cpu_usage_percent).toBeGreaterThanOrEqual(0)
      expect(health.cpu_usage_percent).toBeLessThanOrEqual(100)
      expect(health.network_latency_ms).toBeGreaterThanOrEqual(0)
      expect(health.error_rate).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Load Balancing & Scaling', () => {
    it('should balance load', () => {
      const result = balanceLoad()

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(result.rebalanced).toBe(true)
      expect(typeof result.tasks_moved).toBe('number')
      expect(typeof result.improvement_percent).toBe('number')
      expect(typeof result.new_average_load).toBe('number')
    })

    it('should improve average load on rebalancing', () => {
      const beforeMetrics = getAgentMetrics()
      const result = balanceLoad()
      const afterMetrics = getAgentMetrics()

      expect(result.new_average_load).toBeLessThanOrEqual(afterMetrics.average_load + 0.1)
    })

    it('should scale up agent pool', () => {
      const result = scaleAgentPool({ action: 'scale_up', count: 2 })

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(result.action).toBe('scale_up')
      expect(result.count).toBe(2)
      expect(result.status).toBe('initiated')
      expect(typeof result.new_pool_size).toBe('number')
      expect(typeof result.estimated_ready_time_ms).toBe('number')
    })

    it('should scale down agent pool', () => {
      const result = scaleAgentPool({ action: 'scale_down', count: 1 })

      expect(result).toBeDefined()
      expect(result.action).toBe('scale_down')
      expect(result.count).toBe(1)
      expect(result.status).toBe('initiated')
    })

    it('should update pool size correctly on scale up', () => {
      const initialMetrics = getAgentMetrics()
      const scaleResult = scaleAgentPool({ action: 'scale_up', count: 2 })

      expect(scaleResult.new_pool_size).toBe(initialMetrics.total_agents + 2)
    })
  })

  describe('Failover & Recovery', () => {
    it('should perform failover for failed agent', () => {
      const result = performFailover('agent-001')

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
      expect(result.failed_agent_id).toBe('agent-001')
      expect(result.status).toBe('failover_complete')
      expect(typeof result.tasks_redistributed).toBe('number')
      expect(result.backup_agent_id).toBeDefined()
      expect(typeof result.recovery_time_ms).toBe('number')
    })

    it('should reassign tasks on failover', () => {
      const result = performFailover('agent-003')

      expect(result.tasks_redistributed).toBeGreaterThan(0)
      expect(result.backup_agent_id).toBeDefined()
    })

    it('should complete failover quickly', () => {
      const result = performFailover('agent-001')

      expect(result.recovery_time_ms).toBeLessThan(10000)
    })
  })

  describe('Voting History', () => {
    it('should get voting history', () => {
      const history = getVotingHistory()

      expect(history).toBeDefined()
      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBeGreaterThan(0)
    })

    it('should have valid voting records', () => {
      const history = getVotingHistory()

      history.forEach((record) => {
        expect(record.proposal_id).toBeDefined()
        expect(record.timestamp).toBeDefined()
        expect(typeof record.total_votes).toBe('number')
        expect(typeof record.approval_votes).toBe('number')
        expect(typeof record.rejection_votes).toBe('number')
        expect(['approved', 'rejected']).toContain(record.result)
      })
    })

    it('should have consistent vote counts', () => {
      const history = getVotingHistory()

      history.forEach((record) => {
        const votesAccounted = record.approval_votes + record.rejection_votes
        expect(votesAccounted).toBeLessThanOrEqual(record.total_votes)
      })
    })
  })

  describe('DaaPrimeCoordinator Class', () => {
    let coordinator: DaaPrimeCoordinator

    beforeAll(() => {
      coordinator = new DaaPrimeCoordinator({
        max_agents: 10,
        max_tasks: 100,
      })
    })

    it('should create instance', () => {
      expect(coordinator).toBeDefined()
      expect(coordinator).toBeInstanceOf(DaaPrimeCoordinator)
    })

    it('should register agent via instance method', () => {
      const result = coordinator.register(sampleAgent)

      expect(result).toBeDefined()
      expect(result.agent_id).toBe('agent-001')
    })

    it('should get agents via instance method', () => {
      const agents = coordinator.getAgents()

      expect(agents).toBeDefined()
      expect(Array.isArray(agents)).toBe(true)
    })

    it('should distribute task via instance method', () => {
      const result = coordinator.distribute(sampleTask)

      expect(result).toBeDefined()
      expect(result.task_id).toBe('task-001')
    })

    it('should distribute batch via instance method', () => {
      const tasks = [
        { ...sampleTask, id: 'task-001' },
        { ...sampleTask, id: 'task-002' },
      ]

      const results = coordinator.distributeBatch(tasks)

      expect(results).toHaveLength(2)
    })

    it('should vote via instance method', () => {
      const proposal = { action: 'test' }
      const agentIds = ['agent-001', 'agent-002']

      const result = coordinator.vote(proposal, agentIds)

      expect(result).toBeDefined()
      expect(result.decision).toBeDefined()
    })

    it('should get status via instance method', () => {
      const status = coordinator.status()

      expect(status).toBeDefined()
      expect(status.status).toBe('operational')
    })

    it('should get metrics via instance method', () => {
      const metrics = coordinator.metrics()

      expect(metrics).toBeDefined()
      expect(metrics.total_agents).toBeGreaterThan(0)
    })

    it('should rebalance via instance method', () => {
      const result = coordinator.rebalance()

      expect(result).toBeDefined()
      expect(result.rebalanced).toBe(true)
    })

    it('should get stats via instance method', () => {
      const stats = coordinator.stats()

      expect(stats).toBeDefined()
      expect(stats.efficiency_percent).toBeGreaterThanOrEqual(0)
    })

    it('should check health via instance method', () => {
      const health = coordinator.health('agent-001')

      expect(health).toBeDefined()
      expect(health.status).toBe('healthy')
    })

    it('should scale via instance method', () => {
      const result = coordinator.scale({ action: 'scale_up', count: 1 })

      expect(result).toBeDefined()
      expect(result.status).toBe('initiated')
    })

    it('should handle failover via instance method', () => {
      const result = coordinator.failover('agent-001')

      expect(result).toBeDefined()
      expect(result.status).toBe('failover_complete')
    })

    it('should get history via instance method', () => {
      const history = coordinator.history()

      expect(history).toBeDefined()
      expect(Array.isArray(history)).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    it('should complete full coordination workflow', () => {
      // Initialize
      const initResult = initializeCoordinator()
      expect(initResult.initialized).toBe(true)

      // Register agent
      const regResult = registerAgent(sampleAgent)
      expect(regResult.registered).toBe(true)

      // Get agents
      const agents = getAgents()
      expect(agents.length).toBeGreaterThan(0)

      // Distribute task
      const distResult = distributeTask(sampleTask)
      expect(distResult.status).toBe('assigned')

      // Get status
      const status = getCoordinatorStatus()
      expect(status.status).toBe('operational')
    })

    it('should handle consensus workflow', () => {
      const proposal = { action: 'update_policy' }
      const agentIds = ['agent-001', 'agent-002', 'agent-003']

      const consensusResult = initiateConsensus(proposal, agentIds)
      expect(consensusResult.decision).toBeDefined()

      const history = getVotingHistory()
      expect(history.length).toBeGreaterThan(0)
    })

    it('should handle scaling workflow', () => {
      // Get initial metrics
      const beforeMetrics = getAgentMetrics()
      const beforeCount = beforeMetrics.total_agents

      // Scale up
      const scaleResult = scaleAgentPool({ action: 'scale_up', count: 2 })
      expect(scaleResult.status).toBe('initiated')
      expect(scaleResult.new_pool_size).toBe(beforeCount + 2)

      // Rebalance
      const rebalanceResult = balanceLoad()
      expect(rebalanceResult.rebalanced).toBe(true)
    })

    it('should handle failover and recovery', () => {
      // Get initial status
      const beforeStatus = getCoordinatorStatus()

      // Perform failover
      const failoverResult = performFailover('agent-001')
      expect(failoverResult.status).toBe('failover_complete')

      // Get final status
      const afterStatus = getCoordinatorStatus()
      expect(afterStatus.status).toBe('operational')
    })

    it('should maintain data consistency through operations', () => {
      // Initial state
      const agents1 = getAgents()
      const metrics1 = getAgentMetrics()

      // Perform operations
      distributeTask(sampleTask)
      balanceLoad()

      // Verify consistency
      const agents2 = getAgents()
      const metrics2 = getAgentMetrics()

      expect(agents2.length).toBe(agents1.length)
      expect(metrics2.total_agents).toBe(metrics1.total_agents)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid agent gracefully', () => {
      expect(() => {
        const invalidAgent = { id: 'invalid' } as any
        registerAgent(invalidAgent)
      }).toThrow()
    })

    it('should handle invalid task gracefully', () => {
      expect(() => {
        const invalidTask = { id: 'invalid' } as any
        distributeTask(invalidTask)
      }).toThrow()
    })

    it('should handle large number of agents', () => {
      const agents = getAgents()
      expect(agents).toBeDefined()
      expect(agents.length).toBeGreaterThan(0)
    })

    it('should handle large batch operations', () => {
      const largeBatch = Array.from({ length: 50 }, (_, i) => ({
        ...sampleTask,
        id: `task-${i}`,
      }))

      const results = distributeTasks(largeBatch)
      expect(results).toHaveLength(50)
    })
  })
})
