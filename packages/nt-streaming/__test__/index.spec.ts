import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  StreamManager,
  createStreamManager,
  createEventListener,
  processMarketData,
  validateStreamConfig,
  formatStreamEvent,
  parseMarketDataBatch,
  StreamConfig,
  MarketDataPoint,
} from '../src/index';

describe('StreamManager', () => {
  let stream: StreamManager;
  const testUrl = 'wss://stream.example.com';
  const testTimeout = 5000;

  beforeEach(() => {
    stream = new StreamManager(testUrl, testTimeout);
  });

  afterEach(() => {
    if (stream && stream.isConnected()) {
      stream.disconnect();
    }
  });

  describe('Constructor', () => {
    it('should create a StreamManager instance', () => {
      expect(stream).toBeDefined();
      expect(stream instanceof StreamManager).toBe(true);
    });

    it('should throw error for empty URL', () => {
      expect(() => {
        new StreamManager('');
      }).toThrow();
    });

    it('should set timeout_ms correctly', () => {
      const customStream = new StreamManager(testUrl, 10000);
      expect(customStream).toBeDefined();
    });

    it('should generate unique stream IDs', () => {
      const stream1 = new StreamManager(testUrl);
      const stream2 = new StreamManager(testUrl);
      expect(stream1.getStreamId()).not.toBe(stream2.getStreamId());
    });
  });

  describe('Connection Management', () => {
    it('should connect to stream', () => {
      const result = stream.connect();
      expect(result).toBe(true);
    });

    it('should be connected after connect()', () => {
      stream.connect();
      expect(stream.isConnected()).toBe(true);
    });

    it('should disconnect from stream', () => {
      stream.connect();
      const result = stream.disconnect();
      expect(result).toBe(true);
      expect(stream.isConnected()).toBe(false);
    });

    it('should handle multiple connections', () => {
      stream.connect();
      expect(stream.isConnected()).toBe(true);
      stream.connect(); // Connect again
      expect(stream.isConnected()).toBe(true);
    });

    it('should get stream ID', () => {
      const streamId = stream.getStreamId();
      expect(streamId).toBeDefined();
      expect(typeof streamId).toBe('string');
      expect(streamId.length).toBeGreaterThan(0);
    });
  });

  describe('Market Data Management', () => {
    beforeEach(() => {
      stream.connect();
    });

    it('should add market data point', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      expect(stream.getDataCount()).toBe(1);
    });

    it('should add multiple market data points', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      stream.addMarketData('ETH/USD', 3000, 500);
      stream.addMarketData('DOGE/USD', 0.10, 5000);
      expect(stream.getDataCount()).toBe(3);
    });

    it('should throw error when adding data without connection', () => {
      stream.disconnect();
      expect(() => {
        stream.addMarketData('BTC/USD', 50000, 1000);
      }).toThrow();
    });

    it('should increment error count on failed add', () => {
      stream.disconnect();
      const initialErrors = stream.getErrorCount();
      try {
        stream.addMarketData('BTC/USD', 50000, 1000);
      } catch {
        // Expected error
      }
      expect(stream.getErrorCount()).toBeGreaterThan(initialErrors);
    });

    it('should get buffered messages', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      const messages = stream.getBufferedMessages();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('should clear buffer', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      expect(stream.getBufferSize()).toBeGreaterThan(0);
      stream.clearBuffer();
      expect(stream.getBufferSize()).toBe(0);
    });

    it('should batch add market data', () => {
      const batchData = JSON.stringify([
        { symbol: 'BTC/USD', price: 50000, volume: 1000 },
        { symbol: 'ETH/USD', price: 3000, volume: 500 },
        { symbol: 'DOGE/USD', price: 0.10, volume: 5000 },
      ]);

      const count = stream.batchAddMarketData(batchData);
      expect(count).toBe(3);
      expect(stream.getDataCount()).toBe(3);
    });

    it('should get buffer size', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      const size = stream.getBufferSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should get data count', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      stream.addMarketData('ETH/USD', 3000, 500);
      expect(stream.getDataCount()).toBe(2);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      stream.connect();
    });

    it('should subscribe to symbol', () => {
      stream.subscribe('BTC/USD');
      const messages = stream.getBufferedMessages();
      expect(messages.some((msg) => msg.includes('BTC/USD'))).toBe(true);
    });

    it('should unsubscribe from symbol', () => {
      stream.subscribe('BTC/USD');
      stream.unsubscribe('BTC/USD');
      const messages = stream.getBufferedMessages();
      expect(messages.some((msg) => msg.includes('UNSUBSCRIBE'))).toBe(true);
    });

    it('should throw error subscribing without connection', () => {
      stream.disconnect();
      expect(() => {
        stream.subscribe('BTC/USD');
      }).toThrow();
    });

    it('should throw error unsubscribing without connection', () => {
      stream.disconnect();
      expect(() => {
        stream.unsubscribe('BTC/USD');
      }).toThrow();
    });

    it('should handle multiple subscriptions', () => {
      stream.subscribe('BTC/USD');
      stream.subscribe('ETH/USD');
      stream.subscribe('DOGE/USD');
      const messages = stream.getBufferedMessages();
      expect(messages.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Connection State', () => {
    beforeEach(() => {
      stream.connect();
    });

    it('should get connection state', () => {
      const state = stream.getConnectionState();
      expect(state).toBeDefined();
      expect(state.streamId).toBeDefined();
      expect(typeof state.isConnected).toBe('boolean');
      expect(typeof state.errorCount).toBe('number');
      expect(typeof state.dataCount).toBe('number');
    });

    it('should show connected state when connected', () => {
      const state = stream.getConnectionState();
      expect(state.isConnected).toBe(true);
    });

    it('should track uptime', () => {
      const state = stream.getConnectionState();
      expect(state.uptimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should have last heartbeat timestamp', () => {
      const state = stream.getConnectionState();
      expect(state.lastHeartbeat).toBeGreaterThan(0);
    });
  });

  describe('Heartbeat', () => {
    beforeEach(() => {
      stream.connect();
    });

    it('should send heartbeat', () => {
      const initialState = stream.getConnectionState();
      stream.heartbeat();
      const newState = stream.getConnectionState();
      expect(newState.lastHeartbeat).toBeGreaterThanOrEqual(initialState.lastHeartbeat);
    });

    it('should throw error on heartbeat without connection', () => {
      stream.disconnect();
      expect(() => {
        stream.heartbeat();
      }).toThrow();
    });

    it('should increment error count on failed heartbeat', () => {
      stream.disconnect();
      const initialErrors = stream.getErrorCount();
      try {
        stream.heartbeat();
      } catch {
        // Expected error
      }
      expect(stream.getErrorCount()).toBeGreaterThan(initialErrors);
    });
  });

  describe('Reconnection', () => {
    it('should reconnect', () => {
      stream.connect();
      const result = stream.reconnect();
      expect(result).toBe(true);
      expect(stream.isConnected()).toBe(true);
    });

    it('should increment reconnect count', () => {
      stream.connect();
      const initialCount = stream.getReconnectCount();
      stream.reconnect();
      expect(stream.getReconnectCount()).toBeGreaterThan(initialCount);
    });

    it('should handle multiple reconnections', () => {
      stream.connect();
      stream.reconnect();
      stream.reconnect();
      stream.reconnect();
      expect(stream.getReconnectCount()).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      stream.connect();
    });

    it('should get statistics', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      const stats = stream.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.streamId).toBeDefined();
      expect(typeof stats.totalMessages).toBe('number');
      expect(typeof stats.totalErrors).toBe('number');
      expect(typeof stats.averageLatencyMs).toBe('number');
      expect(typeof stats.bytesReceived).toBe('number');
      expect(typeof stats.uptimeSeconds).toBe('number');
      expect(typeof stats.reconnectCount).toBe('number');
    });

    it('should track bytes received', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      const bytes = stream.getTotalBytes();
      expect(bytes).toBeGreaterThan(0);
    });

    it('should get error count', () => {
      const count = stream.getErrorCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should reset error count', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      stream.resetErrorCount();
      expect(stream.getErrorCount()).toBe(0);
    });

    it('should reset statistics', () => {
      stream.addMarketData('BTC/USD', 50000, 1000);
      stream.subscribe('ETH/USD');
      stream.resetStatistics();
      expect(stream.getDataCount()).toBe(0);
      expect(stream.getErrorCount()).toBe(0);
      expect(stream.getBufferSize()).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should get configuration', () => {
      const config = stream.getConfig();
      expect(typeof config).toBe('string');
      expect(config.length).toBeGreaterThan(0);
      const parsed = JSON.parse(config);
      expect(parsed.url).toBe(testUrl);
    });

    it('should update configuration', () => {
      const newConfig: StreamConfig = {
        url: 'wss://new-stream.example.com',
        timeout_ms: 10000,
      };
      stream.updateConfig(JSON.stringify(newConfig));
      const updated = JSON.parse(stream.getConfig());
      expect(updated.url).toBe('wss://new-stream.example.com');
    });

    it('should throw error on invalid config URL', () => {
      const badConfig = {
        url: '',
        timeout_ms: 5000,
      };
      expect(() => {
        stream.updateConfig(JSON.stringify(badConfig));
      }).toThrow();
    });
  });
});

