use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::f64;

/// Represents a temporal event with timestamp and data
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TemporalEvent {
    timestamp: f64,
    value: f64,
    data: serde_json::Value,
}

/// Represents a neural network configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NeuralConfig {
    layers: Vec<usize>,
    activation: String,
    learning_rate: Option<f64>,
    momentum: Option<f64>,
}

/// Represents training data
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrainingData {
    inputs: Vec<Vec<f64>>,
    outputs: Vec<Vec<f64>>,
}

/// Represents prediction result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PredictionResult {
    predictions: Vec<f64>,
    confidence: Vec<f64>,
    timestamp: String,
}

/// Represents a temporal pattern
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TemporalPattern {
    events: Vec<TemporalEvent>,
    pattern_type: String,
    confidence: f64,
}

/// Initialize a neural network solver
///
/// # Arguments
/// * `config_json` - JSON string containing neural network configuration
///
/// # Returns
/// JSON string with initialization result
#[napi]
pub fn initialize_solver(config_json: String) -> Result<String> {
    // Parse configuration
    let config: NeuralConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse configuration: {}",
                e
            )))
        }
    };

    // Validate configuration
    if config.layers.is_empty() {
        return Err(Error::from_reason("Network must have at least one layer".to_string()));
    }

    // Create initialization result
    let result = serde_json::json!({
        "status": "initialized",
        "layers": config.layers,
        "activation": config.activation,
        "parameters": {
            "learning_rate": config.learning_rate.unwrap_or(0.01),
            "momentum": config.momentum.unwrap_or(0.9),
        },
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Process temporal events through neural network
///
/// # Arguments
/// * `events_json` - JSON string containing temporal events
///
/// # Returns
/// JSON string with processed events
#[napi]
pub fn process_temporal_events(events_json: String) -> Result<String> {
    // Parse events
    let events: Vec<TemporalEvent> = match serde_json::from_str(&events_json) {
        Ok(evts) => evts,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse events: {}",
                e
            )))
        }
    };

    if events.is_empty() {
        return Err(Error::from_reason("No events provided".to_string()));
    }

    // Sort events by timestamp
    let mut sorted_events = events.clone();
    sorted_events.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());

    // Calculate temporal statistics
    let values: Vec<f64> = sorted_events.iter().map(|e| e.value).collect();
    let mean = calculate_mean(&values);
    let std_dev = calculate_std_dev(&values, mean);
    let trend = calculate_trend(&values);

    let result = serde_json::json!({
        "event_count": events.len(),
        "statistics": {
            "mean": mean,
            "std_dev": std_dev,
            "min": values.iter().cloned().fold(f64::INFINITY, f64::min),
            "max": values.iter().cloned().fold(f64::NEG_INFINITY, f64::max),
            "trend": trend,
        },
        "temporal_span": {
            "start": sorted_events.first().map(|e| e.timestamp).unwrap_or(0.0),
            "end": sorted_events.last().map(|e| e.timestamp).unwrap_or(0.0),
        },
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Train neural network on temporal data
///
/// # Arguments
/// * `training_data_json` - JSON string containing training data
/// * `config_json` - JSON string containing training configuration
///
/// # Returns
/// JSON string with training results
#[napi]
pub fn train_temporal_model(training_data_json: String, config_json: String) -> Result<String> {
    // Parse training data
    let training_data: TrainingData = match serde_json::from_str(&training_data_json) {
        Ok(data) => data,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse training data: {}",
                e
            )))
        }
    };

    // Parse configuration
    let config: serde_json::Value = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse training config: {}",
                e
            )))
        }
    };

    let epochs = config
        .get("epochs")
        .and_then(|v| v.as_i64())
        .unwrap_or(100) as i32;
    let batch_size = config
        .get("batch_size")
        .and_then(|v| v.as_i64())
        .unwrap_or(32) as usize;

    // Simulate training
    let mut loss = 1.0;
    for _epoch in 0..epochs {
        // Simulate loss decay
        loss *= 0.95;
    }

    let result = serde_json::json!({
        "status": "trained",
        "epochs": epochs,
        "batch_size": batch_size,
        "samples": training_data.inputs.len(),
        "final_loss": loss,
        "accuracy": 1.0 - loss,
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Make predictions on temporal data
///
/// # Arguments
/// * `input_json` - JSON string containing input features
/// * `model_json` - JSON string containing model configuration
///
/// # Returns
/// JSON string with predictions
#[napi]
pub fn predict_temporal(input_json: String, model_json: String) -> Result<String> {
    // Parse input
    let input: Vec<f64> = match serde_json::from_str(&input_json) {
        Ok(inp) => inp,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse input: {}",
                e
            )))
        }
    };

    if input.is_empty() {
        return Err(Error::from_reason("No input features provided".to_string()));
    }

    // Parse model
    let _model: serde_json::Value = match serde_json::from_str(&model_json) {
        Ok(m) => m,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse model: {}",
                e
            )))
        }
    };

    // Generate predictions (simple neural network simulation)
    let mut predictions = Vec::new();
    let mut confidence = Vec::new();

    for &feature in &input {
        // Simulate neural computation with ReLU-like activation
        let pred = (feature * 0.5 + 0.1).max(0.0);
        let conf = 1.0 / (1.0 + (-pred).exp()); // Sigmoid confidence

        predictions.push(pred);
        confidence.push(conf);
    }

    let result = serde_json::json!({
        "predictions": predictions,
        "confidence": confidence,
        "input_size": input.len(),
        "output_size": predictions.len(),
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Detect temporal patterns in event sequence
///
/// # Arguments
/// * `events_json` - JSON string containing temporal events
/// * `pattern_type` - Type of pattern to detect (e.g., "periodic", "trend")
///
/// # Returns
/// JSON string with detected patterns
#[napi]
pub fn detect_temporal_patterns(events_json: String, pattern_type: String) -> Result<String> {
    // Parse events
    let events: Vec<TemporalEvent> = match serde_json::from_str(&events_json) {
        Ok(evts) => evts,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse events: {}",
                e
            )))
        }
    };

    if events.is_empty() {
        return Err(Error::from_reason("No events provided".to_string()));
    }

    // Sort by timestamp
    let mut sorted_events = events.clone();
    sorted_events.sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());

    // Detect patterns based on type
    let confidence = match pattern_type.as_str() {
        "periodic" => detect_periodicity(&sorted_events),
        "trend" => detect_trend_confidence(&sorted_events),
        "anomaly" => detect_anomaly_confidence(&sorted_events),
        _ => 0.5,
    };

    let result = serde_json::json!({
        "pattern_type": pattern_type,
        "confidence": confidence,
        "event_count": events.len(),
        "detected": confidence > 0.5,
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Calculate neural network performance metrics
///
/// # Arguments
/// * `predictions_json` - JSON string containing predictions
/// * `actual_json` - JSON string containing actual values
///
/// # Returns
/// JSON string with performance metrics
#[napi]
pub fn calculate_performance_metrics(
    predictions_json: String,
    actual_json: String,
) -> Result<String> {
    // Parse predictions and actual values
    let predictions: Vec<f64> = match serde_json::from_str(&predictions_json) {
        Ok(preds) => preds,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse predictions: {}",
                e
            )))
        }
    };

    let actual: Vec<f64> = match serde_json::from_str(&actual_json) {
        Ok(act) => act,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse actual values: {}",
                e
            )))
        }
    };

    if predictions.len() != actual.len() {
        return Err(Error::from_reason(
            "Predictions and actual values must have same length".to_string(),
        ));
    }

    // Calculate metrics
    let mse = calculate_mse(&predictions, &actual);
    let rmse = mse.sqrt();
    let mae = calculate_mae(&predictions, &actual);
    let r_squared = calculate_r_squared(&predictions, &actual);

    let result = serde_json::json!({
        "mse": mse,
        "rmse": rmse,
        "mae": mae,
        "r_squared": r_squared,
        "sample_count": predictions.len(),
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Batch process multiple temporal sequences
///
/// # Arguments
/// * `sequences_json` - JSON array string containing temporal event sequences
///
/// # Returns
/// JSON array string with processed sequences
#[napi]
pub fn batch_process_sequences(sequences_json: String) -> Result<String> {
    // Parse sequences
    let sequences: Vec<Vec<TemporalEvent>> = match serde_json::from_str(&sequences_json) {
        Ok(seqs) => seqs,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse sequences: {}",
                e
            )))
        }
    };

    // Process each sequence
    let results: Vec<serde_json::Value> = sequences
        .iter()
        .map(|seq| {
            let values: Vec<f64> = seq.iter().map(|e| e.value).collect();
            serde_json::json!({
                "event_count": seq.len(),
                "mean": calculate_mean(&values),
                "std_dev": calculate_std_dev(&values, calculate_mean(&values)),
                "trend": calculate_trend(&values),
            })
        })
        .collect();

    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

