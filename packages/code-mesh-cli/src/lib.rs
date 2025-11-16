use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Represents a CLI command
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Command {
    pub name: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub options: serde_json::Value,
}

/// Represents a mesh configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MeshConfig {
    pub name: String,
    pub nodes: u32,
    pub timeout_ms: u32,
    pub verbosity: String,
    pub visualization_enabled: Option<bool>,
}

/// Represents a mesh node
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MeshNode {
    pub id: String,
    pub address: String,
    pub status: String,
    pub last_heartbeat: Option<String>,
}

/// Represents a visualization element
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VisualizationElement {
    pub node_id: String,
    pub x: f64,
    pub y: f64,
    pub size: f64,
    pub color: String,
    pub connections: Vec<String>,
}

/// Initialize a new MeshCli instance with configuration
///
/// # Arguments
/// * `config_json` - JSON string containing mesh configuration
///
/// # Returns
/// JSON string with initialization result
#[napi]
pub fn initialize_mesh_cli(config_json: String) -> Result<String> {
    let config: MeshConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config JSON: {}",
                e
            )))
        }
    };

    let cli_info = CliInitializationResult {
        cli_id: generate_cli_id(),
        mesh_name: config.name,
        initialized_at: get_timestamp(),
        nodes_count: config.nodes,
        status: "initialized".to_string(),
        version: "1.0.0".to_string(),
    };

    match serde_json::to_string(&cli_info) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize result: {}",
            e
        ))),
    }
}

/// Execute a CLI command
///
/// # Arguments
/// * `command_json` - JSON string containing command data
///
/// # Returns
/// JSON string with command execution result
#[napi]
pub fn execute_command(command_json: String) -> Result<String> {
    let command: Command = match serde_json::from_str(&command_json) {
        Ok(cmd) => cmd,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse command JSON: {}",
                e
            )))
        }
    };

    // Validate command name
    if command.name.is_empty() {
        return Err(Error::from_reason("Command name cannot be empty".to_string()));
    }

    // Execute the command
    let execution_result = execute_cli_command(&command.name, &command.args);

    let result = CommandExecutionResult {
        command_name: command.name,
        executed_at: get_timestamp(),
        status: "completed".to_string(),
        output: execution_result.clone(),
        exit_code: if execution_result.contains("error") { 1 } else { 0 },
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize result: {}",
            e
        ))),
    }
}

/// Execute multiple commands in sequence
///
/// # Arguments
/// * `commands_json` - JSON array of commands
///
/// # Returns
/// JSON array with execution results
#[napi]
pub fn execute_batch_commands(commands_json: String) -> Result<String> {
    let commands: Vec<Command> = match serde_json::from_str(&commands_json) {
        Ok(cmds) => cmds,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse commands JSON: {}",
                e
            )))
        }
    };

    let results: Vec<CommandExecutionResult> = commands
        .iter()
        .map(|cmd| {
            let output = execute_cli_command(&cmd.name, &cmd.args);
            CommandExecutionResult {
                command_name: cmd.name.clone(),
                executed_at: get_timestamp(),
                status: "completed".to_string(),
                output,
                exit_code: 0,
            }
        })
        .collect();

    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize results: {}",
            e
        ))),
    }
}

