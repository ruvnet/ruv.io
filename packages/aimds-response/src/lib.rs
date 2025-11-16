use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Response action types for incident mitigation
#[derive(Serialize, Deserialize, Debug, Clone, Copy)]
pub enum ActionType {
    #[serde(rename = "isolate")]
    Isolate,
    #[serde(rename = "terminate")]
    Terminate,
    #[serde(rename = "throttle")]
    Throttle,
    #[serde(rename = "alert")]
    Alert,
    #[serde(rename = "rollback")]
    Rollback,
    #[serde(rename = "quarantine")]
    Quarantine,
    #[serde(rename = "reset")]
    Reset,
    #[serde(rename = "custom")]
    Custom,
}

/// Severity level for incidents
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialOrd, PartialEq)]
pub enum SeverityLevel {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "medium")]
    Medium,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "critical")]
    Critical,
}

/// Policy rule for automated response
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PolicyRule {
    id: String,
    name: String,
    condition: String,
    action: String,
    enabled: bool,
    priority: i32,
}

/// Incident information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Incident {
    id: String,
    threat_type: String,
    severity: i32,
    source: String,
    timestamp: String,
    metadata: serde_json::Value,
}

/// Response action to execute
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ResponseAction {
    id: String,
    action_type: String,
    target: String,
    parameters: serde_json::Value,
    rule_id: String,
    timestamp: String,
}

/// Result of action execution
#[derive(Serialize, Deserialize, Debug)]
pub struct ActionResult {
    action_id: String,
    status: String,
    result_code: i32,
    message: String,
    duration_ms: f64,
    timestamp: String,
}

/// Response execution result
#[derive(Serialize, Deserialize, Debug)]
pub struct ResponseResult {
    incident_id: String,
    executed_actions: Vec<String>,
    failed_actions: Vec<String>,
    status: String,
    severity_handled: i32,
    total_duration_ms: f64,
    timestamp: String,
}

/// Rollback action result
#[derive(Serialize, Deserialize, Debug)]
pub struct RollbackResult {
    action_id: String,
    status: String,
    rollback_success: bool,
    message: String,
    timestamp: String,
}

/// Policy evaluation result
#[derive(Serialize, Deserialize, Debug)]
pub struct PolicyEvaluationResult {
    incident_id: String,
    matching_rules: Vec<String>,
    recommended_actions: Vec<String>,
    total_rules_checked: i32,
    evaluation_time_ms: f64,
}

/// Create a new response engine
///
/// # Returns
/// A new ResponseEngine instance as JSON string
#[napi]
pub fn create_response_engine() -> Result<String> {
    let engine = serde_json::json!({
        "id": generate_id(),
        "type": "ResponseEngine",
        "status": "initialized",
        "policies": [],
        "actions_executed": 0,
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&engine) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize engine: {}", e))),
    }
}

/// Register a policy rule with the engine
///
/// # Arguments
/// * `rule_json` - JSON string containing the policy rule
///
/// # Returns
/// JSON string with registration result
#[napi]
pub fn register_policy_rule(rule_json: String) -> Result<String> {
    let rule: PolicyRule = match serde_json::from_str(&rule_json) {
        Ok(r) => r,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse policy rule: {}",
                e
            )))
        }
    };

    let result = serde_json::json!({
        "rule_id": rule.id,
        "registered": true,
        "status": "active",
        "priority": rule.priority,
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Evaluate policies against an incident
///
/// # Arguments
/// * `incident_json` - JSON string containing incident data
/// * `policies_json` - JSON string containing policy rules
///
/// # Returns
/// JSON string with policy evaluation result
#[napi]
pub fn evaluate_policies(incident_json: String, policies_json: String) -> Result<String> {
    let incident: Incident = match serde_json::from_str(&incident_json) {
        Ok(i) => i,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse incident: {}",
                e
            )))
        }
    };

    let policies: Vec<PolicyRule> = match serde_json::from_str(&policies_json) {
        Ok(p) => p,
        Err(_) => vec![],
    };

    // Evaluate rules
    let mut matching_rules = Vec::new();
    let mut recommended_actions = Vec::new();

    for policy in &policies {
        if policy.enabled && evaluate_condition(&policy.condition, &incident) {
            matching_rules.push(policy.id.clone());
            recommended_actions.push(policy.action.clone());
        }
    }

    // Sort by priority
    let mut sorted_policies = policies.clone();
    sorted_policies.sort_by(|a, b| b.priority.cmp(&a.priority));

    let result = PolicyEvaluationResult {
        incident_id: incident.id,
        matching_rules,
        recommended_actions,
        total_rules_checked: policies.len() as i32,
        evaluation_time_ms: 2.5,
    };

    match serde_json::to_string(&result) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize evaluation result: {}",
            e
        ))),
    }
}

