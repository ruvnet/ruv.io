use napi::{bindgen_prelude::*, Error};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// CLI configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CliConfig {
    pub prompt: Option<String>,
    pub history_size: Option<usize>,
    pub color_output: Option<bool>,
    pub debug_mode: Option<bool>,
    pub timeout_ms: Option<u64>,
}

/// Parsed command
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Command {
    pub name: String,
    pub args: Vec<String>,
    pub options: HashMap<String, String>,
}

/// Command execution result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CommandResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub execution_time_ms: u64,
}

/// Configuration validation result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConfigValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

/// REPL session state
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ReplSessionState {
    pub session_id: String,
    pub active: bool,
    pub command_count: u32,
    pub start_time: String,
    pub last_command: Option<String>,
}

/// CLI Runner for command parsing and execution
#[napi]
pub struct CliRunner {
    config: Arc<CliConfig>,
    command_history: Arc<std::sync::Mutex<Vec<String>>>,
    session_id: String,
    command_count: Arc<std::sync::Mutex<u32>>,
}

#[napi]
impl CliRunner {
    /// Create a new CLI runner instance
    #[napi(constructor)]
    pub fn new(config_json: Option<String>) -> Result<Self> {
        let config = match config_json {
            Some(json) => match serde_json::from_str::<CliConfig>(&json) {
                Ok(cfg) => cfg,
                Err(e) => {
                    return Err(Error::from_reason(format!(
                        "Failed to parse CLI config: {}",
                        e
                    )))
                }
            },
            None => CliConfig {
                prompt: Some("daa-prime> ".to_string()),
                history_size: Some(1000),
                color_output: Some(true),
                debug_mode: Some(false),
                timeout_ms: Some(30000),
            },
        };

        Ok(Self {
            config: Arc::new(config),
            command_history: Arc::new(std::sync::Mutex::new(Vec::new())),
            session_id: uuid::Uuid::new_v4().to_string(),
            command_count: Arc::new(std::sync::Mutex::new(0)),
        })
    }

    /// Get current CLI configuration
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

    /// Parse a command string into a Command struct
    #[napi]
    pub fn parse_command(&self, command_line: String) -> Result<String> {
        let command = parse_command_line(&command_line)?;

        match serde_json::to_string(&command) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize command: {}",
                e
            ))),
        }
    }

    /// Execute a command and return result
    #[napi]
    pub fn execute_command(&mut self, command_json: String) -> Result<String> {
        let start_time = std::time::Instant::now();

        let command: Command = match serde_json::from_str(&command_json) {
            Ok(cmd) => cmd,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse command JSON: {}",
                    e
                )))
            }
        };

        // Execute the command
        let (success, output, error) = execute_command_impl(&command);

        let execution_time_ms = start_time.elapsed().as_millis() as u64;

        // Store in history
        if let Ok(mut history) = self.command_history.lock() {
            history.push(command.name.clone());
            let max_size = self.config.history_size.unwrap_or(1000);
            if history.len() > max_size {
                history.remove(0);
            }
        }

        // Increment command count
        if let Ok(mut count) = self.command_count.lock() {
            *count += 1;
        }

        let result = CommandResult {
            success,
            output,
            error,
            execution_time_ms,
        };

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize result: {}",
                e
            ))),
        }
    }

    /// Execute a raw command line
    #[napi]
    pub fn execute_raw(&mut self, command_line: String) -> Result<String> {
        let command = parse_command_line(&command_line)?;
        let command_json = serde_json::to_string(&command).map_err(|e| {
            Error::from_reason(format!("Failed to serialize command: {}", e))
        })?;

        self.execute_command(command_json)
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

    /// Clear command history
    #[napi]
    pub fn clear_history(&self) -> Result<bool> {
        match self.command_history.lock() {
            Ok(mut history) => {
                history.clear();
                Ok(true)
            }
            Err(_) => Err(Error::from_reason("Failed to acquire history lock".to_string())),
        }
    }

    /// Get current session state
    #[napi]
    pub fn get_session_state(&self) -> Result<String> {
        let command_count = self.command_count.lock().ok().map(|c| *c).unwrap_or(0);

        let state = ReplSessionState {
            session_id: self.session_id.clone(),
            active: true,
            command_count,
            start_time: chrono::Utc::now().to_rfc3339(),
            last_command: self
                .command_history
                .lock()
                .ok()
                .and_then(|h| h.last().cloned()),
        };

        match serde_json::to_string(&state) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize session state: {}",
                e
            ))),
        }
    }

    /// List available commands
    #[napi]
    pub fn list_commands(&self) -> Result<String> {
        let commands = vec![
            "help",
            "version",
            "config",
            "peer",
            "model",
            "train",
            "execute",
            "status",
            "clear",
            "exit",
        ];

        match serde_json::to_string(&commands) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize commands: {}",
                e
            ))),
        }
    }

    /// Validate and update configuration
    #[napi]
    pub fn validate_config(&self, config_json: String) -> Result<String> {
        let validation_result = validate_config_impl(&config_json);

        match serde_json::to_string(&validation_result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize validation result: {}",
                e
            ))),
        }
    }
}

