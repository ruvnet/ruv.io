// DAA Prime CLI - TypeScript bindings for napi-rs module

export interface CliConfig {
  prompt?: string
  history_size?: number
  color_output?: boolean
  debug_mode?: boolean
  timeout_ms?: number
}

export interface Command {
  name: string
  args: string[]
  options: Record<string, string>
}

export interface CommandResult {
  success: boolean
  output: string
  error?: string
  execution_time_ms: number
}

export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ReplSessionState {
  session_id: string
  active: boolean
  command_count: number
  start_time: string
  last_command?: string
}

/**
 * Native bindings from daa_prime_cli Rust module
 */
let daaPrimeCli: any

try {
  // Load the native module via platform loader
  daaPrimeCli = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native daa_prime_cli module not loaded. Build the project first.')
  daaPrimeCli = null
}

/**
 * CLI Runner for command parsing and execution
 * Provides command-line interface, REPL mode, and configuration management
 */
export class CliRunner {
  private inner: any

  /**
   * Create a new CLI runner instance
   * @param config - CLI configuration options
   */
  constructor(config?: CliConfig) {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const configJson = config ? JSON.stringify(config) : undefined
    this.inner = new daaPrimeCli.CliRunner(configJson)
  }

  /**
   * Get current CLI configuration
   * @returns Current CLI configuration
   */
  getConfig(): CliConfig {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getConfig()
    return JSON.parse(result)
  }

  /**
   * Parse a command line string into a Command object
   * @param commandLine - Raw command line string
   * @returns Parsed command object
   */
  parseCommand(commandLine: string): Command {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const result = this.inner.parseCommand(commandLine)
    return JSON.parse(result)
  }

  /**
   * Execute a command and return result
   * @param command - Command to execute
   * @returns Execution result
   */
  executeCommand(command: Command): CommandResult {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const commandJson = JSON.stringify(command)
    const result = this.inner.executeCommand(commandJson)
    return JSON.parse(result)
  }

  /**
   * Execute a raw command line
   * @param commandLine - Command line to execute
   * @returns Execution result
   */
  executeRaw(commandLine: string): CommandResult {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const result = this.inner.executeRaw(commandLine)
    return JSON.parse(result)
  }

  /**
   * Get command history
   * @returns Array of previously executed commands
   */
  getHistory(): string[] {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getHistory()
    return JSON.parse(result)
  }

  /**
   * Clear command history
   * @returns True if history was cleared
   */
  clearHistory(): boolean {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    return this.inner.clearHistory()
  }

  /**
   * Get current REPL session state
   * @returns Session state information
   */
  getSessionState(): ReplSessionState {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getSessionState()
    return JSON.parse(result)
  }

  /**
   * List available commands
   * @returns Array of available command names
   */
  listCommands(): string[] {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const result = this.inner.listCommands()
    return JSON.parse(result)
  }

  /**
   * Validate and check configuration
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validateConfig(config: CliConfig): ConfigValidationResult {
    if (!daaPrimeCli) {
      throw new Error('Native module not available')
    }

    const configJson = JSON.stringify(config)
    const result = this.inner.validateConfig(configJson)
    return JSON.parse(result)
  }
}

/**
 * Parse and validate a command line string
 * @param commandLine - Raw command line string
 * @returns Parsed command
 */
export function parseAndValidateCommand(commandLine: string): Command {
  if (!daaPrimeCli) {
    throw new Error('Native module not available')
  }

  const result = daaPrimeCli.parseAndValidateCommand(commandLine)
  return JSON.parse(result)
}

/**
 * Build a command from components
 * @param name - Command name
 * @param args - Command arguments
 * @param options - Command options
 * @returns Built command
 */
export function buildCommand(
  name: string,
  args: string[] = [],
  options: Record<string, string> = {}
): Command {
  if (!daaPrimeCli) {
    throw new Error('Native module not available')
  }

  const argsJson = JSON.stringify(args)
  const optionsJson = JSON.stringify(options)
  const result = daaPrimeCli.buildCommand(name, argsJson, optionsJson)
  return JSON.parse(result)
}

/**
 * Execute a simple command by name
 * @param commandName - Name of command to execute
 * @returns Execution result
 */
export function executeSimpleCommand(commandName: string): CommandResult {
  if (!daaPrimeCli) {
    throw new Error('Native module not available')
  }

  const result = daaPrimeCli.executeSimpleCommand(commandName)
  return JSON.parse(result)
}

/**
 * Validate CLI configuration
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateCliConfig(config: CliConfig): ConfigValidationResult {
  if (!daaPrimeCli) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const result = daaPrimeCli.validateCliConfig(configJson)
  return JSON.parse(result)
}

/**
 * Get default CLI configuration
 * @returns Default configuration
 */
export function getDefaultConfig(): CliConfig {
  if (!daaPrimeCli) {
    throw new Error('Native module not available')
  }

  const result = daaPrimeCli.getDefaultConfig()
  return JSON.parse(result)
}

/**
 * Generate a REPL session ID
 * @returns Generated session ID
 */
export function generateSessionId(): string {
  if (!daaPrimeCli) {
    throw new Error('Native module not available')
  }

  return daaPrimeCli.generateSessionId()
}

// Export all types and classes
export default {
  CliRunner,
  parseAndValidateCommand,
  buildCommand,
  executeSimpleCommand,
  validateCliConfig,
  getDefaultConfig,
  generateSessionId,
}
