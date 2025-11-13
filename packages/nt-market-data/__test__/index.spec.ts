import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  MarketDataManager,
  createOHLCV,
  processOHLCVBatch,
  processQuote,
  processQuoteBatch,
  processTrade,
  processTradeBatch,
  normalizeMarketData,
  normalizeBatch,
  ingestRealtimeData,
  ingestHistoricalData,
  cacheMarketData,
  getCacheStats,
  invalidateExpiredCache,
  createBuffer,
  addToBuffer,
  flushBuffer,
  OHLCV,
  Quote,
  Trade,
  CachedData,
  NormalizedMarketData,
  IngestionResult,
  CacheStats,
  BufferInfo,
} from '../src/index'

describe('NT Market Data - Complete Test Suite', () => {
  let manager: MarketDataManager

  beforeAll(() => {
    manager = new MarketDataManager()
  })

  // ============ OHLCV Tests (6 tests) ============

  describe('OHLCV Functionality', () => {
    it('should create valid OHLCV data', () => {
      const ohlcv: OHLCV = {
        timestamp: 1000,
        open: 100.0,
        high: 105.0,
        low: 99.0,
        close: 102.0,
        volume: 1000000,
      }

      const result = createOHLCV(ohlcv)

      expect(result).toBeDefined()
      expect(result.timestamp).toBe(1000)
      expect(result.open).toBe(100.0)
      expect(result.close).toBe(102.0)
    })

    it('should validate OHLCV high/low relationship', () => {
      const invalidOHLCV: OHLCV = {
        timestamp: 1000,
        open: 100.0,
        high: 99.0, // Invalid: high < low
        low: 105.0,
        close: 102.0,
        volume: 1000000,
      }

      expect(() => createOHLCV(invalidOHLCV)).toThrow()
    })

    it('should validate OHLCV close price within range', () => {
      const invalidOHLCV: OHLCV = {
        timestamp: 1000,
        open: 100.0,
        high: 105.0,
        low: 99.0,
        close: 110.0, // Invalid: close > high
        volume: 1000000,
      }

      expect(() => createOHLCV(invalidOHLCV)).toThrow()
    })

    it('should aggregate OHLCV batch statistics', () => {
      const ohlcvBatch: OHLCV[] = [
        {
          timestamp: 1000,
          open: 100.0,
          high: 105.0,
          low: 99.0,
          close: 102.0,
          volume: 1000000,
        },
        {
          timestamp: 2000,
          open: 102.0,
          high: 108.0,
          low: 101.0,
          close: 106.0,
          volume: 1200000,
        },
        {
          timestamp: 3000,
          open: 106.0,
          high: 110.0,
          low: 104.0,
          close: 107.0,
          volume: 1100000,
        },
      ]

      const result = processOHLCVBatch(ohlcvBatch)

      expect(result.total_volume).toBe(3300000)
      expect(result.period_high).toBe(110.0)
      expect(result.period_low).toBe(99.0)
      expect(result.candle_count).toBe(3)
      expect(result.price_change).toBe(7.0)
      expect(result.price_change_percent).toBeGreaterThan(0)
    })

    it('should handle empty OHLCV batch', () => {
      expect(() => processOHLCVBatch([])).toThrow()
    })

    it('should calculate correct OHLCV price change percentage', () => {
      const ohlcvBatch: OHLCV[] = [
        {
          timestamp: 1000,
          open: 100.0,
          high: 102.0,
          low: 99.0,
          close: 100.0,
          volume: 1000000,
        },
        {
          timestamp: 2000,
          open: 100.0,
          high: 110.0,
          low: 100.0,
          close: 110.0,
          volume: 1000000,
        },
      ]

      const result = processOHLCVBatch(ohlcvBatch)

      expect(result.price_change_percent).toBeCloseTo(10.0, 1)
    })
  })

  // ============ Quote Tests (7 tests) ============

  describe('Quote Functionality', () => {
    it('should process valid quote data', () => {
      const quote: Quote = {
        symbol: 'AAPL',
        timestamp: 1000,
        bid_price: 150.0,
        bid_size: 1000,
        ask_price: 150.1,
        ask_size: 1000,
      }

      const result = processQuote(quote)

      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL')
      expect(result.bid_price).toBe(150.0)
      expect(result.ask_price).toBe(150.1)
    })

    it('should calculate correct mid price', () => {
      const quote: Quote = {
        symbol: 'AAPL',
        timestamp: 1000,
        bid_price: 100.0,
        bid_size: 1000,
        ask_price: 102.0,
        ask_size: 1000,
      }

      const result = processQuote(quote)

      expect(result.mid_price).toBe(101.0)
    })

    it('should calculate correct spread in basis points', () => {
      const quote: Quote = {
        symbol: 'AAPL',
        timestamp: 1000,
        bid_price: 100.0,
        bid_size: 1000,
        ask_price: 100.1,
        ask_size: 1000,
      }

      const result = processQuote(quote)

      expect(result.spread).toBeCloseTo(0.1, 5)
      expect(result.spread_bps).toBeCloseTo(10.0, 1)
    })

    it('should validate ask >= bid price', () => {
      const invalidQuote: Quote = {
        symbol: 'AAPL',
        timestamp: 1000,
        bid_price: 150.1,
        bid_size: 1000,
        ask_price: 150.0, // Invalid: ask < bid
        ask_size: 1000,
      }

      expect(() => processQuote(invalidQuote)).toThrow()
    })

    it('should process batch of quotes', () => {
      const quotes: Quote[] = [
        {
          symbol: 'AAPL',
          timestamp: 1000,
          bid_price: 150.0,
          bid_size: 1000,
          ask_price: 150.1,
          ask_size: 1000,
        },
        {
          symbol: 'MSFT',
          timestamp: 1000,
          bid_price: 300.0,
          bid_size: 500,
          ask_price: 300.2,
          ask_size: 500,
        },
      ]

      const result = processQuoteBatch(quotes)

      expect(result).toHaveLength(2)
      expect(result[0].symbol).toBe('AAPL')
      expect(result[1].symbol).toBe('MSFT')
    })

    it('should handle empty quote batch', () => {
      expect(() => processQuoteBatch([])).toThrow()
    })

    it('should calculate wide spread correctly', () => {
      const quote: Quote = {
        symbol: 'AAPL',
        timestamp: 1000,
        bid_price: 100.0,
        bid_size: 100,
        ask_price: 105.0,
        ask_size: 100,
      }

      const result = processQuote(quote)

      expect(result.spread).toBe(5.0)
      expect(result.spread_bps).toBe(500) // (5.0 / 100.0) * 10000 = 500
    })
  })

  // ============ Trade Tests (7 tests) ============

  describe('Trade Functionality', () => {
    it('should process valid trade data', () => {
      const trade: Trade = {
        symbol: 'AAPL',
        timestamp: 1000,
        price: 150.0,
        size: 1000,
        side: 'buy',
      }

      const result = processTrade(trade)

      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL')
      expect(result.price).toBe(150.0)
      expect(result.side).toBe('buy')
    })

    it('should calculate notional value correctly', () => {
      const trade: Trade = {
        symbol: 'AAPL',
        timestamp: 1000,
        price: 150.0,
        size: 100,
        side: 'buy',
      }

      const result = processTrade(trade)

      expect(result.notional_value).toBe(15000.0)
    })

    it('should validate positive price', () => {
      const invalidTrade: Trade = {
        symbol: 'AAPL',
        timestamp: 1000,
        price: 0.0,
        size: 1000,
        side: 'buy',
      }

      expect(() => processTrade(invalidTrade)).toThrow()
    })

    it('should validate positive size', () => {
      const invalidTrade: Trade = {
        symbol: 'AAPL',
        timestamp: 1000,
        price: 150.0,
        size: 0,
        side: 'buy',
      }

      expect(() => processTrade(invalidTrade)).toThrow()
    })

    it('should process trade batch with VWAP calculation', () => {
      const trades: Trade[] = [
        {
          symbol: 'AAPL',
          timestamp: 1000,
          price: 100.0,
          size: 100,
          side: 'buy',
        },
        {
          symbol: 'AAPL',
          timestamp: 1001,
          price: 101.0,
          size: 150,
          side: 'sell',
        },
        {
          symbol: 'AAPL',
          timestamp: 1002,
          price: 102.0,
          size: 50,
          side: 'buy',
        },
      ]

      const result = processTradeBatch(trades)

      expect(result.trade_count).toBe(3)
      expect(result.buy_volume).toBe(150)
      expect(result.sell_volume).toBe(150)
      expect(result.vwap).toBeGreaterThan(0)
    })

    it('should handle empty trade batch', () => {
      expect(() => processTradeBatch([])).toThrow()
    })

    it('should calculate buy/sell ratio correctly', () => {
      const trades: Trade[] = [
        { symbol: 'AAPL', timestamp: 1000, price: 100.0, size: 200, side: 'buy' },
        { symbol: 'AAPL', timestamp: 1001, price: 101.0, size: 100, side: 'sell' },
      ]

      const result = processTradeBatch(trades)

      expect(result.buy_sell_ratio).toBe(2.0)
    })
  })

  // ============ Normalization Tests (5 tests) ============

  describe('Data Normalization', () => {
    it('should normalize market data from raw source', () => {
      const rawData = {
        symbol: 'aapl',
        timestamp: 1000,
        price: 150.5,
        volume: 1000000,
        source: 'realtime-api',
      }

      const result = normalizeMarketData(rawData)

      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL')
      expect(result.price).toBe(150.5)
      expect(result.data_quality).toBeGreaterThan(0)
    })

    it('should uppercase symbol during normalization', () => {
      const rawData = {
        symbol: 'msft',
        timestamp: 1000,
        price: 300.0,
        volume: 500000,
      }

      const result = normalizeMarketData(rawData)

      expect(result.symbol).toBe('MSFT')
    })

    it('should calculate data quality score', () => {
      const fullData = {
        symbol: 'AAPL',
        timestamp: 1000,
        price: 150.0,
        volume: 1000000,
      }

      const result = normalizeMarketData(fullData)

      expect(result.data_quality).toBe(1.0)
    })

    it('should normalize batch of market data', () => {
      const batch = [
        { symbol: 'aapl', price: 150.0, volume: 1000000, timestamp: 1000 },
        { symbol: 'msft', price: 300.0, volume: 500000, timestamp: 1000 },
        { symbol: 'googl', price: 2800.0, volume: 100000, timestamp: 1000 },
      ]

      const result = normalizeBatch(batch)

      expect(result).toHaveLength(3)
      expect(result[0].symbol).toBe('AAPL')
      expect(result[1].symbol).toBe('MSFT')
      expect(result[2].symbol).toBe('GOOGL')
    })

    it('should handle missing fields in normalization', () => {
      const incompleteData = {
        symbol: 'AAPL',
        // missing timestamp, price, volume
      }

      const result = normalizeMarketData(incompleteData)

      expect(result).toBeDefined()
      expect(result.data_quality).toBeLessThan(1.0)
    })
  })

  // ============ Ingestion Tests (5 tests) ============

  describe('Data Ingestion', () => {
    it('should ingest real-time market data', () => {
      const data = [
        { symbol: 'AAPL', price: 150.0, volume: 1000000, timestamp: 1000 },
        { symbol: 'AAPL', price: 150.1, volume: 1100000, timestamp: 1001 },
      ]

      const result = ingestRealtimeData(data)

      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL')
      expect(result.record_count).toBe(2)
      expect(result.success).toBe(true)
    })

    it('should track ingestion duration', () => {
      const data = [
        { symbol: 'MSFT', price: 300.0, volume: 500000, timestamp: 1000 },
      ]

      const result = ingestRealtimeData(data)

      expect(result.processing_duration_ms).toBeGreaterThanOrEqual(0)
    })

    it('should ingest historical market data', () => {
      const historicalData = [
        { symbol: 'AAPL', price: 140.0, volume: 900000, timestamp: 1000 },
        { symbol: 'AAPL', price: 145.0, volume: 950000, timestamp: 2000 },
        { symbol: 'AAPL', price: 150.0, volume: 1000000, timestamp: 3000 },
      ]

      const result = ingestHistoricalData(historicalData)

      expect(result.record_count).toBe(3)
      expect(result.success).toBe(true)
    })

    it('should handle empty ingestion data', () => {
      expect(() => ingestRealtimeData([])).toThrow()
    })

    it('should validate data during ingestion', () => {
      const invalidData = [
        { symbol: 'AAPL', volume: 1000000, timestamp: 1000 }, // missing price
      ]

      expect(() => ingestRealtimeData(invalidData)).toThrow()
    })
  })

  // ============ Caching Tests (5 tests) ============

  describe('Data Caching', () => {
    it('should cache market data entry', () => {
      const cacheEntry: CachedData = {
        symbol: 'AAPL',
        data_type: 'OHLCV',
        timestamp: 1000,
        data: { open: 150.0, close: 151.0 },
        ttl: 300000, // 5 minutes
      }

      const result = cacheMarketData(cacheEntry)

      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL')
      expect(result.data_type).toBe('OHLCV')
    })

    it('should calculate cache expiry timestamp', () => {
      const cacheEntry: CachedData = {
        symbol: 'MSFT',
        data_type: 'QUOTE',
        timestamp: 1000,
        data: { bid: 300.0, ask: 300.1 },
        ttl: 60000,
      }

      const result = cacheMarketData(cacheEntry)

      expect(result.expiry_timestamp).toBe(1000 + 60000)
    })

    it('should validate positive TTL', () => {
      const invalidCacheEntry: CachedData = {
        symbol: 'AAPL',
        data_type: 'TRADE',
        timestamp: 1000,
        data: {},
        ttl: 0, // Invalid TTL
      }

      expect(() => cacheMarketData(invalidCacheEntry)).toThrow()
    })

    it('should calculate cache statistics', () => {
      const stats = getCacheStats(100, 750, 250)

      expect(stats).toBeDefined()
      expect(stats.total_entries).toBe(100)
      expect(stats.cache_hits).toBe(750)
      expect(stats.cache_misses).toBe(250)
      expect(stats.hit_rate).toBe(0.75)
      expect(stats.memory_bytes).toBeGreaterThan(0)
    })

    it('should invalidate expired cache entries', () => {
      const entries: CachedData[] = [
        {
          symbol: 'AAPL',
          data_type: 'OHLCV',
          timestamp: 0,
          data: {},
          ttl: 1000,
        },
        {
          symbol: 'MSFT',
          data_type: 'QUOTE',
          timestamp: 100000000,
          data: {},
          ttl: 100,
        },
      ]

      const result = invalidateExpiredCache(entries)

      expect(result.total_entries).toBe(2)
      expect(result.expired_entries).toBeGreaterThanOrEqual(1)
    })
  })

  // ============ Buffering Tests (5 tests) ============

  describe('Data Buffering', () => {
    it('should create market data buffer', () => {
      const buffer = createBuffer('AAPL', 1000)

      expect(buffer).toBeDefined()
      expect(buffer.symbol).toBe('AAPL')
      expect(buffer.buffer_size).toBe(1000)
      expect(buffer.data_points).toBe(0)
      expect(buffer.utilization_percent).toBe(0.0)
    })

    it('should validate positive buffer size', () => {
      expect(() => createBuffer('AAPL', 0)).toThrow()
      expect(() => createBuffer('AAPL', -100)).toThrow()
    })

    it('should add data to buffer', () => {
      const buffer = createBuffer('AAPL', 1000)
      const updated = addToBuffer(buffer, 100)

      expect(updated.data_points).toBe(100)
      expect(updated.utilization_percent).toBe(10.0)
    })

    it('should track buffer utilization', () => {
      let buffer = createBuffer('MSFT', 200)

      // Add 150 data points
      buffer = addToBuffer(buffer, 150)
      expect(buffer.utilization_percent).toBe(75.0)

      // Add 100 more (exceeds capacity)
      buffer = addToBuffer(buffer, 100)
      expect(buffer.utilization_percent).toBe(100.0)
      expect(buffer.data_points).toBe(200)
    })

    it('should flush buffer', () => {
      let buffer = createBuffer('AAPL', 500)
      buffer = addToBuffer(buffer, 200)

      const flushed = flushBuffer(buffer)

      expect(flushed).toBeDefined()
      expect(flushed.symbol).toBe('AAPL')
      expect(flushed.flushed_data_points).toBe(200)
    })
  })

  // ============ Integration Tests (3 tests) ============

  describe('Integration Tests', () => {
    it('should handle complete OHLCV workflow', () => {
      const ohlcv: OHLCV = {
        timestamp: 1000,
        open: 100.0,
        high: 105.0,
        low: 99.0,
        close: 102.0,
        volume: 1000000,
      }

      // Create OHLCV
      const created = manager.createOHLCV(ohlcv)
      expect(created).toBeDefined()

      // Process batch
      const batch = [created, created, created]
      const aggregated = manager.processOHLCVBatch(batch)
      expect(aggregated.candle_count).toBe(3)

      // Normalize the aggregated data
      const normalized = manager.normalizeMarketData(aggregated)
      expect(normalized).toBeDefined()
    })

    it('should handle complete trade workflow', () => {
      const trade: Trade = {
        symbol: 'AAPL',
        timestamp: 1000,
        price: 150.0,
        size: 100,
        side: 'buy',
      }

      // Process single trade
      const processed = manager.processTrade(trade)
      expect(processed.notional_value).toBe(15000.0)

      // Process batch
      const trades = [trade, trade, trade]
      const stats = manager.processTradeBatch(trades)
      expect(stats.buy_volume).toBe(300)

      // Ingest the trades
      const ingestionData = trades.map(t => ({
        symbol: t.symbol,
        price: t.price,
        volume: t.size,
        timestamp: t.timestamp,
      }))
      const ingested = manager.ingestRealtimeData(ingestionData)
      expect(ingested.record_count).toBe(3)
    })

    it('should handle complete caching and buffering workflow', () => {
      // Create buffer
      let buffer = manager.createBuffer('AAPL', 1000)

      // Add data to buffer
      buffer = manager.addToBuffer(buffer, 500)
      expect(buffer.utilization_percent).toBe(50.0)

      // Cache some data
      const cacheEntry: CachedData = {
        symbol: 'AAPL',
        data_type: 'BUFFER_STATE',
        timestamp: buffer.newest_timestamp,
        data: buffer,
        ttl: 60000,
      }

      const cached = manager.cacheMarketData(cacheEntry)
      expect(cached).toBeDefined()

      // Get cache stats
      const stats = manager.getCacheStats(10, 100, 10)
      expect(stats.hit_rate).toBe(10 / 11)

      // Flush buffer
      const flushed = manager.flushBuffer(buffer)
      expect(flushed.flushed_data_points).toBe(500)
    })
  })

  // ============ Edge Case Tests (2 tests) ============

  describe('Edge Cases', () => {
    it('should handle large volume data', () => {
      const largeTrades: Trade[] = Array(1000)
        .fill(null)
        .map((_, i) => ({
          symbol: 'AAPL',
          timestamp: i,
          price: 100.0 + i * 0.01,
          size: 1000 + i * 10,
          side: i % 2 === 0 ? 'buy' : 'sell',
        }))

      const result = manager.processTradeBatch(largeTrades)

      expect(result.trade_count).toBe(1000)
      expect(result.vwap).toBeGreaterThan(0)
    })

    it('should handle precision in calculations', () => {
      const trade: Trade = {
        symbol: 'AAPL',
        timestamp: 1000,
        price: 150.123456789,
        size: 10000,
        side: 'buy',
      }

      const result = manager.processTrade(trade)

      expect(result.notional_value).toBeCloseTo(1501234.56789, 3)
    })
  })
})
