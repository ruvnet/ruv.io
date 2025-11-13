use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// Represents an image/matrix with metadata and properties
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImageInfo {
    id: String,
    width: i32,
    height: i32,
    channels: i32,
    data_type: String,
    #[serde(default)]
    metadata: serde_json::Value,
}

/// Color space information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ColorSpaceInfo {
    name: String,
    channels: i32,
    description: String,
}

/// Image creation options
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImageOptions {
    width: Option<i32>,
    height: Option<i32>,
    channels: Option<i32>,
    data_type: Option<String>,
}

/// Create an image/matrix from image metadata
///
/// # Arguments
/// * `image_json` - JSON string containing image metadata (width, height, channels, etc.)
///
/// # Returns
/// JSON string with created image info
#[napi]
pub fn create_image(image_json: String) -> Result<String> {
    // Parse input JSON
    let mut image_info: ImageInfo = match serde_json::from_str(&image_json) {
        Ok(info) => info,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse image JSON: {}",
                e
            )))
        }
    };

    // Validate image dimensions
    if image_info.width <= 0 || image_info.height <= 0 || image_info.channels <= 0 {
        return Err(Error::from_reason(
            "Invalid image dimensions: width, height, and channels must be positive".to_string(),
        ));
    }

    // Calculate expected buffer size
    let expected_size = (image_info.width * image_info.height * image_info.channels) as usize;

    // Add creation metadata while preserving existing metadata
    let mut metadata = if image_info.metadata.is_null() || image_info.metadata.is_object() {
        image_info.metadata
    } else {
        serde_json::json!({})
    };

    // Merge creation metadata with existing metadata
    if let serde_json::Value::Object(ref mut obj) = metadata {
        obj.insert("created_at".to_string(), serde_json::Value::String(get_timestamp()));
        obj.insert("expected_size".to_string(), serde_json::Value::Number(expected_size.into()));
        obj.insert("status".to_string(), serde_json::Value::String("created".to_string()));
    }

    image_info.metadata = metadata;

    // Convert to JSON and return
    match serde_json::to_string(&image_info) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize image info: {}",
            e
        ))),
    }
}

/// Get image/matrix properties
///
/// # Arguments
/// * `image_json` - JSON string containing image data
///
/// # Returns
/// JSON string with image properties
#[napi]
pub fn get_image_properties(image_json: String) -> Result<String> {
    // Parse input JSON
    let image_info: ImageInfo = match serde_json::from_str(&image_json) {
        Ok(info) => info,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse image JSON: {}",
                e
            )))
        }
    };

    // Calculate properties
    let properties = serde_json::json!({
        "id": image_info.id,
        "width": image_info.width,
        "height": image_info.height,
        "channels": image_info.channels,
        "data_type": image_info.data_type,
        "total_pixels": image_info.width * image_info.height,
        "total_elements": image_info.width * image_info.height * image_info.channels,
        "estimated_bytes": image_info.width * image_info.height * image_info.channels,
        "aspect_ratio": image_info.width as f64 / image_info.height as f64
    });

    // Convert to JSON and return
    match serde_json::to_string(&properties) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize properties: {}",
            e
        ))),
    }
}

/// Convert between color spaces
///
/// # Arguments
/// * `image_json` - JSON string containing image data
/// * `source_color_space` - Source color space (e.g., "BGR", "RGB", "GRAY")
/// * `target_color_space` - Target color space
///
/// # Returns
/// JSON string with conversion result
#[napi]
pub fn convert_color_space(
    image_json: String,
    source_color_space: String,
    target_color_space: String,
) -> Result<String> {
    // Parse input JSON
    let mut image_info: ImageInfo = match serde_json::from_str(&image_json) {
        Ok(info) => info,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse image JSON: {}",
                e
            )))
        }
    };

    // Validate color spaces
    let target_channels = get_color_space_channels(&target_color_space)?;

    // Update image info
    image_info.channels = target_channels;
    image_info.metadata = serde_json::json!({
        "conversion": format!("{} -> {}", source_color_space, target_color_space),
        "timestamp": get_timestamp(),
        "status": "converted"
    });

    // Convert to JSON and return
    match serde_json::to_string(&image_info) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize conversion result: {}",
            e
        ))),
    }
}

/// Get information about a color space
///
/// # Arguments
/// * `color_space` - Name of the color space (e.g., "BGR", "RGB", "GRAY", "HSV", "YUV")
///
/// # Returns
/// JSON string with color space information
#[napi]
pub fn get_color_space_info(color_space: String) -> Result<String> {
    let info = match color_space.to_uppercase().as_str() {
        "BGR" => ColorSpaceInfo {
            name: "BGR".to_string(),
            channels: 3,
            description: "Blue-Green-Red color space (OpenCV default)".to_string(),
        },
        "RGB" => ColorSpaceInfo {
            name: "RGB".to_string(),
            channels: 3,
            description: "Red-Green-Blue color space".to_string(),
        },
        "GRAY" | "GREY" => ColorSpaceInfo {
            name: "GRAY".to_string(),
            channels: 1,
            description: "Grayscale (single channel)".to_string(),
        },
        "HSV" => ColorSpaceInfo {
            name: "HSV".to_string(),
            channels: 3,
            description: "Hue-Saturation-Value color space".to_string(),
        },
        "YUV" => ColorSpaceInfo {
            name: "YUV".to_string(),
            channels: 3,
            description: "YUV color space (luma and chroma)".to_string(),
        },
        "RGBA" => ColorSpaceInfo {
            name: "RGBA".to_string(),
            channels: 4,
            description: "Red-Green-Blue-Alpha color space".to_string(),
        },
        "BGRA" => ColorSpaceInfo {
            name: "BGRA".to_string(),
            channels: 4,
            description: "Blue-Green-Red-Alpha color space".to_string(),
        },
        _ => {
            return Err(Error::from_reason(format!(
                "Unknown color space: {}",
                color_space
            )))
        }
    };

    match serde_json::to_string(&info) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize color space info: {}",
            e
        ))),
    }
}

