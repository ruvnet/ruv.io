use napi::{bindgen_prelude::*, Error};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// Core configuration for DAA Prime
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    pub node_id: Option<String>,
    pub timeout_ms: Option<u64>,
    pub max_retries: Option<u32>,
    pub batch_size: Option<usize>,
}

/// Protocol message for DAA Prime communication
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProtocolMessage {
    pub id: String,
    pub msg_type: String,
    pub version: String,
    pub payload: serde_json::Value,
    pub timestamp: String,
}

/// Peer information in the network
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PeerInfo {
    pub peer_id: String,
    pub host: String,
    pub port: u16,
    pub public_key: String,
    pub last_seen: Option<String>,
}

/// Model metadata for ML framework
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModelMetadata {
    pub model_id: String,
    pub version: String,
    pub parameters: HashMap<String, serde_json::Value>,
    pub created_at: String,
    pub updated_at: String,
}

/// Training result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrainingResult {
    pub success: bool,
    pub model_id: String,
    pub accuracy: f64,
    pub loss: f64,
    pub epochs: u32,
    pub duration_ms: u64,
}

/// DAA Prime Core client
#[napi]
pub struct DaaPrimeCore {
    config: Arc<Config>,
    peers: Arc<std::sync::Mutex<Vec<PeerInfo>>>,
    models: Arc<std::sync::Mutex<Vec<ModelMetadata>>>,
}

#[napi]
impl DaaPrimeCore {
    /// Create a new DAA Prime Core instance
    #[napi(constructor)]
    pub fn new(config_json: Option<String>) -> Result<Self> {
        let config = match config_json {
            Some(json) => {
                match serde_json::from_str::<Config>(&json) {
                    Ok(cfg) => cfg,
                    Err(e) => {
                        return Err(Error::from_reason(format!(
                            "Failed to parse config: {}",
                            e
                        )))
                    }
                }
            }
            None => Config {
                node_id: Some("default-node".to_string()),
                timeout_ms: Some(30000),
                max_retries: Some(3),
                batch_size: Some(32),
            },
        };

        Ok(Self {
            config: Arc::new(config),
            peers: Arc::new(std::sync::Mutex::new(Vec::new())),
            models: Arc::new(std::sync::Mutex::new(Vec::new())),
        })
    }

