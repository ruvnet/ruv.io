use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

// ============ Data Structures ============

/// Represents a single order in the system
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Order {
    id: String,
    symbol: String,
    side: String,
    order_type: String,
    quantity: f64,
    price: Option<f64>,
    stop_price: Option<f64>,
    filled_quantity: f64,
    average_fill_price: f64,
    status: String,
    timestamp: i64,
    expires_at: Option<i64>,
}

/// Represents an execution fill
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExecutionFill {
    id: String,
    order_id: String,
    quantity: f64,
    price: f64,
    timestamp: i64,
    exchange: String,
    commission: f64,
}

/// Execution report with detailed metrics
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExecutionReport {
    order_id: String,
    symbol: String,
    total_quantity: f64,
    filled_quantity: f64,
    fill_rate: f64,
    average_price: f64,
    total_value: f64,
    commission: f64,
    net_value: f64,
    execution_time_ms: i64,
    fills_count: usize,
    status: String,
}

/// Routing information for order placement
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RoutingInfo {
    primary_exchange: String,
    secondary_exchanges: Vec<String>,
    preferred_venues: Vec<String>,
    avoid_venues: Vec<String>,
}

// ============ Execution Engine ============

/// Main execution engine managing order lifecycle
#[napi]
pub struct ExecutionEngine {
    orders: Arc<Mutex<HashMap<String, Order>>>,
    fills: Arc<Mutex<Vec<ExecutionFill>>>,
    reports: Arc<Mutex<Vec<ExecutionReport>>>,
    routing_configs: Arc<Mutex<HashMap<String, RoutingInfo>>>,
    order_counter: Arc<Mutex<usize>>,
}

#[napi]
impl ExecutionEngine {
    #[napi(constructor)]
    pub fn new() -> napi::Result<Self> {
        Ok(ExecutionEngine {
            orders: Arc::new(Mutex::new(HashMap::new())),
            fills: Arc::new(Mutex::new(Vec::new())),
            reports: Arc::new(Mutex::new(Vec::new())),
            routing_configs: Arc::new(Mutex::new(HashMap::new())),
            order_counter: Arc::new(Mutex::new(0)),
        })
    }

    #[napi]
    pub fn create_order(
        &mut self,
        symbol: String,
        side: String,
        order_type: String,
        quantity: f64,
        price: Option<f64>,
    ) -> napi::Result<String> {
        let mut counter = self.order_counter.lock().map_err(|e| {
            napi::Error::from_reason(format!("Failed to lock order counter: {}", e))
        })?;
        *counter += 1;

        let order_id = format!("{}-{}", symbol, *counter);
        let order = Order {
            id: order_id.clone(),
            symbol,
            side,
            order_type,
            quantity,
            price,
            stop_price: None,
            filled_quantity: 0.0,
            average_fill_price: 0.0,
            status: "pending".to_string(),
            timestamp: get_timestamp_ms(),
            expires_at: None,
        };

        let mut orders = self
            .orders
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock orders: {}", e)))?;
        orders.insert(order_id.clone(), order);

        Ok(order_id)
    }

    #[napi]
    pub fn submit_order(&mut self, order_id: String) -> napi::Result<String> {
        let mut orders = self
            .orders
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock orders: {}", e)))?;

        if let Some(order) = orders.get_mut(&order_id) {
            order.status = "submitted".to_string();
            Ok(format!("Order {} submitted successfully", order_id))
        } else {
            Err(napi::Error::from_reason(format!("Order {} not found", order_id)))
        }
    }

    #[napi]
    pub fn record_fill(
        &mut self,
        order_id: String,
        quantity: f64,
        price: f64,
        exchange: String,
    ) -> napi::Result<String> {
        let fill_id = format!("{}-fill-{}", order_id, get_timestamp_ms());

        // Update order
        let mut orders = self
            .orders
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock orders: {}", e)))?;

        if let Some(order) = orders.get_mut(&order_id) {
            let old_filled = order.filled_quantity;
            let new_filled = (old_filled + quantity).min(order.quantity);
            let fill_amount = new_filled - old_filled;

            order.filled_quantity = new_filled;
            order.average_fill_price =
                (order.average_fill_price * old_filled + price * fill_amount) / new_filled;

            if (new_filled - order.quantity).abs() < 0.001 {
                order.status = "filled".to_string();
            } else if new_filled > 0.0 {
                order.status = "partially_filled".to_string();
            }
        } else {
            return Err(napi::Error::from_reason(format!("Order {} not found", order_id)));
        }

        // Record fill
        let fill = ExecutionFill {
            id: fill_id.clone(),
            order_id,
            quantity,
            price,
            timestamp: get_timestamp_ms(),
            exchange,
            commission: calculate_commission(quantity, price),
        };

        let mut fills = self
            .fills
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock fills: {}", e)))?;
        fills.push(fill);

        Ok(fill_id)
    }

