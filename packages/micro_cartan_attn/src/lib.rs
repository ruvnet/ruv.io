use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::f64;

/// Represents an attention vector
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AttentionVector {
    id: String,
    values: Vec<f64>,
    dimension: usize,
}

/// Represents attention scores between tokens
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AttentionScores {
    query_id: String,
    scores: Vec<f64>,
    max_score: f64,
    min_score: f64,
    mean_score: f64,
}

/// Represents a context vector
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ContextVector {
    id: String,
    vector: Vec<f64>,
    source_count: usize,
    aggregation_method: String,
}

/// Multi-head attention result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MultiHeadAttentionResult {
    token_id: String,
    heads: usize,
    combined_output: Vec<f64>,
    head_outputs: Vec<Vec<f64>>,
    combined_score: f64,
}

/// Cartan attention configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CartanAttentionConfig {
    num_heads: usize,
    dimension: usize,
    dropout_rate: f64,
    scale_factor: f64,
    enable_positional_encoding: bool,
}

/// Calculate attention scores between query and keys
///
/// # Arguments
/// * `query_json` - JSON string containing query vector
/// * `keys_json` - JSON array string containing key vectors
/// * `scale_factor` - Scaling factor for scores (typically sqrt(dim))
///
/// # Returns
/// JSON string containing attention scores
#[napi]
pub fn calculate_attention_scores(
    query_json: String,
    keys_json: String,
    scale_factor: f64,
) -> Result<String> {
    // Parse query vector
    let query: Vec<f64> = serde_json::from_str(&query_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse query: {}", e)))?;

    // Parse keys
    let keys: Vec<Vec<f64>> = serde_json::from_str(&keys_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse keys: {}", e)))?;

    if query.is_empty() {
        return Err(Error::from_reason("Query vector is empty"));
    }

    // Calculate dot products
    let mut scores: Vec<f64> = Vec::new();
    for key in &keys {
        if key.len() != query.len() {
            return Err(Error::from_reason(
                "Query and key dimensions do not match",
            ));
        }

        let dot_product: f64 = query.iter().zip(key.iter()).map(|(q, k)| q * k).sum();
        let scaled_score = dot_product / scale_factor;
        scores.push(scaled_score);
    }

    // Calculate softmax
    let softmax_scores = softmax(&scores);

    // Calculate statistics
    let max_score = softmax_scores
        .iter()
        .cloned()
        .fold(f64::NEG_INFINITY, f64::max);
    let min_score = softmax_scores
        .iter()
        .cloned()
        .fold(f64::INFINITY, f64::min);
    let mean_score = softmax_scores.iter().sum::<f64>() / softmax_scores.len() as f64;

    let result = AttentionScores {
        query_id: "query_0".to_string(),
        scores: softmax_scores,
        max_score,
        min_score,
        mean_score,
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize scores: {}",
            e
        ))),
    }
}

/// Calculate context vector by aggregating attention-weighted values
///
/// # Arguments
/// * `attention_scores_json` - JSON string containing attention scores
/// * `values_json` - JSON array string containing value vectors
/// * `aggregation_method` - Method to use: "sum", "mean", "max"
///
/// # Returns
/// JSON string containing the aggregated context vector
#[napi]
pub fn calculate_context_vector(
    attention_scores_json: String,
    values_json: String,
    aggregation_method: String,
) -> Result<String> {
    // Parse attention scores
    let scores: Vec<f64> = serde_json::from_str(&attention_scores_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse scores: {}", e)))?;

    // Parse values
    let values: Vec<Vec<f64>> = serde_json::from_str(&values_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse values: {}", e)))?;

    if scores.len() != values.len() {
        return Err(Error::from_reason(
            "Scores and values lengths do not match",
        ));
    }

    if values.is_empty() {
        return Err(Error::from_reason("Values array is empty"));
    }

    let dim = values[0].len();
    let mut context = vec![0.0; dim];

    // Aggregate based on method
    match aggregation_method.as_str() {
        "sum" => {
            for (i, value) in values.iter().enumerate() {
                for (j, &v) in value.iter().enumerate() {
                    context[j] += scores[i] * v;
                }
            }
        }
        "mean" => {
            for (i, value) in values.iter().enumerate() {
                for (j, &v) in value.iter().enumerate() {
                    context[j] += scores[i] * v;
                }
            }
            for c in &mut context {
                *c /= scores.len() as f64;
            }
        }
        "max" => {
            let mut max_idx = 0;
            for (i, &score) in scores.iter().enumerate() {
                if i == 0 || score > scores[max_idx] {
                    max_idx = i;
                }
            }
            context = values[max_idx].clone();
        }
        _ => {
            return Err(Error::from_reason(format!(
                "Unknown aggregation method: {}",
                aggregation_method
            )))
        }
    }

    let result = ContextVector {
        id: "context_0".to_string(),
        vector: context,
        source_count: scores.len(),
        aggregation_method: aggregation_method.clone(),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize context: {}",
            e
        ))),
    }
}

