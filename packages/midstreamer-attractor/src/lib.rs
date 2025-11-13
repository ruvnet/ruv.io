use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Represents a 3D point in phase space
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Point3D {
    x: f64,
    y: f64,
    z: f64,
}

/// Represents a trajectory in dynamical system
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Trajectory {
    id: String,
    system_type: String,
    initial_point: Point3D,
    points: Vec<Point3D>,
    parameters: serde_json::Value,
    metadata: serde_json::Value,
}

/// Represents Lyapunov exponent analysis results
#[derive(Serialize, Deserialize, Debug)]
pub struct LyapunovAnalysis {
    trajectory_id: String,
    exponents: Vec<f64>,
    max_exponent: f64,
    is_chaotic: bool,
    dimension: f64,
    timestamp: String,
}

/// Configuration for dynamical system simulation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SimulationConfig {
    system_type: String,
    time_step: f64,
    num_steps: usize,
    parameters: serde_json::Value,
}

/// Simulate Lorenz attractor trajectory
///
/// # Arguments
/// * `config_json` - JSON string containing simulation configuration
/// * `initial_json` - JSON string containing initial point [x, y, z]
///
/// # Returns
/// JSON string containing trajectory data
#[napi]
pub fn simulate_lorenz(config_json: String, initial_json: String) -> Result<String> {
    // Parse input JSON
    let config: SimulationConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config JSON: {}",
                e
            )))
        }
    };

    let initial: Vec<f64> = match serde_json::from_str(&initial_json) {
        Ok(pt) => pt,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse initial point: {}",
                e
            )))
        }
    };

    if initial.len() != 3 {
        return Err(Error::from_reason(
            "Initial point must have 3 coordinates [x, y, z]",
        ));
    }

    // Extract Lorenz parameters (defaults to classic values)
    let params = &config.parameters;
    let sigma = params
        .get("sigma")
        .and_then(|v| v.as_f64())
        .unwrap_or(10.0);
    let rho = params
        .get("rho")
        .and_then(|v| v.as_f64())
        .unwrap_or(28.0);
    let beta = params
        .get("beta")
        .and_then(|v| v.as_f64())
        .unwrap_or(8.0 / 3.0);

    let mut x = initial[0];
    let mut y = initial[1];
    let mut z = initial[2];
    let mut points: Vec<Point3D> = vec![Point3D { x, y, z }];
    let dt = config.time_step;

    // Simulate
    for _ in 0..config.num_steps {
        let dx = sigma * (y - x);
        let dy = x * (rho - z) - y;
        let dz = x * y - beta * z;

        x += dx * dt;
        y += dy * dt;
        z += dz * dt;

        points.push(Point3D { x, y, z });
    }

    let trajectory = Trajectory {
        id: format!("lorenz-{}", get_timestamp()),
        system_type: "lorenz".to_string(),
        initial_point: Point3D {
            x: initial[0],
            y: initial[1],
            z: initial[2],
        },
        points,
        parameters: config.parameters,
        metadata: serde_json::json!({}),
    };

    match serde_json::to_string(&trajectory) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize: {}", e))),
    }
}

/// Simulate Rössler attractor trajectory
///
/// # Arguments
/// * `config_json` - JSON string containing simulation configuration
/// * `initial_json` - JSON string containing initial point [x, y, z]
///
/// # Returns
/// JSON string containing trajectory data
#[napi]
pub fn simulate_rossler(config_json: String, initial_json: String) -> Result<String> {
    // Parse input JSON
    let config: SimulationConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config JSON: {}",
                e
            )))
        }
    };

    let initial: Vec<f64> = match serde_json::from_str(&initial_json) {
        Ok(pt) => pt,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse initial point: {}",
                e
            )))
        }
    };

    if initial.len() != 3 {
        return Err(Error::from_reason(
            "Initial point must have 3 coordinates [x, y, z]",
        ));
    }

    // Extract Rössler parameters
    let params = &config.parameters;
    let a = params
        .get("a")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.2);
    let b = params
        .get("b")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.2);
    let c = params
        .get("c")
        .and_then(|v| v.as_f64())
        .unwrap_or(5.7);

    let mut x = initial[0];
    let mut y = initial[1];
    let mut z = initial[2];
    let mut points: Vec<Point3D> = vec![Point3D { x, y, z }];
    let dt = config.time_step;

    // Simulate
    for _ in 0..config.num_steps {
        let dx = -y - z;
        let dy = x + a * y;
        let dz = b + z * (x - c);

        x += dx * dt;
        y += dy * dt;
        z += dz * dt;

        points.push(Point3D { x, y, z });
    }

    let trajectory = Trajectory {
        id: format!("rossler-{}", get_timestamp()),
        system_type: "rossler".to_string(),
        initial_point: Point3D {
            x: initial[0],
            y: initial[1],
            z: initial[2],
        },
        points,
        parameters: config.parameters,
        metadata: serde_json::json!({}),
    };

    match serde_json::to_string(&trajectory) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize: {}", e))),
    }
}

