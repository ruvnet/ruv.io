// DAA Prime Coordinator - TypeScript bindings for napi-rs module

export type AgentStatus = 'ACTIVE' | 'IDLE' | 'BUSY' | 'FAILED' | 'SHUTDOWN'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Agent {
  id: string
  status: AgentStatus
  load: number
  capacity: number
  tasks_completed: number
  region: string
}

export interface Task {
  id: string
  agent_id?: string
  priority: TaskPriority
  payload?: Record<string, any>
  status: string
  created_at: string
}

export interface Vote {
  agent_id: string
  decision: string
  confidence: number
  timestamp: string
}

export interface ConsensusResult {
  decision: string
  agreement_percentage: number
  total_votes: number
  supporting_votes: number
  timestamp: string
}

export interface CoordinatorConfig {
  max_agents?: number
  max_tasks?: number
  consensus_threshold?: number
  timeout_ms?: number
}

export interface CoordinatorStatus {
  coordinator_id: string
  status: string
  timestamp: string
  agents_count: number
  active_tasks: number
  uptime_ms: number
  health: string
}

export interface AgentMetrics {
  timestamp: string
  total_agents: number
  active_agents: number
  average_load: number
  max_load: number
  min_load: number
  agents: Array<{
    agent_id: string
    load: number
    capacity: number
    utilization_percent: number
  }>
}

export interface DistributionStats {
  timestamp: string
  total_tasks_distributed: number
  tasks_completed: number
  tasks_failed: number
  tasks_pending: number
  average_distribution_time_ms: number
  load_balance_score: number
  efficiency_percent: number
}

/**
 * Native bindings from daa_prime_coordinator Rust module
 */
let coordinator: any

try {
  // Load the native module via platform loader
  coordinator = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native daa_prime_coordinator module not loaded. Build the project first.')
  coordinator = null
}

/**
 * Initialize the coordinator with configuration
 * @param config - Coordinator configuration options
 * @returns Initialization result
 */
export function initializeCoordinator(config?: CoordinatorConfig): any {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config || {})
  const result = coordinator.initializeCoordinator(configJson)

  return JSON.parse(result)
}

/**
 * Register a new agent with the coordinator
 * @param agent - Agent information
 * @returns Registration confirmation
 */
export function registerAgent(agent: Agent): any {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const agentJson = JSON.stringify(agent)
  const result = coordinator.registerAgent(agentJson)

  return JSON.parse(result)
}

/**
 * Get all registered agents
 * @param statusFilter - Optional status filter
 * @returns Array of agents
 */
export function getAgents(statusFilter?: AgentStatus): Agent[] {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const result = coordinator.getAgents(statusFilter)
  return JSON.parse(result)
}

/**
 * Distribute a task to the least loaded agent
 * @param task - Task to distribute
 * @returns Distribution result
 */
export function distributeTask(task: Task): any {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const taskJson = JSON.stringify(task)
  const result = coordinator.distributeTask(taskJson)

  return JSON.parse(result)
}

/**
 * Distribute multiple tasks with load balancing
 * @param tasks - Array of tasks
 * @returns Array of distribution results
 */
export function distributeTasks(tasks: Task[]): any[] {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const tasksJson = JSON.stringify(tasks)
  const result = coordinator.distributeTasks(tasksJson)

  return JSON.parse(result)
}

/**
 * Initiate consensus protocol for decision-making
 * @param proposal - Proposal details
 * @param agentIds - Agent IDs to vote
 * @returns Consensus result
 */
export function initiateConsensus(proposal: Record<string, any>, agentIds: string[]): ConsensusResult {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const proposalJson = JSON.stringify(proposal)
  const agentIdsJson = JSON.stringify(agentIds)
  const result = coordinator.initiateConsensus(proposalJson, agentIdsJson)

  return JSON.parse(result)
}

/**
 * Submit a vote for consensus
 * @param vote - Vote information
 * @returns Vote confirmation
 */
export function submitVote(vote: Vote): any {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const voteJson = JSON.stringify(vote)
  const result = coordinator.submitVote(voteJson)

  return JSON.parse(result)
}

/**
 * Calculate consensus from multiple votes
 * @param votes - Array of votes
 * @returns Consensus result
 */
