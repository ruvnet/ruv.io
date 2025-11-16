use napi::{bindgen_prelude::*, Result};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Represents a single counter metric
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CounterMetric {
  name: String,
  value: u64,
  tags: serde_json::Value,
  timestamp: u64,
}

/// Represents a histogram metric with buckets
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HistogramMetric {
  name: String,
  buckets: HashMap<String, u64>,
  count: u64,
  sum: f64,
  min: f64,
  max: f64,
  tags: serde_json::Value,
  timestamp: u64,
}

/// Represents a gauge metric (current value)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GaugeMetric {
  name: String,
  value: f64,
  tags: serde_json::Value,
  timestamp: u64,
}

/// Aggregated metrics report
#[derive(Serialize, Deserialize, Debug)]
pub struct MetricsReport {
  counters: Vec<CounterMetric>,
  histograms: Vec<HistogramMetric>,
  gauges: Vec<GaugeMetric>,
  total_metrics: usize,
  generated_at: u64,
}

/// Main metrics collector
#[napi]
pub struct MetricsCollector {
  counters: Arc<Mutex<HashMap<String, u64>>>,
  histograms: Arc<Mutex<HashMap<String, (Vec<f64>, f64, f64, f64, u64)>>>,
  gauges: Arc<Mutex<HashMap<String, f64>>>,
  tags: Arc<Mutex<HashMap<String, serde_json::Value>>>,
  counter_timestamps: Arc<Mutex<HashMap<String, u64>>>,
  gauge_timestamps: Arc<Mutex<HashMap<String, u64>>>,
  histogram_timestamps: Arc<Mutex<HashMap<String, u64>>>,
}

#[napi]
impl MetricsCollector {
  /// Create a new metrics collector
  #[napi(constructor)]
  pub fn new() -> Self {
    MetricsCollector {
      counters: Arc::new(Mutex::new(HashMap::new())),
      histograms: Arc::new(Mutex::new(HashMap::new())),
      gauges: Arc::new(Mutex::new(HashMap::new())),
      tags: Arc::new(Mutex::new(HashMap::new())),
      counter_timestamps: Arc::new(Mutex::new(HashMap::new())),
      gauge_timestamps: Arc::new(Mutex::new(HashMap::new())),
      histogram_timestamps: Arc::new(Mutex::new(HashMap::new())),
    }
  }

  /// Increment a counter by value
  #[napi]
  pub fn increment_counter(&self, name: String, value: u32) -> Result<()> {
    let mut counters = self
      .counters
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock counters"))?;
    let counter = counters.entry(name.clone()).or_insert(0);
    *counter = counter.saturating_add(value as u64);

    let mut timestamps = self
      .counter_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?;
    timestamps.insert(name, get_timestamp());

    Ok(())
  }

  /// Get counter value
  #[napi]
  pub fn get_counter(&self, name: String) -> Result<u32> {
    let counters = self
      .counters
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock counters"))?;
    let value = counters
      .get(&name)
      .map(|v| *v as u32)
      .unwrap_or(0);
    Ok(value)
  }

  /// Reset a counter
  #[napi]
  pub fn reset_counter(&self, name: String) -> Result<()> {
    let mut counters = self
      .counters
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock counters"))?;
    counters.remove(&name);

    let mut timestamps = self
      .counter_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?;
    timestamps.remove(&name);

    Ok(())
  }

  /// Record a value in histogram
  #[napi]
  pub fn record_histogram(&self, name: String, value: f64) -> Result<()> {
    let mut histograms = self
      .histograms
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock histograms"))?;

    let entry = histograms
      .entry(name.clone())
      .or_insert_with(|| (vec![], 0.0, f64::MAX, f64::MIN, 0));

    let (values, sum, min, max, count) = entry;
    values.push(value);
    *sum += value;
    *min = min.min(value);
    *max = max.max(value);
    *count += 1;

    *entry = (values.clone(), *sum, *min, *max, *count);

    let mut timestamps = self
      .histogram_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?;
    timestamps.insert(name, get_timestamp());

    Ok(())
  }

  /// Get histogram statistics
  #[napi]
  pub fn get_histogram_stats(&self, name: String) -> Result<String> {
    let histograms = self
      .histograms
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock histograms"))?;

    if let Some((values, sum, min, max, count)) = histograms.get(&name) {
      let avg = if *count > 0 { *sum / *count as f64 } else { 0.0 };

      let stats = serde_json::json!({
        "name": name,
        "count": count,
        "sum": sum,
        "min": min,
        "max": max,
        "average": avg,
        "p50": percentile(values, 0.50),
        "p95": percentile(values, 0.95),
        "p99": percentile(values, 0.99),
      });

      Ok(serde_json::to_string(&stats)
        .map_err(|e| Error::from_reason(format!("Failed to serialize stats: {}", e)))?)
    } else {
      Err(Error::from_reason(format!("Histogram '{}' not found", name)))
    }
  }

  /// Set gauge value
  #[napi]
  pub fn set_gauge(&self, name: String, value: f64) -> Result<()> {
    let mut gauges = self
      .gauges
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauges"))?;
    gauges.insert(name.clone(), value);

    let mut timestamps = self
      .gauge_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?;
    timestamps.insert(name, get_timestamp());

    Ok(())
  }

  /// Get gauge value
  #[napi]
  pub fn get_gauge(&self, name: String) -> Result<f64> {
    let gauges = self
      .gauges
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauges"))?;
    let value = gauges.get(&name).copied().unwrap_or(0.0);
    Ok(value)
  }

