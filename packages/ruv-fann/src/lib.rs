use napi::{bindgen_prelude::*, Status};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::Mutex;

/// Configuration for creating a neural network
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkConfig {
    pub layers: Vec<u32>,
    pub activation: Option<String>,
    pub learning_rate: Option<f32>,
    pub momentum: Option<f32>,
}

/// Neural network statistics
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NetworkStats {
    pub num_layers: u32,
    pub total_neurons: u32,
    pub total_connections: u32,
    pub network_type: String,
}

/// Training configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrainingConfig {
    pub epochs: Option<u32>,
    pub batch_size: Option<u32>,
    pub learning_rate: Option<f32>,
    pub validation_split: Option<f32>,
}

/// Training result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrainingResult {
    pub epochs_trained: u32,
    pub final_error: f32,
    pub total_time_ms: u32,
}

/// Neural network wrapper for NAPI
#[napi]
pub struct NeuralNetwork {
    inner: Arc<Mutex<NetworkData>>,
}

/// Internal network data
struct NetworkData {
    config: NetworkConfig,
    is_trained: bool,
}

#[napi]
impl NeuralNetwork {
    /// Create a new neural network instance with specified layer configuration
    ///
    /// # Arguments
    /// * `config_json` - JSON string containing network configuration
    ///
    /// # Returns
    /// A new NeuralNetwork instance
    ///
    /// # Example
    /// ```
    /// let config = r#"{"layers": [64, 128, 64], "activation": "relu"}"#;
    /// let network = NeuralNetwork::new(config);
    /// ```
    #[napi(constructor)]
    pub fn new(config_json: String) -> Result<Self> {
        // Parse the configuration
        let config: NetworkConfig = match serde_json::from_str(&config_json) {
            Ok(cfg) => cfg,
            Err(e) => {
                return Err(napi::Error::new(
                    Status::InvalidArg,
                    format!("Invalid configuration: {}", e),
                ));
            }
        };

        // Validate configuration
        if config.layers.is_empty() {
            return Err(napi::Error::new(
                Status::InvalidArg,
                "Layers configuration cannot be empty",
            ));
        }

        for (i, &layer_size) in config.layers.iter().enumerate() {
            if layer_size == 0 {
                return Err(napi::Error::new(
                    Status::InvalidArg,
                    format!("Layer {} has invalid size: 0", i),
                ));
            }
        }

        Ok(NeuralNetwork {
            inner: Arc::new(Mutex::new(NetworkData {
                config,
                is_trained: false,
            })),
        })
    }

    /// Get network statistics
    ///
    /// # Returns
    /// JSON string containing network statistics
    #[napi]
    pub fn get_stats(&self) -> Result<String> {
        let data = self
            .inner
            .lock()
            .map_err(|e| napi::Error::new(Status::GenericFailure, e.to_string()))?;

        let stats = NetworkStats {
            num_layers: data.config.layers.len() as u32,
            total_neurons: data.config.layers.iter().sum(),
            total_connections: calculate_connections(&data.config.layers),
            network_type: data.config.activation.clone().unwrap_or_else(|| "sigmoid".to_string()),
        };

        match serde_json::to_string(&stats) {
            Ok(result) => Ok(result),
            Err(e) => Err(napi::Error::new(
                Status::GenericFailure,
                format!("Failed to serialize stats: {}", e),
            )),
        }
    }

    /// Process input data through the network
    ///
    /// # Arguments
    /// * `input_json` - JSON string containing input data array
    ///
    /// # Returns
    /// JSON string containing output data array
    #[napi]
    pub fn forward(&self, input_json: String) -> Result<String> {
        let data = self
            .inner
            .lock()
            .map_err(|e| napi::Error::new(Status::GenericFailure, e.to_string()))?;

        // Parse input
        let input: Vec<f32> = match serde_json::from_str(&input_json) {
            Ok(data) => data,
            Err(e) => {
                return Err(napi::Error::new(
                    Status::InvalidArg,
                    format!("Invalid input data: {}", e),
                ));
            }
        };

        if input.is_empty() {
            return Err(napi::Error::new(
                Status::InvalidArg,
                "Input data cannot be empty",
            ));
        }

        // Validate input size matches first layer
        if input.len() != data.config.layers[0] as usize {
            return Err(napi::Error::new(
                Status::InvalidArg,
                format!("Input size {} does not match first layer size {}",
                    input.len(), data.config.layers[0]),
            ));
        }

        // Simulate forward pass through network layers
        let output = simulate_forward_pass_with_layers(&input, &data.config.layers)
            .ok_or_else(|| napi::Error::new(
                Status::InvalidArg,
                "Forward pass failed: dimension mismatch",
            ))?;

        match serde_json::to_string(&output) {
            Ok(result) => Ok(result),
            Err(e) => Err(napi::Error::new(
                Status::GenericFailure,
                format!("Failed to serialize output: {}", e),
            )),
        }
    }

