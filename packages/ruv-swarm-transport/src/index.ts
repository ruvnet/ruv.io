// RUV Swarm Transport Layer
// TypeScript bindings for the napi-rs transport module

export enum ProtocolType {
  TCP = 'TCP',
  UDP = 'UDP',
  WebSocket = 'WebSocket',
  HTTP = 'HTTP',
  gRPC = 'gRPC',
  Custom = 'Custom',
}

export enum MessagePriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Critical = 'critical',
}

export enum ConnectionState {
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnecting = 'disconnecting',
  Disconnected = 'disconnected',
  Failed = 'failed',
}

export interface Message {
  id: string
  source: string
  destination: string
  protocol: string
  payload: string
  priority: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface Connection {
  id: string
  remote_address: string
  protocol: string
  state: string
  created_at: string
  last_activity: string
}

export interface Route {
  destination: string
  protocol: string
  priority: number
  enabled: boolean
}

export interface RouteInfo {
  destination: string
  protocol: string
  priority: number
  enabled: boolean
  created_at: string
}

export interface SerializationConfig {
  format: string
  compression: boolean
  encryption: boolean
}

export interface MessageStats {
  total_messages: number
  total_bytes: number
  average_latency_ms: number
  messages_by_protocol: Record<string, any>
}

export interface ConnectionStats {
  active_connections: number
  total_connections: number
  failed_connections: number
  total_bytes_sent: number
  total_bytes_received: number
}

export interface TransportConfig {
  [key: string]: any
}

export interface SendResult {
  message_id: string
  status: string
  timestamp: string
}

/**
 * Native bindings from ruv_swarm_transport Rust module
 */
let transportModule: any

try {
  // Load the native module via platform loader
  transportModule = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native ruv_swarm_transport module not loaded. Build the project first.')
  transportModule = null
}

/**
 * Initialize transport manager
 * @param config - Transport configuration
 * @returns Manager ID
 */
export function initTransportManager(config?: TransportConfig): string {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config || {})
  return transportModule.initTransportManager(configJson)
}

/**
 * Register a connection
 * @param connection - Connection details
 * @returns Connection ID
 */
export function registerConnection(connection: Connection): string {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const connectionJson = JSON.stringify(connection)
  return transportModule.registerConnection(connectionJson)
}

/**
 * Send a message through the transport layer
 * @param message - Message to send
 * @returns Message ID
 */
export function sendMessage(message: Message): string {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const messageJson = JSON.stringify(message)
  return transportModule.sendMessage(messageJson)
}

/**
 * Create a message
 * @param source - Source address
 * @param destination - Destination address
 * @param payload - Message payload
 * @param protocol - Protocol type
 * @param priority - Priority level
 * @returns Message object
 */
export function createMessage(
  source: string,
  destination: string,
  payload: string,
  protocol: string = 'tcp',
  priority: string = 'normal'
): Message {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const result = transportModule.createMessage(source, destination, payload, protocol, priority)
  return JSON.parse(result)
}

/**
 * Register a route for message delivery
 * @param route - Route details
 * @returns Route ID
 */
export function registerRoute(route: Route): string {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const routeJson = JSON.stringify(route)
  return transportModule.registerRoute(routeJson)
}

/**
 * Get all registered routes
 * @returns Array of routes
 */
export function listRoutes(): RouteInfo[] {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const result = transportModule.listRoutes()
  return JSON.parse(result)
}

/**
 * Update route configuration
 * @param destination - Route destination
 * @param config - New configuration
 * @returns Updated route info
 */
export function updateRoute(destination: string, config: Record<string, any>): RouteInfo {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const result = transportModule.updateRoute(destination, configJson)
  return JSON.parse(result)
}

/**
 * Remove a route
 * @param destination - Route destination
 * @returns Success status
 */
export function removeRoute(destination: string): boolean {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  return transportModule.removeRoute(destination)
}

/**
 * Set serialization format for protocol
 * @param protocol - Protocol name
 * @param format - Serialization format
 * @returns Success status
 */
export function setSerializationFormat(protocol: string, format: string): boolean {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  return transportModule.setSerializationFormat(protocol, format)
}

/**
 * Get active connections
 * @returns Array of active connections
 */
export function getActiveConnections(): Connection[] {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const result = transportModule.getActiveConnections()
  return JSON.parse(result)
}

/**
 * Handle incoming message
 * @param message - Incoming message
 * @returns Processing result
 */
export function handleIncomingMessage(message: Message): Record<string, any> {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const messageJson = JSON.stringify(message)
  const result = transportModule.handleIncomingMessage(messageJson)
  return JSON.parse(result)
}

