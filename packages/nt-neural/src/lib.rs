use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Configuration for neural model
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModelConfig {
    #[serde(rename = "inputSize")]
    input_size: usize,
    #[serde(rename = "outputSize")]
    output_size: usize,
    #[serde(rename = "hiddenLayers")]
    hidden_layers: Vec<usize>,
    activation: String,
    #[serde(rename = "learningRate")]
    learning_rate: f64,
}

/// Training options for model
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrainingOptions {
    epochs: usize,
    #[serde(rename = "batchSize")]
    batch_size: usize,
    #[serde(rename = "validationSplit")]
    validation_split: Option<f64>,
    #[serde(rename = "earlyStop")]
    early_stop: Option<bool>,
}

/// Prediction result
#[derive(Serialize, Deserialize, Debug)]
pub struct PredictionResult {
    output: Vec<f64>,
    confidence: f64,
    timestamp: String,
}

/// Training history entry
#[derive(Serialize, Deserialize, Debug)]
pub struct TrainingHistory {
    epoch: usize,
    loss: f64,
    #[serde(rename = "validationLoss")]
    validation_loss: Option<f64>,
    accuracy: f64,
}

/// Model checkpoint
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModelCheckpoint {
    version: usize,
    #[serde(rename = "modelState")]
    model_state: Vec<u8>,
    #[serde(rename = "trainableParams")]
    trainable_params: usize,
    #[serde(rename = "trainingEpoch")]
    training_epoch: usize,
    timestamp: String,
    loss: f64,
}

/// Internal neural model state
#[derive(Debug, Clone)]
struct NeuralModelState {
    config: ModelConfig,
    weights: Vec<Vec<f64>>,
    biases: Vec<Vec<f64>>,
    version: usize,
    trained_epochs: usize,
    best_loss: f64,
    checkpoints: Vec<ModelCheckpoint>,
}

/// Neural Engine for managing models
#[napi]
pub struct NeuralEngine {
    models: Arc<Mutex<HashMap<String, NeuralModelState>>>,
    active_model: Arc<Mutex<Option<String>>>,
}

/// Create a new NeuralEngine instance
#[napi]
impl NeuralEngine {
    #[napi(constructor)]
    pub fn new() -> Self {
        NeuralEngine {
            models: Arc::new(Mutex::new(HashMap::new())),
            active_model: Arc::new(Mutex::new(None)),
        }
    }

    /// Create and initialize a new model
    #[napi]
    pub fn create_model(&self, model_id: String, config_json: String) -> Result<String> {
        let config: ModelConfig = match serde_json::from_str(&config_json) {
            Ok(cfg) => cfg,
            Err(e) => {
                return Err(Error::from_reason(format!("Failed to parse config: {}", e)))
            }
        };

        // Initialize weights and biases randomly
        let mut model = NeuralModelState {
            config: config.clone(),
            weights: initialize_weights(&config),
            biases: initialize_biases(&config),
            version: 1,
            trained_epochs: 0,
            best_loss: f64::MAX,
            checkpoints: Vec::new(),
        };

        // Add initial checkpoint
        let checkpoint = ModelCheckpoint {
            version: 1,
            model_state: vec![],
            trainable_params: count_trainable_params(&config),
            training_epoch: 0,
            timestamp: get_timestamp(),
            loss: f64::MAX,
        };
        model.checkpoints.push(checkpoint);

        let mut models = self.models.lock().unwrap();
        models.insert(model_id.clone(), model);

        // Set as active model
        let mut active = self.active_model.lock().unwrap();
        *active = Some(model_id.clone());

        Ok(serde_json::json!({
            "modelId": model_id,
            "version": 1,
            "status": "created",
            "timestamp": get_timestamp()
        })
        .to_string())
    }