    #[napi]
    pub fn get_order(&self, order_id: String) -> napi::Result<String> {
        let orders = self
            .orders
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock orders: {}", e)))?;

        if let Some(order) = orders.get(&order_id) {
            match serde_json::to_string(order) {
                Ok(json) => Ok(json),
                Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
            }
        } else {
            Err(napi::Error::from_reason(format!("Order {} not found", order_id)))
        }
    }

    #[napi]
    pub fn get_order_fills(&self, order_id: String) -> napi::Result<String> {
        let fills = self
            .fills
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock fills: {}", e)))?;

        let order_fills: Vec<ExecutionFill> = fills
            .iter()
            .filter(|f| f.order_id == order_id)
            .cloned()
            .collect();

        match serde_json::to_string(&order_fills) {
            Ok(json) => Ok(json),
            Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
        }
    }

    #[napi]
    pub fn cancel_order(&mut self, order_id: String) -> napi::Result<String> {
        let mut orders = self
            .orders
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock orders: {}", e)))?;

        if let Some(order) = orders.get_mut(&order_id) {
            order.status = "cancelled".to_string();
            Ok(format!(
                "Order {} cancelled. Filled: {} / {}",
                order_id, order.filled_quantity, order.quantity
            ))
        } else {
            Err(napi::Error::from_reason(format!("Order {} not found", order_id)))
        }
    }

    #[napi]
    pub fn generate_execution_report(&self, order_id: String) -> napi::Result<String> {
        let orders = self
            .orders
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock orders: {}", e)))?;

        if let Some(order) = orders.get(&order_id) {
            let total_value = order.average_fill_price * order.filled_quantity;
            let commission = calculate_commission(order.filled_quantity, order.average_fill_price);

            let report = ExecutionReport {
                order_id: order.id.clone(),
                symbol: order.symbol.clone(),
                total_quantity: order.quantity,
                filled_quantity: order.filled_quantity,
                fill_rate: if order.quantity > 0.0 {
                    order.filled_quantity / order.quantity
                } else {
                    0.0
                },
                average_price: order.average_fill_price,
                total_value,
                commission,
                net_value: total_value - commission,
                execution_time_ms: get_timestamp_ms() - order.timestamp,
                fills_count: 0,
                status: order.status.clone(),
            };

            match serde_json::to_string(&report) {
                Ok(json) => Ok(json),
                Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
            }
        } else {
            Err(napi::Error::from_reason(format!("Order {} not found", order_id)))
        }
    }

    #[napi]
    pub fn get_all_orders(&self) -> napi::Result<String> {
        let orders = self
            .orders
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock orders: {}", e)))?;

        let order_list: Vec<Order> = orders.values().cloned().collect();

        match serde_json::to_string(&order_list) {
            Ok(json) => Ok(json),
            Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
        }
    }

    #[napi]
    pub fn get_order_stats(&self) -> napi::Result<String> {
        let orders = self
            .orders
            .lock()
            .map_err(|e| napi::Error::from_reason(format!("Failed to lock orders: {}", e)))?;

        let stats = serde_json::json!({
            "total_orders": orders.len(),
            "pending": orders.values().filter(|o| o.status == "pending").count(),
            "submitted": orders.values().filter(|o| o.status == "submitted").count(),
            "partially_filled": orders.values().filter(|o| o.status == "partially_filled").count(),
            "filled": orders.values().filter(|o| o.status == "filled").count(),
            "cancelled": orders.values().filter(|o| o.status == "cancelled").count(),
            "total_quantity": orders.values().map(|o| o.quantity).sum::<f64>(),
            "total_filled": orders.values().map(|o| o.filled_quantity).sum::<f64>(),
        });

        match serde_json::to_string(&stats) {
            Ok(json) => Ok(json),
            Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
        }
    }
}

// ============ Algorithm Functions ============

