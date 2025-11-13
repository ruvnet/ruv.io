use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Represents a temporal sequence for comparison
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TemporalSequence {
    id: String,
    #[serde(rename = "timestamps")]
    timestamps: Vec<u64>,
    values: Vec<f64>,
    #[serde(default)]
    metadata: serde_json::Value,
}

/// Comparison configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ComparisonConfig {
    threshold: Option<f64>,
    similarity_method: Option<String>,
    normalize: Option<bool>,
}

/// Result of temporal sequence comparison
#[derive(Serialize, Deserialize, Debug)]
struct ComparisonResult {
    sequence1_id: String,
    sequence2_id: String,
    similarity_score: f64,
    distance: f64,
    pattern_match: bool,
    alignment_offset: i32,
    metadata: serde_json::Value,
}

/// Pattern detection result
#[derive(Serialize, Deserialize, Debug)]
struct PatternResult {
    sequence_id: String,
    pattern_found: bool,
    occurrences: Vec<u32>,
    pattern_confidence: f64,
    matched_indices: Vec<u32>,
}

/// Statistical analysis result
#[derive(Serialize, Deserialize, Debug)]
struct StatisticsResult {
    sequence_id: String,
    mean: f64,
    variance: f64,
    std_dev: f64,
    min_value: f64,
    max_value: f64,
    length: usize,
}

/// Compare two temporal sequences
///
/// # Arguments
/// * `sequence1_json` - First temporal sequence as JSON string
/// * `sequence2_json` - Second temporal sequence as JSON string
/// * `config_json` - Comparison configuration as JSON string
///
/// # Returns
/// JSON string with comparison result
#[napi]
pub fn compare_sequences(
    sequence1_json: String,
    sequence2_json: String,
    config_json: String,
) -> Result<String> {
    // Parse input sequences
    let seq1: TemporalSequence = serde_json::from_str(&sequence1_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse sequence1: {}", e)))?;

    let seq2: TemporalSequence = serde_json::from_str(&sequence2_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse sequence2: {}", e)))?;

    let config: ComparisonConfig = serde_json::from_str(&config_json)
        .unwrap_or_else(|_| ComparisonConfig {
            threshold: Some(0.8),
            similarity_method: Some("euclidean".to_string()),
            normalize: Some(true),
        });

    // Calculate similarity
    let (similarity, distance, offset) = calculate_similarity(&seq1, &seq2, &config);
    let pattern_match = similarity >= config.threshold.unwrap_or(0.8);

    let result = ComparisonResult {
        sequence1_id: seq1.id,
        sequence2_id: seq2.id,
        similarity_score: similarity,
        distance,
        pattern_match,
        alignment_offset: offset,
        metadata: config
            .similarity_method
            .map(|m| serde_json::json!({"method": m}))
            .unwrap_or_else(|| serde_json::json!({})),
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))
}

/// Detect repeating patterns in a temporal sequence
///
/// # Arguments
/// * `sequence_json` - Temporal sequence as JSON string
/// * `pattern_length` - Length of pattern to detect
///
/// # Returns
/// JSON string with pattern detection result
#[napi]
pub fn detect_pattern(sequence_json: String, pattern_length: i32) -> Result<String> {
    // Parse input sequence
    let sequence: TemporalSequence = serde_json::from_str(&sequence_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse sequence: {}", e)))?;

    let pattern_len = pattern_length as usize;
    if pattern_len == 0 || pattern_len > sequence.values.len() {
        return Err(Error::from_reason("Invalid pattern length".to_string()));
    }

    // Find pattern occurrences
    let occurrences = find_pattern_occurrences(&sequence.values, pattern_len);
    let pattern_found = !occurrences.is_empty();
    let confidence = calculate_pattern_confidence(&sequence.values, &occurrences, pattern_len);

    let result = PatternResult {
        sequence_id: sequence.id,
        pattern_found,
        occurrences: occurrences.iter().map(|&i| i as u32).collect(),
        pattern_confidence: confidence,
        matched_indices: extract_matched_indices(&sequence.values, &occurrences, pattern_len),
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))
}

/// Analyze temporal sequence statistics
///
/// # Arguments
/// * `sequence_json` - Temporal sequence as JSON string
///
/// # Returns
/// JSON string with statistical analysis
#[napi]
pub fn analyze_sequence(sequence_json: String) -> Result<String> {
    // Parse input sequence
    let sequence: TemporalSequence = serde_json::from_str(&sequence_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse sequence: {}", e)))?;

    if sequence.values.is_empty() {
        return Err(Error::from_reason("Empty sequence".to_string()));
    }

    let stats = calculate_statistics(&sequence.values);

    let result = StatisticsResult {
        sequence_id: sequence.id,
        mean: stats.mean,
        variance: stats.variance,
        std_dev: stats.std_dev,
        min_value: stats.min,
        max_value: stats.max,
        length: sequence.values.len(),
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))
}

/// Normalize a temporal sequence
///
/// # Arguments
/// * `sequence_json` - Temporal sequence as JSON string
///
/// # Returns
/// JSON string with normalized sequence
#[napi]
pub fn normalize_sequence(sequence_json: String) -> Result<String> {
    // Parse input sequence
    let mut sequence: TemporalSequence = serde_json::from_str(&sequence_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse sequence: {}", e)))?;

    if sequence.values.is_empty() {
        return Err(Error::from_reason("Empty sequence".to_string()));
    }

    // Calculate statistics
    let stats = calculate_statistics(&sequence.values);

    // Normalize values (z-score normalization)
    if stats.std_dev > 0.0 {
        sequence.values = sequence
            .values
            .iter()
            .map(|v| (v - stats.mean) / stats.std_dev)
            .collect();
    }

    serde_json::to_string(&sequence)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))
}

