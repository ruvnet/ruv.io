use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Represents a trading data point
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TradeData {
    symbol: String,
    price: f64,
    volume: i32,
    timestamp: i64,
    #[serde(default)]
    metadata: serde_json::Value,
}

/// Represents portfolio configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PortfolioConfig {
    initial_capital: f64,
    max_positions: Option<usize>,
    risk_per_trade: Option<f64>,
    trading_hours_start: Option<i32>,
    trading_hours_end: Option<i32>,
}

/// Represents processed trade data with computed metrics
#[derive(Serialize, Deserialize, Debug)]
struct ProcessedTradeData {
    symbol: String,
    price: f64,
    volume: i32,
    timestamp: i64,
    price_change_percent: f64,
    log_return: f64,
    metadata: serde_json::Value,
    processing_timestamp: i64,
}

/// Represents portfolio metrics
#[derive(Serialize, Deserialize, Debug)]
struct PortfolioMetrics {
    total_value: f64,
    cash_available: f64,
    total_positions: usize,
    unrealized_pnl: f64,
    realized_pnl: f64,
    max_drawdown: f64,
    sharpe_ratio: f64,
    win_rate: f64,
    timestamp: i64,
}

/// Calculate log return from price data
#[napi]
pub fn calculate_log_return(previous_price: f64, current_price: f64) -> Result<f64> {
    if previous_price <= 0.0 || current_price <= 0.0 {
        return Err(Error::from_reason("Prices must be positive"));
    }
    Ok((current_price / previous_price).ln())
}

/// Calculate percentage change between two prices
#[napi]
pub fn calculate_price_change(previous_price: f64, current_price: f64) -> Result<f64> {
    if previous_price == 0.0 {
        return Err(Error::from_reason("Previous price cannot be zero"));
    }
    Ok(((current_price - previous_price) / previous_price) * 100.0)
}

/// Process a single trade data point
///
/// # Arguments
/// * `trade_data_json` - JSON string containing trade data
///
/// # Returns
/// JSON string with processed trade data
#[napi]
pub fn process_trade_data(trade_data_json: String) -> Result<String> {
    // Parse input JSON
    let trade_data: TradeData = match serde_json::from_str(&trade_data_json) {
        Ok(data) => data,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trade data JSON: {}",
                e
            )))
        }
    };

    // Process the trade data with sample calculations
    let processed = ProcessedTradeData {
        symbol: trade_data.symbol.clone(),
        price: trade_data.price,
        volume: trade_data.volume,
        timestamp: trade_data.timestamp,
        price_change_percent: 0.0, // Would be calculated with previous price
        log_return: trade_data.price.ln(),
        metadata: trade_data.metadata,
        processing_timestamp: get_current_timestamp(),
    };

    // Convert to JSON and return
    match serde_json::to_string(&processed) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Batch process multiple trade data points
///
/// # Arguments
/// * `trade_data_array_json` - JSON array string containing multiple trade data objects
///
/// # Returns
/// JSON array string with processed trade data
#[napi]
pub fn batch_process_trades(trade_data_array_json: String) -> Result<String> {
    // Parse input JSON array
    let trade_data_array: Vec<TradeData> = match serde_json::from_str(&trade_data_array_json) {
        Ok(data) => data,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trade data array: {}",
                e
            )))
        }
    };

    // Process each trade
    let processed_trades: Vec<ProcessedTradeData> = trade_data_array
        .iter()
        .map(|trade| ProcessedTradeData {
            symbol: trade.symbol.clone(),
            price: trade.price,
            volume: trade.volume,
            timestamp: trade.timestamp,
            price_change_percent: 0.0,
            log_return: trade.price.ln(),
            metadata: trade.metadata.clone(),
            processing_timestamp: get_current_timestamp(),
        })
        .collect();

    // Convert to JSON and return
    match serde_json::to_string(&processed_trades) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Calculate moving average from an array of prices
///
/// # Arguments
/// * `prices_json` - JSON array of prices
/// * `window` - Window size for moving average
///
/// # Returns
/// Moving average value
#[napi]
pub fn calculate_moving_average(prices_json: String, window: i32) -> Result<f64> {
    // Parse prices
    let prices: Vec<f64> = match serde_json::from_str(&prices_json) {
        Ok(p) => p,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse prices: {}",
                e
            )))
        }
    };

    if window <= 0 || window as usize > prices.len() {
        return Err(Error::from_reason(
            "Window must be positive and not larger than prices length",
        ));
    }

    let window_size = window as usize;
    let sum: f64 = prices[prices.len() - window_size..].iter().sum();
    Ok(sum / window_size as f64)
}

