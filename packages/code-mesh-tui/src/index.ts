// Code Mesh TUI - Terminal User Interface for Code Mesh
// TypeScript bindings for the napi-rs module

export interface MeshNode {
  id: string
  label: string
  x: number
  y: number
  status: 'active' | 'inactive' | 'error'
  load: number
  metadata?: Record<string, any>
}

export interface MeshConnection {
  source_id: string
  target_id: string
  bandwidth: number
  latency: number
  active: boolean
}

export interface TuiConfig {
  title?: string
  width?: number
  height?: number
  refresh_rate?: number
  show_stats?: boolean
  show_legend?: boolean
}

export interface TuiEvent {
  event_type: string
  key?: string
  timestamp: string
  data?: Record<string, any>
}

export interface RenderOutput {
  width: number
  height: number
  nodes_count: number
  connections_count: number
  render_time_ms: number
  displayed_nodes: number
  zoom_level: number
  timestamp: string
}

export interface UpdateResult {
  nodes_updated: number
  nodes_added: number
  nodes_removed: number
  timestamp: string
}

export interface VisualizationData {
  graph_type: string
  node_count: number
  connection_count: number
  layout_type: string
  timestamp: string
}

export interface NodeDetails {
  id: string
  status: string
  cpu_usage: number
  memory_usage: number
  network_in: number
  network_out: number
  uptime_seconds: number
  task_count: number
  timestamp: string
}

export interface MeshStats {
  total_nodes: number
  active_nodes: number
  total_connections: number
  active_connections: number
  avg_latency_ms: number
  total_bandwidth_mbps: number
  active_tasks: number
  completed_tasks: number
  system_uptime_seconds: number
  timestamp: string
}

/**
 * Native bindings from code_mesh_tui Rust module
 */
let tuiModule: any

try {
  tuiModule = require('../index')
} catch (e) {
  console.warn('Native code_mesh_tui module not loaded. Build the project first.')
  tuiModule = null
}

/**
 * Initialize a new TUI Manager with configuration
 * @param config - TUI configuration options
 * @returns Initialized TUI information
 */
export function initializeTui(config?: TuiConfig): Record<string, any> {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const configJson = config ? JSON.stringify(config) : undefined
  const result = tuiModule.initializeTui(configJson)

  return JSON.parse(result)
}

/**
 * Render the mesh on the screen
 * @param state - Screen state containing nodes and connections
 * @returns Render output with metrics
 */
export function renderMesh(state: {
  width: number
  height: number
  nodes: MeshNode[]
  connections: MeshConnection[]
  zoom_level?: number
  pan_x?: number
  pan_y?: number
}): RenderOutput {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const stateJson = JSON.stringify(state)
  const result = tuiModule.renderMesh(stateJson)

  return JSON.parse(result)
}

/**
 * Update mesh nodes in the display
 * @param nodes - Array of nodes to update
 * @returns Update result with statistics
 */
export function updateMeshNodes(nodes: MeshNode[]): UpdateResult {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const nodesJson = JSON.stringify(nodes)
  const result = tuiModule.updateMeshNodes(nodesJson)

  return JSON.parse(result)
}

/**
 * Update mesh connections in the display
 * @param connections - Array of connections to update
 * @returns Update result with statistics
 */
export function updateMeshConnections(connections: MeshConnection[]): UpdateResult {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const connectionsJson = JSON.stringify(connections)
  const result = tuiModule.updateMeshConnections(connectionsJson)

  return JSON.parse(result)
}

/**
 * Handle keyboard and interaction events
 * @param event - TUI event to process
 * @returns Event handling result
 */
export function handleEvent(event: TuiEvent): Record<string, any> {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const eventJson = JSON.stringify(event)
  const result = tuiModule.handleEvent(eventJson)

  return JSON.parse(result)
}

/**
 * Get mesh visualization data
 * @param options - Visualization options
 * @returns Visualization data
 */
export function getVisualizationData(options?: Record<string, any>): VisualizationData {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const optionsJson = options ? JSON.stringify(options) : undefined
  const result = tuiModule.getVisualizationData(optionsJson)

  return JSON.parse(result)
}

/**
 * Display detailed information about a specific node
 * @param nodeId - ID of the node
 * @returns Node details and statistics
 */
export function displayNodeDetails(nodeId: string): NodeDetails {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const result = tuiModule.displayNodeDetails(nodeId)

  return JSON.parse(result)
}

