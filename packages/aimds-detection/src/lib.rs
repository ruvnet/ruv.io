use chrono::Utc;
use napi_derive::napi;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicU64, Ordering};

/// Detection event structure
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DetectionEvent {
    pub event_id: String,
    pub event_type: String,
    pub severity: String,
    pub timestamp: String,
    pub source: String,
    pub destination: String,
    pub payload: String,
    pub metadata: serde_json::Value,
}

/// Detection signature structure
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DetectionSignature {
    pub signature_id: String,
    pub name: String,
    pub pattern: String,
    pub signature_type: String,
    pub severity: String,
    pub enabled: bool,
}

/// Threshold configuration for anomaly detection
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ThresholdConfig {
    pub metric_name: String,
    pub threshold_value: f64,
    pub duration_seconds: u64,
    pub comparison_operator: String, // "gt", "lt", "eq", "gte", "lte"
}

/// Detection result structure
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DetectionResult {
    pub detected: bool,
    pub signature_id: Option<String>,
    pub signature_name: Option<String>,
    pub severity: String,
    pub confidence: f64,
    pub matched_pattern: Option<String>,
    pub event_details: serde_json::Value,
}

/// Anomaly detection result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnomalyResult {
    pub is_anomaly: bool,
    pub anomaly_type: String,
    pub anomaly_score: f64,
    pub threshold_exceeded: bool,
    pub metrics: serde_json::Value,
}

/// Event correlation result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CorrelationResult {
    pub correlated: bool,
    pub correlation_type: String,
    pub related_events: Vec<String>,
    pub correlation_score: f64,
}

/// DetectionEngine - Main detection class
#[napi]
pub struct DetectionEngine {
    signatures: Arc<Mutex<HashMap<String, DetectionSignature>>>,
    thresholds: Arc<Mutex<HashMap<String, ThresholdConfig>>>,
    event_history: Arc<Mutex<VecDeque<DetectionEvent>>>,
    max_history_size: usize,
}

#[napi]
impl DetectionEngine {
    /// Create a new DetectionEngine instance
    #[napi(constructor)]
    pub fn new(max_history_size: Option<u32>) -> napi::Result<Self> {
        let size = max_history_size.unwrap_or(10000) as usize;
        Ok(DetectionEngine {
            signatures: Arc::new(Mutex::new(HashMap::new())),
            thresholds: Arc::new(Mutex::new(HashMap::new())),
            event_history: Arc::new(Mutex::new(VecDeque::with_capacity(size))),
            max_history_size: size,
        })
    }

    /// Register a detection signature
    #[napi]
    pub fn register_signature(&self, signature_json: String) -> napi::Result<bool> {
        match serde_json::from_str::<DetectionSignature>(&signature_json) {
            Ok(sig) => {
                let mut sigs = self
                    .signatures
                    .lock()
                    .map_err(|_| napi::Error::from_reason("Failed to lock signatures"))?;
                sigs.insert(sig.signature_id.clone(), sig);
                Ok(true)
            }
            Err(e) => Err(napi::Error::from_reason(format!(
                "Failed to parse signature: {}",
                e
            ))),
        }
    }

    /// Register a threshold configuration
    #[napi]
    pub fn register_threshold(&self, threshold_json: String) -> napi::Result<bool> {
        match serde_json::from_str::<ThresholdConfig>(&threshold_json) {
            Ok(threshold) => {
                let mut thresholds = self
                    .thresholds
                    .lock()
                    .map_err(|_| napi::Error::from_reason("Failed to lock thresholds"))?;
                thresholds.insert(threshold.metric_name.clone(), threshold);
                Ok(true)
            }
            Err(e) => Err(napi::Error::from_reason(format!(
                "Failed to parse threshold: {}",
                e
            ))),
        }
    }

    /// Perform signature matching on an event
    #[napi]
    pub fn match_signature(&self, event_json: String) -> napi::Result<String> {
        let event: DetectionEvent = serde_json::from_str(&event_json)
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse event: {}", e)))?;

        let sigs = self
            .signatures
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock signatures"))?;

        for (_, sig) in sigs.iter() {
            if !sig.enabled {
                continue;
            }

            if let Ok(regex) = Regex::new(&sig.pattern) {
                if regex.is_match(&event.payload) {
                    let result = DetectionResult {
                        detected: true,
                        signature_id: Some(sig.signature_id.clone()),
                        signature_name: Some(sig.name.clone()),
                        severity: sig.severity.clone(),
                        confidence: 0.95,
                        matched_pattern: Some(sig.pattern.clone()),
                        event_details: serde_json::json!({
                            "event_id": event.event_id,
                            "event_type": event.event_type,
                            "source": event.source,
                            "destination": event.destination,
                        }),
                    };

                    return serde_json::to_string(&result).map_err(|e| {
                        napi::Error::from_reason(format!("Failed to serialize result: {}", e))
                    });
                }
            }
        }

        let result = DetectionResult {
            detected: false,
            signature_id: None,
            signature_name: None,
            severity: "low".to_string(),
            confidence: 0.0,
            matched_pattern: None,
            event_details: serde_json::json!({}),
        };

        serde_json::to_string(&result)
            .map_err(|e| napi::Error::from_reason(format!("Failed to serialize result: {}", e)))
    }