/// Execute order using TWAP algorithm
#[napi]
pub fn execute_twap(
    total_quantity: f64,
    time_window_ms: i64,
    slice_interval_ms: i64,
    urgency: f64,
) -> napi::Result<String> {
    let slices = (time_window_ms as f64 / slice_interval_ms as f64).ceil() as usize;
    let base_slice_qty = total_quantity / slices as f64;

    let mut execution_plan = Vec::new();
    for i in 0..slices {
        let qty = if i == slices - 1 {
            total_quantity - (base_slice_qty * i as f64)
        } else {
            base_slice_qty
        };

        let urgency_factor = 1.0 + (urgency * 0.5);
        let adjusted_qty = qty * urgency_factor;

        execution_plan.push(serde_json::json!({
            "slice": i + 1,
            "quantity": adjusted_qty,
            "time_offset_ms": i * slice_interval_ms as usize,
            "expected_price_impact": 0.001 * (i as f64 / slices as f64),
        }));
    }

    let result = serde_json::json!({
        "algorithm": "TWAP",
        "total_slices": slices,
        "execution_plan": execution_plan,
        "estimated_time_ms": time_window_ms,
        "urgency_adjusted": true,
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
    }
}

/// Execute order using VWAP algorithm
#[napi]
pub fn execute_vwap(
    total_quantity: f64,
    volume_participation_rate: f64,
    lookback_period_ms: i64,
) -> napi::Result<String> {
    let market_volume_estimate = 1_000_000.0;
    let max_participation = market_volume_estimate * volume_participation_rate;
    let slices = ((total_quantity / max_participation).ceil() as usize).max(1);

    let mut execution_plan = Vec::new();
    for i in 0..slices {
        let qty = (total_quantity / slices as f64).min(max_participation);
        execution_plan.push(serde_json::json!({
            "slice": i + 1,
            "quantity": qty,
            "participation_rate": (qty / market_volume_estimate * 100.0).min(100.0),
            "volume_window_ms": lookback_period_ms,
        }));
    }

    let result = serde_json::json!({
        "algorithm": "VWAP",
        "total_slices": slices,
        "execution_plan": execution_plan,
        "participation_rate": volume_participation_rate,
        "lookback_period_ms": lookback_period_ms,
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
    }
}

/// Execute market order directly
#[napi]
pub fn execute_market(quantity: f64, market_conditions: String) -> napi::Result<String> {
    let impact = if market_conditions == "volatile" { 0.003 } else { 0.001 };

    let result = serde_json::json!({
        "algorithm": "DirectMarket",
        "quantity": quantity,
        "execution_style": "immediate",
        "market_conditions": market_conditions,
        "estimated_price_impact": impact,
        "slices": 1,
        "expected_execution_ms": 100,
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
    }
}

/// Execute limit order with routing
#[napi]
pub fn execute_limit(quantity: f64, limit_price: f64, time_to_expiry_ms: i64) -> napi::Result<String> {
    let urgency = if time_to_expiry_ms < 60000 { 0.8 } else { 0.3 };

    let result = serde_json::json!({
        "algorithm": "LimitOrder",
        "quantity": quantity,
        "limit_price": limit_price,
        "time_to_expiry_ms": time_to_expiry_ms,
        "urgency": urgency,
        "slicing_required": urgency > 0.5,
        "estimated_fill_probability": 1.0 - (0.05 * urgency),
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
    }
}

/// Smart order routing across venues
#[napi]
pub fn smart_order_routing(
    symbol: String,
    quantity: f64,
    primary_exchange: String,
    secondary_exchanges_json: String,
) -> napi::Result<String> {
    let secondary_exchanges: Vec<String> = match serde_json::from_str(&secondary_exchanges_json) {
        Ok(exch) => exch,
        Err(e) => {
            return Err(napi::Error::from_reason(format!(
                "Failed to parse secondary exchanges: {}",
                e
            )))
        }
    };

    let mut routes = Vec::new();

    // Primary exchange gets main allocation
    routes.push(serde_json::json!({
        "exchange": &primary_exchange,
        "quantity": quantity * 0.6,
        "priority": 1,
    }));

    // Distribute remainder among secondary exchanges
    let per_secondary = (quantity * 0.4) / secondary_exchanges.len().max(1) as f64;
    for exchange in secondary_exchanges.iter() {
        routes.push(serde_json::json!({
            "exchange": exchange,
            "quantity": per_secondary,
            "priority": 2,
        }));
    }

    let result = serde_json::json!({
        "symbol": symbol,
        "total_quantity": quantity,
        "routes": routes,
        "optimization_criteria": "execution_quality",
        "timestamp": get_timestamp_ms(),
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(napi::Error::from_reason(format!("Serialization error: {}", e))),
    }
}

// ============ Helper Functions ============

fn get_timestamp_ms() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    duration.as_millis() as i64
}

fn calculate_commission(quantity: f64, price: f64) -> f64 {
    (quantity * price) * 0.0005 // 0.05% commission
}
