use napi::{bindgen_prelude::*, Error, Status};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Represents a QUIC stream with its state and data
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QuicStream {
    id: i64,
    state: String,
    data_sent: u64,
    data_received: u64,
    priority: u32,
}

/// Configuration for QUIC client
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QuicConfig {
    initial_max_streams: Option<u64>,
    idle_timeout: Option<u64>,
    max_data: Option<u64>,
    max_stream_data: Option<u64>,
}

/// Result of stream operations
#[derive(Serialize, Deserialize, Debug)]
struct StreamOperationResult {
    stream_id: i64,
    success: bool,
    message: String,
    timestamp: String,
}

/// Statistics for all streams
#[derive(Serialize, Deserialize, Debug)]
struct StreamStats {
    total_streams: i64,
    active_streams: i64,
    total_data_sent: u64,
    total_data_received: u64,
    timestamp: String,
}

/// Internal QUIC client state
struct QuicClientInner {
    streams: HashMap<u64, QuicStream>,
    next_stream_id: u64,
    config: QuicConfig,
    total_data_sent: u64,
    total_data_received: u64,
}

/// QUIC client with multi-stream support
#[napi]
pub struct QuicClient {
    inner: Arc<Mutex<QuicClientInner>>,
}

#[napi]
impl QuicClient {
    /// Create a new QUIC client with optional configuration
    #[napi(constructor)]
    pub fn new(config: Option<String>) -> Result<Self> {
        let quic_config = if let Some(config_str) = config {
            match serde_json::from_str::<QuicConfig>(&config_str) {
                Ok(cfg) => cfg,
                Err(e) => {
                    return Err(Error::new(
                        Status::InvalidArg,
                        format!("Invalid configuration: {}", e),
                    ))
                }
            }
        } else {
            QuicConfig {
                initial_max_streams: Some(100),
                idle_timeout: Some(30000),
                max_data: Some(1024 * 1024),
                max_stream_data: Some(100 * 1024),
            }
        };

        Ok(QuicClient {
            inner: Arc::new(Mutex::new(QuicClientInner {
                streams: HashMap::new(),
                next_stream_id: 1,
                config: quic_config,
                total_data_sent: 0,
                total_data_received: 0,
            })),
        })
    }

    /// Create a new stream
    /// Returns the stream ID
    #[napi]
    pub fn create_stream(&self, priority: u32) -> Result<i64> {
        let mut inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let stream_id = inner.next_stream_id;
        let max_streams = inner
            .config
            .initial_max_streams
            .unwrap_or(100) as u64;

        if inner.streams.len() >= max_streams as usize {
            return Err(Error::new(
                Status::GenericFailure,
                "Maximum stream limit reached",
            ));
        }

        let stream = QuicStream {
            id: stream_id as i64,
            state: "open".to_string(),
            data_sent: 0,
            data_received: 0,
            priority,
        };

        inner.streams.insert(stream_id, stream);
        inner.next_stream_id += 1;

        Ok(stream_id as i64)
    }

    /// Send data on a specific stream
    /// Returns the number of bytes sent
    #[napi]
    pub fn send_data(&self, stream_id: i64, size: i64) -> Result<i64> {
        let mut inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let max_data = inner.config.max_stream_data.unwrap_or(100 * 1024) as u64;
        let stream_id_u64 = stream_id as u64;

        if let Some(stream) = inner.streams.get_mut(&stream_id_u64) {
            if stream.state != "open" {
                return Err(Error::new(
                    Status::GenericFailure,
                    "Stream is not in open state",
                ));
            }

            let size_u64 = size as u64;
            let data_to_send = std::cmp::min(size_u64, max_data - stream.data_sent);

            if data_to_send == 0 {
                return Err(Error::new(
                    Status::GenericFailure,
                    "Stream data limit exceeded",
                ));
            }

            stream.data_sent += data_to_send;
            inner.total_data_sent += data_to_send;

            Ok(data_to_send as i64)
        } else {
            Err(Error::new(
                Status::GenericFailure,
                format!("Stream {} not found", stream_id),
            ))
        }
    }

    /// Receive data on a specific stream
    /// Returns the number of bytes received
    #[napi]
    pub fn receive_data(&self, stream_id: i64, size: i64) -> Result<i64> {
        let mut inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let stream_id_u64 = stream_id as u64;
        if let Some(stream) = inner.streams.get_mut(&stream_id_u64) {
            let size_u64 = size as u64;
            let data_to_receive = std::cmp::min(size_u64, 1024 * 1024);
            stream.data_received += data_to_receive;
            inner.total_data_received += data_to_receive;

            Ok(data_to_receive as i64)
        } else {
            Err(Error::new(
                Status::GenericFailure,
                format!("Stream {} not found", stream_id),
            ))
        }
    }

    /// Close a specific stream
    /// Returns operation result as JSON
    #[napi]
    pub fn close_stream(&self, stream_id: i64) -> Result<String> {
        let mut inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let stream_id_u64 = stream_id as u64;
        if let Some(stream) = inner.streams.get_mut(&stream_id_u64) {
            stream.state = "closed".to_string();

            let result = StreamOperationResult {
                stream_id,
                success: true,
                message: "Stream closed successfully".to_string(),
                timestamp: get_timestamp(),
            };

            serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
        } else {
            Err(Error::new(
                Status::GenericFailure,
                format!("Stream {} not found", stream_id),
            ))
        }
    }