describe('Utility Functions', () => {
  describe('createStreamManager', () => {
    it('should create stream manager', () => {
      const stream = createStreamManager('wss://example.com');
      expect(stream instanceof StreamManager).toBe(true);
    });

    it('should create stream manager with timeout', () => {
      const stream = createStreamManager('wss://example.com', 5000);
      expect(stream).toBeDefined();
    });
  });

  describe('createEventListener', () => {
    it('should create event listener', () => {
      const listener = createEventListener('data_received');
      expect(listener).toBeDefined();
      expect(listener.eventType).toBe('data_received');
      expect(listener.handlerId).toBeDefined();
    });

    it('should generate unique handler IDs', () => {
      const listener1 = createEventListener('data_received');
      const listener2 = createEventListener('data_received');
      expect(listener1.handlerId).not.toBe(listener2.handlerId);
    });
  });

  describe('processMarketData', () => {
    it('should process market data', () => {
      const marketData = {
        symbol: 'BTC/USD',
        price: 50000,
        volume: 1000,
        timestamp: Date.now(),
        bid: 49900,
        ask: 50100,
        bid_size: 500,
        ask_size: 500,
      };

      const result = processMarketData(JSON.stringify(marketData));
      const parsed = JSON.parse(result);
      expect(parsed.symbol).toBe('BTC/USD');
      expect(parsed.price).toBe(50000);
    });

    it('should throw error on invalid JSON', () => {
      expect(() => {
        processMarketData('invalid json');
      }).toThrow();
    });

    it('should calculate mid price', () => {
      const marketData = {
        symbol: 'BTC/USD',
        price: 50000,
        volume: 1000,
        timestamp: Date.now(),
        bid: 49900,
        ask: 50100,
        bid_size: 500,
        ask_size: 500,
      };

      const result = processMarketData(JSON.stringify(marketData));
      const parsed = JSON.parse(result);
      expect(parsed.mid).toBeDefined();
    });

    it('should calculate spread', () => {
      const marketData = {
        symbol: 'BTC/USD',
        price: 50000,
        volume: 1000,
        timestamp: Date.now(),
        bid: 49900,
        ask: 50100,
        bid_size: 500,
        ask_size: 500,
      };

      const result = processMarketData(JSON.stringify(marketData));
      const parsed = JSON.parse(result);
      expect(parsed.spread).toBe(200);
    });
  });

  describe('validateStreamConfig', () => {
    it('should validate correct config', () => {
      const config: StreamConfig = {
        url: 'wss://example.com',
        timeout_ms: 5000,
      };
      const result = validateStreamConfig(JSON.stringify(config));
      expect(result).toBe(true);
    });

    it('should reject empty URL', () => {
      const config = {
        url: '',
        timeout_ms: 5000,
      };
      expect(() => {
        validateStreamConfig(JSON.stringify(config));
      }).toThrow();
    });

    it('should reject zero timeout', () => {
      const config = {
        url: 'wss://example.com',
        timeout_ms: 0,
      };
      expect(() => {
        validateStreamConfig(JSON.stringify(config));
      }).toThrow();
    });

    it('should reject excessive retries', () => {
      const config = {
        url: 'wss://example.com',
        timeout_ms: 5000,
        retry_count: 101,
      };
      expect(() => {
        validateStreamConfig(JSON.stringify(config));
      }).toThrow();
    });

    it('should accept valid retry count', () => {
      const config = {
        url: 'wss://example.com',
        timeout_ms: 5000,
        retry_count: 5,
      };
      const result = validateStreamConfig(JSON.stringify(config));
      expect(result).toBe(true);
    });
  });

  describe('formatStreamEvent', () => {
    it('should format stream event', () => {
      const result = formatStreamEvent('connected', 'Connection established', 'stream-123');
      const parsed = JSON.parse(result);
      expect(parsed.event_type).toBe('connected');
      expect(parsed.message).toBe('Connection established');
      expect(parsed.stream_id).toBe('stream-123');
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    it('should include timestamp', () => {
      const result = formatStreamEvent('data', 'New data received', 'stream-123');
      const parsed = JSON.parse(result);
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    it('should preserve event type', () => {
      const eventTypes = ['connected', 'disconnected', 'error', 'data'];
      eventTypes.forEach((type) => {
        const result = formatStreamEvent(type, 'message', 'stream-123');
        const parsed = JSON.parse(result);
        expect(parsed.event_type).toBe(type);
      });
    });
  });

  describe('parseMarketDataBatch', () => {
    it('should parse market data batch', () => {
      const batchData = [
        { symbol: 'BTC/USD', price: 50000, volume: 1000 },
        { symbol: 'ETH/USD', price: 3000, volume: 500 },
        { symbol: 'DOGE/USD', price: 0.10, volume: 5000 },
      ];

      const result = parseMarketDataBatch(JSON.stringify(batchData));
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(3);
    });

    it('should include all fields in parsed data', () => {
      const batchData = [{ symbol: 'BTC/USD', price: 50000, volume: 1000 }];
      const result = parseMarketDataBatch(JSON.stringify(batchData));
      const parsed = JSON.parse(result);
      expect(parsed[0]).toHaveProperty('symbol');
      expect(parsed[0]).toHaveProperty('price');
      expect(parsed[0]).toHaveProperty('volume');
    });

    it('should throw error on invalid JSON', () => {
      expect(() => {
        parseMarketDataBatch('invalid json');
      }).toThrow();
    });

    it('should handle empty batch', () => {
      const result = parseMarketDataBatch('[]');
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });

    it('should filter invalid entries', () => {
      const batchData = [
        { symbol: 'BTC/USD', price: 50000, volume: 1000 },
        { invalid: 'data' },
        { symbol: 'ETH/USD', price: 3000, volume: 500 },
      ];

      const result = parseMarketDataBatch(JSON.stringify(batchData));
      const parsed = JSON.parse(result);
      // Should only include valid entries
      expect(parsed.length).toBeLessThanOrEqual(2);
    });
  });
});
