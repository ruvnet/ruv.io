import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  TransportManager,
  initTransportManager,
  registerConnection,
  sendMessage,
  createMessage,
  registerRoute,
  listRoutes,
  updateRoute,
  removeRoute,
  setSerializationFormat,
  getActiveConnections,
  handleIncomingMessage,
  batchSendMessages,
  closeConnection,
  getTransportStats,
  getConnectionStats,
  enableProtocol,
  disableProtocol,
  getEnabledProtocols,
  serializeMessage,
  deserializeMessage,
  Message,
  Connection,
  Route,
  ProtocolType,
  MessagePriority,
  ConnectionState,
} from '../src/index'

describe('RUV Swarm Transport Layer', () => {
  let manager: TransportManager

  const sampleMessage: Message = {
    id: 'msg-001',
    source: '192.168.1.1:5000',
    destination: '192.168.1.2:5000',
    protocol: 'tcp',
    payload: 'Hello, Swarm!',
    priority: 'normal',
    timestamp: '1234567890',
    metadata: { type: 'heartbeat' },
  }

  const sampleConnection: Connection = {
    id: 'conn-001',
    remote_address: '192.168.1.2:5000',
    protocol: 'tcp',
    state: 'connected',
    created_at: '1234567890',
    last_activity: '1234567890',
  }

  const sampleRoute: Route = {
    destination: '192.168.1.2',
    protocol: 'tcp',
    priority: 1,
    enabled: true,
  }

  beforeAll(() => {
    manager = new TransportManager()
  })

  describe('TransportManager Initialization', () => {
    it('should initialize transport manager', () => {
      expect(manager).toBeDefined()
      expect(manager).toBeInstanceOf(TransportManager)
    })

    it('should get manager ID', () => {
      const id = manager.getId()
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.startsWith('tm-')).toBe(true)
    })

    it('should initialize with custom config', () => {
      const customManager = new TransportManager({ max_connections: 100 })
      expect(customManager).toBeDefined()
      expect(customManager.getId()).toBeDefined()
    })
  })

  describe('Message Creation and Management', () => {
    it('should create a message', () => {
      const message = createMessage('host1', 'host2', 'test payload', 'tcp', 'normal')

      expect(message).toBeDefined()
      expect(message.id).toBeDefined()
      expect(message.source).toBe('host1')
      expect(message.destination).toBe('host2')
      expect(message.payload).toBe('test payload')
      expect(message.protocol).toBe('tcp')
      expect(message.priority).toBe('normal')
      expect(message.timestamp).toBeDefined()
    })

    it('should create message with default values', () => {
      const message = createMessage('src', 'dst', 'payload')

      expect(message.protocol).toBe('tcp')
      expect(message.priority).toBe('normal')
    })

    it('should send a message', () => {
      const messageId = sendMessage(sampleMessage)

      expect(messageId).toBeDefined()
      expect(typeof messageId).toBe('string')
      expect(messageId.startsWith('msg-')).toBe(true)
    })

    it('should handle message with different priorities', () => {
      const priorities = ['low', 'normal', 'high', 'critical']

      priorities.forEach((priority) => {
        const msg = createMessage('src', 'dst', 'payload', 'tcp', priority)
        expect(msg.priority).toBe(priority)
        expect(sendMessage(msg)).toBeDefined()
      })
    })

    it('should handle message with different protocols', () => {
      const protocols = ['tcp', 'udp', 'websocket', 'http', 'grpc']

      protocols.forEach((protocol) => {
        const msg = createMessage('src', 'dst', 'payload', protocol)
        expect(msg.protocol).toBe(protocol)
        expect(sendMessage(msg)).toBeDefined()
      })
    })

    it('should reject message with empty destination', () => {
      const invalidMessage: Message = {
        id: 'msg-invalid',
        source: 'src',
        destination: '',
        protocol: 'tcp',
        payload: 'payload',
        priority: 'normal',
        timestamp: '123',
      }

      expect(() => sendMessage(invalidMessage)).toThrow()
    })
  })

  describe('Message Batch Operations', () => {
    it('should batch send multiple messages', () => {
      const messages = [
        createMessage('src1', 'dst1', 'payload1'),
        createMessage('src2', 'dst2', 'payload2'),
        createMessage('src3', 'dst3', 'payload3'),
      ]

      const results = batchSendMessages(messages)

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(3)
    })

    it('should batch send with large message count', () => {
      const messages = Array.from({ length: 50 }, (_, i) =>
        createMessage(`src${i}`, `dst${i}`, `payload${i}`)
      )

      const results = batchSendMessages(messages)

      expect(results).toHaveLength(50)
      results.forEach((result) => {
        expect(result.status).toBe('sent')
        expect(result.message_id).toBeDefined()
      })
    })

    it('should handle incoming messages', () => {
      const result = handleIncomingMessage(sampleMessage)

      expect(result).toBeDefined()
      expect(result.status).toBe('received')
      expect(result.message_id).toBe(sampleMessage.id)
      expect(result.timestamp).toBeDefined()
    })

    it('should handle empty message batch', () => {
      const results = batchSendMessages([])

      expect(results).toBeDefined()
      expect(results).toHaveLength(0)
    })
  })

  describe('Connection Management', () => {
    it('should register a connection', () => {
      const connId = registerConnection(sampleConnection)

      expect(connId).toBeDefined()
      expect(typeof connId).toBe('string')
      expect(connId.startsWith('conn-')).toBe(true)
    })

    it('should register via manager', () => {
      const connId = manager.registerConnection(sampleConnection)

      expect(connId).toBeDefined()
      expect(connId.startsWith('conn-')).toBe(true)
    })

    it('should get active connections', () => {
      const connections = getActiveConnections()

      expect(connections).toBeDefined()
      expect(Array.isArray(connections)).toBe(true)
    })

    it('should get connections via manager', () => {
      const connections = manager.getConnections()

      expect(connections).toBeDefined()
      expect(Array.isArray(connections)).toBe(true)
    })

    it('should close a connection', () => {
      const connId = registerConnection(sampleConnection)
      const success = closeConnection(connId)

      expect(success).toBe(true)
    })

    it('should close connection via manager', () => {
      const connId = registerConnection(sampleConnection)
      const success = manager.disconnect(connId)

      expect(success).toBe(true)
    })
  })

  describe('Route Management', () => {
    it('should register a route', () => {
      const routeId = registerRoute(sampleRoute)

      expect(routeId).toBeDefined()
      expect(typeof routeId).toBe('string')
      expect(routeId.startsWith('route-')).toBe(true)
    })

    it('should register route via manager', () => {
      const routeId = manager.addRoute(sampleRoute)

      expect(routeId).toBeDefined()
      expect(routeId.startsWith('route-')).toBe(true)
    })

    it('should list all routes', () => {
      registerRoute(sampleRoute)
      const routes = listRoutes()

      expect(routes).toBeDefined()
      expect(Array.isArray(routes)).toBe(true)
    })

    it('should list routes via manager', () => {
      const routes = manager.getRoutes()

      expect(routes).toBeDefined()
      expect(Array.isArray(routes)).toBe(true)
    })

    it('should update a route', () => {
      const updated = updateRoute('192.168.1.2', { priority: 2 })

      expect(updated).toBeDefined()
      expect(updated.destination).toBe('192.168.1.2')
      expect(updated.priority).toBe(2)
    })

    it('should remove a route', () => {
      registerRoute(sampleRoute)
      const success = removeRoute('192.168.1.2')

      expect(success).toBe(true)
    })

    it('should remove route via manager', () => {
      manager.addRoute(sampleRoute)
      const success = manager.removeRoute('192.168.1.2')

      expect(success).toBe(true)
    })

    it('should handle multiple routes', () => {
      const routes = [
        { ...sampleRoute, destination: 'dest1', priority: 1 },
        { ...sampleRoute, destination: 'dest2', priority: 2 },
        { ...sampleRoute, destination: 'dest3', priority: 3 },
      ]

      routes.forEach((route) => {
        const id = registerRoute(route)
        expect(id).toBeDefined()
      })

      const allRoutes = listRoutes()
      expect(allRoutes).toBeDefined()
    })
  })

  describe('Protocol Management', () => {
    it('should enable a protocol', () => {
      const success = enableProtocol('tcp')

      expect(success).toBe(true)
    })

    it('should enable protocol via manager', () => {
      const success = manager.enableProtocol('udp')

      expect(success).toBe(true)
    })

    it('should disable a protocol', () => {
      const success = disableProtocol('websocket')

      expect(success).toBe(true)
    })

    it('should disable protocol via manager', () => {
      const success = manager.disableProtocol('http')

      expect(success).toBe(true)
    })

    it('should get enabled protocols', () => {
      const protocols = getEnabledProtocols()

      expect(protocols).toBeDefined()
      expect(Array.isArray(protocols)).toBe(true)
      expect(protocols.length).toBeGreaterThan(0)
    })

    it('should get protocols via manager', () => {
      const protocols = manager.getProtocols()

      expect(protocols).toBeDefined()
      expect(Array.isArray(protocols)).toBe(true)
    })

    it('should set serialization format for protocol', () => {
      const success = setSerializationFormat('tcp', 'json')

      expect(success).toBe(true)
    })

    it('should reject invalid protocol', () => {
      expect(() => enableProtocol('')).toThrow()
    })
  })

  describe('Message Serialization', () => {
    it('should serialize message to json', () => {
      const serialized = serializeMessage(sampleMessage, 'json')

      expect(serialized).toBeDefined()
      expect(typeof serialized).toBe('string')
    })

    it('should serialize via manager', () => {
      const serialized = manager.serialize(sampleMessage, 'json')

      expect(serialized).toBeDefined()
      expect(typeof serialized).toBe('string')
    })

    it('should deserialize message', () => {
      const serialized = serializeMessage(sampleMessage)
      const deserialized = deserializeMessage(serialized)

      expect(deserialized).toBeDefined()
      expect(deserialized.id).toBe(sampleMessage.id)
      expect(deserialized.source).toBe(sampleMessage.source)
    })

    it('should deserialize via manager', () => {
      const serialized = manager.serialize(sampleMessage)
      const deserialized = manager.deserialize(serialized)

      expect(deserialized).toBeDefined()
      expect(deserialized.source).toBe(sampleMessage.source)
    })

    it('should handle different serialization formats', () => {
      const formats = ['json', 'compact', 'binary']

      formats.forEach((format) => {
        const serialized = serializeMessage(sampleMessage, format)
        expect(serialized).toBeDefined()
      })
    })
  })

  describe('Statistics and Monitoring', () => {
    it('should get transport statistics', () => {
      const stats = getTransportStats()

      expect(stats).toBeDefined()
      expect(stats.total_messages).toBeDefined()
      expect(stats.total_bytes).toBeDefined()
      expect(stats.average_latency_ms).toBeDefined()
    })

    it('should get connection statistics', () => {
      const stats = getConnectionStats()

      expect(stats).toBeDefined()
      expect(stats.active_connections).toBeDefined()
      expect(stats.total_connections).toBeDefined()
      expect(stats.failed_connections).toBeDefined()
      expect(stats.total_bytes_sent).toBeDefined()
      expect(stats.total_bytes_received).toBeDefined()
    })

    it('should get all stats via manager', () => {
      const allStats = manager.getStats()

      expect(allStats).toBeDefined()
      expect(allStats.messages).toBeDefined()
      expect(allStats.connections).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete message flow', () => {
      // Create message
      const msg = createMessage('client1', 'server1', 'request data')
      expect(msg).toBeDefined()

      // Send message
      const msgId = sendMessage(msg)
      expect(msgId).toBeDefined()

      // Handle incoming
      const result = handleIncomingMessage(msg)
      expect(result.status).toBe('received')
    })

    it('should manage complete connection lifecycle', () => {
      // Register connection
      const connId = registerConnection(sampleConnection)
      expect(connId).toBeDefined()

      // Get connections
      const connections = getActiveConnections()
      expect(connections).toBeDefined()

      // Close connection
      const closed = closeConnection(connId)
      expect(closed).toBe(true)
    })

    it('should manage complete route lifecycle', () => {
      // Add route
      const routeId = registerRoute(sampleRoute)
      expect(routeId).toBeDefined()

      // List routes
      const routes = listRoutes()
      expect(routes).toBeDefined()

      // Update route
      const updated = updateRoute(sampleRoute.destination, { priority: 5 })
      expect(updated.priority).toBe(5)

      // Remove route
      const removed = removeRoute(sampleRoute.destination)
      expect(removed).toBe(true)
    })

    it('should handle complex protocol management', () => {
      // Enable multiple protocols
      enableProtocol('tcp')
      enableProtocol('udp')

      // Get enabled
      const protocols = getEnabledProtocols()
      expect(protocols).toBeDefined()

      // Set formats
      setSerializationFormat('tcp', 'json')
      setSerializationFormat('udp', 'msgpack')

      // Disable one
      const disabled = disableProtocol('udp')
      expect(disabled).toBe(true)
    })

    it('should handle manager workflow', () => {
      // Create manager
      const mgr = new TransportManager()

      // Send via manager
      const msg = createMessage('src', 'dst', 'payload')
      const msgId = mgr.send(msg)
      expect(msgId).toBeDefined()

      // Add route
      const routeId = mgr.addRoute(sampleRoute)
      expect(routeId).toBeDefined()

      // Get stats
      const stats = mgr.getStats()
      expect(stats).toBeDefined()

      // Get protocols
      const protocols = mgr.getProtocols()
      expect(protocols).toBeDefined()
    })

    it('should handle batch operations with manager', () => {
      const messages = Array.from({ length: 10 }, (_, i) =>
        createMessage(`src${i}`, `dst${i}`, `payload${i}`)
      )

      const results = manager.batchSend(messages)

      expect(results).toHaveLength(10)
      results.forEach((result) => {
        expect(result.status).toBe('sent')
      })
    })

    it('should handle concurrent operations', () => {
      // Simulate concurrent operations
      const msg1 = createMessage('src1', 'dst1', 'payload1')
      const msg2 = createMessage('src2', 'dst2', 'payload2')
      const msg3 = createMessage('src3', 'dst3', 'payload3')

      const id1 = sendMessage(msg1)
      const id2 = sendMessage(msg2)
      const id3 = sendMessage(msg3)

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id3).toBeDefined()

      const result1 = handleIncomingMessage(msg1)
      const result2 = handleIncomingMessage(msg2)
      const result3 = handleIncomingMessage(msg3)

      expect(result1.status).toBe('received')
      expect(result2.status).toBe('received')
      expect(result3.status).toBe('received')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle error on invalid connection', () => {
      expect(() => {
        registerConnection(null as any)
      }).toThrow()
    })

    it('should handle error on empty protocol', () => {
      expect(() => {
        enableProtocol('')
      }).toThrow()
    })

    it('should handle error on invalid message', () => {
      expect(() => {
        sendMessage(null as any)
      }).toThrow()
    })

    it('should handle large payload messages', () => {
      const largePayload = 'x'.repeat(1000000)
      const msg = createMessage('src', 'dst', largePayload)

      expect(msg.payload.length).toBe(1000000)
      expect(sendMessage(msg)).toBeDefined()
    })

    it('should handle special characters in message', () => {
      const specialPayload = '🚀 @#$%^&*() "quotes" and\nnewlines\ttabs'
      const msg = createMessage('src', 'dst', specialPayload)

      expect(msg.payload).toContain('🚀')
      expect(sendMessage(msg)).toBeDefined()
    })
  })
})
