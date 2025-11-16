use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Configuration for streaming connections
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StreamConfig {
  pub url: String,
  pub timeout_ms: Option<u32>,
  pub retry_count: Option<u32>,
  pub buffer_size: Option<usize>,
  pub enable_compression: Option<bool>,
}

/// Market data point with timestamp and metadata
#[napi(object)]
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MarketDataPoint {
  pub symbol: String,
  pub price: f64,
  pub volume: f64,
  pub timestamp: i64,
  pub bid: f64,
  pub ask: f64,
  pub bid_size: f64,
  pub ask_size: f64,
}

/// Event type for stream notifications
#[napi]
pub enum EventType {
  DataReceived,
  ConnectionEstablished,
  ConnectionClosed,
  Error,
  Reconnecting,
}

/// Stream event with metadata
#[napi(object)]
pub struct StreamEvent {
  pub event_type: String,
  pub message: String,
  pub timestamp: i64,
  pub stream_id: String,
}

/// Connection state information
#[napi(object)]
pub struct ConnectionState {
  pub stream_id: String,
  pub is_connected: bool,
  pub error_count: u32,
  pub data_count: u32,
  pub last_heartbeat: i64,
  pub uptime_ms: i64,
}

/// Statistics for stream performance
#[napi(object)]
pub struct StreamStatistics {
  pub stream_id: String,
  pub total_messages: u32,
  pub total_errors: u32,
  pub average_latency_ms: f64,
  pub bytes_received: f64,
  pub uptime_seconds: f64,
  pub reconnect_count: u32,
}

/// StreamManager for handling real-time market data connections
#[napi]
pub struct StreamManager {
  stream_id: String,
  config: StreamConfig,
  is_connected: bool,
  error_count: u32,
  data_count: u32,
  message_buffer: Vec<String>,
  last_heartbeat: i64,
  creation_time: i64,
  total_bytes: u64,
  reconnect_count: u32,
}

#[napi]
impl StreamManager {
  /// Create a new StreamManager instance
  #[napi(constructor)]
  pub fn new(url: String, timeout_ms: Option<u32>) -> napi::Result<Self> {
    if url.is_empty() {
      return Err(Error::from_reason("URL cannot be empty"));
    }

    let now = chrono::Local::now().timestamp_millis();

    Ok(StreamManager {
      stream_id: Uuid::new_v4().to_string(),
      config: StreamConfig {
        url,
        timeout_ms,
        retry_count: Some(3),
        buffer_size: Some(4096),
        enable_compression: Some(false),
      },
      is_connected: false,
      error_count: 0,
      data_count: 0,
      message_buffer: Vec::new(),
      last_heartbeat: now,
      creation_time: now,
      total_bytes: 0,
      reconnect_count: 0,
    })
  }

  /// Connect to the WebSocket stream
  #[napi]
  pub fn connect(&mut self) -> napi::Result<bool> {
    if self.is_connected {
      return Ok(true);
    }

    // Simulate connection
    self.is_connected = true;
    self.last_heartbeat = chrono::Local::now().timestamp_millis();

    Ok(true)
  }

  /// Disconnect from the stream
  #[napi]
  pub fn disconnect(&mut self) -> napi::Result<bool> {
    self.is_connected = false;
    Ok(true)
  }

  /// Check if stream is connected
  #[napi]
  pub fn is_connected(&self) -> bool {
    self.is_connected
  }

  /// Get the stream ID
  #[napi]
  pub fn get_stream_id(&self) -> String {
    self.stream_id.clone()
  }

  /// Add market data to the stream
  #[napi]
  pub fn add_market_data(&mut self, symbol: String, price: f64, volume: f64) -> napi::Result<()> {
    if !self.is_connected {
      self.error_count += 1;
      return Err(Error::from_reason("Stream not connected"));
    }

    let timestamp = chrono::Local::now().timestamp_millis();
    let data = MarketDataPoint {
      symbol: symbol.clone(),
      price,
      volume,
      timestamp,
      bid: price * 0.99,
      ask: price * 1.01,
      bid_size: volume * 0.5,
      ask_size: volume * 0.5,
    };

    let json_str = serde_json::to_string(&data)
      .map_err(|e| Error::from_reason(format!("JSON serialization failed: {}", e)))?;

    self.message_buffer.push(json_str.clone());
    self.data_count += 1;
    self.total_bytes += json_str.len() as u64;

    Ok(())
  }