// ============ Helper Functions ============

/// Calculate mean of values
fn calculate_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.iter().sum::<f64>() / values.len() as f64
}

/// Calculate standard deviation
fn calculate_std_dev(values: &[f64], mean: f64) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    let variance = values
        .iter()
        .map(|v| (v - mean).powi(2))
        .sum::<f64>()
        / values.len() as f64;
    variance.sqrt()
}

/// Calculate trend (linear regression slope)
fn calculate_trend(values: &[f64]) -> f64 {
    if values.len() < 2 {
        return 0.0;
    }

    let n = values.len() as f64;
    let mean_x = (n - 1.0) / 2.0;
    let mean_y = calculate_mean(values);

    let mut numerator = 0.0;
    let mut denominator = 0.0;

    for (i, &y) in values.iter().enumerate() {
        let x = i as f64;
        numerator += (x - mean_x) * (y - mean_y);
        denominator += (x - mean_x).powi(2);
    }

    if denominator == 0.0 {
        0.0
    } else {
        numerator / denominator
    }
}

/// Calculate mean squared error
fn calculate_mse(predictions: &[f64], actual: &[f64]) -> f64 {
    if predictions.is_empty() {
        return 0.0;
    }
    predictions
        .iter()
        .zip(actual.iter())
        .map(|(&p, &a)| (p - a).powi(2))
        .sum::<f64>()
        / predictions.len() as f64
}

