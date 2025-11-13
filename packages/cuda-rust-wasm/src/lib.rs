use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Configuration for CUDA to Rust transpilation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TranspileConfig {
    timeout: Option<u32>,
    retries: Option<u32>,
    log_level: Option<String>,
    max_concurrency: Option<u32>,
    #[serde(skip)]
    buffer_size: Option<usize>,
    enable_caching: Option<bool>,
    cache_size: Option<usize>,
}

/// Result of CUDA code transpilation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TranspileResult {
    success: bool,
    output: String,
    processing_time_ms: u32,
    input_size: usize,
    output_size: usize,
    metadata: serde_json::Value,
}

/// Processing options for transpiler
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProcessingOptions {
    priority: Option<String>,
    cache: Option<bool>,
    timeout: Option<u32>,
}

/// Statistics for transpilation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TranspilationStats {
    total_processed: u32,
    total_time_ms: u64,
    average_time_ms: u64,
    success_count: u32,
    error_count: u32,
}

/// Transpile CUDA code to Rust
///
/// # Arguments
/// * `cuda_code` - CUDA code as a string
///
/// # Returns
/// JSON string with transpilation result
#[napi]
pub fn transpile_cuda_to_rust(cuda_code: String) -> Result<String> {
    let start = std::time::Instant::now();

    // Validate input
    if cuda_code.is_empty() {
        return Err(Error::from_reason("Empty CUDA code provided"));
    }

    // Simulate CUDA to Rust transpilation
    let rust_code = perform_transpilation(&cuda_code);
    let processing_time = start.elapsed().as_millis() as u32;

    let result = TranspileResult {
        success: true,
        output: rust_code.clone(),
        processing_time_ms: processing_time,
        input_size: cuda_code.len(),
        output_size: rust_code.len(),
        metadata: serde_json::json!({
            "transpiler_version": "0.1.6",
            "timestamp": get_timestamp(),
        }),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Process CUDA code with configuration options
///
/// # Arguments
/// * `cuda_code` - CUDA code to process
/// * `config_json` - JSON configuration string
///
/// # Returns
/// JSON string with processing result
#[napi]
pub fn process_cuda_code(cuda_code: String, config_json: String) -> Result<String> {
    let start = std::time::Instant::now();

    // Parse configuration
    let _config: TranspileConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(_) => TranspileConfig {
            timeout: Some(5000),
            retries: Some(3),
            log_level: Some("info".to_string()),
            max_concurrency: Some(10),
            buffer_size: None,
            enable_caching: Some(true),
            cache_size: Some(100),
        },
    };

    if cuda_code.is_empty() {
        return Err(Error::from_reason("Empty CUDA code provided"));
    }

    // Perform transpilation
    let rust_code = perform_transpilation(&cuda_code);
    let processing_time = start.elapsed().as_millis() as u32;

    let result = TranspileResult {
        success: true,
        output: rust_code.clone(),
        processing_time_ms: processing_time,
        input_size: cuda_code.len(),
        output_size: rust_code.len(),
        metadata: serde_json::json!({
            "config": _config,
            "timestamp": get_timestamp(),
        }),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Batch process multiple CUDA files
///
/// # Arguments
/// * `cuda_files_json` - JSON array of CUDA code strings
///
/// # Returns
/// JSON array of transpilation results
#[napi]
pub fn batch_transpile_cuda(cuda_files_json: String) -> Result<String> {
    let cuda_files: Vec<String> = match serde_json::from_str(&cuda_files_json) {
        Ok(files) => files,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse CUDA files: {}",
                e
            )))
        }
    };

    if cuda_files.is_empty() {
        return Ok(serde_json::to_string(&Vec::<TranspileResult>::new()).unwrap());
    }

    let results: Vec<TranspileResult> = cuda_files
        .iter()
        .map(|cuda_code| {
            let start = std::time::Instant::now();
            let rust_code = perform_transpilation(cuda_code);
            let processing_time = start.elapsed().as_millis() as u32;

            TranspileResult {
                success: true,
                output: rust_code.clone(),
                processing_time_ms: processing_time,
                input_size: cuda_code.len(),
                output_size: rust_code.len(),
                metadata: serde_json::json!({
                    "timestamp": get_timestamp(),
                }),
            }
        })
        .collect();

    match serde_json::to_string(&results) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Validate CUDA code syntax
///
/// # Arguments
/// * `cuda_code` - CUDA code to validate
///
/// # Returns
/// JSON with validation result
#[napi]
pub fn validate_cuda_code(cuda_code: String) -> Result<String> {
    let result = validate_cuda_syntax(&cuda_code);

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Get transpilation statistics
///
/// # Arguments
/// * `stats_json` - Previous statistics as JSON
///
/// # Returns
/// Updated statistics as JSON
#[napi]
pub fn get_transpilation_stats(stats_json: String) -> Result<String> {
    let mut stats: TranspilationStats = match serde_json::from_str(&stats_json) {
        Ok(s) => s,
        Err(_) => TranspilationStats {
            total_processed: 0,
            total_time_ms: 0,
            average_time_ms: 0,
            success_count: 0,
            error_count: 0,
        },
    };

    // Calculate average time
    if stats.total_processed > 0 {
        stats.average_time_ms = stats.total_time_ms / (stats.total_processed as u64);
    }

    match serde_json::to_string(&stats) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize stats: {}", e))),
    }
}

// ============ Helper Functions ============