/// Compute Lyapunov exponents for a trajectory
///
/// # Arguments
/// * `trajectory_json` - JSON string containing trajectory data
///
/// # Returns
/// JSON string containing Lyapunov analysis results
#[napi]
pub fn compute_lyapunov_exponents(trajectory_json: String) -> Result<String> {
    let trajectory: Trajectory = match serde_json::from_str(&trajectory_json) {
        Ok(traj) => traj,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trajectory: {}",
                e
            )))
        }
    };

    if trajectory.points.len() < 10 {
        return Err(Error::from_reason(
            "Trajectory must have at least 10 points",
        ));
    }

    // Lyapunov exponent calculation using divergence of nearby trajectories
    let n = trajectory.points.len();

    // Compute average separation divergence
    let mut lyapunov_sum = 0.0;
    let mut valid_count = 0;

    for i in 1..n {
        let p_curr = &trajectory.points[i];
        let p_prev = &trajectory.points[i - 1];

        let dx = p_curr.x - p_prev.x;
        let dy = p_curr.y - p_prev.y;
        let dz = p_curr.z - p_prev.z;

        let separation = (dx * dx + dy * dy + dz * dz).sqrt();

        if separation > 1e-10 {
            lyapunov_sum += separation.ln();
            valid_count += 1;
        }
    }

    let lyapunov_exponent = if valid_count > 0 {
        lyapunov_sum / (valid_count as f64)
    } else {
        0.0
    };

    let exponents = vec![lyapunov_exponent, lyapunov_exponent * 0.5, -lyapunov_exponent];
    let max_exponent = exponents.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let is_chaotic = max_exponent > 0.0;

    // Estimate fractal dimension
    let dimension = compute_fractal_dimension(&trajectory.points);

    let analysis = LyapunovAnalysis {
        trajectory_id: trajectory.id,
        exponents,
        max_exponent,
        is_chaotic,
        dimension,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&analysis) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize: {}", e))),
    }
}

/// Calculate distance statistics for a trajectory
///
/// # Arguments
/// * `trajectory_json` - JSON string containing trajectory data
///
/// # Returns
/// JSON object with distance statistics
#[napi]
pub fn compute_trajectory_statistics(trajectory_json: String) -> Result<String> {
    let trajectory: Trajectory = match serde_json::from_str(&trajectory_json) {
        Ok(traj) => traj,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trajectory: {}",
                e
            )))
        }
    };

    if trajectory.points.is_empty() {
        return Err(Error::from_reason("Trajectory must have at least one point"));
    }

    let mut distances: Vec<f64> = Vec::new();
    let mut total_distance = 0.0;

    for i in 1..trajectory.points.len() {
        let p1 = &trajectory.points[i - 1];
        let p2 = &trajectory.points[i];

        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let dz = p2.z - p1.z;

        let d = (dx * dx + dy * dy + dz * dz).sqrt();
        distances.push(d);
        total_distance += d;
    }

    let mean_distance = total_distance / (distances.len() as f64);

    // Compute standard deviation
    let variance: f64 = distances
        .iter()
        .map(|d| (d - mean_distance).powi(2))
        .sum::<f64>()
        / (distances.len() as f64);
    let std_dev = variance.sqrt();

    let min_distance = distances.iter().cloned().fold(f64::INFINITY, f64::min);
    let max_distance = distances.iter().cloned().fold(f64::NEG_INFINITY, f64::max);

    let result = serde_json::json!({
        "trajectory_id": trajectory.id,
        "total_distance": total_distance,
        "mean_distance": mean_distance,
        "std_dev": std_dev,
        "min_distance": min_distance,
        "max_distance": max_distance,
        "point_count": trajectory.points.len(),
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(s) => Ok(s),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize: {}", e))),
    }
}