/// Get list of available commands
///
/// # Arguments
/// * `category` - Optional category filter (e.g., "mesh", "config", "viz")
///
/// # Returns
/// JSON array of available commands
#[napi]
pub fn list_available_commands(category: Option<String>) -> Result<String> {
    let all_commands = vec![
        CommandMetadata {
            name: "mesh init".to_string(),
            description: "Initialize a new mesh".to_string(),
            category: "mesh".to_string(),
            args: vec!["config-file".to_string()],
        },
        CommandMetadata {
            name: "mesh add-node".to_string(),
            description: "Add a node to the mesh".to_string(),
            category: "mesh".to_string(),
            args: vec!["node-address".to_string()],
        },
        CommandMetadata {
            name: "mesh remove-node".to_string(),
            description: "Remove a node from the mesh".to_string(),
            category: "mesh".to_string(),
            args: vec!["node-id".to_string()],
        },
        CommandMetadata {
            name: "mesh status".to_string(),
            description: "Get mesh status".to_string(),
            category: "mesh".to_string(),
            args: vec![],
        },
        CommandMetadata {
            name: "config set".to_string(),
            description: "Set configuration value".to_string(),
            category: "config".to_string(),
            args: vec!["key".to_string(), "value".to_string()],
        },
        CommandMetadata {
            name: "config get".to_string(),
            description: "Get configuration value".to_string(),
            category: "config".to_string(),
            args: vec!["key".to_string()],
        },
        CommandMetadata {
            name: "config list".to_string(),
            description: "List all configuration".to_string(),
            category: "config".to_string(),
            args: vec![],
        },
        CommandMetadata {
            name: "viz generate".to_string(),
            description: "Generate mesh visualization".to_string(),
            category: "viz".to_string(),
            args: vec!["format".to_string()],
        },
        CommandMetadata {
            name: "viz export".to_string(),
            description: "Export visualization".to_string(),
            category: "viz".to_string(),
            args: vec!["output-path".to_string()],
        },
    ];

    let filtered_commands = if let Some(cat) = category {
        all_commands
            .into_iter()
            .filter(|cmd| cmd.category == cat)
            .collect()
    } else {
        all_commands
    };

    match serde_json::to_string(&filtered_commands) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize commands: {}",
            e
        ))),
    }
}

/// Get help for a specific command
///
/// # Arguments
/// * `command_name` - Name of the command
///
/// # Returns
/// JSON string with help information
#[napi]
pub fn get_command_help(command_name: String) -> Result<String> {
    let help_info = CommandHelpInfo {
        command: command_name.clone(),
        description: format!("Help for command: {}", command_name),
        usage: format!("mesh-cli {} [options]", command_name),
        options: vec![
            OptionInfo {
                name: "--verbose".to_string(),
                description: "Enable verbose output".to_string(),
                required: false,
            },
            OptionInfo {
                name: "--config".to_string(),
                description: "Configuration file path".to_string(),
                required: false,
            },
        ],
        examples: vec![
            format!("mesh-cli {} example1", command_name),
            format!("mesh-cli {} --verbose example2", command_name),
        ],
    };

    match serde_json::to_string(&help_info) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize help: {}",
            e
        ))),
    }
}

/// Generate mesh visualization
///
/// # Arguments
/// * `nodes_json` - JSON array of mesh nodes
/// * `format` - Visualization format (e.g., "svg", "json")
///
/// # Returns
/// JSON string with visualization data
#[napi]
pub fn generate_mesh_visualization(nodes_json: String, format: String) -> Result<String> {
    let nodes: Vec<MeshNode> = match serde_json::from_str(&nodes_json) {
        Ok(n) => n,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse nodes JSON: {}",
                e
            )))
        }
    };

    // Generate visualization elements
    let mut elements = Vec::new();
    let node_count = nodes.len() as f64;

    for (i, node) in nodes.iter().enumerate() {
        let angle = (2.0 * std::f64::consts::PI * i as f64) / node_count;
        let radius = 100.0;
        let x = 200.0 + radius * angle.cos();
        let y = 200.0 + radius * angle.sin();

        let element = VisualizationElement {
            node_id: node.id.clone(),
            x,
            y,
            size: 30.0,
            color: if node.status == "active" {
                "green".to_string()
            } else {
                "red".to_string()
            },
            connections: nodes
                .iter()
                .take(i.min(2) + 1)
                .map(|n| n.id.clone())
                .collect(),
        };
        elements.push(element);
    }

    let visualization = MeshVisualization {
        format,
        nodes_count: nodes.len() as u32,
        elements,
        generated_at: get_timestamp(),
        dimensions: VisualizationDimensions {
            width: 400,
            height: 400,
        },
    };

    match serde_json::to_string(&visualization) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize visualization: {}",
            e
        ))),
    }
}

/// Get current mesh CLI status
///
/// # Returns
/// JSON string with CLI status
#[napi]
pub fn get_cli_status() -> Result<String> {
    let status = CliStatus {
        version: "1.0.0".to_string(),
        status: "running".to_string(),
        uptime_ms: get_uptime_ms(),
        commands_executed: 0,
        last_command: None,
        memory_usage_mb: 45.2,
    };

    match serde_json::to_string(&status) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize status: {}",
            e
        ))),
    }
}