    /// Train the network with training data
    ///
    /// # Arguments
    /// * `training_data_json` - JSON string containing training samples
    /// * `config_json` - JSON string containing training configuration
    ///
    /// # Returns
    /// JSON string containing training result
    #[napi]
    pub fn train(&self, training_data_json: String, config_json: String) -> Result<String> {
        let mut data = self
            .inner
            .lock()
            .map_err(|e| napi::Error::new(Status::GenericFailure, e.to_string()))?;

        // Parse training data
        let _training_data: Vec<Vec<f32>> = match serde_json::from_str(&training_data_json) {
            Ok(data) => data,
            Err(e) => {
                return Err(napi::Error::new(
                    Status::InvalidArg,
                    format!("Invalid training data: {}", e),
                ));
            }
        };

        // Parse training config
        let config: TrainingConfig = match serde_json::from_str(&config_json) {
            Ok(cfg) => cfg,
            Err(e) => {
                return Err(napi::Error::new(
                    Status::InvalidArg,
                    format!("Invalid training config: {}", e),
                ));
            }
        };

        // Simulate training
        let epochs = config.epochs.unwrap_or(100);
        let start = std::time::Instant::now();

        // In real implementation, this would train the network using ruv-fann
        let final_error = simulate_training(epochs as f32);
        let elapsed = start.elapsed();

        data.is_trained = true;

        let result = TrainingResult {
            epochs_trained: epochs,
            final_error,
            total_time_ms: elapsed.as_millis() as u32,
        };

        match serde_json::to_string(&result) {
            Ok(result) => Ok(result),
            Err(e) => Err(napi::Error::new(
                Status::GenericFailure,
                format!("Failed to serialize result: {}", e),
            )),
        }
    }

    /// Predict output for given input
    ///
    /// # Arguments
    /// * `input_json` - JSON string containing input data array
    ///
    /// # Returns
    /// JSON string containing prediction result
    #[napi]
    pub fn predict(&self, input_json: String) -> Result<String> {
        let data = self
            .inner
            .lock()
            .map_err(|e| napi::Error::new(Status::GenericFailure, e.to_string()))?;

        if !data.is_trained {
            return Err(napi::Error::new(
                Status::GenericFailure,
                "Network must be trained before making predictions",
            ));
        }

        // Parse input
        let input: Vec<f32> = match serde_json::from_str(&input_json) {
            Ok(data) => data,
            Err(e) => {
                return Err(napi::Error::new(
                    Status::InvalidArg,
                    format!("Invalid input data: {}", e),
                ));
            }
        };

        // Validate input size matches first layer
        if input.len() != data.config.layers[0] as usize {
            return Err(napi::Error::new(
                Status::InvalidArg,
                format!("Input size {} does not match first layer size {}",
                    input.len(), data.config.layers[0]),
            ));
        }

        // Simulate forward pass through network layers
        let output = simulate_forward_pass_with_layers(&input, &data.config.layers)
            .ok_or_else(|| napi::Error::new(
                Status::InvalidArg,
                "Prediction failed: dimension mismatch",
            ))?;

        match serde_json::to_string(&output) {
            Ok(result) => Ok(result),
            Err(e) => Err(napi::Error::new(
                Status::GenericFailure,
                format!("Failed to serialize output: {}", e),
            )),
        }
    }

    /// Check if the network has been trained
    ///
    /// # Returns
    /// Boolean indicating training status
    #[napi]
    pub fn is_trained(&self) -> Result<bool> {
        let data = self
            .inner
            .lock()
            .map_err(|e| napi::Error::new(Status::GenericFailure, e.to_string()))?;

        Ok(data.is_trained)
    }

    /// Save the network to a file
    ///
    /// # Arguments
    /// * `path` - File path where network should be saved
    ///
    /// # Returns
    /// Result indicating success or failure
    #[napi]
    pub fn save(&self, path: String) -> Result<()> {
        // In a real implementation, this would save the network using ruv-fann
        std::fs::write(&path, b"network_data")
            .map_err(|e| napi::Error::new(
                Status::GenericFailure,
                format!("Failed to save network: {}", e),
            ))?;

        Ok(())
    }

