import {
  QuDAGProtocolClass,
  createProtocol,
  validateMessage,
  getProtocolVersion,
  processDataDefault,
  ProtocolConfig,
  ProtocolMessage,
  OperationResult,
} from '../src/index'

describe('QuDAG Protocol', () => {
  describe('QuDAGProtocolClass', () => {
    it('should create a protocol instance with default config', () => {
      const protocol = new QuDAGProtocolClass()
      expect(protocol).toBeDefined()
      expect(protocol.isReady()).toBe(true)
    })

    it('should create a protocol instance with custom config', () => {
      const config: ProtocolConfig = {
        nodeId: 'test-node',
        timeoutMs: 60000,
        maxRetries: 5,
        enableOptimization: false,
      }
      const protocol = new QuDAGProtocolClass(config)
      expect(protocol).toBeDefined()
      expect(protocol.isReady()).toBe(true)
    })

    it('should initialize protocol', () => {
      const protocol = new QuDAGProtocolClass()
      const result = protocol.initialize()
      expect(result).toBe(true)
    })

    it('should get node ID', () => {
      const config: ProtocolConfig = {
        nodeId: 'my-node',
      }
      const protocol = new QuDAGProtocolClass(config)
      const nodeId = protocol.getNodeId()
      expect(nodeId).toBe('my-node')
    })

    it('should get default node ID when not specified', () => {
      const protocol = new QuDAGProtocolClass()
      const nodeId = protocol.getNodeId()
      expect(nodeId).toBeDefined()
      expect(typeof nodeId).toBe('string')
    })

    it('should get timeout configuration', () => {
      const config: ProtocolConfig = {
        timeoutMs: 45000,
      }
      const protocol = new QuDAGProtocolClass(config)
      const timeout = protocol.getTimeout()
      expect(timeout).toBe(45000)
    })

    it('should set timeout configuration', () => {
      const protocol = new QuDAGProtocolClass()
      protocol.setTimeout(50000)
      const timeout = protocol.getTimeout()
      expect(timeout).toBe(50000)
    })

    it('should validate protocol state', () => {
      const protocol = new QuDAGProtocolClass()
      const isValid = protocol.validateState()
      expect(isValid).toBe(true)
    })

    it('should check if protocol is ready', () => {
      const protocol = new QuDAGProtocolClass()
      expect(protocol.isReady()).toBe(true)
    })

    it('should close protocol', async () => {
      const protocol = new QuDAGProtocolClass()
      await protocol.close()
      expect(protocol.isReady()).toBe(true) // Should still be ready after close
    })
  })

  describe('Message operations', () => {
    let protocol: QuDAGProtocolClass

    beforeEach(() => {
      protocol = new QuDAGProtocolClass()
    })

    it('should send a message', async () => {
      const message: ProtocolMessage = {
        messageType: 'protocol',
        sourceNode: 'node-1',
        destinationNode: 'node-2',
        payload: Buffer.from('hello world'),
        timestamp: Date.now(),
      }

      const result = await protocol.sendMessage(message)
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.message).toContain('Message sent')
      expect(result.data).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('should receive a message', () => {
      const payload = Buffer.from('test message')
      const message = protocol.receiveMessage(payload)

      expect(message).toBeDefined()
      expect(message.messageType).toBe('generic')
      expect(message.sourceNode).toBe('unknown')
      expect(message.destinationNode).toBe('self')
      expect(message.payload).toEqual(payload)
      expect(message.timestamp).toBeGreaterThan(0)
    })

    it('should handle message with Uint8Array payload', () => {
      const uint8Array = new Uint8Array([1, 2, 3, 4, 5])
      const message = protocol.receiveMessage(uint8Array)

      expect(message).toBeDefined()
      expect(message.payload).toBeDefined()
      expect(message.payload.length).toBe(5)
    })

    it('should include payload in send result', async () => {
      const testPayload = Buffer.from('test data')
      const message: ProtocolMessage = {
        messageType: 'test',
        sourceNode: 'sender',
        destinationNode: 'receiver',
        payload: testPayload,
        timestamp: Date.now(),
      }

      const result = await protocol.sendMessage(message)
      expect(result.data).toEqual(testPayload)
    })

    it('should handle large messages', async () => {
      const largePayload = Buffer.alloc(1024 * 100) // 100KB
      const message: ProtocolMessage = {
        messageType: 'large',
        sourceNode: 'node-1',
        destinationNode: 'node-2',
        payload: largePayload,
        timestamp: Date.now(),
      }

      const result = await protocol.sendMessage(message)
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(largePayload.length)
    })
  })

  describe('Data processing', () => {
    let protocol: QuDAGProtocolClass

    beforeEach(() => {
      protocol = new QuDAGProtocolClass()
    })

    it('should process data', async () => {
      const data = Buffer.from('hello world')
      const result = await protocol.processData(data)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('should process Uint8Array data', async () => {
      const uint8Data = new Uint8Array([1, 2, 3, 4, 5])
      const result = await protocol.processData(uint8Data)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should handle large data processing', async () => {
      const largeData = Buffer.alloc(1024 * 50) // 50KB
      const result = await protocol.processData(largeData)

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(largeData.length)
    })

    it('should indicate when optimization is enabled', async () => {
      const config: ProtocolConfig = {
        enableOptimization: true,
      }
      const protocol = new QuDAGProtocolClass(config)
      const result = await protocol.processData(Buffer.from('test'))

      expect(result.message).toContain('optimization: true')
    })

    it('should indicate when optimization is disabled', async () => {
      const config: ProtocolConfig = {
        enableOptimization: false,
      }
      const protocol = new QuDAGProtocolClass(config)
      const result = await protocol.processData(Buffer.from('test'))

      expect(result.message).toContain('optimization: false')
    })
  })

  describe('Utility functions', () => {
    it('should create protocol with factory function', () => {
      const protocol = createProtocol()
      expect(protocol).toBeDefined()
      expect(protocol.isReady()).toBe(true)
    })

    it('should validate message', () => {
      const validMessage: ProtocolMessage = {
        messageType: 'test',
        sourceNode: 'node-1',
        destinationNode: 'node-2',
        payload: Buffer.from('data'),
        timestamp: Date.now(),
      }

      const isValid = validateMessage(validMessage)
      expect(isValid).toBe(true)
    })

    it('should reject message with empty source node', () => {
      const invalidMessage: ProtocolMessage = {
        messageType: 'test',
        sourceNode: '',
        destinationNode: 'node-2',
        payload: Buffer.from('data'),
        timestamp: Date.now(),
      }

      expect(() => validateMessage(invalidMessage)).toThrow()
    })

    it('should reject message with empty destination node', () => {
      const invalidMessage: ProtocolMessage = {
        messageType: 'test',
        sourceNode: 'node-1',
        destinationNode: '',
        payload: Buffer.from('data'),
        timestamp: Date.now(),
      }

      expect(() => validateMessage(invalidMessage)).toThrow()
    })

    it('should get protocol version', () => {
      const version = getProtocolVersion()
      expect(version).toBeDefined()
      expect(typeof version).toBe('string')
      expect(version).toContain('qudag-protocol')
    })

    it('should process data with default protocol', () => {
      const result = processDataDefault(Buffer.from('test data'))
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.message).toContain('default')
    })

    it('should process Uint8Array with default protocol', () => {
      const uint8Data = new Uint8Array([1, 2, 3, 4])
      const result = processDataDefault(uint8Data)
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(4)
    })
  })

  describe('Error handling', () => {
    let protocol: QuDAGProtocolClass

    beforeEach(() => {
      protocol = new QuDAGProtocolClass()
    })

    it('should handle send message with invalid source node', async () => {
      const invalidMessage: ProtocolMessage = {
        messageType: 'test',
        sourceNode: '',
        destinationNode: 'node-2',
        payload: Buffer.from('data'),
        timestamp: Date.now(),
      }

      await expect(protocol.sendMessage(invalidMessage)).rejects.toThrow()
    })

    it('should handle send message with invalid destination node', async () => {
      const invalidMessage: ProtocolMessage = {
        messageType: 'test',
        sourceNode: 'node-1',
        destinationNode: '',
        payload: Buffer.from('data'),
        timestamp: Date.now(),
      }

      await expect(protocol.sendMessage(invalidMessage)).rejects.toThrow()
    })

    it('should handle empty data processing', async () => {
      const emptyData = Buffer.alloc(0)

      await expect(protocol.processData(emptyData)).rejects.toThrow()
    })

    it('should handle empty receive message', () => {
      const emptyData = Buffer.alloc(0)

      expect(() => protocol.receiveMessage(emptyData)).toThrow()
    })
  })

  describe('Configuration', () => {
    it('should use custom timeout', async () => {
      const config: ProtocolConfig = {
        timeoutMs: 15000,
      }
      const protocol = new QuDAGProtocolClass(config)
      const timeout = protocol.getTimeout()
      expect(timeout).toBe(15000)
    })

    it('should use custom max retries', () => {
      const config: ProtocolConfig = {
        maxRetries: 7,
      }
      const protocol = new QuDAGProtocolClass(config)
      expect(protocol).toBeDefined()
    })

    it('should use custom node ID', () => {
      const config: ProtocolConfig = {
        nodeId: 'custom-node-123',
      }
      const protocol = new QuDAGProtocolClass(config)
      const nodeId = protocol.getNodeId()
      expect(nodeId).toBe('custom-node-123')
    })

    it('should enable optimization by default', async () => {
      const protocol = new QuDAGProtocolClass()
      const result = await protocol.processData(Buffer.from('test'))
      expect(result.message).toContain('true')
    })

    it('should disable optimization when configured', async () => {
      const config: ProtocolConfig = {
        enableOptimization: false,
      }
      const protocol = new QuDAGProtocolClass(config)
      const result = await protocol.processData(Buffer.from('test'))
      expect(result.message).toContain('false')
    })
  })

  describe('Edge cases', () => {
    it('should handle multiple protocol instances', () => {
      const protocol1 = new QuDAGProtocolClass({ nodeId: 'node-1' })
      const protocol2 = new QuDAGProtocolClass({ nodeId: 'node-2' })

      expect(protocol1.getNodeId()).toBe('node-1')
      expect(protocol2.getNodeId()).toBe('node-2')
      expect(protocol1.isReady()).toBe(true)
      expect(protocol2.isReady()).toBe(true)
    })

    it('should handle rapid configuration changes', () => {
      const protocol = new QuDAGProtocolClass()
      protocol.setTimeout(10000)
      protocol.setTimeout(20000)
      protocol.setTimeout(30000)

      expect(protocol.getTimeout()).toBe(30000)
    })

    it('should handle timestamp rollover in messages', async () => {
      const protocol = new QuDAGProtocolClass()
      const largeTimestamp = Number.MAX_SAFE_INTEGER - 1000
      const message: ProtocolMessage = {
        messageType: 'test',
        sourceNode: 'node-1',
        destinationNode: 'node-2',
        payload: Buffer.from('data'),
        timestamp: largeTimestamp,
      }

      const result = await protocol.sendMessage(message)
      expect(result.success).toBe(true)
    })

    it('should handle unicode in node IDs', () => {
      const config: ProtocolConfig = {
        nodeId: '节点-1-🚀',
      }
      const protocol = new QuDAGProtocolClass(config)
      const nodeId = protocol.getNodeId()
      expect(nodeId).toContain('节点')
      expect(nodeId).toContain('🚀')
    })

    it('should handle special characters in message types', async () => {
      const protocol = new QuDAGProtocolClass()
      const message: ProtocolMessage = {
        messageType: 'type-with-special-chars-@#$%',
        sourceNode: 'node-1',
        destinationNode: 'node-2',
        payload: Buffer.from('data'),
        timestamp: Date.now(),
      }

      const result = await protocol.sendMessage(message)
      expect(result.success).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should process message quickly', async () => {
      const protocol = new QuDAGProtocolClass()
      const message: ProtocolMessage = {
        messageType: 'perf',
        sourceNode: 'node-1',
        destinationNode: 'node-2',
        payload: Buffer.from('test'),
        timestamp: Date.now(),
      }

      const start = Date.now()
      await protocol.sendMessage(message)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should process large data efficiently', async () => {
      const protocol = new QuDAGProtocolClass()
      const largeData = Buffer.alloc(1024 * 200) // 200KB

      const start = Date.now()
      const result = await protocol.processData(largeData)
      const duration = Date.now() - start

      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should handle many messages', async () => {
      const protocol = new QuDAGProtocolClass()
      const messageCount = 100

      const start = Date.now()
      for (let i = 0; i < messageCount; i++) {
        const message: ProtocolMessage = {
          messageType: 'perf',
          sourceNode: `node-${i % 5}`,
          destinationNode: `node-${(i + 1) % 5}`,
          payload: Buffer.from(`message-${i}`),
          timestamp: Date.now(),
        }
        await protocol.sendMessage(message)
      }
      const duration = Date.now() - start

      expect(duration).toBeLessThan(5000) // 100 messages in under 5 seconds
    })
  })

  describe('Integration scenarios', () => {
    it('should handle a complete protocol flow', async () => {
      const config: ProtocolConfig = {
        nodeId: 'orchestrator',
        timeoutMs: 30000,
      }
      const protocol = new QuDAGProtocolClass(config)

      // Initialize
      protocol.initialize()
      expect(protocol.validateState()).toBe(true)

      // Send message
      const message: ProtocolMessage = {
        messageType: 'init',
        sourceNode: 'orchestrator',
        destinationNode: 'worker',
        payload: Buffer.from('start'),
        timestamp: Date.now(),
      }
      const sendResult = await protocol.sendMessage(message)
      expect(sendResult.success).toBe(true)

      // Process data
      const data = Buffer.from('payload')
      const processResult = await protocol.processData(data)
      expect(processResult.success).toBe(true)

      // Close
      await protocol.close()
    })

    it('should handle node-to-node communication pattern', async () => {
      const node1 = new QuDAGProtocolClass({ nodeId: 'node-1' })
      const node2 = new QuDAGProtocolClass({ nodeId: 'node-2' })

      // Node 1 sends to Node 2
      const message: ProtocolMessage = {
        messageType: 'handshake',
        sourceNode: node1.getNodeId(),
        destinationNode: node2.getNodeId(),
        payload: Buffer.from('hello'),
        timestamp: Date.now(),
      }

      const result = await node1.sendMessage(message)
      expect(result.success).toBe(true)

      // Node 2 receives
      const received = node2.receiveMessage(result.data)
      expect(received.payload).toEqual(message.payload)
    })
  })
})
