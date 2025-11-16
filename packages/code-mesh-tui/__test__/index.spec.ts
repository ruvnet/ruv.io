import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
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
  MeshNode,
  MeshConnection,
  TuiConfig,
  TuiEvent,
  RenderOutput,
} from '../src/index'

describe('Code Mesh TUI - Terminal User Interface', () => {
  const sampleConfig: TuiConfig = {
    title: 'Code Mesh Dashboard',
    width: 120,
    height: 40,
    refresh_rate: 60,
    show_stats: true,
    show_legend: true,
  }

  const sampleNodes: MeshNode[] = [
    {
      id: 'node-1',
      label: 'Orchestrator',
      x: 50,
      y: 20,
      status: 'active',
      load: 0.65,
      metadata: { type: 'coordinator' },
    },
    {
      id: 'node-2',
      label: 'Worker A',
      x: 20,
      y: 40,
      status: 'active',
      load: 0.45,
      metadata: { type: 'worker' },
    },
    {
      id: 'node-3',
      label: 'Worker B',
      x: 80,
      y: 40,
      status: 'active',
      load: 0.55,
      metadata: { type: 'worker' },
    },
  ]

  const sampleConnections: MeshConnection[] = [
    {
      source_id: 'node-1',
      target_id: 'node-2',
      bandwidth: 1000.0,
      latency: 5.2,
      active: true,
    },
    {
      source_id: 'node-1',
      target_id: 'node-3',
      bandwidth: 1000.0,
      latency: 5.0,
      active: true,
    },
  ]

  describe('initializeTui', () => {
    it('should initialize TUI with default config', () => {
      const result = initializeTui()

      expect(result).toBeDefined()
      expect(result.initialized).toBe(true)
      expect(result.title).toBeDefined()
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    })

    it('should initialize TUI with custom config', () => {
      const result = initializeTui(sampleConfig)

      expect(result).toBeDefined()
      expect(result.initialized).toBe(true)
      expect(result.title).toBe('Code Mesh Dashboard')
      expect(result.width).toBe(120)
      expect(result.height).toBe(40)
    })

    it('should set refresh rate from config', () => {
      const result = initializeTui(sampleConfig)

      expect(result.refresh_rate).toBe(60)
    })

    it('should preserve stats display setting', () => {
      const result = initializeTui(sampleConfig)

      expect(result.show_stats).toBe(true)
    })

    it('should have valid timestamp', () => {
      const result = initializeTui()

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })
  })

  describe('renderMesh', () => {
    it('should render mesh with nodes and connections', () => {
      const renderState = {
        width: 120,
        height: 40,
        nodes: sampleNodes,
        connections: sampleConnections,
        zoom_level: 1.0,
      }

      const result = renderMesh(renderState)

      expect(result).toBeDefined()
      expect(result.width).toBe(120)
      expect(result.height).toBe(40)
      expect(result.nodes_count).toBe(3)
      expect(result.connections_count).toBe(2)
    })

    it('should calculate render time', () => {
      const renderState = {
        width: 120,
        height: 40,
        nodes: sampleNodes,
        connections: sampleConnections,
      }

      const result = renderMesh(renderState)

      expect(result.render_time_ms).toBeGreaterThanOrEqual(0)
      expect(result.render_time_ms).toBeLessThanOrEqual(100)
    })

    it('should handle large mesh rendering', () => {
      const largeNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        label: `Node ${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        status: 'active' as const,
        load: Math.random(),
      }))

      const renderState = {
        width: 120,
        height: 40,
        nodes: largeNodes,
        connections: [],
      }

      const result = renderMesh(renderState)

      expect(result.nodes_count).toBe(100)
    })

    it('should respect zoom level', () => {
      const renderState = {
        width: 120,
        height: 40,
        nodes: sampleNodes,
        connections: sampleConnections,
        zoom_level: 2.0,
      }

      const result = renderMesh(renderState)

      expect(result.zoom_level).toBe(2.0)
    })
  })

  describe('updateMeshNodes', () => {
    it('should update mesh nodes', () => {
      const result = updateMeshNodes(sampleNodes)

      expect(result).toBeDefined()
      expect(result.nodes_updated).toBeGreaterThanOrEqual(0)
      expect(result.nodes_added).toBeGreaterThanOrEqual(0)
    })

    it('should handle multiple node updates', () => {
      const moreNodes = [...sampleNodes, ...sampleNodes]
      const result = updateMeshNodes(moreNodes)

      expect(result.nodes_updated).toBeGreaterThanOrEqual(0)
    })

    it('should have valid timestamp', () => {
      const result = updateMeshNodes(sampleNodes)

      expect(result.timestamp).toBeDefined()
    })
  })

  describe('updateMeshConnections', () => {
    it('should update mesh connections', () => {
      const result = updateMeshConnections(sampleConnections)

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should handle multiple connections', () => {
      const moreConnections = [...sampleConnections, ...sampleConnections]
      const result = updateMeshConnections(moreConnections)

      expect(result).toBeDefined()
    })
  })

  describe('handleEvent', () => {
    it('should handle quit event', () => {
      const event: TuiEvent = {
        event_type: 'quit',
        timestamp: new Date().toISOString(),
      }

      const result = handleEvent(event)

      expect(result).toBeDefined()
      expect(result.handled).toBe(true)
      expect(result.action).toBe('exit')
    })

    it('should handle refresh event', () => {
      const event: TuiEvent = {
        event_type: 'refresh',
        timestamp: new Date().toISOString(),
      }

      const result = handleEvent(event)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('redraw')
    })

    it('should handle zoom_in event', () => {
      const event: TuiEvent = {
        event_type: 'zoom_in',
        key: '+',
        timestamp: new Date().toISOString(),
      }

      const result = handleEvent(event)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('zoom_in')
    })

    it('should handle zoom_out event', () => {
      const event: TuiEvent = {
        event_type: 'zoom_out',
        key: '-',
        timestamp: new Date().toISOString(),
      }

      const result = handleEvent(event)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('zoom_out')
    })

    it('should handle select_node event', () => {
      const event: TuiEvent = {
        event_type: 'select_node',
        data: { node_id: 'node-1' },
        timestamp: new Date().toISOString(),
      }

      const result = handleEvent(event)

      expect(result.handled).toBe(true)
      expect(result.action).toBe('select')
    })

    it('should handle unknown event gracefully', () => {
      const event: TuiEvent = {
        event_type: 'unknown_event',
        timestamp: new Date().toISOString(),
      }

      const result = handleEvent(event)

      expect(result).toBeDefined()
      expect(result.action).toBe('unknown')
    })
  })

  describe('getVisualizationData', () => {
    it('should get visualization data', () => {
      const result = getVisualizationData()

      expect(result).toBeDefined()
      expect(result.graph_type).toBe('mesh')
      expect(result.node_count).toBeGreaterThan(0)
      expect(result.connection_count).toBeGreaterThan(0)
    })

    it('should return valid layout type', () => {
      const result = getVisualizationData()

      expect(result.layout_type).toBe('force-directed')
    })

    it('should have timestamp', () => {
      const result = getVisualizationData()

      expect(result.timestamp).toBeDefined()
    })
  })

  describe('displayNodeDetails', () => {
    it('should display node details', () => {
      const result = displayNodeDetails('node-1')

      expect(result).toBeDefined()
      expect(result.id).toBe('node-1')
      expect(result.status).toBeDefined()
    })

    it('should show CPU usage', () => {
      const result = displayNodeDetails('node-1')

      expect(result.cpu_usage).toBeGreaterThanOrEqual(0)
      expect(result.cpu_usage).toBeLessThanOrEqual(100)
    })

    it('should show memory usage', () => {
      const result = displayNodeDetails('node-1')

      expect(result.memory_usage).toBeGreaterThanOrEqual(0)
      expect(result.memory_usage).toBeLessThanOrEqual(100)
    })

    it('should show network metrics', () => {
      const result = displayNodeDetails('node-1')

      expect(result.network_in).toBeGreaterThanOrEqual(0)
      expect(result.network_out).toBeGreaterThanOrEqual(0)
    })

    it('should show task count', () => {
      const result = displayNodeDetails('node-1')

      expect(result.task_count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('handleZoom', () => {
    it('should zoom in', () => {
      const newLevel = handleZoom('in', 1.0)

      expect(newLevel).toBeGreaterThan(1.0)
      expect(newLevel).toBe(1.5)
    })

    it('should zoom out', () => {
      const newLevel = handleZoom('out', 2.0)

      expect(newLevel).toBeLessThan(2.0)
      expect(newLevel).toBe(1.5)
    })

    it('should respect max zoom level', () => {
      const newLevel = handleZoom('in', 10.0)

      expect(newLevel).toBeLessThanOrEqual(10.0)
    })

    it('should respect min zoom level', () => {
      const newLevel = handleZoom('out', 0.1)

      expect(newLevel).toBeGreaterThanOrEqual(0.1)
    })
  })

  describe('handlePan', () => {
    it('should pan up', () => {
      const result = handlePan('up', 10)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.direction).toBe('up')
    })

    it('should pan down', () => {
      const result = handlePan('down', 10)

      expect(result.success).toBe(true)
      expect(result.direction).toBe('down')
    })

    it('should pan left', () => {
      const result = handlePan('left', 15)

      expect(result.success).toBe(true)
      expect(result.direction).toBe('left')
    })

    it('should pan right', () => {
      const result = handlePan('right', 15)

      expect(result.success).toBe(true)
      expect(result.direction).toBe('right')
    })
  })

  describe('getMeshStats', () => {
    it('should get mesh statistics', () => {
      const stats = getMeshStats()

      expect(stats).toBeDefined()
      expect(stats.total_nodes).toBeGreaterThan(0)
      expect(stats.active_nodes).toBeGreaterThanOrEqual(0)
    })

    it('should show connection stats', () => {
      const stats = getMeshStats()

      expect(stats.total_connections).toBeGreaterThan(0)
      expect(stats.active_connections).toBeGreaterThanOrEqual(0)
    })

    it('should show performance metrics', () => {
      const stats = getMeshStats()

      expect(stats.avg_latency_ms).toBeGreaterThanOrEqual(0)
      expect(stats.total_bandwidth_mbps).toBeGreaterThan(0)
    })

    it('should show task statistics', () => {
      const stats = getMeshStats()

      expect(stats.active_tasks).toBeGreaterThanOrEqual(0)
      expect(stats.completed_tasks).toBeGreaterThanOrEqual(0)
    })

    it('should show system uptime', () => {
      const stats = getMeshStats()

      expect(stats.system_uptime_seconds).toBeGreaterThan(0)
    })
  })

  describe('searchNodes', () => {
    it('should search for nodes', () => {
      const result = searchNodes('Orchestrator')

      expect(result).toBeDefined()
      expect(result.query).toBe('Orchestrator')
      expect(result.count).toBeGreaterThanOrEqual(0)
    })

    it('should return search results', () => {
      const result = searchNodes('Worker')

      expect(Array.isArray(result.results)).toBe(true)
    })
  })

  describe('applyTheme', () => {
    it('should apply dark theme', () => {
      const result = applyTheme('dark')

      expect(result).toBeDefined()
      expect(result.name).toBe('dark')
      expect(result.applied).toBe(true)
    })

    it('should apply light theme', () => {
      const result = applyTheme('light')

      expect(result).toBeDefined()
      expect(result.applied).toBe(true)
    })

    it('should have color information', () => {
      const result = applyTheme('dark')

      expect(result.colors).toBeDefined()
    })
  })

  describe('exportMeshState', () => {
    it('should export as JSON', () => {
      const result = exportMeshState('json')

      expect(result).toBeDefined()
      expect(result.format).toBe('json')
      expect(result.nodes).toBeGreaterThan(0)
    })

    it('should export as CSV', () => {
      const result = exportMeshState('csv')

      expect(result).toBeDefined()
      expect(result.format).toBe('csv')
    })

    it('should include size information', () => {
      const result = exportMeshState('json')

      expect(result.size_bytes).toBeGreaterThan(0)
    })
  })

  describe('TuiManager class', () => {
    let manager: TuiManager

    beforeAll(() => {
      manager = new TuiManager(sampleConfig)
    })

    it('should create TUI manager instance', () => {
      expect(manager).toBeDefined()
      expect(manager).toBeInstanceOf(TuiManager)
    })

    it('should initialize manager', () => {
      const result = manager.initialize()

      expect(result).toBeDefined()
      expect(result.initialized).toBe(true)
    })

    it('should render through manager', () => {
      const renderState = {
        width: 120,
        height: 40,
        nodes: sampleNodes,
        connections: sampleConnections,
      }

      const result = manager.render(renderState)

      expect(result).toBeDefined()
      expect(result.nodes_count).toBe(3)
    })

    it('should update nodes through manager', () => {
      const result = manager.updateNodes(sampleNodes)

      expect(result).toBeDefined()
    })

    it('should process events through manager', () => {
      const event: TuiEvent = {
        event_type: 'quit',
        timestamp: new Date().toISOString(),
      }

      const result = manager.processEvent(event)

      expect(result.handled).toBe(true)
    })

    it('should get stats through manager', () => {
      const stats = manager.getStats()

      expect(stats).toBeDefined()
      expect(stats.total_nodes).toBeGreaterThan(0)
    })

    it('should search through manager', () => {
      const result = manager.search('test')

      expect(result).toBeDefined()
    })

    it('should apply theme through manager', () => {
      const result = manager.theme('dark')

      expect(result.applied).toBe(true)
    })

    it('should export through manager', () => {
      const result = manager.export('json')

      expect(result).toBeDefined()
    })
  })

  describe('Integration tests', () => {
    it('should complete full TUI workflow', () => {
      // Initialize
      const init = initializeTui(sampleConfig)
      expect(init.initialized).toBe(true)

      // Render
      const renderState = {
        width: 120,
        height: 40,
        nodes: sampleNodes,
        connections: sampleConnections,
      }
      const render = renderMesh(renderState)
      expect(render.nodes_count).toBe(3)

      // Get stats
      const stats = getMeshStats()
      expect(stats.total_nodes).toBeGreaterThan(0)

      // Handle event
      const event: TuiEvent = {
        event_type: 'zoom_in',
        timestamp: new Date().toISOString(),
      }
      const handled = handleEvent(event)
      expect(handled.handled).toBe(true)
    })

    it('should handle interactive sequence', () => {
      // Zoom in
      let zoom = 1.0
      zoom = handleZoom('in', zoom)
      expect(zoom).toBeGreaterThan(1.0)

      // Pan
      const pan = handlePan('right', 20)
      expect(pan.success).toBe(true)

      // Get visualization
      const viz = getVisualizationData()
      expect(viz).toBeDefined()

      // Search
      const search = searchNodes('test')
      expect(search).toBeDefined()
    })

    it('should maintain data integrity through operations', () => {
      const originalNodes = sampleNodes
      updateMeshNodes(originalNodes)
      const updated = updateMeshNodes(originalNodes)

      expect(updated).toBeDefined()
      expect(updated.nodes_updated).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid node gracefully', () => {
      const invalidNodes = [
        {
          id: '',
          label: 'Invalid',
          x: 0,
          y: 0,
          status: 'active' as const,
          load: 0,
        },
      ]

      const result = updateMeshNodes(invalidNodes)

      expect(result).toBeDefined()
    })

    it('should handle edge case zoom levels', () => {
      const result1 = handleZoom('in', 9.8)
      expect(result1).toBeLessThanOrEqual(10.0)

      const result2 = handleZoom('out', 0.2)
      expect(result2).toBeGreaterThanOrEqual(0.1)
    })

    it('should handle empty search results gracefully', () => {
      const result = searchNodes('')

      expect(result).toBeDefined()
    })
  })
})
