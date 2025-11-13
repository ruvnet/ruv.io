use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Represents analysis input data for lie detection
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnalysisInput {
    text: Option<String>,
    audio_features: Option<serde_json::Value>,
    physiological_data: Option<serde_json::Value>,
    #[serde(default)]
    metadata: serde_json::Value,
}

/// Represents individual modality analysis results
#[derive(Serialize, Deserialize, Debug, Clone)]
struct ModalityResult {
    modality: String,
    confidence: f64,
    indicators: Vec<String>,
    score: f64,
}

/// Represents comprehensive lie detection analysis
#[derive(Serialize, Deserialize, Debug, Clone)]
struct DetectionResult {
    overall_deception_score: f64,
    confidence: f64,
    modalities: Vec<ModalityResult>,
    reasoning: String,
    recommendations: Vec<String>,
    timestamp: String,
}

/// Analyzes text for deceptive indicators
///
/// # Arguments
/// * `text_json` - JSON string containing text to analyze
///
/// # Returns
/// JSON string with text analysis results
#[napi]
pub fn analyze_text(text_json: String) -> Result<String> {
    // Parse input
    let input: serde_json::Value = match serde_json::from_str(&text_json) {
        Ok(val) => val,
        Err(e) => {
            return Err(Error::from_reason(format!("Failed to parse text input: {}", e)))
        }
    };

    let text = match input.get("text").and_then(|v| v.as_str()) {
        Some(t) => t,
        None => {
            return Err(Error::from_reason("Missing 'text' field in input".to_string()))
        }
    };

    // Analyze text for deceptive indicators
    let deception_indicators = detect_text_deception(text);
    let confidence = calculate_text_confidence(&deception_indicators);
    let score = calculate_deception_score(&deception_indicators);

    let result = serde_json::json!({
        "modality": "text",
        "confidence": confidence,
        "indicators": deception_indicators,
        "score": score,
        "text_length": text.len(),
        "word_count": text.split_whitespace().count(),
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Analyzes audio features for deceptive indicators
///
/// # Arguments
/// * `audio_json` - JSON string containing audio features
///
/// # Returns
/// JSON string with audio analysis results
#[napi]
pub fn analyze_audio(audio_json: String) -> Result<String> {
    // Parse input
    let input: serde_json::Value = match serde_json::from_str(&audio_json) {
        Ok(val) => val,
        Err(e) => {
            return Err(Error::from_reason(format!("Failed to parse audio input: {}", e)))
        }
    };

    let features = match input.get("features").and_then(|v| v.as_object()) {
        Some(f) => f,
        None => {
            return Err(Error::from_reason(
                "Missing 'features' field in input".to_string(),
            ))
        }
    };

    // Analyze audio features
    let indicators = detect_audio_deception(features);
    let confidence = calculate_audio_confidence(&indicators);
    let score = calculate_deception_score(&indicators);

    let result = serde_json::json!({
        "modality": "audio",
        "confidence": confidence,
        "indicators": indicators,
        "score": score,
        "features_analyzed": features.len(),
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Analyzes physiological data for deceptive indicators
///
/// # Arguments
/// * `physio_json` - JSON string containing physiological data
///
/// # Returns
/// JSON string with physiological analysis results
#[napi]
pub fn analyze_physiological(physio_json: String) -> Result<String> {
    // Parse input
    let input: serde_json::Value = match serde_json::from_str(&physio_json) {
        Ok(val) => val,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse physiological input: {}",
                e
            )))
        }
    };

    let data = match input.get("data").and_then(|v| v.as_object()) {
        Some(d) => d,
        None => {
            return Err(Error::from_reason(
                "Missing 'data' field in input".to_string(),
            ))
        }
    };

    // Analyze physiological indicators
    let indicators = detect_physiological_deception(data);
    let confidence = calculate_physiological_confidence(&indicators);
    let score = calculate_deception_score(&indicators);

    let result = serde_json::json!({
        "modality": "physiological",
        "confidence": confidence,
        "indicators": indicators,
        "score": score,
        "parameters_analyzed": data.len(),
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Performs comprehensive multi-modal lie detection analysis
///
/// # Arguments
/// * `analysis_json` - JSON string containing all available analysis data
///
/// # Returns
/// JSON string with comprehensive detection results
#[napi]
pub fn detect_deception(analysis_json: String) -> Result<String> {
    // Parse input
    let input: AnalysisInput = match serde_json::from_str(&analysis_json) {
        Ok(data) => data,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse analysis input: {}",
                e
            )))
        }
    };

    let mut modalities: Vec<ModalityResult> = Vec::new();
    let mut all_indicators: Vec<String> = Vec::new();

    // Analyze text if available
    if let Some(text) = &input.text {
        let text_indicators = detect_text_deception(text);
        all_indicators.extend(text_indicators.clone());
        let confidence = calculate_text_confidence(&text_indicators);
        let score = calculate_deception_score(&text_indicators);

        modalities.push(ModalityResult {
            modality: "text".to_string(),
            confidence,
            indicators: text_indicators,
            score,
        });
    }

    // Analyze audio if available
    if let Some(audio_features) = &input.audio_features {
        if let Some(features_obj) = audio_features.as_object() {
            let audio_indicators = detect_audio_deception(features_obj);
            all_indicators.extend(audio_indicators.clone());
            let confidence = calculate_audio_confidence(&audio_indicators);
            let score = calculate_deception_score(&audio_indicators);

            modalities.push(ModalityResult {
                modality: "audio".to_string(),
                confidence,
                indicators: audio_indicators,
                score,
            });
        }
    }

    // Analyze physiological if available
    if let Some(physio_data) = &input.physiological_data {
        if let Some(physio_obj) = physio_data.as_object() {
            let physio_indicators = detect_physiological_deception(physio_obj);
            all_indicators.extend(physio_indicators.clone());
            let confidence = calculate_physiological_confidence(&physio_indicators);
            let score = calculate_deception_score(&physio_indicators);

            modalities.push(ModalityResult {
                modality: "physiological".to_string(),
                confidence,
                indicators: physio_indicators,
                score,
            });
        }
    }

    // Calculate overall deception score
    let overall_score = if !modalities.is_empty() {
        modalities.iter().map(|m| m.score).sum::<f64>() / modalities.len() as f64
    } else {
        0.0
    };

    let overall_confidence = if !modalities.is_empty() {
        modalities.iter().map(|m| m.confidence).sum::<f64>() / modalities.len() as f64
    } else {
        0.0
    };

    // Generate reasoning and recommendations
    let (reasoning, recommendations) = generate_react_reasoning(&modalities, overall_score);

    let result = DetectionResult {
        overall_deception_score: overall_score,
        confidence: overall_confidence,
        modalities,
        reasoning,
        recommendations,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Compare two analyses for consistency
///
/// # Arguments
/// * `analysis1_json` - First analysis as JSON string
/// * `analysis2_json` - Second analysis as JSON string
///
/// # Returns
/// Consistency score (0.0 to 1.0)
#[napi]
pub fn compare_analyses(analysis1_json: String, analysis2_json: String) -> Result<f64> {
    let analysis1: DetectionResult = serde_json::from_str(&analysis1_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse analysis1: {}", e)))?;

    let analysis2: DetectionResult = serde_json::from_str(&analysis2_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse analysis2: {}", e)))?;

    // Calculate consistency based on score difference
    let score_diff = (analysis1.overall_deception_score - analysis2.overall_deception_score).abs();
    let consistency = 1.0 - (score_diff / 2.0).min(1.0);

    Ok(consistency)
}

// ============ Helper Functions ============

/// Detect deceptive indicators in text
fn detect_text_deception(text: &str) -> Vec<String> {
    let mut indicators: Vec<String> = Vec::new();

    // Check for pronoun usage patterns
    if text.contains("I") && text.contains("we") {
        indicators.push("Mixed pronouns detected".to_string());
    }

    // Check for hedging language
    let hedging_words = vec!["maybe", "perhaps", "sort of", "kind of", "I think", "probably"];
    for word in hedging_words {
        if text.to_lowercase().contains(word) {
            indicators.push(format!("Hedging language: {}", word));
        }
    }

    // Check for filler words
    let fillers = vec!["um", "uh", "like", "you know", "basically"];
    let filler_count = fillers.iter().filter(|f| text.to_lowercase().contains(*f)).count();
    if filler_count > 0 {
        indicators.push(format!("Filler words detected: {}", filler_count));
    }

    // Check for repetition
    let words: Vec<&str> = text.split_whitespace().collect();
    let mut word_counts: std::collections::HashMap<&str, usize> = std::collections::HashMap::new();
    for word in &words {
        *word_counts.entry(word).or_insert(0) += 1;
    }

    if let Some((_, &count)) = word_counts.iter().max_by_key(|&(_, &count)| count) {
        if count > 5 {
            indicators.push(format!("Word repetition detected: {} times", count));
        }
    }

    // Check for negative words
    let negative_words = vec!["never", "absolutely not", "definitely not"];
    for word in negative_words {
        if text.to_lowercase().contains(word) {
            indicators.push(format!("Strong negation: {}", word));
        }
    }

    // Check text length (very short or very long can indicate issues)
    if text.len() < 20 {
        indicators.push("Text too short for reliable analysis".to_string());
    }

    indicators
}

/// Detect deceptive indicators in audio features
fn detect_audio_deception(features: &serde_json::Map<String, serde_json::Value>) -> Vec<String> {
    let mut indicators: Vec<String> = Vec::new();

    // Check pitch variation
    if let Some(pitch_var) = features.get("pitch_variance").and_then(|v| v.as_f64()) {
        if pitch_var > 2.5 {
            indicators.push("High pitch variance detected".to_string());
        }
        if pitch_var < 0.3 {
            indicators.push("Low pitch variance detected".to_string());
        }
    }

    // Check speech rate
    if let Some(speech_rate) = features.get("speech_rate").and_then(|v| v.as_f64()) {
        if speech_rate > 150.0 {
            indicators.push("Accelerated speech rate".to_string());
        }
        if speech_rate < 80.0 {
            indicators.push("Slowed speech rate".to_string());
        }
    }

    // Check voice energy
    if let Some(energy) = features.get("energy").and_then(|v| v.as_f64()) {
        if energy > 0.8 {
            indicators.push("High voice energy".to_string());
        }
        if energy < 0.2 {
            indicators.push("Low voice energy".to_string());
        }
    }

    // Check for pause frequency
    if let Some(pauses) = features.get("pause_frequency").and_then(|v| v.as_f64()) {
        if pauses > 3.0 {
            indicators.push("Frequent pauses detected".to_string());
        }
    }

    // Check for jitter (pitch instability)
    if let Some(jitter) = features.get("jitter").and_then(|v| v.as_f64()) {
        if jitter > 0.05 {
            indicators.push("Voice instability detected".to_string());
        }
    }

    indicators
}

/// Detect deceptive indicators in physiological data
fn detect_physiological_deception(data: &serde_json::Map<String, serde_json::Value>) -> Vec<String> {
    let mut indicators: Vec<String> = Vec::new();

    // Check heart rate elevation
    if let Some(heart_rate) = data.get("heart_rate").and_then(|v| v.as_f64()) {
        if heart_rate > 100.0 {
            indicators.push("Elevated heart rate".to_string());
        }
    }

    // Check galvanic skin response (GSR)
    if let Some(gsr) = data.get("gsr").and_then(|v| v.as_f64()) {
        if gsr > 0.5 {
            indicators.push("High galvanic skin response".to_string());
        }
    }

    // Check pupil dilation
    if let Some(pupil) = data.get("pupil_dilation").and_then(|v| v.as_f64()) {
        if pupil > 0.7 {
            indicators.push("Significant pupil dilation".to_string());
        }
    }

    // Check respiration rate
    if let Some(respiration) = data.get("respiration_rate").and_then(|v| v.as_f64()) {
        if respiration > 20.0 {
            indicators.push("Elevated respiration rate".to_string());
        }
    }

    // Check blood pressure
    if let Some(bp_systolic) = data.get("blood_pressure_systolic").and_then(|v| v.as_f64()) {
        if bp_systolic > 140.0 {
            indicators.push("Elevated blood pressure".to_string());
        }
    }

    // Check for eye movement patterns
    if let Some(eye_movement) = data.get("eye_movement_velocity").and_then(|v| v.as_f64()) {
        if eye_movement > 500.0 {
            indicators.push("Rapid eye movements".to_string());
        }
    }

    indicators
}

/// Calculate confidence score based on text indicators
fn calculate_text_confidence(indicators: &[String]) -> f64 {
    let base_confidence = 0.5;
    let boost = (indicators.len() as f64) * 0.05;
    (base_confidence + boost).min(1.0)
}

/// Calculate confidence score based on audio indicators
fn calculate_audio_confidence(indicators: &[String]) -> f64 {
    let base_confidence = 0.55;
    let boost = (indicators.len() as f64) * 0.06;
    (base_confidence + boost).min(1.0)
}

/// Calculate confidence score based on physiological indicators
fn calculate_physiological_confidence(indicators: &[String]) -> f64 {
    let base_confidence = 0.60;
    let boost = (indicators.len() as f64) * 0.04;
    (base_confidence + boost).min(1.0)
}

/// Calculate deception score based on indicators
fn calculate_deception_score(indicators: &[String]) -> f64 {
    let indicator_count = indicators.len() as f64;
    let base_score = indicator_count * 0.1;
    base_score.min(1.0)
}

/// Generate ReAct-style reasoning and recommendations
fn generate_react_reasoning(modalities: &[ModalityResult], overall_score: f64) -> (String, Vec<String>) {
    let mut reasoning = String::new();

    // Thought
    reasoning.push_str("Thought: Analyzing multiple modalities for deception indicators.\n");

    // Action
    reasoning.push_str(&format!(
        "Action: Evaluated {} modalities with overall deception score of {:.2}\n",
        modalities.len(),
        overall_score
    ));

    // Observation
    reasoning.push_str("Observation: ");
    let indicator_count: usize = modalities.iter().map(|m| m.indicators.len()).sum();
    reasoning.push_str(&format!(
        "Detected {} total indicators across {} modalities\n",
        indicator_count,
        modalities.len()
    ));

    // Generate recommendations
    let mut recommendations: Vec<String> = Vec::new();

    if overall_score > 0.7 {
        recommendations.push("High deception likelihood - recommend further investigation".to_string());
    } else if overall_score > 0.4 {
        recommendations.push("Moderate deception indicators - additional analysis needed".to_string());
    } else {
        recommendations.push("Low deception indicators - subject appears truthful".to_string());
    }

    // Add modality-specific recommendations
    for modality in modalities {
        if modality.score > 0.6 {
            recommendations.push(format!(
                "Investigate {} modality further - high deception score",
                modality.modality
            ));
        }
    }

    // Add data quality recommendations
    if modalities.len() < 2 {
        recommendations.push("Collect additional modality data for more reliable assessment".to_string());
    }

    (reasoning, recommendations)
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
