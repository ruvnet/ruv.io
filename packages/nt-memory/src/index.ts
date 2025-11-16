// NT Memory - Memory Management System for NT Agents
// TypeScript bindings for the napi-rs module

export interface MemoryEntry {
  id: string
  key: string
  value: any
  timestamp: number
  access_count: number
  last_accessed: number
  ttl?: number
}

export interface ShortTermMemory {
  id: string
  content: any
  timestamp: number
  priority: number
}

export interface LongTermMemory {
  id: string
  key: string
  content: any
  created_at: number
  updated_at: number
  access_count: number
}

export interface MemoryPoolAllocation {
  pool_id: string
  size_bytes: number
  allocated: number
  available: number
  utilization_percent: number
}

export interface MemoryManagerConfig {
  max_short_term_entries?: number
  max_long_term_entries?: number
  cache_size_bytes?: number
  enable_persistence?: boolean
  lru_enabled?: boolean
}

export interface PersistenceState {
  short_term_entries: ShortTermMemory[]
  long_term_entries: LongTermMemory[]
  cache_entries: MemoryEntry[]
  timestamp: number
}

/**
 * Native bindings from nt_memory Rust module
 */
let ntMemory: any

try {
  // Load the native module via platform loader
  ntMemory = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_memory module not loaded. Build the project first.')
  ntMemory = null
}

/**
 * MemoryManager - High-performance memory management system for NT agents
 * Provides short-term cache, long-term persistence, memory pools, and LRU eviction
 */
export class MemoryManager {
  private manager: any

  /**
   * Create a new MemoryManager instance
   * @param config - Configuration object for memory management
   */
  constructor(config?: MemoryManagerConfig) {
    if (!ntMemory) {
      throw new Error('Native module not available')
    }

    const configJson = config ? JSON.stringify(config) : undefined
    this.manager = new ntMemory.MemoryManager(configJson)
  }

  /**
   * Add entry to short-term memory
   * @param id - Unique identifier for the entry
   * @param content - Content to store
   * @param priority - Priority level (0-100)
   * @returns Stored memory entry
   */
  addShortTerm(id: string, content: any, priority: number = 50): ShortTermMemory {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const contentJson = JSON.stringify(content)
    const result = this.manager.addShortTerm(id, contentJson, priority)
    return JSON.parse(result)
  }

  /**
   * Retrieve entry from short-term memory
   * @param id - Entry identifier
   * @returns Memory entry if found
   */
  getShortTerm(id: string): ShortTermMemory | null {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.getShortTerm(id)
    return result ? JSON.parse(result) : null
  }

  /**
   * Get all short-term memory entries
   * @returns Array of all short-term entries
   */
  getAllShortTerm(): ShortTermMemory[] {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.getAllShortTerm()
    return JSON.parse(result)
  }

  /**
   * Clear all short-term memory
   * @returns Number of entries cleared
   */
  clearShortTerm(): number {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    return this.manager.clearShortTerm()
  }

  /**
   * Add entry to long-term memory
   * @param key - Key for the entry
   * @param content - Content to store
   * @returns Stored memory entry
   */
  addLongTerm(key: string, content: any): LongTermMemory {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const contentJson = JSON.stringify(content)
    const result = this.manager.addLongTerm(key, contentJson)
    return JSON.parse(result)
  }

  /**
   * Retrieve entry from long-term memory
   * @param key - Entry key
   * @returns Memory entry if found
   */
  getLongTerm(key: string): LongTermMemory | null {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.getLongTerm(key)
    return result ? JSON.parse(result) : null
  }

  /**
   * Get all long-term memory entries
   * @returns Array of all long-term entries
   */
  getAllLongTerm(): LongTermMemory[] {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.getAllLongTerm()
    return JSON.parse(result)
  }

  /**
   * Delete entry from long-term memory
   * @param key - Entry key
   * @returns Success status
   */
  deleteLongTerm(key: string): boolean {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    return this.manager.deleteLongTerm(key)
  }

  /**
   * Clear all long-term memory
   * @returns Number of entries cleared
   */
  clearLongTerm(): number {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    return this.manager.clearLongTerm()
  }

  /**
   * Set cache entry with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Time to live in milliseconds (0 for no TTL)
   * @returns Cached entry
   */
  cacheSet(key: string, value: any, ttlMs: number = 0): MemoryEntry {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const valueJson = JSON.stringify(value)
    const result = this.manager.cacheSet(key, valueJson, ttlMs)
    return JSON.parse(result)
  }

  /**
   * Get cache entry
   * @param key - Cache key
   * @returns Cached entry if found
   */
  cacheGet(key: string): MemoryEntry | null {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.cacheGet(key)
    return result ? JSON.parse(result) : null
  }

  /**
   * Delete cache entry
   * @param key - Cache key
   * @returns Success status
   */
  cacheDelete(key: string): boolean {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    return this.manager.cacheDelete(key)
  }

  /**
   * Clear all cache entries
   * @returns Number of entries cleared
   */
  cacheClear(): number {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    return this.manager.cacheClear()
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  cacheStats(): Record<string, any> {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.cacheStats()
    return JSON.parse(result)
  }

  /**
   * Allocate a memory pool
   * @param poolId - Pool identifier
   * @param sizeBytes - Pool size in bytes
   * @returns Pool allocation info
   */
  allocatePool(poolId: string, sizeBytes: number): MemoryPoolAllocation {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.allocatePool(poolId, sizeBytes)
    return JSON.parse(result)
  }

  /**
   * Deallocate a memory pool
   * @param poolId - Pool identifier
   * @returns Success status
   */
  deallocatePool(poolId: string): boolean {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    return this.manager.deallocatePool(poolId)
  }

  /**
   * Get memory pool status
   * @param poolId - Pool identifier
   * @returns Pool status if found
   */
  getPoolStatus(poolId: string): MemoryPoolAllocation | null {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.getPoolStatus(poolId)
    return result ? JSON.parse(result) : null
  }

  /**
   * Get all pool statuses
   * @returns Array of all pools
   */
  getAllPoolStatuses(): MemoryPoolAllocation[] {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.getAllPoolStatuses()
    return JSON.parse(result)
  }

  /**
   * Get overall memory statistics
   * @returns Memory statistics object
   */
  getMemoryStats(): Record<string, any> {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.getMemoryStats()
    return JSON.parse(result)
  }

  /**
   * Save current state to persistent storage
   * @returns Serialized state as JSON
   */
  persistState(): PersistenceState {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const result = this.manager.persistState()
    return JSON.parse(result)
  }

  /**
   * Restore state from persistent storage
   * @param state - State to restore
   * @returns Restoration result
   */
  restoreState(state: PersistenceState): Record<string, any> {
    if (!this.manager) {
      throw new Error('Manager not initialized')
    }

    const stateJson = JSON.stringify(state)
    const result = this.manager.restoreState(stateJson)
    return JSON.parse(result)
  }
}

/**
 * Helper function to create memory manager with config
 * @param config - Configuration object
 * @returns New MemoryManager instance
 */
export function createMemoryManager(config?: MemoryManagerConfig): MemoryManager {
  return new MemoryManager(config)
}

/**
 * Get current timestamp
 * @returns Current timestamp in milliseconds
 */
export function getTimestamp(): number {
  if (!ntMemory) {
    throw new Error('Native module not available')
  }

  return ntMemory.getTimestamp()
}

// Export all types and classes
export default {
  MemoryManager,
  createMemoryManager,
  getTimestamp,
}
