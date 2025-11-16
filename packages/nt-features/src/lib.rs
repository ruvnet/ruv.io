use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Price data for technical analysis
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PriceData {
    open: Vec<f64>,
    high: Vec<f64>,
    low: Vec<f64>,
    close: Vec<f64>,
    volume: Option<Vec<f64>>,
}

/// Technical indicator configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IndicatorConfig {
    period: Option<usize>,
    fast_period: Option<usize>,
    slow_period: Option<usize>,
    signal_period: Option<usize>,
    dev_multiplier: Option<f64>,
    threshold: Option<f64>,
}

/// Feature normalization options
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NormalizationOptions {
    method: Option<String>, // "zscore", "minmax", "log"
    feature_range: Option<(f64, f64)>,
    epsilon: Option<f64>,
}

/// RSI (Relative Strength Index) calculation result
#[derive(Serialize, Deserialize, Debug)]
pub struct RSIResult {
    values: Vec<f64>,
    period: usize,
}

/// MACD calculation result
#[derive(Serialize, Deserialize, Debug)]
pub struct MACDResult {
    macd_line: Vec<f64>,
    signal_line: Vec<f64>,
    histogram: Vec<f64>,
}

/// Bollinger Bands calculation result
#[derive(Serialize, Deserialize, Debug)]
pub struct BollingerBandsResult {
    upper_band: Vec<f64>,
    middle_band: Vec<f64>,
    lower_band: Vec<f64>,
    bandwidth: Vec<f64>,
}

/// Normalization result
#[derive(Serialize, Deserialize, Debug)]
pub struct NormalizationResult {
    normalized: Vec<f64>,
    mean: Option<f64>,
    std_dev: Option<f64>,
    min: Option<f64>,
    max: Option<f64>,
}

/// Feature statistics
#[derive(Serialize, Deserialize, Debug)]
pub struct FeatureStats {
    mean: f64,
    std_dev: f64,
    min: f64,
    max: f64,
    median: f64,
    skewness: f64,
    kurtosis: f64,
}