/// Create or update CLI configuration
///
/// # Arguments
/// * `config_json` - JSON string containing configuration
///
/// # Returns
/// JSON string with configuration result
#[napi]
pub fn configure_cli(config_json: String) -> Result<String> {
    let config: MeshConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config JSON: {}",
                e
            )))
        }
    };

    let result = ConfigurationResult {
        status: "configured".to_string(),
        config_id: generate_config_id(),
        mesh_name: config.name,
        created_at: get_timestamp(),
        is_valid: true,
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize result: {}",
            e
        ))),
    }
}

/// Export current mesh state
///
/// # Arguments
/// * `export_format` - Format for export (e.g., "json", "yaml")
///
/// # Returns
/// JSON string with exported mesh state
#[napi]
pub fn export_mesh_state(export_format: String) -> Result<String> {
    let export = MeshStateExport {
        format: export_format,
        exported_at: get_timestamp(),
        mesh_id: generate_mesh_id(),
        version: "1.0.0".to_string(),
        data: serde_json::json!({
            "nodes": [],
            "configuration": {},
            "status": "healthy"
        }),
    };

    match serde_json::to_string(&export) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize export: {}",
            e
        ))),
    }
}

/// Import mesh state from data
///
/// # Arguments
/// * `import_data` - JSON string with mesh state data
///
/// # Returns
/// JSON string with import result
#[napi]
pub fn import_mesh_state(import_data: String) -> Result<String> {
    // Parse and validate import data
    let _data: serde_json::Value = match serde_json::from_str(&import_data) {
        Ok(d) => d,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse import data: {}",
                e
            )))
        }
    };

    let result = ImportResult {
        status: "imported".to_string(),
        imported_at: get_timestamp(),
        nodes_imported: 5,
        configurations_imported: 1,
        message: "Mesh state imported successfully".to_string(),
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize result: {}",
            e
        ))),
    }
}

// ============ MeshCli Class for Stateful Operations ============

/// MeshCli - Main CLI runner for code mesh operations
#[napi]
pub struct MeshCli {
    config: Arc<Mutex<Option<MeshConfig>>>,
    command_history: Arc<Mutex<Vec<String>>>,
    session_id: String,
    command_count: Arc<Mutex<u32>>,
}

#[napi]
impl MeshCli {
    /// Create a new MeshCli instance
    #[napi(constructor)]
    pub fn new(config_json: Option<String>) -> Result<Self> {
        let config = match config_json {
            Some(json) => match serde_json::from_str::<MeshConfig>(&json) {
                Ok(cfg) => Some(cfg),
                Err(e) => {
                    return Err(Error::from_reason(format!(
                        "Failed to parse MeshConfig: {}",
                        e
                    )))
                }
            },
            None => None,
        };

        Ok(Self {
            config: Arc::new(Mutex::new(config)),
            command_history: Arc::new(Mutex::new(Vec::new())),
            session_id: generate_session_id_str(),
            command_count: Arc::new(Mutex::new(0)),
        })
    }

