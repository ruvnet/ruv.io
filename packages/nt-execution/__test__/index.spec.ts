import { describe, it, expect, beforeEach } from 'vitest'
import {
  ExecutionEngine,
  createExecutionEngine,
  executeTWAP,
  executeVWAP,
  executeMarketOrder,
  executeLimitOrder,
  smartOrderRouting,
  Order,
  ExecutionReport,
  TWAPExecutionPlan,
  VWAPExecutionPlan,
  MarketExecutionPlan,
  LimitExecutionPlan,
  SmartOrderRoute,
} from '../src/index'

describe('NT Execution Engine - Order Lifecycle Management', () => {
  let engine: ExecutionEngine

  beforeEach(() => {
    engine = createExecutionEngine()
  })

  describe('Order Creation and Submission', () => {
    it('should create a new market order', () => {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
      expect(orderId).toBeDefined()
      expect(orderId).toContain('AAPL')
    })

    it('should create a new limit order with price', () => {
      const orderId = engine.createOrder('TSLA', 'sell', 'limit', 50, 250.0)
      expect(orderId).toBeDefined()
      expect(orderId).toContain('TSLA')
    })

    it('should create multiple orders with unique IDs', () => {
      const order1 = engine.createOrder('AAPL', 'buy', 'market', 100)
      const order2 = engine.createOrder('AAPL', 'buy', 'market', 100)
      expect(order1).not.toBe(order2)
    })

    it('should submit an order and change its status', () => {
      const orderId = engine.createOrder('GOOGL', 'buy', 'market', 100)
      const result = engine.submitOrder(orderId)
      expect(result).toContain('submitted successfully')

      const order = engine.getOrder(orderId)
      expect(order.status).toBe('submitted')
    })

    it('should retrieve order details', () => {
      const orderId = engine.createOrder('MSFT', 'buy', 'limit', 200, 300.0)
      const order = engine.getOrder(orderId)

      expect(order.id).toBe(orderId)
      expect(order.symbol).toBe('MSFT')
      expect(order.side).toBe('buy')
      expect(order.quantity).toBe(200)
      expect(order.price).toBe(300.0)
      expect(order.status).toBe('pending')
    })
  })

  describe('Order Fill Tracking', () => {
    it('should record a single fill', () => {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
      engine.submitOrder(orderId)

      const fillId = engine.recordFill(orderId, 100, 150.25, 'NYSE')
      expect(fillId).toBeDefined()
      expect(fillId).toContain('fill')
    })

    it('should update order status to filled after full fill', () => {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 100, 150.25, 'NYSE')

      const order = engine.getOrder(orderId)
      expect(order.status).toBe('filled')
      expect(order.filled_quantity).toBe(100)
    })

    it('should update order status to partially filled', () => {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 50, 150.25, 'NYSE')

      const order = engine.getOrder(orderId)
      expect(order.status).toBe('partially_filled')
      expect(order.filled_quantity).toBe(50)
    })

    it('should calculate average fill price correctly', () => {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
      engine.submitOrder(orderId)

      engine.recordFill(orderId, 50, 150.0, 'NYSE')
      engine.recordFill(orderId, 50, 160.0, 'NASDAQ')

      const order = engine.getOrder(orderId)
      expect(order.average_fill_price).toBe(155.0)
    })

    it('should track multiple fills for an order', () => {
      const orderId = engine.createOrder('TSLA', 'buy', 'market', 150)
      engine.submitOrder(orderId)

      engine.recordFill(orderId, 50, 200.0, 'NYSE')
      engine.recordFill(orderId, 50, 205.0, 'NASDAQ')
      engine.recordFill(orderId, 50, 210.0, 'CBOE')

      const fills = engine.getOrderFills(orderId)
      expect(fills).toHaveLength(3)
      expect(fills[0].quantity).toBe(50)
      expect(fills[1].quantity).toBe(50)
      expect(fills[2].quantity).toBe(50)
    })

    it('should record fill exchange information', () => {
      const orderId = engine.createOrder('GOOGL', 'sell', 'market', 75)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 75, 2800.0, 'NASDAQ')

      const fills = engine.getOrderFills(orderId)
      expect(fills[0].exchange).toBe('NASDAQ')
    })

    it('should calculate commission on fills', () => {
      const orderId = engine.createOrder('MSFT', 'buy', 'market', 100)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 100, 300.0, 'NYSE')

      const fills = engine.getOrderFills(orderId)
      expect(fills[0].commission).toBeGreaterThan(0)
    })
  })

  describe('Order Cancellation', () => {
    it('should cancel a pending order', () => {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
      const result = engine.cancelOrder(orderId)
      expect(result).toContain('cancelled')

      const order = engine.getOrder(orderId)
      expect(order.status).toBe('cancelled')
    })

    it('should cancel a submitted order', () => {
      const orderId = engine.createOrder('TSLA', 'sell', 'limit', 50, 250.0)
      engine.submitOrder(orderId)
      engine.cancelOrder(orderId)

      const order = engine.getOrder(orderId)
      expect(order.status).toBe('cancelled')
    })

    it('should cancel a partially filled order', () => {
      const orderId = engine.createOrder('GOOGL', 'buy', 'market', 100)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 30, 2500.0, 'NYSE')
      engine.cancelOrder(orderId)

      const order = engine.getOrder(orderId)
      expect(order.status).toBe('cancelled')
      expect(order.filled_quantity).toBe(30)
    })
  })

  describe('Execution Reports', () => {
    it('should generate execution report for filled order', () => {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 100, 150.0, 'NYSE')

      const report = engine.generateExecutionReport(orderId)
      expect(report.order_id).toBe(orderId)
      expect(report.symbol).toBe('AAPL')
      expect(report.filled_quantity).toBe(100)
      expect(report.fill_rate).toBe(1.0)
    })

    it('should calculate fill rate correctly', () => {
      const orderId = engine.createOrder('TSLA', 'buy', 'market', 100)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 60, 200.0, 'NYSE')

      const report = engine.generateExecutionReport(orderId)
      expect(report.fill_rate).toBe(0.6)
    })

    it('should include commission in execution report', () => {
      const orderId = engine.createOrder('MSFT', 'buy', 'market', 100)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 100, 300.0, 'NYSE')

      const report = engine.generateExecutionReport(orderId)
      expect(report.commission).toBeGreaterThan(0)
      expect(report.net_value).toBeLessThan(report.total_value)
    })

    it('should track execution time in report', () => {
      const orderId = engine.createOrder('GOOGL', 'sell', 'market', 50)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 50, 2800.0, 'NASDAQ')

      const report = engine.generateExecutionReport(orderId)
      expect(report.execution_time_ms).toBeGreaterThanOrEqual(0)
    })

    it('should include proper status in execution report', () => {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
      engine.submitOrder(orderId)
      engine.recordFill(orderId, 100, 150.0, 'NYSE')

      const report = engine.generateExecutionReport(orderId)
      expect(report.status).toBe('filled')
    })
  })

  describe('Order Queries and Statistics', () => {
    it('should retrieve all orders', () => {
      engine.createOrder('AAPL', 'buy', 'market', 100)
      engine.createOrder('TSLA', 'sell', 'limit', 50, 250.0)
      engine.createOrder('GOOGL', 'buy', 'market', 75)

      const orders = engine.getAllOrders()
      expect(orders.length).toBe(3)
    })

    it('should get order statistics', () => {
      const order1 = engine.createOrder('AAPL', 'buy', 'market', 100)
      const order2 = engine.createOrder('TSLA', 'sell', 'limit', 50, 250.0)

      engine.submitOrder(order1)
      engine.submitOrder(order2)

      const stats = engine.getOrderStats()
      expect(stats.total_orders).toBe(2)
      expect(stats.submitted).toBe(2)
    })

    it('should count orders by status', () => {
      const order1 = engine.createOrder('AAPL', 'buy', 'market', 100)
      const order2 = engine.createOrder('TSLA', 'sell', 'limit', 50, 250.0)
      const order3 = engine.createOrder('GOOGL', 'buy', 'market', 75)

      engine.submitOrder(order1)
      engine.submitOrder(order2)

      const stats = engine.getOrderStats()
      expect(stats.pending).toBe(1)
      expect(stats.submitted).toBe(2)
    })

    it('should track total quantities', () => {
      engine.createOrder('AAPL', 'buy', 'market', 100)
      engine.createOrder('TSLA', 'sell', 'limit', 50, 250.0)

      const stats = engine.getOrderStats()
      expect(stats.total_quantity).toBe(150)
    })

    it('should track filled quantities', () => {
      const order1 = engine.createOrder('AAPL', 'buy', 'market', 100)
      const order2 = engine.createOrder('TSLA', 'sell', 'limit', 50, 250.0)

      engine.submitOrder(order1)
      engine.submitOrder(order2)

      engine.recordFill(order1, 50, 150.0, 'NYSE')
      engine.recordFill(order2, 25, 250.0, 'NASDAQ')

      const stats = engine.getOrderStats()
      expect(stats.total_filled).toBe(75)
    })
  })
})

