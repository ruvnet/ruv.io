use napi::{Error, Result};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// Configuration for the nanosecond scheduler
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SchedulerConfig {
    timeout: Option<u32>,
    retries: Option<u32>,
    max_concurrency: Option<u32>,
    log_level: Option<String>,
}

/// A scheduled task with timing information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Task {
    id: String,
    data: String,
    priority: Option<u32>,
    scheduled_at: Option<u64>,
}

/// Result of task execution
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TaskResult {
    task_id: String,
    status: String,
    result_data: String,
    executed_at: u64,
    duration_ns: u64,
    success: bool,
}

/// Batch execution statistics
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExecutionStats {
    total_tasks: usize,
    successful_tasks: usize,
    failed_tasks: usize,
    total_duration_ns: u64,
    average_latency_ns: u64,
    min_latency_ns: u64,
    max_latency_ns: u64,
}

/// Process a single task
///
/// # Arguments
/// * `task_json` - JSON string containing task data
///
/// # Returns
/// JSON string with task result
#[napi]
pub fn process_task(task_json: String) -> Result<String> {
    // Parse input JSON
    let task: Task = match serde_json::from_str(&task_json) {
        Ok(t) => t,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse task JSON: {}",
                e
            )))
        }
    };

    let start_time = get_nanosecond_timestamp();
    let executed_at = get_millisecond_timestamp();

    // Process the task
    let processed_data = process_data(&task.data);

    let end_time = get_nanosecond_timestamp();
    let duration_ns = end_time - start_time;

    let result = TaskResult {
        task_id: task.id,
        status: "completed".to_string(),
        result_data: processed_data,
        executed_at,
        duration_ns,
        success: true,
    };

    // Convert to JSON and return
    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Schedule multiple tasks and execute them
///
/// # Arguments
/// * `tasks_json` - JSON array string containing task objects
///
/// # Returns
/// JSON array string with execution results
#[napi]
pub fn schedule_tasks(tasks_json: String) -> Result<String> {
    // Parse input JSON array
    let tasks: Vec<Task> = match serde_json::from_str(&tasks_json) {
        Ok(t) => t,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse tasks JSON: {}",
                e
            )))
        }
    };

    let mut results: Vec<TaskResult> = Vec::new();

    for task in tasks {
        let start_time = get_nanosecond_timestamp();
        let executed_at = get_millisecond_timestamp();

        let processed_data = process_data(&task.data);

        let end_time = get_nanosecond_timestamp();
        let duration_ns = end_time - start_time;

        results.push(TaskResult {
            task_id: task.id,
            status: "completed".to_string(),
            result_data: processed_data,
            executed_at,
            duration_ns,
            success: true,
        });
    }

    // Convert to JSON and return
    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Get execution statistics for a batch
///
/// # Arguments
/// * `tasks_json` - JSON array string containing task objects
///
/// # Returns
/// JSON string with execution statistics
#[napi]
pub fn get_execution_stats(tasks_json: String) -> Result<String> {
    // Parse input JSON array
    let tasks: Vec<Task> = match serde_json::from_str(&tasks_json) {
        Ok(t) => t,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse tasks JSON: {}",
                e
            )))
        }
    };

    let total_tasks = tasks.len();
    let mut latencies: Vec<u64> = Vec::new();
    let mut total_duration_ns: u64 = 0;

    for task in tasks {
        let start_time = get_nanosecond_timestamp();
        let _ = process_data(&task.data);
        let end_time = get_nanosecond_timestamp();
        let duration_ns = end_time - start_time;
        latencies.push(duration_ns);
        total_duration_ns += duration_ns;
    }

    let min_latency_ns = *latencies.iter().min().unwrap_or(&0);
    let max_latency_ns = *latencies.iter().max().unwrap_or(&0);
    let average_latency_ns = if total_tasks > 0 {
        total_duration_ns / total_tasks as u64
    } else {
        0
    };

    let stats = ExecutionStats {
        total_tasks,
        successful_tasks: total_tasks,
        failed_tasks: 0,
        total_duration_ns,
        average_latency_ns,
        min_latency_ns,
        max_latency_ns,
    };

    // Convert to JSON and return
    match serde_json::to_string(&stats) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize stats: {}", e))),
    }
}

