import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  DhtNode,
  hashKey,
  validateKey,
  createDefaultConfig,
  calculateEntrySize,
  createDhtEntry,
  DhtConfig,
  DhtEntry,
  RoutingEntry,
  LookupResult,
  ReplicationStatus,
} from '../src/index'

describe('DAA Prime DHT - Distributed Hash Table', () => {
  let dhtNode: DhtNode

  beforeAll(() => {
    dhtNode = new DhtNode({
      k_param: 20,
      replication_factor: 3,
      default_ttl_ms: 3600000,
    })
  })

  describe('DhtNode - Initialization', () => {
    it('should create a new DHT node with default config', () => {
      const node = new DhtNode()
      expect(node).toBeDefined()
      expect(node).toBeInstanceOf(DhtNode)
    })

    it('should create a new DHT node with custom config', () => {
      const config: DhtConfig = {
        k_param: 20,
        replication_factor: 3,
        default_ttl_ms: 7200000,
      }
      const node = new DhtNode(config)
      expect(node).toBeDefined()
    })

    it('should have a valid node ID', () => {
      const nodeId = dhtNode.getNodeId()
      expect(nodeId).toBeDefined()
      expect(typeof nodeId).toBe('string')
      expect(nodeId.length).toBeGreaterThan(0)
    })

    it('should retrieve configuration', () => {
      const config = dhtNode.getConfig()
      expect(config).toBeDefined()
      expect(config.k_param).toBeGreaterThan(0)
      expect(config.replication_factor).toBeGreaterThan(0)
    })

    it('should start with zero entries', () => {
      const node = new DhtNode()
      expect(node.entryCount()).toBe(0)
    })

    it('should start with zero peers', () => {
      const node = new DhtNode()
      expect(node.peerCount()).toBe(0)
    })
  })

  describe('DhtNode - Put/Get Operations', () => {
    it('should store a value and retrieve it', () => {
      const key = 'test-key-1'
      const value = 'test-value-1'

      const putResult = dhtNode.put(key, value)
      expect(putResult).toBe(true)

      const entry = dhtNode.get(key)
      expect(entry).toBeDefined()
      expect(entry.key).toBe(key)
      expect(entry.value).toBe(value)
    })

    it('should store multiple values', () => {
      const data = [
        { key: 'key-a', value: 'value-a' },
        { key: 'key-b', value: 'value-b' },
        { key: 'key-c', value: 'value-c' },
      ]

      data.forEach((item) => {
        const result = dhtNode.put(item.key, item.value)
        expect(result).toBe(true)
      })

      expect(dhtNode.entryCount()).toBeGreaterThanOrEqual(3)
    })

    it('should update existing key', () => {
      const key = 'update-key'
      dhtNode.put(key, 'initial-value')

      const updated = dhtNode.put(key, 'updated-value')
      expect(updated).toBe(true)

      const entry = dhtNode.get(key)
      expect(entry.value).toBe('updated-value')
    })

    it('should store value with custom TTL', () => {
      const key = 'ttl-key'
      const value = 'ttl-value'
      const customTtl = 7200000 // 2 hours

      const result = dhtNode.put(key, value, customTtl)
      expect(result).toBe(true)

      const entry = dhtNode.get(key)
      expect(entry.ttl).toBe(customTtl)
    })

    it('should throw error when retrieving non-existent key', () => {
      expect(() => dhtNode.get('non-existent-key')).toThrow()
    })

    it('should retrieve all entries', () => {
      const entries = dhtNode.getAllEntries()
      expect(Array.isArray(entries)).toBe(true)
      expect(entries.length).toBeGreaterThan(0)

      entries.forEach((entry) => {
        expect(entry.key).toBeDefined()
        expect(entry.value).toBeDefined()
        expect(entry.timestamp).toBeDefined()
      })
    })
  })

  describe('DhtNode - Delete Operations', () => {
    it('should delete an entry', () => {
      const key = 'delete-key'
      dhtNode.put(key, 'value-to-delete')

      const deleted = dhtNode.delete(key)
      expect(deleted).toBe(true)

      expect(() => dhtNode.get(key)).toThrow()
    })

    it('should throw error when deleting non-existent key', () => {
      expect(() => dhtNode.delete('non-existent-delete-key')).toThrow()
    })

    it('should delete multiple entries', () => {
      const keys = ['del-1', 'del-2', 'del-3']
      keys.forEach((key) => dhtNode.put(key, `value-${key}`))

      keys.forEach((key) => {
        const result = dhtNode.delete(key)
        expect(result).toBe(true)
      })
    })
  })

  describe('DhtNode - Existence Checks', () => {
    it('should check if key exists', () => {
      const key = 'check-key'
      dhtNode.put(key, 'check-value')

      expect(dhtNode.exists(key)).toBe(true)
    })

    it('should return false for non-existent key', () => {
      expect(dhtNode.exists('definitely-non-existent')).toBe(false)
    })

    it('should check multiple keys', () => {
      const keys = ['exist-1', 'exist-2', 'exist-3']
      keys.forEach((key) => dhtNode.put(key, `value-${key}`))

      keys.forEach((key) => {
        expect(dhtNode.exists(key)).toBe(true)
      })
    })
  })

  describe('DhtNode - Lookup Operations', () => {
    it('should perform a lookup', () => {
      const key = 'lookup-key'
      dhtNode.put(key, 'lookup-value')

      const result = dhtNode.lookup(key)
      expect(result).toBeDefined()
      expect(typeof result.found).toBe('boolean')
      expect(result.nodes_queried).toBeGreaterThan(0)
    })

    it('should perform lookup with custom max hops', () => {
      const key = 'lookup-hops-key'
      dhtNode.put(key, 'lookup-hops-value')

      const result = dhtNode.lookup(key, 10)
      expect(result).toBeDefined()
      expect(result.nodes_queried).toBeGreaterThan(0)
    })

    it('should handle lookup for stored key', () => {
      const key = 'stored-lookup-key'
      const value = 'stored-lookup-value'
      dhtNode.put(key, value)

      const result = dhtNode.lookup(key)
      expect(result.nodes_queried).toBeGreaterThanOrEqual(1)
    })

    it('should handle lookup for non-stored key', () => {
      const result = dhtNode.lookup('non-stored-lookup-key')
      expect(result.found).toBe(false)
      expect(result.nodes_queried).toBeGreaterThan(0)
    })
  })

  describe('DhtNode - Peer Management', () => {
    it('should add a peer to routing table', () => {
      const nodeId = 'peer-node-1'
      const distance = 100

      const result = dhtNode.addPeer(nodeId, distance)
      expect(result).toBe(true)
      expect(dhtNode.peerCount()).toBeGreaterThan(0)
    })

    it('should add multiple peers', () => {
      const peers = [
        { nodeId: 'peer-a', distance: 50 },
        { nodeId: 'peer-b', distance: 100 },
        { nodeId: 'peer-c', distance: 150 },
      ]

      peers.forEach((peer) => {
        const result = dhtNode.addPeer(peer.nodeId, peer.distance)
        expect(result).toBe(true)
      })

      expect(dhtNode.peerCount()).toBeGreaterThanOrEqual(3)
    })

    it('should get all peers', () => {
      dhtNode.addPeer('peer-get-1', 100)
      dhtNode.addPeer('peer-get-2', 200)

      const peers = dhtNode.getPeers()
      expect(Array.isArray(peers)).toBe(true)
      expect(peers.length).toBeGreaterThan(0)

      peers.forEach((peer) => {
        expect(peer.node_id).toBeDefined()
        expect(peer.distance).toBeGreaterThanOrEqual(0)
        expect(peer.reachable).toBeDefined()
      })
    })

    it('should remove a peer', () => {
      const nodeId = 'peer-to-remove'
      dhtNode.addPeer(nodeId, 100)

      const result = dhtNode.removePeer(nodeId)
      expect(result).toBe(true)
    })

    it('should throw error when removing non-existent peer', () => {
      expect(() => dhtNode.removePeer('non-existent-peer')).toThrow()
    })

    it('should update peer information', () => {
      const nodeId = 'peer-update'
      dhtNode.addPeer(nodeId, 100)

      // Adding same peer again should update it
      const result = dhtNode.addPeer(nodeId, 150)
      expect(result).toBe(true)
    })
  })

  describe('DhtNode - Statistics and Health', () => {
    it('should get node statistics', () => {
      const stats = dhtNode.getStats()
      expect(stats).toBeDefined()
      expect(stats.node_id).toBeDefined()
      expect(typeof stats.total_entries).toBe('number')
      expect(typeof stats.total_peers).toBe('number')
      expect(stats.k_parameter).toBeGreaterThan(0)
      expect(stats.replication_factor).toBeGreaterThan(0)
    })

    it('should perform health check', () => {
      const health = dhtNode.healthCheck()
      expect(health).toBeDefined()
      expect(health.status).toBe('healthy')
      expect(health.node_id).toBeDefined()
      expect(typeof health.entries_stored).toBe('number')
      expect(typeof health.peers_connected).toBe('number')
    })

    it('should track entry count', () => {
      const countBefore = dhtNode.entryCount()
      dhtNode.put('stat-key', 'stat-value')
      const countAfter = dhtNode.entryCount()

      expect(countAfter).toBeGreaterThanOrEqual(countBefore)
    })

    it('should track peer count', () => {
      const countBefore = dhtNode.peerCount()
      dhtNode.addPeer('peer-stat', 200)
      const countAfter = dhtNode.peerCount()

      expect(countAfter).toBeGreaterThanOrEqual(countBefore)
    })
  })

  describe('DhtNode - Replication Management', () => {
    it('should get replication status', () => {
      const key = 'replication-key'
      dhtNode.put(key, 'replication-value')

      const status = dhtNode.getReplicationStatus(key)
      expect(status).toBeDefined()
      expect(status.key).toBe(key)
      expect(status.replicas_created).toBeGreaterThan(0)
      expect(status.consistency_level).toBeDefined()
    })

    it('should handle replication for multiple keys', () => {
      const keys = ['rep-1', 'rep-2', 'rep-3']
      keys.forEach((key) => {
        dhtNode.put(key, `rep-value-${key}`)
      })

      keys.forEach((key) => {
        const status = dhtNode.getReplicationStatus(key)
        expect(status.key).toBe(key)
      })
    })
  })

  describe('DhtNode - Storage Management', () => {
    it('should clear all storage', () => {
      dhtNode.put('clear-test-1', 'value-1')
      dhtNode.put('clear-test-2', 'value-2')

      const result = dhtNode.clear()
      expect(result).toBe(true)

      expect(dhtNode.entryCount()).toBe(0)
    })

    it('should handle empty storage', () => {
      const node = new DhtNode()
      const entries = node.getAllEntries()
      expect(Array.isArray(entries)).toBe(true)
      expect(entries.length).toBe(0)
    })
  })

  describe('Standalone Functions - Key Management', () => {
    it('should hash a key', () => {
      const key = 'test-key'
      const hash = hashKey(key)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should produce consistent hash for same key', () => {
      const key = 'consistent-key'
      const hash1 = hashKey(key)
      const hash2 = hashKey(key)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hash for different keys', () => {
      const hash1 = hashKey('key-1')
      const hash2 = hashKey('key-2')

      expect(hash1).not.toBe(hash2)
    })

    it('should validate valid keys', () => {
      const validKeys = ['key-1', 'simple-key', 'key_with_underscore']

      validKeys.forEach((key) => {
        expect(validateKey(key)).toBe(true)
      })
    })

    it('should reject empty keys', () => {
      expect(validateKey('')).toBe(false)
    })

    it('should reject excessively long keys', () => {
      const longKey = 'k'.repeat(500)
      expect(validateKey(longKey)).toBe(false)
    })
  })

  describe('Standalone Functions - Configuration', () => {
    it('should create default configuration', () => {
      const config = createDefaultConfig()

      expect(config).toBeDefined()
      expect(config.node_id).toBeDefined()
      expect(config.k_param).toBeGreaterThan(0)
      expect(config.replication_factor).toBeGreaterThan(0)
      expect(config.default_ttl_ms).toBeGreaterThan(0)
    })

    it('should have unique node IDs in configs', () => {
      const config1 = createDefaultConfig()
      const config2 = createDefaultConfig()

      expect(config1.node_id).not.toBe(config2.node_id)
    })
  })

  describe('Standalone Functions - Entry Management', () => {
    it('should calculate entry size', () => {
      const key = 'size-test-key'
      const value = 'size-test-value'

      const size = calculateEntrySize(key, value)
      expect(size).toBeGreaterThan(0)
      expect(typeof size).toBe('number')
    })

    it('should calculate correct size for different values', () => {
      const size1 = calculateEntrySize('key', 'short')
      const size2 = calculateEntrySize('key', 'much-longer-value-string')

      expect(size2).toBeGreaterThan(size1)
    })

    it('should create DHT entry', () => {
      const key = 'entry-key'
      const value = 'entry-value'

      const entry = createDhtEntry(key, value)
      expect(entry).toBeDefined()
      expect(entry.key).toBe(key)
      expect(entry.value).toBe(value)
      expect(entry.timestamp).toBeDefined()
      expect(entry.ttl).toBeGreaterThan(0)
    })

    it('should create DHT entry with custom TTL', () => {
      const key = 'custom-ttl-key'
      const value = 'custom-ttl-value'
      const customTtl = 1800000

      const entry = createDhtEntry(key, value, customTtl)
      expect(entry.ttl).toBe(customTtl)
    })

    it('should create DHT entries with default TTL', () => {
      const entry1 = createDhtEntry('key1', 'value1')
      const entry2 = createDhtEntry('key2', 'value2')

      expect(entry1.ttl).toBe(entry2.ttl)
    })
  })

  describe('Integration Tests - Complex Workflows', () => {
    it('should handle complete put-get-delete workflow', () => {
      const key = 'workflow-key'
      const value = 'workflow-value'

      // Put
      expect(dhtNode.put(key, value)).toBe(true)

      // Get
      const entry = dhtNode.get(key)
      expect(entry.value).toBe(value)

      // Exists
      expect(dhtNode.exists(key)).toBe(true)

      // Delete
      expect(dhtNode.delete(key)).toBe(true)

      // Verify deleted
      expect(dhtNode.exists(key)).toBe(false)
    })

    it('should handle peer and storage operations together', () => {
      const testNode = new DhtNode()

      // Add peers
      testNode.addPeer('peer-1', 100)
      testNode.addPeer('peer-2', 200)

      // Add data
      testNode.put('data-1', 'value-1')
      testNode.put('data-2', 'value-2')

      // Verify
      expect(testNode.peerCount()).toBeGreaterThanOrEqual(2)
      expect(testNode.entryCount()).toBeGreaterThanOrEqual(2)

      // Check stats
      const stats = testNode.getStats()
      expect(stats.total_entries).toBeGreaterThanOrEqual(2)
      expect(stats.total_peers).toBeGreaterThanOrEqual(2)
    })

    it('should handle concurrent operations', () => {
      const testNode = new DhtNode()

      // Multiple puts
      for (let i = 0; i < 10; i++) {
        testNode.put(`concurrent-key-${i}`, `concurrent-value-${i}`)
      }

      // Multiple gets
      for (let i = 0; i < 10; i++) {
        const entry = testNode.get(`concurrent-key-${i}`)
        expect(entry.value).toBe(`concurrent-value-${i}`)
      }

      // Multiple lookups
      for (let i = 0; i < 5; i++) {
        const result = testNode.lookup(`concurrent-key-${i}`)
        expect(result).toBeDefined()
      }

      expect(testNode.entryCount()).toBeGreaterThanOrEqual(10)
    })

    it('should maintain consistency across operations', () => {
      const testNode = new DhtNode()
      const testData: Record<string, string> = {}

      // Store data
      for (let i = 0; i < 20; i++) {
        const key = `consistency-${i}`
        const value = `val-${i}`
        testNode.put(key, value)
        testData[key] = value
      }

      // Verify all data is consistent
      for (const [key, expectedValue] of Object.entries(testData)) {
        const entry = testNode.get(key)
        expect(entry.value).toBe(expectedValue)
      }

      // Get all and verify count
      const allEntries = testNode.getAllEntries()
      expect(allEntries.length).toBeGreaterThanOrEqual(20)
    })

    it('should handle data with special characters', () => {
      const testNode = new DhtNode()

      const specialTests = [
        { key: 'special-1', value: 'value with spaces' },
        { key: 'special-2', value: 'value\nwith\nnewlines' },
        { key: 'special-3', value: 'value\twith\ttabs' },
        { key: 'special-4', value: '{"json": "object"}' },
        { key: 'special-5', value: 'unicode: café, 中文, 🚀' },
      ]

      specialTests.forEach((test) => {
        testNode.put(test.key, test.value)
      })

      specialTests.forEach((test) => {
        const entry = testNode.get(test.key)
        expect(entry.value).toBe(test.value)
      })
    })
  })
})