/// Compute multi-head attention for a query
///
/// # Arguments
/// * `query_json` - JSON string containing query vector
/// * `keys_json` - JSON array string containing key vectors
/// * `values_json` - JSON array string containing value vectors
/// * `num_heads` - Number of attention heads
/// * `dimension` - Dimension of vectors
///
/// # Returns
/// JSON string containing multi-head attention output
#[napi]
pub fn multi_head_attention(
    query_json: String,
    keys_json: String,
    values_json: String,
    num_heads: i32,
    dimension: i32,
) -> Result<String> {
    let num_heads = num_heads as usize;
    let dimension = dimension as usize;

    // Parse input vectors
    let query: Vec<f64> = serde_json::from_str(&query_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse query: {}", e)))?;

    let keys: Vec<Vec<f64>> = serde_json::from_str(&keys_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse keys: {}", e)))?;

    let values: Vec<Vec<f64>> = serde_json::from_str(&values_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse values: {}", e)))?;

    if dimension % num_heads != 0 {
        return Err(Error::from_reason(
            "Dimension must be divisible by number of heads",
        ));
    }

    let head_dim = dimension / num_heads;

    // Process each head
    let mut head_outputs: Vec<Vec<f64>> = Vec::new();
    let mut combined_scores = 0.0;

    for head in 0..num_heads {
        let start_idx = head * head_dim;
        let end_idx = start_idx + head_dim;

        // Extract head slices
        if end_idx > query.len() {
            continue;
        }

        let query_head = &query[start_idx..end_idx];
        let scale_factor = (head_dim as f64).sqrt();

        // Calculate scores for this head
        let mut head_scores: Vec<f64> = Vec::new();
        for key in &keys {
            if key.len() < end_idx {
                continue;
            }
            let key_head = &key[start_idx..end_idx];
            let dot_product: f64 = query_head.iter().zip(key_head.iter()).map(|(q, k)| q * k).sum();
            let scaled = dot_product / scale_factor;
            head_scores.push(scaled);
        }

        // Apply softmax
        let softmax_scores = softmax(&head_scores);
        combined_scores += softmax_scores.iter().sum::<f64>();

        // Aggregate values with attention weights
        let mut head_output = vec![0.0; head_dim];
        for (i, value) in values.iter().enumerate() {
            if value.len() < end_idx {
                continue;
            }
            let value_head = &value[start_idx..end_idx];
            for (j, &v) in value_head.iter().enumerate() {
                head_output[j] += softmax_scores[i] * v;
            }
        }

        head_outputs.push(head_output);
    }

    // Combine head outputs
    let mut combined_output = Vec::new();
    for head_output in &head_outputs {
        combined_output.extend(head_output);
    }

    // Ensure combined output has correct dimension
    if combined_output.len() < dimension {
        combined_output.resize(dimension, 0.0);
    } else if combined_output.len() > dimension {
        combined_output.truncate(dimension);
    }

    let result = MultiHeadAttentionResult {
        token_id: "token_0".to_string(),
        heads: num_heads,
        combined_output,
        head_outputs,
        combined_score: combined_scores / num_heads as f64,
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize attention result: {}",
            e
        ))),
    }
}

/// Create a CartanAttention layer with specified configuration
///
/// # Arguments
/// * `config_json` - JSON string containing attention configuration
///
/// # Returns
/// JSON string containing initialization result
#[napi]
pub fn create_cartan_attention_layer(config_json: String) -> Result<String> {
    let config: CartanAttentionConfig = serde_json::from_str(&config_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse config: {}", e)))?;

    if config.num_heads == 0 {
        return Err(Error::from_reason("Number of heads must be greater than 0"));
    }

    if config.dimension % config.num_heads != 0 {
        return Err(Error::from_reason(
            "Dimension must be divisible by number of heads",
        ));
    }

    let result = serde_json::json!({
        "status": "initialized",
        "num_heads": config.num_heads,
        "dimension": config.dimension,
        "head_dimension": config.dimension / config.num_heads,
        "dropout_rate": config.dropout_rate,
        "scale_factor": config.scale_factor,
        "enable_positional_encoding": config.enable_positional_encoding,
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize layer: {}",
            e
        ))),
    }
}

