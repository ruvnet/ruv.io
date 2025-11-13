import { describe, it, expect, beforeAll } from 'vitest'
import {
  NTCore,
  NTCoreError,
  calculateLogReturn,
  calculatePriceChange,
  processTradeData,
  batchProcessTrades,
  calculateMovingAverage,
  calculatePortfolioMetrics,
  validateTrade,
  calculateVaR,
  calculateKellyFraction,
  TradeData,
  PortfolioConfig,
  ProcessedTradeData,
  PortfolioMetrics,
} from '../src/index'

describe('NT-Core - Neural Trader Core Library', () => {
  const sampleTrade: TradeData = {
    symbol: 'AAPL',
    price: 150.0,
    volume: 100,
    timestamp: 1699900000000,
    metadata: {
      source: 'test',
      exchange: 'NASDAQ',
    },
  }

  const sampleTrade2: TradeData = {
    symbol: 'GOOGL',
    price: 140.0,
    volume: 50,
    timestamp: 1699900001000,
    metadata: {
      source: 'test',
      exchange: 'NASDAQ',
    },
  }

  const samplePortfolioConfig: PortfolioConfig = {
    initial_capital: 100000,
    max_positions: 20,
    risk_per_trade: 0.02,
    trading_hours_start: 930,
    trading_hours_end: 1600,
  }

  describe('calculateLogReturn', () => {
    it('should calculate log return correctly', () => {
      const result = calculateLogReturn(100.0, 110.0)
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(0.11)
    })

    it('should handle equal prices', () => {
      const result = calculateLogReturn(100.0, 100.0)
      expect(result).toBe(0)
    })

    it('should handle price increase', () => {
      const result = calculateLogReturn(100.0, 150.0)
      expect(result).toBeGreaterThan(0)
    })

    it('should handle price decrease', () => {
      const result = calculateLogReturn(150.0, 100.0)
      expect(result).toBeLessThan(0)
    })

    it('should throw on invalid prices', () => {
      expect(() => calculateLogReturn(-100.0, 110.0)).toThrow()
      expect(() => calculateLogReturn(100.0, 0)).toThrow()
      expect(() => calculateLogReturn(0, 110.0)).toThrow()
    })
  })

  describe('calculatePriceChange', () => {
    it('should calculate price change percentage correctly', () => {
      const result = calculatePriceChange(100.0, 110.0)
      expect(result).toBe(10.0)
    })

    it('should handle price decrease', () => {
      const result = calculatePriceChange(110.0, 100.0)
      expect(result).toBeCloseTo(-9.09, 1)
    })

    it('should handle zero initial price error', () => {
      expect(() => calculatePriceChange(0.0, 110.0)).toThrow()
    })

    it('should handle large price changes', () => {
      const result = calculatePriceChange(100.0, 250.0)
      expect(result).toBe(150.0)
    })
  })

  describe('processTradeData', () => {
    it('should process trade data correctly', () => {
      const result = processTradeData(sampleTrade)

      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL')
      expect(result.price).toBe(150.0)
      expect(result.volume).toBe(100)
      expect(result.log_return).toBeGreaterThan(0)
      expect(result.processing_timestamp).toBeGreaterThan(0)
    })

    it('should preserve metadata', () => {
      const result = processTradeData(sampleTrade)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.source).toBe('test')
      expect(result.metadata.exchange).toBe('NASDAQ')
    })

    it('should handle multiple trades independently', () => {
      const result1 = processTradeData(sampleTrade)
      const result2 = processTradeData(sampleTrade2)

      expect(result1.symbol).toBe('AAPL')
      expect(result2.symbol).toBe('GOOGL')
      expect(result1.log_return).not.toBe(result2.log_return)
    })
  })

  describe('batchProcessTrades', () => {
    it('should batch process multiple trades', () => {
      const trades = [sampleTrade, sampleTrade2]
      const results = batchProcessTrades(trades)

      expect(results).toHaveLength(2)
      expect(results[0].symbol).toBe('AAPL')
      expect(results[1].symbol).toBe('GOOGL')
    })

    it('should process each trade independently', () => {
      const trades = [sampleTrade, sampleTrade2]
      const results = batchProcessTrades(trades)

      results.forEach((result, idx) => {
        expect(result.symbol).toBe(trades[idx].symbol)
        expect(result.price).toBe(trades[idx].price)
        expect(result.volume).toBe(trades[idx].volume)
      })
    })

    it('should handle empty array', () => {
      const results = batchProcessTrades([])
      expect(results).toHaveLength(0)
    })

    it('should handle large batch', () => {
      const trades = Array.from({ length: 50 }, (_, i) => ({
        symbol: `SYM${i}`,
        price: 100.0 + i,
        volume: 100 * (i + 1),
        timestamp: 1699900000000 + i * 1000,
        metadata: { index: i },
      }))

      const results = batchProcessTrades(trades)
      expect(results).toHaveLength(50)
    })
  })

  describe('calculateMovingAverage', () => {
    it('should calculate moving average correctly', () => {
      const prices = [100, 102, 104, 106, 108, 110]
      const ma = calculateMovingAverage(prices, 3)

      expect(typeof ma).toBe('number')
      expect(ma).toBeGreaterThan(0)
      // MA of last 3: (106 + 108 + 110) / 3 = 108
      expect(ma).toBeCloseTo(108, 0)
    })

    it('should handle window of 1', () => {
      const prices = [100, 102, 104, 106]
      const ma = calculateMovingAverage(prices, 1)
      expect(ma).toBe(106) // Last price
    })

    it('should handle window equal to array length', () => {
      const prices = [100, 102, 104]
      const ma = calculateMovingAverage(prices, 3)
      expect(ma).toBeCloseTo(102, 0) // Average of all
    })

    it('should throw on invalid window', () => {
      const prices = [100, 102, 104]
      expect(() => calculateMovingAverage(prices, 0)).toThrow()
      expect(() => calculateMovingAverage(prices, 5)).toThrow()
      expect(() => calculateMovingAverage([], 1)).toThrow()
    })
  })

  describe('calculatePortfolioMetrics', () => {
    it('should calculate portfolio metrics', () => {
      const trades = [sampleTrade, sampleTrade2]
      const metrics = calculatePortfolioMetrics(samplePortfolioConfig, trades)

      expect(metrics).toBeDefined()
      expect(metrics.total_value).toBeGreaterThan(0)
      expect(metrics.cash_available).toBeGreaterThan(0)
      expect(metrics.total_positions).toBe(2)
      expect(metrics.sharpe_ratio).toBeGreaterThan(0)
      expect(metrics.win_rate).toBeGreaterThan(0)
      expect(metrics.timestamp).toBeGreaterThan(0)
    })

    it('should handle empty trades array', () => {
      const metrics = calculatePortfolioMetrics(samplePortfolioConfig, [])

      expect(metrics).toBeDefined()
      expect(metrics.total_positions).toBe(0)
    })

    it('should respect portfolio config', () => {
      const customConfig: PortfolioConfig = {
        initial_capital: 50000,
        max_positions: 10,
        risk_per_trade: 0.05,
      }

      const trades = [sampleTrade]
      const metrics = calculatePortfolioMetrics(customConfig, trades)

      expect(metrics.total_value).toBeGreaterThan(customConfig.initial_capital)
    })
  })

  describe('validateTrade', () => {
    it('should validate good trade', () => {
      const result = validateTrade('AAPL', 150.0, 100, samplePortfolioConfig)
      expect(typeof result).toBe('boolean')
      expect(result).toBe(true)
    })

    it('should reject empty symbol', () => {
      expect(() =>
        validateTrade('', 150.0, 100, samplePortfolioConfig)
      ).toThrow()
    })

    it('should reject negative price', () => {
      expect(() =>
        validateTrade('AAPL', -150.0, 100, samplePortfolioConfig)
      ).toThrow()
    })

    it('should reject zero volume', () => {
      expect(() =>
        validateTrade('AAPL', 150.0, 0, samplePortfolioConfig)
      ).toThrow()
    })

    it('should validate against risk limits', () => {
      const smallRiskConfig: PortfolioConfig = {
        initial_capital: 1000,
        risk_per_trade: 0.01,
      }

      const result = validateTrade('AAPL', 150.0, 1, smallRiskConfig)
      expect(typeof result).toBe('boolean')
    })
  })

  describe('calculateVaR', () => {
    it('should calculate Value at Risk', () => {
      const returns = [-0.05, -0.03, -0.01, 0.01, 0.03, 0.05, 0.02, -0.02]
      const var95 = calculateVaR(returns, 0.95)

      expect(typeof var95).toBe('number')
      expect(var95).toBeLessThan(0)
    })

    it('should handle different confidence levels', () => {
      const returns = [-0.1, -0.05, -0.01, 0.01, 0.05, 0.1]

      const var90 = calculateVaR(returns, 0.90)
      const var95 = calculateVaR(returns, 0.95)

      // Higher confidence should have more extreme value
      expect(var95).toBeLessThanOrEqual(var90)
    })

    it('should throw on invalid confidence level', () => {
      const returns = [0.01, 0.02, 0.03]
      expect(() => calculateVaR(returns, 0)).toThrow()
      expect(() => calculateVaR(returns, 1)).toThrow()
      expect(() => calculateVaR(returns, -0.1)).toThrow()
    })

    it('should throw on empty returns', () => {
      expect(() => calculateVaR([], 0.95)).toThrow()
    })
  })

  describe('calculateKellyFraction', () => {
    it('should calculate Kelly fraction', () => {
      const kelly = calculateKellyFraction(0.6, 2.0)

      expect(typeof kelly).toBe('number')
      expect(kelly).toBeGreaterThanOrEqual(0)
      expect(kelly).toBeLessThanOrEqual(0.25)
    })

    it('should return zero for break-even', () => {
      const kelly = calculateKellyFraction(0.5, 1.0)
      expect(kelly).toBe(0)
    })

    it('should handle favorable odds', () => {
      const kelly = calculateKellyFraction(0.7, 3.0)
      expect(kelly).toBeGreaterThan(0)
    })

    it('should throw on invalid win probability', () => {
      expect(() => calculateKellyFraction(0, 2.0)).toThrow()
      expect(() => calculateKellyFraction(1, 2.0)).toThrow()
      expect(() => calculateKellyFraction(-0.1, 2.0)).toThrow()
    })

    it('should throw on invalid win/loss ratio', () => {
      expect(() => calculateKellyFraction(0.6, 0)).toThrow()
      expect(() => calculateKellyFraction(0.6, -1)).toThrow()
    })

    it('should cap at conservative maximum', () => {
      // Even with very favorable odds, should cap at 0.25
      const kelly = calculateKellyFraction(0.99, 100.0)
      expect(kelly).toBeLessThanOrEqual(0.25)
    })
  })

  describe('NTCore class', () => {
    let ntCore: NTCore

    beforeAll(() => {
      ntCore = new NTCore()
    })

    it('should create instance', () => {
      expect(ntCore).toBeDefined()
      expect(ntCore).toBeInstanceOf(NTCore)
    })

    it('should calculate log return via instance method', () => {
      const result = ntCore.logReturn(100.0, 110.0)
      expect(result).toBeGreaterThan(0)
    })

    it('should calculate price change via instance method', () => {
      const result = ntCore.priceChange(100.0, 110.0)
      expect(result).toBe(10.0)
    })

    it('should process trade via instance method', () => {
      const result = ntCore.processTrade(sampleTrade)
      expect(result).toBeDefined()
      expect(result.symbol).toBe('AAPL')
    })

    it('should process multiple trades via instance method', () => {
      const trades = [sampleTrade, sampleTrade2]
      const results = ntCore.processTrades(trades)
      expect(results).toHaveLength(2)
    })

    it('should calculate moving average via instance method', () => {
      const prices = [100, 102, 104, 106, 108, 110]
      const ma = ntCore.movingAverage(prices, 3)
      expect(ma).toBeGreaterThan(0)
    })

    it('should calculate portfolio metrics via instance method', () => {
      const metrics = ntCore.portfolioMetrics(samplePortfolioConfig, [sampleTrade])
      expect(metrics).toBeDefined()
      expect(metrics.total_value).toBeGreaterThan(0)
    })

    it('should validate trade via instance method', () => {
      const result = ntCore.validateTrade('AAPL', 150.0, 100, samplePortfolioConfig)
      expect(typeof result).toBe('boolean')
    })

    it('should calculate VaR via instance method', () => {
      const returns = [-0.05, -0.03, -0.01, 0.01, 0.03, 0.05]
      const var95 = ntCore.valueAtRisk(returns, 0.95)
      expect(var95).toBeLessThan(0)
    })

    it('should calculate Kelly fraction via instance method', () => {
      const kelly = ntCore.kellyCriterion(0.6, 2.0)
      expect(kelly).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Integration tests', () => {
    it('should handle complete trading workflow', () => {
      // Process trades
      const trades = [sampleTrade, sampleTrade2]
      const processed = batchProcessTrades(trades)
      expect(processed).toHaveLength(2)

      // Calculate metrics
      const metrics = calculatePortfolioMetrics(samplePortfolioConfig, trades)
      expect(metrics.total_positions).toBe(2)

      // Validate new trade
      const isValid = validateTrade('MSFT', 320.0, 30, samplePortfolioConfig)
      expect(typeof isValid).toBe('boolean')
    })

    it('should combine multiple calculations', () => {
      // Process individual trades
      const trade1 = processTradeData(sampleTrade)
      const trade2 = processTradeData(sampleTrade2)

      // Calculate metrics on original trades
      const metrics = calculatePortfolioMetrics(samplePortfolioConfig, [sampleTrade, sampleTrade2])

      // Validate new trade with metrics context
      const isValid = validateTrade('TSLA', 250.0, 40, samplePortfolioConfig)

      expect(trade1).toBeDefined()
      expect(trade2).toBeDefined()
      expect(metrics.total_positions).toBe(2)
      expect(typeof isValid).toBe('boolean')
    })

    it('should handle risk management workflow', () => {
      // Historical returns
      const returns = [0.02, -0.01, 0.03, -0.02, 0.01, 0.04, -0.03, 0.02]

      // Calculate risk metrics
      const var95 = calculateVaR(returns, 0.95)
      expect(var95).toBeLessThan(0)

      // Calculate position sizing
      const kelly = calculateKellyFraction(0.65, 1.5)
      expect(kelly).toBeGreaterThan(0)

      // Validate position within risk constraints
      const isValid = validateTrade('AAPL', 150.0, 100, samplePortfolioConfig)
      expect(typeof isValid).toBe('boolean')
    })

    it('should handle portfolio monitoring', () => {
      const trades = [sampleTrade, sampleTrade2]

      // Calculate initial metrics
      const metrics1 = calculatePortfolioMetrics(samplePortfolioConfig, trades)

      // Add more trades
      const moreTrades = [
        sampleTrade,
        sampleTrade2,
        {
          symbol: 'MSFT',
          price: 320.0,
          volume: 50,
          timestamp: 1699900002000,
          metadata: {},
        },
      ]

      // Recalculate metrics
      const metrics2 = calculatePortfolioMetrics(samplePortfolioConfig, moreTrades)

      expect(metrics2.total_positions).toBeGreaterThan(metrics1.total_positions)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid trade data gracefully', () => {
      expect(() => {
        processTradeData({ symbol: '', price: 0, volume: 0, timestamp: 0 })
      }).not.toThrow() // Processing itself shouldn't throw, validation happens in validate
    })

    it('should handle large price movements', () => {
      const result = calculatePriceChange(100.0, 1000000.0)
      expect(result).toBe(999900.0)
    })

    it('should handle very small prices', () => {
      const result = calculateLogReturn(0.001, 0.002)
      expect(result).toBeGreaterThan(0)
    })

    it('should handle processing of large datasets', () => {
      const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
        symbol: `SYM${i % 100}`,
        price: 100.0 + (i % 50),
        volume: 100 * (i % 10 + 1),
        timestamp: 1699900000000 + i * 1000,
        metadata: { index: i },
      }))

      const results = batchProcessTrades(largeBatch)
      expect(results).toHaveLength(1000)
    })
  })

  describe('Edge cases', () => {
    it('should handle single price for moving average', () => {
      const ma = calculateMovingAverage([100.0], 1)
      expect(ma).toBe(100.0)
    })

    it('should handle uniform prices', () => {
      const uniform = [100.0, 100.0, 100.0, 100.0, 100.0]
      const ma = calculateMovingAverage(uniform, 3)
      expect(ma).toBe(100.0)
    })

    it('should handle trending data', () => {
      const trending = [100, 105, 110, 115, 120, 125]
      const ma = calculateMovingAverage(trending, 2)
      expect(ma).toBeCloseTo(122.5, 0)
    })

    it('should handle high volatility returns', () => {
      const volatile = [-0.5, 0.3, -0.4, 0.2, -0.3, 0.25, -0.2, 0.15]
      const var95 = calculateVaR(volatile, 0.95)
      expect(var95).toBeLessThan(-0.2)
    })
  })

  describe('Type safety', () => {
    it('should enforce PortfolioConfig type', () => {
      const config: PortfolioConfig = {
        initial_capital: 100000,
        max_positions: 20,
        risk_per_trade: 0.02,
      }

      expect(config.initial_capital).toBe(100000)
      expect(config.max_positions).toBe(20)
    })

    it('should enforce TradeData type', () => {
      const trade: TradeData = {
        symbol: 'AAPL',
        price: 150.0,
        volume: 100,
        timestamp: Date.now(),
        metadata: { test: true },
      }

      expect(trade.symbol).toBe('AAPL')
      expect(trade.price).toBe(150.0)
    })

    it('should enforce ProcessedTradeData type', () => {
      const processed = processTradeData(sampleTrade)

      expect(processed.symbol).toBe('AAPL')
      expect(typeof processed.log_return).toBe('number')
      expect(typeof processed.processing_timestamp).toBe('number')
    })

    it('should enforce PortfolioMetrics type', () => {
      const metrics = calculatePortfolioMetrics(samplePortfolioConfig, [sampleTrade])

      expect(typeof metrics.total_value).toBe('number')
      expect(typeof metrics.cash_available).toBe('number')
      expect(typeof metrics.sharpe_ratio).toBe('number')
    })
  })
})
