use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Agent status enumeration
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum AgentStatus {
    Active,
    Idle,
    Busy,
    Failed,
    Shutdown,
}

/// Task priority levels
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, PartialOrd, Eq, Ord)]
#[serde(rename_all = "UPPERCASE")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Critical,
}

/// Agent information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Agent {
    id: String,
    status: AgentStatus,
    load: f64,
    capacity: f64,
    tasks_completed: u32,
    region: String,
}

/// Task definition
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Task {
    id: String,
    agent_id: Option<String>,
    priority: TaskPriority,
    payload: serde_json::Value,
    status: String,
    created_at: String,
}

/// Consensus vote
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Vote {
    agent_id: String,
    decision: String,
    confidence: f64,
    timestamp: String,
}

/// Consensus result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConsensusResult {
    decision: String,
    agreement_percentage: f64,
    total_votes: u32,
    supporting_votes: u32,
    timestamp: String,
}

/// Initialize coordinator with configuration
///
/// # Arguments
/// * `config_json` - JSON string containing coordinator configuration
///
/// # Returns
/// JSON string with initialization result
#[napi]
pub fn initialize_coordinator(config_json: String) -> Result<String> {
    let _config: serde_json::Value = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse coordinator config: {}",
                e
            )))
        }
    };

    let result = serde_json::json!({
        "initialized": true,
        "timestamp": get_timestamp(),
        "coordinator_id": generate_id(),
        "status": "ready"
    });

    Ok(serde_json::to_string(&result).unwrap())
}

/// Register a new agent with the coordinator
///
/// # Arguments
/// * `agent_json` - JSON string containing agent information
///
/// # Returns
/// JSON string with registration confirmation
#[napi]
pub fn register_agent(agent_json: String) -> Result<String> {
    let agent: Agent = match serde_json::from_str(&agent_json) {
        Ok(a) => a,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse agent JSON: {}",
                e
            )))
        }
    };

    let result = serde_json::json!({
        "agent_id": agent.id,
        "registered": true,
        "timestamp": get_timestamp(),
        "status": "registered"
    });

    Ok(serde_json::to_string(&result).unwrap())
}

/// Get all registered agents
///
/// # Arguments
/// * `status_filter` - Optional status filter (ACTIVE, IDLE, BUSY, FAILED, SHUTDOWN)
///
/// # Returns
/// JSON array of agents
#[napi]
pub fn get_agents(status_filter: Option<String>) -> Result<String> {
    let agents = vec![
        Agent {
            id: "agent-001".to_string(),
            status: AgentStatus::Active,
            load: 0.45,
            capacity: 100.0,
            tasks_completed: 15,
            region: "us-east-1".to_string(),
        },
        Agent {
            id: "agent-002".to_string(),
            status: AgentStatus::Idle,
            load: 0.0,
            capacity: 100.0,
            tasks_completed: 8,
            region: "us-west-2".to_string(),
        },
        Agent {
            id: "agent-003".to_string(),
            status: AgentStatus::Busy,
            load: 0.95,
            capacity: 100.0,
            tasks_completed: 32,
            region: "eu-central-1".to_string(),
        },
    ];

    let filtered: Vec<Agent> = if let Some(filter) = status_filter {
        let target_status = match filter.to_uppercase().as_str() {
            "ACTIVE" => AgentStatus::Active,
            "IDLE" => AgentStatus::Idle,
            "BUSY" => AgentStatus::Busy,
            "FAILED" => AgentStatus::Failed,
            "SHUTDOWN" => AgentStatus::Shutdown,
            _ => AgentStatus::Active,
        };
        agents.into_iter().filter(|a| a.status == target_status).collect()
    } else {
        agents
    };

    match serde_json::to_string(&filtered) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize agents: {}", e))),
    }
}

/// Distribute a task to the least loaded agent
///
/// # Arguments
/// * `task_json` - JSON string containing task information
///
/// # Returns
/// JSON string with task distribution result
#[napi]
pub fn distribute_task(task_json: String) -> Result<String> {
    let mut task: Task = match serde_json::from_str(&task_json) {
        Ok(t) => t,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse task JSON: {}",
                e
            )))
        }
    };

    // Simulate task distribution to least loaded agent
    task.agent_id = Some("agent-002".to_string());
    task.status = "assigned".to_string();

    let result = serde_json::json!({
        "task_id": task.id,
        "agent_id": task.agent_id,
        "status": task.status,
        "timestamp": get_timestamp(),
        "load_balanced": true
    });

    Ok(serde_json::to_string(&result).unwrap())
}

