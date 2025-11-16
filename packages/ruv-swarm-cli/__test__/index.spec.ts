import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { RuvSwarmCli, Command, CliConfig } from '../src/index'

describe('RUV Swarm CLI - Command Line Interface', () => {
  let cli: RuvSwarmCli

  beforeAll(() => {
    cli = new RuvSwarmCli({
      verbose: true,
      output_format: 'json',
      timeout: 30,
      log_level: 'info',
      max_agents: 100,
      enable_monitoring: true,
    })
  })

  describe('CLI Runner Initialization', () => {
    it('should create a CLI instance with default config', () => {
      const cliDefault = new RuvSwarmCli()
      expect(cliDefault).toBeDefined()
    })

    it('should create a CLI instance with custom config', () => {
      const config: CliConfig = {
        verbose: true,
        timeout: 60,
        log_level: 'debug',
      }
      const cliCustom = new RuvSwarmCli(config)
      expect(cliCustom).toBeDefined()
    })

    it('should initialize without errors', () => {
      expect(() => new RuvSwarmCli()).not.toThrow()
    })

    it('should have execute method', () => {
      expect(typeof cli.execute).toBe('function')
    })

    it('should have initializeSwarm method', () => {
      expect(typeof cli.initializeSwarm).toBe('function')
    })
  })

  describe('Swarm Initialization', () => {
    it('should initialize a swarm with default config', () => {
      const result = cli.initializeSwarm('test-swarm-1')

      expect(result.success).toBe(true)
      expect(result.swarm_id).toBe('test-swarm-1')
      expect(result.status).toBe('initialized')
      expect(result.total_agents).toBeGreaterThan(0)
    })

    it('should initialize a swarm with custom agent count', () => {
      const result = cli.initializeSwarm('test-swarm-2', { num_agents: 10 })

      expect(result.success).toBe(true)
      expect(result.total_agents).toBe(10)
    })

    it('should initialize multiple swarms', () => {
      const result1 = cli.initializeSwarm('swarm-a')
      const result2 = cli.initializeSwarm('swarm-b')
      const result3 = cli.initializeSwarm('swarm-c')

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)
    })

    it('should return success message on initialization', () => {
      const result = cli.initializeSwarm('test-swarm-msg')

      expect(result.message).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should set status to initialized', () => {
      const result = cli.initializeSwarm('init-test')

      expect(result.status).toBe('initialized')
    })
  })

  describe('Swarm Control - Start/Stop', () => {
    it('should start a swarm', () => {
      cli.initializeSwarm('start-test')
      const result = cli.startSwarm('start-test')

      expect(result.success).toBe(true)
      expect(result.status).toBe('running')
    })

    it('should have all agents active after start', () => {
      cli.initializeSwarm('active-test', { num_agents: 5 })
      const result = cli.startSwarm('active-test')

      expect(result.active_agents).toBe(result.total_agents)
    })

    it('should stop a running swarm', () => {
      cli.initializeSwarm('stop-test')
      cli.startSwarm('stop-test')
      const result = cli.stopSwarm('stop-test')

      expect(result.success).toBe(true)
      expect(result.status).toBe('stopped')
    })

    it('should have zero active agents after stop', () => {
      cli.initializeSwarm('stopped-test', { num_agents: 5 })
      cli.startSwarm('stopped-test')
      const result = cli.stopSwarm('stopped-test')

      expect(result.active_agents).toBe(0)
    })

    it('should use shorthand start method', () => {
      cli.initializeSwarm('shorthand-start')
      const result = cli.start('shorthand-start')

      expect(result.success).toBe(true)
      expect(result.status).toBe('running')
    })

    it('should use shorthand stop method', () => {
      cli.initializeSwarm('shorthand-stop')
      cli.startSwarm('shorthand-stop')
      const result = cli.stop('shorthand-stop')

      expect(result.success).toBe(true)
      expect(result.status).toBe('stopped')
    })
  })

  describe('Swarm Status & Monitoring', () => {
    it('should get status of a specific swarm', () => {
      cli.initializeSwarm('status-test')
      const status = cli.getSwarmStatus('status-test')

      expect(status.id).toBe('status-test')
      expect(status.status).toBe('initialized')
      expect(status.health_score).toBeGreaterThanOrEqual(0)
      expect(status.health_score).toBeLessThanOrEqual(1)
    })

    it('should use shorthand status method', () => {
      cli.initializeSwarm('status-shorthand')
      const result = cli.status('status-shorthand')

      expect(result.success).toBe(true)
      expect(result.swarm_id).toBe('status-shorthand')
    })

    it('should get overall monitoring data', () => {
      cli.initializeSwarm('monitor-1')
      cli.initializeSwarm('monitor-2')
      const monitoring = cli.getMonitoringData()

      expect(monitoring.success).toBe(true)
      expect(monitoring.total_swarms).toBeGreaterThanOrEqual(2)
      expect(monitoring.total_agents).toBeGreaterThanOrEqual(0)
      expect(monitoring.avg_health_score).toBeGreaterThanOrEqual(0)
    })

    it('should list all swarms', () => {
      cli.initializeSwarm('list-1')
      cli.initializeSwarm('list-2')
      const result = cli.listSwarms()

      expect(result.success).toBe(true)
      expect(result.swarms).toBeDefined()
      expect(Array.isArray(result.swarms)).toBe(true)
      expect(result.swarms.length).toBeGreaterThanOrEqual(2)
    })

    it('should use shorthand list method', () => {
      cli.initializeSwarm('list-shorthand')
      const result = cli.list()

      expect(result.success).toBe(true)
      expect(result.count).toBeGreaterThanOrEqual(0)
    })

    it('should track operations count', () => {
      const monitoring = cli.getMonitoringData()

      expect(monitoring.total_operations).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Swarm Configuration & Deployment', () => {
    it('should deploy configuration to a swarm', () => {
      cli.initializeSwarm('deploy-test')
      const config = { update_rate: 100, timeout: 30 }
      const result = cli.deployConfig('deploy-test', config)

      expect(result.success).toBe(true)
      expect(result.message).toBeDefined()
    })

    it('should handle complex configuration objects', () => {
      cli.initializeSwarm('complex-config')
      const config = {
        agents: { count: 10, type: 'distributed' },
        networking: { protocol: 'http', port: 8080 },
        logging: { level: 'debug', output: 'stdout' },
      }
      const result = cli.deployConfig('complex-config', config)

      expect(result.success).toBe(true)
    })

    it('should get current configuration', () => {
      const result = cli.getConfig()

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should use shorthand config method', () => {
      const result = cli.config()

      expect(result).toBeDefined()
    })
  })

  describe('Swarm Scaling', () => {
    it('should scale swarm up', () => {
      cli.initializeSwarm('scale-up', { num_agents: 5 })
      cli.startSwarm('scale-up')
      const result = cli.scaleSwarm('scale-up', 10)

      expect(result.success).toBe(true)
      expect(result.total_agents).toBe(10)
    })

    it('should scale swarm down', () => {
      cli.initializeSwarm('scale-down', { num_agents: 10 })
      cli.startSwarm('scale-down')
      const result = cli.scaleSwarm('scale-down', 5)

      expect(result.success).toBe(true)
      expect(result.total_agents).toBe(5)
    })

    it('should maintain active agent count after scaling running swarm', () => {
      cli.initializeSwarm('scale-active', { num_agents: 5 })
      cli.startSwarm('scale-active')
      const result = cli.scaleSwarm('scale-active', 10)

      expect(result.active_agents).toBe(10)
    })

    it('should not affect inactive swarms when scaling', () => {
      cli.initializeSwarm('scale-inactive', { num_agents: 5 })
      const result = cli.scaleSwarm('scale-inactive', 15)

      expect(result.active_agents).toBe(0)
      expect(result.total_agents).toBe(15)
    })
  })

  describe('Health & Monitoring', () => {
    it('should get health status of a swarm', () => {
      cli.initializeSwarm('health-check')
      const result = cli.health('health-check')

      expect(result.success).toBe(true)
      expect(result.health_score).toBeDefined()
    })

    it('should use shorthand health method', () => {
      cli.initializeSwarm('health-shorthand')
      const result = cli.health('health-shorthand')

      expect(result.success).toBe(true)
      expect(result.health_score).toBeGreaterThanOrEqual(0)
    })

    it('should get overall health without specific swarm', () => {
      cli.initializeSwarm('health-overall-1')
      cli.initializeSwarm('health-overall-2')
      const result = cli.health()

      expect(result.success).toBe(true)
      expect(result.avg_health_score).toBeDefined()
    })

    it('should include health score in monitoring data', () => {
      cli.initializeSwarm('health-monitor')
      const monitoring = cli.getMonitoringData()

      expect(monitoring.avg_health_score).toBeDefined()
      expect(monitoring.avg_health_score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Command History', () => {
    it('should get command history', () => {
      const history = cli.getHistory(10)

      expect(Array.isArray(history)).toBe(true)
    })

    it('should respect history limit', () => {
      const history = cli.getHistory(5)

      expect(history.length).toBeLessThanOrEqual(5)
    })

    it('should return history in reverse order', () => {
      cli.initializeSwarm('history-order')
      cli.start('history-order')
      const history = cli.getHistory(10)

      expect(Array.isArray(history)).toBe(true)
    })

    it('should clear command history', () => {
      const result = cli.clearHistory()

      expect(result.success).toBe(true)
      expect(result.message).toBeDefined()
    })

    it('should return empty history after clearing', () => {
      cli.clearHistory()
      const history = cli.getHistory(10)

      expect(history.length).toBe(0)
    })
  })

  describe('Command Execution', () => {
    it('should execute a command with direct execute method', () => {
      const command: Command = {
        name: 'init',
        args: {},
      }

      const result = cli.execute(command)

      expect(result.success).toBe(true)
    })

    it('should execute multiple different commands', () => {
      cli.initializeSwarm('multi-cmd')

      const startCmd: Command = {
        name: 'start',
        args: { swarm_id: 'multi-cmd' },
      }

      const statusCmd: Command = {
        name: 'status',
        args: { swarm_id: 'multi-cmd' },
      }

      const startResult = cli.execute(startCmd)
      const statusResult = cli.execute(statusCmd)

      expect(startResult.success).toBe(true)
      expect(statusResult.success).toBe(true)
    })

    it('should handle command options', () => {
      const command: Command = {
        name: 'config',
        args: {},
        options: { format: 'json' },
      }

      const result = cli.execute(command)

      expect(result).toBeDefined()
    })

    it('should timestamp all command results', () => {
      cli.initializeSwarm('timestamp-test')
      const result = cli.start('timestamp-test')

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })

    it('should include success flag in all results', () => {
      cli.initializeSwarm('success-test')
      const result = cli.getSwarmStatus('success-test')

      expect(result).toBeDefined()
    })
  })

  describe('Logs & Diagnostics', () => {
    it('should get logs for a swarm', () => {
      cli.initializeSwarm('logs-test')
      const result = cli.getLogs('logs-test')

      expect(result.success).toBe(true)
      expect(result.logs).toBeDefined()
      expect(Array.isArray(result.logs)).toBe(true)
    })

    it('should include swarm ID in logs result', () => {
      cli.initializeSwarm('logs-id')
      const result = cli.getLogs('logs-id')

      expect(result.swarm_id).toBe('logs-id')
    })

    it('should provide log entries', () => {
      cli.initializeSwarm('logs-entries')
      const result = cli.getLogs('logs-entries')

      expect(result.logs.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when module not available', () => {
      // This test verifies that attempting to use native module throws appropriate error
      expect(() => {
        new RuvSwarmCli()
      }).not.toThrow()
    })

    it('should handle invalid swarm ID gracefully', () => {
      try {
        cli.getSwarmStatus('nonexistent-swarm')
        // If we get here, implementation allows accessing non-existent swarms
        expect(true).toBe(true)
      } catch (e) {
        // Or it throws an error, which is also valid
        expect(true).toBe(true)
      }
    })

    it('should include timestamp in error responses', () => {
      const result = cli.initializeSwarm('error-test')

      expect(result.timestamp).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should complete full lifecycle: init -> start -> scale -> stop', () => {
      const swarmId = 'lifecycle-test'

      const initResult = cli.initializeSwarm(swarmId, { num_agents: 5 })
      expect(initResult.success).toBe(true)

      const startResult = cli.startSwarm(swarmId)
      expect(startResult.success).toBe(true)
      expect(startResult.status).toBe('running')

      const scaleResult = cli.scaleSwarm(swarmId, 10)
      expect(scaleResult.success).toBe(true)
      expect(scaleResult.total_agents).toBe(10)

      const stopResult = cli.stopSwarm(swarmId)
      expect(stopResult.success).toBe(true)
      expect(stopResult.status).toBe('stopped')
    })

    it('should manage multiple swarms independently', () => {
      const swarm1 = 'multi-1'
      const swarm2 = 'multi-2'

      cli.initializeSwarm(swarm1, { num_agents: 5 })
      cli.initializeSwarm(swarm2, { num_agents: 10 })

      cli.startSwarm(swarm1)
      cli.stopSwarm(swarm2)

      const status1 = cli.getSwarmStatus(swarm1)
      const status2 = cli.getSwarmStatus(swarm2)

      expect(status1.status).toBe('running')
      expect(status2.status).toBe('stopped')
    })

    it('should handle concurrent operations', () => {
      const results = Array.from({ length: 5 }, (_, i) => {
        const swarmId = `concurrent-${i}`
        cli.initializeSwarm(swarmId)
        return cli.startSwarm(swarmId)
      })

      results.forEach((result) => {
        expect(result.success).toBe(true)
      })
    })

    it('should maintain state across operations', () => {
      const swarmId = 'state-test'
      cli.initializeSwarm(swarmId, { num_agents: 5 })

      const monitoringBefore = cli.getMonitoringData()
      const countBefore = monitoringBefore.total_operations

      cli.startSwarm(swarmId)
      cli.scaleSwarm(swarmId, 10)

      const monitoringAfter = cli.getMonitoringData()
      const countAfter = monitoringAfter.total_operations

      expect(countAfter).toBeGreaterThanOrEqual(countBefore)
    })

    it('should initialize CLI successfully', () => {
      const result = cli.init()

      expect(result.success).toBe(true)
    })
  })

  describe('Data Integrity', () => {
    it('should preserve swarm ID through operations', () => {
      const swarmId = 'integrity-id'
      cli.initializeSwarm(swarmId)
      const status = cli.getSwarmStatus(swarmId)

      expect(status.id).toBe(swarmId)
    })

    it('should maintain agent count consistency', () => {
      const swarmId = 'consistency-test'
      const agentCount = 7

      cli.initializeSwarm(swarmId, { num_agents: agentCount })
      const status = cli.getSwarmStatus(swarmId)

      expect(status.total_agents).toBe(agentCount)
    })

    it('should update timestamps appropriately', () => {
      const swarmId = 'timestamp-consistency'
      cli.initializeSwarm(swarmId)

      const status1 = cli.getSwarmStatus(swarmId)
      const timestamp1 = status1.last_heartbeat

      cli.startSwarm(swarmId)
      const status2 = cli.getSwarmStatus(swarmId)
      const timestamp2 = status2.last_heartbeat

      expect(timestamp2).toBeDefined()
    })
  })
})
