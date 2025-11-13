// NT Market Data - Market data management for Neural Trader
// TypeScript bindings for the napi-rs module

export interface OHLCV {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Quote {
  symbol: string
  timestamp: number
  bid_price: number
  bid_size: number
  ask_price: number
  ask_size: number
}

export interface Trade {
  symbol: string
  timestamp: number
  price: number
  size: number
  side: string
}

export interface CachedData {
  symbol: string
  data_type: string
  timestamp: number
  data: Record<string, any>
  ttl: number
}

export interface NormalizedMarketData {
  symbol: string
  timestamp: number
  price: number
  volume: number
  data_quality: number
  source: string
}

export interface IngestionResult {
  symbol: string
  record_count: number
  timestamp: number
  processing_duration_ms: number
  success: boolean
}

export interface CacheStats {
  total_entries: number
  cache_hits: number
  cache_misses: number
  hit_rate: number
  memory_bytes: number
  timestamp: number
}

export interface BufferInfo {
  symbol: string
  buffer_size: number
  oldest_timestamp: number
  newest_timestamp: number
  data_points: number
  utilization_percent: number
}

/**
 * Native bindings from nt_market_data Rust module
 */
let marketData: any

try {
  // Load the native module via platform loader
  marketData = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_market_data module not loaded. Build the project first.')
  marketData = null
}

// ============ OHLCV Functions ============

/**
 * Create OHLCV data point
 * @param ohlcv - OHLCV data to create
 * @returns Created OHLCV data
 */
export function createOHLCV(ohlcv: OHLCV): OHLCV {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.createOhlcv(JSON.stringify(ohlcv))
  return JSON.parse(result)
}

/**
 * Process OHLCV data batch
 * @param ohlcvBatch - Array of OHLCV data
 * @returns Aggregated OHLCV statistics
 */
export function processOHLCVBatch(ohlcvBatch: OHLCV[]): Record<string, any> {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.processOhlcvBatch(JSON.stringify(ohlcvBatch))
  return JSON.parse(result)
}

// ============ Quote Functions ============

/**
 * Process quote data (bid/ask)
 * @param quote - Quote data to process
 * @returns Processed quote with spread information
 */
export function processQuote(quote: Quote): Record<string, any> {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.processQuote(JSON.stringify(quote))
  return JSON.parse(result)
}

/**
 * Process batch of quotes
 * @param quotes - Array of quote data
 * @returns Array of processed quotes
 */
export function processQuoteBatch(quotes: Quote[]): Record<string, any>[] {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.processQuoteBatch(JSON.stringify(quotes))
  return JSON.parse(result)
}

// ============ Trade Functions ============

/**
 * Process trade data
 * @param trade - Trade data to process
 * @returns Processed trade with notional value
 */
export function processTrade(trade: Trade): Record<string, any> {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.processTrade(JSON.stringify(trade))
  return JSON.parse(result)
}

/**
 * Process batch of trades
 * @param trades - Array of trade data
 * @returns Trade batch statistics
 */
export function processTradeBatch(trades: Trade[]): Record<string, any> {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.processTradeBatch(JSON.stringify(trades))
  return JSON.parse(result)
}

// ============ Data Normalization ============

/**
 * Normalize market data from different sources
 * @param rawData - Raw market data object
 * @returns Normalized market data
 */
export function normalizeMarketData(rawData: Record<string, any>): NormalizedMarketData {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.normalizeMarketData(JSON.stringify(rawData))
  return JSON.parse(result)
}

/**
 * Normalize batch of market data
 * @param batch - Array of market data
 * @returns Array of normalized market data
 */
export function normalizeBatch(batch: Record<string, any>[]): NormalizedMarketData[] {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.normalizeBatch(JSON.stringify(batch))
  return JSON.parse(result)
}

// ============ Data Ingestion ============

/**
 * Ingest real-time market data
 * @param data - Array of real-time market data points
 * @returns Ingestion result with statistics
 */
export function ingestRealtimeData(data: Record<string, any>[]): IngestionResult {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.ingestRealtimeData(JSON.stringify(data))
  return JSON.parse(result)
}

/**
 * Ingest historical market data
 * @param data - Array of historical market data
 * @returns Ingestion result with statistics
 */
export function ingestHistoricalData(data: Record<string, any>[]): IngestionResult {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.ingestHistoricalData(JSON.stringify(data))
  return JSON.parse(result)
}

// ============ Data Caching ============

/**
 * Cache market data entry
 * @param cacheEntry - Data to cache
 * @returns Cached entry with metadata
 */
export function cacheMarketData(cacheEntry: CachedData): Record<string, any> {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.cacheMarketData(JSON.stringify(cacheEntry))
  return JSON.parse(result)
}

/**
 * Get cache statistics
 * @param cacheSize - Total cache entries
 * @param hits - Cache hits
 * @param misses - Cache misses
 * @returns Cache statistics
 */
export function getCacheStats(cacheSize: number, hits: number, misses: number): CacheStats {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.getCacheStats(cacheSize, hits, misses)
  return JSON.parse(result)
}

/**
 * Invalidate expired cache entries
 * @param entries - Array of cache entries
 * @returns Invalidation statistics
 */
export function invalidateExpiredCache(entries: CachedData[]): Record<string, any> {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.invalidateExpiredCache(JSON.stringify(entries))
  return JSON.parse(result)
}

// ============ Data Buffering ============

/**
 * Create buffer for streaming data
 * @param symbol - Market symbol
 * @param maxSize - Maximum buffer size
 * @returns Buffer info
 */
export function createBuffer(symbol: string, maxSize: number): BufferInfo {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.createBuffer(symbol, maxSize)
  return JSON.parse(result)
}

/**
 * Add data to buffer
 * @param bufferInfo - Current buffer info
 * @param dataPoints - Number of data points to add
 * @returns Updated buffer info
 */
export function addToBuffer(bufferInfo: BufferInfo, dataPoints: number): BufferInfo {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.addToBuffer(JSON.stringify(bufferInfo), dataPoints)
  return JSON.parse(result)
}

/**
 * Flush buffer and get data
 * @param bufferInfo - Buffer info
 * @returns Flushed buffer data
 */
export function flushBuffer(bufferInfo: BufferInfo): Record<string, any> {
  if (!marketData) {
    throw new Error('Native module not available')
  }

  const result = marketData.flushBuffer(JSON.stringify(bufferInfo))
  return JSON.parse(result)
}

/**
 * Market Data Manager class for advanced use cases
 */
export class MarketDataManager {
  /**
   * Create a new MarketDataManager instance
   */
  constructor() {
    if (!marketData) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Create OHLCV data point
   */
  createOHLCV(ohlcv: OHLCV): OHLCV {
    return createOHLCV(ohlcv)
  }

  /**
   * Process OHLCV batch
   */
  processOHLCVBatch(ohlcvBatch: OHLCV[]): Record<string, any> {
    return processOHLCVBatch(ohlcvBatch)
  }

  /**
   * Process quote data
   */
  processQuote(quote: Quote): Record<string, any> {
    return processQuote(quote)
  }

  /**
   * Process quote batch
   */
  processQuoteBatch(quotes: Quote[]): Record<string, any>[] {
    return processQuoteBatch(quotes)
  }

  /**
   * Process trade data
   */
  processTrade(trade: Trade): Record<string, any> {
    return processTrade(trade)
  }

  /**
   * Process trade batch
   */
  processTradeBatch(trades: Trade[]): Record<string, any> {
    return processTradeBatch(trades)
  }

  /**
   * Normalize market data
   */
  normalizeMarketData(rawData: Record<string, any>): NormalizedMarketData {
    return normalizeMarketData(rawData)
  }

  /**
   * Normalize batch
   */
  normalizeBatch(batch: Record<string, any>[]): NormalizedMarketData[] {
    return normalizeBatch(batch)
  }

  /**
   * Ingest real-time data
   */
  ingestRealtimeData(data: Record<string, any>[]): IngestionResult {
    return ingestRealtimeData(data)
  }

  /**
   * Ingest historical data
   */
  ingestHistoricalData(data: Record<string, any>[]): IngestionResult {
    return ingestHistoricalData(data)
  }

  /**
   * Cache market data
   */
  cacheMarketData(cacheEntry: CachedData): Record<string, any> {
    return cacheMarketData(cacheEntry)
  }

  /**
   * Get cache statistics
   */
  getCacheStats(cacheSize: number, hits: number, misses: number): CacheStats {
    return getCacheStats(cacheSize, hits, misses)
  }

  /**
   * Invalidate expired cache
   */
  invalidateExpiredCache(entries: CachedData[]): Record<string, any> {
    return invalidateExpiredCache(entries)
  }

  /**
   * Create buffer
   */
  createBuffer(symbol: string, maxSize: number): BufferInfo {
    return createBuffer(symbol, maxSize)
  }

  /**
   * Add to buffer
   */
  addToBuffer(bufferInfo: BufferInfo, dataPoints: number): BufferInfo {
    return addToBuffer(bufferInfo, dataPoints)
  }

  /**
   * Flush buffer
   */
  flushBuffer(bufferInfo: BufferInfo): Record<string, any> {
    return flushBuffer(bufferInfo)
  }
}

// Export all types and functions
export default {
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
  MarketDataManager,
}
