// DAA Prime DHT - TypeScript bindings for the napi-rs module

export interface DhtEntry {
  key: string
  value: string
  timestamp: string
  ttl: number
  replication_factor: number
}

export interface RoutingEntry {
  node_id: string
  distance: number
  last_seen: string
  reachable: boolean
}

export interface DhtConfig {
  node_id?: string
  k_param?: number
  replication_factor?: number
  default_ttl_ms?: number
  max_storage_bytes?: number
}

export interface LookupResult {
  found: boolean
  value?: string
  nodes_queried: number
  hops: number
  timestamp: string
}

export interface ReplicationStatus {
  key: string
  replicas_created: number
  consistency_level: string
  last_sync: string
}

export interface DhtStats {
  node_id: string
  total_entries: number
  total_peers: number
  k_parameter: number
  replication_factor: number
  default_ttl_ms: number
  timestamp: string
}

/**
 * Native bindings from daa_prime_dht Rust module
 */
import * as nativeBinding from '../index'

/**
 * Wrapper class for DhtNode - Distributed Hash Table Node
 * Provides a high-level TypeScript interface for DHT operations
 */
export class DhtNode {
  private nativeNode: nativeBinding.DhtNode

  /**
   * Create a new DHT Node
   * @param config - Optional DHT configuration
   */
  constructor(config?: DhtConfig) {
    const configJson = config ? JSON.stringify(config) : undefined
    this.nativeNode = new nativeBinding.DhtNode(configJson)
  }

  /**
   * Store a value in the DHT
   * @param key - The key to store
   * @param value - The value to store
   * @param ttlMs - TTL in milliseconds (0 for default)
   * @returns Success indicator
   */
  put(key: string, value: string, ttlMs: number = 0): boolean {
    return this.nativeNode.put(key, value, ttlMs)
  }

  /**
   * Retrieve a value from the DHT
   * @param key - The key to retrieve
   * @returns The stored DhtEntry
   */
  get(key: string): DhtEntry {
    const result = this.nativeNode.get(key)
    return JSON.parse(result)
  }

  /**
   * Delete a value from the DHT
   * @param key - The key to delete
   * @returns Success indicator
   */
  delete(key: string): boolean {
    return this.nativeNode.delete(key)
  }

  /**
   * Check if a key exists in the DHT
   * @param key - The key to check
   * @returns True if key exists and hasn't expired
   */
  exists(key: string): boolean {
    return this.nativeNode.exists(key)
  }

  /**
   * Perform a DHT lookup (Kademlia-style)
   * @param key - The key to lookup
   * @param maxHops - Maximum number of hops (0 for default)
   * @returns Lookup result
   */
  lookup(key: string, maxHops: number = 0): LookupResult {
    const result = this.nativeNode.lookup(key, maxHops)
    return JSON.parse(result)
  }

  /**
   * Add a peer node to the routing table
   * @param nodeId - Node ID of the peer
   * @param distance - Kademlia distance metric
   * @returns Success indicator
   */
  addPeer(nodeId: string, distance: number): boolean {
    return this.nativeNode.addPeer(nodeId, distance)
  }

  /**
   * Remove a peer from the routing table
   * @param nodeId - Node ID of the peer to remove
   * @returns Success indicator
   */
  removePeer(nodeId: string): boolean {
    return this.nativeNode.removePeer(nodeId)
  }

  /**
   * Get all peers in the routing table
   * @returns Array of routing entries
   */
  getPeers(): RoutingEntry[] {
    const result = this.nativeNode.getPeers()
    return JSON.parse(result)
  }

  /**
   * Get peer count in routing table
   * @returns Number of peers
   */
  peerCount(): number {
    return this.nativeNode.peerCount()
  }

  /**
   * Get all stored entries
   * @returns Array of DHT entries
   */
  getAllEntries(): DhtEntry[] {
    const result = this.nativeNode.getAllEntries()
    return JSON.parse(result)
  }

  /**
   * Get entry count in local storage
   * @returns Number of entries
   */
  entryCount(): number {
    return this.nativeNode.entryCount()
  }

  /**
   * Get node ID
   * @returns The unique node ID
   */
  getNodeId(): string {
    return this.nativeNode.getNodeId()
  }

  /**
   * Get configuration
   * @returns The current DHT configuration
   */
  getConfig(): DhtConfig {
    const result = this.nativeNode.getConfig()
    return JSON.parse(result)
  }

  /**
   * Get replication status for a key
   * @param key - The key to check replication status for
   * @returns Replication status
   */
  getReplicationStatus(key: string): ReplicationStatus {
    const result = this.nativeNode.getReplicationStatus(key)
    return JSON.parse(result)
  }

  /**
   * Perform health check
   * @returns Health status object
   */
  healthCheck(): any {
    const result = this.nativeNode.healthCheck()
    return JSON.parse(result)
  }

  /**
   * Get DHT statistics
   * @returns Statistics object
   */
  getStats(): DhtStats {
    const result = this.nativeNode.getStats()
    return JSON.parse(result)
  }

  /**
   * Clear all local storage
   * @returns Success indicator
   */
  clear(): boolean {
    return this.nativeNode.clear()
  }
}

/**
 * Hash a key for DHT storage
 * @param key - The key to hash
 * @returns The hashed key
 */
export function hashKey(key: string): string {
  return nativeBinding.hashKey(key)
}

/**
 * Validate DHT key format
 * @param key - The key to validate
 * @returns True if valid
 */
export function validateKey(key: string): boolean {
  return nativeBinding.validateKey(key)
}

/**
 * Create a default DHT configuration
 * @returns Default configuration
 */
export function createDefaultConfig(): DhtConfig {
  const result = nativeBinding.createDefaultConfig()
  return JSON.parse(result)
}

/**
 * Calculate storage size for an entry
 * @param key - The key
 * @param value - The value
 * @returns Size in bytes
 */
export function calculateEntrySize(key: string, value: string): number {
  return nativeBinding.calculateEntrySize(key, value)
}

/**
 * Create a DHT entry object
 * @param key - The key
 * @param value - The value
 * @param ttlMs - TTL in milliseconds (0 for default)
 * @returns DHT entry
 */
export function createDhtEntry(key: string, value: string, ttlMs: number = 0): DhtEntry {
  const result = nativeBinding.createDhtEntry(key, value, ttlMs)
  return JSON.parse(result)
}

// Export all types and functions
export default {
  DhtNode,
  hashKey,
  validateKey,
  createDefaultConfig,
  calculateEntrySize,
  createDhtEntry,
}
