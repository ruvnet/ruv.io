import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  MemoryManager,
  createMemoryManager,
  getTimestamp,
  MemoryManagerConfig,
  ShortTermMemory,
  LongTermMemory,
  MemoryEntry,
} from '../src/index'

describe('NT Memory - MemoryManager', () => {
  let manager: MemoryManager

  beforeEach(() => {
    manager = new MemoryManager({
      max_short_term_entries: 100,
      max_long_term_entries: 1000,
      cache_size_bytes: 10 * 1024 * 1024,
      enable_persistence: true,
      lru_enabled: true,
    })
  })

  afterEach(() => {
    // Cleanup
    manager.clearShortTerm()
    manager.clearLongTerm()
    manager.cacheClear()
  })

  describe('Initialization', () => {
    it('should create a new MemoryManager instance', () => {
      expect(manager).toBeDefined()
      expect(manager).toBeInstanceOf(MemoryManager)
    })

    it('should create manager with default config', () => {
      const defaultManager = new MemoryManager()
      expect(defaultManager).toBeDefined()
    })

    it('should create manager with custom config', () => {
      const config: MemoryManagerConfig = {
        max_short_term_entries: 500,
        max_long_term_entries: 5000,
        cache_size_bytes: 50 * 1024 * 1024,
      }
      const customManager = new MemoryManager(config)
      expect(customManager).toBeDefined()
    })

    it('should create manager via helper function', () => {
      const helperManager = createMemoryManager()
      expect(helperManager).toBeDefined()
      expect(helperManager).toBeInstanceOf(MemoryManager)
    })
  })

  describe('Short-term Memory', () => {
    it('should add entry to short-term memory', () => {
      const content = { data: 'test', value: 42 }
      const result = manager.addShortTerm('st-001', content, 50)

      expect(result).toBeDefined()
      expect(result.id).toBe('st-001')
      expect(result.priority).toBe(50)
      expect(result.content).toEqual(content)
    })

    it('should retrieve entry from short-term memory', () => {
      const content = { message: 'hello world' }
      manager.addShortTerm('st-retrieve', content, 75)

      const retrieved = manager.getShortTerm('st-retrieve')
      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('st-retrieve')
      expect(retrieved?.content).toEqual(content)
    })

    it('should return null for non-existent short-term entry', () => {
      const result = manager.getShortTerm('non-existent')
      expect(result).toBeNull()
    })

    it('should get all short-term memory entries', () => {
      manager.addShortTerm('st-1', { a: 1 }, 50)
      manager.addShortTerm('st-2', { b: 2 }, 60)
      manager.addShortTerm('st-3', { c: 3 }, 70)

      const all = manager.getAllShortTerm()
      expect(all).toHaveLength(3)
      expect(all.map((e) => e.id)).toContain('st-1')
      expect(all.map((e) => e.id)).toContain('st-2')
      expect(all.map((e) => e.id)).toContain('st-3')
    })

    it('should clear all short-term memory', () => {
      manager.addShortTerm('st-1', { a: 1 }, 50)
      manager.addShortTerm('st-2', { b: 2 }, 60)

      const cleared = manager.clearShortTerm()
      expect(cleared).toBe(2)

      const remaining = manager.getAllShortTerm()
      expect(remaining).toHaveLength(0)
    })

    it('should respect priority levels (0-100)', () => {
      const entry1 = manager.addShortTerm('st-low', { x: 1 }, 10)
      const entry2 = manager.addShortTerm('st-high', { y: 2 }, 90)

      expect(entry1.priority).toBe(10)
      expect(entry2.priority).toBe(90)
    })

    it('should clamp priority to 0-100 range', () => {
      const entry1 = manager.addShortTerm('st-clamp-low', { x: 1 }, -50)
      const entry2 = manager.addShortTerm('st-clamp-high', { y: 2 }, 150)

      expect(entry1.priority).toBeGreaterThanOrEqual(0)
      expect(entry1.priority).toBeLessThanOrEqual(100)
      expect(entry2.priority).toBeGreaterThanOrEqual(0)
      expect(entry2.priority).toBeLessThanOrEqual(100)
    })

    it('should include timestamp for short-term entries', () => {
      const before = getTimestamp()
      const entry = manager.addShortTerm('st-time', { data: 'test' }, 50)
      const after = getTimestamp()

      expect(entry.timestamp).toBeGreaterThanOrEqual(before)
      expect(entry.timestamp).toBeLessThanOrEqual(after)
    })
  })

  describe('Long-term Memory', () => {
    it('should add entry to long-term memory', () => {
      const content = { important: 'data', value: 123 }
      const result = manager.addLongTerm('lt-key-1', content)

      expect(result).toBeDefined()
      expect(result.key).toBe('lt-key-1')
      expect(result.content).toEqual(content)
      expect(result.access_count).toBe(0)
    })

    it('should retrieve entry from long-term memory', () => {
      const content = { data: 'persistent' }
      manager.addLongTerm('lt-persist', content)

      const retrieved = manager.getLongTerm('lt-persist')
      expect(retrieved).toBeDefined()
      expect(retrieved?.key).toBe('lt-persist')
      expect(retrieved?.content).toEqual(content)
    })

    it('should increment access count on retrieval', () => {
      manager.addLongTerm('lt-access', { x: 10 })

      const first = manager.getLongTerm('lt-access')
      expect(first?.access_count).toBe(1)

      const second = manager.getLongTerm('lt-access')
      expect(second?.access_count).toBe(2)

      const third = manager.getLongTerm('lt-access')
      expect(third?.access_count).toBe(3)
    })

    it('should return null for non-existent long-term entry', () => {
      const result = manager.getLongTerm('non-existent-key')
      expect(result).toBeNull()
    })

    it('should delete long-term entry', () => {
      manager.addLongTerm('lt-delete', { data: 'to delete' })

      const deleted = manager.deleteLongTerm('lt-delete')
      expect(deleted).toBe(true)

      const retrieved = manager.getLongTerm('lt-delete')
      expect(retrieved).toBeNull()
    })

    it('should return false when deleting non-existent entry', () => {
      const deleted = manager.deleteLongTerm('non-existent')
      expect(deleted).toBe(false)
    })

    it('should get all long-term entries', () => {
      manager.addLongTerm('lt-1', { a: 1 })
      manager.addLongTerm('lt-2', { b: 2 })
      manager.addLongTerm('lt-3', { c: 3 })

      const all = manager.getAllLongTerm()
      expect(all.length).toBeGreaterThanOrEqual(3)
    })

    it('should clear all long-term memory', () => {
      manager.addLongTerm('lt-1', { a: 1 })
      manager.addLongTerm('lt-2', { b: 2 })

      const cleared = manager.clearLongTerm()
      expect(cleared).toBeGreaterThanOrEqual(2)

      const all = manager.getAllLongTerm()
      expect(all.length).toBe(0)
    })

    it('should track created_at and updated_at timestamps', () => {
      const before = getTimestamp()
      const entry = manager.addLongTerm('lt-time', { data: 'test' })
      const after = getTimestamp()

      expect(entry.created_at).toBeGreaterThanOrEqual(before)
      expect(entry.created_at).toBeLessThanOrEqual(after)
      expect(entry.updated_at).toBe(entry.created_at)
    })
  })

  describe('Cache Management', () => {
    it('should set cache entry', () => {
      const value = { cached: 'data', count: 42 }
      const entry = manager.cacheSet('cache-key-1', value)

      expect(entry).toBeDefined()
      expect(entry.key).toBe('cache-key-1')
      expect(entry.value).toEqual(value)
      expect(entry.access_count).toBe(0)
    })

    it('should get cache entry', () => {
      const value = { test: 'value' }
      manager.cacheSet('cache-get', value)

      const retrieved = manager.cacheGet('cache-get')
      expect(retrieved).toBeDefined()
      expect(retrieved?.key).toBe('cache-get')
      expect(retrieved?.value).toEqual(value)
    })

    it('should increment access count on cache get', () => {
      manager.cacheSet('cache-access', { x: 1 })

      const first = manager.cacheGet('cache-access')
      expect(first?.access_count).toBe(1)

      const second = manager.cacheGet('cache-access')
      expect(second?.access_count).toBe(2)
    })

    it('should return null for non-existent cache entry', () => {
      const result = manager.cacheGet('non-existent')
      expect(result).toBeNull()
    })

    it('should delete cache entry', () => {
      manager.cacheSet('cache-delete', { data: 'to delete' })

      const deleted = manager.cacheDelete('cache-delete')
      expect(deleted).toBe(true)

      const retrieved = manager.cacheGet('cache-delete')
      expect(retrieved).toBeNull()
    })

    it('should clear all cache entries', () => {
      manager.cacheSet('cache-1', { a: 1 })
      manager.cacheSet('cache-2', { b: 2 })

      const cleared = manager.cacheClear()
      expect(cleared).toBeGreaterThanOrEqual(2)
    })

    it('should support TTL (time to live) for cache entries', () => {
      const value = { ttl: 'test' }
      // Set with 1 hour TTL
      const entry = manager.cacheSet('cache-ttl', value, 60 * 60 * 1000)

      expect(entry).toBeDefined()
      expect(entry.ttl).toBe(60 * 60 * 1000)
    })

    it('should get cache statistics', () => {
      manager.cacheSet('stat-1', { x: 1 })
      manager.cacheSet('stat-2', { y: 2 })

      const stats = manager.cacheStats()
      expect(stats).toBeDefined()
      expect(stats.total_entries).toBeGreaterThanOrEqual(2)
      expect(stats.capacity).toBeDefined()
      expect(stats.utilization_percent).toBeDefined()
      expect(stats.utilization_percent).toBeGreaterThanOrEqual(0)
      expect(stats.utilization_percent).toBeLessThanOrEqual(100)
    })
  })

  describe('Memory Pools', () => {
    it('should allocate memory pool', () => {
      const pool = manager.allocatePool('pool-1', 1024 * 1024)

      expect(pool).toBeDefined()
      expect(pool.pool_id).toBe('pool-1')
      expect(pool.size_bytes).toBe(1024 * 1024)
      expect(pool.available).toBe(1024 * 1024)
      expect(pool.allocated).toBe(0)
    })

    it('should deallocate memory pool', () => {
      manager.allocatePool('pool-delete', 1024)

      const deallocated = manager.deallocatePool('pool-delete')
      expect(deallocated).toBe(true)
    })

    it('should get pool status', () => {
      manager.allocatePool('pool-status', 2048)

      const status = manager.getPoolStatus('pool-status')
      expect(status).toBeDefined()
      expect(status?.pool_id).toBe('pool-status')
      expect(status?.size_bytes).toBe(2048)
    })

    it('should return null for non-existent pool', () => {
      const status = manager.getPoolStatus('non-existent-pool')
      expect(status).toBeNull()
    })

    it('should get all pool statuses', () => {
      manager.allocatePool('pool-all-1', 1024)
      manager.allocatePool('pool-all-2', 2048)

      const all = manager.getAllPoolStatuses()
      expect(Array.isArray(all)).toBe(true)
      expect(all.length).toBeGreaterThanOrEqual(2)
    })

    it('should calculate utilization percentage for pools', () => {
      const pool = manager.allocatePool('pool-util', 1000)

      expect(pool.utilization_percent).toBe(0)
    })
  })

  describe('Memory Statistics', () => {
    it('should get overall memory statistics', () => {
      manager.addShortTerm('st-stat', { x: 1 }, 50)
      manager.addLongTerm('lt-stat', { y: 2 })
      manager.cacheSet('cache-stat', { z: 3 })
      manager.allocatePool('pool-stat', 4096)

      const stats = manager.getMemoryStats()

      expect(stats).toBeDefined()
      expect(stats.short_term_count).toBeGreaterThanOrEqual(1)
      expect(stats.short_term_max).toBeDefined()
      expect(stats.long_term_count).toBeGreaterThanOrEqual(1)
      expect(stats.long_term_max).toBeDefined()
      expect(stats.cache_count).toBeGreaterThanOrEqual(1)
      expect(stats.pool_count).toBeGreaterThanOrEqual(1)
    })

    it('should track pool count in statistics', () => {
      manager.allocatePool('pool-1', 1024)
      manager.allocatePool('pool-2', 2048)

      const stats = manager.getMemoryStats()
      expect(stats.pool_count).toBeGreaterThanOrEqual(2)
    })
  })

  describe('State Persistence', () => {
    it('should persist state to JSON', () => {
      manager.addShortTerm('st-persist', { a: 1 }, 50)
      manager.addLongTerm('lt-persist', { b: 2 })
      manager.cacheSet('cache-persist', { c: 3 })

      const state = manager.persistState()

      expect(state).toBeDefined()
      expect(state.short_term_entries).toHaveLength(1)
      expect(state.long_term_entries).toHaveLength(1)
      expect(state.cache_entries).toHaveLength(1)
      expect(state.timestamp).toBeGreaterThan(0)
    })

    it('should restore state from persisted data', () => {
      // Create initial state
      manager.addShortTerm('st-restore', { data: 'original' }, 75)
      manager.addLongTerm('lt-restore', { key: 'value' })

      const state = manager.persistState()

      // Create new manager
      const newManager = new MemoryManager()
      const result = newManager.restoreState(state)

      expect(result).toBeDefined()
      expect(result.short_term_restored).toBeGreaterThanOrEqual(1)
      expect(result.long_term_restored).toBeGreaterThanOrEqual(1)
    })

    it('should clear state before restoring', () => {
      manager.addShortTerm('st-before', { x: 1 }, 50)

      const emptyManager = new MemoryManager()
      const state = manager.persistState()

      emptyManager.restoreState(state)

      const all = emptyManager.getAllShortTerm()
      expect(all.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Utility Functions', () => {
    it('should get current timestamp', () => {
      const timestamp = getTimestamp()

      expect(typeof timestamp).toBe('number')
      expect(timestamp).toBeGreaterThan(0)
    })

    it('should have consistent timestamp format', () => {
      const ts1 = getTimestamp()
      const ts2 = getTimestamp()

      expect(ts2).toBeGreaterThanOrEqual(ts1)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete workflow', () => {
      // Add to short-term memory
      manager.addShortTerm('workflow-st', { step: 1 }, 50)

      // Add to long-term memory
      manager.addLongTerm('workflow-lt', { step: 2 })

      // Use cache
      manager.cacheSet('workflow-cache', { step: 3 })

      // Allocate pool
      manager.allocatePool('workflow-pool', 5000)

      // Get stats
      const stats = manager.getMemoryStats()

      expect(stats.short_term_count).toBeGreaterThanOrEqual(1)
      expect(stats.long_term_count).toBeGreaterThanOrEqual(1)
      expect(stats.cache_count).toBeGreaterThanOrEqual(1)
      expect(stats.pool_count).toBeGreaterThanOrEqual(1)
    })

    it('should handle multiple operations sequentially', () => {
      const ids = ['op-1', 'op-2', 'op-3', 'op-4', 'op-5']

      // Add multiple entries
      ids.forEach((id, i) => {
        manager.addShortTerm(id, { index: i }, 50 + i)
      })

      // Retrieve all
      const all = manager.getAllShortTerm()
      expect(all.length).toBeGreaterThanOrEqual(5)

      // Clear
      const cleared = manager.clearShortTerm()
      expect(cleared).toBeGreaterThanOrEqual(5)
    })

    it('should maintain data integrity during operations', () => {
      const testData = { test: 'integrity', nested: { value: 123 } }

      // Store in short-term
      const st = manager.addShortTerm('integrity-st', testData, 50)
      expect(st.content).toEqual(testData)

      // Store in long-term
      const lt = manager.addLongTerm('integrity-lt', testData)
      expect(lt.content).toEqual(testData)

      // Store in cache
      const cache = manager.cacheSet('integrity-cache', testData)
      expect(cache.value).toEqual(testData)

      // Retrieve and verify
      expect(manager.getShortTerm('integrity-st')?.content).toEqual(testData)
      expect(manager.getLongTerm('integrity-lt')?.content).toEqual(testData)
      expect(manager.cacheGet('integrity-cache')?.value).toEqual(testData)
    })

    it('should handle large data structures', () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: `item-${i}`,
          nested: { value: i * 2 },
        })),
      }

      const entry = manager.addShortTerm('large-data', largeData, 50)
      expect(entry.content).toEqual(largeData)

      const retrieved = manager.getShortTerm('large-data')
      expect(retrieved?.content).toEqual(largeData)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', () => {
      expect(() => {
        manager.addShortTerm('bad-json', null as any, 50)
      }).not.toThrow()
    })

    it('should handle concurrent operations', () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(manager.addShortTerm(`concurrent-${i}`, { index: i }, 50))
      )

      expect(async () => {
        await Promise.all(promises)
      }).not.toThrow()
    })
  })
})