/// Perform CUDA to Rust transpilation
fn perform_transpilation(cuda_code: &str) -> String {
    let mut rust_code = String::new();
    rust_code.push_str("// Auto-transpiled from CUDA\n");
    rust_code.push_str("// CUDA to Rust conversion (v0.1.6)\n\n");

    // Simple transpilation logic
    let lines: Vec<&str> = cuda_code.lines().collect();

    for line in lines {
        let trimmed = line.trim();

        // Skip empty lines and comments
        if trimmed.is_empty() {
            rust_code.push('\n');
            continue;
        }

        if trimmed.starts_with("//") || trimmed.starts_with("/*") {
            rust_code.push_str(trimmed);
            rust_code.push('\n');
            continue;
        }

        // Basic CUDA to Rust conversions
        let converted = if trimmed.contains("__global__") {
            trimmed.replace("__global__", "pub fn")
        } else if trimmed.contains("__device__") {
            trimmed.replace("__device__", "fn")
        } else if trimmed.contains("blockIdx") {
            trimmed.replace("blockIdx.x", "block_idx_x()")
        } else if trimmed.contains("threadIdx") {
            trimmed.replace("threadIdx.x", "thread_idx_x()")
        } else if trimmed.contains("gridDim") {
            trimmed.replace("gridDim.x", "grid_dim_x()")
        } else if trimmed.contains("blockDim") {
            trimmed.replace("blockDim.x", "block_dim_x()")
        } else if trimmed.contains("__syncthreads") {
            trimmed.replace("__syncthreads()", "sync_threads()")
        } else if trimmed.contains("cuda") {
            trimmed.to_lowercase()
        } else {
            trimmed.to_string()
        };

        rust_code.push_str(&converted);
        rust_code.push('\n');
    }

    rust_code
}

/// Validate CUDA code syntax
fn validate_cuda_syntax(cuda_code: &str) -> serde_json::Value {
    let lines: Vec<&str> = cuda_code.lines().collect();
    let errors: Vec<String> = Vec::new();
    let mut warnings: Vec<String> = Vec::new();

    for (idx, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Check for unclosed braces
        let open_braces = trimmed.matches('{').count();
        let close_braces = trimmed.matches('}').count();

        if open_braces > close_braces {
            warnings.push(format!("Line {}: Potential unclosed brace", idx + 1));
        }

        // Check for incomplete statements
        if !trimmed.is_empty()
            && !trimmed.starts_with("//")
            && !trimmed.starts_with("/*")
            && !trimmed.ends_with(';')
            && !trimmed.ends_with('{')
            && !trimmed.ends_with('}')
            && !trimmed.ends_with(',')
        {
            if !trimmed.ends_with('(') && !trimmed.contains("//") {
                // Could be an incomplete statement
                if trimmed.contains("=") && !trimmed.contains("==") {
                    warnings.push(format!("Line {}: Statement may be incomplete", idx + 1));
                }
            }
        }
    }

    serde_json::json!({
        "valid": errors.is_empty(),
        "errors": errors,
        "warnings": warnings,
        "line_count": lines.len(),
        "timestamp": get_timestamp(),
    })
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

#[napi]
pub struct CudaClient {
    config: Arc<std::sync::Mutex<TranspileConfig>>,
    stats: Arc<std::sync::Mutex<TranspilationStats>>,
}

#[napi]
impl CudaClient {
    #[napi(constructor)]
    pub fn new(config_json: Option<String>) -> Result<Self> {
        let config = if let Some(json) = config_json {
            match serde_json::from_str(&json) {
                Ok(cfg) => cfg,
                Err(_) => TranspileConfig {
                    timeout: Some(5000),
                    retries: Some(3),
                    log_level: Some("info".to_string()),
                    max_concurrency: Some(10),
                    buffer_size: None,
                    enable_caching: Some(true),
                    cache_size: Some(100),
                },
            }
        } else {
            TranspileConfig {
                timeout: Some(5000),
                retries: Some(3),
                log_level: Some("info".to_string()),
                max_concurrency: Some(10),
                buffer_size: None,
                enable_caching: Some(true),
                cache_size: Some(100),
            }
        };

        Ok(Self {
            config: Arc::new(std::sync::Mutex::new(config)),
            stats: Arc::new(std::sync::Mutex::new(TranspilationStats {
                total_processed: 0,
                total_time_ms: 0,
                average_time_ms: 0,
                success_count: 0,
                error_count: 0,
            })),
        })
    }

    #[napi]
    pub fn transpile(&self, cuda_code: String) -> Result<String> {
        let start = std::time::Instant::now();

        if cuda_code.is_empty() {
            let mut stats = self.stats.lock().unwrap();
            stats.error_count += 1;
            return Err(Error::from_reason("Empty CUDA code provided"));
        }

        let rust_code = perform_transpilation(&cuda_code);
        let processing_time = start.elapsed().as_millis() as u32;
        let output_size = rust_code.len();

        // Update stats
        {
            let mut stats = self.stats.lock().unwrap();
            stats.total_processed += 1;
            stats.total_time_ms += processing_time as u64;
            stats.success_count += 1;
            if stats.total_processed > 0 {
                stats.average_time_ms = stats.total_time_ms / (stats.total_processed as u64);
            }
        }

        let result = TranspileResult {
            success: true,
            output: rust_code,
            processing_time_ms: processing_time,
            input_size: cuda_code.len(),
            output_size,
            metadata: serde_json::json!({
                "timestamp": get_timestamp(),
            }),
        };

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
        }
    }

    #[napi]
    pub fn get_stats(&self) -> Result<String> {
        let stats = self.stats.lock().unwrap();

        match serde_json::to_string(&*stats) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Failed to serialize stats: {}", e))),
        }
    }
}
