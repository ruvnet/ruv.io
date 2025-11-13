// RUV Swarm Core - TypeScript bindings for the napi-rs module

export interface Config {
  timeout?: number
  retries?: number
  logLevel?: string
  maxConcurrency?: number
  bufferSize?: number
  enableCaching?: boolean
  cacheSize?: number
}

export interface ProcessResult {
  success: boolean
  data: Uint8Array
  processedLength: number
  timestamp: string
}

export interface AgentInitResult {
  agent_id: string
  status: string
  timestamp: string
  success: boolean
}

export interface OrchestrationResult {
  agent_count: number
  strategy: string
  status: string
  timestamp: string
  success: boolean
}

export interface TaskExecutionResult {
  task_id: string
  status: string
  timestamp: string
  success: boolean
}

export interface AgentStatus {
  agent_id: string
  status: string
  timestamp: string
  uptime_ms: number
  tasks_completed: number
  success: boolean
}

export interface BatchProcessItem {
  data: string
  success: boolean
  length: number
}

/**
 * Error class for RUV Swarm Core operations
 */
export class RuvSwarmCoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'RuvSwarmCoreError'
  }
}

/**
 * Native bindings from ruv_swarm_core Rust module
 */
let nativeBindings: any

try {
  // Load the native module via platform loader
  nativeBindings = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native ruv_swarm_core module not loaded. Build the project first.')
  nativeBindings = null
}

/**
 * RUV Swarm Core client for orchestration and agent coordination
 */
export class RuvSwarmCore {
  private client: any