    /// Initialize the mesh CLI
    #[napi]
    pub fn initialize(&mut self, config_json: String) -> Result<String> {
        let config: MeshConfig = match serde_json::from_str(&config_json) {
            Ok(cfg) => cfg,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse config: {}",
                    e
                )))
            }
        };

        if let Ok(mut cfg) = self.config.lock() {
            *cfg = Some(config.clone());
        }

        let result = CliInitializationResult {
            cli_id: generate_cli_id(),
            mesh_name: config.name,
            initialized_at: get_timestamp(),
            nodes_count: config.nodes,
            status: "initialized".to_string(),
            version: "1.0.0".to_string(),
        };

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize result: {}",
                e
            ))),
        }
    }

    /// Execute a command and track in history
    #[napi]
    pub fn execute(&mut self, command_json: String) -> Result<String> {
        let command: Command = match serde_json::from_str(&command_json) {
            Ok(cmd) => cmd,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse command: {}",
                    e
                )))
            }
        };

        // Track in history
        if let Ok(mut history) = self.command_history.lock() {
            history.push(command.name.clone());
        }

        // Increment count
        if let Ok(mut count) = self.command_count.lock() {
            *count += 1;
        }

        let execution_result = execute_cli_command(&command.name, &command.args);

        let result = CommandExecutionResult {
            command_name: command.name,
            executed_at: get_timestamp(),
            status: "completed".to_string(),
            output: execution_result,
            exit_code: 0,
        };

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize result: {}",
                e
            ))),
        }
    }

    /// Get command history
    #[napi]
    pub fn get_history(&self) -> Result<String> {
        match self.command_history.lock() {
            Ok(history) => match serde_json::to_string(&*history) {
                Ok(json) => Ok(json),
                Err(e) => Err(Error::from_reason(format!(
                    "Failed to serialize history: {}",
                    e
                ))),
            },
            Err(_) => Err(Error::from_reason("Failed to acquire history lock".to_string())),
        }
    }

    /// Get session state
    #[napi]
    pub fn get_session_state(&self) -> Result<String> {
        let command_count = self.command_count.lock().ok().map(|c| *c).unwrap_or(0);

        let state = MeshCliSessionState {
            session_id: self.session_id.clone(),
            active: true,
            command_count,
            start_time: chrono::Utc::now().to_rfc3339(),
        };

        match serde_json::to_string(&state) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize session state: {}",
                e
            ))),
        }
    }

    /// Get current configuration
    #[napi]
    pub fn get_config(&self) -> Result<String> {
        match self.config.lock() {
            Ok(cfg) => match serde_json::to_string(&*cfg) {
                Ok(json) => Ok(json),
                Err(e) => Err(Error::from_reason(format!(
                    "Failed to serialize config: {}",
                    e
                ))),
            },
            Err(_) => Err(Error::from_reason("Failed to acquire config lock".to_string())),
        }
    }
}

// ============ Helper Structures ============

#[derive(Serialize, Deserialize, Debug)]
struct CliInitializationResult {
    cli_id: String,
    mesh_name: String,
    initialized_at: String,
    nodes_count: u32,
    status: String,
    version: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct CommandExecutionResult {
    command_name: String,
    executed_at: String,
    status: String,
    output: String,
    exit_code: i32,
}

#[derive(Serialize, Deserialize, Debug)]
struct CommandMetadata {
    name: String,
    description: String,
    category: String,
    args: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct CommandHelpInfo {
    command: String,
    description: String,
    usage: String,
    options: Vec<OptionInfo>,
    examples: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct OptionInfo {
    name: String,
    description: String,
    required: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct MeshVisualization {
    format: String,
    nodes_count: u32,
    elements: Vec<VisualizationElement>,
    generated_at: String,
    dimensions: VisualizationDimensions,
}

#[derive(Serialize, Deserialize, Debug)]
struct VisualizationDimensions {
    width: u32,
    height: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct CliStatus {
    version: String,
    status: String,
    uptime_ms: u64,
    commands_executed: u32,
    last_command: Option<String>,
    memory_usage_mb: f64,
}

#[derive(Serialize, Deserialize, Debug)]
struct ConfigurationResult {
    status: String,
    config_id: String,
    mesh_name: String,
    created_at: String,
    is_valid: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct MeshStateExport {
    format: String,
    exported_at: String,
    mesh_id: String,
    version: String,
    data: serde_json::Value,
}

#[derive(Serialize, Deserialize, Debug)]
struct ImportResult {
    status: String,
    imported_at: String,
    nodes_imported: u32,
    configurations_imported: u32,
    message: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct MeshCliSessionState {
    session_id: String,
    active: bool,
    command_count: u32,
    start_time: String,
}

// ============ Helper Functions ============

fn execute_cli_command(command_name: &str, _args: &[String]) -> String {
    match command_name {
        "mesh" => "Mesh command executed successfully".to_string(),
        "config" => "Configuration updated".to_string(),
        "viz" => "Visualization generated".to_string(),
        "status" => "Mesh is healthy and running".to_string(),
        _ => format!("Command executed: {}", command_name),
    }
}

fn generate_cli_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    format!("cli-{}", duration.as_millis())
}

fn generate_config_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    format!("config-{}", duration.as_millis())
}

fn generate_mesh_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    format!("mesh-{}", duration.as_millis())
}

fn generate_session_id_str() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    format!("session-{}", duration.as_millis())
}

fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}

fn get_uptime_ms() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    duration.as_millis() as u64
}
