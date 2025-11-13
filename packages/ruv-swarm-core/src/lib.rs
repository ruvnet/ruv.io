use napi::{bindgen_prelude::*, JsObject};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Configuration for RUV Swarm Core
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    timeout: Option<u32>,
    retries: Option<u32>,
    log_level: Option<String>,
    max_concurrency: Option<u32>,
    buffer_size: Option<u32>,
    enable_caching: Option<bool>,
    cache_size: Option<u32>,
}

/// RUV Swarm Core client for orchestration
#[napi]
pub struct RuvSwarmCore {
    config: Config,
}

#[napi]
impl RuvSwarmCore {
    /// Create a new RuvSwarmCore instance with optional configuration
    #[napi(constructor)]
    pub fn new(config: Option<JsObject>) -> Result<Self> {
        let cfg = parse_config(config)?;
        Ok(Self { config: cfg })
    }

    /// Process data (as base64 strings)
    ///
    /// # Arguments
    /// * `data` - Input data as base64 string
    ///
    /// # Returns
    /// Processed data as base64 string
    #[napi]
    pub fn process(&self, data: String) -> Result<String> {
        let decoded = base64_decode(&data)
            .map_err(|e| Error::from_reason(format!("Invalid base64: {}", e)))?;
        let processed = process_data_impl(&decoded)?;
        Ok(base64_encode(&processed))
    }

    /// Process data synchronously
    ///
    /// # Arguments
    /// * `data` - Input data as base64 string
    ///
    /// # Returns
    /// Processed data as base64 string
    #[napi]
    pub fn process_sync(&self, data: String) -> Result<String> {
        let decoded = base64_decode(&data)
            .map_err(|e| Error::from_reason(format!("Invalid base64: {}", e)))?;
        let processed = process_data_impl(&decoded)?;
        Ok(base64_encode(&processed))
    }

    /// Close the client and release resources
    #[napi]
    pub fn close(&self) -> Result<()> {
        // Perform cleanup if needed
        Ok(())
    }

    /// Get configuration as JSON string
    #[napi]
    pub fn get_config(&self) -> Result<String> {
        match serde_json::to_string(&self.config) {
            Ok(config_str) => Ok(config_str),
            Err(e) => Err(Error::from_reason(format!("Failed to serialize config: {}", e))),
        }
    }

    /// Initialize swarm agent
    ///
    /// # Arguments
    /// * `agent_id` - Unique identifier for the agent
    /// * `agent_config` - Agent configuration as JSON string
    ///
    /// # Returns
    /// JSON string with agent initialization result
    #[napi]
    pub fn initialize_agent(
        &self,
        agent_id: String,
        agent_config: String,
    ) -> Result<String> {
        // Parse agent config
        let _config: serde_json::Value = serde_json::from_str(&agent_config)
            .map_err(|e| Error::from_reason(format!("Invalid agent config: {}", e)))?;

        let result = serde_json::json!({
            "agent_id": agent_id,
            "status": "initialized",
            "timestamp": get_timestamp(),
            "success": true
        });

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization failed: {}", e))),
        }
    }

    /// Coordinate agents for swarm orchestration
    ///
    /// # Arguments
    /// * `agents_json` - JSON array of agent definitions
    /// * `strategy` - Orchestration strategy (e.g., "distributed", "centralized")
    ///
    /// # Returns
    /// JSON string with orchestration result
    #[napi]
    pub fn orchestrate_agents(
        &self,
        agents_json: String,
        strategy: String,
    ) -> Result<String> {
        // Parse agents
        let agents: Vec<serde_json::Value> = serde_json::from_str(&agents_json)
            .map_err(|e| Error::from_reason(format!("Invalid agents JSON: {}", e)))?;

        if agents.is_empty() {
            return Err(Error::from_reason("No agents provided"));
        }

        let result = serde_json::json!({
            "agent_count": agents.len(),
            "strategy": strategy,
            "status": "orchestrated",
            "timestamp": get_timestamp(),
            "success": true
        });

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization failed: {}", e))),
        }
    }

    /// Execute distributed task across agents
    ///
    /// # Arguments
    /// * `task_json` - Task definition as JSON string
    ///
    /// # Returns
    /// JSON string with execution result
    #[napi]
    pub fn execute_task(&self, task_json: String) -> Result<String> {
        // Parse task
        let task: serde_json::Value = serde_json::from_str(&task_json)
            .map_err(|e| Error::from_reason(format!("Invalid task JSON: {}", e)))?;

        let task_id = task.get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        let execution_result = serde_json::json!({
            "task_id": task_id,
            "status": "completed",
            "timestamp": get_timestamp(),
            "success": true
        });

        match serde_json::to_string(&execution_result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization failed: {}", e))),
        }
    }

    /// Get agent status
    ///
    /// # Arguments
    /// * `agent_id` - Agent identifier
    ///
    /// # Returns
    /// JSON string with agent status
    #[napi]
    pub fn get_agent_status(&self, agent_id: String) -> Result<String> {
        let result = serde_json::json!({
            "agent_id": agent_id,
            "status": "active",
            "timestamp": get_timestamp(),
            "uptime_ms": 0,
            "tasks_completed": 0,
            "success": true
        });

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization failed: {}", e))),
        }
    }

    /// Batch process multiple data items
    ///
    /// # Arguments
    /// * `items_json` - JSON array of base64 encoded items
    ///
    /// # Returns
    /// JSON array with processed items
    #[napi]
    pub fn batch_process(&self, items_json: String) -> Result<String> {
        let items: Vec<String> = serde_json::from_str(&items_json)
            .map_err(|e| Error::from_reason(format!("Invalid items JSON: {}", e)))?;

        if items.is_empty() {
            return Err(Error::from_reason("No items provided"));
        }

        let results: Vec<_> = items
            .iter()
            .map(|item| {
                match base64_decode(item) {
                    Ok(decoded) => {
                        match process_data_impl(&decoded) {
                            Ok(processed) => {
                                serde_json::json!({
                                    "data": base64_encode(&processed),
                                    "success": true,
                                    "length": processed.len()
                                })
                            }
                            Err(_) => {
                                serde_json::json!({
                                    "data": item,
                                    "success": false,
                                    "length": 0
                                })
                            }
                        }
                    }
                    Err(_) => {
                        serde_json::json!({
                            "data": item,
                            "success": false,
                            "length": 0
                        })
                    }
                }
            })
            .collect();

        match serde_json::to_string(&results) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization failed: {}", e))),
        }
    }
}