/// Create a configuration object
///
/// # Arguments
/// * `config_json` - JSON string containing configuration options
///
/// # Returns
/// JSON string with validated configuration
#[napi]
pub fn create_config(config_json: String) -> Result<String> {
    // Parse configuration
    let config: SchedulerConfig = match serde_json::from_str(&config_json) {
        Ok(c) => c,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config JSON: {}",
                e
            )))
        }
    };

    // Validate and set defaults
    let validated_config = SchedulerConfig {
        timeout: config.timeout.or(Some(5000)),
        retries: config.retries.or(Some(3)),
        max_concurrency: config.max_concurrency.or(Some(10)),
        log_level: config.log_level.or_else(|| Some("info".to_string())),
    };

    // Convert to JSON and return
    match serde_json::to_string(&validated_config) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize config: {}", e))),
    }
}

/// Calculate the latency of a task
///
/// # Arguments
/// * `task_json` - JSON string containing task data
/// * `iterations` - Number of iterations to measure
///
/// # Returns
/// Latency in nanoseconds as a JSON object
#[napi]
pub fn measure_latency(task_json: String, iterations: i32) -> Result<String> {
    let task: Task = serde_json::from_str(&task_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse task: {}", e)))?;

    let iter_count = iterations.max(1) as usize;
    let start_time = get_nanosecond_timestamp();

    for _ in 0..iter_count {
        let _ = process_data(&task.data);
    }

    let end_time = get_nanosecond_timestamp();
    let total_duration_ns = end_time - start_time;
    let average_latency_ns = total_duration_ns / iter_count as u64;

    // Return as JSON object with latency
    let result = serde_json::json!({
        "latency_ns": average_latency_ns,
        "total_duration_ns": total_duration_ns,
        "iterations": iter_count
    });

    Ok(result.to_string())
}

/// Process a task with retry logic
///
/// # Arguments
/// * `task_json` - JSON string containing task data
/// * `max_retries` - Maximum number of retries
///
/// # Returns
/// JSON string with task result
#[napi]
pub fn process_task_with_retries(task_json: String, max_retries: i32) -> Result<String> {
    let task: Task = serde_json::from_str(&task_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse task: {}", e)))?;

    let max_retries = max_retries.max(1) as usize;
    let mut last_error: Option<String> = None;

    for attempt in 0..max_retries {
        let start_time = get_nanosecond_timestamp();
        let executed_at = get_millisecond_timestamp();

        match std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            process_data(&task.data)
        })) {
            Ok(result) => {
                let end_time = get_nanosecond_timestamp();
                let duration_ns = end_time - start_time;

                let task_result = TaskResult {
                    task_id: task.id.clone(),
                    status: "completed".to_string(),
                    result_data: result,
                    executed_at,
                    duration_ns,
                    success: true,
                };

                return match serde_json::to_string(&task_result) {
                    Ok(result) => Ok(result),
                    Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
                };
            }
            Err(_) => {
                last_error = Some(format!("Attempt {} failed", attempt + 1));
                if attempt == max_retries - 1 {
                    break;
                }
            }
        }
    }

    Err(Error::from_reason(format!(
        "Task failed after {} retries: {}",
        max_retries,
        last_error.unwrap_or_else(|| "unknown error".to_string())
    )))
}

// ============ Helper Functions ============

/// Process data (basic processing)
fn process_data(data: &str) -> String {
    // Simple transformation: reverse and uppercase
    let reversed = data.chars().rev().collect::<String>();
    reversed.to_uppercase()
}

/// Get current time in milliseconds since epoch
fn get_millisecond_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Get current time in nanoseconds since epoch (using system time with precision)
fn get_nanosecond_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as u64
}