    /// Detect intrusion patterns in events
    #[napi]
    pub fn detect_intrusion(&self, event_json: String) -> napi::Result<String> {
        let event: DetectionEvent = serde_json::from_str(&event_json)
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse event: {}", e)))?;

        let payload = &event.payload;
        let mut threat_level = 0.0;
        let mut indicators = vec![];

        // Check for SQL injection patterns
        if payload.contains("SELECT") || payload.contains("DROP") || payload.contains("INSERT") {
            threat_level += 0.3;
            indicators.push("SQL_INJECTION".to_string());
        }

        // Check for XSS patterns
        if payload.contains("<script>") || payload.contains("javascript:") {
            threat_level += 0.3;
            indicators.push("XSS".to_string());
        }

        // Check for buffer overflow patterns
        if payload.len() > 10000 {
            threat_level += 0.2;
            indicators.push("BUFFER_OVERFLOW_CANDIDATE".to_string());
        }

        // Check for command injection patterns
        if payload.contains("; rm ") || payload.contains("|| cat") {
            threat_level += 0.35;
            indicators.push("COMMAND_INJECTION".to_string());
        }

        let result = DetectionResult {
            detected: threat_level > 0.1,
            signature_id: None,
            signature_name: Some("Intrusion Detection".to_string()),
            severity: if threat_level > 0.5 {
                "critical".to_string()
            } else if threat_level > 0.3 {
                "high".to_string()
            } else {
                "medium".to_string()
            },
            confidence: threat_level,
            matched_pattern: None,
            event_details: serde_json::json!({
                "indicators": indicators,
                "threat_level": threat_level,
                "source": event.source,
                "destination": event.destination,
            }),
        };

        serde_json::to_string(&result)
            .map_err(|e| napi::Error::from_reason(format!("Failed to serialize result: {}", e)))
    }

    /// Detect anomalous events
    #[napi]
    pub fn detect_anomaly(&self, event_json: String) -> napi::Result<String> {
        let event: DetectionEvent = serde_json::from_str(&event_json)
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse event: {}", e)))?;

        let mut anomaly_score = 0.0;
        let mut anomaly_type = String::new();

        // Check for unusual payload size
        if event.payload.len() > 5000 {
            anomaly_score += 0.25;
            anomaly_type = "LARGE_PAYLOAD".to_string();
        }

        // Check for unusual source patterns
        if !event.source.contains('.') {
            anomaly_score += 0.15;
        }

        // Check for unusual destination patterns
        if event.destination.starts_with("127.") {
            anomaly_score += 0.1;
        }

        // Check for suspicious event type
        if event.event_type.to_uppercase().contains("ERROR")
            || event.event_type.to_uppercase().contains("FAILED")
        {
            anomaly_score += 0.2;
            if anomaly_type.is_empty() {
                anomaly_type = "SUSPICIOUS_ERROR".to_string();
            }
        }

        let result = AnomalyResult {
            is_anomaly: anomaly_score >= 0.2,
            anomaly_type: if anomaly_type.is_empty() {
                "NORMAL".to_string()
            } else {
                anomaly_type
            },
            anomaly_score,
            threshold_exceeded: anomaly_score > 0.5,
            metrics: serde_json::json!({
                "payload_size": event.payload.len(),
                "source": event.source,
                "event_type": event.event_type,
            }),
        };

        serde_json::to_string(&result)
            .map_err(|e| napi::Error::from_reason(format!("Failed to serialize result: {}", e)))
    }

    /// Correlate events for pattern detection
    #[napi]
    pub fn correlate_events(
        &self,
        event1_json: String,
        event2_json: String,
    ) -> napi::Result<String> {
        let event1: DetectionEvent = serde_json::from_str(&event1_json)
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse event1: {}", e)))?;

        let event2: DetectionEvent = serde_json::from_str(&event2_json)
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse event2: {}", e)))?;

        let mut correlation_score = 0.0;
        let mut correlation_type = String::new();
        let mut related_events = vec![];

        // Check if same source
        if event1.source == event2.source {
            correlation_score += 0.3;
            correlation_type = "SAME_SOURCE".to_string();
            related_events.push(event2.event_id.clone());
        }

        // Check if same destination
        if event1.destination == event2.destination {
            correlation_score += 0.3;
            correlation_type = "SAME_DESTINATION".to_string();
            related_events.push(event2.event_id.clone());
        }

        // Check if same event type
        if event1.event_type == event2.event_type {
            correlation_score += 0.2;
        }

        let result = CorrelationResult {
            correlated: correlation_score > 0.25,
            correlation_type,
            related_events,
            correlation_score,
        };

        serde_json::to_string(&result)
            .map_err(|e| napi::Error::from_reason(format!("Failed to serialize result: {}", e)))
    }

