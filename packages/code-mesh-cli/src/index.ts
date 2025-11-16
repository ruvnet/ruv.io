// Code Mesh CLI - TypeScript bindings for the napi-rs module

export interface Command {
  name: string
  args?: string[]
  options?: Record<string, any>
}

export interface MeshConfig {
  name: string
  nodes: number
  timeout_ms: number
  verbosity: string
  visualization_enabled?: boolean
}

export interface MeshNode {
  id: string
  address: string
  status: string
  last_heartbeat?: string
}

export interface VisualizationElement {
  node_id: string
  x: number
  y: number
  size: number
  color: string
  connections: string[]
}

export interface CommandExecutionResult {
  command_name: string
  executed_at: string
  status: string
  output: string
  exit_code: number
}

export interface CommandMetadata {
  name: string
  description: string
  category: string
  args: string[]
}

export interface CliStatus {
  version: string
  status: string
  uptime_ms: number
  commands_executed: number
  last_command?: string
  memory_usage_mb: number
}

export interface MeshVisualization {
  format: string
  nodes_count: number
  elements: VisualizationElement[]
  generated_at: string
  dimensions: {
    width: number
    height: number
  }
}

/**
 * Native bindings from code_mesh_cli Rust module
 */
let meshCli: any

try {
  // Load the native module via platform loader
  meshCli = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native code_mesh_cli module not loaded. Build the project first.')
  meshCli = null
}

/**
 * Initialize a new MeshCli instance with configuration
 * @param config - Mesh configuration object
 * @returns Initialization result
 */
export function initializeMeshCli(config: MeshConfig): Record<string, any> {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const result = meshCli.initializeMeshCli(configJson)

  return JSON.parse(result)
}

/**
 * Execute a CLI command
 * @param command - Command object with name and arguments
 * @returns Command execution result
 */
export function executeCommand(command: Command): CommandExecutionResult {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const commandJson = JSON.stringify(command)
  const result = meshCli.executeCommand(commandJson)

  return JSON.parse(result)
}

/**
 * Execute multiple commands in batch
 * @param commands - Array of command objects
 * @returns Array of execution results
 */
export function executeBatchCommands(commands: Command[]): CommandExecutionResult[] {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const commandsJson = JSON.stringify(commands)
  const result = meshCli.executeBatchCommands(commandsJson)

  return JSON.parse(result)
}

/**
 * List available commands
 * @param category - Optional category filter
 * @returns Array of available commands
 */
export function listAvailableCommands(category?: string): CommandMetadata[] {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const result = meshCli.listAvailableCommands(category || null)

  return JSON.parse(result)
}

/**
 * Get help for a specific command
 * @param commandName - Name of the command
 * @returns Help information
 */
export function getCommandHelp(commandName: string): Record<string, any> {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const result = meshCli.getCommandHelp(commandName)

  return JSON.parse(result)
}

/**
 * Generate mesh visualization
 * @param nodes - Array of mesh nodes
 * @param format - Visualization format (e.g., "svg", "json")
 * @returns Visualization data
 */
export function generateMeshVisualization(nodes: MeshNode[], format: string = 'json'): MeshVisualization {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const nodesJson = JSON.stringify(nodes)
  const result = meshCli.generateMeshVisualization(nodesJson, format)

  return JSON.parse(result)
}

/**
 * Get current CLI status
 * @returns Current CLI status
 */
export function getCliStatus(): CliStatus {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const result = meshCli.getCliStatus()

  return JSON.parse(result)
}

/**
 * Configure the CLI
 * @param config - Configuration object
 * @returns Configuration result
 */
export function configureCli(config: MeshConfig): Record<string, any> {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const result = meshCli.configureCli(configJson)

  return JSON.parse(result)
}

/**
 * Export current mesh state
 * @param exportFormat - Format for export (e.g., "json", "yaml")
 * @returns Exported mesh state
 */
export function exportMeshState(exportFormat: string = 'json'): Record<string, any> {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const result = meshCli.exportMeshState(exportFormat)

  return JSON.parse(result)
}

/**
 * Import mesh state
 * @param importData - JSON string with mesh state data
 * @returns Import result
 */
export function importMeshState(importData: Record<string, any>): Record<string, any> {
  if (!meshCli) {
    throw new Error('Native module not available')
  }

  const importDataJson = JSON.stringify(importData)
  const result = meshCli.importMeshState(importDataJson)

  return JSON.parse(result)
}

/**
 * MeshCli class for advanced use cases
 */
export class MeshCli {
  private config: MeshConfig | null = null

  /**
   * Create a new MeshCli instance
   * @param config - Initial mesh configuration
   */
  constructor(config?: MeshConfig) {
    if (!meshCli) {
      throw new Error('Native module not available')
    }

    if (config) {
      this.config = config
      initializeMeshCli(config)
    }
  }

  /**
   * Initialize the mesh CLI with configuration
   */
  initialize(config: MeshConfig): Record<string, any> {
    this.config = config
    return initializeMeshCli(config)
  }

  /**
   * Execute a command
   */
  execute(command: Command): CommandExecutionResult {
    return executeCommand(command)
  }

  /**
   * Execute multiple commands
   */
  executeBatch(commands: Command[]): CommandExecutionResult[] {
    return executeBatchCommands(commands)
  }

  /**
   * List available commands
   */
  listCommands(category?: string): CommandMetadata[] {
    return listAvailableCommands(category)
  }

  /**
   * Get command help
   */
  help(commandName: string): Record<string, any> {
    return getCommandHelp(commandName)
  }

  /**
   * Generate mesh visualization
   */
  visualize(nodes: MeshNode[], format?: string): MeshVisualization {
    return generateMeshVisualization(nodes, format)
  }

  /**
   * Get CLI status
   */
  status(): CliStatus {
    return getCliStatus()
  }

  /**
   * Configure the CLI
   */
  configure(config: MeshConfig): Record<string, any> {
    this.config = config
    return configureCli(config)
  }

  /**
   * Export current state
   */
  export(format?: string): Record<string, any> {
    return exportMeshState(format)
  }

  /**
   * Import mesh state
   */
  import(data: Record<string, any>): Record<string, any> {
    return importMeshState(data)
  }

  /**
   * Get current configuration
   */
  getConfig(): MeshConfig | null {
    return this.config
  }
}

// Export all types and functions
export default {
  initializeMeshCli,
  executeCommand,
  executeBatchCommands,
  listAvailableCommands,
  getCommandHelp,
  generateMeshVisualization,
  getCliStatus,
  configureCli,
  exportMeshState,
  importMeshState,
  MeshCli,
}
