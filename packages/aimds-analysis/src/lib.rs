use napi_derive::napi;
use std::sync::{Arc, Mutex};
use serde_json::{json, Value, Map};
use serde::{Deserialize, Serialize};

/// Analysis configuration structure
#[derive(Clone)]
#[allow(dead_code)]
struct InternalConfig {
  sensitivity: f64,
  min_confidence: f64,
  anomaly_threshold: f64,
  pattern_window_size: u32,
  max_threats: u32,
}

impl Default for InternalConfig {
  fn default() -> Self {
    Self {
      sensitivity: 0.8,
      min_confidence: 0.7,
      anomaly_threshold: 0.75,
      pattern_window_size: 100,
      max_threats: 10,
    }
  }
}


/// Engine state
struct EngineState {
  config: InternalConfig,
  data_history: Vec<Vec<u8>>,
  pattern_cache: Map<String, Value>,
  anomaly_count: u32,
}

/// Main AIMDS Analysis Engine
#[napi]
pub struct AnalysisEngine {
  inner: Arc<Mutex<EngineState>>,
}

/// NAPI Configuration object
#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct AnalysisConfigNapi {
  pub sensitivity: Option<f64>,
  pub min_confidence: Option<f64>,
  pub anomaly_threshold: Option<f64>,
  pub pattern_window_size: Option<u32>,
  pub max_threats: Option<u32>,
}

/// NAPI Anomaly detection result
#[napi(object)]
#[derive(Serialize)]
pub struct AnomalyDetectionResult {
  pub anomaly_score: f64,
  pub is_anomaly: bool,
  pub confidence: f64,
  pub details: String,
}

/// NAPI Pattern recognition result
#[napi(object)]
#[derive(Serialize)]
pub struct PatternRecognitionResult {
  pub patterns_found: u32,
  pub matches: Vec<String>,
  pub total_score: f64,
  pub analysis_data: String,
}

/// NAPI Threat assessment result
#[napi(object)]
#[derive(Serialize)]
pub struct ThreatAssessmentResult {
  pub threat_level: String,
  pub severity: f64,
  pub threat_type: String,
  pub recommendations: Vec<String>,
  pub timestamp: String,
}

#[napi]
impl AnalysisEngine {
  /// Create a new Analysis Engine with optional configuration
  #[napi(constructor)]
  pub fn new(config_json: Option<String>) -> napi::Result<Self> {
    let config = if let Some(config_str) = config_json {
      match serde_json::from_str::<AnalysisConfigNapi>(&config_str) {
        Ok(parsed_config) => InternalConfig {
          sensitivity: parsed_config.sensitivity.unwrap_or(0.8),
          min_confidence: parsed_config.min_confidence.unwrap_or(0.7),
          anomaly_threshold: parsed_config.anomaly_threshold.unwrap_or(0.75),
          pattern_window_size: parsed_config.pattern_window_size.unwrap_or(100),
          max_threats: parsed_config.max_threats.unwrap_or(10),
        },
        Err(e) => {
          return Err(napi::Error::from_reason(format!(
            "Invalid configuration JSON: {}",
            e
          )))
        }
      }
    } else {
      InternalConfig::default()
    };

    let state = EngineState {
      config,
      data_history: Vec::new(),
      pattern_cache: Map::new(),
      anomaly_count: 0,
    };

    Ok(AnalysisEngine {
      inner: Arc::new(Mutex::new(state)),
    })
  }

