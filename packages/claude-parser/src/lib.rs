use napi::bindgen_prelude::*;
use napi_derive::napi;

/// Parse a JSON string and return the parsed object
#[napi]
pub fn parse(
  env: Env,
  json_string: String,
) -> Result<JsUnknown> {
  // Parse the JSON string using serde_json
  match serde_json::from_str::<serde_json::Value>(&json_string) {
    Ok(value) => convert_value_to_js(&env, value),
    Err(e) => Err(Error::from_reason(format!("JSON parse error: {}", e))),
  }
}

/// Parse a JSON stream (newline-delimited JSON)
#[napi]
pub fn parse_stream(
  env: Env,
  json_stream: String,
) -> Result<Vec<JsUnknown>> {
  let lines: Vec<&str> = json_stream.lines().collect();
  let mut results = Vec::new();

  for line in lines {
    let trimmed = line.trim();

    // Skip empty lines
    if trimmed.is_empty() {
      continue;
    }

    // Parse each line as JSON
    match serde_json::from_str::<serde_json::Value>(trimmed) {
      Ok(value) => {
        match convert_value_to_js(&env, value) {
          Ok(js_value) => results.push(js_value),
          Err(e) => {
            return Err(Error::from_reason(format!(
              "Error converting JSON value: {}",
              e
            )))
          }
        }
      }
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
  serde_json::from_str::<serde_json::Value>(&json_string).is_ok()
}

/// Get the type of a JSON value as a string
#[napi]
pub fn get_json_type(json_string: String) -> Result<String> {
  match serde_json::from_str::<serde_json::Value>(&json_string) {
    Ok(value) => {
      let type_str = match value {
        serde_json::Value::Null => "null",
        serde_json::Value::Bool(_) => "boolean",
        serde_json::Value::Number(_) => "number",
        serde_json::Value::String(_) => "string",
        serde_json::Value::Array(_) => "array",
        serde_json::Value::Object(_) => "object",
      };
      Ok(type_str.to_string())
    }
    Err(e) => Err(Error::from_reason(format!("JSON parse error: {}", e))),
  }
}

/// Convert a serde_json Value to a JavaScript value
fn convert_value_to_js(
  env: &Env,
  value: serde_json::Value,
) -> Result<JsUnknown> {
  match value {
    serde_json::Value::Null => Ok(env.get_null()?.into()),
    serde_json::Value::Bool(b) => Ok(env.get_boolean(b)?.into()),
    serde_json::Value::Number(n) => {
      if let Some(i) = n.as_i64() {
        Ok(env.create_int64(i)?.into())
      } else if let Some(u) = n.as_u64() {
        Ok(env.create_uint32(u as u32)?.into())
      } else {
        Ok(env.create_double(n.as_f64().unwrap_or(0.0))?.into())
      }
    }
    serde_json::Value::String(s) => Ok(env.create_string(&s)?.into()),
    serde_json::Value::Array(arr) => {
      let mut js_arr = env.create_array(arr.len() as u32)?;
      for (i, item) in arr.into_iter().enumerate() {
        let js_item = convert_value_to_js(env, item)?;
        js_arr.set_element(i as u32, js_item)?;
      }
      Ok(js_arr.into())
    }
    serde_json::Value::Object(obj) => {
      let mut js_obj = env.create_object()?;
      for (key, val) in obj.iter() {
        let js_val = convert_value_to_js(env, val.clone())?;
        js_obj.set_property(&key, js_val)?;
      }
      Ok(js_obj.into())
    }
  }
}
