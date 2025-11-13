// DAA Prime Core - TypeScript bindings for napi-rs module

export interface Config {
  node_id?: string
  timeout_ms?: number
  max_retries?: number
  batch_size?: number
}

export interface ProtocolMessage {
  id: string
  msg_type: string
  version: string
  payload: Record<string, any>
  timestamp: string
}

export interface PeerInfo {
  peer_id: string
  host: string
  port: number
  public_key: string
  last_seen?: string
}

export interface ModelMetadata {
  model_id: string
  version: string
  parameters: Record<string, any>
  created_at: string
  updated_at: string
}

export interface TrainingResult {
  success: boolean
  model_id: string
  accuracy: number
  loss: number
  epochs: number
  duration_ms: number
}

export interface HealthCheck {
  status: string
  node_id?: string
  peers_connected: number
  models_loaded: number
  timestamp: string
}

/**
 * Native bindings from daa_prime_core Rust module
 */
let daaPrimeCore: any

try {
  // Load the native module via platform loader
  daaPrimeCore = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native daa_prime_core module not loaded. Build the project first.')
  daaPrimeCore = null
}

/**
 * DAA Prime Core Client
 * Main interface for interacting with the distributed ML framework
 */
export class DaaPrimeCore {
  private inner: any

  /**
   * Create a new DAA Prime Core instance
   * @param config - Configuration options
   */
  constructor(config?: Config) {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const configJson = config ? JSON.stringify(config) : undefined
    this.inner = new daaPrimeCore.DaaPrimeCore(configJson)
  }

  /**
   * Get the current configuration
   * @returns Current configuration object
   */
  getConfig(): Config {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getConfig()
    return JSON.parse(result)
  }

  /**
   * Register a new peer in the network
   * @param peerInfo - Information about the peer to register
   * @returns True if peer was registered successfully
   */
  registerPeer(peerInfo: PeerInfo): boolean {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const peerJson = JSON.stringify(peerInfo)
    return this.inner.registerPeer(peerJson)
  }

  /**
   * List all registered peers
   * @returns Array of registered peers
   */
  listPeers(): PeerInfo[] {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const result = this.inner.listPeers()
    return JSON.parse(result)
  }

  /**
   * Get the number of connected peers
   * @returns Number of peers connected
   */
  peerCount(): number {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    return this.inner.peerCount()
  }

  /**
   * Create a new model
   * @param metadata - Model metadata
   * @returns The created model metadata
   */
  createModel(metadata: ModelMetadata): ModelMetadata {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const metadataJson = JSON.stringify(metadata)
    const result = this.inner.createModel(metadataJson)
    return JSON.parse(result)
  }

  /**
   * List all registered models
   * @returns Array of model metadata
   */
  listModels(): ModelMetadata[] {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const result = this.inner.listModels()
    return JSON.parse(result)
  }

  /**
   * Get a specific model by ID
   * @param modelId - The model ID
   * @returns Model metadata or null if not found
   */
  getModel(modelId: string): ModelMetadata {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const result = this.inner.getModel(modelId)
    return JSON.parse(result)
  }

  /**
   * Process a protocol message
   * @param message - Protocol message to process
   * @returns Processing result
   */
  processMessage(message: ProtocolMessage): Record<string, any> {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const messageJson = JSON.stringify(message)
    const result = this.inner.processMessage(messageJson)
    return JSON.parse(result)
  }

  /**
   * Train a model
   * @param modelId - The model ID to train
   * @param iterations - Number of training iterations
   * @returns Training result
   */
  trainModel(modelId: string, iterations: number): TrainingResult {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const result = this.inner.trainModel(modelId, iterations)
    return JSON.parse(result)
  }

  /**
   * Validate protocol version
   * @param version - Version string to validate
   * @returns True if version is valid
   */
  validateVersion(version: string): boolean {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    return this.inner.validateVersion(version)
  }

  /**
   * Generate a unique message ID
   * @returns Generated UUID
   */
  generateMessageId(): string {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    return this.inner.generateMessageId()
  }

  /**
   * Check the health status of the node
   * @returns Health check result
   */
  healthCheck(): HealthCheck {
    if (!daaPrimeCore) {
      throw new Error('Native module not available')
    }

    const result = this.inner.healthCheck()
    return JSON.parse(result)
  }
}

/**
 * Hash data using default hasher
 * @param data - Data to hash
 * @returns Hexadecimal hash string
 */
export function hashData(data: string): string {
  if (!daaPrimeCore) {
    throw new Error('Native module not available')
  }

  return daaPrimeCore.hashData(data)
}

/**
 * Validate peer address format
 * @param address - Address to validate (IP:port format)
 * @returns True if address is valid
 */
export function validatePeerAddress(address: string): boolean {
  if (!daaPrimeCore) {
    throw new Error('Native module not available')
  }

  return daaPrimeCore.validatePeerAddress(address)
}

/**
 * Create a protocol message
 * @param msgType - Message type
 * @param payload - Message payload
 * @returns Created protocol message
 */
export function createProtocolMessage(
  msgType: string,
  payload: Record<string, any>
): ProtocolMessage {
  if (!daaPrimeCore) {
    throw new Error('Native module not available')
  }

  const payloadJson = JSON.stringify(payload)
  const result = daaPrimeCore.createProtocolMessage(msgType, payloadJson)
  return JSON.parse(result)
}

// Export all types and classes
export default {
  DaaPrimeCore,
  hashData,
  validatePeerAddress,
  createProtocolMessage,
}