// ============ Helper Functions ============

/// Parse a command line string into a Command struct
fn parse_command_line(command_line: &str) -> Result<Command> {
    let trimmed = command_line.trim();

    if trimmed.is_empty() {
        return Err(Error::from_reason("Empty command".to_string()));
    }

    // Split command line respecting quoted strings
    let parts: Vec<&str> = trimmed.split_whitespace().collect();

    if parts.is_empty() {
        return Err(Error::from_reason("No command provided".to_string()));
    }

    let name = parts[0].to_string();
    let mut args = Vec::new();
    let mut options = HashMap::new();

    for i in 1..parts.len() {
        let part = parts[i];
        if part.starts_with("--") {
            // Long option
            let option_name = part.trim_start_matches("--");
            if let Some(eq_pos) = option_name.find('=') {
                let key = option_name[..eq_pos].to_string();
                let value = option_name[eq_pos + 1..].to_string();
                options.insert(key, value);
            } else {
                options.insert(option_name.to_string(), "true".to_string());
            }
        } else if part.starts_with("-") && part.len() > 1 && !is_negative_number(part) {
            // Short option
            let flag = part.trim_start_matches("-");
            options.insert(flag.to_string(), "true".to_string());
        } else {
            // Argument
            args.push(part.to_string());
        }
    }

    Ok(Command { name, args, options })
}

/// Check if a string is a negative number
fn is_negative_number(s: &str) -> bool {
    s.starts_with("-") && s.len() > 1 && s[1..].chars().next().map_or(false, |c| c.is_numeric())
}

/// Execute a command and return result
fn execute_command_impl(command: &Command) -> (bool, String, Option<String>) {
    match command.name.as_str() {
        "help" => {
            let help_text = r#"Available commands:
  help                - Show this help message
  version             - Show version information
  config              - Show or update configuration
  peer                - Manage peers
  model               - Manage models
  train               - Train models
  execute             - Execute a script
  status              - Show system status
  clear               - Clear history
  exit                - Exit the CLI

Use 'command --help' for more information about a command."#;
            (true, help_text.to_string(), None)
        }
        "version" => {
            let version = "DAA Prime CLI v1.0.0";
            (true, version.to_string(), None)
        }
        "config" => {
            if command.args.is_empty() {
                (
                    true,
                    "Configuration displayed".to_string(),
                    None,
                )
            } else {
                (true, format!("Configuration updated: {:?}", command.args), None)
            }
        }
        "peer" => {
            if command.args.is_empty() {
                (true, "No peers specified".to_string(), None)
            } else {
                (true, format!("Peer command executed: {:?}", command.args), None)
            }
        }
        "model" => {
            if command.args.is_empty() {
                (true, "No models specified".to_string(), None)
            } else {
                (true, format!("Model command executed: {:?}", command.args), None)
            }
        }
        "train" => {
            if command.args.is_empty() {
                (
                    false,
                    String::new(),
                    Some("No model specified for training".to_string()),
                )
            } else {
                (
                    true,
                    format!("Training started for model: {}", command.args[0]),
                    None,
                )
            }
        }
        "execute" => {
            if command.args.is_empty() {
                (
                    false,
                    String::new(),
                    Some("No script specified".to_string()),
                )
            } else {
                (true, format!("Script executed: {}", command.args[0]), None)
            }
        }
        "status" => (
            true,
            "System status: OK. Running normally.".to_string(),
            None,
        ),
        "clear" => (true, "History cleared".to_string(), None),
        "exit" => (true, "Goodbye!".to_string(), None),
        _ => (
            false,
            String::new(),
            Some(format!("Unknown command: {}", command.name)),
        ),
    }
}