/**
 * Batch send multiple messages
 * @param messages - Array of messages to send
 * @returns Array of send results
 */
export function batchSendMessages(messages: Message[]): SendResult[] {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const messagesJson = JSON.stringify(messages)
  const result = transportModule.batchSendMessages(messagesJson)
  return JSON.parse(result)
}

/**
 * Close a connection
 * @param connectionId - Connection ID
 * @returns Success status
 */
export function closeConnection(connectionId: string): boolean {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  return transportModule.closeConnection(connectionId)
}

/**
 * Get transport statistics
 * @returns Transport statistics
 */
export function getTransportStats(): MessageStats {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const result = transportModule.getTransportStats()
  return JSON.parse(result)
}

/**
 * Get connection statistics
 * @returns Connection statistics
 */
export function getConnectionStats(): ConnectionStats {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const result = transportModule.getConnectionStats()
  return JSON.parse(result)
}

/**
 * Enable protocol
 * @param protocol - Protocol to enable
 * @returns Success status
 */
export function enableProtocol(protocol: string): boolean {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  return transportModule.enableProtocol(protocol)
}

/**
 * Disable protocol
 * @param protocol - Protocol to disable
 * @returns Success status
 */
export function disableProtocol(protocol: string): boolean {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  return transportModule.disableProtocol(protocol)
}

/**
 * Get enabled protocols
 * @returns Array of enabled protocols
 */
export function getEnabledProtocols(): string[] {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const result = transportModule.getEnabledProtocols()
  return JSON.parse(result)
}

/**
 * Serialize message with specified format
 * @param message - Message to serialize
 * @param format - Format type
 * @returns Serialized message
 */
export function serializeMessage(message: Message, format: string = 'json'): string {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const messageJson = JSON.stringify(message)
  return transportModule.serializeMessage(messageJson, format)
}

/**
 * Deserialize message
 * @param serializedData - Serialized data
 * @param format - Format type
 * @returns Deserialized message
 */
export function deserializeMessage(serializedData: string, format: string = 'json'): Message {
  if (!transportModule) {
    throw new Error('Native module not available')
  }

  const result = transportModule.deserializeMessage(serializedData, format)
  return JSON.parse(result)
}

/**
 * TransportManager class for advanced use cases
 */
export class TransportManager {
  private managerId: string

  /**
   * Create a new TransportManager instance
   */
  constructor(config?: TransportConfig) {
    if (!transportModule) {
      throw new Error('Native module not available')
    }

    this.managerId = initTransportManager(config)
  }

  /**
   * Get manager ID
   */
  getId(): string {
    return this.managerId
  }

  /**
   * Send a message
   */
  send(message: Message): string {
    return sendMessage(message)
  }

  /**
   * Register a route
   */
  addRoute(route: Route): string {
    return registerRoute(route)
  }

  /**
   * Remove a route
   */
  removeRoute(destination: string): boolean {
    return removeRoute(destination)
  }

  /**
   * List all routes
   */
  getRoutes(): RouteInfo[] {
    return listRoutes()
  }

  /**
   * Get active connections
   */
  getConnections(): Connection[] {
    return getActiveConnections()
  }

  /**
   * Register a connection
   */
  registerConnection(connection: Connection): string {
    return registerConnection(connection)
  }

  /**
   * Close a connection
   */
  disconnect(connectionId: string): boolean {
    return closeConnection(connectionId)
  }

  /**
   * Get transport statistics
   */
  getStats(): { messages: MessageStats; connections: ConnectionStats } {
    return {
      messages: getTransportStats(),
      connections: getConnectionStats(),
    }
  }

  /**
   * Enable a protocol
   */
  enableProtocol(protocol: string): boolean {
    return enableProtocol(protocol)
  }

  /**
   * Disable a protocol
   */
  disableProtocol(protocol: string): boolean {
    return disableProtocol(protocol)
  }

  /**
   * Get enabled protocols
   */
  getProtocols(): string[] {
    return getEnabledProtocols()
  }

  /**
   * Handle incoming message
   */
  onMessageReceived(message: Message): Record<string, any> {
    return handleIncomingMessage(message)
  }

  /**
   * Batch send messages
   */
  batchSend(messages: Message[]): SendResult[] {
    return batchSendMessages(messages)
  }

  /**
   * Serialize message
   */
  serialize(message: Message, format: string = 'json'): string {
    return serializeMessage(message, format)
  }

  /**
   * Deserialize message
   */
  deserialize(data: string, format: string = 'json'): Message {
    return deserializeMessage(data, format)
  }
}

// Export all types and functions
export default {
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
  TransportManager,
  ProtocolType,
  MessagePriority,
  ConnectionState,
}
