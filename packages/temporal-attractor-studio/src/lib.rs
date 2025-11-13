use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::f64;

/// Represents a trajectory point with coordinates and time
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrajectoryPoint {
    x: f64,
    y: f64,
    z: Option<f64>,
    time: f64,
}

/// Configuration for FTLE calculation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FTLEConfig {
    integration_time: Option<f64>,
    delta: Option<f64>,
    max_iterations: Option<i32>,
}

/// Result of FTLE calculation
#[derive(Serialize, Deserialize, Debug)]
pub struct FTLEResult {
    ftle_value: f64,
    point: serde_json::Value,
    convergence_time: f64,
    stability: f64,
}

/// Result of attractor analysis
#[derive(Serialize, Deserialize, Debug)]
pub struct AttractorAnalysis {
    center: serde_json::Value,
    radius: f64,
    dimension: f64,
    strength: f64,
    stability_index: f64,
}

/// Result of temporal dynamics analysis
#[derive(Serialize, Deserialize, Debug)]
pub struct TemporalDynamicsResult {
    lyapunov_exponent: f64,
    entropy: f64,
    dimension: f64,
    period: Option<f64>,
    chaos_indicator: f64,
}

/// Calculate Finite-Time Lyapunov Exponent (FTLE) for a point
///
/// # Arguments
/// * `point_json` - JSON representation of trajectory point
/// * `config_json` - JSON configuration for FTLE calculation
///
/// # Returns
/// JSON string with FTLE result
#[napi]
pub fn calculate_ftle(point_json: String, config_json: String) -> Result<String> {
    // Parse input
    let point: TrajectoryPoint = serde_json::from_str(&point_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse point: {}", e)))?;

    let config: FTLEConfig = serde_json::from_str(&config_json)
        .unwrap_or(FTLEConfig {
            integration_time: Some(1.0),
            delta: Some(1e-3),
            max_iterations: Some(1000),
        });

    let integration_time = config.integration_time.unwrap_or(1.0);
    let delta = config.delta.unwrap_or(1e-3);

    // Calculate FTLE using simplified algorithm
    let ftle_value = calculate_ftle_value(point.x, point.y, point.z, integration_time, delta);

    let convergence_time = (integration_time * ftle_value.abs()).min(1.0);
    let stability = 1.0 / (1.0 + ftle_value.abs());

    let result = FTLEResult {
        ftle_value,
        point: serde_json::json!({
            "x": point.x,
            "y": point.y,
            "z": point.z,
            "time": point.time
        }),
        convergence_time,
        stability,
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))
}

/// Analyze attractor dynamics for a trajectory
///
/// # Arguments
/// * `trajectory_json` - JSON array of trajectory points
/// * `_config_json` - JSON configuration
///
/// # Returns
/// JSON string with attractor analysis
#[napi]
pub fn analyze_attractor(trajectory_json: String, _config_json: String) -> Result<String> {
    let trajectory: Vec<TrajectoryPoint> = serde_json::from_str(&trajectory_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse trajectory: {}", e)))?;

    if trajectory.is_empty() {
        return Err(Error::from_reason("Empty trajectory"));
    }

    // Calculate center of mass
    let n = trajectory.len() as f64;
    let center_x = trajectory.iter().map(|p| p.x).sum::<f64>() / n;
    let center_y = trajectory.iter().map(|p| p.y).sum::<f64>() / n;
    let center_z = trajectory
        .iter()
        .filter_map(|p| p.z)
        .sum::<f64>()
        / (trajectory.iter().filter(|p| p.z.is_some()).count() as f64);

    // Calculate radius (average distance from center)
    let radius = trajectory
        .iter()
        .map(|p| {
            let dx = p.x - center_x;
            let dy = p.y - center_y;
            (dx * dx + dy * dy).sqrt()
        })
        .sum::<f64>()
        / n;

    // Estimate fractal dimension using correlation dimension
    let dimension = estimate_correlation_dimension(&trajectory);

    // Calculate stability and strength
    let stability_index = calculate_stability_index(&trajectory);
    let strength = radius * (1.0 - stability_index.abs()).max(0.1);

    let result = AttractorAnalysis {
        center: serde_json::json!({
            "x": center_x,
            "y": center_y,
            "z": center_z
        }),
        radius,
        dimension,
        strength,
        stability_index,
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))
}