/// Resize image
///
/// # Arguments
/// * `image_json` - JSON string containing image data
/// * `new_width` - New width in pixels
/// * `new_height` - New height in pixels
///
/// # Returns
/// JSON string with resized image info
#[napi]
pub fn resize_image(image_json: String, new_width: i32, new_height: i32) -> Result<String> {
    // Parse input JSON
    let mut image_info: ImageInfo = match serde_json::from_str(&image_json) {
        Ok(info) => info,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse image JSON: {}",
                e
            )))
        }
    };

    // Calculate scaling factor
    let scale_x = new_width as f64 / image_info.width as f64;
    let scale_y = new_height as f64 / image_info.height as f64;

    // Update dimensions
    image_info.width = new_width;
    image_info.height = new_height;
    image_info.metadata = serde_json::json!({
        "resized": true,
        "scale_x": scale_x,
        "scale_y": scale_y,
        "timestamp": get_timestamp(),
        "status": "resized"
    });

    // Convert to JSON and return
    match serde_json::to_string(&image_info) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize resized image: {}",
            e
        ))),
    }
}

/// Get image dimensions and aspect ratio
///
/// # Arguments
/// * `image_json` - JSON string containing image data
///
/// # Returns
/// JSON object with dimension information
#[napi]
pub fn get_image_dimensions(image_json: String) -> Result<String> {
    // Parse input JSON
    let image_info: ImageInfo = match serde_json::from_str(&image_json) {
        Ok(info) => info,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse image JSON: {}",
                e
            )))
        }
    };

    let dimensions = serde_json::json!({
        "width": image_info.width,
        "height": image_info.height,
        "channels": image_info.channels,
        "aspect_ratio": image_info.width as f64 / image_info.height as f64,
        "total_pixels": image_info.width * image_info.height,
        "dpi": 72
    });

    match serde_json::to_string(&dimensions) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize dimensions: {}",
            e
        ))),
    }
}

/// Batch process multiple images
///
/// # Arguments
/// * `images_json` - JSON array string containing multiple image objects
///
/// # Returns
/// JSON array with processed images
#[napi]
pub fn batch_process_images(images_json: String) -> Result<String> {
    // Parse input JSON array
    let images: Vec<ImageInfo> = match serde_json::from_str(&images_json) {
        Ok(imgs) => imgs,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse images JSON: {}",
                e
            )))
        }
    };

    // Process each image
    let results: Vec<serde_json::Value> = images
        .iter()
        .map(|img| {
            serde_json::json!({
                "id": img.id,
                "width": img.width,
                "height": img.height,
                "channels": img.channels,
                "total_pixels": img.width * img.height,
                "timestamp": get_timestamp()
            })
        })
        .collect();

    // Convert to JSON and return
    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize results: {}",
            e
        ))),
    }
}

/// Get supported color spaces
///
/// # Returns
/// JSON array with all supported color spaces
#[napi]
pub fn get_supported_color_spaces() -> Result<String> {
    let color_spaces = vec![
        serde_json::json!({
            "name": "BGR",
            "channels": 3,
            "description": "Blue-Green-Red (OpenCV default)"
        }),
        serde_json::json!({
            "name": "RGB",
            "channels": 3,
            "description": "Red-Green-Blue"
        }),
        serde_json::json!({
            "name": "GRAY",
            "channels": 1,
            "description": "Grayscale"
        }),
        serde_json::json!({
            "name": "HSV",
            "channels": 3,
            "description": "Hue-Saturation-Value"
        }),
        serde_json::json!({
            "name": "YUV",
            "channels": 3,
            "description": "YUV (luma and chroma)"
        }),
        serde_json::json!({
            "name": "RGBA",
            "channels": 4,
            "description": "Red-Green-Blue-Alpha"
        }),
        serde_json::json!({
            "name": "BGRA",
            "channels": 4,
            "description": "Blue-Green-Red-Alpha"
        }),
    ];

    match serde_json::to_string(&color_spaces) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize color spaces: {}",
            e
        ))),
    }
}

/// Calculate image statistics (for simple operations)
///
/// # Arguments
/// * `image_json` - JSON string containing image data
///
/// # Returns
/// JSON object with statistics
#[napi]
pub fn get_image_statistics(image_json: String) -> Result<String> {
    // Parse input JSON
    let image_info: ImageInfo = match serde_json::from_str(&image_json) {
        Ok(info) => info,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse image JSON: {}",
                e
            )))
        }
    };

    let stats = serde_json::json!({
        "id": image_info.id,
        "width": image_info.width,
        "height": image_info.height,
        "channels": image_info.channels,
        "total_pixels": image_info.width * image_info.height,
        "estimated_memory_bytes": image_info.width * image_info.height * image_info.channels,
        "data_type": image_info.data_type,
        "timestamp": get_timestamp()
    });

    match serde_json::to_string(&stats) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize statistics: {}",
            e
        ))),
    }
}

// ============ Helper Functions ============

/// Get timestamp as string
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}

/// Get number of channels for a color space
fn get_color_space_channels(color_space: &str) -> Result<i32> {
    match color_space.to_uppercase().as_str() {
        "GRAY" | "GREY" => Ok(1),
        "BGR" | "RGB" | "HSV" | "YUV" => Ok(3),
        "RGBA" | "BGRA" => Ok(4),
        _ => Err(Error::from_reason(format!(
            "Unknown color space: {}",
            color_space
        ))),
    }
}