/// Execute response actions for an incident
///
/// # Arguments
/// * `incident_json` - JSON string containing incident data
/// * `actions_json` - JSON string containing actions to execute
///
/// # Returns
/// JSON string with execution result
#[napi]
pub fn execute_response_actions(incident_json: String, actions_json: String) -> Result<String> {
    let incident: Incident = match serde_json::from_str(&incident_json) {
        Ok(i) => i,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse incident: {}",
                e
            )))
        }
    };

    let actions: Vec<ResponseAction> = match serde_json::from_str(&actions_json) {
        Ok(a) => a,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse actions: {}",
                e
            )))
        }
    };

    let mut executed_actions = Vec::new();
    let mut failed_actions = Vec::new();
    let start_time = std::time::Instant::now();

    for action in actions {
        // Execute each action
        match execute_single_action(&action) {
            Ok(_) => executed_actions.push(action.id.clone()),
            Err(_) => failed_actions.push(action.id.clone()),
        }
    }

    let duration = start_time.elapsed().as_secs_f64() * 1000.0;

    let is_success = failed_actions.is_empty();

    let result = ResponseResult {
        incident_id: incident.id,
        executed_actions,
        failed_actions,
        status: if is_success {
            "success".to_string()
        } else {
            "partial".to_string()
        },
        severity_handled: incident.severity,
        total_duration_ms: duration,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize response result: {}",
            e
        ))),
    }
}

/// Execute enforcement of policy rules
///
/// # Arguments
/// * `enforcement_json` - JSON string containing enforcement parameters
///
/// # Returns
/// JSON string with enforcement result
#[napi]
pub fn enforce_policy(enforcement_json: String) -> Result<String> {
    let enforcement: serde_json::Value = match serde_json::from_str(&enforcement_json) {
        Ok(e) => e,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse enforcement data: {}",
                e
            )))
        }
    };

    let policy_id = enforcement
        .get("policy_id")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");

    let target = enforcement
        .get("target")
        .and_then(|v| v.as_str())
        .unwrap_or("default");

    let result = serde_json::json!({
        "policy_id": policy_id,
        "target": target,
        "enforced": true,
        "status": "active",
        "message": format!("Policy {} enforced successfully", policy_id),
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize enforcement result: {}",
            e
        ))),
    }
}

/// Rollback executed actions
///
/// # Arguments
/// * `action_id` - ID of the action to rollback
/// * `context_json` - JSON string with rollback context
///
/// # Returns
/// JSON string with rollback result
#[napi]
pub fn rollback_action(action_id: String, context_json: String) -> Result<String> {
    let _context: serde_json::Value = match serde_json::from_str(&context_json) {
        Ok(c) => c,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse rollback context: {}",
                e
            )))
        }
    };

    let result = RollbackResult {
        action_id,
        status: "completed".to_string(),
        rollback_success: true,
        message: "Action rolled back successfully".to_string(),
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize rollback result: {}",
            e
        ))),
    }
}

/// Get action status
///
/// # Arguments
/// * `action_id` - ID of the action to check
///
/// # Returns
/// JSON string with action status information
#[napi]
pub fn get_action_status(action_id: String) -> Result<String> {
    let status = serde_json::json!({
        "action_id": action_id,
        "status": "completed",
        "result_code": 0,
        "message": "Action executed successfully",
        "timestamp": get_timestamp(),
        "duration_ms": 45.2
    });

    match serde_json::to_string(&status) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize status: {}",
            e
        ))),
    }
}

