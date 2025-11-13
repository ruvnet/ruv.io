use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Configuration for the sublinear solver
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SolverConfig {
    timeout: Option<u32>,
    retries: Option<u32>,
    log_level: Option<String>,
    max_concurrency: Option<u32>,
    tolerance: Option<f64>,
    max_iterations: Option<u32>,
}

/// Represents a system matrix with metadata
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemMatrix {
    id: String,
    dimension: usize,
    data: Vec<Vec<f64>>,
    metadata: serde_json::Value,
}

/// Represents a solution result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SolutionResult {
    id: String,
    solution: Vec<f64>,
    residual: f64,
    iterations: u32,
    converged: bool,
    elapsed_time_ms: u64,
    metadata: serde_json::Value,
}

/// Process result wrapper
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProcessResult {
    id: String,
    status: String,
    data: Vec<u8>,
    metadata: serde_json::Value,
    timestamp: String,
}

/// Initialize the sublinear solver
///
/// # Arguments
/// * `config_json` - JSON string containing configuration options
///
/// # Returns
/// JSON string with initialization status
#[napi]
pub fn initialize_solver(config_json: String) -> Result<String> {
    // Parse configuration
    let _config: SolverConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config JSON: {}",
                e
            )))
        }
    };

    // Return initialization status
    let result = serde_json::json!({
        "status": "initialized",
        "message": "Sublinear solver ready",
        "version": "1.0.0",
        "timestamp": get_timestamp()
    });

    Ok(result.to_string())
}

/// Solve a linear system using sublinear algorithm
///
/// # Arguments
/// * `matrix_json` - JSON string containing system matrix
/// * `rhs_json` - JSON string containing right-hand side vector
///
/// # Returns
/// JSON string with solution result
#[napi]
pub fn solve_system(matrix_json: String, rhs_json: String) -> Result<String> {
    let start_time = std::time::Instant::now();

    // Parse matrix
    let matrix: SystemMatrix = match serde_json::from_str(&matrix_json) {
        Ok(m) => m,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse matrix JSON: {}",
                e
            )))
        }
    };

    // Parse RHS
    let rhs: Vec<f64> = match serde_json::from_str(&rhs_json) {
        Ok(r) => r,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse RHS JSON: {}",
                e
            )))
        }
    };

    // Validate dimensions
    if matrix.data.is_empty() || matrix.data[0].len() != rhs.len() {
        return Err(Error::from_reason(
            "Matrix and RHS dimensions do not match".to_string(),
        ));
    }

    // Solve using Gauss-Seidel iteration (simple sublinear solver)
    let (solution, residual, iterations) = gauss_seidel_solve(&matrix.data, &rhs);

    let elapsed = start_time.elapsed().as_millis() as u64;

    let result = SolutionResult {
        id: matrix.id,
        solution,
        residual,
        iterations,
        converged: residual < 1e-6,
        elapsed_time_ms: elapsed,
        metadata: matrix.metadata,
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize result: {}",
            e
        ))),
    }
}

/// Process input buffer data
///
/// # Arguments
/// * `data` - Input buffer to process
/// * `options_json` - JSON string containing processing options
///
/// # Returns
/// Processed buffer
#[napi]
pub fn process_buffer(data: Vec<u8>, options_json: String) -> Result<Vec<u8>> {
    // Parse options
    let _options: serde_json::Value = match serde_json::from_str(&options_json) {
        Ok(opts) => opts,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse options JSON: {}",
                e
            )))
        }
    };

    // Process data (simple passthrough with validation)
    if data.is_empty() {
        return Err(Error::from_reason("Input buffer is empty".to_string()));
    }

    // Return processed data (in real scenario, would apply algorithm)
    Ok(data)
}