/// Normalize attention scores using L2 normalization
///
/// # Arguments
/// * `scores_json` - JSON array string containing raw scores
///
/// # Returns
/// JSON array string containing normalized scores
#[napi]
pub fn normalize_attention_scores(scores_json: String) -> Result<String> {
    let scores: Vec<f64> = serde_json::from_str(&scores_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse scores: {}", e)))?;

    if scores.is_empty() {
        return Err(Error::from_reason("Scores array is empty"));
    }

    // Calculate L2 norm
    let l2_norm: f64 = scores.iter().map(|s| s * s).sum::<f64>().sqrt();

    let normalized: Vec<f64> = if l2_norm > 0.0 {
        scores.iter().map(|s| s / l2_norm).collect()
    } else {
        scores
    };

    match serde_json::to_string(&normalized) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize normalized scores: {}",
            e
        ))),
    }
}

/// Calculate weight decay for regularization
///
/// # Arguments
/// * `weights_json` - JSON array string containing weights
/// * `decay_factor` - Decay factor (typically 0.01)
///
/// # Returns
/// JSON object containing decay statistics
#[napi]
pub fn calculate_weight_decay(weights_json: String, decay_factor: f64) -> Result<String> {
    let weights: Vec<f64> = serde_json::from_str(&weights_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse weights: {}", e)))?;

    if weights.is_empty() {
        return Err(Error::from_reason("Weights array is empty"));
    }

    let decay_amount: f64 = weights.iter().map(|w| w * w).sum::<f64>() * decay_factor;
    let decayed_weights: Vec<f64> = weights.iter().map(|w| w * (1.0 - decay_factor)).collect();
    let l2_norm: f64 = decayed_weights.iter().map(|w| w * w).sum::<f64>().sqrt();

    let result = serde_json::json!({
        "original_l2_norm": weights.iter().map(|w| w * w).sum::<f64>().sqrt(),
        "decay_amount": decay_amount,
        "decayed_l2_norm": l2_norm,
        "decay_factor": decay_factor,
        "weight_count": weights.len(),
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize decay result: {}",
            e
        ))),
    }
}

/// Apply positional encoding to attention vectors
///
/// # Arguments
/// * `vectors_json` - JSON array string containing vectors
/// * `position` - Position in sequence
/// * `dimension` - Dimension of vectors
///
/// # Returns
/// JSON array string containing position-encoded vectors
#[napi]
pub fn apply_positional_encoding(
    vectors_json: String,
    position: i32,
    dimension: i32,
) -> Result<String> {
    let vectors: Vec<Vec<f64>> = serde_json::from_str(&vectors_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse vectors: {}", e)))?;

    let position = position as f64;
    let dimension = dimension as usize;

    let mut encoded = Vec::new();

    for vector in vectors {
        let mut pos_encoded = vector.clone();

        // Apply positional encoding: PE(pos, 2i) = sin(pos/10000^(2i/d))
        //                          PE(pos, 2i+1) = cos(pos/10000^(2i/d))
        for i in 0..vector.len().min(dimension) {
            let div_term = (10000.0_f64).powf((2 * (i / 2)) as f64 / dimension as f64);

            if i % 2 == 0 {
                pos_encoded[i] = vector[i] + (position / div_term).sin();
            } else {
                pos_encoded[i] = vector[i] + (position / div_term).cos();
            }
        }

        encoded.push(pos_encoded);
    }

    match serde_json::to_string(&encoded) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize encoded vectors: {}",
            e
        ))),
    }
}

// ============ Helper Functions ============

/// Compute softmax normalization
fn softmax(values: &[f64]) -> Vec<f64> {
    if values.is_empty() {
        return Vec::new();
    }

    // Find max for numerical stability
    let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);

    // Compute exp and sum
    let exps: Vec<f64> = values.iter().map(|x| (x - max).exp()).collect();
    let sum: f64 = exps.iter().sum();

    // Normalize
    if sum > 0.0 {
        exps.iter().map(|e| e / sum).collect()
    } else {
        vec![0.0; values.len()]
    }
}

/// Get current timestamp
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", duration.as_millis())
}
