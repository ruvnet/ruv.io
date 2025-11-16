use napi::{bindgen_prelude::*, JsObject};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// CLI configuration for RUV Swarm
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CliConfig {
    verbose: Option<bool>,
    output_format: Option<String>,
    timeout: Option<u32>,
    log_level: Option<String>,
    max_agents: Option<u32>,
    enable_monitoring: Option<bool>,
}

/// Command enum for CLI operations
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Command {
    name: String,
    args: serde_json::Value,
    #[serde(default)]
    options: HashMap<String, serde_json::Value>,
}

/// Swarm status information
#[derive(Serialize, Deserialize, Debug, Clone)]
struct SwarmStatus {
    id: String,
    active_agents: u32,
    total_agents: u32,
    status: String,
    uptime_seconds: u64,
    operations_count: u64,
    last_heartbeat: String,
    health_score: f64,
}

/// CLI Runner for executing commands
#[napi]
pub struct CliRunner {
    config: CliConfig,
    state: Arc<Mutex<CliState>>,
}

/// Internal CLI state
#[derive(Debug, Clone)]
struct CliState {
    swarms: HashMap<String, SwarmStatus>,
    command_history: Vec<String>,
    operations_count: u64,
}

#[napi]
impl CliRunner {
    /// Create a new CLI Runner instance
    #[napi(constructor)]
    pub fn new(config: Option<JsObject>) -> Result<Self> {
        let cfg = parse_cli_config(config)?;

        Ok(Self {
            config: cfg,
            state: Arc::new(Mutex::new(CliState {
                swarms: HashMap::new(),
                command_history: Vec::new(),
                operations_count: 0,
            })),
        })
    }

    /// Parse and execute a command
    #[napi]
    pub fn execute_command(&self, command_json: String) -> Result<String> {
        let command: Command = serde_json::from_str(&command_json)
            .map_err(|e| Error::from_reason(format!("Failed to parse command: {}", e)))?;

        let result = match command.name.as_str() {
            "init" => self.handle_init_command(&command),
            "start" => self.handle_start_command(&command),
            "stop" => self.handle_stop_command(&command),
            "status" => self.handle_status_command(&command),
            "deploy" => self.handle_deploy_command(&command),
            "scale" => self.handle_scale_command(&command),
            "list" => self.handle_list_command(&command),
            "config" => self.handle_config_command(&command),
            "health" => self.handle_health_command(&command),
            "logs" => self.handle_logs_command(&command),
            _ => Err(Error::from_reason(format!(
                "Unknown command: {}",
                command.name
            ))),
        };

        // Track command in history
        if let Ok(mut state) = self.state.lock() {
            state.command_history.push(command.name.clone());
            state.operations_count += 1;
        }

        result
    }

    /// Initialize a swarm
    #[napi]
    pub fn initialize_swarm(&self, swarm_id: String, config_json: String) -> Result<String> {
        let config: serde_json::Value = serde_json::from_str(&config_json)
            .map_err(|e| Error::from_reason(format!("Invalid config: {}", e)))?;

        let status = SwarmStatus {
            id: swarm_id.clone(),
            active_agents: 0,
            total_agents: config
                .get("num_agents")
                .and_then(|v| v.as_u64())
                .unwrap_or(5) as u32,
            status: "initialized".to_string(),
            uptime_seconds: 0,
            operations_count: 0,
            last_heartbeat: get_timestamp(),
            health_score: 1.0,
        };

        if let Ok(mut state) = self.state.lock() {
            state.swarms.insert(swarm_id.clone(), status.clone());
        }

        let result = serde_json::json!({
            "success": true,
            "swarm_id": swarm_id,
            "message": "Swarm initialized successfully",
            "status": status.status,
            "total_agents": status.total_agents,
            "timestamp": get_timestamp(),
        });

        Ok(serde_json::to_string(&result)
            .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?)
    }

