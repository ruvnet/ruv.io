import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  BacktestEngine,
  executeTrade,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateReturnPct,
  processTrades,
  analyzeHistoricalData,
  simulateStrategy,
  generateSampleTrades,
  Trade,
  HistoricalData,
  BacktestConfig,
  BacktestResult,
  PerformanceMetrics,
} from '../src/index'

describe('NT Backtesting Framework', () => {
  const defaultConfig: BacktestConfig = {
    initial_capital: 100000,
    commission_per_trade: 10,
    slippage_pct: 0.1,
    max_positions: 10,
    risk_per_trade: 0.02,
  }

  const sampleTrade: Trade = {
    symbol: 'AAPL',
    entry_price: 100,
    exit_price: 110,
    quantity: 10,
    entry_time: 1000000,
    exit_time: 1001000,
    pnl: 0,
    return_pct: 0,
  }

  const sampleHistoricalData: HistoricalData = {
    symbol: 'AAPL',
    timestamp: 1000000,
    open: 100,
    high: 102,
    low: 99,
    close: 101,
    volume: 1000000,
  }

  describe('Trade Execution', () => {
    // Test 1: Basic trade execution
    it('should execute a simple trade with profit', () => {
      const pnl = executeTrade(100, 110, 10, 0, 0)
      expect(pnl).toBe(100) // (110-100) * 10 = 100
    })

    // Test 2: Trade execution with loss
    it('should execute a trade with loss', () => {
      const pnl = executeTrade(110, 100, 10, 0, 0)
      expect(pnl).toBe(-100) // (100-110) * 10 = -100
    })

    // Test 3: Trade execution with commission
    it('should apply commission to trade P&L', () => {
      const pnl = executeTrade(100, 110, 10, 50, 0)
      expect(pnl).toBe(50) // 100 - 50 commission = 50
    })

    // Test 4: Trade execution with slippage
    it('should apply slippage to exit price', () => {
      const pnl = executeTrade(100, 110, 10, 0, 1)
      expect(pnl).toBeCloseTo(111, 0) // (110 * 1.01 - 100) * 10 = 111
    })

    // Test 5: Trade execution with both commission and slippage
    it('should apply both commission and slippage', () => {
      const pnl = executeTrade(100, 110, 10, 10, 0.5)
      expect(pnl).toBeGreaterThan(0)
      expect(pnl).toBeLessThan(100)
    })

    // Test 6: Break-even trade
    it('should handle break-even trades', () => {
      const pnl = executeTrade(100, 100, 10, 0, 0)
      expect(pnl).toBe(0)
    })

    // Test 7: Large quantity trade
    it('should handle large quantity trades', () => {
      const pnl = executeTrade(100, 110, 1000, 100, 0)
      expect(pnl).toBe(9900) // (110-100) * 1000 - 100 = 9900
    })

    // Test 8: Fractional prices
    it('should handle fractional prices correctly', () => {
      const pnl = executeTrade(100.5, 110.5, 10, 0, 0)
      expect(pnl).toBe(100) // (110.5-100.5) * 10 = 100
    })

    // Test 9: Invalid entry price
    it('should reject negative entry price', () => {
      expect(() => executeTrade(-100, 110, 10, 0, 0)).toThrow()
    })

    // Test 10: Invalid quantity
    it('should reject zero quantity', () => {
      expect(() => executeTrade(100, 110, 0, 0, 0)).toThrow()
    })
  })

  describe('Performance Metrics - Sharpe Ratio', () => {
    // Test 11: Sharpe ratio calculation
    it('should calculate Sharpe ratio from returns', () => {
      const returns = [0.01, 0.02, -0.01, 0.03, 0.02]
      const sharpeRatio = calculateSharpeRatio(returns, 0.02)
      expect(sharpeRatio).toBeDefined()
      expect(typeof sharpeRatio).toBe('number')
    })

    // Test 12: Empty returns array
    it('should handle empty returns array', () => {
      const sharpeRatio = calculateSharpeRatio([], 0.02)
      expect(sharpeRatio).toBe(0)
    })

    // Test 13: Single return value
    it('should handle single return value', () => {
      const sharpeRatio = calculateSharpeRatio([0.01], 0.02)
      expect(sharpeRatio).toBeDefined()
    })

    // Test 14: Constant returns (zero std dev)
    it('should handle constant returns (zero std dev)', () => {
      const sharpeRatio = calculateSharpeRatio([0.01, 0.01, 0.01], 0.02)
      expect(sharpeRatio).toBe(0)
    })

    // Test 15: High volatility returns
    it('should calculate Sharpe ratio for volatile returns', () => {
      const returns = [0.1, -0.05, 0.15, -0.08, 0.12]
      const sharpeRatio = calculateSharpeRatio(returns, 0.02)
      expect(sharpeRatio).toBeDefined()
    })
  })

  describe('Performance Metrics - Max Drawdown', () => {
    // Test 16: Max drawdown calculation
    it('should calculate max drawdown', () => {
      const equity = [100, 105, 110, 100, 95, 105, 115]
      const maxDrawdown = calculateMaxDrawdown(equity)
      expect(maxDrawdown).toBeGreaterThan(0)
      expect(maxDrawdown).toBeLessThanOrEqual(100)
    })

    // Test 17: No drawdown scenario
    it('should return 0 for increasing equity', () => {
      const equity = [100, 101, 102, 103, 104, 105]
      const maxDrawdown = calculateMaxDrawdown(equity)
      expect(maxDrawdown).toBe(0)
    })

    // Test 18: Single value equity
    it('should handle single value equity', () => {
      const maxDrawdown = calculateMaxDrawdown([100])
      expect(maxDrawdown).toBe(0)
    })

    // Test 19: Significant drawdown
    it('should detect significant drawdown', () => {
      const equity = [100, 100, 50, 75, 80]
      const maxDrawdown = calculateMaxDrawdown(equity)
      expect(maxDrawdown).toBeGreaterThan(40)
    })

    // Test 20: Empty equity array
    it('should handle empty equity array', () => {
      const maxDrawdown = calculateMaxDrawdown([])
      expect(maxDrawdown).toBe(0)
    })
  })

  describe('Performance Metrics - Return Calculation', () => {
    // Test 21: Positive return
    it('should calculate positive return percentage', () => {
      const returnPct = calculateReturnPct(100000, 150000)
      expect(returnPct).toBe(50)
    })

    // Test 22: Negative return
    it('should calculate negative return percentage', () => {
      const returnPct = calculateReturnPct(100000, 80000)
      expect(returnPct).toBe(-20)
    })

    // Test 23: No return
    it('should calculate zero return', () => {
      const returnPct = calculateReturnPct(100000, 100000)
      expect(returnPct).toBe(0)
    })

    // Test 24: Fractional return
    it('should calculate fractional return', () => {
      const returnPct = calculateReturnPct(100000, 105000)
      expect(returnPct).toBe(5)
    })
  })

  describe('Trade Processing', () => {
    // Test 25: Process single trade
    it('should process a single trade', () => {
      const trade: Trade = {
        symbol: 'AAPL',
        entry_price: 100,
        exit_price: 110,
        quantity: 10,
        entry_time: 1000000,
        exit_time: 1001000,
        pnl: 100,
        return_pct: 10,
      }
      const result = processTrades([trade], 100000)
      expect(result.total_trades).toBe(1)
      expect(result.winning_trades).toBe(1)
      expect(result.losing_trades).toBe(0)
    })

    // Test 26: Process multiple trades
    it('should process multiple trades', () => {
      const trades: Trade[] = Array.from({ length: 10 }, (_, i) => ({
        symbol: 'AAPL',
        entry_price: 100,
        exit_price: 100 + (i % 2 === 0 ? 10 : -10),
        quantity: 10,
        entry_time: 1000000 + i * 1000,
        exit_time: 1001000 + i * 1000,
        pnl: i % 2 === 0 ? 100 : -100,
        return_pct: i % 2 === 0 ? 10 : -10,
      }))
      const result = processTrades(trades, 100000)
      expect(result.total_trades).toBe(10)
      expect(result.winning_trades).toBe(5)
      expect(result.losing_trades).toBe(5)
    })

    // Test 27: Empty trades array
    it('should handle empty trades array', () => {
      const result = processTrades([], 100000)
      expect(result.total_trades).toBe(0)
      expect(result.total_pnl).toBe(0)
    })

    // Test 28: Win rate calculation
    it('should calculate correct win rate', () => {
      const trades: Trade[] = [
        { ...sampleTrade, pnl: 100, return_pct: 10 },
        { ...sampleTrade, pnl: -50, return_pct: -5 },
        { ...sampleTrade, pnl: 200, return_pct: 20 },
      ]
      const result = processTrades(trades, 100000)
      expect(result.win_rate).toBeCloseTo(66.67, 1)
    })

    // Test 29: Profit factor calculation
    it('should calculate profit factor', () => {
      const trades: Trade[] = [
        { ...sampleTrade, pnl: 100, return_pct: 10 },
        { ...sampleTrade, pnl: -50, return_pct: -5 },
      ]
      const result = processTrades(trades, 100000)
      expect(result.profit_factor).toBeCloseTo(2, 1)
    })

    // Test 30: Total P&L calculation
    it('should calculate total P&L', () => {
      const trades: Trade[] = [
        { ...sampleTrade, pnl: 100, return_pct: 10 },
        { ...sampleTrade, pnl: 200, return_pct: 20 },
      ]
      const result = processTrades(trades, 100000)
      expect(result.total_pnl).toBe(300)
    })
  })

  describe('Historical Data Analysis', () => {
    // Test 31: Analyze historical data
    it('should analyze historical data for signals', () => {
      const data: HistoricalData[] = Array.from({ length: 10 }, (_, i) => ({
        symbol: 'AAPL',
        timestamp: 1000000 + i * 1000,
        open: 100 + i,
        high: 102 + i,
        low: 99 + i,
        close: 101 + i,
        volume: 1000000,
      }))
      const signals = analyzeHistoricalData(data, 3)
      expect(signals.length).toBeGreaterThan(0)
    })

    // Test 32: Signal generation with price jumps
    it('should generate trading signals with price movements', () => {
      const data: HistoricalData[] = [
        { symbol: 'AAPL', timestamp: 1000000, open: 100, high: 100, low: 100, close: 100, volume: 1000000 },
        { symbol: 'AAPL', timestamp: 1001000, open: 100, high: 100, low: 100, close: 101, volume: 1000000 },
        { symbol: 'AAPL', timestamp: 1002000, open: 101, high: 101, low: 101, close: 102, volume: 1000000 },
        { symbol: 'AAPL', timestamp: 1003000, open: 102, high: 102, low: 102, close: 103, volume: 1000000 },
      ]
      const signals = analyzeHistoricalData(data, 2)
      expect(signals.length).toBeGreaterThan(0)
      // Verify each signal has required fields
      signals.forEach((s: any) => {
        expect(s.timestamp).toBeDefined()
        expect(s.symbol).toBeDefined()
        expect(s.signal).toBeDefined()
        expect(['BUY', 'SELL']).toContain(s.signal)
      })
    })

    // Test 33: Sell signal detection
    it('should generate sell signals when price < MA', () => {
      const data: HistoricalData[] = Array.from({ length: 10 }, (_, i) => ({
        symbol: 'AAPL',
        timestamp: 1000000 + i * 1000,
        open: 100,
        high: 100,
        low: 100,
        close: 100 - i * 5,
        volume: 1000000,
      }))
      const signals = analyzeHistoricalData(data, 3)
      expect(signals.length).toBeGreaterThan(0)
    })

    // Test 34: Small window size
    it('should handle small window size', () => {
      const data: HistoricalData[] = Array.from({ length: 5 }, (_, i) => ({
        ...sampleHistoricalData,
        timestamp: 1000000 + i * 1000,
      }))
      const signals = analyzeHistoricalData(data, 1)
      expect(signals.length).toBeGreaterThan(0)
    })
  })

  describe('Strategy Simulation', () => {
    // Test 35: Simulate simple strategy
    it('should simulate a simple strategy', () => {
      const trades: Trade[] = [
        { ...sampleTrade, pnl: 100, return_pct: 10 },
      ]
      const data: HistoricalData[] = [sampleHistoricalData]
      const result = simulateStrategy(defaultConfig, data, trades)
      expect(result.total_trades).toBe(1)
      expect(result.total_pnl).toBeGreaterThan(0)
    })

    // Test 36: Simulate multiple trades strategy
    it('should simulate strategy with multiple trades', () => {
      const trades: Trade[] = Array.from({ length: 20 }, (_, i) => ({
        ...sampleTrade,
        entry_time: 1000000 + i * 1000,
        exit_time: 1001000 + i * 1000,
        pnl: i % 2 === 0 ? 100 : -50,
        return_pct: i % 2 === 0 ? 10 : -5,
      }))
      const data: HistoricalData[] = Array.from({ length: 20 }, (_, i) => ({
        ...sampleHistoricalData,
        timestamp: 1000000 + i * 1000,
      }))
      const result = simulateStrategy(defaultConfig, data, trades)
      expect(result.total_trades).toBe(20)
      expect(result.final_capital).toBeDefined()
    })

    // Test 37: Strategy with no trades
    it('should handle strategy with no trades', () => {
      const data: HistoricalData[] = [sampleHistoricalData]
      const result = simulateStrategy(defaultConfig, data, [])
      expect(result.total_trades).toBe(0)
      expect(result.final_capital).toBe(defaultConfig.initial_capital)
    })

    // Test 38: Strategy with losing trades
    it('should calculate metrics for losing strategy', () => {
      const trades: Trade[] = Array.from({ length: 5 }, (_, i) => ({
        symbol: 'AAPL',
        entry_price: 100,
        exit_price: 80,
        quantity: 10,
        entry_time: 1000000 + i * 1000,
        exit_time: 1001000 + i * 1000,
        pnl: -200,
        return_pct: -20,
      }))
      const data: HistoricalData[] = []
      const result = simulateStrategy(defaultConfig, data, trades)
      expect(result.total_pnl).toBeLessThan(0)
      expect(result.final_capital).toBeLessThan(defaultConfig.initial_capital)
    })
  })

  describe('Sample Trade Generation', () => {
    // Test 39: Generate sample trades
    it('should generate sample trades', () => {
      const trades = generateSampleTrades(10, 100, 100000)
      expect(trades).toHaveLength(10)
      expect(trades[0].symbol).toBeDefined()
      expect(trades[0].entry_price).toBeGreaterThan(0)
    })

    // Test 40: Generate trades with different base price
    it('should generate trades with correct base price', () => {
      const trades = generateSampleTrades(5, 50, 100000)
      expect(trades).toHaveLength(5)
      expect(trades[0].entry_price).toBeCloseTo(50, 1)
    })

    // Test 41: Generate different quantities
    it('should generate trades with reasonable quantities', () => {
      const trades = generateSampleTrades(10, 100, 100000)
      trades.forEach((trade) => {
        expect(trade.quantity).toBeGreaterThan(0)
        expect(trade.quantity).toBeLessThanOrEqual(1000)
      })
    })

    // Test 42: Single trade generation
    it('should generate single trade', () => {
      const trades = generateSampleTrades(1, 100, 100000)
      expect(trades).toHaveLength(1)
    })

    // Test 43: Large trade generation
    it('should generate large number of trades', () => {
      const trades = generateSampleTrades(100, 100, 100000)
      expect(trades).toHaveLength(100)
    })
  })

  describe('BacktestEngine Class', () => {
    // Test 44: Create engine instance
    it('should create a BacktestEngine instance', () => {
      const engine = new BacktestEngine(defaultConfig)
      expect(engine).toBeDefined()
      expect(engine.getConfig()).toEqual(defaultConfig)
    })

    // Test 45: Engine trade management
    it('should manage trades in engine', () => {
      const engine = new BacktestEngine(defaultConfig)
      engine.addTrade(sampleTrade)
      expect(engine.getTrades()).toHaveLength(1)
      engine.clearTrades()
      expect(engine.getTrades()).toHaveLength(0)
    })

    // Test 46: Engine data management
    it('should manage historical data in engine', () => {
      const engine = new BacktestEngine(defaultConfig)
      engine.addHistoricalData([sampleHistoricalData])
      expect(engine.getHistoricalData()).toHaveLength(1)
      engine.clearHistoricalData()
      expect(engine.getHistoricalData()).toHaveLength(0)
    })

    // Test 47: Engine execute trade
    it('should execute trade through engine', () => {
      const engine = new BacktestEngine(defaultConfig)
      const pnl = engine.executeTrade(100, 110, 10)
      expect(pnl).toBeCloseTo(91.1, 1) // (110 * 1.001 - 100) * 10 - 10 commission ≈ 91.1
    })

    // Test 48: Engine run backtest
    it('should run backtest through engine', () => {
      const engine = new BacktestEngine(defaultConfig)
      const trade: Trade = {
        ...sampleTrade,
        pnl: 100,
        return_pct: 10,
      }
      engine.addTrade(trade)
      engine.addHistoricalData([sampleHistoricalData])
      const result = engine.run()
      expect(result).toBeDefined()
      expect(result.total_trades).toBe(1)
    })
  })

  describe('Integration Tests', () => {
    // Test 49: Full workflow
    it('should complete full backtesting workflow', () => {
      const engine = new BacktestEngine(defaultConfig)

      // Add historical data
      const historicalData = Array.from({ length: 20 }, (_, i) => ({
        ...sampleHistoricalData,
        timestamp: 1000000 + i * 1000,
        close: 100 + i * 0.5,
      }))
      engine.addHistoricalData(historicalData)

      // Analyze data
      const signals = engine.analyzeData(5)
      expect(signals.length).toBeGreaterThan(0)

      // Generate trades
      const trades = generateSampleTrades(15, 100, defaultConfig.initial_capital)
      trades.forEach((trade) => engine.addTrade(trade))

      // Run backtest
      const result = engine.run()
      expect(result.total_trades).toBe(15)
      expect(result.metrics !== undefined)
    })

    // Test 50: Get metrics from engine
    it('should get performance metrics from engine', () => {
      const engine = new BacktestEngine(defaultConfig)
      const trades = generateSampleTrades(10, 100, defaultConfig.initial_capital)
      trades.forEach((trade) => engine.addTrade(trade))

      const metrics = engine.getMetrics()
      expect(metrics.total_return_pct).toBeDefined()
      expect(metrics.sharpe_ratio).toBeDefined()
      expect(metrics.max_drawdown_pct).toBeDefined()
      expect(metrics.win_rate).toBeDefined()
      expect(metrics.profit_factor).toBeDefined()
    })
  })
})