    /// Monitor thresholds for alerting
    #[napi]
    pub fn monitor_threshold(&self, metric_name: String, metric_value: f64) -> napi::Result<bool> {
        let thresholds = self
            .thresholds
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock thresholds"))?;

        if let Some(threshold) = thresholds.get(&metric_name) {
            let exceeded = match threshold.comparison_operator.as_str() {
                "gt" => metric_value > threshold.threshold_value,
                "lt" => metric_value < threshold.threshold_value,
                "gte" => metric_value >= threshold.threshold_value,
                "lte" => metric_value <= threshold.threshold_value,
                "eq" => (metric_value - threshold.threshold_value).abs() < 0.0001,
                _ => false,
            };
            Ok(exceeded)
        } else {
            Ok(false)
        }
    }

    /// Record an event in history
    #[napi]
    pub fn record_event(&self, event_json: String) -> napi::Result<String> {
        let mut event: DetectionEvent = serde_json::from_str(&event_json)
            .map_err(|e| napi::Error::from_reason(format!("Failed to parse event: {}", e)))?;

        if event.event_id.is_empty() {
            event.event_id = format!("evt_{}", Utc::now().timestamp_millis());
        }

        let mut history = self
            .event_history
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock event history"))?;

        if history.len() >= self.max_history_size {
            history.pop_front();
        }

        history.push_back(event.clone());

        serde_json::to_string(&event)
            .map_err(|e| napi::Error::from_reason(format!("Failed to serialize event: {}", e)))
    }

    /// Get event history size
    #[napi]
    pub fn get_history_size(&self) -> napi::Result<u32> {
        let history = self
            .event_history
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock event history"))?;
        Ok(history.len() as u32)
    }

    /// Get signature count
    #[napi]
    pub fn get_signature_count(&self) -> napi::Result<u32> {
        let sigs = self
            .signatures
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock signatures"))?;
        Ok(sigs.len() as u32)
    }

    /// Get threshold count
    #[napi]
    pub fn get_threshold_count(&self) -> napi::Result<u32> {
        let thresholds = self
            .thresholds
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock thresholds"))?;
        Ok(thresholds.len() as u32)
    }

    /// Clear all signatures
    #[napi]
    pub fn clear_signatures(&self) -> napi::Result<bool> {
        let mut sigs = self
            .signatures
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock signatures"))?;
        sigs.clear();
        Ok(true)
    }

    /// Clear all thresholds
    #[napi]
    pub fn clear_thresholds(&self) -> napi::Result<bool> {
        let mut thresholds = self
            .thresholds
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock thresholds"))?;
        thresholds.clear();
        Ok(true)
    }

    /// Clear event history
    #[napi]
    pub fn clear_history(&self) -> napi::Result<bool> {
        let mut history = self
            .event_history
            .lock()
            .map_err(|_| napi::Error::from_reason("Failed to lock event history"))?;
        history.clear();
        Ok(true)
    }
}

/// Utility functions

/// Check if a string matches a pattern
#[napi]
pub fn pattern_match(text: String, pattern: String) -> napi::Result<bool> {
    match Regex::new(&pattern) {
        Ok(regex) => Ok(regex.is_match(&text)),
        Err(e) => Err(napi::Error::from_reason(format!(
            "Invalid regex pattern: {}",
            e
        ))),
    }
}

/// Calculate severity score based on indicators
#[napi]
pub fn calculate_severity(indicators: Vec<String>) -> f64 {
    let mut score = 0.0;
    let count = indicators.len() as f64;
    for indicator in &indicators {
        score += match indicator.as_str() {
            "CRITICAL" => 1.0,
            "HIGH" => 0.8,
            "MEDIUM" => 0.5,
            "LOW" => 0.2,
            _ => 0.1,
        };
    }
    if count > 0.0 {
        (score / count).min(1.0)
    } else {
        0.0
    }
}

// Global counter for unique event IDs
use std::sync::OnceLock;
fn get_id_counter() -> &'static AtomicU64 {
    static COUNTER: OnceLock<AtomicU64> = OnceLock::new();
    COUNTER.get_or_init(|| AtomicU64::new(0))
}

/// Generate unique event ID
#[napi]
pub fn generate_event_id(prefix: String) -> String {
    let counter = get_id_counter();
    let seq = counter.fetch_add(1, Ordering::SeqCst);
    format!("{}_{}_{}", prefix, Utc::now().timestamp_millis(), seq)
}

/// Validate event structure
#[napi]
pub fn validate_event(event_json: String) -> napi::Result<bool> {
    match serde_json::from_str::<DetectionEvent>(&event_json) {
        Ok(event) => Ok(
            !event.event_id.is_empty()
                && !event.event_type.is_empty()
                && !event.source.is_empty()
                && !event.destination.is_empty(),
        ),
        Err(_) => Ok(false),
    }
}