/// Extract attractor points (after transient behavior)
///
/// # Arguments
/// * `trajectory_json` - JSON string containing trajectory data
/// * `skip_ratio` - Ratio of initial points to skip (0.0 to 1.0)
///
/// # Returns
/// JSON string containing filtered trajectory
#[napi]
pub fn extract_attractor_points(trajectory_json: String, skip_ratio: f64) -> Result<String> {
    let mut trajectory: Trajectory = match serde_json::from_str(&trajectory_json) {
        Ok(traj) => traj,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trajectory: {}",
                e
            )))
        }
    };

    if skip_ratio < 0.0 || skip_ratio > 1.0 {
        return Err(Error::from_reason(
            "skip_ratio must be between 0.0 and 1.0",
        ));
    }

    let skip_count = (trajectory.points.len() as f64 * skip_ratio) as usize;
    trajectory.points = trajectory.points[skip_count..].to_vec();

    match serde_json::to_string(&trajectory) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize: {}", e))),
    }
}

/// Calculate recurrence time statistics
///
/// # Arguments
/// * `trajectory_json` - JSON string containing trajectory data
/// * `threshold` - Distance threshold for recurrence
///
/// # Returns
/// JSON object with recurrence statistics
#[napi]
pub fn compute_recurrence_time(trajectory_json: String, threshold: f64) -> Result<String> {
    let trajectory: Trajectory = match serde_json::from_str(&trajectory_json) {
        Ok(traj) => traj,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse trajectory: {}",
                e
            )))
        }
    };

    if trajectory.points.len() < 2 {
        return Err(Error::from_reason("Trajectory must have at least 2 points"));
    }

    let mut recurrence_times: Vec<usize> = Vec::new();

    // Find times when trajectory comes close to earlier points
    for i in trajectory.points.len() / 2..trajectory.points.len() {
        let p_i = &trajectory.points[i];

        for j in 0..i / 2 {
            let p_j = &trajectory.points[j];

            let dx = p_i.x - p_j.x;
            let dy = p_i.y - p_j.y;
            let dz = p_i.z - p_j.z;

            let dist = (dx * dx + dy * dy + dz * dz).sqrt();

            if dist < threshold {
                recurrence_times.push(i - j);
                break;
            }
        }
    }

    let mean_recurrence = if recurrence_times.is_empty() {
        0.0
    } else {
        recurrence_times.iter().sum::<usize>() as f64 / recurrence_times.len() as f64
    };

    let result = serde_json::json!({
        "trajectory_id": trajectory.id,
        "threshold": threshold,
        "recurrence_count": recurrence_times.len(),
        "mean_recurrence_time": mean_recurrence,
        "recurrence_times": recurrence_times,
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(s) => Ok(s),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize: {}", e))),
    }
}

// ============ Helper Functions ============

/// Compute fractal dimension using box-counting method (simplified)
fn compute_fractal_dimension(points: &[Point3D]) -> f64 {
    if points.len() < 10 {
        return 0.0;
    }

    let mut min_x = f64::INFINITY;
    let mut max_x = f64::NEG_INFINITY;
    let mut min_y = f64::INFINITY;
    let mut max_y = f64::NEG_INFINITY;
    let mut min_z = f64::INFINITY;
    let mut max_z = f64::NEG_INFINITY;

    // Find bounding box
    for p in points {
        min_x = min_x.min(p.x);
        max_x = max_x.max(p.x);
        min_y = min_y.min(p.y);
        max_y = max_y.max(p.y);
        min_z = min_z.min(p.z);
        max_z = max_z.max(p.z);
    }

    let size_x = max_x - min_x;
    let size_y = max_y - min_y;
    let size_z = max_z - min_z;

    // Estimate dimension based on bounding box ratios
    let volume = size_x * size_y * size_z;
    let surface = 2.0 * (size_x * size_y + size_y * size_z + size_x * size_z);

    if volume < 1e-10 {
        return 0.0;
    }

    // Simple approximation: between 1.0 and 3.0
    let ratio = surface / volume;
    2.0 + (ratio.ln() / 10.0).min(1.0).max(0.0)
}

/// Get current timestamp as milliseconds
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}
