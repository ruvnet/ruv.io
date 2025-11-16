// RUV Swarm Agents - Agent management system for RUV Swarm
// TypeScript bindings for the napi-rs module

// ============ Type Definitions ============

export enum AgentState {
  Idle = 'idle',
  Active = 'active',
  Busy = 'busy',
  Paused = 'paused',
  Error = 'error',
  Stopped = 'stopped',
}

export enum TaskPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Critical = 'critical',
}

export enum TaskStatus {
  Pending = 'pending',
  Assigned = 'assigned',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export interface AgentConfig {
  name: string
  capabilities: string[]
  max_concurrent_tasks: number
  timeout_ms: number
  auto_restart?: boolean
}

export interface Agent {
  id: string
  name: string
  state: AgentState
  capabilities: string[]
  created_at: string
  updated_at: string
  max_concurrent_tasks: number
  current_tasks: number
  completed_tasks: number
  failed_tasks: number
  uptime_ms: number
  metadata: Record<string, any>
}

export interface Task {
  id: string
  agent_id?: string | null
  status: TaskStatus
  priority: TaskPriority
  payload: Record<string, any>
  created_at: string
  assigned_at?: string | null
  completed_at?: string | null
  execution_time_ms?: number | null
  result?: Record<string, any> | null
  error?: string | null
}

export interface Message {
  id: string
  from_agent_id: string
  to_agent_id: string
  content: Record<string, any>
  sent_at: string
  received_at?: string | null
  read_at?: string | null
}

export interface AgentStatus {
  agent_id: string
  state: AgentState
  current_tasks: number
  completed_tasks: number
  failed_tasks: number
  uptime_ms: number
  last_activity: string
  health: string
}

/**
 * Native bindings from ruv_swarm_agents Rust module
 */
let swarmAgents: any

try {
  // Load the native module via platform loader
  swarmAgents = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native ruv_swarm_agents module not loaded. Build the project first.')
  swarmAgents = null
}

// ============ Agent Lifecycle Functions ============

/**
 * Create a new agent with the given configuration
 * @param config - Agent configuration
 * @returns Created agent information
 */
export function createAgent(configJson: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.createAgent(configJson)
}

/**
 * Start an agent (transition to active state)
 * @param agentId - Agent identifier
 * @returns Updated agent information
 */
export function startAgent(agentId: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.startAgent(agentId)
}

/**
 * Stop an agent
 * @param agentId - Agent identifier
 * @returns Updated agent information
 */
export function stopAgent(agentId: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.stopAgent(agentId)
}

/**
 * Pause an agent
 * @param agentId - Agent identifier
 * @returns Updated agent information
 */
export function pauseAgent(agentId: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.pauseAgent(agentId)
}

/**
 * Resume a paused agent
 * @param agentId - Agent identifier
 * @returns Updated agent information
 */
export function resumeAgent(agentId: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.resumeAgent(agentId)
}

/**
 * Destroy an agent (remove from registry)
 * @param agentId - Agent identifier
 * @returns Success message
 */
export function destroyAgent(agentId: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.destroyAgent(agentId)
}

/**
 * Get agent information
 * @param agentId - Agent identifier
 * @returns Agent information
 */
export function getAgent(agentId: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.getAgent(agentId)
}

/**
 * Get all agents
 * @returns Array of all agents
 */
export function getAllAgents(): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.getAllAgents()
}

/**
 * Get the total count of agents
 * @returns Number of agents in registry
 */
export function getAgentCount(): number {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.getAgentCount()
}

// ============ Task Management Functions ============

/**
 * Assign a task to an agent
 * @param agentId - Agent identifier
 * @param taskJson - Task information as JSON string
 * @returns Assigned task information
 */
export function assignTask(agentId: string, taskJson: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.assignTask(agentId, taskJson)
}

/**
 * Complete a task
 * @param agentId - Agent identifier
 * @param taskId - Task identifier
 * @param resultJson - Task result as JSON string
 * @returns Completed task information
 */
export function completeTask(agentId: string, taskId: string, resultJson: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.completeTask(agentId, taskId, resultJson)
}

/**
 * Fail a task
 * @param agentId - Agent identifier
 * @param taskId - Task identifier
 * @param errorMessage - Error message
 * @returns Failed task information
 */
export function failTask(agentId: string, taskId: string, errorMessage: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.failTask(agentId, taskId, errorMessage)
}