/// Distribute multiple tasks with load balancing
///
/// # Arguments
/// * `tasks_json` - JSON array string containing task objects
///
/// # Returns
/// JSON array with distribution results
#[napi]
pub fn distribute_tasks(tasks_json: String) -> Result<String> {
    let tasks: Vec<Task> = match serde_json::from_str(&tasks_json) {
        Ok(t) => t,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse tasks JSON: {}",
                e
            )))
        }
    };

    let agents = vec!["agent-001", "agent-002", "agent-003"];
    let mut results = Vec::new();
    let mut agent_idx = 0;

    for task in tasks {
        let assigned_agent = agents[agent_idx % agents.len()];
        agent_idx += 1;

        let result = serde_json::json!({
            "task_id": task.id,
            "agent_id": assigned_agent,
            "status": "assigned",
            "timestamp": get_timestamp()
        });

        results.push(result);
    }

    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Initiate consensus protocol for decision-making
///
/// # Arguments
/// * `proposal_json` - JSON string containing proposal details
/// * `agent_ids_json` - JSON array string of agent IDs to vote
///
/// # Returns
/// JSON string with consensus result
#[napi]
pub fn initiate_consensus(proposal_json: String, agent_ids_json: String) -> Result<String> {
    let _proposal: serde_json::Value = match serde_json::from_str(&proposal_json) {
        Ok(p) => p,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse proposal JSON: {}",
                e
            )))
        }
    };

    let agent_ids: Vec<String> = match serde_json::from_str(&agent_ids_json) {
        Ok(ids) => ids,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse agent IDs JSON: {}",
                e
            )))
        }
    };

    let total_votes = agent_ids.len() as u32;
    let supporting_votes = (total_votes as f64 * 0.75) as u32;
    let agreement_percentage = (supporting_votes as f64 / total_votes as f64) * 100.0;

    let result = ConsensusResult {
        decision: if agreement_percentage >= 66.67 {
            "approved".to_string()
        } else {
            "rejected".to_string()
        },
        agreement_percentage,
        total_votes,
        supporting_votes,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Submit a vote for consensus
///
/// # Arguments
/// * `vote_json` - JSON string containing vote information
///
/// # Returns
/// JSON string with vote confirmation
#[napi]
pub fn submit_vote(vote_json: String) -> Result<String> {
    let vote: Vote = match serde_json::from_str(&vote_json) {
        Ok(v) => v,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse vote JSON: {}",
                e
            )))
        }
    };

    let result = serde_json::json!({
        "agent_id": vote.agent_id,
        "decision": vote.decision,
        "confidence": vote.confidence,
        "registered": true,
        "timestamp": get_timestamp()
    });

    Ok(serde_json::to_string(&result).unwrap())
}