describe('NT Execution Engine - Execution Algorithms', () => {
  describe('TWAP Algorithm', () => {
    it('should generate TWAP execution plan', () => {
      const plan = executeTWAP(1000, 60000, 10000)
      expect(plan.algorithm).toBe('TWAP')
      expect(plan.total_slices).toBe(6)
    })

    it('should respect time window in TWAP', () => {
      const plan = executeTWAP(1000, 120000, 20000)
      expect(plan.estimated_time_ms).toBe(120000)
    })

    it('should adjust for urgency in TWAP', () => {
      const lowUrgencyPlan = executeTWAP(1000, 60000, 10000, 0.2)
      const highUrgencyPlan = executeTWAP(1000, 60000, 10000, 0.9)

      expect(highUrgencyPlan.urgency_adjusted).toBe(true)
      expect(lowUrgencyPlan.urgency_adjusted).toBe(true)
    })

    it('should create proper slice offsets in TWAP', () => {
      const plan = executeTWAP(1000, 30000, 10000)
      expect(plan.execution_plan).toHaveLength(plan.total_slices)

      for (let i = 0; i < plan.execution_plan.length; i++) {
        const slice = plan.execution_plan[i]
        expect(slice.slice).toBe(i + 1)
        expect(slice.quantity).toBeGreaterThan(0)
        expect(slice.time_offset_ms).toBe(i * 10000)
      }
    })
  })

  describe('VWAP Algorithm', () => {
    it('should generate VWAP execution plan', () => {
      const plan = executeVWAP(10000, 0.05, 300000)
      expect(plan.algorithm).toBe('VWAP')
      expect(plan.participation_rate).toBe(0.05)
    })

    it('should respect lookback period in VWAP', () => {
      const plan = executeVWAP(10000, 0.1, 600000)
      expect(plan.lookback_period_ms).toBe(600000)
    })

    it('should calculate participation rates in VWAP', () => {
      const plan = executeVWAP(5000, 0.05)
      expect(plan.execution_plan.length).toBeGreaterThan(0)

      for (const slice of plan.execution_plan) {
        expect(slice.participation_rate).toBeGreaterThanOrEqual(0)
        expect(slice.participation_rate).toBeLessThanOrEqual(100)
      }
    })

    it('should handle high participation rates in VWAP', () => {
      const plan = executeVWAP(100000, 0.2, 300000)
      expect(plan.execution_plan.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Market Execution', () => {
    it('should generate market execution plan', () => {
      const plan = executeMarketOrder(1000)
      expect(plan.algorithm).toBe('DirectMarket')
      expect(plan.execution_style).toBe('immediate')
      expect(plan.slices).toBe(1)
    })

    it('should account for market conditions', () => {
      const normalPlan = executeMarketOrder(1000, 'normal')
      const volatilePlan = executeMarketOrder(1000, 'volatile')

      expect(volatilePlan.estimated_price_impact).toBeGreaterThan(
        normalPlan.estimated_price_impact
      )
    })

    it('should have quick execution time for market orders', () => {
      const plan = executeMarketOrder(500)
      expect(plan.expected_execution_ms).toBeLessThan(1000)
    })
  })

  describe('Limit Order Execution', () => {
    it('should generate limit execution plan', () => {
      const plan = executeLimitOrder(500, 150.0, 86400000)
      expect(plan.algorithm).toBe('LimitOrder')
      expect(plan.limit_price).toBe(150.0)
      expect(plan.quantity).toBe(500)
    })

    it('should adjust urgency based on time to expiry', () => {
      const longExpiryPlan = executeLimitOrder(1000, 100.0, 3600000)
      const shortExpiryPlan = executeLimitOrder(1000, 100.0, 30000)

      expect(shortExpiryPlan.urgency).toBeGreaterThan(longExpiryPlan.urgency)
    })

    it('should estimate fill probability for limit orders', () => {
      const plan = executeLimitOrder(1000, 100.0, 3600000)
      expect(plan.estimated_fill_probability).toBeGreaterThanOrEqual(0)
      expect(plan.estimated_fill_probability).toBeLessThanOrEqual(1)
    })

    it('should determine slicing requirement based on urgency', () => {
      const plan = executeLimitOrder(1000, 100.0, 30000)
      expect(plan.slicing_required).toBe(true)
    })
  })
})

describe('NT Execution Engine - Smart Order Routing', () => {
  it('should generate smart order routing', () => {
    const route = smartOrderRouting('AAPL', 1000, 'NYSE', ['NASDAQ', 'CBOE'])
    expect(route.symbol).toBe('AAPL')
    expect(route.total_quantity).toBe(1000)
    expect(route.routes.length).toBeGreaterThan(0)
  })

  it('should allocate more to primary exchange', () => {
    const route = smartOrderRouting('AAPL', 1000, 'NYSE', ['NASDAQ'])
    const primaryRoute = route.routes.find(r => r.exchange === 'NYSE')
    const secondaryRoute = route.routes.find(r => r.exchange === 'NASDAQ')

    expect(primaryRoute!.quantity).toBeGreaterThan(secondaryRoute!.quantity)
    expect(primaryRoute!.priority).toBe(1)
    expect(secondaryRoute!.priority).toBe(2)
  })

  it('should include optimization criteria', () => {
    const route = smartOrderRouting('TSLA', 500, 'NASDAQ')
    expect(route.optimization_criteria).toBeDefined()
    expect(route.optimization_criteria).toContain('execution')
  })

  it('should distribute across multiple secondary exchanges', () => {
    const route = smartOrderRouting('GOOGL', 1000, 'NYSE', ['NASDAQ', 'CBOE', 'BATS'])
    const secondaryRoutes = route.routes.filter(r => r.priority === 2)
    expect(secondaryRoutes.length).toBeGreaterThan(0)
  })

  it('should include timestamp in routing info', () => {
    const route = smartOrderRouting('MSFT', 750, 'NASDAQ')
    expect(route.timestamp).toBeGreaterThan(0)
  })
})

describe('NT Execution Engine - Integration Scenarios', () => {
  let engine: ExecutionEngine

  beforeEach(() => {
    engine = createExecutionEngine()
  })

  it('should handle complete order-to-execution workflow', () => {
    const orderId = engine.createOrder('AAPL', 'buy', 'market', 100)
    expect(orderId).toBeDefined()

    engine.submitOrder(orderId)
    const submittedOrder = engine.getOrder(orderId)
    expect(submittedOrder.status).toBe('submitted')

    engine.recordFill(orderId, 100, 150.0, 'NYSE')
    const filledOrder = engine.getOrder(orderId)
    expect(filledOrder.status).toBe('filled')

    const report = engine.generateExecutionReport(orderId)
    expect(report.fill_rate).toBe(1.0)
  })

  it('should handle multiple concurrent orders', () => {
    const orders = []
    for (let i = 0; i < 5; i++) {
      const orderId = engine.createOrder('AAPL', 'buy', 'market', 100 * (i + 1))
      orders.push(orderId)
      engine.submitOrder(orderId)
    }

    const allOrders = engine.getAllOrders()
    expect(allOrders.length).toBe(5)
  })

  it('should properly track mixed order statuses', () => {
    const order1 = engine.createOrder('AAPL', 'buy', 'market', 100)
    const order2 = engine.createOrder('TSLA', 'sell', 'limit', 50, 250.0)
    const order3 = engine.createOrder('GOOGL', 'buy', 'market', 75)

    engine.submitOrder(order1)
    engine.submitOrder(order2)
    engine.submitOrder(order3)

    engine.recordFill(order1, 50, 150.0, 'NYSE')
    engine.recordFill(order3, 75, 2500.0, 'NASDAQ')

    const stats = engine.getOrderStats()
    expect(stats.partially_filled).toBe(1)
    expect(stats.filled).toBe(1)
    expect(stats.submitted).toBe(1)
  })
})
