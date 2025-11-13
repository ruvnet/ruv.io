use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Configuration for time expansion
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TimeExpansionConfig {
    dilation_factor: f64,
    base_frequency: f64,
    max_depth: u32,
}

/// Time expansion context with state
#[napi]
pub struct TimeExpansionContext {
    config: TimeExpansionConfig,
    elapsed_physical_time: f64,
    elapsed_subjective_time: f64,
    state: String,
}

#[napi]
impl TimeExpansionContext {
    #[napi(constructor)]
    pub fn new(
        dilation_factor: f64,
        base_frequency: f64,
        max_depth: u32,
    ) -> napi::Result<Self> {
        if dilation_factor <= 0.0 {
            return Err(napi::Error::from_reason(
                "Dilation factor must be positive",
            ));
        }
        if base_frequency <= 0.0 {
            return Err(napi::Error::from_reason("Base frequency must be positive"));
        }

        let config = TimeExpansionConfig {
            dilation_factor,
            base_frequency,
            max_depth,
        };

        Ok(TimeExpansionContext {
            config,
            elapsed_physical_time: 0.0,
            elapsed_subjective_time: 0.0,
            state: "initialized".to_string(),
        })
    }

    /// Update the context with elapsed physical time
    #[napi]
    pub fn update(&mut self, elapsed_ms: f64) -> napi::Result<()> {
        if elapsed_ms < 0.0 {
            return Err(napi::Error::from_reason(
                "Elapsed time cannot be negative",
            ));
        }

        self.elapsed_physical_time = elapsed_ms;
        self.elapsed_subjective_time = elapsed_ms * self.config.dilation_factor;
        self.state = "updated".to_string();

        Ok(())
    }

    /// Get the current dilation factor
    #[napi]
    pub fn get_dilation_factor(&self) -> f64 {
        self.config.dilation_factor
    }

    /// Get the current base frequency
    #[napi]
    pub fn get_base_frequency(&self) -> f64 {
        self.config.base_frequency
    }

    /// Get elapsed physical time in milliseconds
    #[napi]
    pub fn get_elapsed_physical_time(&self) -> f64 {
        self.elapsed_physical_time
    }

    /// Get elapsed subjective time in milliseconds
    #[napi]
    pub fn get_elapsed_subjective_time(&self) -> f64 {
        self.elapsed_subjective_time
    }

    /// Get the time ratio (subjective / physical)
    #[napi]
    pub fn get_time_ratio(&self) -> f64 {
        if self.elapsed_physical_time == 0.0 {
            self.config.dilation_factor
        } else {
            self.elapsed_subjective_time / self.elapsed_physical_time
        }
    }

    /// Get the current state
    #[napi]
    pub fn get_state(&self) -> String {
        self.state.clone()
    }

    /// Reset the context
    #[napi]
    pub fn reset(&mut self) -> napi::Result<()> {
        self.elapsed_physical_time = 0.0;
        self.elapsed_subjective_time = 0.0;
        self.state = "reset".to_string();
        Ok(())
    }
}

/// Result of time calculation
#[napi(object)]
pub struct TimeCalculationResult {
    pub physical_time: f64,
    pub subjective_time: f64,
    pub dilation_factor: f64,
    pub time_ratio: f64,
}

/// Calculate time dilation for a given physical time
#[napi]
pub fn calculate_time_expansion(
    physical_time: f64,
    dilation_factor: f64,
) -> napi::Result<TimeCalculationResult> {
    if physical_time < 0.0 {
        return Err(napi::Error::from_reason("Physical time cannot be negative"));
    }
    if dilation_factor <= 0.0 {
        return Err(napi::Error::from_reason("Dilation factor must be positive"));
    }

    let subjective_time = physical_time * dilation_factor;
    let time_ratio = if physical_time == 0.0 {
        dilation_factor
    } else {
        subjective_time / physical_time
    };

    Ok(TimeCalculationResult {
        physical_time,
        subjective_time,
        dilation_factor,
        time_ratio,
    })
}

/// Calculate multi-level time expansion with depth
#[napi]
pub fn calculate_nested_expansion(
    physical_time: f64,
    base_factor: f64,
    depth: u32,
) -> napi::Result<f64> {
    if physical_time < 0.0 {
        return Err(napi::Error::from_reason("Physical time cannot be negative"));
    }
    if base_factor <= 0.0 {
        return Err(napi::Error::from_reason("Base factor must be positive"));
    }
    if depth == 0 {
        return Err(napi::Error::from_reason("Depth must be at least 1"));
    }

    let mut subjective_time = physical_time;

    for _ in 0..depth {
        subjective_time = subjective_time * base_factor;
    }

    Ok(subjective_time)
}

/// Calculate optimal dilation factor for target ratio
#[napi]
pub fn calculate_optimal_dilation(target_ratio: f64) -> napi::Result<f64> {
    if target_ratio <= 0.0 {
        return Err(napi::Error::from_reason("Target ratio must be positive"));
    }

    // Simple calculation: optimal dilation is directly the target ratio
    Ok(target_ratio)
}

/// Process a batch of time measurements
#[napi]
pub fn process_time_batch(times: Vec<f64>, dilation_factor: f64) -> napi::Result<Vec<f64>> {
    if dilation_factor <= 0.0 {
        return Err(napi::Error::from_reason("Dilation factor must be positive"));
    }

    let results: Result<Vec<f64>, napi::Error> = times
        .iter()
        .map(|&t| {
            if t < 0.0 {
                Err(napi::Error::from_reason("Time cannot be negative"))
            } else {
                Ok(t * dilation_factor)
            }
        })
        .collect();

    results
}

/// Calculate average dilation from a set of measurements
#[napi]
pub fn calculate_average_dilation(
    physical_times: Vec<f64>,
    subjective_times: Vec<f64>,
) -> napi::Result<f64> {
    if physical_times.len() != subjective_times.len() {
        return Err(napi::Error::from_reason(
            "Physical and subjective time arrays must have same length",
        ));
    }

    if physical_times.is_empty() {
        return Err(napi::Error::from_reason("Time arrays cannot be empty"));
    }

    let mut total_dilation = 0.0;
    let mut count = 0;

    for (physical, subjective) in physical_times.iter().zip(subjective_times.iter()) {
        if *physical < 0.0 || *subjective < 0.0 {
            return Err(napi::Error::from_reason(
                "Time values cannot be negative",
            ));
        }

        if *physical > 0.0 {
            total_dilation += subjective / physical;
            count += 1;
        }
    }

    if count == 0 {
        return Ok(0.0);
    }

    Ok(total_dilation / count as f64)
}

/// Estimate consciousness level based on time expansion
#[napi]
pub fn estimate_consciousness_level(
    dilation_factor: f64,
    processing_depth: u32,
) -> napi::Result<f64> {
    if dilation_factor <= 0.0 {
        return Err(napi::Error::from_reason("Dilation factor must be positive"));
    }

    // Simple estimation: log of dilation factor + normalized depth
    let factor_component = dilation_factor.log2();
    let depth_component = (processing_depth as f64).log2().max(0.0);

    // Consciousness level is normalized to 0.0 - 1.0 range
    let consciousness = (factor_component + depth_component) / 10.0;
    Ok(consciousness.clamp(0.0, 1.0))
}