  /**
   * Create a new RuvSwarmCore instance
   * @param config - Configuration options
   */
  constructor(config?: Config) {
    if (!nativeBindings) {
      throw new RuvSwarmCoreError(
        'Native module not available',
        'MODULE_NOT_LOADED'
      )
    }

    try {
      this.client = new nativeBindings.RuvSwarmCore(config)
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Failed to create RuvSwarmCore instance: ${error.message}`,
        'CREATION_FAILED',
        error
      )
    }
  }

  /**
   * Process input data
   * @param data - Input buffer to process
   * @returns Processed buffer
   */
  process(data: Buffer): Buffer {
    if (!this.client) {
      throw new RuvSwarmCoreError(
        'Client not initialized',
        'CLIENT_NOT_INITIALIZED'
      )
    }

    try {
      const encoded = data.toString('base64')
      const result = this.client.process(encoded)
      return Buffer.from(result, 'base64')
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Processing failed: ${error.message}`,
        'PROCESSING_FAILED',
        error
      )
    }
  }

  /**
   * Process input data synchronously
   * @param data - Input buffer to process
   * @returns Processed buffer
   */
  processSync(data: Buffer): Buffer {
    if (!this.client) {
      throw new RuvSwarmCoreError(
        'Client not initialized',
        'CLIENT_NOT_INITIALIZED'
      )
    }

    try {
      const encoded = data.toString('base64')
      const result = this.client.processSync(encoded)
      return Buffer.from(result, 'base64')
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Synchronous processing failed: ${error.message}`,
        'SYNC_PROCESSING_FAILED',
        error
      )
    }
  }

  /**
   * Close the client and release resources
   */
  close(): void {
    if (!this.client) {
      return
    }

    try {
      this.client.close()
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Failed to close client: ${error.message}`,
        'CLOSE_FAILED',
        error
      )
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): Config {
    if (!this.client) {
      throw new RuvSwarmCoreError(
        'Client not initialized',
        'CLIENT_NOT_INITIALIZED'
      )
    }

    try {
      const configJson = this.client.getConfig()
      return JSON.parse(configJson) as Config
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Failed to get config: ${error.message}`,
        'GET_CONFIG_FAILED',
        error
      )
    }
  }

  /**
   * Initialize a swarm agent
   * @param agentId - Unique identifier for the agent
   * @param agentConfig - Agent configuration object
   * @returns Initialization result
   */
  initializeAgent(agentId: string, agentConfig: any): AgentInitResult {
    if (!this.client) {
      throw new RuvSwarmCoreError(
        'Client not initialized',
        'CLIENT_NOT_INITIALIZED'
      )
    }

    try {
      const resultJson = this.client.initializeAgent(
        agentId,
        JSON.stringify(agentConfig)
      )
      return JSON.parse(resultJson) as AgentInitResult
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Failed to initialize agent: ${error.message}`,
        'AGENT_INIT_FAILED',
        error
      )
    }
  }

  /**
   * Orchestrate agents for swarm coordination
   * @param agents - Array of agent definitions
   * @param strategy - Orchestration strategy (e.g., 'distributed', 'centralized')
   * @returns Orchestration result
   */
  orchestrateAgents(agents: any[], strategy: string = 'distributed'): OrchestrationResult {
    if (!this.client) {
      throw new RuvSwarmCoreError(
        'Client not initialized',
        'CLIENT_NOT_INITIALIZED'
      )
    }

    try {
      const resultJson = this.client.orchestrateAgents(
        JSON.stringify(agents),
        strategy
      )
      return JSON.parse(resultJson) as OrchestrationResult
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Failed to orchestrate agents: ${error.message}`,
        'ORCHESTRATION_FAILED',
        error
      )
    }
  }

  /**
   * Execute a distributed task across agents
   * @param task - Task definition object
   * @returns Task execution result
   */
  executeTask(task: any): TaskExecutionResult {
    if (!this.client) {
      throw new RuvSwarmCoreError(
        'Client not initialized',
        'CLIENT_NOT_INITIALIZED'
      )
    }

    try {
      const resultJson = this.client.executeTask(JSON.stringify(task))
      return JSON.parse(resultJson) as TaskExecutionResult
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Failed to execute task: ${error.message}`,
        'TASK_EXECUTION_FAILED',
        error
      )
    }
  }

  /**
   * Get the status of an agent
   * @param agentId - Agent identifier
   * @returns Agent status
   */
  getAgentStatus(agentId: string): AgentStatus {
    if (!this.client) {
      throw new RuvSwarmCoreError(
        'Client not initialized',
        'CLIENT_NOT_INITIALIZED'
      )
    }

    try {
      const resultJson = this.client.getAgentStatus(agentId)
      return JSON.parse(resultJson) as AgentStatus
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Failed to get agent status: ${error.message}`,
        'GET_STATUS_FAILED',
        error
      )
    }
  }

  /**
   * Batch process multiple data items
   * @param items - Array of buffers to process
   * @returns Array of processed items
   */
  batchProcess(items: Buffer[]): BatchProcessItem[] {
    if (!this.client) {
      throw new RuvSwarmCoreError(
        'Client not initialized',
        'CLIENT_NOT_INITIALIZED'
      )
    }

    try {
      // Convert buffers to base64 for JSON serialization
      const itemsData = items.map(item => item.toString('base64'))
      const resultJson = this.client.batchProcess(JSON.stringify(itemsData))
      return JSON.parse(resultJson) as BatchProcessItem[]
    } catch (error: any) {
      throw new RuvSwarmCoreError(
        `Failed to batch process: ${error.message}`,
        'BATCH_PROCESSING_FAILED',
        error
      )
    }
  }
}

/**
 * Convenience functions for common operations
 */

/**
 * Create a new RuvSwarmCore instance and process data
 * @param data - Input buffer
 * @param config - Optional configuration
 * @returns Processed buffer
 */
export function processData(
  data: Buffer,
  config?: Config
): Buffer {
  const client = new RuvSwarmCore(config)
  try {
    return client.process(data)
  } finally {
    client.close()
  }
}

/**
 * Create a new RuvSwarmCore instance and process data synchronously
 * @param data - Input buffer
 * @param config - Optional configuration
 * @returns Processed buffer
 */
export function processDataSync(data: Buffer, config?: Config): Buffer {
  const client = new RuvSwarmCore(config)
  try {
    return client.processSync(data)
  } finally {
    client.close()
  }
}

// Export all types and classes
export default {
  RuvSwarmCore,
  RuvSwarmCoreError,
  processData,
  processDataSync,
}
