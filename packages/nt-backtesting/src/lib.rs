use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Represents a single trade execution
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Trade {
    symbol: String,
    entry_price: f64,
    exit_price: f64,
    quantity: i32,
    entry_time: i64,
    exit_time: i64,
    pnl: f64,
    return_pct: f64,
}

/// Represents historical price data
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HistoricalData {
    symbol: String,
    timestamp: i64,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    volume: i64,
}

/// Represents backtesting configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BacktestConfig {
    initial_capital: f64,
    commission_per_trade: f64,
    slippage_pct: f64,
    max_positions: i32,
    risk_per_trade: f64,
}

/// Represents performance metrics
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PerformanceMetrics {
    total_return_pct: f64,
    sharpe_ratio: f64,
    max_drawdown_pct: f64,
    win_rate: f64,
    profit_factor: f64,
    cumulative_pnl: f64,
}

/// Represents backtest results
#[derive(Serialize, Deserialize, Debug)]
pub struct BacktestResult {
    total_trades: i32,
    winning_trades: i32,
    losing_trades: i32,
    total_pnl: f64,
    total_return_pct: f64,
    sharpe_ratio: f64,
    max_drawdown_pct: f64,
    win_rate: f64,
    profit_factor: f64,
    trades: Vec<Trade>,
    final_capital: f64,
    timestamp: i64,
}

/// Execute a trade with commission and slippage
///
/// # Arguments
/// * `entry_price` - Entry price of the trade
/// * `exit_price` - Exit price of the trade
/// * `quantity` - Number of units
/// * `commission` - Commission per trade
/// * `slippage_pct` - Slippage percentage
///
/// # Returns
/// PnL from the trade
#[napi]
pub fn execute_trade(
    entry_price: f64,
    exit_price: f64,
    quantity: i32,
    commission: f64,
    slippage_pct: f64,
) -> Result<f64> {
    if entry_price <= 0.0 || exit_price <= 0.0 {
        return Err(Error::from_reason("Prices must be positive"));
    }
    if quantity <= 0 {
        return Err(Error::from_reason("Quantity must be positive"));
    }

    // Apply slippage to exit price
    let exit_price_with_slippage = exit_price * (1.0 + slippage_pct / 100.0);

    // Calculate gross P&L
    let gross_pnl = (exit_price_with_slippage - entry_price) * quantity as f64;

    // Subtract commission
    let net_pnl = gross_pnl - commission;

    Ok(net_pnl)
}

/// Calculate Sharpe ratio from returns
///
/// # Arguments
/// * `returns_json` - JSON array of returns
/// * `risk_free_rate` - Risk-free rate (annual)
///
/// # Returns
/// Sharpe ratio value
#[napi]
pub fn calculate_sharpe_ratio(returns_json: String, risk_free_rate: f64) -> Result<f64> {
    let returns: Vec<f64> = match serde_json::from_str(&returns_json) {
        Ok(r) => r,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse returns: {}",
                e
            )))
        }
    };

    if returns.is_empty() {
        return Ok(0.0);
    }

    // Calculate mean return
    let mean_return = returns.iter().sum::<f64>() / returns.len() as f64;

    // Calculate standard deviation
    let variance = returns
        .iter()
        .map(|r| (r - mean_return).powi(2))
        .sum::<f64>()
        / returns.len() as f64;

    let std_dev = variance.sqrt();

    if std_dev == 0.0 {
        return Ok(0.0);
    }

    // Calculate Sharpe ratio (daily risk-free rate)
    let daily_risk_free_rate = risk_free_rate / 252.0;
    let sharpe = (mean_return - daily_risk_free_rate) / std_dev * 252.0_f64.sqrt();

    Ok(sharpe)
}

/// Calculate maximum drawdown percentage
///
/// # Arguments
/// * `equity_json` - JSON array of equity values over time
///
/// # Returns
/// Maximum drawdown as percentage
#[napi]
pub fn calculate_max_drawdown(equity_json: String) -> Result<f64> {
    let equity: Vec<f64> = match serde_json::from_str(&equity_json) {
        Ok(e) => e,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse equity: {}",
                e
            )))
        }
    };

    if equity.is_empty() {
        return Ok(0.0);
    }

    let mut max_equity = equity[0];
    let mut max_drawdown = 0.0;

    for &current_equity in &equity[1..] {
        if current_equity > max_equity {
            max_equity = current_equity;
        }

        let drawdown = (max_equity - current_equity) / max_equity;
        if drawdown > max_drawdown {
            max_drawdown = drawdown;
        }
    }

    Ok(max_drawdown * 100.0)
}

/// Calculate total return percentage
///
/// # Arguments
/// * `initial_capital` - Starting capital
/// * `final_capital` - Ending capital
///
/// # Returns
/// Total return as percentage
#[napi]
pub fn calculate_return_pct(initial_capital: f64, final_capital: f64) -> Result<f64> {
    if initial_capital <= 0.0 {
        return Err(Error::from_reason("Initial capital must be positive"));
    }

    let return_pct = ((final_capital - initial_capital) / initial_capital) * 100.0;
    Ok(return_pct)
}

