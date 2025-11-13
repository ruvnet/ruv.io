// Code Mesh Core - Distributed Swarm Intelligence Engine
// TypeScript bindings for the napi-rs module

export interface MeshNode {
  id: string
  address: string
  capacity: number
  status: string
  metadata?: Record<string, any>
}

export interface SwarmTask {
  id: string
  code: string
  priority: number
  timeout_ms: number
  metadata?: Record<string, any>
}

export interface SwarmConfig {
  max_nodes?: number
  max_concurrent_tasks?: number
  task_timeout_ms?: number
  heartbeat_interval_ms?: number
}

export interface SwarmInfo {
  id: string
  initialized_at: string
  nodes_count: number
  tasks_count: number
  config: SwarmConfig
  status: string
}

export interface NodeRegistrationResult {
  node_id: string
  registered_at: string
  status: string
  message: string
}

export interface NodeRemovalResult {
  node_id: string
  removed_at: string
  status: string
  message: string
}

export interface TaskSubmissionResult {
  task_id: string
  submitted_at: string
  status: string
  execution_queue_position: number
}

export interface TaskExecutionResult {
  task_id: string
  executed_at: string
  status: string
  output: string
  duration_ms: number
}

export interface SwarmStatus {
  timestamp: string
  nodes_count: number
  active_tasks: number
  completed_tasks: number
  failed_tasks: number
  total_capacity: number
  available_capacity: number
  health: string
}

export interface DistributionResult {
  total_tasks: number
  distributed_tasks: number
  strategy: string
  distributed_at: string
  status: string
}

export interface TaskHistory {
  node_id: string
  total_executed: number
  total_failed: number
  total_duration_ms: number
  last_execution?: string
}

export interface HealthCheckResult {
  node_id: string
  checked_at: string
  status: string
  response_time_ms: number
  memory_usage_percent: number
  cpu_usage_percent: number
}

export interface LoadBalancingResult {
  strategy: string
  rebalanced_at: string
  nodes_affected: number
  tasks_moved: number
  status: string
}

/**
 * Native bindings from code_mesh_core Rust module
 */
let meshCore: any

try {
  // Load the native module via platform loader
  meshCore = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native code_mesh_core module not loaded. Build the project first.')
  meshCore = null
}

/**
 * Initialize a new swarm mesh with configuration
 * @param config - Swarm configuration options
 * @returns Swarm initialization info
 */
export function initializeSwarm(config?: SwarmConfig): SwarmInfo {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const configJson = config ? JSON.stringify(config) : undefined
  const result = meshCore.initializeSwarm(configJson)

  return JSON.parse(result)
}

/**
 * Add a node to the swarm mesh
 * @param node - Node to add to the swarm
 * @returns Node registration result
 */
export function addNode(node: MeshNode): NodeRegistrationResult {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const nodeJson = JSON.stringify(node)
  const result = meshCore.addNode(nodeJson)

  return JSON.parse(result)
}

/**
 * Remove a node from the swarm mesh
 * @param nodeId - ID of the node to remove
 * @returns Node removal result
 */
export function removeNode(nodeId: string): NodeRemovalResult {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const result = meshCore.removeNode(nodeId)

  return JSON.parse(result)
}

/**
 * Submit a task to the swarm for execution
 * @param task - Task to submit
 * @returns Task submission result
 */
export function submitTask(task: SwarmTask): TaskSubmissionResult {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const taskJson = JSON.stringify(task)
  const result = meshCore.submitTask(taskJson)

  return JSON.parse(result)
}

/**
 * Execute a task on the swarm
 * @param task - Task to execute
 * @returns Task execution result
 */
export function executeTask(task: SwarmTask): TaskExecutionResult {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const taskJson = JSON.stringify(task)
  const result = meshCore.executeTask(taskJson)

  return JSON.parse(result)
}

/**
 * Get the status of the swarm mesh
 * @returns Current swarm status
 */
export function getSwarmStatus(): SwarmStatus {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const result = meshCore.getSwarmStatus()

  return JSON.parse(result)
}

/**
 * Distribute tasks across the swarm
 * @param tasks - Tasks to distribute
 * @param strategy - Distribution strategy
 * @returns Distribution result
 */
export function distributeTasks(tasks: SwarmTask[], strategy: string = 'balanced'): DistributionResult {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const tasksJson = JSON.stringify(tasks)
  const result = meshCore.distributeTasks(tasksJson, strategy)

  return JSON.parse(result)
}

/**
 * Get task execution history for a node
 * @param nodeId - ID of the node
 * @returns Task history information
 */
export function getTaskHistory(nodeId: string): TaskHistory {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const result = meshCore.getTaskHistory(nodeId)

  return JSON.parse(result)
}

/**
 * Perform health check on a node
 * @param nodeId - ID of the node to check
 * @returns Health check result
 */
export function healthCheck(nodeId: string): HealthCheckResult {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const result = meshCore.healthCheck(nodeId)

  return JSON.parse(result)
}

/**
 * Balance load across swarm nodes
 * @param strategy - Load balancing strategy
 * @returns Load balancing result
 */
export function balanceLoad(strategy: string = 'even-distribution'): LoadBalancingResult {
  if (!meshCore) {
    throw new Error('Native module not available')
  }

  const result = meshCore.balanceLoad(strategy)

  return JSON.parse(result)
}

/**
 * Create a new CodeMeshCore instance for advanced use cases
 */
export class CodeMeshCore {
  /**
   * Create a new CodeMeshCore instance
   */
  constructor() {
    if (!meshCore) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Initialize the swarm mesh
   */
  initSwarm(config?: SwarmConfig): SwarmInfo {
    return initializeSwarm(config)
  }

  /**
   * Add a node to the mesh
   */
  addNodeToMesh(node: MeshNode): NodeRegistrationResult {
    return addNode(node)
  }

  /**
   * Remove a node from the mesh
   */
  removeNodeFromMesh(nodeId: string): NodeRemovalResult {
    return removeNode(nodeId)
  }

  /**
   * Submit a task to the swarm
   */
  submit(task: SwarmTask): TaskSubmissionResult {
    return submitTask(task)
  }

  /**
   * Execute a task on the swarm
   */
  execute(task: SwarmTask): TaskExecutionResult {
    return executeTask(task)
  }

  /**
   * Get current swarm status
   */
  getStatus(): SwarmStatus {
    return getSwarmStatus()
  }

  /**
   * Distribute multiple tasks
   */
  distribute(tasks: SwarmTask[], strategy?: string): DistributionResult {
    return distributeTasks(tasks, strategy)
  }

  /**
   * Get execution history for a node
   */
  getHistory(nodeId: string): TaskHistory {
    return getTaskHistory(nodeId)
  }

  /**
   * Check node health
   */
  check(nodeId: string): HealthCheckResult {
    return healthCheck(nodeId)
  }

  /**
   * Balance load across nodes
   */
  balance(strategy?: string): LoadBalancingResult {
    return balanceLoad(strategy)
  }
}

// Export all types and functions
export default {
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
  CodeMeshCore,
}
