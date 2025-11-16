use chrono::Utc;
use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

// ============ Data Structures ============

/// Agent state enum
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AgentState {
    #[serde(rename = "idle")]
    Idle,
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "busy")]
    Busy,
    #[serde(rename = "paused")]
    Paused,
    #[serde(rename = "error")]
    Error,
    #[serde(rename = "stopped")]
    Stopped,
}

/// Task priority levels
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, PartialOrd)]
pub enum TaskPriority {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "critical")]
    Critical,
}

/// Task status
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TaskStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "assigned")]
    Assigned,
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

/// Agent configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentConfig {
    pub name: String,
    pub capabilities: Vec<String>,
    pub max_concurrent_tasks: i32,
    pub timeout_ms: i32,
    pub auto_restart: Option<bool>,
}

/// Agent information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub state: AgentState,
    pub capabilities: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub max_concurrent_tasks: i32,
    pub current_tasks: i32,
    pub completed_tasks: i32,
    pub failed_tasks: i32,
    pub uptime_ms: i64,
    pub metadata: serde_json::Value,
}

/// Task information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Task {
    pub id: String,
    pub agent_id: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub payload: serde_json::Value,
    pub created_at: String,
    pub assigned_at: Option<String>,
    pub completed_at: Option<String>,
    pub execution_time_ms: Option<i64>,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// Task input for deserialization (with optional fields)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TaskInput {
    pub id: String,
    pub agent_id: Option<String>,
    #[serde(default)]
    pub status: Option<TaskStatus>,
    #[serde(default)]
    pub priority: Option<TaskPriority>,
    #[serde(default)]
    pub payload: Option<serde_json::Value>,
    pub created_at: Option<String>,
    pub assigned_at: Option<String>,
    pub completed_at: Option<String>,
    pub execution_time_ms: Option<i64>,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// Message for inter-agent communication
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Message {
    pub id: String,
    pub from_agent_id: String,
    pub to_agent_id: String,
    pub content: serde_json::Value,
    pub sent_at: String,
    pub received_at: Option<String>,
    pub read_at: Option<String>,
}

/// Agent status snapshot
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentStatus {
    pub agent_id: String,
    pub state: AgentState,
    pub current_tasks: i32,
    pub completed_tasks: i32,
    pub failed_tasks: i32,
    pub uptime_ms: i64,
    pub last_activity: String,
    pub health: String, // "healthy", "degraded", "unhealthy"
}

// ============ Global Agent Registry ============

lazy_static::lazy_static! {
    static ref AGENT_REGISTRY: Arc<Mutex<HashMap<String, Agent>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref TASK_QUEUE: Arc<Mutex<Vec<Task>>> = Arc::new(Mutex::new(Vec::new()));
    static ref MESSAGE_INBOX: Arc<Mutex<HashMap<String, Vec<Message>>>> = Arc::new(Mutex::new(HashMap::new()));
    static ref AGENT_ACTIVITY: Arc<Mutex<HashMap<String, i64>>> = Arc::new(Mutex::new(HashMap::new()));
}

// ============ NAPI Exports ============

