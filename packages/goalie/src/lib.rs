use napi_derive::napi;
use napi::{bindgen_prelude::*, JsObject};
use std::sync::{Arc, Mutex};

/// Configuration for Goalie client
#[napi(object)]
#[derive(Debug, Clone)]
pub struct Config {
  /// Operation timeout in milliseconds
  pub timeout: Option<u32>,
  /// Number of retries for failed operations
  pub retries: Option<u32>,
  /// Logging level
  pub log_level: Option<String>,
  /// Maximum concurrent operations
  pub max_concurrency: Option<u32>,
}

/// Search result object with metadata
#[napi(object)]
pub struct ProcessResult {
  pub success: bool,
  pub data: Vec<u8>,
  pub message: String,
}

/// Main Goalie client for AI research assistance
#[napi]
pub struct Goalie {
  config: Arc<Mutex<Config>>,
  state: Arc<Mutex<InternalState>>,
}

struct InternalState {
  timeout: u32,
  retries: u32,
  log_level: String,
  max_concurrency: u32,
  active_tasks: usize,
}

impl Default for InternalState {
  fn default() -> Self {
    Self {
      timeout: 5000,
      retries: 3,
      log_level: "info".to_string(),
      max_concurrency: 10,
      active_tasks: 0,
    }
  }
}

#[napi]
impl Goalie {
  /// Create a new Goalie client instance
  #[napi(constructor)]
  pub fn new(config: Option<JsObject>) -> Result<Self> {
    let cfg = parse_config(config)?;

    let mut state = InternalState::default();
    if let Some(timeout) = cfg.timeout {
      state.timeout = timeout;
    }
    if let Some(retries) = cfg.retries {
      state.retries = retries;
    }
    if let Some(log_level) = &cfg.log_level {
      state.log_level = log_level.clone();
    }
    if let Some(max_concurrency) = cfg.max_concurrency {
      state.max_concurrency = max_concurrency;
    }

    Ok(Goalie {
      config: Arc::new(Mutex::new(cfg)),
      state: Arc::new(Mutex::new(state)),
    })
  }

  /// Process input data - synchronous implementation
  /// Called from async context via spawn_blocking
  #[napi]
  pub fn process_sync(&self, data: Buffer) -> Result<Buffer> {
    let input_data = data.as_ref().to_vec();
    let mut state = self.state.lock().map_err(|_| {
      Error::new(Status::GenericFailure, "Failed to acquire lock on state")
    })?;

    // Increment active tasks
    state.active_tasks += 1;

    // Simulate processing
    let mut output = Vec::new();
    output.extend_from_slice(&input_data);

    // Simple transformation for demonstration
    for byte in &mut output {
      *byte = byte.wrapping_add(1);
    }

    // Decrement active tasks
    state.active_tasks -= 1;

    Ok(Buffer::from(output))
  }

  /// Execute an operation and return detailed result
  #[napi]
  pub fn execute_sync(&self, input: Option<Buffer>) -> Result<ProcessResult> {
    let data = input.as_ref().map(|b| b.as_ref().to_vec()).unwrap_or_default();

    let mut state = self.state.lock().map_err(|_| {
      Error::new(Status::GenericFailure, "Failed to acquire lock on state")
    })?;

    state.active_tasks += 1;

    let mut output = Vec::new();
    output.extend_from_slice(&data);

    for byte in &mut output {
      *byte = byte.wrapping_add(1);
    }

    state.active_tasks -= 1;

    Ok(ProcessResult {
      success: true,
      data: output,
      message: "Processing completed successfully".to_string(),
    })
  }

  /// Check if the client is still active
  #[napi]
  pub fn is_active(&self) -> Result<bool> {
    Ok(true)
  }

  /// Get current configuration
  #[napi]
  pub fn get_config(&self) -> Result<Config> {
    let cfg = self.config.lock().map_err(|_| {
      Error::new(Status::GenericFailure, "Failed to acquire lock on config")
    })?;
    Ok(cfg.clone())
  }

  /// Get number of active tasks
  #[napi]
  pub fn get_active_tasks(&self) -> Result<u32> {
    let state = self.state.lock().map_err(|_| {
      Error::new(Status::GenericFailure, "Failed to acquire lock on state")
    })?;
    Ok(state.active_tasks as u32)
  }

  /// Close the client and release resources
  #[napi]
  pub fn close_sync(&self) -> Result<()> {
    // Graceful shutdown
    Ok(())
  }
}

/// Parse JavaScript config object to Rust Config struct
fn parse_config(config: Option<JsObject>) -> Result<Config> {
  if let Some(obj) = config {
    let mut cfg = Config {
      timeout: None,
      retries: None,
      log_level: None,
      max_concurrency: None,
    };

    // Try to extract timeout
    if let Ok(timeout) = obj.get_named_property::<u32>("timeout") {
      cfg.timeout = Some(timeout);
    }

    // Try to extract retries
    if let Ok(retries) = obj.get_named_property::<u32>("retries") {
      cfg.retries = Some(retries);
    }

    // Try to extract logLevel
    if let Ok(log_level) = obj.get_named_property::<String>("logLevel") {
      cfg.log_level = Some(log_level);
    }

    // Try to extract maxConcurrency
    if let Ok(max_concurrency) = obj.get_named_property::<u32>("maxConcurrency") {
      cfg.max_concurrency = Some(max_concurrency);
    }

    Ok(cfg)
  } else {
    Ok(Config {
      timeout: None,
      retries: None,
      log_level: None,
      max_concurrency: None,
    })
  }
}

/// Utility function to validate input data
#[napi]
pub fn validate_input(data: Buffer) -> Result<bool> {
  Ok(!data.as_ref().is_empty())
}

/// Utility function to get version
#[napi]
pub fn get_version() -> Result<String> {
  Ok("1.0.3".to_string())
}

/// Utility function to benchmark processing
#[napi]
pub fn benchmark(size: u32, iterations: u32) -> Result<f64> {
  let mut total_time = 0.0;

  for _ in 0..iterations {
    let data = vec![1u8; size as usize];
    let start = std::time::Instant::now();

    let mut output = data.clone();
    for byte in &mut output {
      *byte = byte.wrapping_add(1);
    }

    total_time += start.elapsed().as_secs_f64();
  }

  Ok(total_time / iterations as f64)
}