  /// Detect anomalies in the provided data
  #[napi]
  pub fn detect_anomalies(&self, data_json: String) -> napi::Result<String> {
    let state = self.inner.lock().map_err(|e| {
      napi::Error::from_reason(format!("Failed to acquire lock: {}", e))
    })?;

    let data_value: Value = serde_json::from_str(&data_json)
      .map_err(|e| napi::Error::from_reason(format!("Invalid JSON data: {}", e)))?;

    let data_bytes = match &data_value {
      Value::String(s) => s.as_bytes().to_vec(),
      _ => serde_json::to_vec(&data_value)
        .map_err(|e| napi::Error::from_reason(format!("Serialization failed: {}", e)))?,
    };

    let anomaly_score = calculate_anomaly_score(&data_bytes, &state.config);
    let is_anomaly = anomaly_score > state.config.anomaly_threshold;
    let confidence = (anomaly_score / state.config.anomaly_threshold).min(1.0);

    let details = format!(
      "Analyzed {} bytes with sensitivity {}",
      data_bytes.len(),
      state.config.sensitivity
    );

    let result = AnomalyDetectionResult {
      anomaly_score,
      is_anomaly,
      confidence,
      details,
    };

    serde_json::to_string(&result)
      .map_err(|e| napi::Error::from_reason(format!("Result serialization failed: {}", e)))
  }

  /// Recognize patterns in the data
  #[napi]
  pub fn recognize_patterns(&self, data_json: String) -> napi::Result<String> {
    let mut state = self.inner.lock().map_err(|e| {
      napi::Error::from_reason(format!("Failed to acquire lock: {}", e))
    })?;

    let data_value: Value = serde_json::from_str(&data_json)
      .map_err(|e| napi::Error::from_reason(format!("Invalid JSON data: {}", e)))?;

    let data_bytes = match &data_value {
      Value::String(s) => s.as_bytes().to_vec(),
      _ => serde_json::to_vec(&data_value)
        .map_err(|e| napi::Error::from_reason(format!("Serialization failed: {}", e)))?,
    };

    // Store in history for pattern recognition
    if state.data_history.len() >= state.config.pattern_window_size as usize {
      state.data_history.remove(0);
    }
    state.data_history.push(data_bytes.clone());

    let (patterns_found, matches, total_score) = recognize_patterns_impl(
      &state.data_history,
      &state.config,
      &state.pattern_cache,
    );

    let analysis_data = format!(
      "Pattern recognition completed with window size {}",
      state.config.pattern_window_size
    );

    let result = PatternRecognitionResult {
      patterns_found,
      matches,
      total_score,
      analysis_data,
    };

    serde_json::to_string(&result)
      .map_err(|e| napi::Error::from_reason(format!("Result serialization failed: {}", e)))
  }

  /// Assess threat level based on analysis
  #[napi]
  pub fn assess_threat(&self, data_json: String) -> napi::Result<String> {
    let state = self.inner.lock().map_err(|e| {
      napi::Error::from_reason(format!("Failed to acquire lock: {}", e))
    })?;

    let data_value: Value = serde_json::from_str(&data_json)
      .map_err(|e| napi::Error::from_reason(format!("Invalid JSON data: {}", e)))?;

    let data_bytes = match &data_value {
      Value::String(s) => s.as_bytes().to_vec(),
      _ => serde_json::to_vec(&data_value)
        .map_err(|e| napi::Error::from_reason(format!("Serialization failed: {}", e)))?,
    };

    let (threat_level, severity, threat_type, recommendations) =
      assess_threat_impl(&data_bytes, &state.config);

    let timestamp = chrono::Local::now().to_rfc3339();

    let result = ThreatAssessmentResult {
      threat_level,
      severity,
      threat_type,
      recommendations,
      timestamp,
    };

    serde_json::to_string(&result)
      .map_err(|e| napi::Error::from_reason(format!("Result serialization failed: {}", e)))
  }

  /// Perform comprehensive analysis on provided data
  #[napi]
  pub fn analyze(&self, data_json: String) -> napi::Result<String> {
    let anomalies = self.detect_anomalies(data_json.clone())?;
    let patterns = self.recognize_patterns(data_json.clone())?;
    let threats = self.assess_threat(data_json)?;

    let anomalies_obj: Value =
      serde_json::from_str(&anomalies).unwrap_or(Value::Null);
    let patterns_obj: Value = serde_json::from_str(&patterns).unwrap_or(Value::Null);
    let threats_obj: Value = serde_json::from_str(&threats).unwrap_or(Value::Null);

    let comprehensive = json!({
      "anomaly_analysis": anomalies_obj,
      "pattern_analysis": patterns_obj,
      "threat_assessment": threats_obj,
      "analysis_timestamp": chrono::Local::now().to_rfc3339(),
      "status": "completed"
    });

    serde_json::to_string(&comprehensive)
      .map_err(|e| napi::Error::from_reason(format!("Result serialization failed: {}", e)))
  }