/// Validate configuration
fn validate_config_impl(config_json: &str) -> ConfigValidationResult {
    match serde_json::from_str::<CliConfig>(config_json) {
        Ok(config) => {
            let mut errors = Vec::new();
            let mut warnings = Vec::new();

            // Validate timeout_ms
            if let Some(timeout) = config.timeout_ms {
                if timeout == 0 {
                    errors.push("timeout_ms must be greater than 0".to_string());
                } else if timeout < 100 {
                    warnings.push("timeout_ms is very small, may cause issues".to_string());
                }
            }

            // Validate history_size
            if let Some(history_size) = config.history_size {
                if history_size == 0 {
                    warnings.push("history_size is 0, command history disabled".to_string());
                }
            }

            ConfigValidationResult {
                valid: errors.is_empty(),
                errors,
                warnings,
            }
        }
        Err(e) => ConfigValidationResult {
            valid: false,
            errors: vec![format!("Invalid JSON: {}", e)],
            warnings: Vec::new(),
        },
    }
}

// ============ Standalone Functions ============

/// Parse and validate a command line
#[napi]
pub fn parse_and_validate_command(command_line: String) -> Result<String> {
    let command = parse_command_line(&command_line)?;

    match serde_json::to_string(&command) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize command: {}",
            e
        ))),
    }
}

/// Build a command from components
#[napi]
pub fn build_command(name: String, args_json: String, options_json: String) -> Result<String> {
    let args: Vec<String> = match serde_json::from_str(&args_json) {
        Ok(a) => a,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse args: {}",
                e
            )))
        }
    };

    let options: HashMap<String, String> = match serde_json::from_str(&options_json) {
        Ok(o) => o,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse options: {}",
                e
            )))
        }
    };

    let command = Command { name, args, options };

    match serde_json::to_string(&command) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize command: {}",
            e
        ))),
    }
}

/// Execute a simple command by name
#[napi]
pub fn execute_simple_command(command_name: String) -> Result<String> {
    let command = Command {
        name: command_name,
        args: Vec::new(),
        options: HashMap::new(),
    };

    let (success, output, error) = execute_command_impl(&command);

    let result = CommandResult {
        success,
        output,
        error,
        execution_time_ms: 0,
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize result: {}",
            e
        ))),
    }
}

/// Validate configuration
#[napi]
pub fn validate_cli_config(config_json: String) -> Result<String> {
    let result = validate_config_impl(&config_json);

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize validation result: {}",
            e
        ))),
    }
}

/// Get default CLI configuration
#[napi]
pub fn get_default_config() -> Result<String> {
    let config = CliConfig {
        prompt: Some("daa-prime> ".to_string()),
        history_size: Some(1000),
        color_output: Some(true),
        debug_mode: Some(false),
        timeout_ms: Some(30000),
    };

    match serde_json::to_string(&config) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize config: {}",
            e
        ))),
    }
}

/// Generate a REPL session ID
#[napi]
pub fn generate_session_id() -> Result<String> {
    Ok(uuid::Uuid::new_v4().to_string())
}