/// FeatureEngine for technical indicators and transformations
#[napi]
pub fn calculate_rsi(prices_json: String, config_json: String) -> Result<String> {
    let prices: Vec<f64> = serde_json::from_str(&prices_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse prices: {}", e)))?;

    let config: IndicatorConfig = serde_json::from_str(&config_json)
        .unwrap_or(IndicatorConfig {
            period: Some(14),
            fast_period: None,
            slow_period: None,
            signal_period: None,
            dev_multiplier: None,
            threshold: None,
        });

    let period = config.period.unwrap_or(14);

    if prices.len() < period + 1 {
        return Err(Error::from_reason("Insufficient price data for RSI calculation"));
    }

    let mut rsi_values = vec![0.0; prices.len()];
    let mut gains = 0.0;
    let mut losses = 0.0;

    // Calculate initial gains and losses
    for i in 1..=period {
        let change = prices[i] - prices[i - 1];
        if change > 0.0 {
            gains += change;
        } else {
            losses += -change;
        }
    }

    let mut avg_gain = gains / period as f64;
    let mut avg_loss = losses / period as f64;

    // Calculate RSI values
    for i in (period + 1)..prices.len() {
        let change = prices[i] - prices[i - 1];
        let current_gain = if change > 0.0 { change } else { 0.0 };
        let current_loss = if change < 0.0 { -change } else { 0.0 };

        avg_gain = (avg_gain * (period - 1) as f64 + current_gain) / period as f64;
        avg_loss = (avg_loss * (period - 1) as f64 + current_loss) / period as f64;

        let rs = if avg_loss != 0.0 {
            avg_gain / avg_loss
        } else {
            100.0
        };

        rsi_values[i] = 100.0 - (100.0 / (1.0 + rs));
    }

    let result = RSIResult {
        values: rsi_values,
        period,
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize RSI result: {}", e)))
}

/// Calculate MACD (Moving Average Convergence Divergence)
#[napi]
pub fn calculate_macd(prices_json: String, config_json: String) -> Result<String> {
    let prices: Vec<f64> = serde_json::from_str(&prices_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse prices: {}", e)))?;

    let config: IndicatorConfig = serde_json::from_str(&config_json)
        .unwrap_or(IndicatorConfig {
            period: None,
            fast_period: Some(12),
            slow_period: Some(26),
            signal_period: Some(9),
            dev_multiplier: None,
            threshold: None,
        });

    let fast_period = config.fast_period.unwrap_or(12);
    let slow_period = config.slow_period.unwrap_or(26);
    let signal_period = config.signal_period.unwrap_or(9);

    if prices.len() < slow_period {
        return Err(Error::from_reason("Insufficient price data for MACD calculation"));
    }

    let fast_ema = calculate_ema(&prices, fast_period);
    let slow_ema = calculate_ema(&prices, slow_period);

    let mut macd_line = vec![0.0; prices.len()];
    for i in 0..prices.len() {
        macd_line[i] = fast_ema[i] - slow_ema[i];
    }

    let signal_line = calculate_ema(&macd_line, signal_period);

    let mut histogram = vec![0.0; prices.len()];
    for i in 0..prices.len() {
        histogram[i] = macd_line[i] - signal_line[i];
    }

    let result = MACDResult {
        macd_line,
        signal_line,
        histogram,
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize MACD result: {}", e)))
}

/// Calculate Bollinger Bands
#[napi]
pub fn calculate_bollinger_bands(prices_json: String, config_json: String) -> Result<String> {
    let prices: Vec<f64> = serde_json::from_str(&prices_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse prices: {}", e)))?;

    let config: IndicatorConfig = serde_json::from_str(&config_json)
        .unwrap_or(IndicatorConfig {
            period: Some(20),
            fast_period: None,
            slow_period: None,
            signal_period: None,
            dev_multiplier: Some(2.0),
            threshold: None,
        });

    let period = config.period.unwrap_or(20);
    let dev_multiplier = config.dev_multiplier.unwrap_or(2.0);

    if prices.len() < period {
        return Err(Error::from_reason(
            "Insufficient price data for Bollinger Bands calculation",
        ));
    }

    let mut upper_band = vec![0.0; prices.len()];
    let mut middle_band = vec![0.0; prices.len()];
    let mut lower_band = vec![0.0; prices.len()];
    let mut bandwidth = vec![0.0; prices.len()];

    for i in period..prices.len() {
        let window = &prices[i - period..=i];
        let mean = window.iter().sum::<f64>() / period as f64;
        let variance = window
            .iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>()
            / period as f64;
        let std_dev = variance.sqrt();

        middle_band[i] = mean;
        upper_band[i] = mean + dev_multiplier * std_dev;
        lower_band[i] = mean - dev_multiplier * std_dev;
        bandwidth[i] = upper_band[i] - lower_band[i];
    }

    let result = BollingerBandsResult {
        upper_band,
        middle_band,
        lower_band,
        bandwidth,
    };

    serde_json::to_string(&result).map_err(|e| {
        Error::from_reason(format!("Failed to serialize Bollinger Bands result: {}", e))
    })
}

/// Calculate Stochastic Oscillator
#[napi]
pub fn calculate_stochastic(
    price_data_json: String,
    config_json: String,
) -> Result<String> {
    let data: PriceData = serde_json::from_str(&price_data_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse price data: {}", e)))?;

    let config: IndicatorConfig = serde_json::from_str(&config_json)
        .unwrap_or(IndicatorConfig {
            period: Some(14),
            fast_period: Some(3),
            slow_period: Some(3),
            signal_period: None,
            dev_multiplier: None,
            threshold: None,
        });

    let period = config.period.unwrap_or(14);
    let smooth_k = config.fast_period.unwrap_or(3);

    if data.low.len() < period {
        return Err(Error::from_reason(
            "Insufficient price data for Stochastic calculation",
        ));
    }

    let mut k_values = vec![0.0; data.low.len()];
    let mut d_values = vec![0.0; data.low.len()];

    for i in period..data.low.len() {
        let window_low = data.low[i - period..=i].iter().cloned().fold(f64::INFINITY, f64::min);
        let window_high = data.high[i - period..=i]
            .iter()
            .cloned()
            .fold(f64::NEG_INFINITY, f64::max);

        let close = data.close[i];
        let range = window_high - window_low;

        if range != 0.0 {
            k_values[i] = 100.0 * (close - window_low) / range;
        } else {
            k_values[i] = 50.0;
        }
    }

    // Smooth K values
    for i in smooth_k..k_values.len() {
        d_values[i] = k_values[i - smooth_k..=i].iter().sum::<f64>() / smooth_k as f64;
    }

    let result = serde_json::json!({
        "k_values": k_values,
        "d_values": d_values,
        "period": period
    });

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize Stochastic result: {}", e)))
}

/// Calculate Average True Range (ATR)
#[napi]
pub fn calculate_atr(price_data_json: String, config_json: String) -> Result<String> {
    let data: PriceData = serde_json::from_str(&price_data_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse price data: {}", e)))?;

    let config: IndicatorConfig = serde_json::from_str(&config_json)
        .unwrap_or(IndicatorConfig {
            period: Some(14),
            fast_period: None,
            slow_period: None,
            signal_period: None,
            dev_multiplier: None,
            threshold: None,
        });

    let period = config.period.unwrap_or(14);

    if data.low.len() < period {
        return Err(Error::from_reason("Insufficient price data for ATR calculation"));
    }

    let mut true_ranges = vec![0.0; data.low.len()];
    let mut atr_values = vec![0.0; data.low.len()];

    // Calculate true range
    for i in 1..data.low.len() {
        let tr1 = data.high[i] - data.low[i];
        let tr2 = (data.high[i] - data.close[i - 1]).abs();
        let tr3 = (data.low[i] - data.close[i - 1]).abs();

        true_ranges[i] = tr1.max(tr2).max(tr3);
    }

    // Calculate ATR
    let mut sum = 0.0;
    for i in 1..=period {
        sum += true_ranges[i];
    }

    atr_values[period] = sum / period as f64;

    for i in (period + 1)..true_ranges.len() {
        atr_values[i] =
            (atr_values[i - 1] * (period - 1) as f64 + true_ranges[i]) / period as f64;
    }

    let result = serde_json::json!({
        "atr_values": atr_values,
        "period": period
    });

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize ATR result: {}", e)))
}

/// Normalize features using various methods
#[napi]
pub fn normalize_features(features_json: String, options_json: String) -> Result<String> {
    let features: Vec<f64> = serde_json::from_str(&features_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse features: {}", e)))?;

    let options: NormalizationOptions = serde_json::from_str(&options_json)
        .unwrap_or(NormalizationOptions {
            method: Some("zscore".to_string()),
            feature_range: None,
            epsilon: Some(1e-8),
        });

    let method = options.method.unwrap_or_else(|| "zscore".to_string());
    let epsilon = options.epsilon.unwrap_or(1e-8);

    match method.as_str() {
        "zscore" => {
            let mean = features.iter().sum::<f64>() / features.len() as f64;
            let variance = features
                .iter()
                .map(|&x| (x - mean).powi(2))
                .sum::<f64>()
                / features.len() as f64;
            let std_dev = (variance + epsilon).sqrt();

            let result = NormalizationResult {
                normalized: features.iter().map(|&x| (x - mean) / std_dev).collect(),
                mean: Some(mean),
                std_dev: Some(std_dev),
                min: None,
                max: None,
            };

            serde_json::to_string(&result).map_err(|e| {
                Error::from_reason(format!("Failed to serialize normalization result: {}", e))
            })
        }
        "minmax" => {
            let min = features.iter().cloned().fold(f64::INFINITY, f64::min);
            let max = features.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
            let range = (max - min).max(epsilon);

            let (feature_min, feature_max) = options.feature_range.unwrap_or((0.0, 1.0));

            let result = NormalizationResult {
                normalized: features
                    .iter()
                    .map(|&x| {
                        ((x - min) / range) * (feature_max - feature_min) + feature_min
                    })
                    .collect(),
                mean: None,
                std_dev: None,
                min: Some(min),
                max: Some(max),
            };

            serde_json::to_string(&result).map_err(|e| {
                Error::from_reason(format!("Failed to serialize normalization result: {}", e))
            })
        }
        "log" => {
            let result = NormalizationResult {
                normalized: features
                    .iter()
                    .map(|&x| (x.max(epsilon)).ln())
                    .collect(),
                mean: None,
                std_dev: None,
                min: None,
                max: None,
            };

            serde_json::to_string(&result).map_err(|e| {
                Error::from_reason(format!("Failed to serialize normalization result: {}", e))
            })
        }
        _ => Err(Error::from_reason(format!(
            "Unknown normalization method: {}",
            method
        ))),
    }
}

/// Calculate rolling window statistics
#[napi]
pub fn calculate_rolling_stats(features_json: String, window_size: i32) -> Result<String> {
    let features: Vec<f64> = serde_json::from_str(&features_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse features: {}", e)))?;

    let window_size = window_size as usize;

    if window_size == 0 || window_size > features.len() {
        return Err(Error::from_reason("Invalid window size"));
    }

    let mut rolling_means = vec![0.0; features.len()];
    let mut rolling_stds = vec![0.0; features.len()];
    let mut rolling_mins = vec![0.0; features.len()];
    let mut rolling_maxs = vec![0.0; features.len()];

    for i in window_size..features.len() {
        let window = &features[i - window_size..=i];

        let mean = window.iter().sum::<f64>() / window_size as f64;
        let variance = window
            .iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>()
            / window_size as f64;

        rolling_means[i] = mean;
        rolling_stds[i] = variance.sqrt();
        rolling_mins[i] = window.iter().cloned().fold(f64::INFINITY, f64::min);
        rolling_maxs[i] = window.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    }

    let result = serde_json::json!({
        "means": rolling_means,
        "stds": rolling_stds,
        "mins": rolling_mins,
        "maxs": rolling_maxs,
        "window_size": window_size
    });

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize rolling stats: {}", e)))
}

/// Calculate feature statistics
#[napi]
pub fn calculate_feature_stats(features_json: String) -> Result<String> {
    let features: Vec<f64> = serde_json::from_str(&features_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse features: {}", e)))?;

    if features.is_empty() {
        return Err(Error::from_reason("Empty features array"));
    }

    let mean = features.iter().sum::<f64>() / features.len() as f64;
    let variance = features
        .iter()
        .map(|&x| (x - mean).powi(2))
        .sum::<f64>()
        / features.len() as f64;
    let std_dev = variance.sqrt();

    let mut sorted = features.clone();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median = if sorted.len() % 2 == 0 {
        (sorted[sorted.len() / 2 - 1] + sorted[sorted.len() / 2]) / 2.0
    } else {
        sorted[sorted.len() / 2]
    };

    let min = sorted[0];
    let max = sorted[sorted.len() - 1];

    // Calculate skewness
    let skewness = if std_dev != 0.0 {
        features
            .iter()
            .map(|&x| ((x - mean) / std_dev).powi(3))
            .sum::<f64>()
            / features.len() as f64
    } else {
        0.0
    };

    // Calculate kurtosis
    let kurtosis = if std_dev != 0.0 {
        features
            .iter()
            .map(|&x| ((x - mean) / std_dev).powi(4))
            .sum::<f64>()
            / features.len() as f64
            - 3.0
    } else {
        0.0
    };

    let result = FeatureStats {
        mean,
        std_dev,
        min,
        max,
        median,
        skewness,
        kurtosis,
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize feature stats: {}", e)))
}

/// Scale features to a specific range
#[napi]
pub fn scale_features(features_json: String, min_value: f64, max_value: f64) -> Result<String> {
    let features: Vec<f64> = serde_json::from_str(&features_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse features: {}", e)))?;

    let current_min = features.iter().cloned().fold(f64::INFINITY, f64::min);
    let current_max = features.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let current_range = (current_max - current_min).max(1e-8);
    let new_range = max_value - min_value;

    let scaled: Vec<f64> = features
        .iter()
        .map(|&x| {
            ((x - current_min) / current_range) * new_range + min_value
        })
        .collect();

    serde_json::to_string(&scaled)
        .map_err(|e| Error::from_reason(format!("Failed to serialize scaled features: {}", e)))
}

/// Detect outliers using Z-score method
#[napi]
pub fn detect_outliers(features_json: String, threshold: f64) -> Result<String> {
    let features: Vec<f64> = serde_json::from_str(&features_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse features: {}", e)))?;

    let mean = features.iter().sum::<f64>() / features.len() as f64;
    let variance = features
        .iter()
        .map(|&x| (x - mean).powi(2))
        .sum::<f64>()
        / features.len() as f64;
    let std_dev = (variance + 1e-8).sqrt();

    let mut outliers = vec![];
    let mut z_scores = vec![];

    for (i, &feature) in features.iter().enumerate() {
        let z_score = (feature - mean) / std_dev;
        z_scores.push(z_score);

        if z_score.abs() > threshold {
            outliers.push(serde_json::json!({
                "index": i,
                "value": feature,
                "z_score": z_score
            }));
        }
    }

    let result = serde_json::json!({
        "outliers": outliers,
        "z_scores": z_scores,
        "threshold": threshold,
        "outlier_count": outliers.len()
    });

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize outlier result: {}", e)))
}

/// Compute correlation between two feature arrays
#[napi]
pub fn calculate_correlation(features1_json: String, features2_json: String) -> Result<f64> {
    let features1: Vec<f64> = serde_json::from_str(&features1_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse features1: {}", e)))?;

    let features2: Vec<f64> = serde_json::from_str(&features2_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse features2: {}", e)))?;

    if features1.len() != features2.len() || features1.is_empty() {
        return Err(Error::from_reason("Features must have the same non-zero length"));
    }

    let mean1 = features1.iter().sum::<f64>() / features1.len() as f64;
    let mean2 = features2.iter().sum::<f64>() / features2.len() as f64;

    let mut covariance = 0.0;
    let mut var1 = 0.0;
    let mut var2 = 0.0;

    for i in 0..features1.len() {
        let dev1 = features1[i] - mean1;
        let dev2 = features2[i] - mean2;
        covariance += dev1 * dev2;
        var1 += dev1 * dev1;
        var2 += dev2 * dev2;
    }

    let correlation = if var1 > 0.0 && var2 > 0.0 {
        covariance / (var1.sqrt() * var2.sqrt())
    } else {
        0.0
    };

    Ok(correlation)
}

// ============ Helper Functions ============

/// Calculate exponential moving average
fn calculate_ema(prices: &[f64], period: usize) -> Vec<f64> {
    let mut ema = vec![0.0; prices.len()];

    if prices.len() < period {
        return ema;
    }

    let multiplier = 2.0 / (period as f64 + 1.0);

    // Initial SMA
    let initial_sum: f64 = prices[0..period].iter().sum();
    ema[period - 1] = initial_sum / period as f64;

    // Subsequent EMAs
    for i in period..prices.len() {
        ema[i] = prices[i] * multiplier + ema[i - 1] * (1.0 - multiplier);
    }

    ema
}
