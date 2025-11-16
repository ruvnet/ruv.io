// NT Backtesting Framework
// TypeScript bindings for the napi-rs module

export interface Trade {
  symbol: string
  entry_price: number
  exit_price: number
  quantity: number
  entry_time: number
  exit_time: number
  pnl: number
  return_pct: number
}

export interface HistoricalData {
  symbol: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface BacktestConfig {
  initial_capital: number
  commission_per_trade: number
  slippage_pct: number
  max_positions: number
  risk_per_trade: number
}

export interface PerformanceMetrics {
  total_return_pct: number
  sharpe_ratio: number
  max_drawdown_pct: number
  win_rate: number
  profit_factor: number
  cumulative_pnl: number
}

export interface BacktestResult {
  total_trades: number
  winning_trades: number
  losing_trades: number
  total_pnl: number
  total_return_pct: number
  sharpe_ratio: number
  max_drawdown_pct: number
  win_rate: number
  profit_factor: number
  trades: Trade[]
  final_capital: number
  timestamp: number
}

/**
 * Native bindings from nt_backtesting Rust module
 */
let ntBacktesting: any

try {
  // Load the native module via platform loader
  ntBacktesting = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_backtesting module not loaded. Build the project first.')
  ntBacktesting = null
}

/**
 * Execute a trade with commission and slippage
 * @param entryPrice - Entry price of the trade
 * @param exitPrice - Exit price of the trade
 * @param quantity - Number of units
 * @param commission - Commission per trade
 * @param slippagePct - Slippage percentage
 * @returns P&L from the trade
 */
export function executeTrade(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  commission: number,
  slippagePct: number
): number {
  if (!ntBacktesting) {
    throw new Error('Native module not available')
  }

  return ntBacktesting.executeTrade(
    entryPrice,
    exitPrice,
    quantity,
    commission,
    slippagePct
  )
}

/**
 * Calculate Sharpe ratio from returns
 * @param returns - Array of returns
 * @param riskFreeRate - Risk-free rate (annual)
 * @returns Sharpe ratio value
 */
export function calculateSharpeRatio(returns: number[], riskFreeRate: number): number {
  if (!ntBacktesting) {
    throw new Error('Native module not available')
  }

  return ntBacktesting.calculateSharpeRatio(JSON.stringify(returns), riskFreeRate)
}

/**
 * Calculate maximum drawdown percentage
 * @param equity - Array of equity values over time
 * @returns Maximum drawdown as percentage
 */
export function calculateMaxDrawdown(equity: number[]): number {
  if (!ntBacktesting) {
    throw new Error('Native module not available')
  }

  return ntBacktesting.calculateMaxDrawdown(JSON.stringify(equity))
}

/**
 * Calculate total return percentage
 * @param initialCapital - Starting capital
 * @param finalCapital - Ending capital
 * @returns Total return as percentage
 */
export function calculateReturnPct(initialCapital: number, finalCapital: number): number {
  if (!ntBacktesting) {
    throw new Error('Native module not available')
  }

  return ntBacktesting.calculateReturnPct(initialCapital, finalCapital)
}

/**
 * Process trades and calculate metrics
 * @param trades - Array of trades
 * @param initialCapital - Initial capital
 * @param riskFreeRate - Risk-free rate
 * @returns Backtest result with calculated metrics
 */
export function processTrades(
  trades: Trade[],
  initialCapital: number,
  riskFreeRate: number = 0.02
): BacktestResult {
  if (!ntBacktesting) {
    throw new Error('Native module not available')
  }

  const result = ntBacktesting.processTrades(
    JSON.stringify(trades),
    initialCapital,
    riskFreeRate
  )

  return JSON.parse(result)
}

/**
 * Analyze historical data for trading signals
 * @param data - Array of historical data
 * @param windowSize - Moving average window
 * @returns Array of signals
 */
export function analyzeHistoricalData(data: HistoricalData[], windowSize: number): any[] {
  if (!ntBacktesting) {
    throw new Error('Native module not available')
  }

  const result = ntBacktesting.analyzeHistoricalData(JSON.stringify(data), windowSize)

  return JSON.parse(result)
}

/**
 * Simulate strategy execution on historical data
 * @param config - Backtest configuration
 * @param data - Historical data
 * @param trades - Pre-planned trades
 * @returns Backtest results
 */
export function simulateStrategy(
  config: BacktestConfig,
  data: HistoricalData[],
  trades: Trade[]
): BacktestResult {
  if (!ntBacktesting) {
    throw new Error('Native module not available')
  }

  const result = ntBacktesting.simulateStrategy(
    JSON.stringify(config),
    JSON.stringify(data),
    JSON.stringify(trades)
  )

  return JSON.parse(result)
}

/**
 * Generate sample trade data for testing
 * @param count - Number of trades to generate
 * @param basePrice - Base price for trades
 * @param initialCapital - Initial capital for calculations
 * @returns Array of generated trades
 */
export function generateSampleTrades(
  count: number,
  basePrice: number,
  initialCapital: number
): Trade[] {
  if (!ntBacktesting) {
    throw new Error('Native module not available')
  }

  const result = ntBacktesting.generateSampleTrades(count, basePrice, initialCapital)

  return JSON.parse(result)
}

/**
 * BacktestEngine class for managing strategy backtests
 */
export class BacktestEngine {
  private config: BacktestConfig
  private historicalData: HistoricalData[]
  private trades: Trade[]