// ============ Agent Communication Functions ============

/**
 * Send a message between agents
 * @param fromAgentId - Sender agent identifier
 * @param toAgentId - Recipient agent identifier
 * @param contentJson - Message content as JSON string
 * @returns Message information
 */
export function sendMessage(fromAgentId: string, toAgentId: string, contentJson: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.sendMessage(fromAgentId, toAgentId, contentJson)
}

/**
 * Get messages for an agent
 * @param agentId - Agent identifier
 * @param unreadOnly - If true, only return unread messages
 * @returns Array of messages as JSON string
 */
export function getMessages(agentId: string, unreadOnly: boolean): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.getMessages(agentId, unreadOnly)
}

/**
 * Mark message as read
 * @param agentId - Agent identifier
 * @param messageId - Message identifier
 * @returns Success message
 */
export function markMessageRead(agentId: string, messageId: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.markMessageRead(agentId, messageId)
}

// ============ Agent Status Functions ============

/**
 * Get agent status
 * @param agentId - Agent identifier
 * @returns Agent status information
 */
export function getAgentStatus(agentId: string): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.getAgentStatus(agentId)
}

/**
 * Get all agent statuses
 * @returns Array of agent statuses as JSON string
 */
export function getAllAgentStatuses(): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.getAllAgentStatuses()
}

// ============ Utility Functions ============

/**
 * Reset all agents and state (for testing)
 * @returns Success message
 */
export function resetAll(): string {
  if (!swarmAgents) {
    throw new Error('Native module not available')
  }

  return swarmAgents.resetAll()
}

/**
 * Agent Manager class for advanced use cases
 */
export class AgentManager {
  /**
   * Create a new AgentManager instance
   */
  constructor() {
    if (!swarmAgents) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Create agent
   */
  createAgent(configJson: string): string {
    return createAgent(configJson)
  }

  /**
   * Start agent
   */
  startAgent(agentId: string): string {
    return startAgent(agentId)
  }

  /**
   * Stop agent
   */
  stopAgent(agentId: string): string {
    return stopAgent(agentId)
  }

  /**
   * Pause agent
   */
  pauseAgent(agentId: string): string {
    return pauseAgent(agentId)
  }

  /**
   * Resume agent
   */
  resumeAgent(agentId: string): string {
    return resumeAgent(agentId)
  }

  /**
   * Destroy agent
   */
  destroyAgent(agentId: string): string {
    return destroyAgent(agentId)
  }

  /**
   * Get agent
   */
  getAgent(agentId: string): string {
    return getAgent(agentId)
  }

  /**
   * Get all agents
   */
  getAllAgents(): string {
    return getAllAgents()
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    return getAgentCount()
  }

  /**
   * Assign task
   */
  assignTask(agentId: string, taskJson: string): string {
    return assignTask(agentId, taskJson)
  }

  /**
   * Complete task
   */
  completeTask(agentId: string, taskId: string, resultJson: string): string {
    return completeTask(agentId, taskId, resultJson)
  }

  /**
   * Fail task
   */
  failTask(agentId: string, taskId: string, errorMessage: string): string {
    return failTask(agentId, taskId, errorMessage)
  }

  /**
   * Send message
   */
  sendMessage(fromAgentId: string, toAgentId: string, contentJson: string): string {
    return sendMessage(fromAgentId, toAgentId, contentJson)
  }

  /**
   * Get messages
   */
  getMessages(agentId: string, unreadOnly: boolean): string {
    return getMessages(agentId, unreadOnly)
  }

  /**
   * Mark message read
   */
  markMessageRead(agentId: string, messageId: string): string {
    return markMessageRead(agentId, messageId)
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): string {
    return getAgentStatus(agentId)
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): string {
    return getAllAgentStatuses()
  }

  /**
   * Reset all state
   */
  resetAll(): string {
    return resetAll()
  }
}

// Export all types and functions
export default {
  createAgent,
  startAgent,
  stopAgent,
  pauseAgent,
  resumeAgent,
  destroyAgent,
  getAgent,
  getAllAgents,
  getAgentCount,
  assignTask,
  completeTask,
  failTask,
  sendMessage,
  getMessages,
  markMessageRead,
  getAgentStatus,
  getAllAgentStatuses,
  resetAll,
  AgentManager,
  AgentState,
  TaskPriority,
  TaskStatus,
}