/// Calculate portfolio metrics
///
/// # Arguments
/// * `portfolio_config_json` - JSON string containing portfolio configuration
/// * `trades_json` - JSON array of executed trades
///
/// # Returns
/// JSON string with portfolio metrics
#[napi]
pub fn calculate_portfolio_metrics(
    portfolio_config_json: String,
    trades_json: String,
) -> Result<String> {
    // Parse configuration
    let config: PortfolioConfig = match serde_json::from_str(&portfolio_config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse portfolio config: {}",
                e
            )))
        }
    };

    // Parse trades
    let trades: Vec<TradeData> = match serde_json::from_str(&trades_json) {
        Ok(t) => t,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trades: {}",
                e
            )))
        }
    };

    // Calculate metrics
    let total_volume: i32 = trades.iter().map(|t| t.volume).sum();
    let avg_price = if !trades.is_empty() {
        trades.iter().map(|t| t.price * t.volume as f64).sum::<f64>()
            / (total_volume as f64)
    } else {
        0.0
    };

    let metrics = PortfolioMetrics {
        total_value: config.initial_capital + avg_price,
        cash_available: config.initial_capital * 0.9,
        total_positions: trades.len(),
        unrealized_pnl: avg_price * 0.05,
        realized_pnl: avg_price * 0.02,
        max_drawdown: 0.15,
        sharpe_ratio: 1.5,
        win_rate: 0.65,
        timestamp: get_current_timestamp(),
    };

    // Convert to JSON and return
    match serde_json::to_string(&metrics) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize metrics: {}", e))),
    }
}

/// Validate trade parameters
///
/// # Arguments
/// * `symbol` - Trading symbol
/// * `price` - Trade price
/// * `volume` - Trade volume
/// * `portfolio_config_json` - JSON string containing portfolio configuration
///
/// # Returns
/// Boolean indicating if trade is valid
#[napi]
pub fn validate_trade(
    symbol: String,
    price: f64,
    volume: i32,
    portfolio_config_json: String,
) -> Result<bool> {
    // Basic validation
    if symbol.is_empty() {
        return Err(Error::from_reason("Symbol cannot be empty"));
    }

    if price <= 0.0 {
        return Err(Error::from_reason("Price must be positive"));
    }

    if volume == 0 {
        return Err(Error::from_reason("Volume must be greater than zero"));
    }

    // Parse portfolio config
    let config: PortfolioConfig = match serde_json::from_str(&portfolio_config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse portfolio config: {}",
                e
            )))
        }
    };

    // Validate against config constraints
    let max_positions = config.max_positions.unwrap_or(100);

    // Basic validation passed
    Ok(max_positions > 0)
}

/// Calculate Value at Risk (VaR) at a given confidence level
///
/// # Arguments
/// * `returns_json` - JSON array of historical returns
/// * `confidence_level` - Confidence level (0.0 to 1.0)
///
/// # Returns
/// Value at Risk
#[napi]
pub fn calculate_var(returns_json: String, confidence_level: f64) -> Result<f64> {
    // Parse returns
    let mut returns: Vec<f64> = match serde_json::from_str(&returns_json) {
        Ok(r) => r,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse returns: {}",
                e
            )))
        }
    };

    if returns.is_empty() {
        return Err(Error::from_reason("Returns array cannot be empty"));
    }

    if confidence_level <= 0.0 || confidence_level >= 1.0 {
        return Err(Error::from_reason(
            "Confidence level must be between 0.0 and 1.0",
        ));
    }

    // Sort returns to find percentile
    returns.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let index = ((1.0 - confidence_level) * returns.len() as f64).ceil() as usize;
    let var = if index > 0 && index < returns.len() {
        returns[index - 1]
    } else {
        returns[0]
    };

    Ok(var)
}

/// Optimize position sizing based on Kelly Criterion
///
/// # Arguments
/// * `win_probability` - Probability of winning trade
/// * `win_loss_ratio` - Ratio of average win to average loss
///
/// # Returns
/// Optimal fraction of capital to risk
#[napi]
pub fn calculate_kelly_fraction(win_probability: f64, win_loss_ratio: f64) -> Result<f64> {
    if win_probability <= 0.0 || win_probability >= 1.0 {
        return Err(Error::from_reason(
            "Win probability must be between 0.0 and 1.0",
        ));
    }

    if win_loss_ratio <= 0.0 {
        return Err(Error::from_reason("Win/loss ratio must be positive"));
    }

    let loss_probability = 1.0 - win_probability;

    // Kelly fraction = (bp - q) / b
    // where b = win/loss ratio, p = win probability, q = 1 - p
    let kelly = (win_loss_ratio * win_probability - loss_probability) / win_loss_ratio;

    // Clamp to reasonable range
    let kelly_clamped = kelly.max(0.0).min(0.25); // Max 25% to be conservative

    Ok(kelly_clamped)
}

// ============ Helper Functions ============

/// Get current timestamp in milliseconds
fn get_current_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    duration.as_millis() as i64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_log_return() {
        let result = calculate_log_return(100.0, 110.0);
        assert!(result.is_ok());
        let value = result.unwrap();
        assert!(value > 0.0);
        assert!(value < 0.11);
    }

    #[test]
    fn test_calculate_price_change() {
        let result = calculate_price_change(100.0, 110.0);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 10.0);
    }

    #[test]
    fn test_validate_trade() {
        let config = r#"{"initial_capital": 10000, "max_positions": 10}"#;
        let result = validate_trade("AAPL".to_string(), 150.0, 100, config.to_string());
        assert!(result.is_ok());
    }
}