/// Create a new agent with the given configuration
///
/// # Arguments
/// * `config_json` - JSON string containing agent configuration
///
/// # Returns
/// JSON object with created agent information
#[napi]
pub fn create_agent(config_json: String) -> Result<String> {
    let config: AgentConfig = serde_json::from_str(&config_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse config: {}", e)))?;

    let agent_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let agent = Agent {
        id: agent_id.clone(),
        name: config.name,
        state: AgentState::Idle,
        capabilities: config.capabilities,
        created_at: now.clone(),
        updated_at: now,
        max_concurrent_tasks: config.max_concurrent_tasks,
        current_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        uptime_ms: 0,
        metadata: serde_json::json!({}),
    };

    let mut registry = AGENT_REGISTRY.lock().unwrap();
    registry.insert(agent_id.clone(), agent.clone());

    let mut activity = AGENT_ACTIVITY.lock().unwrap();
    activity.insert(agent_id, Utc::now().timestamp_millis());

    serde_json::to_string(&agent)
        .map_err(|e| Error::from_reason(format!("Failed to serialize agent: {}", e)))
}

/// Start an agent (transition to active state)
///
/// # Arguments
/// * `agent_id` - Agent identifier
///
/// # Returns
/// JSON object with updated agent information
#[napi]
pub fn start_agent(agent_id: String) -> Result<String> {
    let mut registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get_mut(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    agent.state = AgentState::Active;
    agent.updated_at = Utc::now().to_rfc3339();

    let mut activity = AGENT_ACTIVITY.lock().unwrap();
    activity.insert(agent_id, Utc::now().timestamp_millis());

    serde_json::to_string(agent)
        .map_err(|e| Error::from_reason(format!("Failed to serialize agent: {}", e)))
}

/// Stop an agent
///
/// # Arguments
/// * `agent_id` - Agent identifier
///
/// # Returns
/// JSON object with updated agent information
#[napi]
pub fn stop_agent(agent_id: String) -> Result<String> {
    let mut registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get_mut(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    agent.state = AgentState::Stopped;
    agent.updated_at = Utc::now().to_rfc3339();

    serde_json::to_string(agent)
        .map_err(|e| Error::from_reason(format!("Failed to serialize agent: {}", e)))
}

/// Pause an agent
///
/// # Arguments
/// * `agent_id` - Agent identifier
///
/// # Returns
/// JSON object with updated agent information
#[napi]
pub fn pause_agent(agent_id: String) -> Result<String> {
    let mut registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get_mut(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    agent.state = AgentState::Paused;
    agent.updated_at = Utc::now().to_rfc3339();

    serde_json::to_string(agent)
        .map_err(|e| Error::from_reason(format!("Failed to serialize agent: {}", e)))
}

/// Resume a paused agent
///
/// # Arguments
/// * `agent_id` - Agent identifier
///
/// # Returns
/// JSON object with updated agent information
#[napi]
pub fn resume_agent(agent_id: String) -> Result<String> {
    let mut registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get_mut(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    if agent.state != AgentState::Paused {
        return Err(Error::from_reason("Agent is not paused"));
    }

    agent.state = AgentState::Active;
    agent.updated_at = Utc::now().to_rfc3339();

    serde_json::to_string(agent)
        .map_err(|e| Error::from_reason(format!("Failed to serialize agent: {}", e)))
}

/// Destroy an agent (remove from registry)
///
/// # Arguments
/// * `agent_id` - Agent identifier
///
/// # Returns
/// Success message
#[napi]
pub fn destroy_agent(agent_id: String) -> Result<String> {
    let mut registry = AGENT_REGISTRY.lock().unwrap();
    registry
        .remove(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    let mut activity = AGENT_ACTIVITY.lock().unwrap();
    activity.remove(&agent_id);

    let mut inbox = MESSAGE_INBOX.lock().unwrap();
    inbox.remove(&agent_id);

    Ok(format!(r#"{{"success": true, "message": "Agent {} destroyed"}}"#, agent_id))
}

/// Get agent information
///
/// # Arguments
/// * `agent_id` - Agent identifier
///
/// # Returns
/// JSON object with agent information
#[napi]
pub fn get_agent(agent_id: String) -> Result<String> {
    let registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    serde_json::to_string(agent)
        .map_err(|e| Error::from_reason(format!("Failed to serialize agent: {}", e)))
}

/// Get all agents
///
/// # Returns
/// JSON array of all agents
#[napi]
pub fn get_all_agents() -> Result<String> {
    let registry = AGENT_REGISTRY.lock().unwrap();
    let mut agents: Vec<Agent> = registry.values().cloned().collect();

    // Sort by created_at to ensure consistent ordering
    agents.sort_by(|a, b| a.created_at.cmp(&b.created_at));

    serde_json::to_string(&agents)
        .map_err(|e| Error::from_reason(format!("Failed to serialize agents: {}", e)))
}

/// Assign a task to an agent
///
/// # Arguments
/// * `agent_id` - Agent identifier
/// * `task_json` - JSON object containing task information
///
/// # Returns
/// JSON object with assigned task
#[napi]
pub fn assign_task(agent_id: String, task_json: String) -> Result<String> {
    let task_input: TaskInput = serde_json::from_str(&task_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse task: {}", e)))?;

    // Verify agent exists and can accept tasks
    let mut registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get_mut(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    if agent.state == AgentState::Stopped || agent.state == AgentState::Error {
        return Err(Error::from_reason("Agent cannot accept tasks in current state"));
    }

    if agent.current_tasks >= agent.max_concurrent_tasks {
        return Err(Error::from_reason("Agent has reached maximum concurrent tasks"));
    }

    // Create full task with defaults
    let task = Task {
        id: task_input.id,
        agent_id: Some(agent_id.clone()),
        status: TaskStatus::Assigned,
        priority: task_input.priority.unwrap_or(TaskPriority::Normal),
        payload: task_input.payload.unwrap_or(serde_json::json!({})),
        created_at: task_input.created_at.unwrap_or_else(|| Utc::now().to_rfc3339()),
        assigned_at: Some(Utc::now().to_rfc3339()),
        completed_at: None,
        execution_time_ms: None,
        result: None,
        error: None,
    };

    agent.current_tasks += 1;
    agent.state = AgentState::Busy;
    agent.updated_at = Utc::now().to_rfc3339();

    let mut activity = AGENT_ACTIVITY.lock().unwrap();
    activity.insert(agent_id, Utc::now().timestamp_millis());

    serde_json::to_string(&task)
        .map_err(|e| Error::from_reason(format!("Failed to serialize task: {}", e)))
}

/// Complete a task
///
/// # Arguments
/// * `agent_id` - Agent identifier
/// * `task_id` - Task identifier
/// * `result_json` - JSON object containing task result
///
/// # Returns
/// JSON object with completed task
#[napi]
pub fn complete_task(agent_id: String, task_id: String, result_json: String) -> Result<String> {
    let result: serde_json::Value = serde_json::from_str(&result_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse result: {}", e)))?;

    let mut registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get_mut(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    agent.current_tasks = (agent.current_tasks - 1).max(0);
    agent.completed_tasks += 1;

    if agent.current_tasks == 0 {
        agent.state = AgentState::Idle;
    }

    agent.updated_at = Utc::now().to_rfc3339();

    let mut activity = AGENT_ACTIVITY.lock().unwrap();
    activity.insert(agent_id.clone(), Utc::now().timestamp_millis());

    let task = Task {
        id: task_id,
        agent_id: Some(agent_id),
        status: TaskStatus::Completed,
        priority: TaskPriority::Normal,
        payload: serde_json::json!({}),
        created_at: Utc::now().to_rfc3339(),
        assigned_at: None,
        completed_at: Some(Utc::now().to_rfc3339()),
        execution_time_ms: None,
        result: Some(result),
        error: None,
    };

    serde_json::to_string(&task)
        .map_err(|e| Error::from_reason(format!("Failed to serialize task: {}", e)))
}

/// Fail a task
///
/// # Arguments
/// * `agent_id` - Agent identifier
/// * `task_id` - Task identifier
/// * `error_message` - Error message
///
/// # Returns
/// JSON object with failed task
#[napi]
pub fn fail_task(agent_id: String, task_id: String, error_message: String) -> Result<String> {
    let mut registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get_mut(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    agent.current_tasks = (agent.current_tasks - 1).max(0);
    agent.failed_tasks += 1;

    if agent.current_tasks == 0 {
        agent.state = AgentState::Idle;
    }

    agent.updated_at = Utc::now().to_rfc3339();

    let mut activity = AGENT_ACTIVITY.lock().unwrap();
    activity.insert(agent_id.clone(), Utc::now().timestamp_millis());

    let task = Task {
        id: task_id,
        agent_id: Some(agent_id),
        status: TaskStatus::Failed,
        priority: TaskPriority::Normal,
        payload: serde_json::json!({}),
        created_at: Utc::now().to_rfc3339(),
        assigned_at: None,
        completed_at: Some(Utc::now().to_rfc3339()),
        execution_time_ms: None,
        result: None,
        error: Some(error_message),
    };

    serde_json::to_string(&task)
        .map_err(|e| Error::from_reason(format!("Failed to serialize task: {}", e)))
}

/// Send a message between agents
///
/// # Arguments
/// * `from_agent_id` - Sender agent identifier
/// * `to_agent_id` - Recipient agent identifier
/// * `content_json` - Message content as JSON
///
/// # Returns
/// JSON object with message information
#[napi]
pub fn send_message(from_agent_id: String, to_agent_id: String, content_json: String) -> Result<String> {
    let content: serde_json::Value = serde_json::from_str(&content_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse content: {}", e)))?;

    // Verify both agents exist
    let registry = AGENT_REGISTRY.lock().unwrap();
    registry
        .get(&from_agent_id)
        .ok_or_else(|| Error::from_reason("From agent not found"))?;
    registry
        .get(&to_agent_id)
        .ok_or_else(|| Error::from_reason("To agent not found"))?;
    drop(registry);

    let message = Message {
        id: Uuid::new_v4().to_string(),
        from_agent_id,
        to_agent_id: to_agent_id.clone(),
        content,
        sent_at: Utc::now().to_rfc3339(),
        received_at: None,
        read_at: None,
    };

    let mut inbox = MESSAGE_INBOX.lock().unwrap();
    inbox
        .entry(to_agent_id)
        .or_insert_with(Vec::new)
        .push(message.clone());

    serde_json::to_string(&message)
        .map_err(|e| Error::from_reason(format!("Failed to serialize message: {}", e)))
}

/// Get messages for an agent
///
/// # Arguments
/// * `agent_id` - Agent identifier
/// * `unread_only` - If true, only return unread messages
///
/// # Returns
/// JSON array of messages
#[napi]
pub fn get_messages(agent_id: String, unread_only: bool) -> Result<String> {
    let mut inbox = MESSAGE_INBOX.lock().unwrap();
    let messages = inbox
        .entry(agent_id)
        .or_insert_with(Vec::new)
        .iter()
        .filter(|msg| !unread_only || msg.read_at.is_none())
        .cloned()
        .collect::<Vec<_>>();

    serde_json::to_string(&messages)
        .map_err(|e| Error::from_reason(format!("Failed to serialize messages: {}", e)))
}

/// Mark message as read
///
/// # Arguments
/// * `agent_id` - Agent identifier
/// * `message_id` - Message identifier
///
/// # Returns
/// Success message
#[napi]
pub fn mark_message_read(agent_id: String, message_id: String) -> Result<String> {
    let mut inbox = MESSAGE_INBOX.lock().unwrap();
    if let Some(messages) = inbox.get_mut(&agent_id) {
        if let Some(msg) = messages.iter_mut().find(|m| m.id == message_id) {
            msg.read_at = Some(Utc::now().to_rfc3339());
            return Ok(r#"{"success": true}"#.to_string());
        }
    }
    Err(Error::from_reason("Message not found"))
}

/// Get agent status
///
/// # Arguments
/// * `agent_id` - Agent identifier
///
/// # Returns
/// JSON object with agent status
#[napi]
pub fn get_agent_status(agent_id: String) -> Result<String> {
    let registry = AGENT_REGISTRY.lock().unwrap();
    let agent = registry
        .get(&agent_id)
        .ok_or_else(|| Error::from_reason("Agent not found"))?;

    let activity = AGENT_ACTIVITY.lock().unwrap();
    let last_activity = activity
        .get(&agent_id)
        .map(|t| Utc::now().timestamp_millis() - t)
        .unwrap_or(0);

    let uptime_ms = Utc::now().timestamp_millis()
        - chrono::DateTime::parse_from_rfc3339(&agent.created_at)
            .map(|dt| dt.with_timezone(&Utc).timestamp_millis())
            .unwrap_or(0);

    let health = if agent.state == AgentState::Error || agent.failed_tasks > 10 {
        "unhealthy"
    } else if agent.failed_tasks > 5 {
        "degraded"
    } else {
        "healthy"
    };

    let status = AgentStatus {
        agent_id: agent.id.clone(),
        state: agent.state.clone(),
        current_tasks: agent.current_tasks,
        completed_tasks: agent.completed_tasks,
        failed_tasks: agent.failed_tasks,
        uptime_ms,
        last_activity: format!("{}ms ago", last_activity),
        health: health.to_string(),
    };

    serde_json::to_string(&status)
        .map_err(|e| Error::from_reason(format!("Failed to serialize status: {}", e)))
}

/// Get all agent statuses
///
/// # Returns
/// JSON array of all agent statuses
#[napi]
pub fn get_all_agent_statuses() -> Result<String> {
    let registry = AGENT_REGISTRY.lock().unwrap();
    let activity = AGENT_ACTIVITY.lock().unwrap();

    let statuses: Vec<AgentStatus> = registry
        .values()
        .map(|agent| {
            let last_activity = activity
                .get(&agent.id)
                .map(|t| Utc::now().timestamp_millis() - t)
                .unwrap_or(0);

            let uptime_ms = Utc::now().timestamp_millis()
                - chrono::DateTime::parse_from_rfc3339(&agent.created_at)
                    .map(|dt| dt.with_timezone(&Utc).timestamp_millis())
                    .unwrap_or(0);

            let health = if agent.state == AgentState::Error || agent.failed_tasks > 10 {
                "unhealthy"
            } else if agent.failed_tasks > 5 {
                "degraded"
            } else {
                "healthy"
            };

            AgentStatus {
                agent_id: agent.id.clone(),
                state: agent.state.clone(),
                current_tasks: agent.current_tasks,
                completed_tasks: agent.completed_tasks,
                failed_tasks: agent.failed_tasks,
                uptime_ms,
                last_activity: format!("{}ms ago", last_activity),
                health: health.to_string(),
            }
        })
        .collect();

    serde_json::to_string(&statuses)
        .map_err(|e| Error::from_reason(format!("Failed to serialize statuses: {}", e)))
}

/// Reset all agents and state (for testing)
///
/// # Returns
/// Success message
#[napi]
pub fn reset_all() -> Result<String> {
    let mut registry = AGENT_REGISTRY.lock().unwrap();
    registry.clear();

    let mut queue = TASK_QUEUE.lock().unwrap();
    queue.clear();

    let mut inbox = MESSAGE_INBOX.lock().unwrap();
    inbox.clear();

    let mut activity = AGENT_ACTIVITY.lock().unwrap();
    activity.clear();

    Ok(r#"{"success": true, "message": "All agents and state reset"}"#.to_string())
}

/// Get agent count
///
/// # Returns
/// Number of agents in registry
#[napi]
pub fn get_agent_count() -> Result<i32> {
    let registry = AGENT_REGISTRY.lock().unwrap();
    Ok(registry.len() as i32)
}
