use napi::{bindgen_prelude::*, JsBuffer, JsObject, JsString};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Represents a context with metadata and content
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Context {
    id: String,
    content: String,
    metadata: serde_json::Value,
}

/// Optimization options for context processing
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OptimizationOptions {
    remove_duplicates: Option<bool>,
    compress_whitespace: Option<bool>,
    remove_empty_lines: Option<bool>,
    max_length: Option<usize>,
}

/// Process context data and extract key information
///
/// # Arguments
/// * `context_json` - JSON string containing context data
///
/// # Returns
/// JSON string with processed context
#[napi]
pub fn process_context(context_json: String) -> Result<String> {
    // Parse input JSON
    let context: Context = match serde_json::from_str(&context_json) {
        Ok(ctx) => ctx,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse context JSON: {}",
                e
            )))
        }
    };

    // Process the context
    let processed = ProcessedContext {
        id: context.id,
        original_length: context.content.len(),
        processed_content: process_text(&context.content),
        token_count: estimate_token_count(&context.content),
        metadata: context.metadata,
        timestamp: get_timestamp(),
    };

    // Convert to JSON and return
    match serde_json::to_string(&processed) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Optimize context for better performance and reduced size
///
/// # Arguments
/// * `context_json` - JSON string containing context data
/// * `options_json` - JSON string containing optimization options
///
/// # Returns
/// JSON string with optimized context
#[napi]
pub fn optimize_context(context_json: String, options_json: String) -> Result<String> {
    // Parse input JSON
    let context: Context = match serde_json::from_str(&context_json) {
        Ok(ctx) => ctx,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse context JSON: {}",
                e
            )))
        }
    };

    let options: OptimizationOptions = match serde_json::from_str(&options_json) {
        Ok(opts) => opts,
        Err(_) => OptimizationOptions {
            remove_duplicates: Some(true),
            compress_whitespace: Some(true),
            remove_empty_lines: Some(true),
            max_length: None,
        },
    };

    // Apply optimizations
    let mut optimized_content = context.content.clone();

    // Remove empty lines if requested
    if options.remove_empty_lines.unwrap_or(true) {
        optimized_content = optimized_content
            .lines()
            .filter(|line| !line.trim().is_empty())
            .collect::<Vec<_>>()
            .join("\n");
    }

    // Compress whitespace if requested
    if options.compress_whitespace.unwrap_or(true) {
        optimized_content = optimized_content
            .lines()
            .map(|line| line.split_whitespace().collect::<Vec<_>>().join(" "))
            .collect::<Vec<_>>()
            .join("\n");
    }

    // Remove duplicates if requested
    if options.remove_duplicates.unwrap_or(true) {
        let mut lines: Vec<&str> = optimized_content.lines().collect();
        lines.sort_unstable();
        lines.dedup();
        optimized_content = lines.join("\n");
    }

    // Apply max length if specified
    if let Some(max_len) = options.max_length {
        if optimized_content.len() > max_len {
            optimized_content.truncate(max_len);
            optimized_content.push_str("...");
        }
    }

    // Create optimization result
    let result = OptimizationResult {
        id: context.id,
        original_size: context.content.len(),
        optimized_size: optimized_content.len(),
        compression_ratio: calculate_compression_ratio(
            context.content.len(),
            optimized_content.len(),
        ),
        optimized_content,
        metadata: context.metadata,
        timestamp: get_timestamp(),
    };

    // Convert to JSON and return
    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Batch process multiple contexts
///
/// # Arguments
/// * `contexts_json` - JSON array string containing multiple context objects
///
/// # Returns
/// JSON array string with processed contexts
#[napi]
pub fn batch_process_contexts(contexts_json: String) -> Result<String> {
    // Parse input JSON array
    let contexts: Vec<Context> = match serde_json::from_str(&contexts_json) {
        Ok(ctxs) => ctxs,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse contexts JSON: {}",
                e
            )))
        }
    };

    // Process each context
    let results: Vec<ProcessedContext> = contexts
        .iter()
        .map(|ctx| ProcessedContext {
            id: ctx.id.clone(),
            original_length: ctx.content.len(),
            processed_content: process_text(&ctx.content),
            token_count: estimate_token_count(&ctx.content),
            metadata: ctx.metadata.clone(),
            timestamp: get_timestamp(),
        })
        .collect();

    // Convert to JSON and return
    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Extract key phrases from context