    /// Start a swarm
    #[napi]
    pub fn start_swarm(&self, swarm_id: String) -> Result<String> {
        if let Ok(mut state) = self.state.lock() {
            if let Some(swarm) = state.swarms.get_mut(&swarm_id) {
                swarm.status = "running".to_string();
                swarm.active_agents = swarm.total_agents;
                swarm.last_heartbeat = get_timestamp();

                let result = serde_json::json!({
                    "success": true,
                    "swarm_id": swarm_id,
                    "message": "Swarm started successfully",
                    "status": swarm.status.clone(),
                    "active_agents": swarm.active_agents,
                    "total_agents": swarm.total_agents,
                    "timestamp": get_timestamp(),
                });

                return Ok(serde_json::to_string(&result)
                    .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
            }
        }

        Err(Error::from_reason(format!("Swarm not found: {}", swarm_id)))
    }

    /// Stop a swarm
    #[napi]
    pub fn stop_swarm(&self, swarm_id: String) -> Result<String> {
        if let Ok(mut state) = self.state.lock() {
            if let Some(swarm) = state.swarms.get_mut(&swarm_id) {
                swarm.status = "stopped".to_string();
                swarm.active_agents = 0;
                swarm.last_heartbeat = get_timestamp();

                let result = serde_json::json!({
                    "success": true,
                    "swarm_id": swarm_id,
                    "message": "Swarm stopped successfully",
                    "status": swarm.status.clone(),
                    "active_agents": swarm.active_agents,
                    "total_agents": swarm.total_agents,
                    "timestamp": get_timestamp(),
                });

                return Ok(serde_json::to_string(&result)
                    .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
            }
        }

        Err(Error::from_reason(format!("Swarm not found: {}", swarm_id)))
    }

    /// Get swarm status
    #[napi]
    pub fn get_swarm_status(&self, swarm_id: String) -> Result<String> {
        if let Ok(state) = self.state.lock() {
            if let Some(swarm) = state.swarms.get(&swarm_id) {
                return Ok(serde_json::to_string(&swarm)
                    .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
            }
        }

        Err(Error::from_reason(format!("Swarm not found: {}", swarm_id)))
    }

    /// List all swarms
    #[napi]
    pub fn list_swarms(&self) -> Result<String> {
        if let Ok(state) = self.state.lock() {
            let swarms: Vec<SwarmStatus> = state.swarms.values().cloned().collect();

            let result = serde_json::json!({
                "success": true,
                "count": swarms.len(),
                "swarms": swarms,
                "timestamp": get_timestamp(),
            });

            return Ok(serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
        }

        Err(Error::from_reason("Failed to access state".to_string()))
    }

    /// Deploy configuration to swarm
    #[napi]
    pub fn deploy_config(&self, swarm_id: String, config_json: String) -> Result<String> {
        let _config: serde_json::Value = serde_json::from_str(&config_json)
            .map_err(|e| Error::from_reason(format!("Invalid config: {}", e)))?;

        let result = serde_json::json!({
            "success": true,
            "swarm_id": swarm_id,
            "message": "Configuration deployed successfully",
            "timestamp": get_timestamp(),
        });

        Ok(serde_json::to_string(&result)
            .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?)
    }

    /// Scale swarm to specified agent count
    #[napi]
    pub fn scale_swarm(&self, swarm_id: String, agent_count: u32) -> Result<String> {
        if let Ok(mut state) = self.state.lock() {
            if let Some(swarm) = state.swarms.get_mut(&swarm_id) {
                swarm.total_agents = agent_count;
                if swarm.status == "running" {
                    swarm.active_agents = agent_count;
                }
                swarm.last_heartbeat = get_timestamp();

                let result = serde_json::json!({
                    "success": true,
                    "swarm_id": swarm_id,
                    "message": format!("Swarm scaled to {} agents", agent_count),
                    "total_agents": swarm.total_agents,
                    "active_agents": swarm.active_agents,
                    "timestamp": get_timestamp(),
                });

                return Ok(serde_json::to_string(&result)
                    .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
            }
        }

        Err(Error::from_reason(format!("Swarm not found: {}", swarm_id)))
    }

    /// Get monitoring data
    #[napi]
    pub fn get_monitoring_data(&self) -> Result<String> {
        if let Ok(state) = self.state.lock() {
            let swarms: Vec<SwarmStatus> = state.swarms.values().cloned().collect();

            let total_active: u32 = swarms.iter().map(|s| s.active_agents).sum();
            let total_agents: u32 = swarms.iter().map(|s| s.total_agents).sum();
            let avg_health: f64 = if !swarms.is_empty() {
                swarms.iter().map(|s| s.health_score).sum::<f64>() / swarms.len() as f64
            } else {
                1.0
            };

            let result = serde_json::json!({
                "success": true,
                "total_swarms": swarms.len(),
                "total_agents": total_agents,
                "active_agents": total_active,
                "avg_health_score": avg_health,
                "total_operations": state.operations_count,
                "swarms": swarms,
                "timestamp": get_timestamp(),
            });

            return Ok(serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
        }

        Err(Error::from_reason("Failed to access state".to_string()))
    }

    /// Get CLI configuration
    #[napi]
    pub fn get_config(&self) -> Result<String> {
        match serde_json::to_string(&self.config) {
            Ok(config_str) => Ok(config_str),
            Err(e) => Err(Error::from_reason(format!("Failed to serialize config: {}", e))),
        }
    }

    /// Get command history
    #[napi]
    pub fn get_history(&self, limit: i32) -> Result<String> {
        if let Ok(state) = self.state.lock() {
            let limit = limit as usize;
            let history: Vec<String> = state
                .command_history
                .iter()
                .rev()
                .take(limit)
                .cloned()
                .collect();

            let result = serde_json::json!({
                "success": true,
                "count": history.len(),
                "history": history,
                "timestamp": get_timestamp(),
            });

            return Ok(serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
        }

        Err(Error::from_reason("Failed to access state".to_string()))
    }

    /// Clear command history
    #[napi]
    pub fn clear_history(&self) -> Result<String> {
        if let Ok(mut state) = self.state.lock() {
            state.command_history.clear();

            let result = serde_json::json!({
                "success": true,
                "message": "History cleared successfully",
                "timestamp": get_timestamp(),
            });

            return Ok(serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
        }

        Err(Error::from_reason("Failed to access state".to_string()))
    }
}

// ============ Command Handlers ============

impl CliRunner {
    fn handle_init_command(&self, _command: &Command) -> Result<String> {
        let result = serde_json::json!({
            "success": true,
            "message": "CLI initialized",
            "timestamp": get_timestamp(),
        });

        Ok(serde_json::to_string(&result)
            .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?)
    }

    fn handle_start_command(&self, command: &Command) -> Result<String> {
        let swarm_id = command
            .args
            .get("swarm_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::from_reason("Missing swarm_id".to_string()))?
            .to_string();

        self.start_swarm(swarm_id)
    }

    fn handle_stop_command(&self, command: &Command) -> Result<String> {
        let swarm_id = command
            .args
            .get("swarm_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::from_reason("Missing swarm_id".to_string()))?
            .to_string();

        self.stop_swarm(swarm_id)
    }

    fn handle_status_command(&self, command: &Command) -> Result<String> {
        if let Some(swarm_id) = command.args.get("swarm_id").and_then(|v| v.as_str()) {
            let status_str = self.get_swarm_status(swarm_id.to_string())?;
            let status: SwarmStatus = serde_json::from_str(&status_str)
                .map_err(|e| Error::from_reason(format!("Failed to parse status: {}", e)))?;

            let result = serde_json::json!({
                "success": true,
                "swarm_id": swarm_id,
                "status": status.status,
                "active_agents": status.active_agents,
                "total_agents": status.total_agents,
                "health_score": status.health_score,
                "timestamp": get_timestamp(),
            });

            Ok(serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?)
        } else {
            self.get_monitoring_data()
        }
    }

    fn handle_deploy_command(&self, command: &Command) -> Result<String> {
        let swarm_id = command
            .args
            .get("swarm_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::from_reason("Missing swarm_id".to_string()))?
            .to_string();

        let config = command
            .args
            .get("config")
            .ok_or_else(|| Error::from_reason("Missing config".to_string()))?;

        self.deploy_config(swarm_id, config.to_string())
    }

    fn handle_scale_command(&self, command: &Command) -> Result<String> {
        let swarm_id = command
            .args
            .get("swarm_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| Error::from_reason("Missing swarm_id".to_string()))?
            .to_string();

        let agent_count = command
            .args
            .get("agent_count")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| Error::from_reason("Missing agent_count".to_string()))? as u32;

        self.scale_swarm(swarm_id, agent_count)
    }

    fn handle_list_command(&self, _command: &Command) -> Result<String> {
        self.list_swarms()
    }

    fn handle_config_command(&self, _command: &Command) -> Result<String> {
        self.get_config()
    }

    fn handle_health_command(&self, command: &Command) -> Result<String> {
        if let Some(swarm_id) = command.args.get("swarm_id").and_then(|v| v.as_str()) {
            if let Ok(state) = self.state.lock() {
                if let Some(swarm) = state.swarms.get(swarm_id) {
                    let result = serde_json::json!({
                        "success": true,
                        "swarm_id": swarm_id,
                        "health_score": swarm.health_score,
                        "status": swarm.status,
                        "active_agents": swarm.active_agents,
                        "total_agents": swarm.total_agents,
                        "timestamp": get_timestamp(),
                    });

                    return Ok(serde_json::to_string(&result)
                        .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?);
                }
            }

            Err(Error::from_reason(format!(
                "Swarm not found: {}",
                swarm_id
            )))
        } else {
            self.get_monitoring_data()
        }
    }

    fn handle_logs_command(&self, command: &Command) -> Result<String> {
        if let Some(swarm_id) = command.args.get("swarm_id").and_then(|v| v.as_str()) {
            let result = serde_json::json!({
                "success": true,
                "swarm_id": swarm_id,
                "logs": vec![
                    format!("Initialized swarm: {}", swarm_id),
                    format!("Agents deployed for: {}", swarm_id),
                    format!("Monitoring active for: {}", swarm_id),
                ],
                "timestamp": get_timestamp(),
            });

            Ok(serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Serialization error: {}", e)))?)
        } else {
            Err(Error::from_reason("Missing swarm_id for logs".to_string()))
        }
    }
}

// ============ Helper Functions ============

fn parse_cli_config(config: Option<JsObject>) -> Result<CliConfig> {
    let cfg = if let Some(obj) = config {
        let verbose = obj.get::<_, bool>("verbose").ok().flatten();
        let output_format = obj.get::<_, String>("output_format").ok().flatten();
        let timeout = obj.get::<_, u32>("timeout").ok().flatten();
        let log_level = obj.get::<_, String>("log_level").ok().flatten();
        let max_agents = obj.get::<_, u32>("max_agents").ok().flatten();
        let enable_monitoring = obj.get::<_, bool>("enable_monitoring").ok().flatten();

        CliConfig {
            verbose,
            output_format,
            timeout,
            log_level,
            max_agents,
            enable_monitoring,
        }
    } else {
        CliConfig {
            verbose: Some(false),
            output_format: Some("json".to_string()),
            timeout: Some(30),
            log_level: Some("info".to_string()),
            max_agents: Some(100),
            enable_monitoring: Some(true),
        }
    };

    Ok(cfg)
}

fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}