  /// Get current engine statistics
  #[napi]
  pub fn get_statistics(&self) -> napi::Result<String> {
    let state = self.inner.lock().map_err(|e| {
      napi::Error::from_reason(format!("Failed to acquire lock: {}", e))
    })?;

    let stats = json!({
      "sensitivity": state.config.sensitivity,
      "min_confidence": state.config.min_confidence,
      "anomaly_threshold": state.config.anomaly_threshold,
      "pattern_window_size": state.config.pattern_window_size,
      "data_history_length": state.data_history.len(),
      "anomaly_count": state.anomaly_count,
      "pattern_cache_size": state.pattern_cache.len(),
    });

    serde_json::to_string(&stats)
      .map_err(|e| napi::Error::from_reason(format!("Result serialization failed: {}", e)))
  }

  /// Clear engine history and reset state
  #[napi]
  pub fn reset(&self) -> napi::Result<()> {
    let mut state = self.inner.lock().map_err(|e| {
      napi::Error::from_reason(format!("Failed to acquire lock: {}", e))
    })?;

    state.data_history.clear();
    state.pattern_cache.clear();
    state.anomaly_count = 0;

    Ok(())
  }

  /// Check engine health and readiness
  #[napi]
  pub fn is_ready(&self) -> bool {
    self.inner.lock().is_ok()
  }

  /// Get engine version
  #[napi]
  pub fn get_version(&self) -> String {
    format!("aimds-analysis-engine {}", env!("CARGO_PKG_VERSION"))
  }

  /// Set analysis sensitivity level
  #[napi]
  pub fn set_sensitivity(&self, sensitivity: f64) -> napi::Result<()> {
    if sensitivity < 0.0 || sensitivity > 1.0 {
      return Err(napi::Error::from_reason(
        "Sensitivity must be between 0.0 and 1.0",
      ));
    }

    let mut state = self.inner.lock().map_err(|e| {
      napi::Error::from_reason(format!("Failed to acquire lock: {}", e))
    })?;

    state.config.sensitivity = sensitivity;
    Ok(())
  }

  /// Get current sensitivity level
  #[napi]
  pub fn get_sensitivity(&self) -> napi::Result<f64> {
    let state = self.inner.lock().map_err(|e| {
      napi::Error::from_reason(format!("Failed to acquire lock: {}", e))
    })?;

    Ok(state.config.sensitivity)
  }

  /// Batch analyze multiple data items
  #[napi]
  pub fn batch_analyze(&self, data_json_array: String) -> napi::Result<String> {
    let data_array: Value = serde_json::from_str(&data_json_array)
      .map_err(|e| napi::Error::from_reason(format!("Invalid JSON array: {}", e)))?;

    if !data_array.is_array() {
      return Err(napi::Error::from_reason("Input must be an array"));
    }

    let mut results = Vec::new();

    for item in data_array.as_array().unwrap() {
      let item_json = serde_json::to_string(item)
        .map_err(|e| napi::Error::from_reason(format!("Serialization failed: {}", e)))?;

      if let Ok(analysis_result) = self.analyze(item_json) {
        if let Ok(parsed) = serde_json::from_str::<Value>(&analysis_result) {
          results.push(parsed);
        }
      }
    }

    let batch_result = json!({
      "items_processed": results.len(),
      "results": results,
      "timestamp": chrono::Local::now().to_rfc3339()
    });

    serde_json::to_string(&batch_result)
      .map_err(|e| napi::Error::from_reason(format!("Result serialization failed: {}", e)))
  }
}