  /// Get buffered messages
  #[napi]
  pub fn get_buffered_messages(&self) -> Vec<String> {
    self.message_buffer.clone()
  }

  /// Clear the message buffer
  #[napi]
  pub fn clear_buffer(&mut self) -> napi::Result<()> {
    self.message_buffer.clear();
    Ok(())
  }

  /// Get connection state
  #[napi]
  pub fn get_connection_state(&self) -> ConnectionState {
    ConnectionState {
      stream_id: self.stream_id.clone(),
      is_connected: self.is_connected,
      error_count: self.error_count,
      data_count: self.data_count,
      last_heartbeat: self.last_heartbeat,
      uptime_ms: chrono::Local::now().timestamp_millis() - self.creation_time,
    }
  }

  /// Get stream statistics
  #[napi]
  pub fn get_statistics(&self) -> StreamStatistics {
    let uptime_ms = chrono::Local::now().timestamp_millis() - self.creation_time;
    let uptime_seconds = if self.is_connected {
      uptime_ms as f64 / 1000.0
    } else {
      0.0
    };

    let avg_latency = if self.data_count > 0 {
      uptime_seconds / self.data_count as f64
    } else {
      0.0
    };

    StreamStatistics {
      stream_id: self.stream_id.clone(),
      total_messages: self.data_count,
      total_errors: self.error_count,
      average_latency_ms: avg_latency,
      bytes_received: self.total_bytes as f64,
      uptime_seconds,
      reconnect_count: self.reconnect_count,
    }
  }

  /// Reconnect to the stream
  #[napi]
  pub fn reconnect(&mut self) -> napi::Result<bool> {
    self.disconnect()?;

    // Simulate reconnection delay
    std::thread::sleep(std::time::Duration::from_millis(100));

    self.reconnect_count += 1;
    self.connect()
  }

  /// Subscribe to a symbol
  #[napi]
  pub fn subscribe(&mut self, symbol: String) -> napi::Result<()> {
    if !self.is_connected {
      return Err(Error::from_reason("Stream not connected"));
    }

    let msg = format!("SUBSCRIBE:{}", symbol);
    self.message_buffer.push(msg);

    Ok(())
  }

  /// Unsubscribe from a symbol
  #[napi]
  pub fn unsubscribe(&mut self, symbol: String) -> napi::Result<()> {
    if !self.is_connected {
      return Err(Error::from_reason("Stream not connected"));
    }

    let msg = format!("UNSUBSCRIBE:{}", symbol);
    self.message_buffer.push(msg);

    Ok(())
  }

  /// Send heartbeat ping
  #[napi]
  pub fn heartbeat(&mut self) -> napi::Result<()> {
    if !self.is_connected {
      self.error_count += 1;
      return Err(Error::from_reason("Stream not connected"));
    }

    self.last_heartbeat = chrono::Local::now().timestamp_millis();
    Ok(())
  }

  /// Get current message buffer size
  #[napi]
  pub fn get_buffer_size(&self) -> u32 {
    self.message_buffer.len() as u32
  }

  /// Reset error count
  #[napi]
  pub fn reset_error_count(&mut self) -> napi::Result<()> {
    self.error_count = 0;
    Ok(())
  }

  /// Get error count
  #[napi]
  pub fn get_error_count(&self) -> u32 {
    self.error_count
  }

  /// Get data count
  #[napi]
  pub fn get_data_count(&self) -> u32 {
    self.data_count
  }

  /// Process batch of market data updates
  #[napi]
  pub fn batch_add_market_data(&mut self, data_json: String) -> napi::Result<u32> {
    if !self.is_connected {
      self.error_count += 1;
      return Err(Error::from_reason("Stream not connected"));
    }

    let items: Vec<serde_json::Value> =
      serde_json::from_str(&data_json)
        .map_err(|e| Error::from_reason(format!("Invalid JSON: {}", e)))?;

    for item in items {
      if let (Some(sym), Some(price), Some(vol)) = (
        item.get("symbol").and_then(|v| v.as_str()),
        item.get("price").and_then(|v| v.as_f64()),
        item.get("volume").and_then(|v| v.as_f64()),
      ) {
        self.add_market_data(sym.to_string(), price, vol)?;
      }
    }

    Ok(self.data_count)
  }

  /// Get configuration
  #[napi]
  pub fn get_config(&self) -> String {
    serde_json::to_string(&self.config).unwrap_or_default()
  }

