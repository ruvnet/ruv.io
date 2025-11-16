// RUV Swarm CLI - Command-line interface for swarm management
// TypeScript bindings for the napi-rs module

export interface CliConfig {
  verbose?: boolean
  output_format?: string
  timeout?: number
  log_level?: string
  max_agents?: number
  enable_monitoring?: boolean
}

export interface Command {
  name: string
  args: Record<string, any>
  options?: Record<string, any>
}

export interface SwarmStatus {
  id: string
  active_agents: number
  total_agents: number
  status: string
  uptime_seconds: number
  operations_count: number
  last_heartbeat: string
  health_score: number
}

export interface CommandResult {
  success: boolean
  message?: string
  data?: any
  timestamp: string
}

export interface MonitoringData {
  success: boolean
  total_swarms: number
  total_agents: number
  active_agents: number
  avg_health_score: number
  total_operations: number
  swarms: SwarmStatus[]
  timestamp: string
}

/**
 * Native bindings from ruv_swarm_cli Rust module
 */
let cliRunner: any

try {
  // Load the native module via platform loader
  cliRunner = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native ruv_swarm_cli module not loaded. Build the project first.')
  cliRunner = null
}

/**
 * CLI Runner for executing swarm commands
 */
export class RuvSwarmCli {
  private instance: any

  /**
   * Create a new RuvSwarmCli instance
   */
  constructor(config?: CliConfig) {
    if (!cliRunner) {
      throw new Error('Native module not available')
    }

    try {
      this.instance = new cliRunner.CliRunner(config || {})
    } catch (e) {
      throw new Error(`Failed to create CLI Runner: ${e}`)
    }
  }

  /**
   * Execute a command
   * @param command - Command object to execute
   * @returns Command execution result
   */
  execute(command: Command): CommandResult {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const commandJson = JSON.stringify(command)
    const result = this.instance.executeCommand(commandJson)

    return JSON.parse(result)
  }

  /**
   * Initialize a swarm with configuration
   * @param swarmId - Unique identifier for the swarm
   * @param config - Swarm configuration
   * @returns Initialization result
   */
  initializeSwarm(swarmId: string, config?: Record<string, any>): CommandResult {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const configJson = JSON.stringify(config || { num_agents: 5 })
    const result = this.instance.initializeSwarm(swarmId, configJson)

    return JSON.parse(result)
  }

  /**
   * Start a swarm
   * @param swarmId - ID of swarm to start
   * @returns Start result
   */
  startSwarm(swarmId: string): CommandResult {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.startSwarm(swarmId)
    return JSON.parse(result)
  }

  /**
   * Stop a swarm
   * @param swarmId - ID of swarm to stop
   * @returns Stop result
   */
  stopSwarm(swarmId: string): CommandResult {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.stopSwarm(swarmId)
    return JSON.parse(result)
  }

  /**
   * Get status of a swarm
   * @param swarmId - ID of swarm to get status for
   * @returns Swarm status
   */
  getSwarmStatus(swarmId: string): SwarmStatus {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.getSwarmStatus(swarmId)
    return JSON.parse(result)
  }

  /**
   * List all swarms
   * @returns List of all swarms
   */
  listSwarms(): CommandResult {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.listSwarms()
    return JSON.parse(result)
  }

  /**
   * Deploy configuration to a swarm
   * @param swarmId - ID of target swarm
   * @param config - Configuration to deploy
   * @returns Deployment result
   */
  deployConfig(swarmId: string, config: Record<string, any>): CommandResult {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const configJson = JSON.stringify(config)
    const result = this.instance.deployConfig(swarmId, configJson)
    return JSON.parse(result)
  }

  /**
   * Scale swarm to specified agent count
   * @param swarmId - ID of swarm to scale
   * @param agentCount - Target number of agents
   * @returns Scale result
   */
  scaleSwarm(swarmId: string, agentCount: number): CommandResult {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.scaleSwarm(swarmId, agentCount)
    return JSON.parse(result)
  }

  /**
   * Get monitoring data
   * @returns Monitoring data for all swarms
   */
  getMonitoringData(): MonitoringData {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.getMonitoringData()
    return JSON.parse(result)
  }

  /**
   * Get CLI configuration
   * @returns Current CLI configuration
   */
  getConfig(): CliConfig {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.getConfig()
    return JSON.parse(result)
  }

  /**
   * Get command history
   * @param limit - Maximum number of history entries to return
   * @returns Command history
   */
  getHistory(limit: number = 50): string[] {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.getHistory(limit)
    const parsed = JSON.parse(result)
    return parsed.history || []
  }

  /**
   * Clear command history
   * @returns Clear result
   */
  clearHistory(): CommandResult {
    if (!this.instance) {
      throw new Error('CLI Runner not initialized')
    }

    const result = this.instance.clearHistory()
    return JSON.parse(result)
  }

  /**
   * Execute a start command with shorthand
   * @param swarmId - ID of swarm to start
   * @returns Start result
   */
  start(swarmId: string): CommandResult {
    return this.execute({
      name: 'start',
      args: { swarm_id: swarmId },
    })
  }

  /**
   * Execute a stop command with shorthand
   * @param swarmId - ID of swarm to stop
   * @returns Stop result
   */
  stop(swarmId: string): CommandResult {
    return this.execute({
      name: 'stop',
      args: { swarm_id: swarmId },
    })
  }

  /**
   * Execute a status command with shorthand
   * @param swarmId - Optional swarm ID for specific status
   * @returns Status result
   */
  status(swarmId?: string): CommandResult {
    return this.execute({
      name: 'status',
      args: swarmId ? { swarm_id: swarmId } : {},
    })
  }

  /**
   * Execute a health check command
   * @param swarmId - Optional swarm ID for specific health check
   * @returns Health check result
   */
  health(swarmId?: string): CommandResult {
    return this.execute({
      name: 'health',
      args: swarmId ? { swarm_id: swarmId } : {},
    })
  }

  /**
   * Get logs for a swarm
   * @param swarmId - ID of swarm to get logs for
   * @returns Logs result
   */
  getLogs(swarmId: string): CommandResult {
    return this.execute({
      name: 'logs',
      args: { swarm_id: swarmId },
    })
  }

  /**
   * Initialize CLI
   * @returns Initialization result
   */
  init(): CommandResult {
    return this.execute({
      name: 'init',
      args: {},
    })
  }

  /**
   * List all swarms (shorthand)
   * @returns List result
   */
  list(): CommandResult {
    return this.execute({
      name: 'list',
      args: {},
    })
  }

  /**
   * Get current configuration (shorthand)
   * @returns Configuration result
   */
  config(): CommandResult {
    return this.execute({
      name: 'config',
      args: {},
    })
  }
}

// Export all types and classes
export default {
  RuvSwarmCli,
}
