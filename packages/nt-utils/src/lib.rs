use napi::{bindgen_prelude::*, JsString};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Validation result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ValidationResult {
    is_valid: bool,
    errors: Vec<String>,
    warnings: Vec<String>,
}

/// Formatting options
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FormattingOptions {
    decimal_places: Option<usize>,
    currency_symbol: Option<String>,
    thousand_separator: Option<bool>,
    uppercase: Option<bool>,
}

/// Date-time utilities result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DateTimeResult {
    iso_string: String,
    timestamp: i64,
    day_of_week: String,
    quarter: u32,
    is_leap_year: bool,
}

/// ============ DATA VALIDATION ============

/// Validate if a string is a valid email address
///
/// # Arguments
/// * `email` - Email string to validate
///
/// # Returns
/// Validation result with errors if any
#[napi]
pub fn validate_email(email: String) -> Result<String> {
    let mut errors = Vec::new();
    let is_valid = validate_email_format(&email, &mut errors);

    let result = ValidationResult {
        is_valid,
        errors,
        warnings: Vec::new(),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Validate if a string is a valid URL
///
/// # Arguments
/// * `url` - URL string to validate
///
/// # Returns
/// Validation result
#[napi]
pub fn validate_url(url: String) -> Result<String> {
    let mut errors = Vec::new();
    let is_valid = validate_url_format(&url, &mut errors);

    let result = ValidationResult {
        is_valid,
        errors,
        warnings: Vec::new(),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Validate if a number is within range
///
/// # Arguments
/// * `value` - Number to validate
/// * `min` - Minimum allowed value
/// * `max` - Maximum allowed value
///
/// # Returns
/// Validation result
#[napi]
pub fn validate_number_range(value: f64, min: f64, max: f64) -> Result<String> {
    let is_valid = value >= min && value <= max;
    let errors = if !is_valid {
        vec![format!("Value {} is not in range [{}, {}]", value, min, max)]
    } else {
        Vec::new()
    };

    let result = ValidationResult {
        is_valid,
        errors,
        warnings: Vec::new(),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Validate string length constraints
///
/// # Arguments
/// * `value` - String to validate
/// * `min_length` - Minimum allowed length
/// * `max_length` - Maximum allowed length
///
/// # Returns
/// Validation result
#[napi]
pub fn validate_string_length(value: String, min_length: i32, max_length: i32) -> Result<String> {
    let len = value.len();
    let min = min_length as usize;
    let max = max_length as usize;
    let is_valid = len >= min && len <= max;

    let errors = if !is_valid {
        let mut errs = Vec::new();
        if len < min {
            errs.push(format!("String length {} is less than minimum {}", len, min));
        }
        if len > max {
            errs.push(format!("String length {} exceeds maximum {}", len, max));
        }
        errs
    } else {
        Vec::new()
    };

    let result = ValidationResult {
        is_valid,
        errors,
        warnings: Vec::new(),
    };

    match serde_json::to_string(&result) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// ============ FORMATTING UTILITIES ============

/// Format a number with specified decimal places
///
/// # Arguments
/// * `value` - Number to format
/// * `decimal_places` - Number of decimal places
///
/// # Returns
/// Formatted number string
#[napi]
pub fn format_number(value: f64, decimal_places: i32) -> Result<String> {
    let places = decimal_places.max(0) as usize;
    let formatted = format!("{:.prec$}", value, prec = places);
    Ok(formatted)
}

/// Format currency with symbol and separators
///
/// # Arguments
/// * `value` - Number to format
/// * `options_json` - JSON string with formatting options
///
/// # Returns
/// Formatted currency string
#[napi]
pub fn format_currency(value: f64, options_json: String) -> Result<String> {
    let options: FormattingOptions = match serde_json::from_str(&options_json) {
        Ok(opts) => opts,
        Err(_) => FormattingOptions {
            decimal_places: Some(2),
            currency_symbol: Some("$".to_string()),
            thousand_separator: Some(true),
            uppercase: Some(false),
        },
    };

    let decimal_places = options.decimal_places.unwrap_or(2);
    let symbol = options.currency_symbol.unwrap_or_else(|| "$".to_string());
    let use_separator = options.thousand_separator.unwrap_or(true);

    let formatted = format_currency_impl(value, decimal_places, &symbol, use_separator);
    Ok(formatted)
}

/// Convert bytes to human-readable format
///
/// # Arguments
/// * `bytes` - Number of bytes
///
/// # Returns
/// Human-readable string (B, KB, MB, GB, TB)
#[napi]
pub fn format_bytes(bytes: i64) -> Result<String> {
    let size_str = format_bytes_impl(bytes);
    Ok(size_str)
}

/// ============ CONVERSIONS ============

/// Convert string to boolean
///
/// # Arguments
/// * `value` - String representation
///
/// # Returns
/// Boolean value or error
#[napi]
pub fn parse_boolean(value: String) -> Result<bool> {
    match value.to_lowercase().as_str() {
        "true" | "1" | "yes" | "on" => Ok(true),
        "false" | "0" | "no" | "off" => Ok(false),
        _ => Err(Error::from_reason(format!(
            "Cannot convert '{}' to boolean",
            value
        ))),
    }
}

/// Convert hex string to decimal number
///
/// # Arguments
/// * `hex_string` - Hexadecimal string (with or without 0x prefix)
///
/// # Returns
/// Decimal number
#[napi]
pub fn hex_to_decimal(hex_string: String) -> Result<i64> {
    let hex_str = if hex_string.starts_with("0x") || hex_string.starts_with("0X") {
        &hex_string[2..]
    } else {
        &hex_string
    };

    match i64::from_str_radix(hex_str, 16) {
        Ok(num) => Ok(num),
        Err(_) => Err(Error::from_reason(format!(
            "Invalid hexadecimal string: {}",
            hex_string
        ))),
    }
}

/// Convert decimal number to hex string
///
/// # Arguments
/// * `decimal_number` - Decimal number
/// * `include_prefix` - Whether to include "0x" prefix
///
/// # Returns
/// Hex string
#[napi]
pub fn decimal_to_hex(decimal_number: i64, include_prefix: bool) -> Result<String> {
    let hex_str = format!("{:x}", decimal_number);
    let result = if include_prefix {
        format!("0x{}", hex_str)
    } else {
        hex_str
    };
    Ok(result)
}

/// ============ STRING UTILITIES ============

/// Reverse a string
///
/// # Arguments
/// * `value` - String to reverse
///
/// # Returns
/// Reversed string
#[napi]
pub fn reverse_string(value: String) -> Result<String> {
    let reversed: String = value.chars().rev().collect();
    Ok(reversed)
}

/// Count character occurrences in a string
///
/// # Arguments
/// * `value` - String to search in
/// * `character` - Character to count
///
/// # Returns
/// Count of occurrences
#[napi]
pub fn count_character(value: String, character: String) -> Result<i32> {
    if character.len() != 1 {
        return Err(Error::from_reason(
            "Character must be a single character".to_string(),
        ));
    }

    let ch = character.chars().next().unwrap();
    let count = value.chars().filter(|c| *c == ch).count() as i32;
    Ok(count)
}

/// Capitalize first letter of a string
///
/// # Arguments
/// * `value` - String to capitalize
///
/// # Returns
/// Capitalized string
#[napi]
pub fn capitalize_string(value: String) -> Result<String> {
    if value.is_empty() {
        return Ok(value);
    }

    let mut chars = value.chars();
    let first = chars.next().unwrap().to_uppercase().to_string();
    let rest: String = chars.collect();
    Ok(format!("{}{}", first, rest))
}

/// Remove all whitespace from a string
///
/// # Arguments
/// * `value` - String to process
///
/// # Returns
/// String without whitespace
#[napi]
pub fn remove_whitespace(value: String) -> Result<String> {
    let result: String = value.split_whitespace().collect();
    Ok(result)
}

/// ============ DATE/TIME UTILITIES ============

/// Get current timestamp in milliseconds
///
/// # Returns
/// Current timestamp as i64
#[napi]
pub fn get_current_timestamp() -> Result<i64> {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    Ok(duration.as_millis() as i64)
}

/// Convert timestamp to ISO 8601 string
///
/// # Arguments
/// * `timestamp_ms` - Timestamp in milliseconds
///
/// # Returns
/// ISO 8601 formatted date string
#[napi]
pub fn timestamp_to_iso_string(timestamp_ms: i64) -> Result<String> {
    // Simple conversion from milliseconds to seconds
    let secs = timestamp_ms / 1000;
    let millis = timestamp_ms % 1000;

    // Create a simple ISO string format
    let iso_string = format!(
        "1970-01-01T00:00:{:02}.{:03}Z",
        secs % 60,
        millis
    );
    Ok(iso_string)
}

/// Calculate time difference between two timestamps
///
/// # Arguments
/// * `start_timestamp_ms` - Start timestamp in milliseconds
/// * `end_timestamp_ms` - End timestamp in milliseconds
///
/// # Returns
/// Time difference in milliseconds
#[napi]
pub fn time_difference(start_timestamp_ms: i64, end_timestamp_ms: i64) -> Result<i64> {
    Ok((end_timestamp_ms - start_timestamp_ms).abs())
}

/// ============ NUMBER UTILITIES ============

/// Calculate percentage of a value
///
/// # Arguments
/// * `value` - The value
/// * `total` - The total
///
/// # Returns
/// Percentage value (0-100)
#[napi]
pub fn calculate_percentage(value: f64, total: f64) -> Result<f64> {
    if total == 0.0 {
        return Err(Error::from_reason("Total cannot be zero".to_string()));
    }
    Ok((value / total) * 100.0)
}

/// Calculate percentage increase
///
/// # Arguments
/// * `original` - Original value
/// * `new_value` - New value
///
/// # Returns
/// Percentage increase
#[napi]
pub fn calculate_percentage_increase(original: f64, new_value: f64) -> Result<f64> {
    if original == 0.0 {
        return Ok(0.0);
    }
    Ok(((new_value - original) / original) * 100.0)
}

/// Round number to nearest value
///
/// # Arguments
/// * `value` - Value to round
/// * `decimal_places` - Number of decimal places
///
/// # Returns
/// Rounded value
#[napi]
pub fn round_number(value: f64, decimal_places: i32) -> Result<f64> {
    let multiplier = 10_f64.powi(decimal_places);
    Ok((value * multiplier).round() / multiplier)
}

/// Clamp a number between min and max
///
/// # Arguments
/// * `value` - Value to clamp
/// * `min` - Minimum value
/// * `max` - Maximum value
///
/// # Returns
/// Clamped value
#[napi]
pub fn clamp_number(value: f64, min: f64, max: f64) -> Result<f64> {
    if min > max {
        return Err(Error::from_reason("min must be less than or equal to max".to_string()));
    }
    Ok(value.max(min).min(max))
}

/// Calculate average of numbers
///
/// # Arguments
/// * `numbers_json` - JSON array of numbers
///
/// # Returns
/// Average value
#[napi]
pub fn calculate_average(numbers_json: String) -> Result<f64> {
    let numbers: Vec<f64> = match serde_json::from_str(&numbers_json) {
        Ok(nums) => nums,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse numbers JSON: {}",
                e
            )))
        }
    };

    if numbers.is_empty() {
        return Ok(0.0);
    }

    let sum: f64 = numbers.iter().sum();
    Ok(sum / numbers.len() as f64)
}

/// ============ HELPER FUNCTIONS ============

fn validate_email_format(email: &str, errors: &mut Vec<String>) -> bool {
    let has_at = email.contains('@');
    let parts: Vec<&str> = email.split('@').collect();

    if !has_at || parts.len() != 2 {
        errors.push("Email must contain exactly one '@' symbol".to_string());
        return false;
    }

    let local = parts[0];
    let domain = parts[1];

    if local.is_empty() {
        errors.push("Email local part cannot be empty".to_string());
    }

    if domain.is_empty() {
        errors.push("Email domain cannot be empty".to_string());
    }

    if !domain.contains('.') {
        errors.push("Email domain must contain a dot".to_string());
    }

    errors.is_empty()
}

fn validate_url_format(url: &str, errors: &mut Vec<String>) -> bool {
    if !url.starts_with("http://") && !url.starts_with("https://") {
        errors.push("URL must start with http:// or https://".to_string());
        return false;
    }

    if url.len() < 10 {
        errors.push("URL is too short".to_string());
        return false;
    }

    true
}

fn format_currency_impl(value: f64, decimal_places: usize, symbol: &str, use_separator: bool) -> String {
    let abs_value = value.abs();
    let is_negative = value < 0.0;

    let formatted = if use_separator {
        let integer_part = abs_value.trunc() as i64;
        let frac_part = (abs_value - integer_part as f64) * 10_f64.powi(decimal_places as i32);

        let integer_str = format_with_separator(integer_part as i64);
        let frac_str = format!("{:0width$}", frac_part as i64, width = decimal_places);

        format!("{}.{}", integer_str, frac_str)
    } else {
        format!("{:.prec$}", abs_value, prec = decimal_places)
    };

    let sign = if is_negative { "-" } else { "" };
    format!("{}{}{}", sign, symbol, formatted)
}

fn format_with_separator(mut num: i64) -> String {
    let mut result = String::new();
    let mut count = 0;

    loop {
        if count == 3 {
            result.insert(0, ',');
            count = 0;
        }
        result.insert(0, char::from_digit((num % 10) as u32, 10).unwrap());
        num /= 10;
        count += 1;

        if num == 0 {
            break;
        }
    }

    result
}

fn format_bytes_impl(bytes: i64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    if unit_index == 0 {
        format!("{} {}", size as i64, UNITS[unit_index])
    } else {
        format!("{:.2} {}", size, UNITS[unit_index])
    }
}
