use napi_derive::napi;
use napi::bindgen_prelude::*;
use std::sync::{Arc, Mutex};

/// Main AIMDS Core client for processing data
#[napi]
pub struct AimdsCoreClient {
  config: Arc<Mutex<ClientConfig>>,
  timeout: u32,
}

/// Internal client configuration
#[derive(Clone)]
#[allow(dead_code)]
struct ClientConfig {
  timeout: u32,
  retries: u32,
  log_level: String,
  max_concurrency: u32,
}

impl Default for ClientConfig {
  fn default() -> Self {
    Self {
      timeout: 5000,
      retries: 3,
      log_level: "info".to_string(),
      max_concurrency: 10,
    }
  }
}

/// Configuration options for AIMDS Core
#[napi(object)]
pub struct Config {
  pub timeout: Option<u32>,
  pub retries: Option<u32>,
  pub log_level: Option<String>,
  pub max_concurrency: Option<u32>,
}

/// Result object from processing
#[napi(object)]
pub struct ProcessResult {
  pub success: bool,
  pub data: Vec<u8>,
  pub message: Option<String>,
}

#[napi]
impl AimdsCoreClient {
  /// Create a new AIMDS Core client with optional configuration
  #[napi(constructor)]
  pub fn new(config: Option<Config>) -> napi::Result<Self> {
    let client_config = if let Some(cfg) = config {
      ClientConfig {
        timeout: cfg.timeout.unwrap_or(5000),
        retries: cfg.retries.unwrap_or(3),
        log_level: cfg.log_level.unwrap_or_else(|| "info".to_string()),
        max_concurrency: cfg.max_concurrency.unwrap_or(10),
      }
    } else {
      ClientConfig::default()
    };

    let timeout = client_config.timeout;
    Ok(AimdsCoreClient {
      config: Arc::new(Mutex::new(client_config)),
      timeout,
    })
  }

  /// Process input data synchronously
  #[napi]
  pub fn process_sync(&self, data: Buffer) -> napi::Result<ProcessResult> {
    if data.is_empty() {
      return Err(napi::Error::from_reason("Input data cannot be empty"));
    }

    match process_data(data.as_ref()) {
      Ok(result) => Ok(ProcessResult {
        success: true,
        data: result,
        message: Some("Processing completed successfully".to_string()),
      }),
      Err(e) => Ok(ProcessResult {
        success: false,
        data: Vec::new(),
        message: Some(format!("Processing failed: {}", e)),
      }),
    }
  }

  /// Process input data asynchronously
  #[napi]
  pub async fn process(&self, data: Buffer) -> napi::Result<ProcessResult> {
    if data.is_empty() {
      return Err(napi::Error::from_reason("Input data cannot be empty"));
    }

    let data_clone = data.to_vec();

    let result = tokio::task::spawn_blocking(move || {
      process_data(&data_clone)
    })
    .await
    .map_err(|e| napi::Error::from_reason(format!("Task join error: {}", e)))?;

    match result {
      Ok(output) => Ok(ProcessResult {
        success: true,
        data: output,
        message: Some("Async processing completed successfully".to_string()),
      }),
      Err(e) => Ok(ProcessResult {
        success: false,
        data: Vec::new(),
        message: Some(format!("Async processing failed: {}", e)),
      }),
    }
  }

  /// Check if client is connected and operational
  #[napi]
  pub fn is_ready(&self) -> bool {
    self.config.lock().is_ok()
  }

  /// Get the current configuration
  #[napi]
  pub fn get_timeout(&self) -> u32 {
    self.timeout
  }

  /// Close the client and release resources
  #[napi]
  pub async fn close(&self) -> napi::Result<()> {
    // Cleanup resources if needed
    Ok(())
  }
}

/// Utility function to process data
fn process_data(data: &[u8]) -> std::result::Result<Vec<u8>, String> {
  // Basic processing: transform data
  // This is a placeholder implementation - actual AIMDS processing would go here
  if data.is_empty() {
    return Err("Cannot process empty data".to_string());
  }

  // Example transformation: reverse and return
  let mut result = data.to_vec();
  result.reverse();
  Ok(result)
}

/// Create a new AIMDS Core client with default configuration
#[napi]
pub fn create_client() -> napi::Result<AimdsCoreClient> {
  AimdsCoreClient::new(None)
}

/// Process data with a default client (utility function)
#[napi]
pub fn process_buffer(data: Buffer) -> napi::Result<ProcessResult> {
  if data.is_empty() {
    return Err(napi::Error::from_reason("Input data cannot be empty"));
  }

  match process_data(data.as_ref()) {
    Ok(result) => Ok(ProcessResult {
      success: true,
      data: result,
      message: Some("Processing completed".to_string()),
    }),
    Err(e) => Ok(ProcessResult {
      success: false,
      data: Vec::new(),
      message: Some(format!("Processing failed: {}", e)),
    }),
  }
}

/// Get version information
#[napi]
pub fn version() -> String {
  format!("aimds-core-napi {}", env!("CARGO_PKG_VERSION"))
}
