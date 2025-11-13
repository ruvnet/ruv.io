import { describe, it, expect, beforeEach } from 'vitest'
import {
  DaaPrimeCore,
  hashData,
  validatePeerAddress,
  createProtocolMessage,
  type Config,
  type PeerInfo,
  type ModelMetadata,
  type TrainingResult,
} from '../src/index'

describe('DAA Prime Core', () => {
  describe('DaaPrimeCore Class', () => {
    let client: DaaPrimeCore

    beforeEach(() => {
      client = new DaaPrimeCore()
    })

    it('should create a client instance with default config', () => {
      expect(client).toBeDefined()
    })

    it('should create a client with custom config', () => {
      const config: Config = {
        node_id: 'test-node-1',
        timeout_ms: 60000,
        max_retries: 5,
        batch_size: 64,
      }
      const customClient = new DaaPrimeCore(config)
      expect(customClient).toBeDefined()
    })

    describe('Configuration', () => {
      it('should get default configuration', () => {
        const config = client.getConfig()
        expect(config).toBeDefined()
        expect(config.timeout_ms).toBeGreaterThan(0)
        expect(config.batch_size).toBeGreaterThan(0)
      })

      it('should get custom configuration', () => {
        const customConfig: Config = {
          node_id: 'custom-node',
          timeout_ms: 45000,
          max_retries: 4,
          batch_size: 16,
        }
        const customClient = new DaaPrimeCore(customConfig)
        const config = customClient.getConfig()
        expect(config.node_id).toBe('custom-node')
        expect(config.timeout_ms).toBe(45000)
        expect(config.max_retries).toBe(4)
        expect(config.batch_size).toBe(16)
      })
    })

    describe('Peer Management', () => {
      it('should initially have 0 peers', () => {
        const count = client.peerCount()
        expect(count).toBe(0)
      })

      it('should register a peer', () => {
        const peer: PeerInfo = {
          peer_id: 'peer-1',
          host: '192.168.1.1',
          port: 8080,
          public_key: 'key-1',
        }
        const result = client.registerPeer(peer)
        expect(result).toBe(true)
      })

      it('should have 1 peer after registration', () => {
        const peer: PeerInfo = {
          peer_id: 'peer-1',
          host: '192.168.1.1',
          port: 8080,
          public_key: 'key-1',
        }
        client.registerPeer(peer)
        const count = client.peerCount()
        expect(count).toBe(1)
      })

      it('should register multiple peers', () => {
        const peer1: PeerInfo = {
          peer_id: 'peer-1',
          host: '192.168.1.1',
          port: 8080,
          public_key: 'key-1',
        }
        const peer2: PeerInfo = {
          peer_id: 'peer-2',
          host: '192.168.1.2',
          port: 8081,
          public_key: 'key-2',
        }
        client.registerPeer(peer1)
        client.registerPeer(peer2)
        const count = client.peerCount()
        expect(count).toBe(2)
      })

      it('should list all peers', () => {
        const peer1: PeerInfo = {
          peer_id: 'peer-1',
          host: '192.168.1.1',
          port: 8080,
          public_key: 'key-1',
        }
        const peer2: PeerInfo = {
          peer_id: 'peer-2',
          host: '192.168.1.2',
          port: 8081,
          public_key: 'key-2',
        }
        client.registerPeer(peer1)
        client.registerPeer(peer2)

        const peers = client.listPeers()
        expect(peers).toHaveLength(2)
        expect(peers[0].peer_id).toBe('peer-1')
        expect(peers[1].peer_id).toBe('peer-2')
      })

      it('should return empty array when no peers', () => {
        const peers = client.listPeers()
        expect(peers).toHaveLength(0)
      })
    })

    describe('Model Management', () => {
      it('should initially have 0 models', () => {
        const models = client.listModels()
        expect(models).toHaveLength(0)
      })

      it('should create a model', () => {
        const model: ModelMetadata = {
          model_id: 'model-1',
          version: '1.0.0',
          parameters: { learning_rate: 0.001, batch_size: 32 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const result = client.createModel(model)
        expect(result).toBeDefined()
        expect(result.model_id).toBe('model-1')
      })

      it('should have 1 model after creation', () => {
        const model: ModelMetadata = {
          model_id: 'model-1',
          version: '1.0.0',
          parameters: { learning_rate: 0.001 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        client.createModel(model)
        const models = client.listModels()
        expect(models).toHaveLength(1)
      })

      it('should list multiple models', () => {
        const model1: ModelMetadata = {
          model_id: 'model-1',
          version: '1.0.0',
          parameters: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const model2: ModelMetadata = {
          model_id: 'model-2',
          version: '1.0.0',
          parameters: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        client.createModel(model1)
        client.createModel(model2)

        const models = client.listModels()
        expect(models).toHaveLength(2)
        expect(models[0].model_id).toBe('model-1')
        expect(models[1].model_id).toBe('model-2')
      })

      it('should get a model by ID', () => {
        const model: ModelMetadata = {
          model_id: 'model-1',
          version: '1.0.0',
          parameters: { learning_rate: 0.001 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        client.createModel(model)

        const retrieved = client.getModel('model-1')
        expect(retrieved.model_id).toBe('model-1')
        expect(retrieved.version).toBe('1.0.0')
      })

      it('should throw error when getting non-existent model', () => {
        expect(() => {
          client.getModel('non-existent')
        }).toThrow()
      })
    })

    describe('Protocol Operations', () => {
      it('should process a message', () => {
        const message = createProtocolMessage('init', { data: 'test' })

        const result = client.processMessage(message)
        expect(result).toBeDefined()
        expect(result.status).toBe('processed')
        expect(result.id).toBe(message.id)
      })

      it('should validate supported protocol versions', () => {
        expect(client.validateVersion('1.0')).toBe(true)
        expect(client.validateVersion('1.1')).toBe(true)
        expect(client.validateVersion('2.0')).toBe(true)
      })

      it('should reject invalid protocol versions', () => {
        expect(client.validateVersion('0.1')).toBe(false)
        expect(client.validateVersion('3.0')).toBe(false)
        expect(client.validateVersion('invalid')).toBe(false)
      })

      it('should generate unique message IDs', () => {
        const id1 = client.generateMessageId()
        const id2 = client.generateMessageId()
        expect(id1).toBeDefined()
        expect(id2).toBeDefined()
        expect(id1).not.toBe(id2)
      })
    })

    describe('Model Training', () => {
      it('should train a model', () => {
        const result = client.trainModel('model-1', 100)
        expect(result).toBeDefined()
        expect(result.success).toBe(true)
        expect(result.model_id).toBe('model-1')
        expect(result.accuracy).toBeGreaterThan(0)
        expect(result.accuracy).toBeLessThanOrEqual(1)
        expect(result.loss).toBeGreaterThanOrEqual(0)
        expect(result.loss).toBeLessThan(1)
        expect(result.epochs).toBe(100)
        expect(result.duration_ms).toBeGreaterThan(0)
      })

      it('should improve accuracy with more iterations', () => {
        const result1 = client.trainModel('model-1', 10)
        const result2 = client.trainModel('model-1', 100)
        expect(result2.accuracy).toBeGreaterThanOrEqual(result1.accuracy)
      })

      it('should increase loss duration with iterations', () => {
        const result1 = client.trainModel('model-1', 10)
        const result2 = client.trainModel('model-1', 100)
        expect(result2.duration_ms).toBeGreaterThan(result1.duration_ms)
      })
    })

    describe('Health Check', () => {
      it('should return healthy status', () => {
        const health = client.healthCheck()
        expect(health).toBeDefined()
        expect(health.status).toBe('healthy')
      })

      it('should include node information in health check', () => {
        const health = client.healthCheck()
        expect(health.timestamp).toBeDefined()
        expect(typeof health.peers_connected).toBe('number')
        expect(typeof health.models_loaded).toBe('number')
      })

      it('should reflect peer count in health check', () => {
        const peer: PeerInfo = {
          peer_id: 'peer-1',
          host: '192.168.1.1',
          port: 8080,
          public_key: 'key-1',
        }
        client.registerPeer(peer)

        const health = client.healthCheck()
        expect(health.peers_connected).toBe(1)
      })

      it('should reflect model count in health check', () => {
        const model: ModelMetadata = {
          model_id: 'model-1',
          version: '1.0.0',
          parameters: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        client.createModel(model)

        const health = client.healthCheck()
        expect(health.models_loaded).toBe(1)
      })
    })
  })

  describe('Standalone Functions', () => {
    describe('hashData', () => {
      it('should hash data', () => {
        const hash = hashData('test')
        expect(hash).toBeDefined()
        expect(typeof hash).toBe('string')
        expect(hash.length).toBeGreaterThan(0)
      })

      it('should produce consistent hashes', () => {
        const hash1 = hashData('test')
        const hash2 = hashData('test')
        expect(hash1).toBe(hash2)
      })

      it('should produce different hashes for different data', () => {
        const hash1 = hashData('test1')
        const hash2 = hashData('test2')
        expect(hash1).not.toBe(hash2)
      })

      it('should handle empty string', () => {
        const hash = hashData('')
        expect(hash).toBeDefined()
      })

      it('should handle long strings', () => {
        const longString = 'a'.repeat(10000)
        const hash = hashData(longString)
        expect(hash).toBeDefined()
        expect(typeof hash).toBe('string')
      })
    })

    describe('validatePeerAddress', () => {
      it('should validate correct IP:port format', () => {
        expect(validatePeerAddress('192.168.1.1:8080')).toBe(true)
        expect(validatePeerAddress('127.0.0.1:3000')).toBe(true)
        expect(validatePeerAddress('10.0.0.1:65535')).toBe(true)
      })

      it('should reject invalid formats', () => {
        expect(validatePeerAddress('192.168.1.1')).toBe(false) // missing port
        expect(validatePeerAddress('192.168.1.1:abc')).toBe(false) // non-numeric port
        expect(validatePeerAddress('192.168.1.1:99999')).toBe(false) // port > 65535
        expect(validatePeerAddress(':8080')).toBe(false) // missing IP
      })

      it('should handle edge cases', () => {
        expect(validatePeerAddress('192.168.1.1:0')).toBe(true) // port 0
        expect(validatePeerAddress('localhost:8080')).toBe(true) // hostname
      })

      it('should reject empty string', () => {
        expect(validatePeerAddress('')).toBe(false)
      })
    })

    describe('createProtocolMessage', () => {
      it('should create a protocol message', () => {
        const message = createProtocolMessage('init', { data: 'test' })
        expect(message).toBeDefined()
        expect(message.msg_type).toBe('init')
        expect(message.payload.data).toBe('test')
      })

      it('should have version 2.0', () => {
        const message = createProtocolMessage('init', {})
        expect(message.version).toBe('2.0')
      })

      it('should have a generated ID', () => {
        const message = createProtocolMessage('init', {})
        expect(message.id).toBeDefined()
        expect(typeof message.id).toBe('string')
        expect(message.id.length).toBeGreaterThan(0)
      })

      it('should have a timestamp', () => {
        const message = createProtocolMessage('init', {})
        expect(message.timestamp).toBeDefined()
        expect(typeof message.timestamp).toBe('string')
      })

      it('should preserve complex payloads', () => {
        const payload = {
          data: 'test',
          nested: { key: 'value' },
          array: [1, 2, 3],
        }
        const message = createProtocolMessage('custom', payload)
        expect(message.payload).toEqual(payload)
      })

      it('should generate unique IDs for different messages', () => {
        const message1 = createProtocolMessage('init', {})
        const message2 = createProtocolMessage('init', {})
        expect(message1.id).not.toBe(message2.id)
      })
    })
  })

  describe('Integration Tests', () => {
    let client: DaaPrimeCore

    beforeEach(() => {
      client = new DaaPrimeCore()
    })

    it('should create network with peers and models', () => {
      // Add peers
      const peer1: PeerInfo = {
        peer_id: 'peer-1',
        host: '192.168.1.1',
        port: 8080,
        public_key: 'key-1',
      }
      const peer2: PeerInfo = {
        peer_id: 'peer-2',
        host: '192.168.1.2',
        port: 8081,
        public_key: 'key-2',
      }
      client.registerPeer(peer1)
      client.registerPeer(peer2)

      // Create models
      const model1: ModelMetadata = {
        model_id: 'model-1',
        version: '1.0.0',
        parameters: { lr: 0.001 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const model2: ModelMetadata = {
        model_id: 'model-2',
        version: '1.0.0',
        parameters: { lr: 0.0001 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      client.createModel(model1)
      client.createModel(model2)

      // Check health
      const health = client.healthCheck()
      expect(health.peers_connected).toBe(2)
      expect(health.models_loaded).toBe(2)
    })

    it('should send messages through network', () => {
      // Register a peer
      const peer: PeerInfo = {
        peer_id: 'peer-1',
        host: '192.168.1.1',
        port: 8080,
        public_key: 'key-1',
      }
      client.registerPeer(peer)

      // Create and process a message
      const message = createProtocolMessage('sync', {
        peer_id: 'peer-1',
        data: [1, 2, 3],
      })
      const result = client.processMessage(message)

      expect(result.status).toBe('processed')
      expect(result.id).toBe(message.id)
    })

    it('should train multiple models', () => {
      // Create models
      const models = ['model-1', 'model-2', 'model-3']
      for (const modelId of models) {
        client.createModel({
          model_id: modelId,
          version: '1.0.0',
          parameters: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Train all models
      const results = models.map(modelId => client.trainModel(modelId, 50))

      expect(results).toHaveLength(3)
      results.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.model_id).toBe(models[index])
        expect(result.accuracy).toBeGreaterThan(0)
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    let client: DaaPrimeCore

    beforeEach(() => {
      client = new DaaPrimeCore()
    })

    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        new DaaPrimeCore({} as any)
      }).not.toThrow()
    })

    it('should handle special characters in peer ID', () => {
      const peer: PeerInfo = {
        peer_id: 'peer-!@#$%^&*()',
        host: '192.168.1.1',
        port: 8080,
        public_key: 'key-1',
      }
      expect(() => {
        client.registerPeer(peer)
      }).not.toThrow()
    })

    it('should handle unicode in data', () => {
      const hash = hashData('你好世界🌍')
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should handle large training iterations', () => {
      const result = client.trainModel('model-1', 1000)
      expect(result.success).toBe(true)
      expect(result.epochs).toBe(1000)
    })

    it('should handle message with large payload', () => {
      const largePayload = {
        data: 'x'.repeat(10000),
        array: Array(1000).fill(0),
      }
      const message = createProtocolMessage('large', largePayload)
      expect(message).toBeDefined()
      expect(message.payload).toBeDefined()
    })
  })

  describe('Type Safety', () => {
    it('should maintain type safety for Config', () => {
      const config: Config = {
        node_id: 'test',
        timeout_ms: 5000,
        max_retries: 3,
        batch_size: 32,
      }
      expect(config).toBeDefined()
    })

    it('should maintain type safety for PeerInfo', () => {
      const peer: PeerInfo = {
        peer_id: 'peer-1',
        host: '192.168.1.1',
        port: 8080,
        public_key: 'key',
        last_seen: new Date().toISOString(),
      }
      expect(peer).toBeDefined()
    })

    it('should maintain type safety for TrainingResult', () => {
      const client = new DaaPrimeCore()
      const result = client.trainModel('model-1', 10)

      const typedResult: TrainingResult = result
      expect(typedResult.success).toBe(true)
      expect(typedResult.accuracy).toBeGreaterThan(0)
    })
  })
})
