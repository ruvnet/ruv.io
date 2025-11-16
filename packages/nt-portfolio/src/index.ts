// NT Portfolio - Neural Trader Portfolio Management
// TypeScript bindings for the napi-rs module

export interface Position {
  symbol: string
  quantity: number
  entry_price: number
  current_price: number
  position_type: 'long' | 'short'
}

export interface Portfolio {
  id: string
  positions: Position[]
  cash: number
  timestamp: string
}

export interface PositionPnL {
  symbol: string
  quantity: number
  entry_price: number
  current_price: number
  unrealized_pnl: number
  realized_pnl: number
  pnl_percentage: number
  position_type: string
}

export interface PortfolioPnL {
  portfolio_id: string
  total_unrealized_pnl: number
  total_realized_pnl: number
  total_pnl: number
  total_return_percentage: number
  position_pnls: PositionPnL[]
  timestamp: string
}

export interface RiskMetrics {
  portfolio_id: string
  value_at_risk: number
  beta: number
  correlation: number
  concentration_ratio: number
  max_drawdown: number
  sharpe_ratio: number
  sortino_ratio: number
  timestamp: string
}

export interface RebalancingAction {
  symbol: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
  cost: number
}

export interface RebalancingSuggestion {
  portfolio_id: string
  actions: RebalancingAction[]
  total_fees: number
  expected_return: number
  timestamp: string
}

/**
 * Native bindings from nt_portfolio Rust module
 */
let ntPortfolio: any

try {
  // Load the native module via platform loader
  ntPortfolio = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_portfolio module not loaded. Build the project first.')
  ntPortfolio = null
}

/**
 * Create a new empty portfolio
 * @param portfolioId - Portfolio identifier
 * @param initialCash - Initial cash amount
 * @returns Portfolio object
 */
export function createPortfolio(portfolioId: string, initialCash: number = 100000): Portfolio {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const result = ntPortfolio.createPortfolio(portfolioId, initialCash)
  return JSON.parse(result)
}

/**
 * Add a position to the portfolio
 * @param portfolio - Portfolio object
 * @param position - Position to add
 * @returns Updated portfolio
 */
export function addPosition(portfolio: Portfolio, position: Position): Portfolio {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  const positionJson = JSON.stringify(position)
  const result = ntPortfolio.addPosition(portfolioJson, positionJson)

  return JSON.parse(result)
}

/**
 * Remove a position from the portfolio
 * @param portfolio - Portfolio object
 * @param symbol - Symbol of position to remove
 * @returns Updated portfolio
 */
export function removePosition(portfolio: Portfolio, symbol: string): Portfolio {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  const result = ntPortfolio.removePosition(portfolioJson, symbol)

  return JSON.parse(result)
}

/**
 * Update a position with new current price
 * @param portfolio - Portfolio object
 * @param symbol - Symbol to update
 * @param currentPrice - New current price
 * @returns Updated portfolio
 */
export function updatePositionPrice(
  portfolio: Portfolio,
  symbol: string,
  currentPrice: number
): Portfolio {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  const result = ntPortfolio.updatePositionPrice(portfolioJson, symbol, currentPrice)

  return JSON.parse(result)
}

/**
 * Calculate realized P&L for a position
 * @param entryPrice - Entry price
 * @param exitPrice - Exit price
 * @param quantity - Quantity
 * @param positionType - "long" or "short"
 * @returns Realized P&L
 */
export function calculateRealizedPnL(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  positionType: 'long' | 'short'
): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  return ntPortfolio.calculateRealizedPnl(entryPrice, exitPrice, quantity, positionType)
}

/**
 * Calculate unrealized P&L for a position
 * @param entryPrice - Entry price
 * @param currentPrice - Current price
 * @param quantity - Quantity
 * @param positionType - "long" or "short"
 * @returns Unrealized P&L
 */
export function calculateUnrealizedPnL(
  entryPrice: number,
  currentPrice: number,
  quantity: number,
  positionType: 'long' | 'short'
): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  return ntPortfolio.calculateUnrealizedPnl(entryPrice, currentPrice, quantity, positionType)
}

/**
 * Calculate portfolio P&L summary
 * @param portfolio - Portfolio object
 * @returns Portfolio P&L summary
 */
export function calculatePortfolioPnL(portfolio: Portfolio): PortfolioPnL {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  const result = ntPortfolio.calculatePortfolioPnl(portfolioJson)

  return JSON.parse(result)
}

/**
 * Calculate Value at Risk (VaR)
 * @param portfolio - Portfolio object
 * @param confidenceLevel - Confidence level (0.0 to 1.0)
 * @returns VaR value
 */
export function calculateValueAtRisk(portfolio: Portfolio, confidenceLevel: number = 0.95): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  return ntPortfolio.calculateValueAtRisk(portfolioJson, confidenceLevel)
}

/**
 * Calculate portfolio beta
 * @param portfolio - Portfolio object
 * @param individualBetas - Map of symbol to beta values
 * @returns Portfolio beta
 */
export function calculatePortfolioBeta(
  portfolio: Portfolio,
  individualBetas: Record<string, number>
): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  const betasJson = JSON.stringify(individualBetas)
  return ntPortfolio.calculatePortfolioBeta(portfolioJson, betasJson)
}

/**
 * Calculate correlation between two allocations
 * @param allocation1 - First allocation array
 * @param allocation2 - Second allocation array
 * @returns Correlation coefficient
 */
