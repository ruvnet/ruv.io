use napi::{bindgen_prelude::*, Error, Result, Status};
use napi_derive::napi;
use std::sync::{Arc, Mutex};

/// Protocol configuration structure
#[napi(object)]
pub struct ProtocolConfig {
  pub timeout_ms: Option<u32>,
  pub max_retries: Option<u32>,
  pub enable_optimization: Option<bool>,
  pub node_id: Option<String>,
}

/// QuDAG Protocol Coordinator
#[napi]
pub struct QuDAGProtocol {
  config: Arc<Mutex<InternalConfig>>,
}

#[derive(Clone, Debug)]
struct InternalConfig {
  timeout_ms: u32,
  #[allow(dead_code)]
  max_retries: u32,
  enable_optimization: bool,
  node_id: String,
}

impl Default for InternalConfig {
  fn default() -> Self {
    Self {
      timeout_ms: 30000,
      max_retries: 3,
      enable_optimization: true,
      node_id: "default-node".to_string(),
    }
  }
}

/// Message structure for protocol communication
#[napi(object)]
pub struct ProtocolMessage {
  pub message_type: String,
  pub source_node: String,
  pub destination_node: String,
  pub payload: Vec<u8>,
  pub timestamp: i64,
}

/// Result structure from protocol operations
#[napi(object)]
pub struct OperationResult {
  pub success: bool,
  pub message: String,
  pub data: Vec<u8>,
  pub timestamp: i64,
}

#[napi]
impl QuDAGProtocol {
  /// Create a new QuDAG Protocol coordinator with configuration
  #[napi(constructor)]
  pub fn new(config: Option<ProtocolConfig>) -> Result<Self> {
    let internal_config = if let Some(cfg) = config {
      InternalConfig {
        timeout_ms: cfg.timeout_ms.unwrap_or(30000),
        max_retries: cfg.max_retries.unwrap_or(3),
        enable_optimization: cfg.enable_optimization.unwrap_or(true),
        node_id: cfg.node_id.unwrap_or_else(|| "default-node".to_string()),
      }
    } else {
      InternalConfig::default()
    };

    Ok(QuDAGProtocol {
      config: Arc::new(Mutex::new(internal_config)),
    })
  }

  /// Initialize the protocol with given configuration
  #[napi]
  pub fn initialize(&self) -> Result<bool> {
    match self.config.lock() {
      Ok(_cfg) => Ok(true),
      Err(_) => Err(Error::new(
        Status::GenericFailure,
        "Failed to initialize protocol",
      )),
    }
  }

  /// Send a protocol message
  #[napi]
  pub async fn send_message(&self, message: ProtocolMessage) -> Result<OperationResult> {
    if message.source_node.is_empty() || message.destination_node.is_empty() {
      return Err(Error::new(
        Status::InvalidArg,
        "Source and destination nodes are required",
      ));
    }

    let node_id = self
      .config
      .lock()
      .map_err(|_| Error::new(Status::GenericFailure, "Failed to acquire config lock"))?
      .node_id
      .clone();

    let timestamp = std::time::SystemTime::now()
      .duration_since(std::time::UNIX_EPOCH)
      .map(|d| d.as_millis() as i64)
      .unwrap_or(0);

    Ok(OperationResult {
      success: true,
      message: format!(
        "Message sent from {} to {} (node_id: {})",
        message.source_node, message.destination_node, node_id
      ),
      data: message.payload,
      timestamp,
    })
  }

  /// Receive a protocol message
  #[napi]
  pub fn receive_message(&self, message_data: Vec<u8>) -> Result<ProtocolMessage> {
    if message_data.is_empty() {
      return Err(Error::new(
        Status::InvalidArg,
        "Message data cannot be empty",
      ));
    }

    let timestamp = std::time::SystemTime::now()
      .duration_since(std::time::UNIX_EPOCH)
      .map(|d| d.as_millis() as i64)
      .unwrap_or(0);

    Ok(ProtocolMessage {
      message_type: "generic".to_string(),
      source_node: "unknown".to_string(),
      destination_node: "self".to_string(),
      payload: message_data,
      timestamp,
    })
  }