    /// Get information about a specific stream
    /// Returns stream info as JSON
    #[napi]
    pub fn get_stream_info(&self, stream_id: i64) -> Result<String> {
        let inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let stream_id_u64 = stream_id as u64;
        if let Some(stream) = inner.streams.get(&stream_id_u64) {
            serde_json::to_string(stream)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
        } else {
            Err(Error::new(
                Status::GenericFailure,
                format!("Stream {} not found", stream_id),
            ))
        }
    }

    /// Get all active streams
    /// Returns array of stream IDs as JSON
    #[napi]
    pub fn get_active_streams(&self) -> Result<String> {
        let inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let active_streams: Vec<i64> = inner
            .streams
            .values()
            .filter(|s| s.state == "open")
            .map(|s| s.id)
            .collect();

        serde_json::to_string(&active_streams)
            .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
    }

    /// Get statistics about all streams
    /// Returns stats as JSON
    #[napi]
    pub fn get_stats(&self) -> Result<String> {
        let inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let active_count = inner
            .streams
            .values()
            .filter(|s| s.state == "open")
            .count() as i64;

        let stats = StreamStats {
            total_streams: inner.streams.len() as i64,
            active_streams: active_count,
            total_data_sent: inner.total_data_sent,
            total_data_received: inner.total_data_received,
            timestamp: get_timestamp(),
        };

        serde_json::to_string(&stats)
            .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
    }

    /// Reset a stream with optional error code
    /// Returns operation result as JSON
    #[napi]
    pub fn reset_stream(&self, stream_id: i64, error_code: u32) -> Result<String> {
        let mut inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let stream_id_u64 = stream_id as u64;
        if let Some(stream) = inner.streams.get_mut(&stream_id_u64) {
            stream.state = format!("reset({})", error_code);

            let result = StreamOperationResult {
                stream_id,
                success: true,
                message: format!("Stream reset with error code {}", error_code),
                timestamp: get_timestamp(),
            };

            serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
        } else {
            Err(Error::new(
                Status::GenericFailure,
                format!("Stream {} not found", stream_id),
            ))
        }
    }

    /// Close all streams
    /// Returns the number of streams closed
    #[napi]
    pub fn close_all_streams(&self) -> Result<i64> {
        let mut inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let count = inner.streams.len() as i64;

        for stream in inner.streams.values_mut() {
            stream.state = "closed".to_string();
        }

        Ok(count)
    }

    /// Set stream priority
    /// Returns operation result as JSON
    #[napi]
    pub fn set_stream_priority(&self, stream_id: i64, priority: u32) -> Result<String> {
        let mut inner = self.inner.lock().map_err(|_| {
            Error::new(Status::GenericFailure, "Failed to acquire lock")
        })?;

        let stream_id_u64 = stream_id as u64;
        if let Some(stream) = inner.streams.get_mut(&stream_id_u64) {
            stream.priority = priority;

            let result = StreamOperationResult {
                stream_id,
                success: true,
                message: format!("Stream priority set to {}", priority),
                timestamp: get_timestamp(),
            };

            serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
        } else {
            Err(Error::new(
                Status::GenericFailure,
                format!("Stream {} not found", stream_id),
            ))
        }
    }
}

/// Helper function: Get current timestamp
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

/// Utility function: Create a simple QUIC stream
#[napi]
pub fn create_simple_stream(priority: u32) -> Result<String> {
    let stream = QuicStream {
        id: 1,
        state: "open".to_string(),
        data_sent: 0,
        data_received: 0,
        priority,
    };

    serde_json::to_string(&stream)
        .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))
}

/// Utility function: Calculate stream efficiency
#[napi]
pub fn calculate_stream_efficiency(
    data_sent: i64,
    data_received: i64,
    total_time_ms: i64,
) -> Result<f64> {
    if total_time_ms == 0 {
        return Err(Error::from_reason("Total time must be greater than 0"));
    }

    let total_data = (data_sent + data_received) as f64;
    let throughput = total_data / (total_time_ms as f64 / 1000.0);

    Ok(throughput)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quic_client_creation() {
        let client = QuicClient::new(None).expect("Failed to create client");
        let stats_json = client.get_stats().expect("Failed to get stats");
        let stats: StreamStats = serde_json::from_str(&stats_json).expect("Failed to parse stats");
        assert_eq!(stats.total_streams, 0);
    }

    #[test]
    fn test_create_stream() {
        let client = QuicClient::new(None).expect("Failed to create client");
        let stream_id = client.create_stream(1).expect("Failed to create stream");
        assert_eq!(stream_id, 1);
    }

    #[test]
    fn test_send_data() {
        let client = QuicClient::new(None).expect("Failed to create client");
        let stream_id = client.create_stream(1).expect("Failed to create stream");
        let sent = client
            .send_data(stream_id, 1000)
            .expect("Failed to send data");
        assert_eq!(sent, 1000);
    }

    #[test]
    fn test_close_stream() {
        let client = QuicClient::new(None).expect("Failed to create client");
        let stream_id = client.create_stream(1).expect("Failed to create stream");
        let result = client.close_stream(stream_id).expect("Failed to close stream");
        let op_result: StreamOperationResult =
            serde_json::from_str(&result).expect("Failed to parse result");
        assert!(op_result.success);
    }
}