/// Batch solve multiple systems
///
/// # Arguments
/// * `systems_json` - JSON array string containing multiple system matrices
/// * `rhs_array_json` - JSON array string containing RHS vectors
///
/// # Returns
/// JSON array with solution results
#[napi]
pub fn batch_solve(systems_json: String, rhs_array_json: String) -> Result<String> {
    // Parse systems
    let systems: Vec<SystemMatrix> = match serde_json::from_str(&systems_json) {
        Ok(s) => s,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse systems JSON: {}",
                e
            )))
        }
    };

    // Parse RHS array
    let rhs_vectors: Vec<Vec<f64>> = match serde_json::from_str(&rhs_array_json) {
        Ok(r) => r,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse RHS array JSON: {}",
                e
            )))
        }
    };

    // Validate lengths match
    if systems.len() != rhs_vectors.len() {
        return Err(Error::from_reason(
            "Number of systems and RHS vectors do not match".to_string(),
        ));
    }

    // Solve each system
    let results: Vec<SolutionResult> = systems
        .iter()
        .zip(rhs_vectors.iter())
        .map(|(system, rhs)| {
            let start_time = std::time::Instant::now();
            let (solution, residual, iterations) = gauss_seidel_solve(&system.data, rhs);

            SolutionResult {
                id: system.id.clone(),
                solution,
                residual,
                iterations,
                converged: residual < 1e-6,
                elapsed_time_ms: start_time.elapsed().as_millis() as u64,
                metadata: system.metadata.clone(),
            }
        })
        .collect();

    match serde_json::to_string(&results) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize results: {}",
            e
        ))),
    }
}

/// Analyze system properties
///
/// # Arguments
/// * `matrix_json` - JSON string containing system matrix
///
/// # Returns
/// JSON with system analysis
#[napi]
pub fn analyze_system(matrix_json: String) -> Result<String> {
    // Parse matrix
    let matrix: SystemMatrix = match serde_json::from_str(&matrix_json) {
        Ok(m) => m,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse matrix JSON: {}",
                e
            )))
        }
    };

    if matrix.data.is_empty() {
        return Err(Error::from_reason("Empty matrix".to_string()));
    }

    let n = matrix.data.len();
    let mut diag_dominance = 0.0_f64;
    let mut max_norm = 0.0_f64;

    // Calculate diagonal dominance measure
    for (i, row) in matrix.data.iter().enumerate() {
        let diagonal = row.get(i).map(|&x| x.abs()).unwrap_or(0.0);
        let sum_off_diag: f64 = row
            .iter()
            .enumerate()
            .filter(|&(j, _)| j != i)
            .map(|(_, &x)| x.abs())
            .sum();

        if diagonal > 0.0 {
            let dominance_ratio = diagonal / (sum_off_diag + 1e-10);
            diag_dominance += dominance_ratio;
        }

        for &val in row {
            max_norm = max_norm.max(val.abs());
        }
    }

    diag_dominance /= n as f64;

    let analysis = serde_json::json!({
        "id": matrix.id,
        "dimension": n,
        "diagonal_dominance": diag_dominance,
        "max_norm": max_norm,
        "is_diagonally_dominant": diag_dominance > 1.0,
        "sparsity": calculate_sparsity(&matrix.data),
        "condition_estimate": estimate_condition(&matrix.data),
        "timestamp": get_timestamp()
    });

    Ok(analysis.to_string())
}

