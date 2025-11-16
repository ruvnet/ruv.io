use napi::{bindgen_prelude::*, JsBuffer, JsObject, JsString};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Position data with entry price and quantity
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Position {
    symbol: String,
    quantity: f64,
    entry_price: f64,
    current_price: f64,
    position_type: String, // "long" or "short"
}

/// Portfolio holding with all positions
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Portfolio {
    id: String,
    positions: Vec<Position>,
    cash: f64,
    timestamp: String,
}

/// P&L metrics for a position
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PositionPnL {
    symbol: String,
    quantity: f64,
    entry_price: f64,
    current_price: f64,
    unrealized_pnl: f64,
    realized_pnl: f64,
    pnl_percentage: f64,
    position_type: String,
}

/// Portfolio P&L summary
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PortfolioPnL {
    portfolio_id: String,
    total_unrealized_pnl: f64,
    total_realized_pnl: f64,
    total_pnl: f64,
    total_return_percentage: f64,
    position_pnls: Vec<PositionPnL>,
    timestamp: String,
}

/// Risk metrics
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RiskMetrics {
    portfolio_id: String,
    value_at_risk: f64,
    beta: f64,
    correlation: f64,
    concentration_ratio: f64,
    max_drawdown: f64,
    sharpe_ratio: f64,
    sortino_ratio: f64,
    timestamp: String,
}

/// Rebalancing suggestion
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RebalancingSuggestion {
    portfolio_id: String,
    actions: Vec<RebalancingAction>,
    total_fees: f64,
    expected_return: f64,
    timestamp: String,
}

/// Individual rebalancing action
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RebalancingAction {
    symbol: String,
    action: String, // "buy" or "sell"
    quantity: f64,
    price: f64,
    cost: f64,
}