  /// Increment gauge
  #[napi]
  pub fn increment_gauge(&self, name: String, delta: f64) -> Result<()> {
    let mut gauges = self
      .gauges
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauges"))?;
    let gauge = gauges.entry(name.clone()).or_insert(0.0);
    *gauge += delta;

    let mut timestamps = self
      .gauge_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?;
    timestamps.insert(name, get_timestamp());

    Ok(())
  }

  /// Decrement gauge
  #[napi]
  pub fn decrement_gauge(&self, name: String, delta: f64) -> Result<()> {
    let mut gauges = self
      .gauges
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauges"))?;
    let gauge = gauges.entry(name.clone()).or_insert(0.0);
    *gauge -= delta;

    let mut timestamps = self
      .gauge_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?;
    timestamps.insert(name, get_timestamp());

    Ok(())
  }

  /// Get all counters
  #[napi]
  pub fn get_all_counters(&self) -> Result<String> {
    let counters = self
      .counters
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock counters"))?;
    let timestamps = self
      .counter_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?;

    let result: Vec<CounterMetric> = counters
      .iter()
      .map(|(name, value)| CounterMetric {
        name: name.clone(),
        value: *value,
        tags: serde_json::json!({}),
        timestamp: *timestamps.get(name).unwrap_or(&0),
      })
      .collect();

    Ok(
      serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize counters: {}", e)))?,
    )
  }

  /// Get all gauges
  #[napi]
  pub fn get_all_gauges(&self) -> Result<String> {
    let gauges = self
      .gauges
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauges"))?;
    let timestamps = self
      .gauge_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?;

    let result: Vec<GaugeMetric> = gauges
      .iter()
      .map(|(name, value)| GaugeMetric {
        name: name.clone(),
        value: *value,
        tags: serde_json::json!({}),
        timestamp: *timestamps.get(name).unwrap_or(&0),
      })
      .collect();

    Ok(
      serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize gauges: {}", e)))?,
    )
  }

  /// Generate metrics report
  #[napi]
  pub fn generate_report(&self) -> Result<String> {
    let counters = self
      .counters
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock counters"))?;
    let counter_timestamps = self
      .counter_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock counter timestamps"))?;
    let gauges = self
      .gauges
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauges"))?;
    let gauge_timestamps = self
      .gauge_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauge timestamps"))?;
    let histograms = self
      .histograms
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock histograms"))?;
    let histogram_timestamps = self
      .histogram_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock histogram timestamps"))?;

    let counter_metrics: Vec<CounterMetric> = counters
      .iter()
      .map(|(name, value)| CounterMetric {
        name: name.clone(),
        value: *value,
        tags: serde_json::json!({}),
        timestamp: *counter_timestamps.get(name).unwrap_or(&0),
      })
      .collect();

    let gauge_metrics: Vec<GaugeMetric> = gauges
      .iter()
      .map(|(name, value)| GaugeMetric {
        name: name.clone(),
        value: *value,
        tags: serde_json::json!({}),
        timestamp: *gauge_timestamps.get(name).unwrap_or(&0),
      })
      .collect();

    let histogram_metrics: Vec<HistogramMetric> = histograms
      .iter()
      .map(|(name, (_, sum, min, max, count))| HistogramMetric {
        name: name.clone(),
        buckets: HashMap::new(),
        count: *count,
        sum: *sum,
        min: *min,
        max: *max,
        tags: serde_json::json!({}),
        timestamp: *histogram_timestamps.get(name).unwrap_or(&0),
      })
      .collect();

    let total_metrics = counter_metrics.len() + gauge_metrics.len() + histogram_metrics.len();

    let report = MetricsReport {
      counters: counter_metrics,
      histograms: histogram_metrics,
      gauges: gauge_metrics,
      total_metrics,
      generated_at: get_timestamp(),
    };

    Ok(
      serde_json::to_string(&report)
        .map_err(|e| Error::from_reason(format!("Failed to serialize report: {}", e)))?,
    )
  }

  /// Clear all metrics
  #[napi]
  pub fn clear_all(&self) -> Result<()> {
    self
      .counters
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock counters"))?
      .clear();
    self
      .gauges
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauges"))?
      .clear();
    self
      .histograms
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock histograms"))?
      .clear();
    self
      .counter_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?
      .clear();
    self
      .gauge_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?
      .clear();
    self
      .histogram_timestamps
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock timestamps"))?
      .clear();
    Ok(())
  }

  /// Get count of all metrics
  #[napi]
  pub fn count_metrics(&self) -> Result<u32> {
    let counters = self
      .counters
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock counters"))?;
    let gauges = self
      .gauges
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock gauges"))?;
    let histograms = self
      .histograms
      .lock()
      .map_err(|_| Error::from_reason("Failed to lock histograms"))?;

    let total = (counters.len() + gauges.len() + histograms.len()) as u32;
    Ok(total)
  }
}

// ============ Helper Functions ============

fn get_timestamp() -> u64 {
  use std::time::{SystemTime, UNIX_EPOCH};
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis() as u64
}

fn percentile(values: &[f64], p: f64) -> f64 {
  if values.is_empty() {
    return 0.0;
  }

  let mut sorted = values.to_vec();
  sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

  let index = ((p * sorted.len() as f64).ceil() as usize).saturating_sub(1);
  sorted.get(index).copied().unwrap_or(0.0)
}