    /// Get the current configuration
    #[napi]
    pub fn get_config(&self) -> Result<String> {
        match serde_json::to_string(&*self.config) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize config: {}",
                e
            ))),
        }
    }

    /// Initialize a peer connection
    #[napi]
    pub fn register_peer(&mut self, peer_info_json: String) -> Result<bool> {
        let peer: PeerInfo = match serde_json::from_str(&peer_info_json) {
            Ok(p) => p,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse peer info: {}",
                    e
                )))
            }
        };

        match self.peers.lock() {
            Ok(mut peers) => {
                peers.push(peer);
                Ok(true)
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire peer lock".to_string(),
            )),
        }
    }

    /// List all registered peers
    #[napi]
    pub fn list_peers(&self) -> Result<String> {
        match self.peers.lock() {
            Ok(peers) => match serde_json::to_string(&*peers) {
                Ok(json) => Ok(json),
                Err(e) => Err(Error::from_reason(format!(
                    "Failed to serialize peers: {}",
                    e
                ))),
            },
            Err(_) => Err(Error::from_reason(
                "Failed to acquire peer lock".to_string(),
            )),
        }
    }

    /// Get count of connected peers
    #[napi]
    pub fn peer_count(&self) -> Result<u32> {
        match self.peers.lock() {
            Ok(peers) => Ok(peers.len() as u32),
            Err(_) => Err(Error::from_reason(
                "Failed to acquire peer lock".to_string(),
            )),
        }
    }

    /// Create and register a new model
    #[napi]
    pub fn create_model(&mut self, model_metadata_json: String) -> Result<String> {
        let model: ModelMetadata = match serde_json::from_str(&model_metadata_json) {
            Ok(m) => m,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse model metadata: {}",
                    e
                )))
            }
        };

        match self.models.lock() {
            Ok(mut models) => {
                models.push(model.clone());
                match serde_json::to_string(&model) {
                    Ok(json) => Ok(json),
                    Err(e) => Err(Error::from_reason(format!(
                        "Failed to serialize model: {}",
                        e
                    ))),
                }
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire model lock".to_string(),
            )),
        }
    }

    /// List all registered models
    #[napi]
    pub fn list_models(&self) -> Result<String> {
        match self.models.lock() {
            Ok(models) => match serde_json::to_string(&*models) {
                Ok(json) => Ok(json),
                Err(e) => Err(Error::from_reason(format!(
                    "Failed to serialize models: {}",
                    e
                ))),
            },
            Err(_) => Err(Error::from_reason(
                "Failed to acquire model lock".to_string(),
            )),
        }
    }

    /// Get a specific model by ID
    #[napi]
    pub fn get_model(&self, model_id: String) -> Result<String> {
        match self.models.lock() {
            Ok(models) => {
                for model in models.iter() {
                    if model.model_id == model_id {
                        return match serde_json::to_string(model) {
                            Ok(json) => Ok(json),
                            Err(e) => Err(Error::from_reason(format!(
                                "Failed to serialize model: {}",
                                e
                            ))),
                        };
                    }
                }
                Err(Error::from_reason(format!(
                    "Model not found: {}",
                    model_id
                )))
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire model lock".to_string(),
            )),
        }
    }

    /// Process a protocol message
    #[napi]
    pub fn process_message(&self, message_json: String) -> Result<String> {
        let message: ProtocolMessage = match serde_json::from_str(&message_json) {
            Ok(m) => m,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse message: {}",
                    e
                )))
            }
        };

        // Simulate processing
        let response = serde_json::json!({
            "id": message.id,
            "status": "processed",
            "received_type": message.msg_type,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });

        match serde_json::to_string(&response) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize response: {}",
                e
            ))),
        }
    }

    /// Simulate training a model
    #[napi]
    pub fn train_model(&self, model_id: String, iterations: u32) -> Result<String> {
        // Simulate training computation
        let accuracy = 0.85 + (0.1 * (iterations as f64 / 100.0).min(1.0));
        let loss = 0.5 - (0.3 * (iterations as f64 / 100.0).min(1.0));

        let result = TrainingResult {
            success: true,
            model_id,
            accuracy,
            loss,
            epochs: iterations,
            duration_ms: 1000 + (iterations as u64 * 10),
        };

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize training result: {}",
                e
            ))),
        }
    }

    /// Validate protocol version
    #[napi]
    pub fn validate_version(&self, version: String) -> Result<bool> {
        let valid_versions = vec!["1.0", "1.1", "2.0"];
        Ok(valid_versions.contains(&version.as_str()))
    }

    /// Generate a unique message ID
    #[napi]
    pub fn generate_message_id(&self) -> Result<String> {
        Ok(uuid::Uuid::new_v4().to_string())
    }

    /// Check health status
    #[napi]
    pub fn health_check(&self) -> Result<String> {
        let health = serde_json::json!({
            "status": "healthy",
            "node_id": &self.config.node_id,
            "peers_connected": self.peers.lock().ok().map(|p| p.len()).unwrap_or(0),
            "models_loaded": self.models.lock().ok().map(|m| m.len()).unwrap_or(0),
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });

        match serde_json::to_string(&health) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize health check: {}",
                e
            ))),
        }
    }
}

/// Standalone function: Hash data
#[napi]
pub fn hash_data(data: String) -> Result<String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    let hash = hasher.finish();

    Ok(format!("{:x}", hash))
}

/// Standalone function: Validate peer address
#[napi]
pub fn validate_peer_address(address: String) -> Result<bool> {
    // Simple validation: check for IP:port format
    let parts: Vec<&str> = address.split(':').collect();
    if parts.len() != 2 {
        return Ok(false);
    }

    // Check if port is a number
    let port_valid = parts[1].parse::<u16>().is_ok();
    Ok(port_valid && !parts[0].is_empty())
}

/// Standalone function: Create protocol message
#[napi]
pub fn create_protocol_message(
    msg_type: String,
    payload_json: String,
) -> Result<String> {
    let payload: serde_json::Value = match serde_json::from_str(&payload_json) {
        Ok(p) => p,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse payload: {}",
                e
            )))
        }
    };

    let message = ProtocolMessage {
        id: uuid::Uuid::new_v4().to_string(),
        msg_type,
        version: "2.0".to_string(),
        payload,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };

    match serde_json::to_string(&message) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize message: {}",
            e
        ))),
    }
}
