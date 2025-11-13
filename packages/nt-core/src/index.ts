// NT-Core - Neural Trader Core Library
// TypeScript bindings for the napi-rs module

export interface TradeData {
  symbol: string
  price: number
  volume: number // i32 in Rust
  timestamp: number
  metadata?: Record<string, any>
}

export interface PortfolioConfig {
  initial_capital: number
  max_positions?: number
  risk_per_trade?: number
  trading_hours_start?: number
  trading_hours_end?: number
}

export interface ProcessedTradeData {
  symbol: string
  price: number
  volume: number
  timestamp: number
  price_change_percent: number
  log_return: number
  metadata?: Record<string, any>
  processing_timestamp: number
}

export interface PortfolioMetrics {
  total_value: number
  cash_available: number
  total_positions: number
  unrealized_pnl: number
  realized_pnl: number
  max_drawdown: number
  sharpe_ratio: number
  win_rate: number
  timestamp: number
}

/**
 * Native bindings from nt_core Rust module
 */
let ntCore: any

try {
  // Load the native module via platform loader
  ntCore = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_core module not loaded. Build the project first.')
  ntCore = null
}

/**
 * Calculate log return from price data
 * @param previousPrice - Previous price
 * @param currentPrice - Current price
 * @returns Log return value
 */
export function calculateLogReturn(
  previousPrice: number,
  currentPrice: number
): number {
  if (!ntCore) {
    throw new Error('Native module not available')
  }
  return ntCore.calculateLogReturn(previousPrice, currentPrice)
}

/**
 * Calculate percentage change between two prices
 * @param previousPrice - Previous price
 * @param currentPrice - Current price
 * @returns Percentage change
 */
export function calculatePriceChange(
  previousPrice: number,
  currentPrice: number
): number {
  if (!ntCore) {
    throw new Error('Native module not available')
  }
  return ntCore.calculatePriceChange(previousPrice, currentPrice)
}

/**
 * Process a single trade data point
 * @param tradeData - Trade data object
 * @returns Processed trade data with computed metrics
 */
export function processTradeData(tradeData: TradeData): ProcessedTradeData {
  if (!ntCore) {
    throw new Error('Native module not available')
  }

  const tradeDataJson = JSON.stringify(tradeData)
  const result = ntCore.processTradeData(tradeDataJson)

  return JSON.parse(result)
}

/**
 * Batch process multiple trade data points
 * @param tradeDataArray - Array of trade data objects
 * @returns Array of processed trade data
 */
export function batchProcessTrades(tradeDataArray: TradeData[]): ProcessedTradeData[] {
  if (!ntCore) {
    throw new Error('Native module not available')
  }

  const tradeDataJson = JSON.stringify(tradeDataArray)
  const result = ntCore.batchProcessTrades(tradeDataJson)

  return JSON.parse(result)
}

/**
 * Calculate moving average from an array of prices
 * @param prices - Array of prices
 * @param window - Window size for moving average
 * @returns Moving average value
 */
export function calculateMovingAverage(prices: number[], window: number): number {
  if (!ntCore) {
    throw new Error('Native module not available')
  }

  const pricesJson = JSON.stringify(prices)
  return ntCore.calculateMovingAverage(pricesJson, window)
}

/**
 * Calculate portfolio metrics
 * @param portfolioConfig - Portfolio configuration
 * @param trades - Array of executed trades
 * @returns Portfolio metrics
 */
export function calculatePortfolioMetrics(
  portfolioConfig: PortfolioConfig,
  trades: TradeData[]
): PortfolioMetrics {
  if (!ntCore) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(portfolioConfig)
  const tradesJson = JSON.stringify(trades)
  const result = ntCore.calculatePortfolioMetrics(configJson, tradesJson)

  return JSON.parse(result)
}

/**
 * Validate trade parameters
 * @param symbol - Trading symbol
 * @param price - Trade price
 * @param volume - Trade volume
 * @param portfolioConfig - Portfolio configuration
 * @returns Boolean indicating if trade is valid
 */
export function validateTrade(
  symbol: string,
  price: number,
  volume: number,
  portfolioConfig: PortfolioConfig
): boolean {
  if (!ntCore) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(portfolioConfig)
  return ntCore.validateTrade(symbol, price, volume, configJson)
}

/**
 * Calculate Value at Risk (VaR) at a given confidence level
 * @param returns - Array of historical returns
 * @param confidenceLevel - Confidence level (0.0 to 1.0)
 * @returns Value at Risk
 */
export function calculateVaR(returns: number[], confidenceLevel: number): number {
  if (!ntCore) {
    throw new Error('Native module not available')
  }

  const returnsJson = JSON.stringify(returns)
  return ntCore.calculateVar(returnsJson, confidenceLevel)
}

/**
 * Optimize position sizing based on Kelly Criterion
 * @param winProbability - Probability of winning trade
 * @param winLossRatio - Ratio of average win to average loss
 * @returns Optimal fraction of capital to risk
 */
export function calculateKellyFraction(
  winProbability: number,
  winLossRatio: number
): number {
  if (!ntCore) {
    throw new Error('Native module not available')
  }

  return ntCore.calculateKellyFraction(winProbability, winLossRatio)
}

/**
 * Core class for NT operations
 */
export class NTCore {
  /**
   * Create a new NTCore instance
   */
  constructor() {
    if (!ntCore) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Calculate log return
   */
  logReturn(previousPrice: number, currentPrice: number): number {
    return calculateLogReturn(previousPrice, currentPrice)
  }

  /**
   * Calculate price change percentage
   */
  priceChange(previousPrice: number, currentPrice: number): number {
    return calculatePriceChange(previousPrice, currentPrice)
  }

  /**
   * Process a single trade
   */
  processTrade(tradeData: TradeData): ProcessedTradeData {
    return processTradeData(tradeData)
  }

  /**
   * Process multiple trades
   */
  processTrades(tradeDataArray: TradeData[]): ProcessedTradeData[] {
    return batchProcessTrades(tradeDataArray)
  }

  /**
   * Calculate moving average
   */
  movingAverage(prices: number[], window: number): number {
    return calculateMovingAverage(prices, window)
  }

  /**
   * Calculate portfolio metrics
   */
  portfolioMetrics(
    config: PortfolioConfig,
    trades: TradeData[]
  ): PortfolioMetrics {
    return calculatePortfolioMetrics(config, trades)
  }

  /**
   * Validate trade parameters
   */
  validateTrade(
    symbol: string,
    price: number,
    volume: number,
    config: PortfolioConfig
  ): boolean {
    return validateTrade(symbol, price, volume, config)
  }

  /**
   * Calculate Value at Risk
   */
  valueAtRisk(returns: number[], confidenceLevel: number): number {
    return calculateVaR(returns, confidenceLevel)
  }

  /**
   * Calculate Kelly Criterion
   */
  kellyCriterion(winProbability: number, winLossRatio: number): number {
    return calculateKellyFraction(winProbability, winLossRatio)
  }
}

/**
 * Error class for NT operations
 */
export class NTCoreError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message)
    this.name = 'NTCoreError'
  }
}

// Export all types and functions
export default {
  calculateLogReturn,
  calculatePriceChange,
  processTradeData,
  batchProcessTrades,
  calculateMovingAverage,
  calculatePortfolioMetrics,
  validateTrade,
  calculateVaR,
  calculateKellyFraction,
  NTCore,
  NTCoreError,
}