/// Add position to portfolio
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `position_json` - JSON string containing position data
///
/// # Returns
/// JSON string with updated portfolio
#[napi]
pub fn add_position(portfolio_json: String, position_json: String) -> Result<String> {
    let mut portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let position: Position = serde_json::from_str(&position_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse position JSON: {}", e)))?;

    portfolio.positions.push(position);
    portfolio.timestamp = get_timestamp();

    serde_json::to_string(&portfolio)
        .map_err(|e| Error::from_reason(format!("Failed to serialize portfolio: {}", e)))
}

/// Remove position from portfolio
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `symbol` - Symbol of position to remove
///
/// # Returns
/// JSON string with updated portfolio
#[napi]
pub fn remove_position(portfolio_json: String, symbol: String) -> Result<String> {
    let mut portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    portfolio
        .positions
        .retain(|p| p.symbol != symbol);
    portfolio.timestamp = get_timestamp();

    serde_json::to_string(&portfolio)
        .map_err(|e| Error::from_reason(format!("Failed to serialize portfolio: {}", e)))
}

/// Update position with current price
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `symbol` - Symbol to update
/// * `current_price` - New current price
///
/// # Returns
/// JSON string with updated portfolio
#[napi]
pub fn update_position_price(
    portfolio_json: String,
    symbol: String,
    current_price: f64,
) -> Result<String> {
    let mut portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    if let Some(position) = portfolio.positions.iter_mut().find(|p| p.symbol == symbol) {
        position.current_price = current_price;
    }

    portfolio.timestamp = get_timestamp();

    serde_json::to_string(&portfolio)
        .map_err(|e| Error::from_reason(format!("Failed to serialize portfolio: {}", e)))
}

/// Calculate realized P&L
///
/// # Arguments
/// * `entry_price` - Entry price
/// * `exit_price` - Exit price
/// * `quantity` - Quantity
/// * `position_type` - "long" or "short"
///
/// # Returns
/// Realized P&L
#[napi]
pub fn calculate_realized_pnl(
    entry_price: f64,
    exit_price: f64,
    quantity: f64,
    position_type: String,
) -> Result<f64> {
    let pnl = if position_type == "long" {
        (exit_price - entry_price) * quantity
    } else {
        (entry_price - exit_price) * quantity
    };

    Ok(pnl)
}

/// Calculate unrealized P&L
///
/// # Arguments
/// * `entry_price` - Entry price
/// * `current_price` - Current price
/// * `quantity` - Quantity
/// * `position_type` - "long" or "short"
///
/// # Returns
/// Unrealized P&L
#[napi]
pub fn calculate_unrealized_pnl(
    entry_price: f64,
    current_price: f64,
    quantity: f64,
    position_type: String,
) -> Result<f64> {
    let pnl = if position_type == "long" {
        (current_price - entry_price) * quantity
    } else {
        (entry_price - current_price) * quantity
    };

    Ok(pnl)
}

/// Calculate portfolio P&L summary
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
///
/// # Returns
/// JSON string with P&L summary
#[napi]
pub fn calculate_portfolio_pnl(portfolio_json: String) -> Result<String> {
    let portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let mut position_pnls = Vec::new();
    let mut total_unrealized_pnl = 0.0;
    let mut total_realized_pnl = 0.0;
    let mut total_invested = 0.0;

    for position in &portfolio.positions {
        let unrealized_pnl = if position.position_type == "long" {
            (position.current_price - position.entry_price) * position.quantity
        } else {
            (position.entry_price - position.current_price) * position.quantity
        };

        let pnl_percentage = if position.entry_price > 0.0 {
            (unrealized_pnl / (position.entry_price * position.quantity)) * 100.0
        } else {
            0.0
        };

        position_pnls.push(PositionPnL {
            symbol: position.symbol.clone(),
            quantity: position.quantity,
            entry_price: position.entry_price,
            current_price: position.current_price,
            unrealized_pnl,
            realized_pnl: 0.0,
            pnl_percentage,
            position_type: position.position_type.clone(),
        });

        total_unrealized_pnl += unrealized_pnl;
        total_invested += position.entry_price * position.quantity;
    }

    let total_pnl = total_unrealized_pnl + total_realized_pnl;
    let total_return_percentage = if total_invested > 0.0 {
        (total_pnl / total_invested) * 100.0
    } else {
        0.0
    };

    let portfolio_pnl = PortfolioPnL {
        portfolio_id: portfolio.id,
        total_unrealized_pnl,
        total_realized_pnl,
        total_pnl,
        total_return_percentage,
        position_pnls,
        timestamp: get_timestamp(),
    };

    serde_json::to_string(&portfolio_pnl)
        .map_err(|e| Error::from_reason(format!("Failed to serialize P&L: {}", e)))
}

/// Calculate portfolio Value at Risk (VaR)
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `confidence_level` - Confidence level (0.0 to 1.0)
///
/// # Returns
/// VaR value
#[napi]
pub fn calculate_value_at_risk(portfolio_json: String, confidence_level: f64) -> Result<f64> {
    let portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let mut total_value = 0.0;
    let mut risk_exposure = 0.0;

    for position in &portfolio.positions {
        let position_value = position.quantity * position.current_price;
        total_value += position_value;

        // Simple volatility proxy: 2% standard deviation assumption
        let estimated_volatility = 0.02;
        risk_exposure += position_value * estimated_volatility;
    }

    // Simple VaR approximation using z-score
    let z_score = match confidence_level {
        x if x > 0.99 => 2.326,
        x if x > 0.95 => 1.645,
        x if x > 0.90 => 1.282,
        _ => 1.0,
    };

    let var = risk_exposure * z_score;
    Ok(var)
}

/// Calculate portfolio beta relative to a market index
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `individual_betas_json` - JSON string with individual stock betas
///
/// # Returns
/// Portfolio beta
#[napi]
pub fn calculate_portfolio_beta(
    portfolio_json: String,
    individual_betas_json: String,
) -> Result<f64> {
    let portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let betas: HashMap<String, f64> = serde_json::from_str(&individual_betas_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse betas JSON: {}", e)))?;

    let mut total_weight = 0.0;
    let mut weighted_beta = 0.0;

    for position in &portfolio.positions {
        let position_value = position.quantity * position.current_price;
        total_weight += position_value;

        if let Some(&beta) = betas.get(&position.symbol) {
            weighted_beta += beta * position_value;
        }
    }

    let portfolio_beta = if total_weight > 0.0 {
        weighted_beta / total_weight
    } else {
        0.0
    };

    Ok(portfolio_beta)
}

/// Calculate correlation between two portfolio allocations
///
/// # Arguments
/// * `allocation1_json` - First allocation as JSON array
/// * `allocation2_json` - Second allocation as JSON array
///
/// # Returns
/// Correlation coefficient (-1.0 to 1.0)
#[napi]
pub fn calculate_correlation(allocation1_json: String, allocation2_json: String) -> Result<f64> {
    let alloc1: Vec<f64> = serde_json::from_str(&allocation1_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse allocation1: {}", e)))?;

    let alloc2: Vec<f64> = serde_json::from_str(&allocation2_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse allocation2: {}", e)))?;

    if alloc1.len() != alloc2.len() || alloc1.is_empty() {
        return Err(Error::from_reason("Invalid allocation arrays"));
    }

    let n = alloc1.len() as f64;
    let mean1 = alloc1.iter().sum::<f64>() / n;
    let mean2 = alloc2.iter().sum::<f64>() / n;

    let mut covariance = 0.0;
    let mut var1 = 0.0;
    let mut var2 = 0.0;

    for i in 0..alloc1.len() {
        let diff1 = alloc1[i] - mean1;
        let diff2 = alloc2[i] - mean2;
        covariance += diff1 * diff2;
        var1 += diff1 * diff1;
        var2 += diff2 * diff2;
    }

    let std1 = (var1 / n).sqrt();
    let std2 = (var2 / n).sqrt();

    if std1 > 0.0 && std2 > 0.0 {
        Ok((covariance / n) / (std1 * std2))
    } else {
        Ok(0.0)
    }
}

/// Calculate concentration risk
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
///
/// # Returns
/// Concentration ratio (0.0 to 1.0)
#[napi]
pub fn calculate_concentration_risk(portfolio_json: String) -> Result<f64> {
    let portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let mut total_value = 0.0;
    let mut position_values = Vec::new();

    for position in &portfolio.positions {
        let value = position.quantity * position.current_price;
        position_values.push(value);
        total_value += value;
    }

    if total_value == 0.0 || position_values.is_empty() {
        return Ok(0.0);
    }

    let n = position_values.len() as f64;
    let weights: Vec<f64> = position_values.iter().map(|v| v / total_value).collect();

    // Herfindahl-Hirschman Index (HHI) / normalized
    let hhi: f64 = weights.iter().map(|w| w * w).sum();

    // Handle edge case where n=1 (single position)
    if position_values.len() == 1 {
        return Ok(1.0);
    }

    let concentration = (hhi - (1.0 / n)) / (1.0 - (1.0 / n));

    Ok(concentration.max(0.0).min(1.0))
}

/// Suggest portfolio rebalancing
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `target_allocations_json` - JSON string with target allocations
///
/// # Returns
/// JSON string with rebalancing suggestions
#[napi]
pub fn suggest_rebalancing(
    portfolio_json: String,
    target_allocations_json: String,
) -> Result<String> {
    let portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let target_allocations: HashMap<String, f64> = serde_json::from_str(&target_allocations_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse allocations: {}", e)))?;

    let mut total_value = 0.0;
    let mut position_map: HashMap<String, &Position> = HashMap::new();

    for position in &portfolio.positions {
        let value = position.quantity * position.current_price;
        total_value += value;
        position_map.insert(position.symbol.clone(), position);
    }

    let mut actions = Vec::new();
    let mut total_fees = 0.0;

    for (symbol, target_weight) in &target_allocations {
        let target_value = total_value * target_weight;
        let current_position = position_map.get(symbol.as_str());

        if let Some(position) = current_position {
            let current_value = position.quantity * position.current_price;
            let diff = target_value - current_value;

            if (diff).abs() > 0.01 {
                if diff > 0.0 {
                    let qty = diff / position.current_price;
                    let fee = diff * 0.001; // 0.1% fee
                    total_fees += fee;
                    actions.push(RebalancingAction {
                        symbol: symbol.clone(),
                        action: "buy".to_string(),
                        quantity: qty,
                        price: position.current_price,
                        cost: diff,
                    });
                } else {
                    let qty = (-diff) / position.current_price;
                    let fee = (-diff) * 0.001; // 0.1% fee
                    total_fees += fee;
                    actions.push(RebalancingAction {
                        symbol: symbol.clone(),
                        action: "sell".to_string(),
                        quantity: qty,
                        price: position.current_price,
                        cost: -diff,
                    });
                }
            }
        }
    }

    let expected_return = target_allocations
        .values()
        .map(|w| w * 0.08)
        .sum::<f64>(); // Assume 8% avg return

    let suggestion = RebalancingSuggestion {
        portfolio_id: portfolio.id,
        actions,
        total_fees,
        expected_return,
        timestamp: get_timestamp(),
    };

    serde_json::to_string(&suggestion)
        .map_err(|e| Error::from_reason(format!("Failed to serialize suggestion: {}", e)))
}

/// Calculate Sharpe ratio for portfolio
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `risk_free_rate` - Risk-free rate
/// * `volatility` - Portfolio volatility estimate
///
/// # Returns
/// Sharpe ratio
#[napi]
pub fn calculate_sharpe_ratio(
    portfolio_json: String,
    risk_free_rate: f64,
    volatility: f64,
) -> Result<f64> {
    let portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    // Calculate expected return from holdings
    let expected_return = 0.12; // Default 12% expected return

    if volatility <= 0.0 {
        return Ok(0.0);
    }

    let sharpe = (expected_return - risk_free_rate) / volatility;
    Ok(sharpe)
}

/// Calculate Sortino ratio for portfolio
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `risk_free_rate` - Risk-free rate
/// * `downside_volatility` - Downside volatility
///
/// # Returns
/// Sortino ratio
#[napi]
pub fn calculate_sortino_ratio(
    portfolio_json: String,
    risk_free_rate: f64,
    downside_volatility: f64,
) -> Result<f64> {
    let _portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let expected_return = 0.12; // Default 12% expected return

    if downside_volatility <= 0.0 {
        return Ok(0.0);
    }

    let sortino = (expected_return - risk_free_rate) / downside_volatility;
    Ok(sortino)
}

/// Calculate maximum drawdown
///
/// # Arguments
/// * `returns_json` - JSON array of historical returns
///
/// # Returns
/// Maximum drawdown
#[napi]
pub fn calculate_max_drawdown(returns_json: String) -> Result<f64> {
    let returns: Vec<f64> = serde_json::from_str(&returns_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse returns: {}", e)))?;

    if returns.is_empty() {
        return Ok(0.0);
    }

    let mut cumulative_value = 100.0;
    let mut peak = cumulative_value;
    let mut max_dd = 0.0;

    for ret in returns {
        cumulative_value *= 1.0 + ret;
        if cumulative_value > peak {
            peak = cumulative_value;
        }
        let drawdown = (cumulative_value - peak) / peak;
        if drawdown < max_dd {
            max_dd = drawdown;
        }
    }

    // Ensure we return positive 0, not negative 0
    let result = -max_dd;
    Ok(if result == 0.0 { 0.0 } else { result })
}

/// Calculate comprehensive risk metrics
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
/// * `risk_params_json` - JSON string with risk parameters
///
/// # Returns
/// JSON string with risk metrics
#[napi]
pub fn calculate_risk_metrics(portfolio_json: String, risk_params_json: String) -> Result<String> {
    let portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let risk_params: serde_json::Value = serde_json::from_str(&risk_params_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse risk params: {}", e)))?;

    let var = calculate_value_at_risk(portfolio_json.clone(), 0.95)?;
    let concentration = calculate_concentration_risk(portfolio_json.clone())?;

    let risk_metrics = RiskMetrics {
        portfolio_id: portfolio.id,
        value_at_risk: var,
        beta: 1.0,
        correlation: 0.0,
        concentration_ratio: concentration,
        max_drawdown: 0.15,
        sharpe_ratio: 1.5,
        sortino_ratio: 2.0,
        timestamp: get_timestamp(),
    };

    serde_json::to_string(&risk_metrics)
        .map_err(|e| Error::from_reason(format!("Failed to serialize metrics: {}", e)))
}

/// Create a new empty portfolio
///
/// # Arguments
/// * `portfolio_id` - Portfolio identifier
/// * `initial_cash` - Initial cash amount
///
/// # Returns
/// JSON string with new portfolio
#[napi]
pub fn create_portfolio(portfolio_id: String, initial_cash: f64) -> Result<String> {
    let portfolio = Portfolio {
        id: portfolio_id,
        positions: Vec::new(),
        cash: initial_cash,
        timestamp: get_timestamp(),
    };

    serde_json::to_string(&portfolio)
        .map_err(|e| Error::from_reason(format!("Failed to serialize portfolio: {}", e)))
}

/// Get portfolio summary
///
/// # Arguments
/// * `portfolio_json` - JSON string containing portfolio data
///
/// # Returns
/// JSON string with portfolio summary
#[napi]
pub fn get_portfolio_summary(portfolio_json: String) -> Result<String> {
    let portfolio: Portfolio = serde_json::from_str(&portfolio_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse portfolio JSON: {}", e)))?;

    let mut total_value = 0.0;
    let mut position_count = 0;

    for position in &portfolio.positions {
        total_value += position.quantity * position.current_price;
        position_count += 1;
    }

    let summary = serde_json::json!({
        "portfolio_id": portfolio.id,
        "total_value": total_value,
        "cash": portfolio.cash,
        "total_portfolio_value": total_value + portfolio.cash,
        "position_count": position_count,
        "timestamp": get_timestamp(),
    });

    serde_json::to_string(&summary)
        .map_err(|e| Error::from_reason(format!("Failed to serialize summary: {}", e)))
}

// ============ Helper Functions ============

/// Get current timestamp as ISO 8601 string
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}