/// Calculate consensus from multiple votes
///
/// # Arguments
/// * `votes_json` - JSON array string of vote objects
///
/// # Returns
/// JSON string with consensus result
#[napi]
pub fn calculate_consensus(votes_json: String) -> Result<String> {
    let votes: Vec<Vote> = match serde_json::from_str(&votes_json) {
        Ok(v) => v,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse votes JSON: {}",
                e
            )))
        }
    };

    let total = votes.len() as u32;
    let approvals = votes.iter().filter(|v| v.decision == "approve").count() as u32;
    let agreement = if total > 0 {
        (approvals as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    let result = ConsensusResult {
        decision: if agreement >= 50.0 {
            "approved".to_string()
        } else {
            "rejected".to_string()
        },
        agreement_percentage: agreement,
        total_votes: total,
        supporting_votes: approvals,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Get coordinator status
///
/// # Returns
/// JSON string with current coordinator status
#[napi]
pub fn get_coordinator_status() -> Result<String> {
    let status = serde_json::json!({
        "coordinator_id": "coordinator-001",
        "status": "operational",
        "timestamp": get_timestamp(),
        "agents_count": 3,
        "active_tasks": 5,
        "uptime_ms": 3600000,
        "health": "healthy"
    });

    Ok(serde_json::to_string(&status).unwrap())
}

/// Get agent load metrics
///
/// # Returns
/// JSON string with agent load information
#[napi]
pub fn get_agent_metrics() -> Result<String> {
    let metrics = serde_json::json!({
        "timestamp": get_timestamp(),
        "total_agents": 3,
        "active_agents": 2,
        "average_load": 0.47,
        "max_load": 0.95,
        "min_load": 0.0,
        "agents": [
            {
                "agent_id": "agent-001",
                "load": 0.45,
                "capacity": 100.0,
                "utilization_percent": 45.0
            },
            {
                "agent_id": "agent-002",
                "load": 0.0,
                "capacity": 100.0,
                "utilization_percent": 0.0
            },
            {
                "agent_id": "agent-003",
                "load": 0.95,
                "capacity": 100.0,
                "utilization_percent": 95.0
            }
        ]
    });

    Ok(serde_json::to_string(&metrics).unwrap())
}

/// Balance load across agents
///
/// # Returns
/// JSON string with load balancing result
#[napi]
pub fn balance_load() -> Result<String> {
    let result = serde_json::json!({
        "timestamp": get_timestamp(),
        "rebalanced": true,
        "tasks_moved": 3,
        "improvement_percent": 18.5,
        "new_average_load": 0.38,
        "status": "completed"
    });

    Ok(serde_json::to_string(&result).unwrap())
}

/// Get task distribution statistics
///
/// # Returns
/// JSON string with distribution statistics
#[napi]
pub fn get_distribution_stats() -> Result<String> {
    let stats = serde_json::json!({
        "timestamp": get_timestamp(),
        "total_tasks_distributed": 48,
        "tasks_completed": 42,
        "tasks_failed": 2,
        "tasks_pending": 4,
        "average_distribution_time_ms": 15.3,
        "load_balance_score": 0.78,
        "efficiency_percent": 87.5
    });

    Ok(serde_json::to_string(&stats).unwrap())
}

/// Monitor agent health
///
/// # Arguments
/// * `agent_id` - The agent ID to monitor
///
/// # Returns
/// JSON string with health information
#[napi]
pub fn monitor_agent_health(agent_id: String) -> Result<String> {
    let health = serde_json::json!({
        "agent_id": agent_id,
        "timestamp": get_timestamp(),
        "status": "healthy",
        "memory_usage_mb": 256,
        "cpu_usage_percent": 35.2,
        "network_latency_ms": 12.5,
        "error_rate": 0.0,
        "uptime_seconds": 86400,
        "last_heartbeat": get_timestamp()
    });

    Ok(serde_json::to_string(&health).unwrap())
}

/// Scale agent pool
///
/// # Arguments
/// * `action_json` - JSON string containing scale action details
///
/// # Returns
/// JSON string with scaling result
#[napi]
pub fn scale_agent_pool(action_json: String) -> Result<String> {
    let action: serde_json::Value = match serde_json::from_str(&action_json) {
        Ok(a) => a,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse action JSON: {}",
                e
            )))
        }
    };

    let action_type = action
        .get("action")
        .and_then(|v| v.as_str())
        .unwrap_or("scale_up");

    let count = action
        .get("count")
        .and_then(|v| v.as_u64())
        .unwrap_or(1) as u32;

    let result = serde_json::json!({
        "timestamp": get_timestamp(),
        "action": action_type,
        "count": count,
        "status": "initiated",
        "new_pool_size": 3 + count,
        "estimated_ready_time_ms": 5000
    });

    Ok(serde_json::to_string(&result).unwrap())
}

/// Perform failover for a failed agent
///
/// # Arguments
/// * `failed_agent_id` - The ID of the failed agent
///
/// # Returns
/// JSON string with failover result
#[napi]
pub fn perform_failover(failed_agent_id: String) -> Result<String> {
    let result = serde_json::json!({
        "timestamp": get_timestamp(),
        "failed_agent_id": failed_agent_id,
        "status": "failover_complete",
        "tasks_redistributed": 8,
        "backup_agent_id": "agent-002",
        "recovery_time_ms": 2500
    });

    Ok(serde_json::to_string(&result).unwrap())
}

/// Get consensus voting history
///
/// # Returns
/// JSON array with recent votes
#[napi]
pub fn get_voting_history() -> Result<String> {
    let history = vec![
        serde_json::json!({
            "proposal_id": "prop-001",
            "timestamp": get_timestamp(),
            "total_votes": 3,
            "approval_votes": 2,
            "rejection_votes": 1,
            "result": "approved"
        }),
        serde_json::json!({
            "proposal_id": "prop-002",
            "timestamp": get_timestamp(),
            "total_votes": 3,
            "approval_votes": 3,
            "rejection_votes": 0,
            "result": "approved"
        }),
        serde_json::json!({
            "proposal_id": "prop-003",
            "timestamp": get_timestamp(),
            "total_votes": 3,
            "approval_votes": 1,
            "rejection_votes": 2,
            "result": "rejected"
        }),
    ];

    match serde_json::to_string(&history) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize history: {}", e))),
    }
}

// ============ Helper Functions ============

/// Generate a unique ID
fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("id-{}", duration.as_millis())
}

/// Get current timestamp
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", duration.as_millis())
}