/// Helper function to calculate anomaly score
fn calculate_anomaly_score(data: &[u8], config: &InternalConfig) -> f64 {
  if data.is_empty() {
    return 0.0;
  }

  // Calculate statistical properties
  let mut entropy = 0.0;
  let mut byte_frequency = vec![0u32; 256];

  for &byte in data {
    byte_frequency[byte as usize] += 1;
  }

  for count in byte_frequency.iter() {
    if *count > 0 {
      let p = *count as f64 / data.len() as f64;
      entropy -= p * p.log2();
    }
  }

  // Normalize entropy to 0-1 range
  let normalized_entropy = if entropy > 0.0 {
    (entropy / 8.0).min(1.0)
  } else {
    0.0
  };

  // Apply sensitivity factor
  (normalized_entropy * config.sensitivity).min(1.0)
}

/// Helper function to recognize patterns
fn recognize_patterns_impl(
  history: &[Vec<u8>],
  config: &InternalConfig,
  _cache: &Map<String, Value>,
) -> (u32, Vec<String>, f64) {
  if history.is_empty() {
    return (0, Vec::new(), 0.0);
  }

  let mut patterns = Vec::new();
  let mut total_score = 0.0;
  let mut pattern_count = 0u32;

  // Simple pattern detection: find repeating sequences
  if history.len() > 1 {
    for i in 0..history.len() - 1 {
      let current = &history[i];
      let next = &history[i + 1];

      if current.len() > 4 && next.len() > 4 {
        let min_len = current.len().min(next.len());
        let mut match_count = 0;

        for j in 0..min_len {
          if current[j] == next[j] {
            match_count += 1;
          }
        }

        let similarity = match_count as f64 / min_len as f64;
        if similarity > config.min_confidence {
          patterns.push(format!("pattern_{}", pattern_count));
          total_score += similarity;
          pattern_count += 1;
        }
      }
    }
  }

  // Normalize score
  let final_score = if pattern_count > 0 {
    (total_score / pattern_count as f64).min(1.0)
  } else {
    0.0
  };

  (pattern_count, patterns, final_score)
}

/// Helper function to assess threats
fn assess_threat_impl(data: &[u8], config: &InternalConfig) -> (String, f64, String, Vec<String>) {
  if data.is_empty() {
    return (
      "low".to_string(),
      0.0,
      "none".to_string(),
      vec!["Monitor for activity".to_string()],
    );
  }

  let anomaly_score = calculate_anomaly_score(data, config);

  let (threat_level, severity, threat_type) = if anomaly_score > 0.9 {
    (
      "critical".to_string(),
      0.95,
      "intrusion_detected".to_string(),
    )
  } else if anomaly_score > 0.75 {
    (
      "high".to_string(),
      0.75,
      "suspicious_activity".to_string(),
    )
  } else if anomaly_score > 0.5 {
    (
      "medium".to_string(),
      0.5,
      "unusual_pattern".to_string(),
    )
  } else if anomaly_score > 0.25 {
    ("low".to_string(), 0.25, "minor_anomaly".to_string())
  } else {
    (
      "minimal".to_string(),
      0.1,
      "normal_activity".to_string(),
    )
  };

  let recommendations = match threat_level.as_str() {
    "critical" => vec![
      "Immediately isolate affected system".to_string(),
      "Engage incident response team".to_string(),
      "Collect forensic data".to_string(),
      "Block suspicious IP addresses".to_string(),
    ],
    "high" => vec![
      "Increase monitoring frequency".to_string(),
      "Review recent access logs".to_string(),
      "Enable enhanced logging".to_string(),
    ],
    "medium" => vec![
      "Monitor for escalation".to_string(),
      "Review activity logs".to_string(),
    ],
    "low" => vec!["Continue standard monitoring".to_string()],
    _ => vec!["No action required".to_string()],
  };

  (threat_level, severity, threat_type, recommendations)
}

/// Factory function to create a new analysis engine
#[napi]
pub fn create_analysis_engine() -> napi::Result<AnalysisEngine> {
  AnalysisEngine::new(None)
}

/// Get library version
#[napi]
pub fn get_library_version() -> String {
  format!("aimds-analysis {}", env!("CARGO_PKG_VERSION"))
}