export function calculateCorrelation(allocation1: number[], allocation2: number[]): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const alloc1Json = JSON.stringify(allocation1)
  const alloc2Json = JSON.stringify(allocation2)
  return ntPortfolio.calculateCorrelation(alloc1Json, alloc2Json)
}

/**
 * Calculate concentration risk
 * @param portfolio - Portfolio object
 * @returns Concentration ratio (0.0 to 1.0)
 */
export function calculateConcentrationRisk(portfolio: Portfolio): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  return ntPortfolio.calculateConcentrationRisk(portfolioJson)
}

/**
 * Suggest portfolio rebalancing
 * @param portfolio - Portfolio object
 * @param targetAllocations - Target allocations by symbol
 * @returns Rebalancing suggestions
 */
export function suggestRebalancing(
  portfolio: Portfolio,
  targetAllocations: Record<string, number>
): RebalancingSuggestion {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  const allocationsJson = JSON.stringify(targetAllocations)
  const result = ntPortfolio.suggestRebalancing(portfolioJson, allocationsJson)

  return JSON.parse(result)
}

/**
 * Calculate Sharpe ratio
 * @param portfolio - Portfolio object
 * @param riskFreeRate - Risk-free rate
 * @param volatility - Portfolio volatility
 * @returns Sharpe ratio
 */
export function calculateSharpeRatio(
  portfolio: Portfolio,
  riskFreeRate: number = 0.02,
  volatility: number = 0.15
): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  return ntPortfolio.calculateSharpeRatio(portfolioJson, riskFreeRate, volatility)
}

/**
 * Calculate Sortino ratio
 * @param portfolio - Portfolio object
 * @param riskFreeRate - Risk-free rate
 * @param downsideVolatility - Downside volatility
 * @returns Sortino ratio
 */
export function calculateSortinoRatio(
  portfolio: Portfolio,
  riskFreeRate: number = 0.02,
  downsideVolatility: number = 0.10
): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  return ntPortfolio.calculateSortinoRatio(portfolioJson, riskFreeRate, downsideVolatility)
}

/**
 * Calculate maximum drawdown
 * @param returns - Array of historical returns
 * @returns Maximum drawdown
 */
export function calculateMaxDrawdown(returns: number[]): number {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const returnsJson = JSON.stringify(returns)
  return ntPortfolio.calculateMaxDrawdown(returnsJson)
}

/**
 * Calculate comprehensive risk metrics
 * @param portfolio - Portfolio object
 * @param riskParams - Risk parameters
 * @returns Risk metrics
 */
export function calculateRiskMetrics(
  portfolio: Portfolio,
  riskParams: Record<string, any> = {}
): RiskMetrics {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  const paramsJson = JSON.stringify(riskParams)
  const result = ntPortfolio.calculateRiskMetrics(portfolioJson, paramsJson)

  return JSON.parse(result)
}

/**
 * Get portfolio summary
 * @param portfolio - Portfolio object
 * @returns Portfolio summary
 */
export function getPortfolioSummary(
  portfolio: Portfolio
): {
  portfolio_id: string
  total_value: number
  cash: number
  total_portfolio_value: number
  position_count: number
  timestamp: string
} {
  if (!ntPortfolio) {
    throw new Error('Native module not available')
  }

  const portfolioJson = JSON.stringify(portfolio)
  const result = ntPortfolio.getPortfolioSummary(portfolioJson)

  return JSON.parse(result)
}

/**
 * PortfolioManager class for managing portfolios
 */
export class PortfolioManager {
  private portfolio: Portfolio

  /**
   * Create a new PortfolioManager
   * @param portfolioId - Portfolio identifier
   * @param initialCash - Initial cash amount
   */
  constructor(portfolioId: string, initialCash: number = 100000) {
    if (!ntPortfolio) {
      throw new Error('Native module not available')
    }
    this.portfolio = createPortfolio(portfolioId, initialCash)
  }

  /**
   * Add a position
   */
  addPosition(position: Position): void {
    this.portfolio = addPosition(this.portfolio, position)
  }

  /**
   * Remove a position
   */
  removePosition(symbol: string): void {
    this.portfolio = removePosition(this.portfolio, symbol)
  }

  /**
   * Update position price
   */
  updatePositionPrice(symbol: string, currentPrice: number): void {
    this.portfolio = updatePositionPrice(this.portfolio, symbol, currentPrice)
  }

  /**
   * Get current portfolio
   */
  getPortfolio(): Portfolio {
    return this.portfolio
  }

  /**
   * Calculate P&L
   */
  calculatePnL(): PortfolioPnL {
    return calculatePortfolioPnL(this.portfolio)
  }

  /**
   * Calculate Value at Risk
   */
  calculateVaR(confidenceLevel: number = 0.95): number {
    return calculateValueAtRisk(this.portfolio, confidenceLevel)
  }

  /**
   * Calculate concentration risk
   */
  calculateConcentration(): number {
    return calculateConcentrationRisk(this.portfolio)
  }

  /**
   * Suggest rebalancing
   */
  suggestRebalancing(targetAllocations: Record<string, number>): RebalancingSuggestion {
    return suggestRebalancing(this.portfolio, targetAllocations)
  }

  /**
   * Calculate risk metrics
   */
  getRiskMetrics(riskParams?: Record<string, any>): RiskMetrics {
    return calculateRiskMetrics(this.portfolio, riskParams)
  }

  /**
   * Get portfolio summary
   */
  getSummary() {
    return getPortfolioSummary(this.portfolio)
  }
}

// Export all types and functions
export default {
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
  PortfolioManager,
}