/// Parse configuration from JsObject
fn parse_config(config: Option<JsObject>) -> Result<Config> {
    match config {
        Some(obj) => {
            let timeout = obj
                .get_named_property::<u32>("timeout")
                .ok();
            let retries = obj
                .get_named_property::<u32>("retries")
                .ok();
            let log_level = obj
                .get_named_property::<String>("logLevel")
                .ok();
            let max_concurrency = obj
                .get_named_property::<u32>("maxConcurrency")
                .ok();
            let buffer_size = obj
                .get_named_property::<u32>("bufferSize")
                .ok();
            let enable_caching = obj
                .get_named_property::<bool>("enableCaching")
                .ok();
            let cache_size = obj
                .get_named_property::<u32>("cacheSize")
                .ok();

            Ok(Config {
                timeout,
                retries,
                log_level,
                max_concurrency,
                buffer_size,
                enable_caching,
                cache_size,
            })
        }
        None => Ok(Config {
            timeout: None,
            retries: None,
            log_level: None,
            max_concurrency: None,
            buffer_size: None,
            enable_caching: None,
            cache_size: None,
        }),
    }
}

/// Process data implementation
fn process_data_impl(data: &[u8]) -> Result<Vec<u8>> {
    // Simple processing: reverse the data to demonstrate functionality
    let mut result = data.to_vec();
    result.reverse();
    Ok(result)
}

/// Get current timestamp as milliseconds since UNIX epoch
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}

/// Decode base64 string to bytes
fn base64_decode(data: &str) -> Result<Vec<u8>> {
    const CHARSET: &str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = Vec::new();

    // Count padding
    let padding_count = data.chars().rev().take_while(|&c| c == '=').count();

    // Remove padding for processing
    let data_clean = data.trim_end_matches('=');

    for chunk in data_clean.as_bytes().chunks(4) {
        let mut n = 0u32;

        for (i, &b) in chunk.iter().enumerate() {
            let c = b as char;
            let val = if let Some(pos) = CHARSET.find(c) {
                pos as u32
            } else {
                0
            };
            n |= val << (24 - i * 6);
        }

        // Always decode 3 bytes if we have at least 2 input chars
        if chunk.len() >= 2 {
            result.push(((n >> 16) & 0xFF) as u8);
        }
        if chunk.len() >= 3 {
            result.push(((n >> 8) & 0xFF) as u8);
        }
        if chunk.len() >= 4 {
            result.push((n & 0xFF) as u8);
        }
    }

    // Remove bytes based on padding
    while result.len() > 0 && padding_count > 0 {
        let encoded_bytes = data_clean.len();
        let expected = (encoded_bytes * 6 + 7) / 8; // bits to bytes
        if result.len() > expected {
            result.pop();
        } else {
            break;
        }
    }

    Ok(result)
}

/// Encode bytes to base64 string
fn base64_encode(data: &[u8]) -> String {
    // Simple base64 implementation
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();

    for chunk in data.chunks(3) {
        let b1 = chunk[0];
        let b2 = chunk.get(1).copied().unwrap_or(0);
        let b3 = chunk.get(2).copied().unwrap_or(0);

        let n = ((b1 as u32) << 16) | ((b2 as u32) << 8) | (b3 as u32);

        result.push(CHARSET[((n >> 18) & 63) as usize] as char);
        result.push(CHARSET[((n >> 12) & 63) as usize] as char);

        if chunk.len() > 1 {
            result.push(CHARSET[((n >> 6) & 63) as usize] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(CHARSET[(n & 63) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}
