use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

/// Task configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TaskConfig {
    id: String,
    priority: Option<u32>,
    max_retries: Option<u32>,
    timeout_ms: Option<u32>,
}

/// Scheduled task
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ScheduledTask {
    id: String,
    priority: u32,
    max_retries: u32,
    timeout_ms: u32,
    created_at: u64,
    scheduled_at: u64,
}

/// Task execution result
#[derive(Serialize, Deserialize, Debug)]
struct ExecutionResult {
    id: String,
    status: String,
    output_size: usize,
    execution_time_ms: u64,
    retries: u32,
    timestamp: u64,
}

/// Scheduler statistics
#[derive(Serialize, Deserialize, Debug)]
struct SchedulerStats {
    total_tasks: usize,
    queued_tasks: usize,
    completed_tasks: usize,
    failed_tasks: usize,
    average_latency_ms: f64,
    uptime_ms: u64,
}

/// Configuration object for the scheduler
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    timeout_ms: Option<u32>,
    retries: Option<u32>,
    log_level: Option<String>,
    max_concurrency: Option<u32>,
}

/// Internal scheduler state
struct SchedulerState {
    task_queue: VecDeque<ScheduledTask>,
    completed_tasks: Vec<ScheduledTask>,
    failed_tasks: Vec<ScheduledTask>,
    total_execution_time: u64,
    task_count: usize,
    created_at: u64,
}

impl Default for SchedulerState {
    fn default() -> Self {
        Self {
            task_queue: VecDeque::new(),
            completed_tasks: Vec::new(),
            failed_tasks: Vec::new(),
            total_execution_time: 0,
            task_count: 0,
            created_at: current_timestamp(),
        }
    }
}

/// Main scheduler struct
#[napi]
pub struct MidstreamerScheduler {
    state: Arc<Mutex<SchedulerState>>,
    config: Arc<Config>,
}

#[napi]
impl MidstreamerScheduler {
    /// Create a new scheduler instance
    #[napi(constructor)]
    pub fn new(config_json: Option<String>) -> Result<Self> {
        let config = if let Some(json) = config_json {
            match serde_json::from_str::<Config>(&json) {
                Ok(c) => c,
                Err(e) => {
                    return Err(Error::from_reason(format!(
                        "Failed to parse config: {}",
                        e
                    )))
                }
            }
        } else {
            Config {
                timeout_ms: Some(5000),
                retries: Some(3),
                log_level: Some("info".to_string()),
                max_concurrency: Some(10),
            }
        };

        Ok(MidstreamerScheduler {
            state: Arc::new(Mutex::new(SchedulerState::default())),
            config: Arc::new(config),
        })
    }

    /// Process data synchronously
    ///
    /// # Arguments
    /// * `data_b64` - Input buffer as base64 encoded string
    ///
    /// # Returns
    /// Processed buffer as base64 encoded string
    #[napi]
    pub fn process_sync(&self, data_b64: String) -> Result<String> {
        let input = base64_decode(&data_b64)?;
        let output = process_buffer(&input)?;
        // Return as base64 encoded string
        Ok(base64_encode(&output))
    }