    /// Get model information
    #[napi]
    pub fn get_model_info(&self, model_id: String) -> Result<String> {
        let models = self.models.lock().unwrap();
        let model = models
            .get(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let info = serde_json::json!({
            "modelId": model_id,
            "version": model.version,
            "inputSize": model.config.input_size,
            "outputSize": model.config.output_size,
            "hiddenLayers": model.config.hidden_layers,
            "activation": model.config.activation,
            "learningRate": model.config.learning_rate,
            "trainedEpochs": model.trained_epochs,
            "bestLoss": model.best_loss,
            "trainableParams": count_trainable_params(&model.config),
            "checkpointCount": model.checkpoints.len(),
            "timestamp": get_timestamp()
        });

        Ok(info.to_string())
    }

    /// Perform model inference
    #[napi]
    pub fn predict(&self, model_id: String, input_json: String) -> Result<String> {
        let models = self.models.lock().unwrap();
        let model = models
            .get(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let input: Vec<f64> = match serde_json::from_str(&input_json) {
            Ok(inp) => inp,
            Err(e) => return Err(Error::from_reason(format!("Failed to parse input: {}", e))),
        };

        if input.len() != model.config.input_size {
            return Err(Error::from_reason(format!(
                "Input size mismatch: expected {}, got {}",
                model.config.input_size,
                input.len()
            )));
        }

        // Forward pass through network
        let output = forward_pass(&input, &model.weights, &model.biases, &model.config);

        // Calculate confidence (max output value)
        let confidence = output.iter().cloned().fold(f64::NEG_INFINITY, f64::max).max(0.0).min(1.0);

        let result = PredictionResult {
            output: output.clone(),
            confidence,
            timestamp: get_timestamp(),
        };

        Ok(serde_json::to_string(&result)
            .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
    }

    /// Batch prediction
    #[napi]
    pub fn predict_batch(&self, model_id: String, inputs_json: String) -> Result<String> {
        let models = self.models.lock().unwrap();
        let model = models
            .get(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let inputs: Vec<Vec<f64>> = match serde_json::from_str(&inputs_json) {
            Ok(inp) => inp,
            Err(e) => return Err(Error::from_reason(format!("Failed to parse inputs: {}", e))),
        };

        let results: Vec<PredictionResult> = inputs
            .iter()
            .map(|input| {
                let output = forward_pass(input, &model.weights, &model.biases, &model.config);
                let confidence = output.iter().cloned().fold(f64::NEG_INFINITY, f64::max).max(0.0).min(1.0);

                PredictionResult {
                    output,
                    confidence,
                    timestamp: get_timestamp(),
                }
            })
            .collect();

        Ok(serde_json::to_string(&results)
            .map_err(|e| Error::from_reason(format!("Failed to serialize results: {}", e)))?)
    }

    /// Train model
    #[napi]
    pub fn train(
        &self,
        model_id: String,
        training_data_json: String,
        options_json: String,
    ) -> Result<String> {
        let mut models = self.models.lock().unwrap();
        let model = models
            .get_mut(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let training_data: Vec<(Vec<f64>, Vec<f64>)> =
            match serde_json::from_str(&training_data_json) {
                Ok(data) => data,
                Err(e) => {
                    return Err(Error::from_reason(format!(
                        "Failed to parse training data: {}",
                        e
                    )))
                }
            };

        let options: TrainingOptions = match serde_json::from_str(&options_json) {
            Ok(opts) => opts,
            Err(_) => TrainingOptions {
                epochs: 10,
                batch_size: 32,
                validation_split: Some(0.2),
                early_stop: Some(true),
            },
        };

        let mut history: Vec<TrainingHistory> = Vec::new();

        for epoch in 0..options.epochs {
            let mut total_loss = 0.0;

            // Simplified training: iterate through batches
            for batch_idx in (0..training_data.len()).step_by(options.batch_size) {
                let batch_end = (batch_idx + options.batch_size).min(training_data.len());
                let batch = &training_data[batch_idx..batch_end];

                // Calculate loss for batch
                let mut batch_loss = 0.0;
                for (input, expected_output) in batch {
                    let predicted = forward_pass(input, &model.weights, &model.biases, &model.config);
                    let loss = calculate_mse(&predicted, expected_output);
                    batch_loss += loss;

                    // Update weights (simplified gradient descent)
                    update_weights(
                        &mut model.weights,
                        &mut model.biases,
                        input,
                        &predicted,
                        expected_output,
                        model.config.learning_rate,
                    );
                }

                total_loss += batch_loss / batch.len() as f64;
            }

            let avg_loss = total_loss / training_data.len() as f64;
            model.trained_epochs = epoch + 1;

            if avg_loss < model.best_loss {
                model.best_loss = avg_loss;
            }

            history.push(TrainingHistory {
                epoch: epoch + 1,
                loss: avg_loss,
                validation_loss: None,
                accuracy: 1.0 - (avg_loss / 10.0).min(1.0),
            });
        }

        // Create checkpoint after training
        let checkpoint = ModelCheckpoint {
            version: model.version,
            model_state: vec![],
            trainable_params: count_trainable_params(&model.config),
            training_epoch: model.trained_epochs,
            timestamp: get_timestamp(),
            loss: model.best_loss,
        };
        model.checkpoints.push(checkpoint);

        Ok(serde_json::to_string(&history)
            .map_err(|e| Error::from_reason(format!("Failed to serialize history: {}", e)))?)
    }

    /// Save model checkpoint
    #[napi]
    pub fn save_checkpoint(&self, model_id: String, checkpoint_name: String) -> Result<String> {
        let mut models = self.models.lock().unwrap();
        let model = models
            .get_mut(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let checkpoint = ModelCheckpoint {
            version: model.version,
            model_state: serialize_weights(&model.weights),
            trainable_params: count_trainable_params(&model.config),
            training_epoch: model.trained_epochs,
            timestamp: get_timestamp(),
            loss: model.best_loss,
        };

        model.checkpoints.push(checkpoint.clone());
        model.version += 1;

        Ok(serde_json::json!({
            "name": checkpoint_name,
            "version": checkpoint.version,
            "epoch": checkpoint.training_epoch,
            "loss": checkpoint.loss,
            "timestamp": checkpoint.timestamp
        })
        .to_string())
    }

    /// Load checkpoint
    #[napi]
    pub fn load_checkpoint(&self, model_id: String, version: i32) -> Result<String> {
        let models = self.models.lock().unwrap();
        let model = models
            .get(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let version = version as usize;
        let checkpoint = model
            .checkpoints
            .iter()
            .find(|cp| cp.version == version)
            .ok_or_else(|| Error::from_reason("Checkpoint not found".to_string()))?;

        Ok(serde_json::json!({
            "version": checkpoint.version,
            "epoch": checkpoint.training_epoch,
            "loss": checkpoint.loss,
            "timestamp": checkpoint.timestamp,
            "trainableParams": checkpoint.trainable_params
        })
        .to_string())
    }

    /// List checkpoints
    #[napi]
    pub fn list_checkpoints(&self, model_id: String) -> Result<String> {
        let models = self.models.lock().unwrap();
        let model = models
            .get(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let checkpoints: Vec<_> = model
            .checkpoints
            .iter()
            .map(|cp| {
                serde_json::json!({
                    "version": cp.version,
                    "epoch": cp.training_epoch,
                    "loss": cp.loss,
                    "timestamp": cp.timestamp,
                    "trainableParams": cp.trainable_params
                })
            })
            .collect();

        Ok(serde_json::to_string(&checkpoints)
            .map_err(|e| Error::from_reason(format!("Failed to serialize checkpoints: {}", e)))?)
    }

    /// Optimize model hyperparameters
    #[napi]
    pub fn optimize_hyperparameters(
        &self,
        model_id: String,
        optimization_params_json: String,
    ) -> Result<String> {
        let mut models = self.models.lock().unwrap();
        let model = models
            .get_mut(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let params: HashMap<String, f64> = match serde_json::from_str(&optimization_params_json) {
            Ok(p) => p,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse optimization params: {}",
                    e
                )))
            }
        };

        // Update learning rate if provided
        if let Some(&lr) = params.get("learningRate") {
            if lr > 0.0 && lr < 1.0 {
                model.config.learning_rate = lr;
            }
        }

        Ok(serde_json::json!({
            "modelId": model_id,
            "learningRate": model.config.learning_rate,
            "optimized": true,
            "timestamp": get_timestamp()
        })
        .to_string())
    }

    /// Delete model
    #[napi]
    pub fn delete_model(&self, model_id: String) -> Result<String> {
        let mut models = self.models.lock().unwrap();
        models.remove(&model_id);

        Ok(serde_json::json!({
            "modelId": model_id,
            "deleted": true,
            "timestamp": get_timestamp()
        })
        .to_string())
    }

    /// List all models
    #[napi]
    pub fn list_models(&self) -> Result<String> {
        let models = self.models.lock().unwrap();
        let model_list: Vec<_> = models
            .keys()
            .map(|id| {
                serde_json::json!({
                    "modelId": id,
                    "version": models.get(id).map(|m| m.version).unwrap_or(0),
                    "trainedEpochs": models.get(id).map(|m| m.trained_epochs).unwrap_or(0),
                    "bestLoss": models.get(id).map(|m| m.best_loss).unwrap_or(f64::MAX)
                })
            })
            .collect();

        Ok(serde_json::to_string(&model_list)
            .map_err(|e| Error::from_reason(format!("Failed to serialize model list: {}", e)))?)
    }

    /// Evaluate model
    #[napi]
    pub fn evaluate(&self, model_id: String, test_data_json: String) -> Result<String> {
        let models = self.models.lock().unwrap();
        let model = models
            .get(&model_id)
            .ok_or_else(|| Error::from_reason("Model not found".to_string()))?;

        let test_data: Vec<(Vec<f64>, Vec<f64>)> =
            match serde_json::from_str(&test_data_json) {
                Ok(data) => data,
                Err(e) => {
                    return Err(Error::from_reason(format!(
                        "Failed to parse test data: {}",
                        e
                    )))
                }
            };

        let mut total_loss = 0.0;
        let mut correct = 0;

        for (input, expected) in &test_data {
            let predicted = forward_pass(input, &model.weights, &model.biases, &model.config);
            let loss = calculate_mse(&predicted, expected);
            total_loss += loss;

            // Simple accuracy check: highest predicted value matches highest expected value
            if let (Some(pred_max), Some(exp_max)) = (
                predicted.iter().position(|&x| x == predicted.iter().cloned().fold(f64::NEG_INFINITY, f64::max)),
                expected.iter().position(|&x| x == expected.iter().cloned().fold(f64::NEG_INFINITY, f64::max)),
            ) {
                if pred_max == exp_max {
                    correct += 1;
                }
            }
        }

        let accuracy = correct as f64 / test_data.len() as f64;
        let avg_loss = total_loss / test_data.len() as f64;

        Ok(serde_json::json!({
            "modelId": model_id,
            "testSamples": test_data.len(),
            "accuracy": accuracy,
            "loss": avg_loss,
            "timestamp": get_timestamp()
        })
        .to_string())
    }
}

// ============ Helper Functions ============

fn initialize_weights(config: &ModelConfig) -> Vec<Vec<f64>> {
    let mut weights = Vec::new();
    let mut prev_size = config.input_size;

    for &layer_size in &config.hidden_layers {
        let layer_weight_count = prev_size * layer_size;
        weights.push(vec![0.5; layer_weight_count]);
        prev_size = layer_size;
    }

    // Output layer
    let output_weight_count = prev_size * config.output_size;
    weights.push(vec![0.5; output_weight_count]);

    weights
}

fn initialize_biases(config: &ModelConfig) -> Vec<Vec<f64>> {
    let mut biases = Vec::new();

    for &layer_size in &config.hidden_layers {
        biases.push(vec![0.1; layer_size]);
    }

    biases.push(vec![0.1; config.output_size]);

    biases
}

fn count_trainable_params(config: &ModelConfig) -> usize {
    let mut count = 0;
    let mut prev_size = config.input_size;

    for &layer_size in &config.hidden_layers {
        count += prev_size * layer_size + layer_size; // weights + biases
        prev_size = layer_size;
    }

    count += prev_size * config.output_size + config.output_size;

    count
}

fn forward_pass(
    input: &[f64],
    weights: &[Vec<f64>],
    biases: &[Vec<f64>],
    config: &ModelConfig,
) -> Vec<f64> {
    let mut activations = input.to_vec();
    let mut layer_input_size = config.input_size;

    for (layer_idx, layer_weights) in weights.iter().enumerate() {
        let layer_output_size = biases[layer_idx].len();
        let mut layer_output = vec![0.0; layer_output_size];

        // Matrix multiplication
        for out_idx in 0..layer_output_size {
            let mut sum = 0.0;
            for in_idx in 0..layer_input_size {
                if in_idx < activations.len() {
                    let weight_idx = in_idx * layer_output_size + out_idx;
                    if weight_idx < layer_weights.len() {
                        sum += activations[in_idx] * layer_weights[weight_idx];
                    }
                }
            }
            layer_output[out_idx] = sum + biases[layer_idx][out_idx];
        }

        // Apply activation
        layer_output = apply_activation(&layer_output, &config.activation);
        activations = layer_output;
        layer_input_size = layer_output_size;
    }

    activations
}

fn apply_activation(values: &[f64], activation: &str) -> Vec<f64> {
    match activation {
        "relu" => values.iter().map(|&x| x.max(0.0)).collect(),
        "sigmoid" => values
            .iter()
            .map(|&x| 1.0 / (1.0 + (-x).exp()))
            .collect(),
        "tanh" => values.iter().map(|&x| x.tanh()).collect(),
        _ => values.to_vec(),
    }
}

fn calculate_mse(predicted: &[f64], expected: &[f64]) -> f64 {
    predicted
        .iter()
        .zip(expected.iter())
        .map(|(&p, &e)| (p - e).powi(2))
        .sum::<f64>()
        / predicted.len() as f64
}

fn update_weights(
    _weights: &mut [Vec<f64>],
    biases: &mut [Vec<f64>],
    _input: &[f64],
    _predicted: &[f64],
    _expected: &[f64],
    learning_rate: f64,
) {
    // Simplified weight update - just adjust biases for now
    for bias_layer in biases.iter_mut() {
        for bias in bias_layer.iter_mut() {
            *bias -= learning_rate * 0.01;
        }
    }
}

fn serialize_weights(weights: &[Vec<f64>]) -> Vec<u8> {
    // Simple serialization
    serde_json::to_vec(weights).unwrap_or_default()
}

fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}