/// Process trades and calculate metrics
///
/// # Arguments
/// * `trades_json` - JSON array of trades
/// * `initial_capital` - Initial capital
/// * `risk_free_rate` - Risk-free rate
///
/// # Returns
/// JSON string with calculated metrics
#[napi]
pub fn process_trades(
    trades_json: String,
    initial_capital: f64,
    risk_free_rate: f64,
) -> Result<String> {
    let trades: Vec<Trade> = match serde_json::from_str(&trades_json) {
        Ok(t) => t,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trades: {}",
                e
            )))
        }
    };

    if trades.is_empty() {
        return Ok(serde_json::to_string(&BacktestResult {
            total_trades: 0,
            winning_trades: 0,
            losing_trades: 0,
            total_pnl: 0.0,
            total_return_pct: 0.0,
            sharpe_ratio: 0.0,
            max_drawdown_pct: 0.0,
            win_rate: 0.0,
            profit_factor: 0.0,
            trades: vec![],
            final_capital: initial_capital,
            timestamp: get_current_timestamp(),
        })
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
    }

    // Calculate metrics
    let total_trades = trades.len() as i32;
    let total_pnl: f64 = trades.iter().map(|t| t.pnl).sum();
    let final_capital = initial_capital + total_pnl;

    let winning_trades = trades.iter().filter(|t| t.pnl > 0.0).count() as i32;
    let losing_trades = trades.iter().filter(|t| t.pnl < 0.0).count() as i32;

    let win_rate = if total_trades > 0 {
        (winning_trades as f64 / total_trades as f64) * 100.0
    } else {
        0.0
    };

    // Calculate equity curve
    let mut equity_curve = vec![initial_capital];
    let mut current_equity = initial_capital;
    for trade in &trades {
        current_equity += trade.pnl;
        equity_curve.push(current_equity);
    }

    // Calculate metrics
    let max_drawdown_pct = calculate_max_drawdown(serde_json::to_string(&equity_curve).unwrap())
        .unwrap_or(0.0);

    let returns: Vec<f64> = trades.iter().map(|t| t.return_pct / 100.0).collect();
    let sharpe_ratio =
        calculate_sharpe_ratio(serde_json::to_string(&returns).unwrap(), risk_free_rate)
            .unwrap_or(0.0);

    let total_return_pct = calculate_return_pct(initial_capital, final_capital).unwrap_or(0.0);

    // Calculate profit factor
    let gross_profit: f64 = trades.iter().filter(|t| t.pnl > 0.0).map(|t| t.pnl).sum();
    let gross_loss: f64 = trades
        .iter()
        .filter(|t| t.pnl < 0.0)
        .map(|t| t.pnl.abs())
        .sum();

    let profit_factor = if gross_loss > 0.0 {
        gross_profit / gross_loss
    } else if gross_profit > 0.0 {
        gross_profit
    } else {
        0.0
    };

    let result = BacktestResult {
        total_trades,
        winning_trades,
        losing_trades,
        total_pnl,
        total_return_pct,
        sharpe_ratio,
        max_drawdown_pct,
        win_rate,
        profit_factor,
        trades: trades.clone(),
        final_capital,
        timestamp: get_current_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize result: {}",
            e
        ))),
    }
}

/// Analyze historical data for trading signals
///
/// # Arguments
/// * `data_json` - JSON array of historical data
/// * `window_size` - Moving average window
///
/// # Returns
/// JSON array with signals
#[napi]
pub fn analyze_historical_data(data_json: String, window_size: i32) -> Result<String> {
    let data: Vec<HistoricalData> = match serde_json::from_str(&data_json) {
        Ok(d) => d,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse data: {}",
                e
            )))
        }
    };

    if data.is_empty() || window_size <= 0 {
        return Ok("[]".to_string());
    }

    let window = window_size as usize;
    let mut signals = Vec::new();

    for i in window..data.len() {
        let window_data = &data[i - window..=i];
        let avg_close: f64 = window_data.iter().map(|d| d.close).sum::<f64>() / window as f64;
        let current_close = data[i].close;

        let signal = serde_json::json!({
            "timestamp": data[i].timestamp,
            "symbol": data[i].symbol,
            "current_price": current_close,
            "moving_average": avg_close,
            "signal": if current_close > avg_close { "BUY" } else { "SELL" },
            "price_above_ma": current_close > avg_close,
        });

        signals.push(signal);
    }

    match serde_json::to_string(&signals) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize signals: {}",
            e
        ))),
    }
}