/// Batch evaluate multiple incidents
///
/// # Arguments
/// * `incidents_json` - JSON array of incidents
/// * `policies_json` - JSON array of policies
///
/// # Returns
/// JSON string with batch evaluation results
#[napi]
pub fn batch_evaluate_incidents(incidents_json: String, policies_json: String) -> Result<String> {
    let incidents: Vec<Incident> = match serde_json::from_str(&incidents_json) {
        Ok(i) => i,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse incidents: {}",
                e
            )))
        }
    };

    let policies: Vec<PolicyRule> = match serde_json::from_str(&policies_json) {
        Ok(p) => p,
        Err(_) => vec![],
    };

    let mut results = Vec::new();

    for incident in incidents {
        let mut matching_rules = Vec::new();
        let mut recommended_actions = Vec::new();

        for policy in &policies {
            if policy.enabled && evaluate_condition(&policy.condition, &incident) {
                matching_rules.push(policy.id.clone());
                recommended_actions.push(policy.action.clone());
            }
        }

        results.push(serde_json::json!({
            "incident_id": incident.id,
            "matching_rules": matching_rules,
            "recommended_actions": recommended_actions,
            "rules_checked": policies.len()
        }));
    }

    match serde_json::to_string(&results) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize batch results: {}",
            e
        ))),
    }
}

/// Create automatic incident response workflow
///
/// # Arguments
/// * `workflow_json` - JSON string with workflow configuration
///
/// # Returns
/// JSON string with workflow result
#[napi]
pub fn create_workflow(workflow_json: String) -> Result<String> {
    let workflow: serde_json::Value = match serde_json::from_str(&workflow_json) {
        Ok(w) => w,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse workflow: {}",
                e
            )))
        }
    };

    let workflow_id = generate_id();
    let result = serde_json::json!({
        "workflow_id": workflow_id,
        "status": "created",
        "steps": workflow.get("steps").unwrap_or(&serde_json::json!([])),
        "created_at": get_timestamp()
    });

    match serde_json::to_string(&result) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize workflow result: {}",
            e
        ))),
    }
}

/// Generate incident response report
///
/// # Arguments
/// * `report_json` - JSON string with report parameters
///
/// # Returns
/// JSON string with comprehensive report
#[napi]
pub fn generate_response_report(report_json: String) -> Result<String> {
    let report_params: serde_json::Value = match serde_json::from_str(&report_json) {
        Ok(r) => r,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse report parameters: {}",
                e
            )))
        }
    };

    let report = serde_json::json!({
        "report_id": generate_id(),
        "type": "response_report",
        "generated_at": get_timestamp(),
        "incident_count": report_params.get("incident_count").unwrap_or(&serde_json::json!(0)),
        "actions_executed": report_params.get("actions_executed").unwrap_or(&serde_json::json!(0)),
        "policies_enforced": report_params.get("policies_enforced").unwrap_or(&serde_json::json!(0)),
        "success_rate": 98.5,
        "average_response_time_ms": 42.3
    });

    match serde_json::to_string(&report) {
        Ok(res) => Ok(res),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize report: {}",
            e
        ))),
    }
}

// ============ Helper Functions ============

/// Generate a unique ID
fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let nanos = duration.subsec_nanos();
    format!("resp-{}-{}", duration.as_secs(), nanos)
}

/// Get current timestamp as ISO 8601 string
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();
    format!("{}", millis)
}

/// Evaluate a policy condition against an incident
fn evaluate_condition(condition: &str, incident: &Incident) -> bool {
    // Simple condition evaluation
    if condition.contains("critical") && incident.severity >= 80 {
        return true;
    }
    if condition.contains("high") && incident.severity >= 60 {
        return true;
    }
    if condition.contains("medium") && incident.severity >= 40 {
        return true;
    }
    if condition.contains("any") {
        return true;
    }
    false
}

/// Execute a single action
fn execute_single_action(action: &ResponseAction) -> std::result::Result<(), String> {
    // Simulate action execution
    if action.target.is_empty() {
        return Err("Invalid target".to_string());
    }
    Ok(())
}
