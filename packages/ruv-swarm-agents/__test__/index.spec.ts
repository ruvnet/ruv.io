import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAgent,
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
  destroyAgent,
  getAgent,
  getAllAgents,
  assignTask,
  completeTask,
  failTask,
  sendMessage,
  getMessages,
  markMessageRead,
  getAgentStatus,
  getAllAgentStatuses,
  resetAll,
  getAgentCount,
} from '../src/index'

describe('RUV Swarm Agents - Agent Management', () => {
  beforeEach(() => {
    resetAll()
  })

  afterEach(() => {
    resetAll()
  })

  // ============ Agent Lifecycle Tests ============

  describe('Agent Lifecycle Management', () => {
    it('should create a new agent', () => {
      const config = {
        name: 'test-agent-1',
        capabilities: ['compute', 'storage'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
        auto_restart: true,
      }

      const result = createAgent(JSON.stringify(config))
      const agent = JSON.parse(result)

      expect(agent).toBeDefined()
      expect(agent.id).toBeDefined()
      expect(agent.name).toBe('test-agent-1')
      expect(agent.capabilities).toEqual(['compute', 'storage'])
      expect(agent.state).toBe('idle')
      expect(agent.created_at).toBeDefined()
      expect(agent.max_concurrent_tasks).toBe(5)
      expect(agent.current_tasks).toBe(0)
      expect(agent.completed_tasks).toBe(0)
    })

    it('should start an agent', () => {
      const config = {
        name: 'agent-start-test',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      const result = JSON.parse(startAgent(agentId))

      expect(result.state).toBe('active')
      expect(result.updated_at).toBeDefined()
    })

    it('should stop an agent', () => {
      const config = {
        name: 'agent-stop-test',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))
      const result = JSON.parse(stopAgent(agentId))

      expect(result.state).toBe('stopped')
    })

    it('should pause an agent', () => {
      const config = {
        name: 'agent-pause-test',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))
      const result = JSON.parse(pauseAgent(agentId))

      expect(result.state).toBe('paused')
    })

    it('should resume a paused agent', () => {
      const config = {
        name: 'agent-resume-test',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))
      JSON.parse(pauseAgent(agentId))
      const result = JSON.parse(resumeAgent(agentId))

      expect(result.state).toBe('active')
    })

    it('should destroy an agent', () => {
      const config = {
        name: 'agent-destroy-test',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      const result = JSON.parse(destroyAgent(agentId))

      expect(result.success).toBe(true)
      expect(() => getAgent(agentId)).toThrow()
    })

    it('should retrieve agent information', () => {
      const config = {
        name: 'agent-get-test',
        capabilities: ['compute', 'storage'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      const result = JSON.parse(getAgent(agentId))

      expect(result.id).toBe(agentId)
      expect(result.name).toBe('agent-get-test')
      expect(result.capabilities).toEqual(['compute', 'storage'])
    })

    it('should retrieve all agents', () => {
      const config1 = {
        name: 'agent-1',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const config2 = {
        name: 'agent-2',
        capabilities: ['storage'],
        max_concurrent_tasks: 3,
        timeout_ms: 30000,
      }

      createAgent(JSON.stringify(config1))
      createAgent(JSON.stringify(config2))

      const result = JSON.parse(getAllAgents())

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('agent-1')
      expect(result[1].name).toBe('agent-2')
    })

    it('should track agent count', () => {
      const config = {
        name: 'agent-count-test',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }

      expect(getAgentCount()).toBe(0)
      createAgent(JSON.stringify(config))
      expect(getAgentCount()).toBe(1)
      createAgent(JSON.stringify(config))
      expect(getAgentCount()).toBe(2)
    })
  })

  // ============ Task Assignment Tests ============

  describe('Task Assignment and Management', () => {
    it('should assign a task to an agent', () => {
      const config = {
        name: 'task-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))

      const task = {
        id: 'task-001',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test' },
      }

      const result = JSON.parse(assignTask(agentId, JSON.stringify(task)))

      expect(result.status).toBe('assigned')
      expect(result.agent_id).toBe(agentId)
      expect(result.assigned_at).toBeDefined()
    })

    it('should reject task assignment to stopped agent', () => {
      const config = {
        name: 'stopped-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(stopAgent(agentId))

      const task = {
        id: 'task-002',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test' },
      }

      expect(() => assignTask(agentId, JSON.stringify(task))).toThrow()
    })

    it('should reject task assignment when agent is at capacity', () => {
      const config = {
        name: 'capacity-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 1,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))

      const task1 = {
        id: 'task-001',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test1' },
      }
      const task2 = {
        id: 'task-002',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test2' },
      }

      JSON.parse(assignTask(agentId, JSON.stringify(task1)))

      expect(() => assignTask(agentId, JSON.stringify(task2))).toThrow()
    })

    it('should complete a task', () => {
      const config = {
        name: 'complete-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))

      const task = {
        id: 'task-001',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test' },
      }

      const assigned = JSON.parse(assignTask(agentId, JSON.stringify(task)))
      const taskId = assigned.id

      const result = JSON.parse(completeTask(agentId, taskId, JSON.stringify({ success: true })))

      expect(result.status).toBe('completed')
      expect(result.completed_at).toBeDefined()
      expect(result.result).toBeDefined()

      const agent = JSON.parse(getAgent(agentId))
      expect(agent.completed_tasks).toBe(1)
      expect(agent.current_tasks).toBe(0)
    })

    it('should fail a task', () => {
      const config = {
        name: 'fail-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))

      const task = {
        id: 'task-001',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test' },
      }

      const assigned = JSON.parse(assignTask(agentId, JSON.stringify(task)))
      const taskId = assigned.id

      const result = JSON.parse(failTask(agentId, taskId, 'Test error'))

      expect(result.status).toBe('failed')
      expect(result.error).toBe('Test error')

      const agent = JSON.parse(getAgent(agentId))
      expect(agent.failed_tasks).toBe(1)
      expect(agent.current_tasks).toBe(0)
    })

    it('should transition agent to busy state when task assigned', () => {
      const config = {
        name: 'busy-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))

      const task = {
        id: 'task-001',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test' },
      }

      JSON.parse(assignTask(agentId, JSON.stringify(task)))

      const agent = JSON.parse(getAgent(agentId))
      expect(agent.state).toBe('busy')
    })

    it('should transition agent to idle state when all tasks completed', () => {
      const config = {
        name: 'idle-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))

      const task = {
        id: 'task-001',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test' },
      }

      const assigned = JSON.parse(assignTask(agentId, JSON.stringify(task)))
      const taskId = assigned.id

      JSON.parse(completeTask(agentId, taskId, JSON.stringify({ success: true })))

      const agent = JSON.parse(getAgent(agentId))
      expect(agent.state).toBe('idle')
    })
  })

  // ============ Agent Communication Tests ============

  describe('Agent Communication', () => {
    it('should send a message between agents', () => {
      const config = {
        name: 'sender-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const sender = JSON.parse(createAgent(JSON.stringify(config)))
      const receiver = JSON.parse(createAgent(JSON.stringify(config)))

      const message = {
        type: 'notification',
        content: 'Hello from sender',
      }

      const result = JSON.parse(
        sendMessage(sender.id, receiver.id, JSON.stringify(message))
      )

      expect(result.id).toBeDefined()
      expect(result.from_agent_id).toBe(sender.id)
      expect(result.to_agent_id).toBe(receiver.id)
      expect(result.sent_at).toBeDefined()
      expect(result.received_at).toBeNull()
    })

    it('should reject sending message to non-existent agent', () => {
      const config = {
        name: 'sender-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const sender = JSON.parse(createAgent(JSON.stringify(config)))

      const message = {
        type: 'notification',
        content: 'Hello',
      }

      expect(() => sendMessage(sender.id, 'non-existent', JSON.stringify(message))).toThrow()
    })

    it('should get messages for an agent', () => {
      const config = {
        name: 'agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const sender = JSON.parse(createAgent(JSON.stringify(config)))
      const receiver = JSON.parse(createAgent(JSON.stringify(config)))

      const message1 = { type: 'msg', content: 'Message 1' }
      const message2 = { type: 'msg', content: 'Message 2' }

      sendMessage(sender.id, receiver.id, JSON.stringify(message1))
      sendMessage(sender.id, receiver.id, JSON.stringify(message2))

      const result = JSON.parse(getMessages(receiver.id, false))

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
    })

    it('should filter unread messages', () => {
      const config = {
        name: 'agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const sender = JSON.parse(createAgent(JSON.stringify(config)))
      const receiver = JSON.parse(createAgent(JSON.stringify(config)))

      const message1 = { type: 'msg', content: 'Message 1' }
      const message2 = { type: 'msg', content: 'Message 2' }

      const msg1 = JSON.parse(sendMessage(sender.id, receiver.id, JSON.stringify(message1)))
      sendMessage(sender.id, receiver.id, JSON.stringify(message2))

      markMessageRead(receiver.id, msg1.id)

      const unreadResult = JSON.parse(getMessages(receiver.id, true))

      expect(unreadResult).toHaveLength(1)
      expect(unreadResult[0].content.content).toBe('Message 2')
    })

    it('should mark message as read', () => {
      const config = {
        name: 'agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const sender = JSON.parse(createAgent(JSON.stringify(config)))
      const receiver = JSON.parse(createAgent(JSON.stringify(config)))

      const message = { type: 'msg', content: 'Test message' }
      const msg = JSON.parse(sendMessage(sender.id, receiver.id, JSON.stringify(message)))

      expect(msg.read_at).toBeNull()

      markMessageRead(receiver.id, msg.id)

      const messages = JSON.parse(getMessages(receiver.id, false))
      expect(messages[0].read_at).toBeDefined()
    })

    it('should handle empty message inbox', () => {
      const config = {
        name: 'agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const agent = JSON.parse(createAgent(JSON.stringify(config)))

      const result = JSON.parse(getMessages(agent.id, false))

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })
  })

  // ============ Status Monitoring Tests ============

  describe('Agent Status Monitoring', () => {
    it('should get agent status', () => {
      const config = {
        name: 'status-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))

      const result = JSON.parse(getAgentStatus(agentId))

      expect(result.agent_id).toBe(agentId)
      expect(result.state).toBe('active')
      expect(result.current_tasks).toBe(0)
      expect(result.completed_tasks).toBe(0)
      expect(result.failed_tasks).toBe(0)
      expect(result.health).toBe('healthy')
      expect(result.uptime_ms).toBeGreaterThanOrEqual(0)
      expect(result.last_activity).toBeDefined()
    })

    it('should report healthy status', () => {
      const config = {
        name: 'healthy-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      const result = JSON.parse(getAgentStatus(agentId))
      expect(result.health).toBe('healthy')
    })

    it('should get all agent statuses', () => {
      const config1 = {
        name: 'agent-1',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const config2 = {
        name: 'agent-2',
        capabilities: ['storage'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }

      const agent1 = JSON.parse(createAgent(JSON.stringify(config1)))
      const agent2 = JSON.parse(createAgent(JSON.stringify(config2)))

      JSON.parse(startAgent(agent1.id))
      JSON.parse(startAgent(agent2.id))

      const result = JSON.parse(getAllAgentStatuses())

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0].state).toBe('active')
      expect(result[1].state).toBe('active')
    })

    it('should track task statistics in status', () => {
      const config = {
        name: 'stats-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      JSON.parse(startAgent(agentId))

      const task = {
        id: 'task-001',
        status: 'pending',
        priority: 'normal',
        payload: { data: 'test' },
      }

      const assigned = JSON.parse(assignTask(agentId, JSON.stringify(task)))
      JSON.parse(completeTask(agentId, assigned.id, JSON.stringify({ result: 'ok' })))

      const status = JSON.parse(getAgentStatus(agentId))

      expect(status.completed_tasks).toBe(1)
      expect(status.current_tasks).toBe(0)
    })

    it('should update last activity timestamp', () => {
      const config = {
        name: 'activity-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      const agentId = created.id

      const status1 = JSON.parse(getAgentStatus(agentId))
      expect(status1.last_activity).toBeDefined()

      JSON.parse(startAgent(agentId))

      const status2 = JSON.parse(getAgentStatus(agentId))
      expect(status2.last_activity).toBeDefined()
    })
  })

  // ============ Integration Tests ============

  describe('Integration Tests', () => {
    it('should complete full agent lifecycle', () => {
      const config = {
        name: 'lifecycle-agent',
        capabilities: ['compute', 'storage'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }

      const created = JSON.parse(createAgent(JSON.stringify(config)))
      expect(created.state).toBe('idle')

      JSON.parse(startAgent(created.id))
      let agent = JSON.parse(getAgent(created.id))
      expect(agent.state).toBe('active')

      JSON.parse(pauseAgent(created.id))
      agent = JSON.parse(getAgent(created.id))
      expect(agent.state).toBe('paused')

      JSON.parse(resumeAgent(created.id))
      agent = JSON.parse(getAgent(created.id))
      expect(agent.state).toBe('active')

      JSON.parse(stopAgent(created.id))
      agent = JSON.parse(getAgent(created.id))
      expect(agent.state).toBe('stopped')
    })

    it('should handle concurrent task workflow', () => {
      const config = {
        name: 'concurrent-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 3,
        timeout_ms: 30000,
      }

      const created = JSON.parse(createAgent(JSON.stringify(config)))
      JSON.parse(startAgent(created.id))

      const tasks = []
      for (let i = 0; i < 3; i++) {
        const task = {
          id: `task-${i}`,
          status: 'pending',
          priority: 'normal',
          payload: { index: i },
        }
        const assigned = JSON.parse(assignTask(created.id, JSON.stringify(task)))
        tasks.push(assigned)
      }

      let agent = JSON.parse(getAgent(created.id))
      expect(agent.current_tasks).toBe(3)
      expect(agent.state).toBe('busy')

      for (const task of tasks) {
        JSON.parse(completeTask(created.id, task.id, JSON.stringify({ done: true })))
      }

      agent = JSON.parse(getAgent(created.id))
      expect(agent.current_tasks).toBe(0)
      expect(agent.completed_tasks).toBe(3)
      expect(agent.state).toBe('idle')
    })

    it('should orchestrate multi-agent communication', () => {
      const configs = [
        { name: 'coordinator', capabilities: ['orchestration'] },
        { name: 'worker-1', capabilities: ['compute'] },
        { name: 'worker-2', capabilities: ['compute'] },
      ]

      const agents = configs.map((cfg) =>
        JSON.parse(
          createAgent(
            JSON.stringify({
              ...cfg,
              max_concurrent_tasks: 5,
              timeout_ms: 30000,
            })
          )
        )
      )

      const coordinator = agents[0]
      const worker1 = agents[1]
      const worker2 = agents[2]

      // Coordinator sends work to workers
      const work1 = { type: 'work', data: 'task1' }
      const work2 = { type: 'work', data: 'task2' }

      JSON.parse(sendMessage(coordinator.id, worker1.id, JSON.stringify(work1)))
      JSON.parse(sendMessage(coordinator.id, worker2.id, JSON.stringify(work2)))

      // Workers send results back
      const result1 = { type: 'result', status: 'done' }
      const result2 = { type: 'result', status: 'done' }

      JSON.parse(sendMessage(worker1.id, coordinator.id, JSON.stringify(result1)))
      JSON.parse(sendMessage(worker2.id, coordinator.id, JSON.stringify(result2)))

      // Verify all messages received
      const coordinatorMessages = JSON.parse(getMessages(coordinator.id, false))
      expect(coordinatorMessages).toHaveLength(2)
    })

    it('should track complete workflow statistics', () => {
      const config = {
        name: 'stats-tracking-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }

      const created = JSON.parse(createAgent(JSON.stringify(config)))
      JSON.parse(startAgent(created.id))

      // Assign and complete multiple tasks
      for (let i = 0; i < 3; i++) {
        const task = {
          id: `task-${i}`,
          status: 'pending',
          priority: 'normal',
          payload: { index: i },
        }
        const assigned = JSON.parse(assignTask(created.id, JSON.stringify(task)))
        JSON.parse(completeTask(created.id, assigned.id, JSON.stringify({ done: true })))
      }

      // Assign tasks that will fail
      for (let i = 3; i < 5; i++) {
        const task = {
          id: `task-${i}`,
          status: 'pending',
          priority: 'normal',
          payload: { index: i },
        }
        const assigned = JSON.parse(assignTask(created.id, JSON.stringify(task)))
        JSON.parse(failTask(created.id, assigned.id, 'Error'))
      }

      const agent = JSON.parse(getAgent(created.id))
      expect(agent.completed_tasks).toBe(3)
      expect(agent.failed_tasks).toBe(2)

      const status = JSON.parse(getAgentStatus(created.id))
      expect(status.completed_tasks).toBe(3)
      expect(status.failed_tasks).toBe(2)
    })
  })

  // ============ Error Handling Tests ============

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent agent', () => {
      expect(() => getAgent('non-existent-agent')).toThrow()
    })

    it('should handle resume on non-paused agent', () => {
      const config = {
        name: 'resume-test-agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))

      expect(() => resumeAgent(created.id)).toThrow()
    })

    it('should handle invalid JSON config', () => {
      expect(() => createAgent('invalid json')).toThrow()
    })

    it('should handle task assignment with invalid JSON', () => {
      const config = {
        name: 'agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))
      JSON.parse(startAgent(created.id))

      expect(() => assignTask(created.id, 'invalid json')).toThrow()
    })

    it('should handle mark read on non-existent message', () => {
      const config = {
        name: 'agent',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }
      const created = JSON.parse(createAgent(JSON.stringify(config)))

      expect(() => markMessageRead(created.id, 'non-existent')).toThrow()
    })

    it('should reset all state', () => {
      const config = {
        name: 'reset-test',
        capabilities: ['compute'],
        max_concurrent_tasks: 5,
        timeout_ms: 30000,
      }

      createAgent(JSON.stringify(config))
      createAgent(JSON.stringify(config))

      expect(getAgentCount()).toBe(2)

      const reset = JSON.parse(resetAll())
      expect(reset.success).toBe(true)
      expect(getAgentCount()).toBe(0)
    })
  })
})