    /// Schedule a task
    ///
    /// # Arguments
    /// * `config_json` - Task configuration as JSON string
    ///
    /// # Returns
    /// Task ID
    #[napi]
    pub fn schedule_task(&self, config_json: String) -> Result<String> {
        let task_config: TaskConfig = match serde_json::from_str(&config_json) {
            Ok(tc) => tc,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse task config: {}",
                    e
                )))
            }
        };

        let now = current_timestamp();
        let task = ScheduledTask {
            id: task_config.id.clone(),
            priority: task_config.priority.unwrap_or(0),
            max_retries: task_config.max_retries.unwrap_or(3),
            timeout_ms: task_config.timeout_ms.unwrap_or(5000),
            created_at: now,
            scheduled_at: now,
        };

        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire scheduler state lock")
        })?;

        state.task_queue.push_back(task);
        state.task_count += 1;

        Ok(task_config.id)
    }

    /// Get next task from queue
    ///
    /// # Returns
    /// Next scheduled task as JSON string, or null if queue is empty
    #[napi]
    pub fn next_task(&self) -> Result<Option<String>> {
        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire scheduler state lock")
        })?;

        if let Some(task) = state.task_queue.pop_front() {
            match serde_json::to_string(&task) {
                Ok(json) => Ok(Some(json)),
                Err(e) => Err(Error::from_reason(format!(
                    "Failed to serialize task: {}",
                    e
                ))),
            }
        } else {
            Ok(None)
        }
    }

    /// Get queue size
    ///
    /// # Returns
    /// Current number of tasks in queue
    #[napi]
    pub fn queue_size(&self) -> Result<u32> {
        let state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire scheduler state lock")
        })?;

        Ok(state.task_queue.len() as u32)
    }

    /// Mark task as completed
    ///
    /// # Arguments
    /// * `task_json` - Completed task as JSON string
    /// * `output_size` - Size of task output
    ///
    /// # Returns
    /// Execution result as JSON string
    #[napi]
    pub fn complete_task(
        &self,
        task_json: String,
        output_size: u32,
        execution_time_ms: u32,
    ) -> Result<String> {
        let task: ScheduledTask = match serde_json::from_str(&task_json) {
            Ok(t) => t,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse task: {}",
                    e
                )))
            }
        };

        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire scheduler state lock")
        })?;

        state.completed_tasks.push(task.clone());
        state.total_execution_time += execution_time_ms as u64;

        let result = ExecutionResult {
            id: task.id,
            status: "completed".to_string(),
            output_size: output_size as usize,
            execution_time_ms: execution_time_ms as u64,
            retries: 0,
            timestamp: current_timestamp(),
        };

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize result: {}",
                e
            ))),
        }
    }

    /// Mark task as failed
    ///
    /// # Arguments
    /// * `task_id` - Task ID
    /// * `error_message` - Error message
    ///
    /// # Returns
    /// Retry decision as JSON string
    #[napi]
    pub fn fail_task(&self, task_id: String, error_message: String) -> Result<String> {
        let _state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire scheduler state lock")
        })?;

        let result = serde_json::json!({
            "id": task_id,
            "status": "failed",
            "error": error_message,
            "timestamp": current_timestamp(),
            "should_retry": true
        });

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize result: {}",
                e
            ))),
        }
    }

    /// Get scheduler statistics
    ///
    /// # Returns
    /// Statistics as JSON string
    #[napi]
    pub fn get_stats(&self) -> Result<String> {
        let state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire scheduler state lock")
        })?;

        let total_completed = state.completed_tasks.len();
        let average_latency = if total_completed > 0 {
            state.total_execution_time as f64 / total_completed as f64
        } else {
            0.0
        };

        let uptime = current_timestamp().saturating_sub(state.created_at);

        let stats = SchedulerStats {
            total_tasks: state.task_count,
            queued_tasks: state.task_queue.len(),
            completed_tasks: state.completed_tasks.len(),
            failed_tasks: state.failed_tasks.len(),
            average_latency_ms: average_latency,
            uptime_ms: uptime,
        };

        match serde_json::to_string(&stats) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize stats: {}",
                e
            ))),
        }
    }

    /// Clear all queues and reset statistics
    ///
    /// # Returns
    /// OK result
    #[napi]
    pub fn reset(&self) -> Result<()> {
        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire scheduler state lock")
        })?;

        state.task_queue.clear();
        state.completed_tasks.clear();
        state.failed_tasks.clear();
        state.total_execution_time = 0;
        state.task_count = 0;
        state.created_at = current_timestamp();

        Ok(())
    }

    /// Process batch of tasks (simulated)
    ///
    /// # Arguments
    /// * `count` - Number of tasks to simulate
    ///
    /// # Returns
    /// Batch result as JSON string
    #[napi]
    pub fn process_batch(&self, count: u32) -> Result<String> {
        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire scheduler state lock")
        })?;

        let mut processed = 0;
        while processed < count && !state.task_queue.is_empty() {
            if let Some(task) = state.task_queue.pop_front() {
                state.completed_tasks.push(task);
                processed += 1;
            }
        }

        let result = serde_json::json!({
            "processed": processed,
            "remaining": state.task_queue.len(),
            "total_completed": state.completed_tasks.len(),
            "timestamp": current_timestamp()
        });

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize batch result: {}",
                e
            ))),
        }
    }
}

// ============ Helper Functions ============

/// Process buffer data
fn process_buffer(input: &[u8]) -> Result<Vec<u8>> {
    // Simulate processing: add a simple transformation
    let mut output = Vec::with_capacity(input.len());

    for &byte in input {
        // Simple XOR transformation for demonstration
        output.push(byte ^ 0x5A);
    }

    Ok(output)
}

/// Get current timestamp in milliseconds
fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Estimate latency for a task
fn estimate_latency(task: &ScheduledTask) -> u64 {
    // Simple estimation based on priority
    1000 / (task.priority + 1).max(1) as u64
}

/// Simple base64 encoding
fn base64_encode(data: &[u8]) -> String {
    const TABLE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();

    for chunk in data.chunks(3) {
        let b1 = chunk[0];
        let b2 = chunk.get(1).copied().unwrap_or(0);
        let b3 = chunk.get(2).copied().unwrap_or(0);

        let n = ((b1 as u32) << 16) | ((b2 as u32) << 8) | (b3 as u32);

        result.push(TABLE[(n >> 18) as usize] as char);
        result.push(TABLE[((n >> 12) & 63) as usize] as char);

        if chunk.len() > 1 {
            result.push(TABLE[((n >> 6) & 63) as usize] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(TABLE[(n & 63) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}

/// Simple base64 decoding
fn base64_decode(s: &str) -> Result<Vec<u8>> {
    let mut lookup = [255u8; 256];
    for (i, &c) in b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
        .iter()
        .enumerate()
    {
        lookup[c as usize] = i as u8;
    }

    let mut result = Vec::new();
    let bytes = s.as_bytes();
    let mut i = 0;

    while i < bytes.len() {
        let b1 = lookup[bytes[i] as usize];
        if b1 == 255 {
            if bytes[i] == b'=' {
                break;
            }
            return Err(Error::from_reason("Invalid base64 character"));
        }
        i += 1;

        if i >= bytes.len() {
            break;
        }
        let b2 = lookup[bytes[i] as usize];
        if b2 == 255 {
            return Err(Error::from_reason("Invalid base64 character"));
        }
        i += 1;

        result.push((b1 << 2) | (b2 >> 4));

        if i >= bytes.len() || bytes[i] == b'=' {
            break;
        }
        let b3 = lookup[bytes[i] as usize];
        if b3 == 255 {
            return Err(Error::from_reason("Invalid base64 character"));
        }
        i += 1;

        result.push((b2 << 4) | (b3 >> 2));

        if i >= bytes.len() || bytes[i] == b'=' {
            break;
        }
        let b4 = lookup[bytes[i] as usize];
        if b4 == 255 {
            return Err(Error::from_reason("Invalid base64 character"));
        }
        i += 1;

        result.push((b3 << 6) | b4);
    }

    Ok(result)
}