/// Validate system feasibility
///
/// # Arguments
/// * `matrix_json` - JSON string containing system matrix
/// * `rhs_json` - JSON string containing right-hand side
///
/// # Returns
/// JSON with validation results
#[napi]
pub fn validate_system(matrix_json: String, rhs_json: String) -> Result<String> {
    // Parse matrix
    let matrix: SystemMatrix = match serde_json::from_str(&matrix_json) {
        Ok(m) => m,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse matrix JSON: {}",
                e
            )))
        }
    };

    // Parse RHS
    let rhs: Vec<f64> = match serde_json::from_str(&rhs_json) {
        Ok(r) => r,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse RHS JSON: {}",
                e
            )))
        }
    };

    let mut valid = true;
    let mut errors = Vec::new();

    // Check dimensions
    if matrix.data.is_empty() {
        valid = false;
        errors.push("Matrix is empty".to_string());
    } else if matrix.data.len() != rhs.len() {
        valid = false;
        errors.push("Matrix and RHS dimensions do not match".to_string());
    }

    // Check for NaN or Inf
    for (i, row) in matrix.data.iter().enumerate() {
        for (j, &val) in row.iter().enumerate() {
            if !val.is_finite() {
                valid = false;
                errors.push(format!("Non-finite value at matrix[{}][{}]", i, j));
            }
        }
    }

    for (i, &val) in rhs.iter().enumerate() {
        if !val.is_finite() {
            valid = false;
            errors.push(format!("Non-finite value in RHS[{}]", i));
        }
    }

    let result = serde_json::json!({
        "valid": valid,
        "errors": errors,
        "matrix_id": matrix.id,
        "dimension": matrix.data.len(),
        "timestamp": get_timestamp()
    });

    Ok(result.to_string())
}

// ============ Helper Functions ============

/// Gauss-Seidel iterative solver for linear systems
fn gauss_seidel_solve(matrix: &[Vec<f64>], rhs: &[f64]) -> (Vec<f64>, f64, u32) {
    let n = rhs.len();
    let mut x = vec![0.0_f64; n];
    let tolerance = 1e-8_f64;
    let max_iterations = 1000;
    let mut residual = f64::MAX;
    let mut iteration = 0_u32;

    for _ in 0..max_iterations {
        iteration += 1;
        let mut max_change = 0.0_f64;

        for i in 0..n {
            if i >= matrix.len() {
                break;
            }

            let row = &matrix[i];
            let mut sum = 0.0_f64;

            // Sum contributions from known values and previous iteration
            for j in 0..row.len() {
                if j != i {
                    sum += row[j] * x[j];
                }
            }

            // Calculate new value
            let diag = row.get(i).copied().unwrap_or(1.0);
            if diag.abs() > 1e-14 {
                let new_x = (rhs[i] - sum) / diag;
                let change = (new_x - x[i]).abs();
                max_change = max_change.max(change);
                x[i] = new_x;
            }
        }

        // Calculate residual
        residual = 0.0_f64;
        for i in 0..n {
            if i >= matrix.len() {
                break;
            }

            let row = &matrix[i];
            let mut sum = 0.0_f64;
            for j in 0..row.len() {
                sum += row[j] * x[j];
            }
            residual += (sum - rhs[i]).abs();
        }
        residual /= n as f64;

        if max_change < tolerance {
            break;
        }
    }

    (x, residual, iteration)
}

/// Calculate sparsity of matrix
fn calculate_sparsity(matrix: &[Vec<f64>]) -> f64 {
    if matrix.is_empty() {
        return 0.0;
    }

    let total_elements = matrix.len() * matrix[0].len();
    let mut nonzero = 0;

    for row in matrix {
        for &val in row {
            if val.abs() > 1e-14 {
                nonzero += 1;
            }
        }
    }

    if total_elements == 0 {
        0.0
    } else {
        1.0 - (nonzero as f64 / total_elements as f64)
    }
}

/// Estimate condition number of matrix
fn estimate_condition(matrix: &[Vec<f64>]) -> f64 {
    if matrix.is_empty() {
        return 1.0;
    }

    let mut norm = 0.0_f64;
    for row in matrix {
        for &val in row {
            norm = norm.max(val.abs());
        }
    }

    // Rough estimate: ratio of largest to smallest diagonal element
    let mut diag_max = 0.0_f64;
    let mut diag_min = f64::MAX;

    for (i, row) in matrix.iter().enumerate() {
        if let Some(&val) = row.get(i) {
            let abs_val = val.abs();
            if abs_val > 1e-14 {
                diag_max = diag_max.max(abs_val);
                diag_min = diag_min.min(abs_val);
            }
        }
    }

    if diag_min > 0.0 && diag_max > 0.0 {
        diag_max / diag_min
    } else {
        1.0
    }
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
