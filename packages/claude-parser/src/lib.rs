use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde_json::Value as JsonValue;

/// Parse a JSON string and return the parsed object
#[napi(ts_return_type = "any")]
pub fn parse(
  json_string: String,
) -> Result<JsonValue> {
  // Parse the JSON string using serde_json
  match serde_json::from_str::<JsonValue>(&json_string) {
    Ok(value) => Ok(value),
    Err(e) => Err(Error::from_reason(format!("JSON parse error: {}", e))),
  }
}

/// Parse a JSON stream (newline-delimited JSON)
#[napi(ts_return_type = "any[]")]
pub fn parse_stream(
  json_stream: String,
) -> Result<Vec<JsonValue>> {
  let lines: Vec<&str> = json_stream.lines().collect();
  let mut results = Vec::new();

  for line in lines {
    let trimmed = line.trim();

    // Skip empty lines
    if trimmed.is_empty() {
      continue;
    }

    // Parse each line as JSON
    match serde_json::from_str::<JsonValue>(trimmed) {
      Ok(value) => results.push(value),
      Err(e) => {
        return Err(Error::from_reason(format!(
          "JSON stream parse error: {}",
          e
        )))
      }
    }
  }

  Ok(results)
}

/// Validate if a string is valid JSON
#[napi]
pub fn is_valid_json(json_string: String) -> bool {
  serde_json::from_str::<JsonValue>(&json_string).is_ok()
}

/// Get the type of a JSON value as a string
#[napi]
pub fn get_json_type(json_string: String) -> Result<String> {
  match serde_json::from_str::<JsonValue>(&json_string) {
    Ok(value) => {
      let type_str = match value {
        JsonValue::Null => "null",
        JsonValue::Bool(_) => "boolean",
        JsonValue::Number(_) => "number",
        JsonValue::String(_) => "string",
        JsonValue::Array(_) => "array",
        JsonValue::Object(_) => "object",
      };
      Ok(type_str.to_string())
    }
    Err(e) => Err(Error::from_reason(format!("JSON parse error: {}", e))),
  }
}