/**
 * Handle zoom operations
 * @param operation - 'in' or 'out'
 * @param level - Current zoom level (0.1 to 10.0)
 * @returns New zoom level
 */
export function handleZoom(operation: 'in' | 'out', level: number): number {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  return tuiModule.handleZoom(operation, level)
}

/**
 * Handle pan (scroll) operations
 * @param direction - Direction of pan (up/down/left/right)
 * @param amount - Pan amount in pixels
 * @returns Pan result
 */
export function handlePan(
  direction: 'up' | 'down' | 'left' | 'right',
  amount: number
): Record<string, any> {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const result = tuiModule.handlePan(direction, amount)

  return JSON.parse(result)
}

/**
 * Get real-time mesh statistics
 * @returns Current mesh statistics
 */
export function getMeshStats(): MeshStats {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const result = tuiModule.getMeshStats()

  return JSON.parse(result)
}

/**
 * Search for nodes by label or ID
 * @param query - Search query string
 * @returns Search results
 */
export function searchNodes(query: string): Record<string, any> {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const result = tuiModule.searchNodes(query)

  return JSON.parse(result)
}

/**
 * Apply a theme to the TUI
 * @param themeName - Name of the theme
 * @returns Theme information
 */
export function applyTheme(themeName: string): Record<string, any> {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const result = tuiModule.applyTheme(themeName)

  return JSON.parse(result)
}

/**
 * Export mesh state to various formats
 * @param format - Export format (json, csv)
 * @returns Export data with statistics
 */
export function exportMeshState(format: 'json' | 'csv'): Record<string, any> {
  if (!tuiModule) {
    throw new Error('Native module not available')
  }

  const result = tuiModule.exportMeshState(format)

  return JSON.parse(result)
}

/**
 * TUI Manager class for advanced use cases
 */
export class TuiManager {
  private config: TuiConfig
  private initialized: boolean

  /**
   * Create a new TUI Manager instance
   */
  constructor(config?: TuiConfig) {
    if (!tuiModule) {
      throw new Error('Native module not available')
    }

    this.config = config || {}
    this.initialized = false
  }

  /**
   * Initialize the TUI
   */
  initialize(): Record<string, any> {
    const result = initializeTui(this.config)
    this.initialized = true
    return result
  }

  /**
   * Render the mesh display
   */
  render(state: {
    width: number
    height: number
    nodes: MeshNode[]
    connections: MeshConnection[]
  }): RenderOutput {
    if (!this.initialized) {
      this.initialize()
    }
    return renderMesh(state)
  }

  /**
   * Update nodes in the display
   */
  updateNodes(nodes: MeshNode[]): UpdateResult {
    return updateMeshNodes(nodes)
  }

  /**
   * Update connections in the display
   */
  updateConnections(connections: MeshConnection[]): UpdateResult {
    return updateMeshConnections(connections)
  }

  /**
   * Handle user interactions
   */
  processEvent(event: TuiEvent): Record<string, any> {
    return handleEvent(event)
  }

  /**
   * Get visualization data
   */
  getVisualization(options?: Record<string, any>): VisualizationData {
    return getVisualizationData(options)
  }

  /**
   * Get details for a node
   */
  getNodeDetails(nodeId: string): NodeDetails {
    return displayNodeDetails(nodeId)
  }

  /**
   * Perform zoom operation
   */
  zoom(operation: 'in' | 'out', level: number): number {
    return handleZoom(operation, level)
  }

  /**
   * Perform pan operation
   */
  pan(direction: 'up' | 'down' | 'left' | 'right', amount: number): Record<string, any> {
    return handlePan(direction, amount)
  }

  /**
   * Get real-time statistics
   */
  getStats(): MeshStats {
    return getMeshStats()
  }

  /**
   * Search nodes
   */
  search(query: string): Record<string, any> {
    return searchNodes(query)
  }

  /**
   * Apply theme
   */
  theme(name: string): Record<string, any> {
    return applyTheme(name)
  }

  /**
   * Export state
   */
  export(format: 'json' | 'csv'): Record<string, any> {
    return exportMeshState(format)
  }
}

// Export all types and functions
export default {
  TuiManager,
  initializeTui,
  renderMesh,
  updateMeshNodes,
  updateMeshConnections,
  handleEvent,
  getVisualizationData,
  displayNodeDetails,
  handleZoom,
  handlePan,
  getMeshStats,
  searchNodes,
  applyTheme,
  exportMeshState,
}