///
/// # Arguments
/// * `context_json` - JSON string containing context data
/// * `max_phrases` - Maximum number of phrases to extract
///
/// # Returns
/// JSON array of extracted phrases
#[napi]
pub fn extract_key_phrases(context_json: String, max_phrases: i32) -> Result<String> {
    // Parse input JSON
    let context: Context = match serde_json::from_str(&context_json) {
        Ok(ctx) => ctx,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse context JSON: {}",
                e
            )))
        }
    };

    // Extract phrases
    let phrases = extract_phrases(&context.content, max_phrases as usize);

    // Convert to JSON and return
    match serde_json::to_string(&phrases) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize phrases: {}", e))),
    }
}

/// Calculate context similarity between two contexts (0.0 to 1.0)
///
/// # Arguments
/// * `context1_json` - First context as JSON string
/// * `context2_json` - Second context as JSON string
///
/// # Returns
/// Similarity score as a number
#[napi]
pub fn calculate_similarity(context1_json: String, context2_json: String) -> Result<f64> {
    // Parse both contexts
    let context1: Context = serde_json::from_str(&context1_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse context1: {}", e)))?;

    let context2: Context = serde_json::from_str(&context2_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse context2: {}", e)))?;

    // Calculate similarity using simple token overlap
    let tokens1: std::collections::HashSet<&str> =
        context1.content.split_whitespace().collect();
    let tokens2: std::collections::HashSet<&str> =
        context2.content.split_whitespace().collect();

    let intersection = tokens1.intersection(&tokens2).count();
    let union = tokens1.union(&tokens2).count();

    let similarity = if union == 0 {
        0.0
    } else {
        intersection as f64 / union as f64
    };

    Ok(similarity)
}

// ============ Helper Functions ============

/// Result of processing a context
#[derive(Serialize, Deserialize, Debug)]
struct ProcessedContext {
    id: String,
    original_length: usize,
    processed_content: String,
    token_count: usize,
    metadata: serde_json::Value,
    timestamp: String,
}

/// Result of optimizing a context
#[derive(Serialize, Deserialize, Debug)]
struct OptimizationResult {
    id: String,
    original_size: usize,
    optimized_size: usize,
    compression_ratio: f64,
    optimized_content: String,
    metadata: serde_json::Value,
    timestamp: String,
}

/// Process text content (basic processing)
fn process_text(content: &str) -> String {
    // Normalize whitespace
    content
        .lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
}

/// Estimate token count (rough approximation)
fn estimate_token_count(content: &str) -> usize {
    // Simple heuristic: average word length is ~4 chars, plus 1 for space
    content.split_whitespace().count()
}

/// Calculate compression ratio
fn calculate_compression_ratio(original: usize, compressed: usize) -> f64 {
    if original == 0 {
        0.0
    } else {
        (original - compressed) as f64 / original as f64
    }
}

/// Get current timestamp as ISO 8601 string
fn get_timestamp() -> String {
    // Simple timestamp using std::time
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}

/// Extract key phrases from content
fn extract_phrases(content: &str, max_phrases: usize) -> Vec<String> {
    let words: Vec<&str> = content.split_whitespace().collect();

    // Extract n-grams (bigrams for simplicity)
    let mut phrases: Vec<String> = Vec::new();

    for i in 0..words.len().saturating_sub(1) {
        let phrase = format!("{} {}", words[i], words[i + 1]);
        if !phrases.contains(&phrase) {
            phrases.push(phrase);
        }

        if phrases.len() >= max_phrases {
            break;
        }
    }

    phrases
}
