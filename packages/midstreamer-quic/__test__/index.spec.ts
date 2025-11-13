import { describe, it, expect, beforeEach } from 'vitest'
import {
  QuicClient,
  createSimpleStream,
  calculateStreamEfficiency,
  QuicStream,
  QuicConfig,
  StreamStats,
} from '../src/index'

describe('QUIC Multi-Stream Support', () => {
  let client: QuicClient

  beforeEach(() => {
    client = new QuicClient()
  })

  describe('QuicClient Creation', () => {
    it('should create a QUIC client with default config', () => {
      const defaultClient = new QuicClient()
      expect(defaultClient).toBeDefined()
    })

    it('should create a QUIC client with custom config', () => {
      const config: QuicConfig = {
        initial_max_streams: 50,
        idle_timeout: 60000,
        max_data: 2 * 1024 * 1024,
        max_stream_data: 200 * 1024,
      }
      const customClient = new QuicClient(config)
      expect(customClient).toBeDefined()
    })

    it('should initialize with empty streams', () => {
      const stats = client.getStats()
      expect(stats.total_streams).toBe(0)
      expect(stats.active_streams).toBe(0)
    })
  })

  describe('Stream Creation', () => {
    it('should create a single stream', () => {
      const streamId = client.createStream(1)
      expect(typeof streamId).toBe('number')
      expect(streamId).toBeGreaterThan(0)
    })

    it('should create multiple streams with different priorities', () => {
      const stream1 = client.createStream(1)
      const stream2 = client.createStream(2)
      const stream3 = client.createStream(3)

      expect(stream1).toBe(1)
      expect(stream2).toBe(2)
      expect(stream3).toBe(3)
    })

    it('should increment stream IDs sequentially', () => {
      const ids = []
      for (let i = 0; i < 5; i++) {
        ids.push(client.createStream(i + 1))
      }

      expect(ids).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('Stream Operations', () => {
    it('should send data on a stream', () => {
      const streamId = client.createStream(1)
      const bytesSent = client.sendData(streamId, 1024)

      expect(bytesSent).toBe(1024)
    })

    it('should receive data on a stream', () => {
      const streamId = client.createStream(1)
      const bytesReceived = client.receiveData(streamId, 2048)

      expect(bytesReceived).toBeGreaterThan(0)
    })

    it('should get stream information', () => {
      const streamId = client.createStream(2)
      client.sendData(streamId, 512)

      const streamInfo = client.getStreamInfo(streamId)

      expect(streamInfo).toBeDefined()
      expect(streamInfo.id).toBe(streamId)
      expect(streamInfo.state).toBe('open')
      expect(streamInfo.data_sent).toBe(512)
      expect(streamInfo.priority).toBe(2)
    })

    it('should list all active streams', () => {
      const stream1 = client.createStream(1)
      const stream2 = client.createStream(1)
      const stream3 = client.createStream(1)

      const activeStreams = client.getActiveStreams()

      expect(activeStreams).toContain(stream1)
      expect(activeStreams).toContain(stream2)
      expect(activeStreams).toContain(stream3)
      expect(activeStreams.length).toBe(3)
    })
  })

  describe('Stream Closing', () => {
    it('should close a single stream', () => {
      const streamId = client.createStream(1)
      const result = client.closeStream(streamId)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.stream_id).toBe(streamId)
    })

    it('should close all streams', () => {
      client.createStream(1)
      client.createStream(1)
      client.createStream(1)

      const closedCount = client.closeAllStreams()

      expect(closedCount).toBe(3)

      const stats = client.getStats()
      expect(stats.active_streams).toBe(0)
    })

    it('should change stream state after closing', () => {
      const streamId = client.createStream(1)
      client.closeStream(streamId)

      const streamInfo = client.getStreamInfo(streamId)
      expect(streamInfo.state).toBe('closed')
    })
  })

  describe('Stream Reset', () => {
    it('should reset a stream with error code', () => {
      const streamId = client.createStream(1)
      const result = client.resetStream(streamId, 42)

      expect(result.success).toBe(true)
      expect(result.message).toContain('42')
    })

    it('should update stream state on reset', () => {
      const streamId = client.createStream(1)
      client.resetStream(streamId, 100)

      const streamInfo = client.getStreamInfo(streamId)
      expect(streamInfo.state).toContain('reset')
    })
  })

  describe('Stream Priority', () => {
    it('should set stream priority', () => {
      const streamId = client.createStream(1)
      const result = client.setStreamPriority(streamId, 10)

      expect(result.success).toBe(true)
    })

    it('should update priority in stream info', () => {
      const streamId = client.createStream(1)
      client.setStreamPriority(streamId, 15)

      const streamInfo = client.getStreamInfo(streamId)
      expect(streamInfo.priority).toBe(15)
    })
  })

  describe('Statistics', () => {
    it('should report correct statistics', () => {
      const stream1 = client.createStream(1)
      const stream2 = client.createStream(2)

      client.sendData(stream1, 1000)
      client.sendData(stream2, 500)
      client.receiveData(stream1, 2000)

      const stats = client.getStats()

      expect(stats.total_streams).toBe(2)
      expect(stats.active_streams).toBe(2)
      expect(stats.total_data_sent).toBe(1500)
      expect(stats.total_data_received).toBe(2000)
      expect(stats.timestamp).toBeDefined()
    })

    it('should update statistics after data transfer', () => {
      const streamId = client.createStream(1)

      const stats1 = client.getStats()
      expect(stats1.total_data_sent).toBe(0)

      client.sendData(streamId, 5000)

      const stats2 = client.getStats()
      expect(stats2.total_data_sent).toBe(5000)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid stream ID', () => {
      expect(() => {
        client.getStreamInfo(9999)
      }).toThrow()
    })

    it('should handle close on non-existent stream', () => {
      expect(() => {
        client.closeStream(9999)
      }).toThrow()
    })

    it('should handle reset on non-existent stream', () => {
      expect(() => {
        client.resetStream(9999, 0)
      }).toThrow()
    })
  })

  describe('Utility Functions', () => {
    it('should create a simple stream', () => {
      const stream = createSimpleStream(5)

      expect(stream).toBeDefined()
      expect(stream.id).toBe(1)
      expect(stream.state).toBe('open')
      expect(stream.priority).toBe(5)
      expect(stream.data_sent).toBe(0)
      expect(stream.data_received).toBe(0)
    })

    it('should calculate stream efficiency', () => {
      const efficiency = calculateStreamEfficiency(10000, 5000, 5000)

      expect(typeof efficiency).toBe('number')
      expect(efficiency).toBeGreaterThan(0)
    })

    it('should calculate efficiency correctly', () => {
      // 15000 bytes in 5 seconds = 3000 bytes/sec
      const efficiency = calculateStreamEfficiency(10000, 5000, 5000)
      const expected = 15000 / 5 // 3000

      expect(efficiency).toBeCloseTo(expected)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple streams with different operations', () => {
      const s1 = client.createStream(1)
      const s2 = client.createStream(2)
      const s3 = client.createStream(3)

      client.sendData(s1, 1000)
      client.sendData(s2, 2000)
      client.receiveData(s1, 500)

      client.closeStream(s2)
      client.resetStream(s3, 50)

      const stats = client.getStats()

      expect(stats.total_streams).toBe(3)
      expect(stats.active_streams).toBe(1) // Only s1 is still open
      expect(stats.total_data_sent).toBe(3000)
      expect(stats.total_data_received).toBe(500)
    })

    it('should handle stream lifecycle', () => {
      const streamId = client.createStream(1)

      // Get initial state
      let info = client.getStreamInfo(streamId)
      expect(info.state).toBe('open')

      // Send and receive data
      client.sendData(streamId, 1000)
      client.receiveData(streamId, 500)

      info = client.getStreamInfo(streamId)
      expect(info.data_sent).toBe(1000)
      expect(info.data_received).toBe(500)

      // Close the stream
      client.closeStream(streamId)

      info = client.getStreamInfo(streamId)
      expect(info.state).toBe('closed')
    })

    it('should maintain separate client instances', () => {
      const client2 = new QuicClient()

      const s1 = client.createStream(1)
      const s2 = client2.createStream(1)

      client.sendData(s1, 1000)
      client2.sendData(s2, 2000)

      const stats1 = client.getStats()
      const stats2 = client2.getStats()

      expect(stats1.total_data_sent).toBe(1000)
      expect(stats2.total_data_sent).toBe(2000)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero priority', () => {
      const streamId = client.createStream(0)
      expect(streamId).toBeGreaterThan(0)
    })

    it('should handle large stream count', () => {
      const streams = []
      for (let i = 0; i < 50; i++) {
        streams.push(client.createStream(1))
      }

      expect(streams.length).toBe(50)

      const stats = client.getStats()
      expect(stats.total_streams).toBe(50)
      expect(stats.active_streams).toBe(50)
    })

    it('should handle large data transfers', () => {
      const streamId = client.createStream(1)
      const largeSize = 10 * 1024 * 1024 // 10MB

      const sent = client.sendData(streamId, largeSize)
      expect(sent).toBeGreaterThan(0)
    })

    it('should handle sequential operations on same stream', () => {
      const streamId = client.createStream(1)

      for (let i = 0; i < 10; i++) {
        client.sendData(streamId, 100)
        client.receiveData(streamId, 50)
      }

      const info = client.getStreamInfo(streamId)
      expect(info.data_sent).toBe(1000)
      expect(info.data_received).toBe(500)
    })
  })
})
