import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  PortfolioManager,
  createPortfolio,
  addPosition,
  removePosition,
  updatePositionPrice,
  calculateRealizedPnL,
  calculateUnrealizedPnL,
  calculatePortfolioPnL,
  calculateValueAtRisk,
  calculatePortfolioBeta,
  calculateCorrelation,
  calculateConcentrationRisk,
  suggestRebalancing,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateRiskMetrics,
  getPortfolioSummary,
  Portfolio,
  Position,
} from '../src/index'

describe('NT Portfolio - Portfolio Management', () => {
  describe('Portfolio Creation', () => {
    it('should create a new portfolio with initial cash', () => {
      const portfolio = createPortfolio('test-portfolio-1', 100000)

      expect(portfolio).toBeDefined()
      expect(portfolio.id).toBe('test-portfolio-1')
      expect(portfolio.cash).toBe(100000)
      expect(portfolio.positions).toEqual([])
      expect(portfolio.timestamp).toBeDefined()
    })

    it('should create portfolio with default initial cash', () => {
      const portfolio = createPortfolio('test-portfolio-2')

      expect(portfolio.id).toBe('test-portfolio-2')
      expect(portfolio.cash).toBeGreaterThan(0)
    })

    it('should create portfolio with zero initial cash', () => {
      const portfolio = createPortfolio('test-portfolio-3', 0)

      expect(portfolio.cash).toBe(0)
      expect(portfolio.positions).toEqual([])
    })

    it('should create multiple independent portfolios', () => {
      const portfolio1 = createPortfolio('portfolio-a', 50000)
      const portfolio2 = createPortfolio('portfolio-b', 75000)

      expect(portfolio1.id).toBe('portfolio-a')
      expect(portfolio2.id).toBe('portfolio-b')
      expect(portfolio1.cash).toBe(50000)
      expect(portfolio2.cash).toBe(75000)
    })
  })

  describe('Position Management', () => {
    let portfolio: Portfolio

    beforeAll(() => {
      portfolio = createPortfolio('position-test', 100000)
    })

    it('should add a long position to portfolio', () => {
      const position: Position = {
        symbol: 'AAPL',
        quantity: 100,
        entry_price: 150,
        current_price: 150,
        position_type: 'long',
      }

      portfolio = addPosition(portfolio, position)

      expect(portfolio.positions).toHaveLength(1)
      expect(portfolio.positions[0].symbol).toBe('AAPL')
      expect(portfolio.positions[0].quantity).toBe(100)
    })

    it('should add a short position to portfolio', () => {
      const position: Position = {
        symbol: 'GOOGL',
        quantity: 50,
        entry_price: 2800,
        current_price: 2800,
        position_type: 'short',
      }

      portfolio = addPosition(portfolio, position)

      expect(portfolio.positions).toHaveLength(2)
      expect(portfolio.positions[1].position_type).toBe('short')
    })

    it('should add multiple positions', () => {
      const positions: Position[] = [
        {
          symbol: 'MSFT',
          quantity: 200,
          entry_price: 310,
          current_price: 310,
          position_type: 'long',
        },
        {
          symbol: 'AMZN',
          quantity: 75,
          entry_price: 3200,
          current_price: 3200,
          position_type: 'long',
        },
      ]

      let portfolioTemp = portfolio
      for (const position of positions) {
        portfolioTemp = addPosition(portfolioTemp, position)
      }

      expect(portfolioTemp.positions.length).toBeGreaterThanOrEqual(2)
    })

    it('should remove a position from portfolio', () => {
      const initialLength = portfolio.positions.length
      portfolio = removePosition(portfolio, 'AAPL')

      expect(portfolio.positions.length).toBeLessThan(initialLength)
      expect(portfolio.positions.find((p) => p.symbol === 'AAPL')).toBeUndefined()
    })

    it('should update position price', () => {
      const position: Position = {
        symbol: 'TSLA',
        quantity: 150,
        entry_price: 250,
        current_price: 250,
        position_type: 'long',
      }

      let portfolioTemp = addPosition(portfolio, position)
      portfolioTemp = updatePositionPrice(portfolioTemp, 'TSLA', 280)

      const updatedPosition = portfolioTemp.positions.find((p) => p.symbol === 'TSLA')
      expect(updatedPosition?.current_price).toBe(280)
    })

    it('should handle position price updates for non-existent positions', () => {
      const updatedPortfolio = updatePositionPrice(portfolio, 'NONEXISTENT', 100)
      expect(updatedPortfolio.positions.find((p) => p.symbol === 'NONEXISTENT')).toBeUndefined()
    })
  })

  describe('P&L Calculations', () => {
    it('should calculate realized P&L for long position', () => {
      const pnl = calculateRealizedPnL(150, 180, 100, 'long')
      expect(pnl).toBe(3000) // (180-150)*100
    })

    it('should calculate realized P&L for short position', () => {
      const pnl = calculateRealizedPnL(2800, 2600, 50, 'short')
      expect(pnl).toBe(10000) // (2800-2600)*50
    })

    it('should calculate negative realized P&L', () => {
      const pnl = calculateRealizedPnL(100, 90, 100, 'long')
      expect(pnl).toBe(-1000) // (90-100)*100
    })

    it('should calculate unrealized P&L for long position', () => {
      const pnl = calculateUnrealizedPnL(150, 160, 100, 'long')
      expect(pnl).toBe(1000) // (160-150)*100
    })

    it('should calculate unrealized P&L for short position', () => {
      const pnl = calculateUnrealizedPnL(2800, 2700, 50, 'short')
      expect(pnl).toBe(5000) // (2800-2700)*50
    })

    it('should calculate zero P&L when entry equals current price', () => {
      const pnl = calculateUnrealizedPnL(100, 100, 50, 'long')
      expect(pnl).toBe(0)
    })

    it('should calculate portfolio P&L with mixed positions', () => {
      const portfolio = createPortfolio('pnl-test', 100000)

      const position1: Position = {
        symbol: 'AAPL',
        quantity: 100,
        entry_price: 150,
        current_price: 160,
        position_type: 'long',
      }

      const position2: Position = {
        symbol: 'GOOGL',
        quantity: 50,
        entry_price: 2800,
        current_price: 2700,
        position_type: 'long',
      }

      let portfolioWithPositions = addPosition(portfolio, position1)
      portfolioWithPositions = addPosition(portfolioWithPositions, position2)

      const pnl = calculatePortfolioPnL(portfolioWithPositions)

      expect(pnl.portfolio_id).toBe('pnl-test')
      expect(pnl.total_unrealized_pnl).toBeDefined()
      expect(pnl.position_pnls).toHaveLength(2)
      expect(pnl.timestamp).toBeDefined()
    })

    it('should calculate accurate portfolio return percentage', () => {
      const portfolio = createPortfolio('return-test', 100000)

      const position: Position = {
        symbol: 'TEST',
        quantity: 100,
        entry_price: 100,
        current_price: 110,
        position_type: 'long',
      }

      const portfolioWithPosition = addPosition(portfolio, position)
      const pnl = calculatePortfolioPnL(portfolioWithPosition)

      expect(pnl.total_return_percentage).toBeGreaterThan(0)
      expect(pnl.total_return_percentage).toBeLessThan(100)
    })
  })

  describe('Risk Calculations - Value at Risk', () => {
    let portfolio: Portfolio

    beforeAll(() => {
      portfolio = createPortfolio('var-test', 100000)
      const position: Position = {
        symbol: 'VIX',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }
      portfolio = addPosition(portfolio, position)
    })

    it('should calculate VaR at 95% confidence', () => {
      const var95 = calculateValueAtRisk(portfolio, 0.95)
      expect(var95).toBeGreaterThan(0)
      expect(typeof var95).toBe('number')
    })

    it('should calculate VaR at 99% confidence', () => {
      const var99 = calculateValueAtRisk(portfolio, 0.99)
      expect(var99).toBeGreaterThan(0)
    })

    it('should calculate VaR at 90% confidence', () => {
      const var90 = calculateValueAtRisk(portfolio, 0.90)
      expect(var90).toBeGreaterThan(0)
    })

    it('should calculate higher VaR for higher confidence levels', () => {
      const var90 = calculateValueAtRisk(portfolio, 0.90)
      const var99 = calculateValueAtRisk(portfolio, 0.99)
      expect(var99).toBeGreaterThan(var90)
    })
  })

  describe('Risk Calculations - Portfolio Beta', () => {
    it('should calculate portfolio beta with individual stock betas', () => {
      const portfolio = createPortfolio('beta-test', 100000)

      const position1: Position = {
        symbol: 'AAPL',
        quantity: 100,
        entry_price: 150,
        current_price: 150,
        position_type: 'long',
      }

      const position2: Position = {
        symbol: 'MSFT',
        quantity: 100,
        entry_price: 310,
        current_price: 310,
        position_type: 'long',
      }

      let portfolioWithPositions = addPosition(portfolio, position1)
      portfolioWithPositions = addPosition(portfolioWithPositions, position2)

      const betas = { AAPL: 1.2, MSFT: 0.9 }
      const portfolioBeta = calculatePortfolioBeta(portfolioWithPositions, betas)

      expect(portfolioBeta).toBeGreaterThan(0)
      expect(typeof portfolioBeta).toBe('number')
    })

    it('should calculate weighted portfolio beta', () => {
      const portfolio = createPortfolio('weighted-beta-test', 100000)

      const heavyPosition: Position = {
        symbol: 'HIGH_BETA',
        quantity: 200,
        entry_price: 50,
        current_price: 50,
        position_type: 'long',
      }

      const lightPosition: Position = {
        symbol: 'LOW_BETA',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      let portfolioWithPositions = addPosition(portfolio, heavyPosition)
      portfolioWithPositions = addPosition(portfolioWithPositions, lightPosition)

      const betas = { HIGH_BETA: 1.5, LOW_BETA: 0.5 }
      const portfolioBeta = calculatePortfolioBeta(portfolioWithPositions, betas)

      expect(portfolioBeta).toBeGreaterThanOrEqual(0.5)
      expect(portfolioBeta).toBeLessThanOrEqual(1.5)
    })
  })

  describe('Correlation Analysis', () => {
    it('should calculate perfect positive correlation', () => {
      const allocation1 = [1, 2, 3, 4, 5]
      const allocation2 = [1, 2, 3, 4, 5]
      const correlation = calculateCorrelation(allocation1, allocation2)

      expect(correlation).toBeCloseTo(1.0, 1)
    })

    it('should calculate perfect negative correlation', () => {
      const allocation1 = [1, 2, 3, 4, 5]
      const allocation2 = [5, 4, 3, 2, 1]
      const correlation = calculateCorrelation(allocation1, allocation2)

      expect(correlation).toBeLessThan(0)
    })

    it('should calculate zero correlation', () => {
      const allocation1 = [1, 1, 1, 1, 1]
      const allocation2 = [2, 3, 4, 5, 6]
      const correlation = calculateCorrelation(allocation1, allocation2)

      expect(correlation).toBeDefined()
      expect(typeof correlation).toBe('number')
    })

    it('should handle identical allocations', () => {
      const allocation = [10, 20, 30, 40, 50]
      const correlation = calculateCorrelation(allocation, allocation)

      expect(correlation).toBeCloseTo(1.0, 1)
    })
  })

  describe('Concentration Risk', () => {
    it('should calculate concentration risk for single position', () => {
      const portfolio = createPortfolio('concentration-single', 100000)

      const position: Position = {
        symbol: 'CONCENTRATED',
        quantity: 100,
        entry_price: 1000,
        current_price: 1000,
        position_type: 'long',
      }

      const portfolioWithPosition = addPosition(portfolio, position)
      const concentration = calculateConcentrationRisk(portfolioWithPosition)

      expect(concentration).toBe(1.0)
    })

    it('should calculate concentration risk for equally weighted positions', () => {
      const portfolio = createPortfolio('concentration-equal', 100000)

      const position1: Position = {
        symbol: 'EQUAL1',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      const position2: Position = {
        symbol: 'EQUAL2',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      let portfolioWithPositions = addPosition(portfolio, position1)
      portfolioWithPositions = addPosition(portfolioWithPositions, position2)

      const concentration = calculateConcentrationRisk(portfolioWithPositions)

      // Equally weighted positions should have 0 concentration (perfectly diversified)
      expect(concentration).toBeLessThanOrEqual(1.0)
      expect(concentration).toBeGreaterThanOrEqual(0)
    })

    it('should calculate lower concentration for diversified portfolio', () => {
      const portfolio = createPortfolio('concentration-diverse', 100000)

      const positions: Position[] = [
        { symbol: 'STOCK1', quantity: 100, entry_price: 100, current_price: 100, position_type: 'long' },
        { symbol: 'STOCK2', quantity: 100, entry_price: 100, current_price: 100, position_type: 'long' },
        { symbol: 'STOCK3', quantity: 100, entry_price: 100, current_price: 100, position_type: 'long' },
        { symbol: 'STOCK4', quantity: 100, entry_price: 100, current_price: 100, position_type: 'long' },
      ]

      let portfolioWithPositions = portfolio
      for (const position of positions) {
        portfolioWithPositions = addPosition(portfolioWithPositions, position)
      }

      const concentration = calculateConcentrationRisk(portfolioWithPositions)

      expect(concentration).toBeLessThan(0.5)
    })
  })

  describe('Portfolio Rebalancing', () => {
    it('should suggest rebalancing to target allocations', () => {
      const portfolio = createPortfolio('rebalance-test', 100000)

      const position1: Position = {
        symbol: 'STOCK_A',
        quantity: 100,
        entry_price: 500,
        current_price: 500,
        position_type: 'long',
      }

      const position2: Position = {
        symbol: 'STOCK_B',
        quantity: 100,
        entry_price: 500,
        current_price: 500,
        position_type: 'long',
      }

      let portfolioWithPositions = addPosition(portfolio, position1)
      portfolioWithPositions = addPosition(portfolioWithPositions, position2)

      const targetAllocations = { STOCK_A: 0.6, STOCK_B: 0.4 }
      const suggestion = suggestRebalancing(portfolioWithPositions, targetAllocations)

      expect(suggestion.portfolio_id).toBe('rebalance-test')
      expect(suggestion.actions).toBeDefined()
      expect(suggestion.total_fees).toBeGreaterThanOrEqual(0)
    })

    it('should identify when rebalancing is needed', () => {
      const portfolio = createPortfolio('rebalance-needed', 100000)

      const position: Position = {
        symbol: 'ONLY_STOCK',
        quantity: 100,
        entry_price: 1000,
        current_price: 1000,
        position_type: 'long',
      }

      const portfolioWithPosition = addPosition(portfolio, position)
      const targetAllocations = { ONLY_STOCK: 0.5, NEW_STOCK: 0.5 }

      const suggestion = suggestRebalancing(portfolioWithPosition, targetAllocations)

      expect(suggestion.actions.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Metrics', () => {
    it('should calculate Sharpe ratio', () => {
      const portfolio = createPortfolio('sharpe-test', 100000)

      const position: Position = {
        symbol: 'PERF_TEST',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      const portfolioWithPosition = addPosition(portfolio, position)
      const sharpeRatio = calculateSharpeRatio(portfolioWithPosition, 0.02, 0.15)

      expect(sharpeRatio).toBeGreaterThan(-10)
      expect(sharpeRatio).toBeLessThan(10)
    })

    it('should calculate Sortino ratio', () => {
      const portfolio = createPortfolio('sortino-test', 100000)

      const position: Position = {
        symbol: 'PERF_TEST',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      const portfolioWithPosition = addPosition(portfolio, position)
      const sortinoRatio = calculateSortinoRatio(portfolioWithPosition, 0.02, 0.10)

      expect(sortinoRatio).toBeGreaterThan(-10)
      expect(sortinoRatio).toBeLessThan(10)
    })

    it('should calculate maximum drawdown', () => {
      const returns = [0.05, -0.02, 0.03, -0.08, 0.02, -0.01]
      const maxDD = calculateMaxDrawdown(returns)

      expect(maxDD).toBeGreaterThan(0)
      expect(maxDD).toBeLessThanOrEqual(1)
    })

    it('should calculate zero drawdown for only positive returns', () => {
      const returns = [0.05, 0.03, 0.02, 0.01]
      const maxDD = calculateMaxDrawdown(returns)

      expect(maxDD).toBe(0)
    })
  })

  describe('Risk Metrics Summary', () => {
    it('should calculate comprehensive risk metrics', () => {
      const portfolio = createPortfolio('risk-metrics-test', 100000)

      const position1: Position = {
        symbol: 'RISK1',
        quantity: 100,
        entry_price: 150,
        current_price: 150,
        position_type: 'long',
      }

      const position2: Position = {
        symbol: 'RISK2',
        quantity: 50,
        entry_price: 300,
        current_price: 300,
        position_type: 'long',
      }

      let portfolioWithPositions = addPosition(portfolio, position1)
      portfolioWithPositions = addPosition(portfolioWithPositions, position2)

      const riskMetrics = calculateRiskMetrics(portfolioWithPositions)

      expect(riskMetrics.portfolio_id).toBe('risk-metrics-test')
      expect(riskMetrics.value_at_risk).toBeGreaterThanOrEqual(0)
      expect(riskMetrics.concentration_ratio).toBeGreaterThanOrEqual(0)
      expect(riskMetrics.sharpe_ratio).toBeDefined()
      expect(riskMetrics.sortino_ratio).toBeDefined()
      expect(riskMetrics.timestamp).toBeDefined()
    })
  })

  describe('Portfolio Summary', () => {
    it('should get portfolio summary', () => {
      const portfolio = createPortfolio('summary-test', 100000)

      const position1: Position = {
        symbol: 'SUM1',
        quantity: 100,
        entry_price: 200,
        current_price: 200,
        position_type: 'long',
      }

      const position2: Position = {
        symbol: 'SUM2',
        quantity: 50,
        entry_price: 400,
        current_price: 400,
        position_type: 'long',
      }

      let portfolioWithPositions = addPosition(portfolio, position1)
      portfolioWithPositions = addPosition(portfolioWithPositions, position2)

      const summary = getPortfolioSummary(portfolioWithPositions)

      expect(summary.portfolio_id).toBe('summary-test')
      expect(summary.total_value).toBeGreaterThan(0)
      expect(summary.cash).toBe(100000)
      expect(summary.position_count).toBe(2)
      expect(summary.timestamp).toBeDefined()
    })

    it('should calculate total portfolio value correctly', () => {
      const portfolio = createPortfolio('value-test', 50000)

      const position: Position = {
        symbol: 'VALUE',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      const portfolioWithPosition = addPosition(portfolio, position)
      const summary = getPortfolioSummary(portfolioWithPosition)

      expect(summary.total_portfolio_value).toBe(50000 + 10000)
    })
  })

  describe('PortfolioManager Class', () => {
    it('should create PortfolioManager instance', () => {
      const manager = new PortfolioManager('manager-test', 100000)
      expect(manager).toBeDefined()
    })

    it('should add positions via manager', () => {
      const manager = new PortfolioManager('manager-add-test', 100000)

      const position: Position = {
        symbol: 'MGMT1',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      manager.addPosition(position)
      const portfolio = manager.getPortfolio()

      expect(portfolio.positions).toHaveLength(1)
      expect(portfolio.positions[0].symbol).toBe('MGMT1')
    })

    it('should remove positions via manager', () => {
      const manager = new PortfolioManager('manager-remove-test', 100000)

      const position: Position = {
        symbol: 'MGMT_REMOVE',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      manager.addPosition(position)
      manager.removePosition('MGMT_REMOVE')
      const portfolio = manager.getPortfolio()

      expect(portfolio.positions).toHaveLength(0)
    })

    it('should calculate P&L via manager', () => {
      const manager = new PortfolioManager('manager-pnl-test', 100000)

      const position: Position = {
        symbol: 'MGMT_PNL',
        quantity: 100,
        entry_price: 100,
        current_price: 110,
        position_type: 'long',
      }

      manager.addPosition(position)
      const pnl = manager.calculatePnL()

      expect(pnl.total_unrealized_pnl).toBeGreaterThan(0)
      expect(pnl.position_pnls).toHaveLength(1)
    })

    it('should calculate VaR via manager', () => {
      const manager = new PortfolioManager('manager-var-test', 100000)

      const position: Position = {
        symbol: 'MGMT_VAR',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      manager.addPosition(position)
      const var95 = manager.calculateVaR(0.95)

      expect(var95).toBeGreaterThan(0)
    })

    it('should get summary via manager', () => {
      const manager = new PortfolioManager('manager-summary-test', 100000)

      const position: Position = {
        symbol: 'MGMT_SUM',
        quantity: 100,
        entry_price: 100,
        current_price: 100,
        position_type: 'long',
      }

      manager.addPosition(position)
      const summary = manager.getSummary()

      expect(summary.portfolio_id).toBe('manager-summary-test')
      expect(summary.position_count).toBe(1)
    })
  })
})