  /// Update configuration
  #[napi]
  pub fn update_config(&mut self, config_json: String) -> napi::Result<()> {
    let new_config: StreamConfig =
      serde_json::from_str(&config_json)
        .map_err(|e| Error::from_reason(format!("Invalid config JSON: {}", e)))?;

    if new_config.url.is_empty() {
      return Err(Error::from_reason("URL cannot be empty"));
    }

    self.config = new_config;
    Ok(())
  }

  /// Get total bytes received
  #[napi]
  pub fn get_total_bytes(&self) -> f64 {
    self.total_bytes as f64
  }

  /// Get reconnect count
  #[napi]
  pub fn get_reconnect_count(&self) -> u32 {
    self.reconnect_count
  }

  /// Reset all statistics
  #[napi]
  pub fn reset_statistics(&mut self) -> napi::Result<()> {
    self.error_count = 0;
    self.data_count = 0;
    self.message_buffer.clear();
    self.total_bytes = 0;
    self.reconnect_count = 0;
    self.creation_time = chrono::Local::now().timestamp_millis();
    Ok(())
  }
}

/// Create a new stream manager
#[napi]
pub fn create_stream_manager(
  url: String,
  timeout_ms: Option<u32>,
) -> napi::Result<StreamManager> {
  StreamManager::new(url, timeout_ms)
}

/// Global event handler registry
#[napi(object)]
pub struct EventHandler {
  pub event_type: String,
  pub handler_id: String,
}

/// Create event listener
#[napi]
pub fn create_event_listener(event_type: String) -> napi::Result<EventHandler> {
  Ok(EventHandler {
    event_type,
    handler_id: Uuid::new_v4().to_string(),
  })
}

/// Process market data JSON
#[napi]
pub fn process_market_data(data_json: String) -> napi::Result<String> {
  let data: MarketDataPoint =
    serde_json::from_str(&data_json)
      .map_err(|e| Error::from_reason(format!("Invalid market data JSON: {}", e)))?;

  let result = serde_json::json!({
    "symbol": data.symbol,
    "price": data.price,
    "volume": data.volume,
    "mid": (data.bid + data.ask) / 2.0,
    "spread": data.ask - data.bid,
    "timestamp": data.timestamp,
  });

  Ok(result.to_string())
}

/// Validate stream configuration
#[napi]
pub fn validate_stream_config(config_json: String) -> napi::Result<bool> {
  let config: StreamConfig =
    serde_json::from_str(&config_json)
      .map_err(|e| Error::from_reason(format!("Invalid config JSON: {}", e)))?;

  if config.url.is_empty() {
    return Err(Error::from_reason("URL cannot be empty"));
  }

  if let Some(timeout) = config.timeout_ms {
    if timeout == 0 {
      return Err(Error::from_reason("Timeout must be greater than 0"));
    }
  }

  if let Some(retries) = config.retry_count {
    if retries > 100 {
      return Err(Error::from_reason("Retry count cannot exceed 100"));
    }
  }

  Ok(true)
}

/// Format stream event
#[napi]
pub fn format_stream_event(
  event_type: String,
  message: String,
  stream_id: String,
) -> napi::Result<String> {
  let timestamp = chrono::Local::now().timestamp_millis();

  let event = serde_json::json!({
    "event_type": event_type,
    "message": message,
    "timestamp": timestamp,
    "stream_id": stream_id,
  });

  Ok(event.to_string())
}

/// Parse market data from JSON array
#[napi]
pub fn parse_market_data_batch(data_json: String) -> napi::Result<String> {
  let items: Vec<serde_json::Value> =
    serde_json::from_str(&data_json)
      .map_err(|e| Error::from_reason(format!("Invalid JSON array: {}", e)))?;

  let result: Vec<serde_json::Value> = items
    .iter()
    .filter_map(|item| {
      if let (Some(sym), Some(price), Some(vol)) = (
        item.get("symbol").and_then(|v| v.as_str()),
        item.get("price").and_then(|v| v.as_f64()),
        item.get("volume").and_then(|v| v.as_f64()),
      ) {
        Some(serde_json::json!({
          "symbol": sym,
          "price": price,
          "volume": vol,
          "mid": price,
          "spread": 0.02 * price,
        }))
      } else {
        None
      }
    })
    .collect();

  Ok(serde_json::to_string(&result).unwrap_or_default())
}