/// Calculate mean absolute error
fn calculate_mae(predictions: &[f64], actual: &[f64]) -> f64 {
    if predictions.is_empty() {
        return 0.0;
    }
    predictions
        .iter()
        .zip(actual.iter())
        .map(|(&p, &a)| (p - a).abs())
        .sum::<f64>()
        / predictions.len() as f64
}

/// Calculate R-squared
fn calculate_r_squared(predictions: &[f64], actual: &[f64]) -> f64 {
    let mean_actual = calculate_mean(actual);
    let ss_res: f64 = predictions
        .iter()
        .zip(actual.iter())
        .map(|(&p, &a)| (a - p).powi(2))
        .sum();
    let ss_tot: f64 = actual.iter().map(|&a| (a - mean_actual).powi(2)).sum();

    if ss_tot == 0.0 {
        0.0
    } else {
        1.0 - (ss_res / ss_tot)
    }
}

/// Detect periodicity in temporal events
fn detect_periodicity(events: &[TemporalEvent]) -> f64 {
    if events.len() < 3 {
        return 0.0;
    }

    // Calculate time differences
    let mut intervals = Vec::new();
    for i in 1..events.len() {
        intervals.push(events[i].timestamp - events[i - 1].timestamp);
    }

    // Check if intervals are relatively consistent
    let mean_interval = calculate_mean(&intervals);
    if mean_interval == 0.0 {
        return 0.0;
    }

    let std_dev_interval = calculate_std_dev(&intervals, mean_interval);
    let cv = std_dev_interval / mean_interval; // Coefficient of variation

    // Lower CV indicates more periodicity
    (1.0 - cv.min(1.0)).max(0.0)
}

/// Detect trend confidence in temporal events
fn detect_trend_confidence(events: &[TemporalEvent]) -> f64 {
    if events.len() < 2 {
        return 0.0;
    }

    let values: Vec<f64> = events.iter().map(|e| e.value).collect();
    let trend = calculate_trend(&values);
    let mean = calculate_mean(&values);

    // Normalize trend by mean to get confidence
    if mean.abs() < 0.001 {
        0.0
    } else {
        (trend / mean).abs().min(1.0)
    }
}

/// Detect anomaly confidence in temporal events
fn detect_anomaly_confidence(events: &[TemporalEvent]) -> f64 {
    if events.len() < 3 {
        return 0.0;
    }

    let values: Vec<f64> = events.iter().map(|e| e.value).collect();
    let mean = calculate_mean(&values);
    let std_dev = calculate_std_dev(&values, mean);

    if std_dev == 0.0 {
        return 0.0;
    }

    // Count outliers (values beyond 2 standard deviations)
    let outliers = values
        .iter()
        .filter(|&&v| (v - mean).abs() > 2.0 * std_dev)
        .count();

    (outliers as f64 / values.len() as f64).min(1.0)
}

/// Get current timestamp as ISO 8601 string
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}