  /**
   * Create a new BacktestEngine instance
   * @param config - Backtest configuration
   */
  constructor(config: BacktestConfig) {
    if (!ntBacktesting) {
      throw new Error('Native module not available')
    }
    this.config = config
    this.historicalData = []
    this.trades = []
  }

  /**
   * Add historical data to the engine
   * @param data - Array of historical data
   */
  addHistoricalData(data: HistoricalData[]): void {
    this.historicalData = [...this.historicalData, ...data]
  }

  /**
   * Clear historical data
   */
  clearHistoricalData(): void {
    this.historicalData = []
  }

  /**
   * Add a trade to the backtest
   * @param trade - Trade to add
   */
  addTrade(trade: Trade): void {
    this.trades.push(trade)
  }

  /**
   * Clear all trades
   */
  clearTrades(): void {
    this.trades = []
  }

  /**
   * Get current trades
   * @returns Array of trades
   */
  getTrades(): Trade[] {
    return this.trades
  }

  /**
   * Get historical data
   * @returns Array of historical data
   */
  getHistoricalData(): HistoricalData[] {
    return this.historicalData
  }

  /**
   * Get configuration
   * @returns Backtest configuration
   */
  getConfig(): BacktestConfig {
    return this.config
  }

  /**
   * Execute a single trade
   * @param entryPrice - Entry price
   * @param exitPrice - Exit price
   * @param quantity - Quantity
   * @returns P&L from the trade
   */
  executeTrade(entryPrice: number, exitPrice: number, quantity: number): number {
    return executeTrade(
      entryPrice,
      exitPrice,
      quantity,
      this.config.commission_per_trade,
      this.config.slippage_pct
    )
  }

  /**
   * Analyze historical data for signals
   * @param windowSize - Moving average window
   * @returns Array of signals
   */
  analyzeData(windowSize: number = 20): any[] {
    return analyzeHistoricalData(this.historicalData, windowSize)
  }

  /**
   * Run the backtest
   * @returns Backtest results
   */
  run(): BacktestResult {
    return simulateStrategy(this.config, this.historicalData, this.trades)
  }

  /**
   * Process trades and get metrics
   * @returns Backtest result with metrics
   */
  processResults(): BacktestResult {
    return processTrades(this.trades, this.config.initial_capital)
  }

  /**
   * Get performance metrics
   * @returns Performance metrics object
   */
  getMetrics(): PerformanceMetrics {
    const result = this.processResults()
    return {
      total_return_pct: result.total_return_pct,
      sharpe_ratio: result.sharpe_ratio,
      max_drawdown_pct: result.max_drawdown_pct,
      win_rate: result.win_rate,
      profit_factor: result.profit_factor,
      cumulative_pnl: result.total_pnl,
    }
  }
}

// Export all types and functions
export default {
  executeTrade,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateReturnPct,
  processTrades,
  analyzeHistoricalData,
  simulateStrategy,
  generateSampleTrades,
  BacktestEngine,
}
