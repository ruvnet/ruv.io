# @ruv.io/daa-prime-cli

CLI interface for DAA Prime (Decentralized Autonomous Agents) with command parsing, REPL mode, and configuration management. Built with napi-rs for high-performance native bindings.

## Features

- **Command Parser**: Parse complex command lines with arguments and options
- **REPL Mode**: Interactive Read-Eval-Print-Loop for command execution
- **Command History**: Maintain and manage command execution history
- **Configuration Management**: Flexible configuration with validation
- **Session Management**: Track REPL sessions with unique identifiers
- **Error Handling**: Comprehensive error handling and reporting

## Installation

```bash
pnpm install @ruv.io/daa-prime-cli
```

## Usage

### Basic Example

```typescript
import { CliRunner } from '@ruv.io/daa-prime-cli'

// Create a CLI runner instance
const cli = new CliRunner()

// Parse a command
const command = cli.parseCommand('help')

// Execute the command
const result = cli.executeCommand(command)
console.log(result.output)
```

### Raw Command Execution

```typescript
import { CliRunner } from '@ruv.io/daa-prime-cli'

const cli = new CliRunner()

// Execute raw command line directly
const result = cli.executeRaw('peer add --host=localhost --port=8080 node1')
console.log(result.success) // true
console.log(result.output)
```

### Configuration

```typescript
import { CliRunner, CliConfig } from '@ruv.io/daa-prime-cli'

const config: CliConfig = {
  prompt: 'my-cli> ',
  history_size: 500,
  color_output: true,
  debug_mode: false,
  timeout_ms: 60000,
}

const cli = new CliRunner(config)
```

### Command History

```typescript
import { CliRunner } from '@ruv.io/daa-prime-cli'

const cli = new CliRunner()

cli.executeRaw('help')
cli.executeRaw('version')
cli.executeRaw('status')

const history = cli.getHistory()
console.log(history) // ['help', 'version', 'status']

cli.clearHistory()
```

### REPL Session Management

```typescript
import { CliRunner } from '@ruv.io/daa-prime-cli'

const cli = new CliRunner()

// Get session information
const state = cli.getSessionState()
console.log(state.session_id)
console.log(state.command_count)
console.log(state.last_command)
```

### Configuration Validation

```typescript
import { validateCliConfig, CliConfig } from '@ruv.io/daa-prime-cli'

const config: CliConfig = {
  timeout_ms: 5000,
  history_size: 1000,
}

const result = validateCliConfig(config)
if (result.valid) {
  console.log('Configuration is valid')
} else {
  console.log('Errors:', result.errors)
  console.log('Warnings:', result.warnings)
}
```

### Building Commands Programmatically

```typescript
import { buildCommand } from '@ruv.io/daa-prime-cli'

// Build a command from components
const command = buildCommand('train', ['model1', 'model2'], {
  iterations: '100',
  learning_rate: '0.001',
})

console.log(command.name) // 'train'
console.log(command.args) // ['model1', 'model2']
console.log(command.options) // { iterations: '100', learning_rate: '0.001' }
```

## API Reference

### CliRunner Class

#### Constructor

```typescript
constructor(config?: CliConfig)
```

Create a new CLI runner instance with optional configuration.

#### Methods

- `getConfig(): CliConfig` - Get current CLI configuration
- `parseCommand(commandLine: string): Command` - Parse a command line string
- `executeCommand(command: Command): CommandResult` - Execute a parsed command
- `executeRaw(commandLine: string): CommandResult` - Execute a raw command line
- `getHistory(): string[]` - Get command history
- `clearHistory(): boolean` - Clear command history
- `getSessionState(): ReplSessionState` - Get current session state
- `listCommands(): string[]` - List available commands
- `validateConfig(config: CliConfig): ConfigValidationResult` - Validate configuration

### Standalone Functions

- `parseAndValidateCommand(commandLine: string): Command` - Parse and validate a command
- `buildCommand(name: string, args?: string[], options?: Record<string, string>): Command` - Build a command
- `executeSimpleCommand(commandName: string): CommandResult` - Execute a simple command
- `validateCliConfig(config: CliConfig): ConfigValidationResult` - Validate CLI configuration
- `getDefaultConfig(): CliConfig` - Get default configuration
- `generateSessionId(): string` - Generate a unique session ID

## Interfaces

### CliConfig

```typescript
interface CliConfig {
  prompt?: string // Command prompt (default: 'daa-prime> ')
  history_size?: number // Max command history size (default: 1000)
  color_output?: boolean // Enable colored output (default: true)
  debug_mode?: boolean // Enable debug mode (default: false)
  timeout_ms?: number // Command timeout in ms (default: 30000)
}
```

### Command

```typescript
interface Command {
  name: string // Command name
  args: string[] // Command arguments
  options: Record<string, string> // Command options
}
```

### CommandResult

```typescript
interface CommandResult {
  success: boolean // Command execution success
  output: string // Command output
  error?: string // Error message if failed
  execution_time_ms: number // Execution time in milliseconds
}
```

### ReplSessionState

```typescript
interface ReplSessionState {
  session_id: string // Unique session identifier
  active: boolean // Is session active
  command_count: number // Number of commands executed
  start_time: string // Session start timestamp
  last_command?: string // Last executed command
}
```

## Available Commands

- `help` - Show help message
- `version` - Show version information
- `config` - Show or update configuration
- `peer` - Manage peers
- `model` - Manage models
- `train` - Train models
- `execute` - Execute a script
- `status` - Show system status
- `clear` - Clear history
- `exit` - Exit the CLI

## Testing

Run tests with:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## Build

Build the native bindings:

```bash
pnpm build
```

Build debug version:

```bash
pnpm build:debug
```

## Dependencies

- `@ruv.io/daa-prime-core` - Core shared structures and protocol definitions

## Architecture

The package implements a complete CLI framework with:

1. **Command Parser** - Sophisticated parsing of command lines with support for:
   - Simple commands
   - Arguments
   - Long options (--option=value)
   - Short flags (-v, -d)

2. **Command Executor** - Built-in command execution with:
   - Execution result tracking
   - Timing information
   - Error handling

3. **Session Management** - REPL session tracking with:
   - Unique session IDs
   - Command history
   - Session state queries

4. **Configuration Management** - Flexible configuration system with:
   - Validation
   - Default values
   - Type safety

## License

MIT

## Contributing

See [contributing guidelines](../../CONTRIBUTING.md)

## Support

For issues and questions, visit the [GitHub repository](https://github.com/ruvnet/ruv.io)
