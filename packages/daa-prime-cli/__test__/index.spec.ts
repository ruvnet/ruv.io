import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  CliRunner,
  CliConfig,
  Command,
  CommandResult,
  ConfigValidationResult,
  ReplSessionState,
  parseAndValidateCommand,
  buildCommand,
  executeSimpleCommand,
  validateCliConfig,
  getDefaultConfig,
  generateSessionId,
} from '../src/index'

describe('DAA Prime CLI - Command Parsing and Execution', () => {
  let cliRunner: CliRunner

  beforeAll(() => {
    cliRunner = new CliRunner()
  })

  describe('CliRunner Initialization', () => {
    it('should create a CliRunner instance with default config', () => {
      expect(cliRunner).toBeDefined()
    })

    it('should create a CliRunner with custom config', () => {
      const config: CliConfig = {
        prompt: 'custom> ',
        history_size: 500,
        color_output: false,
        debug_mode: true,
        timeout_ms: 60000,
      }
      const runner = new CliRunner(config)
      expect(runner).toBeDefined()
    })

    it('should get configuration from runner', () => {
      const config = cliRunner.getConfig()
      expect(config).toBeDefined()
      expect(config.prompt).toBe('daa-prime> ')
    })

    it('should have default configuration values', () => {
      const config = cliRunner.getConfig()
      expect(config.history_size).toBe(1000)
      expect(config.color_output).toBe(true)
      expect(config.debug_mode).toBe(false)
      expect(config.timeout_ms).toBe(30000)
    })
  })

  describe('Command Parsing', () => {
    it('should parse simple command', () => {
      const command = cliRunner.parseCommand('help')
      expect(command.name).toBe('help')
      expect(command.args).toHaveLength(0)
      expect(command.options).toEqual({})
    })

    it('should parse command with arguments', () => {
      const command = cliRunner.parseCommand('train model1 model2')
      expect(command.name).toBe('train')
      expect(command.args).toContain('model1')
      expect(command.args).toContain('model2')
    })

    it('should parse command with long options', () => {
      const command = cliRunner.parseCommand('train --model=model1 --iterations=100')
      expect(command.name).toBe('train')
      expect(command.options).toHaveProperty('model')
      expect(command.options).toHaveProperty('iterations')
    })

    it('should parse command with short flags', () => {
      const command = cliRunner.parseCommand('execute -v -d script.ts')
      expect(command.name).toBe('execute')
      expect(command.options.v).toBe('true')
      expect(command.options.d).toBe('true')
    })

    it('should parse complex command line', () => {
      const command = cliRunner.parseCommand('peer add --host=localhost --port=8080 node1')
      expect(command.name).toBe('peer')
      expect(command.args).toContain('node1')
      expect(command.options.host).toBe('localhost')
      expect(command.options.port).toBe('8080')
    })

    it('should handle command with many arguments', () => {
      const command = cliRunner.parseCommand('execute arg1 arg2 arg3 arg4 arg5')
      expect(command.args).toHaveLength(5)
    })

    it('should parse and validate command', () => {
      const command = parseAndValidateCommand('config show')
      expect(command.name).toBe('config')
      expect(command.args).toContain('show')
    })
  })

  describe('Command Execution', () => {
    it('should execute help command', () => {
      const command = cliRunner.parseCommand('help')
      const result = cliRunner.executeCommand(command)

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
      expect(result.output.length).toBeGreaterThan(0)
    })

    it('should execute version command', () => {
      const command = cliRunner.parseCommand('version')
      const result = cliRunner.executeCommand(command)

      expect(result.success).toBe(true)
      expect(result.output).toContain('1.0.0')
    })

    it('should execute status command', () => {
      const command = cliRunner.parseCommand('status')
      const result = cliRunner.executeCommand(command)

      expect(result.success).toBe(true)
      expect(result.output).toContain('OK')
    })

    it('should handle unknown command', () => {
      const command = cliRunner.parseCommand('unknown_command')
      const result = cliRunner.executeCommand(command)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Unknown command')
    })

    it('should execute raw command', () => {
      const result = cliRunner.executeRaw('version')

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
    })

    it('should execute simple command', () => {
      const result = executeSimpleCommand('help')

      expect(result.success).toBe(true)
      expect(result.output).toBeDefined()
    })

    it('should return execution time', () => {
      const command = cliRunner.parseCommand('status')
      const result = cliRunner.executeCommand(command)

      expect(result.execution_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should handle command with options', () => {
      const command = cliRunner.parseCommand('config --debug=true')
      const result = cliRunner.executeCommand(command)

      expect(result.success).toBe(true)
    })
  })

  describe('Command Building', () => {
    it('should build command from components', () => {
      const command = buildCommand('train', ['model1'], { iterations: '100' })

      expect(command.name).toBe('train')
      expect(command.args).toContain('model1')
      expect(command.options.iterations).toBe('100')
    })

    it('should build command with empty args and options', () => {
      const command = buildCommand('help')

      expect(command.name).toBe('help')
      expect(command.args).toHaveLength(0)
      expect(Object.keys(command.options)).toHaveLength(0)
    })

    it('should build command with multiple arguments', () => {
      const command = buildCommand('execute', ['arg1', 'arg2', 'arg3'])

      expect(command.args).toHaveLength(3)
    })
  })

  describe('Command History', () => {
    let runner: CliRunner

    beforeEach(() => {
      runner = new CliRunner()
    })

    it('should start with empty history', () => {
      const history = runner.getHistory()
      expect(history).toHaveLength(0)
    })

    it('should add command to history', () => {
      runner.executeRaw('help')
      const history = runner.getHistory()

      expect(history.length).toBeGreaterThan(0)
      expect(history).toContain('help')
    })

    it('should maintain command history order', () => {
      runner.executeRaw('help')
      runner.executeRaw('version')
      runner.executeRaw('status')
      const history = runner.getHistory()

      expect(history[0]).toBe('help')
      expect(history[1]).toBe('version')
      expect(history[2]).toBe('status')
    })

    it('should clear command history', () => {
      runner.executeRaw('help')
      runner.executeRaw('version')
      runner.clearHistory()
      const history = runner.getHistory()

      expect(history).toHaveLength(0)
    })

    it('should respect history size limit', () => {
      const largeRunner = new CliRunner({
        history_size: 5,
      })

      for (let i = 0; i < 10; i++) {
        largeRunner.executeRaw('help')
      }

      const history = largeRunner.getHistory()
      expect(history.length).toBeLessThanOrEqual(5)
    })
  })

  describe('REPL Session Management', () => {
    it('should get session state', () => {
      const state = cliRunner.getSessionState()

      expect(state.session_id).toBeDefined()
      expect(state.active).toBe(true)
      expect(state.command_count).toBeGreaterThanOrEqual(0)
      expect(state.start_time).toBeDefined()
    })

    it('should have unique session IDs', () => {
      const runner1 = new CliRunner()
      const runner2 = new CliRunner()

      const state1 = runner1.getSessionState()
      const state2 = runner2.getSessionState()

      expect(state1.session_id).not.toBe(state2.session_id)
    })

    it('should increment command count', () => {
      const runner = new CliRunner()
      const initialState = runner.getSessionState()
      const initialCount = initialState.command_count

      runner.executeRaw('help')
      const newState = runner.getSessionState()

      expect(newState.command_count).toBeGreaterThan(initialCount)
    })

    it('should track last command', () => {
      const runner = new CliRunner()
      runner.executeRaw('help')
      const state = runner.getSessionState()

      expect(state.last_command).toBe('help')
    })

    it('should generate unique session ID', () => {
      const id1 = generateSessionId()
      const id2 = generateSessionId()

      expect(id1).not.toBe(id2)
      expect(id1).toBeDefined()
    })
  })

  describe('Available Commands', () => {
    it('should list available commands', () => {
      const commands = cliRunner.listCommands()

      expect(Array.isArray(commands)).toBe(true)
      expect(commands.length).toBeGreaterThan(0)
      expect(commands).toContain('help')
      expect(commands).toContain('version')
      expect(commands).toContain('config')
    })

    it('should include all standard commands', () => {
      const commands = cliRunner.listCommands()

      const expectedCommands = ['help', 'version', 'config', 'peer', 'model', 'status']
      expectedCommands.forEach((cmd) => {
        expect(commands).toContain(cmd)
      })
    })
  })

  describe('Configuration Management', () => {
    it('should get default configuration', () => {
      const config = getDefaultConfig()

      expect(config).toBeDefined()
      expect(config.prompt).toBe('daa-prime> ')
      expect(config.history_size).toBe(1000)
    })

    it('should validate valid configuration', () => {
      const config: CliConfig = {
        prompt: 'test> ',
        history_size: 100,
        timeout_ms: 5000,
      }
      const result = validateCliConfig(config)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid timeout', () => {
      const config: CliConfig = {
        timeout_ms: 0,
      }
      const result = validateCliConfig(config)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should warn about very small timeout', () => {
      const config: CliConfig = {
        timeout_ms: 50,
      }
      const result = validateCliConfig(config)

      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should validate runner configuration', () => {
      const config: CliConfig = {
        prompt: 'cli> ',
        history_size: 200,
        timeout_ms: 10000,
      }
      const result = cliRunner.validateConfig(config)

      expect(result.valid).toBe(true)
    })
  })

  describe('Integration Tests', () => {
    let runner: CliRunner

    beforeEach(() => {
      runner = new CliRunner()
    })

    it('should execute multiple commands sequentially', () => {
      const result1 = runner.executeRaw('help')
      expect(result1.success).toBe(true)

      const result2 = runner.executeRaw('version')
      expect(result2.success).toBe(true)

      const result3 = runner.executeRaw('status')
      expect(result3.success).toBe(true)

      const history = runner.getHistory()
      expect(history).toContain('help')
      expect(history).toContain('version')
      expect(history).toContain('status')
    })

    it('should handle complete REPL workflow', () => {
      // Get initial state
      const initialState = runner.getSessionState()
      expect(initialState.active).toBe(true)

      // Parse and execute commands
      const cmd1 = runner.parseCommand('help')
      const result1 = runner.executeCommand(cmd1)
      expect(result1.success).toBe(true)

      const cmd2 = runner.parseCommand('config')
      const result2 = runner.executeCommand(cmd2)
      expect(result2.success).toBe(true)

      // Check final state
      const finalState = runner.getSessionState()
      expect(finalState.command_count).toBeGreaterThan(initialState.command_count)
      expect(finalState.session_id).toBe(initialState.session_id)
    })

    it('should maintain state across operations', () => {
      runner.executeRaw('help')
      const state1 = runner.getSessionState()

      runner.executeRaw('version')
      const state2 = runner.getSessionState()

      // Command count should increase
      expect(state2.command_count).toBeGreaterThan(state1.command_count)

      // Session ID should remain the same
      expect(state2.session_id).toBe(state1.session_id)
    })

    it('should handle rapid command execution', () => {
      for (let i = 0; i < 10; i++) {
        const result = runner.executeRaw(`peer add peer${i}`)
        expect(result).toBeDefined()
      }

      const history = runner.getHistory()
      expect(history.length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed command gracefully', () => {
      expect(() => {
        cliRunner.parseCommand('')
      }).toThrow()
    })

    it('should return error for train without model', () => {
      const command = cliRunner.parseCommand('train')
      const result = cliRunner.executeCommand(command)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should return error for execute without script', () => {
      const command = cliRunner.parseCommand('execute')
      const result = cliRunner.executeCommand(command)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle commands with special characters', () => {
      const command = cliRunner.parseCommand('execute "script-with-dashes.ts"')
      expect(command).toBeDefined()
      expect(command.name).toBe('execute')
    })
  })

  describe('Performance and Limits', () => {
    it('should handle very long command line', () => {
      const longArgs = Array(100).fill('arg').join(' ')
      const command = cliRunner.parseCommand(`execute ${longArgs}`)

      expect(command.args.length).toBeGreaterThan(90)
    })

    it('should execute command within timeout', () => {
      const result = cliRunner.executeRaw('status')

      expect(result.execution_time_ms).toBeLessThan(30000)
    })

    it('should handle many options', () => {
      let cmdLine = 'execute'
      for (let i = 0; i < 20; i++) {
        cmdLine += ` --opt${i}=value${i}`
      }

      const command = cliRunner.parseCommand(cmdLine)
      expect(Object.keys(command.options).length).toBeGreaterThan(15)
    })
  })
})
