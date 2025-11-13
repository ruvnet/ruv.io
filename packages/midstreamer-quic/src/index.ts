// QUIC Multi-Stream Support
// TypeScript bindings for the napi-rs module

export interface QuicStream {
  id: number
  state: string
  data_sent: number
  data_received: number
  priority: number
}

export interface QuicConfig {
  initial_max_streams?: number
  idle_timeout?: number
  max_data?: number
  max_stream_data?: number
}

export interface StreamOperationResult {
  stream_id: number
  success: boolean
  message: string
  timestamp: string
}

export interface StreamStats {
  total_streams: number
  active_streams: number
  total_data_sent: number
  total_data_received: number
  timestamp: string
}

/**
 * Native bindings from midstreamer_quic Rust module
 */
let quicModule: any

try {
  // Load the native module via platform loader
  // Use require.resolve to get the correct path
  const modulePath = require.resolve('@ruv.io/midstreamer-quic')
  quicModule = require(modulePath)
} catch (e) {
  // Try loading from parent directory (during development)
  try {
    const path = require('path')
    const modulePath = path.join(__dirname, '..', 'index')
    quicModule = require(modulePath)
  } catch (e2) {
    // Fallback - module not built yet
    console.warn('Native midstreamer_quic module not loaded. Build the project first.')
    quicModule = null
  }
}

/**
 * QUIC Client with multi-stream support
 */
export class QuicClient {
  /**
   * Create a new QUIC client with optional configuration
   * @param config Optional configuration object
   */
  constructor(config?: QuicConfig) {
    if (!quicModule) {
      throw new Error('Native module not available')
    }

    const configJson = config ? JSON.stringify(config) : undefined

    try {
      this._client = new quicModule.QuicClient(configJson)
    } catch (error) {
      throw new Error(`Failed to create QUIC client: ${error}`)
    }
  }

  private _client: any

  /**
   * Create a new stream
   * @param priority Stream priority (higher = more important)
   * @returns Stream ID
   */
  createStream(priority: number = 1): number {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    return this._client.createStream(priority)
  }

  /**
   * Send data on a specific stream
   * @param streamId Stream ID
   * @param size Number of bytes to send
   * @returns Number of bytes actually sent
   */
  sendData(streamId: number, size: number): number {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    return this._client.sendData(streamId, size)
  }

  /**
   * Receive data on a specific stream
   * @param streamId Stream ID
   * @param size Maximum number of bytes to receive
   * @returns Number of bytes received
   */
  receiveData(streamId: number, size: number): number {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    return this._client.receiveData(streamId, size)
  }

  /**
   * Close a specific stream
   * @param streamId Stream ID
   * @returns Operation result
   */
  closeStream(streamId: number): StreamOperationResult {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    const result = this._client.closeStream(streamId)
    return JSON.parse(result)
  }

  /**
   * Get information about a specific stream
   * @param streamId Stream ID
   * @returns Stream information
   */
  getStreamInfo(streamId: number): QuicStream {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    const result = this._client.getStreamInfo(streamId)
    return JSON.parse(result)
  }

  /**
   * Get all active stream IDs
   * @returns Array of active stream IDs
   */
  getActiveStreams(): number[] {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    const result = this._client.getActiveStreams()
    return JSON.parse(result)
  }

  /**
   * Get statistics about all streams
   * @returns Stream statistics
   */
  getStats(): StreamStats {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    const result = this._client.getStats()
    return JSON.parse(result)
  }

  /**
   * Reset a stream with optional error code
   * @param streamId Stream ID
   * @param errorCode Error code for the reset
   * @returns Operation result
   */
  resetStream(streamId: number, errorCode: number = 0): StreamOperationResult {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    const result = this._client.resetStream(streamId, errorCode)
    return JSON.parse(result)
  }

  /**
   * Close all streams
   * @returns Number of streams closed
   */
  closeAllStreams(): number {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    return this._client.closeAllStreams()
  }

  /**
   * Set stream priority
   * @param streamId Stream ID
   * @param priority New priority value
   * @returns Operation result
   */
  setStreamPriority(streamId: number, priority: number): StreamOperationResult {
    if (!this._client) {
      throw new Error('QUIC client not initialized')
    }

    const result = this._client.setStreamPriority(streamId, priority)
    return JSON.parse(result)
  }
}

/**
 * Create a simple QUIC stream
 * @param priority Stream priority
 * @returns Simple stream object
 */
export function createSimpleStream(priority: number = 1): QuicStream {
  if (!quicModule) {
    throw new Error('Native module not available')
  }

  const result = quicModule.createSimpleStream(priority)
  return JSON.parse(result)
}

/**
 * Calculate stream efficiency (throughput)
 * @param dataSent Bytes sent
 * @param dataReceived Bytes received
 * @param totalTimeMs Total time in milliseconds
 * @returns Efficiency in bytes per second
 */
export function calculateStreamEfficiency(
  dataSent: number,
  dataReceived: number,
  totalTimeMs: number,
): number {
  if (!quicModule) {
    throw new Error('Native module not available')
  }

  return quicModule.calculateStreamEfficiency(dataSent, dataReceived, totalTimeMs)
}

/**
 * Error class for QUIC operations
 */
export class QuicError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'QuicError'
  }
}

// Export all types and functions
export default {
  QuicClient,
  createSimpleStream,
  calculateStreamEfficiency,
  QuicError,
}