/// Simulate strategy execution on historical data
///
/// # Arguments
/// * `config_json` - Backtest configuration
/// * `data_json` - Historical data
/// * `trades_json` - Pre-planned trades
///
/// # Returns
/// JSON string with backtest results
#[napi]
pub fn simulate_strategy(
    config_json: String,
    data_json: String,
    trades_json: String,
) -> Result<String> {
    let config: BacktestConfig = match serde_json::from_str(&config_json) {
        Ok(c) => c,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config: {}",
                e
            )))
        }
    };

    let _data: Vec<HistoricalData> = match serde_json::from_str(&data_json) {
        Ok(d) => d,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse data: {}",
                e
            )))
        }
    };

    let mut trades: Vec<Trade> = match serde_json::from_str(&trades_json) {
        Ok(t) => t,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trades: {}",
                e
            )))
        }
    };

    // Apply slippage and commission to all trades
    for trade in &mut trades {
        let pnl = execute_trade(
            trade.entry_price,
            trade.exit_price,
            trade.quantity,
            config.commission_per_trade,
            config.slippage_pct,
        )
        .unwrap_or(0.0);

        trade.pnl = pnl;
        trade.return_pct = (pnl / (trade.entry_price * trade.quantity as f64)) * 100.0;
    }

    // Calculate final metrics
    let total_pnl: f64 = trades.iter().map(|t| t.pnl).sum();
    let final_capital = config.initial_capital + total_pnl;

    let winning_trades = trades.iter().filter(|t| t.pnl > 0.0).count() as i32;
    let losing_trades = trades.iter().filter(|t| t.pnl < 0.0).count() as i32;
    let total_trades = trades.len() as i32;

    let win_rate = if total_trades > 0 {
        (winning_trades as f64 / total_trades as f64) * 100.0
    } else {
        0.0
    };

    let gross_profit: f64 = trades.iter().filter(|t| t.pnl > 0.0).map(|t| t.pnl).sum();
    let gross_loss: f64 = trades
        .iter()
        .filter(|t| t.pnl < 0.0)
        .map(|t| t.pnl.abs())
        .sum();

    let profit_factor = if gross_loss > 0.0 {
        gross_profit / gross_loss
    } else if gross_profit > 0.0 {
        gross_profit
    } else {
        0.0
    };

    // Calculate equity curve for drawdown
    let mut equity_curve = vec![config.initial_capital];
    let mut current_equity = config.initial_capital;
    for trade in &trades {
        current_equity += trade.pnl;
        equity_curve.push(current_equity);
    }

    let max_drawdown_pct = calculate_max_drawdown(serde_json::to_string(&equity_curve).unwrap())
        .unwrap_or(0.0);

    let returns: Vec<f64> = trades.iter().map(|t| t.return_pct / 100.0).collect();
    let sharpe_ratio = calculate_sharpe_ratio(serde_json::to_string(&returns).unwrap(), 0.02)
        .unwrap_or(0.0);

    let total_return_pct =
        calculate_return_pct(config.initial_capital, final_capital).unwrap_or(0.0);

    let result = BacktestResult {
        total_trades,
        winning_trades,
        losing_trades,
        total_pnl,
        total_return_pct,
        sharpe_ratio,
        max_drawdown_pct,
        win_rate,
        profit_factor,
        trades,
        final_capital,
        timestamp: get_current_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize result: {}",
            e
        ))),
    }
}

/// Generate sample trade data for testing
///
/// # Arguments
/// * `count` - Number of trades to generate
/// * `base_price` - Base price for trades
/// * `initial_capital` - Initial capital for calculations
///
/// # Returns
/// JSON array of generated trades
#[napi]
pub fn generate_sample_trades(
    count: i32,
    base_price: f64,
    initial_capital: f64,
) -> Result<String> {
    if count <= 0 || base_price <= 0.0 {
        return Err(Error::from_reason("Invalid parameters"));
    }

    let mut trades = Vec::new();
    let mut current_price = base_price;

    for i in 0..count {
        let price_change = (i as f64 * 0.5 - (count as f64 / 4.0)) * 0.01;
        let entry_price = current_price;
        let exit_price = current_price * (1.0 + price_change);

        current_price = exit_price;

        let quantity = ((initial_capital * 0.02) / entry_price) as i32;
        let gross_pnl = (exit_price - entry_price) * quantity as f64;
        let commission = quantity as f64 * 1.0;
        let pnl = gross_pnl - commission;

        let trade = Trade {
            symbol: format!("SYMBOL{}", i % 3),
            entry_price,
            exit_price,
            quantity,
            entry_time: 1000000 + (i as i64 * 3600),
            exit_time: 1000000 + ((i + 1) as i64 * 3600),
            pnl,
            return_pct: (pnl / (entry_price * quantity as f64)) * 100.0,
        };

        trades.push(trade);
    }

    match serde_json::to_string(&trades) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize trades: {}",
            e
        ))),
    }
}

// ============ Helper Functions ============

fn get_current_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}
