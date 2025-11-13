use napi_derive::napi;
use std::sync::{Arc, Mutex};

#[napi]
pub struct MicroCoreClient {
  config: ClientConfig,
  processed_count: Arc<Mutex<u32>>,
  total_time_ms: Arc<Mutex<u32>>,
}

#[derive(Clone)]
struct ClientConfig {
  timeout: u32,
  retries: u32,
  max_concurrency: u32,
  log_level: String,
}

#[napi(object)]
pub struct Config {
  pub timeout: Option<u32>,
  pub retries: Option<u32>,
  pub max_concurrency: Option<u32>,
  pub log_level: Option<String>,
}

#[napi]
impl MicroCoreClient {
  #[napi(constructor)]
  pub fn new(config: Option<Config>) -> napi::Result<Self> {
    let cfg = config.unwrap_or(Config {
      timeout: None,
      retries: None,
      max_concurrency: None,
      log_level: None,
    });

    let client_config = ClientConfig {
      timeout: cfg.timeout.unwrap_or(5000),
      retries: cfg.retries.unwrap_or(3),
      max_concurrency: cfg.max_concurrency.unwrap_or(10),
      log_level: cfg.log_level.unwrap_or_else(|| "info".to_string()),
    };

    Ok(MicroCoreClient {
      config: client_config,
      processed_count: Arc::new(Mutex::new(0)),
      total_time_ms: Arc::new(Mutex::new(0)),
    })
  }

  /// Process input buffer synchronously
  #[napi]
  pub fn process_sync(&self, data: napi::bindgen_prelude::Buffer) -> napi::Result<napi::bindgen_prelude::Buffer> {
    let input_data = data.to_vec();

    // Simulate processing
    let processed = self.do_process(&input_data)?;

    // Update statistics
    if let Ok(mut count) = self.processed_count.lock() {
      *count = count.saturating_add(1);
    }

    Ok(napi::bindgen_prelude::Buffer::from(processed))
  }

  /// Process input buffer asynchronously
  #[napi]
  pub fn process(&self, data: napi::bindgen_prelude::Buffer) -> napi::Result<napi::bindgen_prelude::Buffer> {
    // For now, just delegate to sync version
    // In a real implementation, this would use tokio
    self.process_sync(data)
  }

  /// Get statistics about the current state
  #[napi(object)]
  pub fn get_stats(&self) -> napi::Result<Stats> {
    let count = self
      .processed_count
      .lock()
      .map(|c| *c)
      .unwrap_or(0);

    let total_time = self
      .total_time_ms
      .lock()
      .map(|t| *t)
      .unwrap_or(0);

    let average_time = if count > 0 {
      total_time as f64 / count as f64
    } else {
      0.0
    };

    Ok(Stats {
      processed_count: count,
      total_time_ms: total_time,
      average_time_ms: average_time,
    })
  }

  /// Reset internal state
  #[napi]
  pub fn reset(&self) -> napi::Result<()> {
    if let Ok(mut count) = self.processed_count.lock() {
      *count = 0;
    }
    if let Ok(mut time) = self.total_time_ms.lock() {
      *time = 0;
    }
    Ok(())
  }

  /// Close the client and release resources
  #[napi]
  pub fn close(&self) -> napi::Result<()> {
    // Cleanup if needed
    Ok(())
  }
}

#[napi(object)]
pub struct Stats {
  pub processed_count: u32,
  pub total_time_ms: u32,
  pub average_time_ms: f64,
}

impl MicroCoreClient {
  fn do_process(&self, input: &[u8]) -> napi::Result<Vec<u8>> {
    // Simulate micro_core processing
    // This is a basic implementation that echoes the input with a header
    let mut output = Vec::new();

    // Add a simple header
    output.extend_from_slice(b"PROCESSED:");
    output.extend_from_slice(input);

    Ok(output)
  }
}

/// Utility function: Simple processing without creating a client instance
#[napi]
pub fn process_simple(data: napi::bindgen_prelude::Buffer) -> napi::Result<napi::bindgen_prelude::Buffer> {
  let input_data = data.to_vec();

  // Simulate processing
  let mut output = Vec::new();
  output.extend_from_slice(b"PROCESSED:");
  output.extend_from_slice(&input_data);

  Ok(napi::bindgen_prelude::Buffer::from(output))
}

/// Get version information
#[napi]
pub fn get_version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}