/// Batch compare multiple sequences
///
/// # Arguments
/// * `sequences_json` - JSON array of temporal sequences
/// * `config_json` - Comparison configuration
///
/// # Returns
/// JSON array with pairwise comparison results
#[napi]
pub fn batch_compare_sequences(sequences_json: String, config_json: String) -> Result<String> {
    // Parse input sequences
    let sequences: Vec<TemporalSequence> = serde_json::from_str(&sequences_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse sequences: {}", e)))?;

    let config: ComparisonConfig = serde_json::from_str(&config_json)
        .unwrap_or_else(|_| ComparisonConfig {
            threshold: Some(0.8),
            similarity_method: Some("euclidean".to_string()),
            normalize: Some(true),
        });

    // Compare all pairs
    let mut results = Vec::new();
    for i in 0..sequences.len() {
        for j in (i + 1)..sequences.len() {
            let (similarity, distance, offset) =
                calculate_similarity(&sequences[i], &sequences[j], &config);
            let pattern_match = similarity >= config.threshold.unwrap_or(0.8);

            results.push(ComparisonResult {
                sequence1_id: sequences[i].id.clone(),
                sequence2_id: sequences[j].id.clone(),
                similarity_score: similarity,
                distance,
                pattern_match,
                alignment_offset: offset,
                metadata: serde_json::json!({"comparison_index": format!("{},{}", i, j)}),
            });
        }
    }

    serde_json::to_string(&results)
        .map_err(|e| Error::from_reason(format!("Failed to serialize results: {}", e)))
}

// ============ Helper Functions ============

/// Calculate similarity between two sequences
fn calculate_similarity(
    seq1: &TemporalSequence,
    seq2: &TemporalSequence,
    config: &ComparisonConfig,
) -> (f64, f64, i32) {
    let v1 = if config.normalize.unwrap_or(true) {
        normalize_values(&seq1.values)
    } else {
        seq1.values.clone()
    };

    let v2 = if config.normalize.unwrap_or(true) {
        normalize_values(&seq2.values)
    } else {
        seq2.values.clone()
    };

    let (similarity, distance, offset) = match config.similarity_method.as_deref() {
        Some("euclidean") | None => euclidean_distance(&v1, &v2),
        Some("cosine") => cosine_similarity(&v1, &v2),
        _ => euclidean_distance(&v1, &v2),
    };

    (similarity, distance, offset)
}

/// Calculate Euclidean distance and similarity
fn euclidean_distance(seq1: &[f64], seq2: &[f64]) -> (f64, f64, i32) {
    let max_len = seq1.len().max(seq2.len());
    let mut min_distance = f64::INFINITY;
    let mut best_offset = 0i32;

    for offset in -(seq1.len() as i32 - 1)..=(seq2.len() as i32 - 1) {
        let mut distance = 0.0;
        let mut count = 0;

        for i in 0..max_len {
            let idx1 = (i as i32 - offset) as usize;
            let idx2 = i;

            if idx1 < seq1.len() && idx2 < seq2.len() {
                let diff = seq1[idx1] - seq2[idx2];
                distance += diff * diff;
                count += 1;
            }
        }

        if count > 0 {
            distance = (distance / count as f64).sqrt();
            if distance < min_distance {
                min_distance = distance;
                best_offset = offset;
            }
        }
    }

    let similarity = 1.0 / (1.0 + min_distance);
    (similarity.min(1.0), min_distance, best_offset)
}

/// Calculate cosine similarity
fn cosine_similarity(seq1: &[f64], seq2: &[f64]) -> (f64, f64, i32) {
    let min_len = seq1.len().min(seq2.len());
    let mut dot_product = 0.0;
    let mut norm1 = 0.0;
    let mut norm2 = 0.0;

    for i in 0..min_len {
        dot_product += seq1[i] * seq2[i];
        norm1 += seq1[i] * seq1[i];
        norm2 += seq2[i] * seq2[i];
    }

    let similarity = if norm1 > 0.0 && norm2 > 0.0 {
        dot_product / (norm1.sqrt() * norm2.sqrt())
    } else {
        0.0
    };

    let distance = 1.0 - similarity;
    (similarity, distance, 0)
}

/// Normalize values using z-score normalization
fn normalize_values(values: &[f64]) -> Vec<f64> {
    if values.is_empty() {
        return Vec::new();
    }

    let stats = calculate_statistics(values);

    if stats.std_dev > 0.0 {
        values
            .iter()
            .map(|v| (v - stats.mean) / stats.std_dev)
            .collect()
    } else {
        values.to_vec()
    }
}

/// Statistics calculation
#[derive(Debug)]
struct Statistics {
    mean: f64,
    variance: f64,
    std_dev: f64,
    min: f64,
    max: f64,
}

/// Calculate statistics for a sequence
fn calculate_statistics(values: &[f64]) -> Statistics {
    if values.is_empty() {
        return Statistics {
            mean: 0.0,
            variance: 0.0,
            std_dev: 0.0,
            min: 0.0,
            max: 0.0,
        };
    }

    let mean = values.iter().sum::<f64>() / values.len() as f64;
    let variance = values
        .iter()
        .map(|v| (v - mean).powi(2))
        .sum::<f64>()
        / values.len() as f64;
    let std_dev = variance.sqrt();

    let min = values.iter().cloned().fold(f64::INFINITY, f64::min);
    let max = values.iter().cloned().fold(f64::NEG_INFINITY, f64::max);

    Statistics {
        mean,
        variance,
        std_dev,
        min,
        max,
    }
}

/// Find pattern occurrences in a sequence
fn find_pattern_occurrences(sequence: &[f64], pattern_len: usize) -> Vec<usize> {
    let mut occurrences = Vec::new();

    if pattern_len > sequence.len() {
        return occurrences;
    }

    // Extract the first pattern_len elements as the pattern
    let pattern = &sequence[0..pattern_len];

    // Slide window through the sequence
    for i in 1..=(sequence.len() - pattern_len) {
        let window = &sequence[i..i + pattern_len];

        // Calculate correlation
        let correlation = calculate_correlation(pattern, window);

        // If correlation is high, record this as an occurrence
        if correlation > 0.8 {
            occurrences.push(i);
        }
    }

    occurrences
}

/// Calculate correlation between two sequences
fn calculate_correlation(seq1: &[f64], seq2: &[f64]) -> f64 {
    if seq1.len() != seq2.len() || seq1.is_empty() {
        return 0.0;
    }

    let mean1 = seq1.iter().sum::<f64>() / seq1.len() as f64;
    let mean2 = seq2.iter().sum::<f64>() / seq2.len() as f64;

    let mut numerator = 0.0;
    let mut sum_sq1 = 0.0;
    let mut sum_sq2 = 0.0;

    for i in 0..seq1.len() {
        let d1 = seq1[i] - mean1;
        let d2 = seq2[i] - mean2;
        numerator += d1 * d2;
        sum_sq1 += d1 * d1;
        sum_sq2 += d2 * d2;
    }

    if sum_sq1 > 0.0 && sum_sq2 > 0.0 {
        numerator / (sum_sq1.sqrt() * sum_sq2.sqrt())
    } else {
        0.0
    }
}

/// Calculate pattern confidence
fn calculate_pattern_confidence(
    sequence: &[f64],
    occurrences: &[usize],
    pattern_len: usize,
) -> f64 {
    if occurrences.is_empty() || pattern_len > sequence.len() {
        return 0.0;
    }

    let pattern = &sequence[0..pattern_len];
    let mut total_correlation = 0.0;

    for &idx in occurrences {
        if idx + pattern_len <= sequence.len() {
            let window = &sequence[idx..idx + pattern_len];
            total_correlation += calculate_correlation(pattern, window);
        }
    }

    if occurrences.is_empty() {
        0.0
    } else {
        total_correlation / occurrences.len() as f64
    }
}

/// Extract matched indices
fn extract_matched_indices(
    sequence: &[f64],
    occurrences: &[usize],
    pattern_len: usize,
) -> Vec<u32> {
    let mut indices = Vec::new();

    for &start in occurrences {
        if start + pattern_len <= sequence.len() {
            for i in 0..pattern_len {
                indices.push((start + i) as u32);
            }
        }
    }

    indices
}