export function calculateConsensus(votes: Vote[]): ConsensusResult {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const votesJson = JSON.stringify(votes)
  const result = coordinator.calculateConsensus(votesJson)

  return JSON.parse(result)
}

/**
 * Get current coordinator status
 * @returns Coordinator status
 */
export function getCoordinatorStatus(): CoordinatorStatus {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const result = coordinator.getCoordinatorStatus()
  return JSON.parse(result)
}

/**
 * Get agent load metrics
 * @returns Agent metrics information
 */
export function getAgentMetrics(): AgentMetrics {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const result = coordinator.getAgentMetrics()
  return JSON.parse(result)
}

/**
 * Balance load across agents
 * @returns Load balancing result
 */
export function balanceLoad(): any {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const result = coordinator.balanceLoad()
  return JSON.parse(result)
}

/**
 * Get task distribution statistics
 * @returns Distribution statistics
 */
export function getDistributionStats(): DistributionStats {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const result = coordinator.getDistributionStats()
  return JSON.parse(result)
}

/**
 * Monitor agent health
 * @param agentId - The agent ID to monitor
 * @returns Health information
 */
export function monitorAgentHealth(agentId: string): any {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const result = coordinator.monitorAgentHealth(agentId)
  return JSON.parse(result)
}

/**
 * Scale agent pool
 * @param action - Scale action details
 * @returns Scaling result
 */
export function scaleAgentPool(action: { action: 'scale_up' | 'scale_down'; count: number }): any {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const actionJson = JSON.stringify(action)
  const result = coordinator.scaleAgentPool(actionJson)

  return JSON.parse(result)
}

/**
 * Perform failover for a failed agent
 * @param failedAgentId - The ID of the failed agent
 * @returns Failover result
 */
export function performFailover(failedAgentId: string): any {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const result = coordinator.performFailover(failedAgentId)
  return JSON.parse(result)
}

/**
 * Get consensus voting history
 * @returns Recent voting records
 */
export function getVotingHistory(): any[] {
  if (!coordinator) {
    throw new Error('Native module not available')
  }

  const result = coordinator.getVotingHistory()
  return JSON.parse(result)
}

/**
 * Create a new DaaPrimeCoordinator instance for advanced use cases
 */
export class DaaPrimeCoordinator {
  private initialized: boolean = false

  /**
   * Create a new DaaPrimeCoordinator instance
   */
  constructor(config?: CoordinatorConfig) {
    if (!coordinator) {
      throw new Error('Native module not available')
    }

    this.initialized = true
    initializeCoordinator(config)
  }

  /**
   * Register an agent
   */
  register(agent: Agent): any {
    return registerAgent(agent)
  }

  /**
   * Get all agents
   */
  getAgents(status?: AgentStatus): Agent[] {
    return getAgents(status)
  }

  /**
   * Distribute a single task
   */
  distribute(task: Task): any {
    return distributeTask(task)
  }

  /**
   * Distribute multiple tasks
   */
  distributeBatch(tasks: Task[]): any[] {
    return distributeTasks(tasks)
  }

  /**
   * Initiate consensus voting
   */
  vote(proposal: Record<string, any>, agentIds: string[]): ConsensusResult {
    return initiateConsensus(proposal, agentIds)
  }

  /**
   * Get coordinator status
   */
  status(): CoordinatorStatus {
    return getCoordinatorStatus()
  }

  /**
   * Get metrics
   */
  metrics(): AgentMetrics {
    return getAgentMetrics()
  }

  /**
   * Balance load
   */
  rebalance(): any {
    return balanceLoad()
  }

  /**
   * Get statistics
   */
  stats(): DistributionStats {
    return getDistributionStats()
  }

  /**
   * Monitor health
   */
  health(agentId: string): any {
    return monitorAgentHealth(agentId)
  }

  /**
   * Scale agents
   */
  scale(action: { action: 'scale_up' | 'scale_down'; count: number }): any {
    return scaleAgentPool(action)
  }

  /**
   * Handle failover
   */
  failover(failedAgentId: string): any {
    return performFailover(failedAgentId)
  }

  /**
   * Get voting history
   */
  history(): any[] {
    return getVotingHistory()
  }
}

// Export all types and functions
export default {
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
  DaaPrimeCoordinator,
}
