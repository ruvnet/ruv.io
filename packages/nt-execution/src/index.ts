// NT Execution - Order Execution Engine
// TypeScript bindings for the napi-rs module

export interface Order {
  id: string
  symbol: string
  side: string
  order_type: string
  quantity: number
  price?: number
  stop_price?: number
  filled_quantity: number
  average_fill_price: number
  status: string
  timestamp: number
  expires_at?: number
}

export interface ExecutionFill {
  id: string
  order_id: string
  quantity: number
  price: number
  timestamp: number
  exchange: string
  commission: number
}

export interface ExecutionReport {
  order_id: string
  symbol: string
  total_quantity: number
  filled_quantity: number
  fill_rate: number
  average_price: number
  total_value: number
  commission: number
  net_value: number
  execution_time_ms: number
  fills_count: number
  status: string
}

export interface RoutingInfo {
  primary_exchange: string
  secondary_exchanges: string[]
  preferred_venues?: string[]
  avoid_venues?: string[]
}

export interface TWAPExecutionPlan {
  algorithm: string
  total_slices: number
  execution_plan: Array<{
    slice: number
    quantity: number
    time_offset_ms: number
    expected_price_impact: number
  }>
  estimated_time_ms: number
  urgency_adjusted: boolean
}

export interface VWAPExecutionPlan {
  algorithm: string
  total_slices: number
  execution_plan: Array<{
    slice: number
    quantity: number
    participation_rate: number
    volume_window_ms: number
  }>
  participation_rate: number
  lookback_period_ms: number
}

export interface MarketExecutionPlan {
  algorithm: string
  quantity: number
  execution_style: string
  market_conditions: string
  estimated_price_impact: number
  slices: number
  expected_execution_ms: number
}

export interface LimitExecutionPlan {
  algorithm: string
  quantity: number
  limit_price: number
  time_to_expiry_ms: number
  urgency: number
  slicing_required: boolean
  estimated_fill_probability: number
}

export interface SmartOrderRoute {
  symbol: string
  total_quantity: number
  routes: Array<{
    exchange: string
    quantity: number
    priority: number
  }>
  optimization_criteria: string
  timestamp: number
}

/**
 * Native bindings from nt_execution Rust module
 */
let ntExecution: any

try {
  ntExecution = require('../index')
} catch (e) {
  console.warn('Native nt_execution module not loaded. Build the project first.')
  ntExecution = null
}

/**
 * ExecutionEngine manages the full lifecycle of orders
 */
export class ExecutionEngine {
  private engine: any

  /**
   * Create a new ExecutionEngine instance
   */
  constructor() {
    if (!ntExecution) {
      throw new Error('Native module not available')
    }
    this.engine = new ntExecution.ExecutionEngine()
  }

  /**
   * Create a new order
   */
  createOrder(
    symbol: string,
    side: 'buy' | 'sell',
    orderType: 'market' | 'limit' | 'stop' | 'stop_limit',
    quantity: number,
    price?: number
  ): string {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    return this.engine.createOrder(symbol, side, orderType, quantity, price || null)
  }

  /**
   * Submit an order for execution
   */
  submitOrder(orderId: string): string {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    return this.engine.submitOrder(orderId)
  }

  /**
   * Record an execution fill for an order
   */
  recordFill(orderId: string, quantity: number, price: number, exchange: string): string {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    return this.engine.recordFill(orderId, quantity, price, exchange)
  }

  /**
   * Get order details
   */
  getOrder(orderId: string): Order {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    const result = this.engine.getOrder(orderId)
    return JSON.parse(result)
  }

  /**
   * Get all fills for an order
   */
  getOrderFills(orderId: string): ExecutionFill[] {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    const result = this.engine.getOrderFills(orderId)
    return JSON.parse(result)
  }

  /**
   * Cancel an order
   */
  cancelOrder(orderId: string): string {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    return this.engine.cancelOrder(orderId)
  }

  /**
   * Generate execution report for an order
   */
  generateExecutionReport(orderId: string): ExecutionReport {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    const result = this.engine.generateExecutionReport(orderId)
    return JSON.parse(result)
  }

  /**
   * Get all orders
   */
  getAllOrders(): Order[] {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    const result = this.engine.getAllOrders()
    return JSON.parse(result)
  }

  /**
   * Get order statistics
   */
  getOrderStats(): Record<string, any> {
    if (!this.engine) {
      throw new Error('ExecutionEngine not initialized')
    }
    const result = this.engine.getOrderStats()
    return JSON.parse(result)
  }
}

/**
 * Execute order using TWAP (Time-Weighted Average Price) algorithm
 */
export function executeTWAP(
  totalQuantity: number,
  timeWindowMs: number,
  sliceIntervalMs: number,
  urgency: number = 0.5
): TWAPExecutionPlan {
  if (!ntExecution) {
    throw new Error('Native module not available')
  }
  const result = ntExecution.executeTwap(totalQuantity, timeWindowMs, sliceIntervalMs, urgency)
  return JSON.parse(result)
}

/**
 * Execute order using VWAP (Volume-Weighted Average Price) algorithm
 */
export function executeVWAP(
  totalQuantity: number,
  volumeParticipationRate: number = 0.1,
  lookbackPeriodMs: number = 300000
): VWAPExecutionPlan {
  if (!ntExecution) {
    throw new Error('Native module not available')
  }
  const result = ntExecution.executeVwap(
    totalQuantity,
    volumeParticipationRate,
    lookbackPeriodMs
  )
  return JSON.parse(result)
}

/**
 * Execute market order directly
 */
export function executeMarketOrder(
  quantity: number,
  marketConditions: string = 'normal'
): MarketExecutionPlan {
  if (!ntExecution) {
    throw new Error('Native module not available')
  }
  const result = ntExecution.executeMarket(quantity, marketConditions)
  return JSON.parse(result)
}

/**
 * Execute limit order with routing
 */
export function executeLimitOrder(
  quantity: number,
  limitPrice: number,
  timeToExpiryMs: number = 86400000
): LimitExecutionPlan {
  if (!ntExecution) {
    throw new Error('Native module not available')
  }
  const result = ntExecution.executeLimit(quantity, limitPrice, timeToExpiryMs)
  return JSON.parse(result)
}

/**
 * Perform smart order routing across multiple venues
 */
export function smartOrderRouting(
  symbol: string,
  quantity: number,
  primaryExchange: string,
  secondaryExchanges: string[] = []
): SmartOrderRoute {
  if (!ntExecution) {
    throw new Error('Native module not available')
  }
  const result = ntExecution.smartOrderRouting(
    symbol,
    quantity,
    primaryExchange,
    JSON.stringify(secondaryExchanges)
  )
  return JSON.parse(result)
}

/**
 * Create an execution engine instance with helper methods
 */
export function createExecutionEngine(): ExecutionEngine {
  return new ExecutionEngine()
}

// Export all types and functions
export default {
  ExecutionEngine,
  createExecutionEngine,
  executeTWAP,
  executeVWAP,
  executeMarketOrder,
  executeLimitOrder,
  smartOrderRouting,
}
