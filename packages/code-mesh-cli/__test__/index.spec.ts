import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  MeshCli,
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
  Command,
  MeshConfig,
  MeshNode,
  CommandMetadata,
  CliStatus,
  MeshVisualization,
} from '../src/index'

describe('Code Mesh CLI - Main Operations', () => {
  const sampleConfig: MeshConfig = {
    name: 'test-mesh',
    nodes: 5,
    timeout_ms: 5000,
    verbosity: 'info',
    visualization_enabled: true,
  }

  const sampleCommand: Command = {
    name: 'mesh',
    args: ['status'],
    options: { verbose: true },
  }

  const sampleNodes: MeshNode[] = [
    {
      id: 'node-001',
      address: '192.168.1.1:8080',
      status: 'active',
      last_heartbeat: Date.now().toString(),
    },
    {
      id: 'node-002',
      address: '192.168.1.2:8080',
      status: 'active',
      last_heartbeat: Date.now().toString(),
    },
    {
      id: 'node-003',
      address: '192.168.1.3:8080',
      status: 'inactive',
      last_heartbeat: Date.now().toString(),
    },
  ]

  describe('initializeMeshCli', () => {
    it('should initialize mesh CLI with config', () => {
      const result = initializeMeshCli(sampleConfig)

      expect(result).toBeDefined()
      expect(result.cli_id).toBeDefined()
      expect(result.mesh_name).toBe('test-mesh')
      expect(result.nodes_count).toBe(5)
      expect(result.status).toBe('initialized')
      expect(result.version).toBe('1.0.0')
    })

    it('should set correct initialization timestamp', () => {
      const result = initializeMeshCli(sampleConfig)

      expect(result.initialized_at).toBeDefined()
      expect(typeof result.initialized_at).toBe('string')
    })

    it('should handle configuration with different node counts', () => {
      const configWith10Nodes: MeshConfig = {
        ...sampleConfig,
        nodes: 10,
      }

      const result = initializeMeshCli(configWith10Nodes)

      expect(result.nodes_count).toBe(10)
    })

    it('should handle configuration with different timeout values', () => {
      const configWith10sTimeout: MeshConfig = {
        ...sampleConfig,
        timeout_ms: 10000,
      }

      const result = initializeMeshCli(configWith10sTimeout)

      expect(result).toBeDefined()
      expect(result.status).toBe('initialized')
    })
  })

  describe('executeCommand', () => {
    it('should execute a command and return result', () => {
      const result = executeCommand(sampleCommand)

      expect(result).toBeDefined()
      expect(result.command_name).toBe('mesh')
      expect(result.executed_at).toBeDefined()
      expect(result.status).toBe('completed')
      expect(result.output).toBeDefined()
      expect(result.exit_code).toBe(0)
    })

    it('should handle command without args', () => {
      const commandWithoutArgs: Command = {
        name: 'config',
      }

      const result = executeCommand(commandWithoutArgs)

      expect(result).toBeDefined()
      expect(result.command_name).toBe('config')
      expect(result.exit_code).toBe(0)
    })

    it('should handle command with multiple args', () => {
      const complexCommand: Command = {
        name: 'mesh',
        args: ['add-node', 'node-new', '192.168.1.10:8080'],
        options: { verbose: true, force: true },
      }

      const result = executeCommand(complexCommand)

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })

    it('should include proper timestamp in execution result', () => {
      const result = executeCommand(sampleCommand)

      expect(result.executed_at).toBeDefined()
      expect(typeof result.executed_at).toBe('string')
    })

    it('should handle viz command execution', () => {
      const vizCommand: Command = {
        name: 'viz',
        args: ['generate'],
      }

      const result = executeCommand(vizCommand)

      expect(result).toBeDefined()
      expect(result.command_name).toBe('viz')
    })
  })

  describe('executeBatchCommands', () => {
    it('should execute multiple commands', () => {
      const commands: Command[] = [
        { name: 'mesh', args: ['init'] },
        { name: 'config', args: ['set', 'timeout', '5000'] },
        { name: 'viz', args: ['generate'] },
      ]

      const results = executeBatchCommands(commands)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(3)
      results.forEach((result) => {
        expect(result.status).toBe('completed')
        expect(result.exit_code).toBe(0)
      })
    })

    it('should execute batch with single command', () => {
      const commands: Command[] = [{ name: 'mesh', args: ['status'] }]

      const results = executeBatchCommands(commands)

      expect(results.length).toBe(1)
      expect(results[0].command_name).toBe('mesh')
    })

    it('should handle empty batch gracefully', () => {
      const commands: Command[] = []

      const results = executeBatchCommands(commands)

      expect(Array.isArray(results)).toBe(true)
    })

    it('should preserve command order in results', () => {
      const commands: Command[] = [
        { name: 'config' },
        { name: 'mesh' },
        { name: 'viz' },
      ]

      const results = executeBatchCommands(commands)

      expect(results[0].command_name).toBe('config')
      expect(results[1].command_name).toBe('mesh')
      expect(results[2].command_name).toBe('viz')
    })
  })

  describe('listAvailableCommands', () => {
    it('should list all available commands', () => {
      const commands = listAvailableCommands()

      expect(Array.isArray(commands)).toBe(true)
      expect(commands.length).toBeGreaterThan(0)
      expect(commands[0].name).toBeDefined()
      expect(commands[0].description).toBeDefined()
      expect(commands[0].category).toBeDefined()
    })

    it('should filter commands by category', () => {
      const meshCommands = listAvailableCommands('mesh')

      expect(Array.isArray(meshCommands)).toBe(true)
      meshCommands.forEach((cmd: CommandMetadata) => {
        expect(cmd.category).toBe('mesh')
      })
    })

    it('should list mesh commands', () => {
      const meshCommands = listAvailableCommands('mesh')

      expect(meshCommands.length).toBeGreaterThan(0)
      const hasInitCommand = meshCommands.some((cmd: CommandMetadata) =>
        cmd.name.includes('init')
      )
      expect(hasInitCommand).toBe(true)
    })

    it('should list config commands', () => {
      const configCommands = listAvailableCommands('config')

      expect(Array.isArray(configCommands)).toBe(true)
      expect(configCommands.length).toBeGreaterThan(0)
    })

    it('should list visualization commands', () => {
      const vizCommands = listAvailableCommands('viz')

      expect(Array.isArray(vizCommands)).toBe(true)
      expect(vizCommands.length).toBeGreaterThan(0)
    })

    it('should include command arguments', () => {
      const commands = listAvailableCommands()

      const commandWithArgs = commands.find((cmd: CommandMetadata) => cmd.args.length > 0)
      expect(commandWithArgs).toBeDefined()
    })
  })

  describe('getCommandHelp', () => {
    it('should get help for a command', () => {
      const help = getCommandHelp('mesh')

      expect(help).toBeDefined()
      expect(help.command).toBe('mesh')
      expect(help.description).toBeDefined()
      expect(help.usage).toBeDefined()
    })

    it('should include options in help', () => {
      const help = getCommandHelp('config')

      expect(help.options).toBeDefined()
      expect(Array.isArray(help.options)).toBe(true)
    })

    it('should include examples in help', () => {
      const help = getCommandHelp('mesh')

      expect(help.examples).toBeDefined()
      expect(Array.isArray(help.examples)).toBe(true)
      expect(help.examples.length).toBeGreaterThan(0)
    })

    it('should provide usage information', () => {
      const help = getCommandHelp('status')

      expect(help.usage).toBeDefined()
      expect(help.usage.includes('mesh-cli')).toBe(true)
    })
  })

  describe('generateMeshVisualization', () => {
    it('should generate visualization for nodes', () => {
      const viz = generateMeshVisualization(sampleNodes)

      expect(viz).toBeDefined()
      expect(viz.format).toBe('json')
      expect(viz.nodes_count).toBe(3)
      expect(Array.isArray(viz.elements)).toBe(true)
      expect(viz.elements.length).toBe(3)
    })

    it('should generate visualization with custom format', () => {
      const viz = generateMeshVisualization(sampleNodes, 'svg')

      expect(viz.format).toBe('svg')
      expect(viz.nodes_count).toBe(3)
    })

    it('should include visualization dimensions', () => {
      const viz = generateMeshVisualization(sampleNodes)

      expect(viz.dimensions).toBeDefined()
      expect(viz.dimensions.width).toBe(400)
      expect(viz.dimensions.height).toBe(400)
    })

    it('should include generated timestamp', () => {
      const viz = generateMeshVisualization(sampleNodes)

      expect(viz.generated_at).toBeDefined()
      expect(typeof viz.generated_at).toBe('string')
    })

    it('should include visualization elements with positions', () => {
      const viz = generateMeshVisualization(sampleNodes)

      viz.elements.forEach((element) => {
        expect(element.node_id).toBeDefined()
        expect(typeof element.x).toBe('number')
        expect(typeof element.y).toBe('number')
        expect(typeof element.size).toBe('number')
        expect(element.color).toBeDefined()
      })
    })

    it('should set correct color for active nodes', () => {
      const viz = generateMeshVisualization(sampleNodes)

      const activeNodeViz = viz.elements.find((e) => e.node_id === 'node-001')
      expect(activeNodeViz?.color).toBe('green')
    })

    it('should set correct color for inactive nodes', () => {
      const viz = generateMeshVisualization(sampleNodes)

      const inactiveNodeViz = viz.elements.find((e) => e.node_id === 'node-003')
      expect(inactiveNodeViz?.color).toBe('red')
    })

    it('should handle single node visualization', () => {
      const singleNode: MeshNode[] = [sampleNodes[0]]

      const viz = generateMeshVisualization(singleNode)

      expect(viz.nodes_count).toBe(1)
      expect(viz.elements.length).toBe(1)
    })

    it('should handle empty nodes array', () => {
      const viz = generateMeshVisualization([])

      expect(viz.nodes_count).toBe(0)
    })
  })

  describe('getCliStatus', () => {
    it('should get CLI status', () => {
      const status = getCliStatus()

      expect(status).toBeDefined()
      expect(status.version).toBe('1.0.0')
      expect(status.status).toBe('running')
      expect(typeof status.uptime_ms).toBe('number')
    })

    it('should include memory usage', () => {
      const status = getCliStatus()

      expect(typeof status.memory_usage_mb).toBe('number')
      expect(status.memory_usage_mb).toBeGreaterThan(0)
    })

    it('should provide version information', () => {
      const status = getCliStatus()

      expect(status.version).toBeDefined()
      expect(status.version.match(/\d+\.\d+\.\d+/)).toBeTruthy()
    })
  })

  describe('configureCli', () => {
    it('should configure CLI', () => {
      const result = configureCli(sampleConfig)

      expect(result).toBeDefined()
      expect(result.status).toBe('configured')
      expect(result.mesh_name).toBe('test-mesh')
      expect(result.config_id).toBeDefined()
    })

    it('should include creation timestamp', () => {
      const result = configureCli(sampleConfig)

      expect(result.created_at).toBeDefined()
      expect(typeof result.created_at).toBe('string')
    })

    it('should validate configuration', () => {
      const result = configureCli(sampleConfig)

      expect(result.is_valid).toBe(true)
    })

    it('should handle different mesh names', () => {
      const customConfig: MeshConfig = {
        ...sampleConfig,
        name: 'custom-mesh-name',
      }

      const result = configureCli(customConfig)

      expect(result.mesh_name).toBe('custom-mesh-name')
    })
  })

  describe('exportMeshState', () => {
    it('should export mesh state', () => {
      const exported = exportMeshState()

      expect(exported).toBeDefined()
      expect(exported.format).toBe('json')
      expect(exported.exported_at).toBeDefined()
      expect(exported.mesh_id).toBeDefined()
    })

    it('should export with custom format', () => {
      const exported = exportMeshState('yaml')

      expect(exported.format).toBe('yaml')
    })

    it('should include version in export', () => {
      const exported = exportMeshState()

      expect(exported.version).toBe('1.0.0')
    })

    it('should include mesh data', () => {
      const exported = exportMeshState()

      expect(exported.data).toBeDefined()
      expect(typeof exported.data).toBe('object')
    })

    it('should include timestamp', () => {
      const exported = exportMeshState()

      expect(exported.exported_at).toBeDefined()
      expect(typeof exported.exported_at).toBe('string')
    })
  })

  describe('importMeshState', () => {
    it('should import mesh state', () => {
      const stateData = {
        nodes: [],
        configuration: {},
        status: 'healthy',
      }

      const result = importMeshState(stateData)

      expect(result).toBeDefined()
      expect(result.status).toBe('imported')
      expect(result.imported_at).toBeDefined()
    })

    it('should report number of nodes imported', () => {
      const stateData = {
        nodes: [{}, {}, {}],
        configuration: {},
      }

      const result = importMeshState(stateData)

      expect(result.nodes_imported).toBe(5)
    })

    it('should report configurations imported', () => {
      const stateData = {
        nodes: [],
        configuration: { timeout: 5000 },
      }

      const result = importMeshState(stateData)

      expect(result.configurations_imported).toBe(1)
    })

    it('should include success message', () => {
      const stateData = { nodes: [], configuration: {} }

      const result = importMeshState(stateData)

      expect(result.message).toBeDefined()
      expect(result.message).toContain('imported successfully')
    })
  })

  describe('MeshCli Class', () => {
    it('should create MeshCli instance', () => {
      const cli = new MeshCli(sampleConfig)

      expect(cli).toBeDefined()
      expect(cli.getConfig()).toBe(sampleConfig)
    })

    it('should initialize with config', () => {
      const cli = new MeshCli()
      const result = cli.initialize(sampleConfig)

      expect(result).toBeDefined()
      expect(result.status).toBe('initialized')
    })

    it('should execute command via instance', () => {
      const cli = new MeshCli()
      const result = cli.execute(sampleCommand)

      expect(result).toBeDefined()
      expect(result.command_name).toBe('mesh')
    })

    it('should execute batch commands via instance', () => {
      const cli = new MeshCli()
      const commands: Command[] = [
        { name: 'mesh' },
        { name: 'config' },
      ]

      const results = cli.executeBatch(commands)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(2)
    })

    it('should list commands via instance', () => {
      const cli = new MeshCli()
      const commands = cli.listCommands('mesh')

      expect(Array.isArray(commands)).toBe(true)
    })

    it('should get help via instance', () => {
      const cli = new MeshCli()
      const help = cli.help('mesh')

      expect(help).toBeDefined()
      expect(help.command).toBe('mesh')
    })

    it('should visualize mesh via instance', () => {
      const cli = new MeshCli()
      const viz = cli.visualize(sampleNodes)

      expect(viz).toBeDefined()
      expect(viz.nodes_count).toBe(3)
    })

    it('should get status via instance', () => {
      const cli = new MeshCli()
      const status = cli.status()

      expect(status).toBeDefined()
      expect(status.status).toBe('running')
    })

    it('should configure via instance', () => {
      const cli = new MeshCli()
      const result = cli.configure(sampleConfig)

      expect(result.status).toBe('configured')
    })

    it('should export state via instance', () => {
      const cli = new MeshCli()
      const exported = cli.export('json')

      expect(exported).toBeDefined()
      expect(exported.format).toBe('json')
    })

    it('should import state via instance', () => {
      const cli = new MeshCli()
      const stateData = { nodes: [], configuration: {} }
      const result = cli.import(stateData)

      expect(result.status).toBe('imported')
    })
  })
})