    /// Load a network from a file
    ///
    /// # Arguments
    /// * `path` - File path where network is stored
    ///
    /// # Returns
    /// A loaded NeuralNetwork instance
    #[napi]
    pub fn load(&self, path: String) -> Result<NeuralNetwork> {
        // In a real implementation, this would load the network using ruv-fann
        std::fs::read(&path)
            .map_err(|e| napi::Error::new(
                Status::GenericFailure,
                format!("Failed to load network: {}", e),
            ))?;

        Ok(NeuralNetwork {
            inner: Arc::new(Mutex::new(NetworkData {
                config: NetworkConfig {
                    layers: vec![1],
                    activation: None,
                    learning_rate: None,
                    momentum: None,
                },
                is_trained: true,
            })),
        })
    }

    /// Batch process multiple inputs
    ///
    /// # Arguments
    /// * `inputs_json` - JSON string containing array of input arrays
    ///
    /// # Returns
    /// JSON string containing array of output arrays
    #[napi]
    pub fn batch_predict(&self, inputs_json: String) -> Result<String> {
        let data = self
            .inner
            .lock()
            .map_err(|e| napi::Error::new(Status::GenericFailure, e.to_string()))?;

        if !data.is_trained {
            return Err(napi::Error::new(
                Status::GenericFailure,
                "Network must be trained before making predictions",
            ));
        }

        // Parse inputs
        let inputs: Vec<Vec<f32>> = match serde_json::from_str(&inputs_json) {
            Ok(data) => data,
            Err(e) => {
                return Err(napi::Error::new(
                    Status::InvalidArg,
                    format!("Invalid input data: {}", e),
                ));
            }
        };

        let outputs: Vec<Vec<f32>> = inputs.iter()
            .filter_map(|input| simulate_forward_pass_with_layers(input, &data.config.layers))
            .collect();

        // Check if all inputs were processed successfully
        if outputs.len() != inputs.len() {
            return Err(napi::Error::new(
                Status::InvalidArg,
                "Some inputs have incorrect dimensionality",
            ));
        }

        match serde_json::to_string(&outputs) {
            Ok(result) => Ok(result),
            Err(e) => Err(napi::Error::new(
                Status::GenericFailure,
                format!("Failed to serialize output: {}", e),
            )),
        }
    }
}

// ============ Utility Functions ============

/// Calculate total connections in a network
fn calculate_connections(layers: &[u32]) -> u32 {
    let mut connections = 0;
    for i in 0..layers.len().saturating_sub(1) {
        connections += layers[i] * layers[i + 1];
    }
    connections
}

/// Simulate a forward pass through the network (properly handles layer architecture)
fn simulate_forward_pass_with_layers(input: &[f32], layers: &[u32]) -> Option<Vec<f32>> {
    // Validate input size matches first layer
    if input.len() != layers[0] as usize {
        return None;
    }

    // Simulate forward pass through each layer
    let mut current = input.to_vec();

    for i in 1..layers.len() {
        let next_size = layers[i] as usize;
        let mut next = vec![0.0; next_size];

        // Simple simulation: weighted sum and sigmoid
        for j in 0..next_size {
            let mut sum = 0.0;
            for (k, &val) in current.iter().enumerate() {
                // Simulate weights (deterministic for reproducibility)
                let weight = ((k as f32 + 1.0) * (j as f32 + 1.0)) / 100.0;
                sum += val * weight;
            }
            // Apply sigmoid activation
            next[j] = 1.0 / (1.0 + (-sum).exp());
        }
        current = next;
    }

    Some(current)
}

/// Simulate training process
fn simulate_training(epochs: f32) -> f32 {
    // Simulate error decay over epochs
    1.0 / (1.0 + epochs * 0.1)
}

/// Create a simple neural network
#[napi]
pub fn create_network(config_json: String) -> Result<NeuralNetwork> {
    // Parse the configuration
    let config: NetworkConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(napi::Error::new(
                Status::InvalidArg,
                format!("Invalid configuration: {}", e),
            ));
        }
    };

    // Validate configuration
    if config.layers.is_empty() {
        return Err(napi::Error::new(
            Status::InvalidArg,
            "Layers configuration cannot be empty",
        ));
    }

    for (i, &layer_size) in config.layers.iter().enumerate() {
        if layer_size == 0 {
            return Err(napi::Error::new(
                Status::InvalidArg,
                format!("Layer {} has invalid size: 0", i),
            ));
        }
    }

    Ok(NeuralNetwork {
        inner: Arc::new(Mutex::new(NetworkData {
            config,
            is_trained: false,
        })),
    })
}

/// Validate network configuration
#[napi]
pub fn validate_config(config_json: String) -> Result<bool> {
    let config: NetworkConfig = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(_) => return Ok(false),
    };

    if config.layers.is_empty() {
        return Ok(false);
    }

    for &layer_size in &config.layers {
        if layer_size == 0 {
            return Ok(false);
        }
    }

    Ok(true)
}