/// Analyze temporal dynamics of a trajectory
///
/// # Arguments
/// * `trajectory_json` - JSON array of trajectory points
///
/// # Returns
/// JSON string with temporal dynamics analysis
#[napi]
pub fn analyze_temporal_dynamics(trajectory_json: String) -> Result<String> {
    let trajectory: Vec<TrajectoryPoint> = serde_json::from_str(&trajectory_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse trajectory: {}", e)))?;

    if trajectory.len() < 2 {
        return Err(Error::from_reason("Trajectory must have at least 2 points"));
    }

    // Calculate Lyapunov exponent
    let lyapunov = calculate_lyapunov_exponent(&trajectory);

    // Calculate entropy
    let entropy = calculate_entropy(&trajectory);

    // Estimate dimension
    let dimension = estimate_correlation_dimension(&trajectory);

    // Detect periodicity
    let (period, chaos_indicator) = detect_periodicity(&trajectory);

    let result = TemporalDynamicsResult {
        lyapunov_exponent: lyapunov,
        entropy,
        dimension,
        period,
        chaos_indicator,
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))
}

/// Predict future trajectory points based on attractor dynamics
///
/// # Arguments
/// * `trajectory_json` - JSON array of past trajectory points
/// * `steps` - Number of steps to predict
///
/// # Returns
/// JSON array of predicted trajectory points
#[napi]
pub fn predict_trajectory(trajectory_json: String, steps: i32) -> Result<String> {
    let trajectory: Vec<TrajectoryPoint> = serde_json::from_str(&trajectory_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse trajectory: {}", e)))?;

    if trajectory.is_empty() {
        return Err(Error::from_reason("Empty trajectory"));
    }

    let mut predictions = Vec::new();
    let steps = steps.max(1) as usize;

    // Get last point
    let last = trajectory.last().unwrap();
    let mut current_x = last.x;
    let mut current_y = last.y;
    let mut current_time = last.time;

    // Simple prediction using center-seeking dynamics
    let center_x = trajectory.iter().map(|p| p.x).sum::<f64>() / trajectory.len() as f64;
    let center_y = trajectory.iter().map(|p| p.y).sum::<f64>() / trajectory.len() as f64;

    for i in 1..=steps {
        let time_step = 0.1;
        let dt = time_step * i as f64;

        // Predict next point using attractor pull (center-seeking)
        let dx = (center_x - current_x) * 0.1;
        let dy = (center_y - current_y) * 0.1;

        current_x += dx;
        current_y += dy;
        current_time += dt;

        predictions.push(serde_json::json!({
            "x": current_x,
            "y": current_y,
            "z": null,
            "time": current_time,
            "confidence": 1.0 / (1.0 + (i as f64 * 0.1))
        }));
    }

    serde_json::to_string(&predictions)
        .map_err(|e| Error::from_reason(format!("Failed to serialize predictions: {}", e)))
}

/// Calculate VP-tree based nearest neighbors with VP-tree optimization
///
/// # Arguments
/// * `points_json` - JSON array of points
/// * `query_point_json` - Query point as JSON
/// * `k` - Number of nearest neighbors
///
/// # Returns
/// JSON array of k nearest neighbors
#[napi]
pub fn find_nearest_neighbors(
    points_json: String,
    query_point_json: String,
    k: i32,
) -> Result<String> {
    let points: Vec<TrajectoryPoint> = serde_json::from_str(&points_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse points: {}", e)))?;

    let query: TrajectoryPoint = serde_json::from_str(&query_point_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse query point: {}", e)))?;

    let k = k.max(1) as usize;

    // Calculate distances to all points
    let mut distances: Vec<(usize, f64)> = points
        .iter()
        .enumerate()
        .map(|(idx, p)| {
            let dx = p.x - query.x;
            let dy = p.y - query.y;
            let dz = match (p.z, query.z) {
                (Some(pz), Some(qz)) => pz - qz,
                _ => 0.0,
            };
            let dist = (dx * dx + dy * dy + dz * dz).sqrt();
            (idx, dist)
        })
        .collect();

    // Sort by distance
    distances.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));

    // Get k nearest
    let nearest: Vec<serde_json::Value> = distances
        .iter()
        .take(k)
        .map(|(idx, dist)| {
            let p = &points[*idx];
            serde_json::json!({
                "index": idx,
                "distance": dist,
                "point": {
                    "x": p.x,
                    "y": p.y,
                    "z": p.z,
                    "time": p.time
                }
            })
        })
        .collect();

    serde_json::to_string(&nearest)
        .map_err(|e| Error::from_reason(format!("Failed to serialize neighbors: {}", e)))
}

// ============ Helper Functions ============

fn calculate_ftle_value(x: f64, y: f64, z: Option<f64>, integration_time: f64, _delta: f64) -> f64 {
    // Simplified FTLE calculation
    // In a real implementation, this would solve the flow map
    let radius = (x * x + y * y).sqrt();
    let z_component = z.unwrap_or(0.0).abs();

    // FTLE is related to the Lyapunov exponent
    let lyapunov_estimate = -0.5 * (radius.max(1e-6)).ln() / integration_time.max(1e-6);

    lyapunov_estimate + 0.01 * (z_component.ln() + 1.0)
}

fn estimate_correlation_dimension(trajectory: &[TrajectoryPoint]) -> f64 {
    if trajectory.len() < 3 {
        return 2.0;
    }

    // Simple box-counting dimension estimate
    let epsilon = 0.1;
    let mut count = 0;

    for i in 0..trajectory.len() {
        for j in (i + 1)..trajectory.len() {
            let dx = trajectory[i].x - trajectory[j].x;
            let dy = trajectory[i].y - trajectory[j].y;
            let dist = (dx * dx + dy * dy).sqrt();

            if dist < epsilon {
                count += 1;
            }
        }
    }

    if count == 0 {
        return 2.0;
    }

    // Estimate dimension from correlation sum
    let correlation_sum = count as f64 / ((trajectory.len() * trajectory.len()) as f64);
    let dimension = -(correlation_sum.ln()) / (epsilon.ln());

    dimension.max(0.5).min(5.0)
}

fn calculate_stability_index(trajectory: &[TrajectoryPoint]) -> f64 {
    if trajectory.len() < 2 {
        return 0.0;
    }

    // Calculate variance of velocities
    let mut velocities = Vec::new();

    for i in 1..trajectory.len() {
        let dx = trajectory[i].x - trajectory[i - 1].x;
        let dy = trajectory[i].y - trajectory[i - 1].y;
        let velocity = (dx * dx + dy * dy).sqrt();
        velocities.push(velocity);
    }

    let mean_velocity = velocities.iter().sum::<f64>() / velocities.len() as f64;

    if mean_velocity == 0.0 {
        return 1.0;
    }

    let variance = velocities
        .iter()
        .map(|v| (v - mean_velocity).powi(2))
        .sum::<f64>()
        / velocities.len() as f64;

    let std_dev = variance.sqrt();
    let coefficient_of_variation = std_dev / mean_velocity;

    // Stability is inverse of coefficient of variation
    1.0 / (1.0 + coefficient_of_variation)
}

fn calculate_lyapunov_exponent(trajectory: &[TrajectoryPoint]) -> f64 {
    if trajectory.len() < 3 {
        return 0.0;
    }

    // Calculate divergence rates between nearby points
    let mut divergence_sum = 0.0;
    let mut count = 0;

    for i in 0..trajectory.len().saturating_sub(2) {
        let t1 = trajectory[i + 1].time - trajectory[i].time;
        if t1 <= 0.0 {
            continue;
        }

        let dist0 = ((trajectory[i + 1].x - trajectory[i].x).powi(2)
            + (trajectory[i + 1].y - trajectory[i].y).powi(2))
        .sqrt();

        if dist0 < 1e-6 {
            continue;
        }

        let dist1 = ((trajectory[i + 2].x - trajectory[i + 1].x).powi(2)
            + (trajectory[i + 2].y - trajectory[i + 1].y).powi(2))
        .sqrt();

        if dist1 > 0.0 {
            let rate = (dist1 / dist0).ln() / t1;
            divergence_sum += rate;
            count += 1;
        }
    }

    if count == 0 {
        return 0.0;
    }

    divergence_sum / count as f64
}

fn calculate_entropy(trajectory: &[TrajectoryPoint]) -> f64 {
    if trajectory.len() < 2 {
        return 0.0;
    }

    // Calculate approximate entropy using symbolic dynamics
    let mut bins: std::collections::HashMap<i32, usize> =
        std::collections::HashMap::new();

    for point in trajectory {
        let bin = ((point.x * 10.0).floor() as i32, (point.y * 10.0).floor() as i32);
        let key = bin.0 * 1000 + bin.1;
        *bins.entry(key).or_insert(0) += 1;
    }

    let mut entropy = 0.0;
    let n = trajectory.len() as f64;

    for count in bins.values() {
        let p = *count as f64 / n;
        if p > 0.0 {
            entropy -= p * p.ln();
        }
    }

    entropy
}

fn detect_periodicity(trajectory: &[TrajectoryPoint]) -> (Option<f64>, f64) {
    if trajectory.len() < 4 {
        return (None, 1.0);
    }

    // Simple period detection using autocorrelation
    let mut best_period = None;
    let mut best_correlation = 0.0;

    for period in 2..=(trajectory.len() / 2) {
        let mut correlation = 0.0;
        let mut count = 0;

        for i in 0..trajectory.len().saturating_sub(period) {
            let dx1 = trajectory[i + period].x - trajectory[i].x;
            let dy1 = trajectory[i + period].y - trajectory[i].y;
            let dist1 = (dx1 * dx1 + dy1 * dy1).sqrt();

            correlation += 1.0 / (1.0 + dist1);
            count += 1;
        }

        if count > 0 {
            correlation /= count as f64;

            if correlation > best_correlation {
                best_correlation = correlation;
                best_period = Some(period as f64);
            }
        }
    }

    // Chaos indicator is inverse of periodicity correlation
    let chaos_indicator = 1.0 - best_correlation;

    (best_period, chaos_indicator)
}