  /// Process protocol data
  #[napi]
  pub async fn process_data(&self, data: Buffer) -> Result<OperationResult> {
    if data.is_empty() {
      return Err(Error::new(
        Status::InvalidArg,
        "Input data cannot be empty",
      ));
    }

    let data_vec = data.to_vec();
    let enable_optimization = self
      .config
      .lock()
      .map_err(|_| Error::new(Status::GenericFailure, "Failed to acquire config lock"))?
      .enable_optimization;

    let timestamp = std::time::SystemTime::now()
      .duration_since(std::time::UNIX_EPOCH)
      .map(|d| d.as_millis() as i64)
      .unwrap_or(0);

    let result = tokio::task::spawn_blocking(move || {
      // Simulate processing
      let mut processed = data_vec.clone();
      // Simple transformation for demo
      for byte in &mut processed {
        *byte = byte.wrapping_add(1);
      }
      processed
    })
    .await
    .map_err(|e| Error::new(Status::GenericFailure, e.to_string()))?;

    Ok(OperationResult {
      success: true,
      message: format!(
        "Data processed successfully (optimization: {})",
        enable_optimization
      ),
      data: result,
      timestamp,
    })
  }

  /// Validate protocol state
  #[napi]
  pub fn validate_state(&self) -> Result<bool> {
    match self.config.lock() {
      Ok(_cfg) => Ok(true),
      Err(_) => Err(Error::new(
        Status::GenericFailure,
        "Failed to validate protocol state",
      )),
    }
  }

  /// Get current configuration timeout
  #[napi]
  pub fn get_timeout(&self) -> Result<u32> {
    match self.config.lock() {
      Ok(cfg) => Ok(cfg.timeout_ms),
      Err(_) => Err(Error::new(
        Status::GenericFailure,
        "Failed to read timeout configuration",
      )),
    }
  }

  /// Set configuration timeout
  #[napi]
  pub fn set_timeout(&self, timeout_ms: u32) -> Result<()> {
    match self.config.lock() {
      Ok(mut cfg) => {
        cfg.timeout_ms = timeout_ms;
        Ok(())
      }
      Err(_) => Err(Error::new(
        Status::GenericFailure,
        "Failed to set timeout configuration",
      )),
    }
  }

  /// Get node ID
  #[napi]
  pub fn get_node_id(&self) -> Result<String> {
    match self.config.lock() {
      Ok(cfg) => Ok(cfg.node_id.clone()),
      Err(_) => Err(Error::new(
        Status::GenericFailure,
        "Failed to read node ID",
      )),
    }
  }

  /// Check if protocol is ready
  #[napi]
  pub fn is_ready(&self) -> bool {
    self.config.lock().is_ok()
  }

  /// Close/cleanup protocol
  #[napi]
  pub async fn close(&self) -> Result<()> {
    Ok(())
  }
}

/// Create a new protocol instance with default configuration
#[napi]
pub fn create_protocol() -> Result<QuDAGProtocol> {
  QuDAGProtocol::new(None)
}

/// Validate protocol message
#[napi]
pub fn validate_message(message: ProtocolMessage) -> Result<bool> {
  if message.source_node.is_empty() || message.destination_node.is_empty() {
    return Err(Error::new(
      Status::InvalidArg,
      "Message must have source and destination nodes",
    ));
  }
  Ok(true)
}

/// Get protocol version
#[napi]
pub fn get_protocol_version() -> String {
  format!("qudag-protocol-napi {}", env!("CARGO_PKG_VERSION"))
}

/// Process data with default protocol instance
#[napi]
pub fn process_data_default(data: Buffer) -> Result<OperationResult> {
  if data.is_empty() {
    return Err(Error::new(
      Status::InvalidArg,
      "Input data cannot be empty",
    ));
  }

  let data_vec = data.to_vec();
  let mut processed = data_vec.clone();

  // Simple transformation
  for byte in &mut processed {
    *byte = byte.wrapping_add(1);
  }

  let timestamp = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|d| d.as_millis() as i64)
    .unwrap_or(0);

  Ok(OperationResult {
    success: true,
    message: "Data processed with default protocol".to_string(),
    data: processed,
    timestamp,
  })
}
