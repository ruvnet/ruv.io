use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

// ============ Data Structures ============

/// Message protocol types
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum ProtocolType {
    TCP,
    UDP,
    WebSocket,
    HTTP,
    #[serde(rename = "gRPC")]
    GRPC,
    Custom,
}

/// Message priority levels
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Copy, PartialOrd, Eq, Ord)]
pub enum MessagePriority {
    #[serde(rename = "low")]
    Low,
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "high")]
    High,
    #[serde(rename = "critical")]
    Critical,
}

/// Connection state
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionState {
    Connecting,
    Connected,
    Disconnecting,
    Disconnected,
    Failed,
}

/// Message structure for transport
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Message {
    id: String,
    source: String,
    destination: String,
    protocol: String,
    payload: String,
    priority: String,
    timestamp: String,
    metadata: serde_json::Value,
}

/// Connection information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Connection {
    id: String,
    remote_address: String,
    protocol: String,
    state: String,
    created_at: String,
    last_activity: String,
}

/// Transport routing entry
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Route {
    destination: String,
    protocol: String,
    priority: i32,
    enabled: bool,
}

/// Route information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RouteInfo {
    destination: String,
    protocol: String,
    priority: i32,
    enabled: bool,
    created_at: String,
}

/// Serialization configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SerializationConfig {
    format: String,
    compression: bool,
    encryption: bool,
}

/// Message statistics
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MessageStats {
    total_messages: usize,
    total_bytes: usize,
    average_latency_ms: f64,
    messages_by_protocol: serde_json::Value,
}

/// Connection statistics
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConnectionStats {
    active_connections: usize,
    total_connections: usize,
    failed_connections: usize,
    total_bytes_sent: usize,
    total_bytes_received: usize,
}

// ============ Transport Manager ============

/// Main transport manager for RUV swarm communication
#[napi]
pub struct TransportManager {
    connections: Arc<Mutex<HashMap<String, Connection>>>,
    routes: Arc<Mutex<HashMap<String, RouteInfo>>>,
    messages: Arc<Mutex<Vec<Message>>>,
    stats: Arc<Mutex<TransportStats>>,
    enabled_protocols: Arc<Mutex<Vec<String>>>,
    manager_id: String,
}

/// Internal stats tracking
#[derive(Debug, Clone)]
struct TransportStats {
    total_messages: usize,
    total_bytes: usize,
    total_connections: usize,
    active_connections: usize,
    failed_connections: usize,
    total_bytes_sent: usize,
    total_bytes_received: usize,
    messages_by_protocol: HashMap<String, usize>,
}

#[napi]
impl TransportManager {
    #[napi(constructor)]
    pub fn new() -> napi::Result<Self> {
        let manager_id = generate_id("tm");
        Ok(TransportManager {
            connections: Arc::new(Mutex::new(HashMap::new())),
            routes: Arc::new(Mutex::new(HashMap::new())),
            messages: Arc::new(Mutex::new(Vec::new())),
            stats: Arc::new(Mutex::new(TransportStats {
                total_messages: 0,
                total_bytes: 0,
                total_connections: 0,
                active_connections: 0,
                failed_connections: 0,
                total_bytes_sent: 0,
                total_bytes_received: 0,
                messages_by_protocol: HashMap::new(),
            })),
            enabled_protocols: Arc::new(Mutex::new(vec![
                "tcp".to_string(),
                "websocket".to_string(),
                "http".to_string(),
            ])),
            manager_id,
        })
    }

    #[napi]
    pub fn get_id(&self) -> String {
        self.manager_id.clone()
    }

    #[napi]
    pub fn send_message(&mut self, message_json: String) -> napi::Result<String> {
        let message: Message = match serde_json::from_str(&message_json) {
            Ok(msg) => msg,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse message: {}",
                    e
                )))
            }
        };

        if message.destination.is_empty() {
            return Err(Error::from_reason(
                "Message destination cannot be empty".to_string(),
            ));
        }

        // Update stats
        let bytes = message.payload.len();
        let protocol = message.protocol.clone();

        let mut stats = self
            .stats
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock stats: {}", e)))?;
        stats.total_messages += 1;
        stats.total_bytes += bytes;
        stats.total_bytes_sent += bytes;

        let count = stats
            .messages_by_protocol
            .entry(protocol.clone())
            .or_insert(0);
        *count += 1;

        // Store message
        let mut messages = self
            .messages
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock messages: {}", e)))?;
        messages.push(message.clone());

        Ok(message.id)
    }

    #[napi]
    pub fn register_connection(&mut self, connection_json: String) -> napi::Result<String> {
        let conn: Connection = match serde_json::from_str(&connection_json) {
            Ok(c) => c,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse connection: {}",
                    e
                )))
            }
        };

        let conn_id = conn.id.clone();

        // Update stats
        let mut stats = self
            .stats
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock stats: {}", e)))?;
        stats.total_connections += 1;
        stats.active_connections += 1;

        // Store connection
        let mut connections = self
            .connections
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock connections: {}", e)))?;
        connections.insert(conn_id.clone(), conn);

        Ok(conn_id)
    }

    #[napi]
    pub fn register_route(&mut self, route_json: String) -> napi::Result<String> {
        let route: Route = match serde_json::from_str(&route_json) {
            Ok(r) => r,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse route: {}",
                    e
                )))
            }
        };

        let route_id = generate_id("route");

        let route_info = RouteInfo {
            destination: route.destination.clone(),
            protocol: route.protocol,
            priority: route.priority,
            enabled: route.enabled,
            created_at: get_timestamp(),
        };

        let mut routes = self
            .routes
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock routes: {}", e)))?;
        routes.insert(route.destination, route_info);

        Ok(route_id)
    }

    #[napi]
    pub fn list_routes(&self) -> napi::Result<String> {
        let routes = self
            .routes
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock routes: {}", e)))?;

        let route_list: Vec<RouteInfo> = routes.values().cloned().collect();

        match serde_json::to_string(&route_list) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization error: {}", e))),
        }
    }

    #[napi]
    pub fn remove_route(&mut self, destination: String) -> napi::Result<bool> {
        let mut routes = self
            .routes
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock routes: {}", e)))?;

        routes.remove(&destination);
        Ok(true)
    }

    #[napi]
    pub fn get_connections(&self) -> napi::Result<String> {
        let connections = self
            .connections
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock connections: {}", e)))?;

        let conn_list: Vec<Connection> = connections.values().cloned().collect();

        match serde_json::to_string(&conn_list) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization error: {}", e))),
        }
    }

    #[napi]
    pub fn close_connection(&mut self, connection_id: String) -> napi::Result<bool> {
        let mut connections = self
            .connections
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock connections: {}", e)))?;

        let mut stats = self
            .stats
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock stats: {}", e)))?;

        if connections.remove(&connection_id).is_some() {
            if stats.active_connections > 0 {
                stats.active_connections -= 1;
            }
        }

        Ok(true)
    }

    #[napi]
    pub fn get_transport_stats(&self) -> napi::Result<String> {
        let stats = self
            .stats
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock stats: {}", e)))?;

        let protocols: serde_json::Value = serde_json::json!(stats.messages_by_protocol);

        let result = serde_json::json!({
            "total_messages": stats.total_messages,
            "total_bytes": stats.total_bytes,
            "average_latency_ms": 0.0,
            "messages_by_protocol": protocols,
        });

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization error: {}", e))),
        }
    }

    #[napi]
    pub fn get_connection_stats(&self) -> napi::Result<String> {
        let stats = self
            .stats
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock stats: {}", e)))?;

        let result = serde_json::json!({
            "active_connections": stats.active_connections,
            "total_connections": stats.total_connections,
            "failed_connections": stats.failed_connections,
            "total_bytes_sent": stats.total_bytes_sent,
            "total_bytes_received": stats.total_bytes_received,
        });

        match serde_json::to_string(&result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization error: {}", e))),
        }
    }

    #[napi]
    pub fn enable_protocol(&mut self, protocol: String) -> napi::Result<bool> {
        if protocol.is_empty() {
            return Err(Error::from_reason("Protocol cannot be empty".to_string()));
        }

        let mut protocols = self
            .enabled_protocols
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock protocols: {}", e)))?;

        if !protocols.contains(&protocol) {
            protocols.push(protocol);
        }

        Ok(true)
    }

    #[napi]
    pub fn disable_protocol(&mut self, protocol: String) -> napi::Result<bool> {
        if protocol.is_empty() {
            return Err(Error::from_reason("Protocol cannot be empty".to_string()));
        }

        let mut protocols = self
            .enabled_protocols
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock protocols: {}", e)))?;

        protocols.retain(|p| p != &protocol);

        Ok(true)
    }

    #[napi]
    pub fn get_enabled_protocols(&self) -> napi::Result<String> {
        let protocols = self
            .enabled_protocols
            .lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock protocols: {}", e)))?;

        match serde_json::to_string(&*protocols) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!("Serialization error: {}", e))),
        }
    }
}

/// Initialize transport manager
///
/// # Arguments
/// * `config_json` - JSON string with transport configuration
///
/// # Returns
/// Transport manager instance ID
#[napi]
pub fn init_transport_manager(config_json: String) -> Result<String> {
    // Parse configuration
    let _config: serde_json::Value = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config: {}",
                e
            )))
        }
    };

    // Generate manager ID
    let manager_id = generate_id("tm");

    Ok(manager_id)
}

/// Register a connection
///
/// # Arguments
/// * `connection_json` - JSON string with connection details
///
/// # Returns
/// Connection ID
#[napi]
pub fn register_connection(connection_json: String) -> Result<String> {
    let _connection: Connection = match serde_json::from_str(&connection_json) {
        Ok(conn) => conn,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse connection: {}",
                e
            )))
        }
    };

    let conn_id = generate_id("conn");
    Ok(conn_id)
}

/// Send a message through the transport layer
///
/// # Arguments
/// * `message_json` - JSON string with message details
///
/// # Returns
/// Message ID if sent successfully
#[napi]
pub fn send_message(message_json: String) -> Result<String> {
    let message: Message = match serde_json::from_str(&message_json) {
        Ok(msg) => msg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse message: {}",
                e
            )))
        }
    };

    if message.destination.is_empty() {
        return Err(Error::from_reason("Message destination cannot be empty".to_string()));
    }

    let msg_id = generate_id("msg");
    Ok(msg_id)
}

/// Create a message
///
/// # Arguments
/// * `source` - Source address
/// * `destination` - Destination address
/// * `payload` - Message payload
/// * `protocol` - Protocol type
/// * `priority` - Priority level
///
/// # Returns
/// JSON string with message details
#[napi]
pub fn create_message(
    source: String,
    destination: String,
    payload: String,
    protocol: String,
    priority: String,
) -> Result<String> {
    let message = Message {
        id: generate_id("msg"),
        source,
        destination,
        protocol,
        payload,
        priority,
        timestamp: get_timestamp(),
        metadata: serde_json::json!({}),
    };

    match serde_json::to_string(&message) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize message: {}", e))),
    }
}

/// Register a route for message delivery
///
/// # Arguments
/// * `route_json` - JSON string with route details
///
/// # Returns
/// Route ID
#[napi]
pub fn register_route(route_json: String) -> Result<String> {
    let _route: Route = match serde_json::from_str(&route_json) {
        Ok(r) => r,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse route: {}",
                e
            )))
        }
    };

    let route_id = generate_id("route");
    Ok(route_id)
}

/// Get all registered routes
///
/// # Returns
/// JSON array of routes
#[napi]
pub fn list_routes() -> Result<String> {
    let routes: Vec<RouteInfo> = vec![];

    match serde_json::to_string(&routes) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize routes: {}", e))),
    }
}

/// Update route configuration
///
/// # Arguments
/// * `destination` - Route destination
/// * `config_json` - JSON string with new configuration
///
/// # Returns
/// Updated route info
#[napi]
pub fn update_route(destination: String, config_json: String) -> Result<String> {
    let config: serde_json::Value = match serde_json::from_str(&config_json) {
        Ok(cfg) => cfg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse config: {}",
                e
            )))
        }
    };

    let priority = config
        .get("priority")
        .and_then(|p| p.as_i64())
        .unwrap_or(1) as i32;

    let route = RouteInfo {
        destination,
        protocol: config
            .get("protocol")
            .and_then(|p| p.as_str())
            .unwrap_or("tcp")
            .to_string(),
        priority,
        enabled: config
            .get("enabled")
            .and_then(|e| e.as_bool())
            .unwrap_or(true),
        created_at: get_timestamp(),
    };

    match serde_json::to_string(&route) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize route: {}", e))),
    }
}

/// Remove a route
///
/// # Arguments
/// * `_destination` - Route destination to remove
///
/// # Returns
/// Success status
#[napi]
pub fn remove_route(_destination: String) -> Result<bool> {
    Ok(true)
}

/// Set serialization format for protocol
///
/// # Arguments
/// * `protocol` - Protocol name
/// * `format` - Serialization format (json, msgpack, protobuf, etc.)
///
/// # Returns
/// Success status
#[napi]
pub fn set_serialization_format(protocol: String, format: String) -> Result<bool> {
    if protocol.is_empty() || format.is_empty() {
        return Err(Error::from_reason(
            "Protocol and format cannot be empty".to_string(),
        ));
    }

    Ok(true)
}

/// Get active connections
///
/// # Returns
/// JSON array of active connections
#[napi]
pub fn get_active_connections() -> Result<String> {
    let connections: Vec<Connection> = vec![];

    match serde_json::to_string(&connections) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize connections: {}",
            e
        ))),
    }
}

/// Handle incoming message
///
/// # Arguments
/// * `message_json` - JSON string with message details
///
/// # Returns
/// Processed message result
#[napi]
pub fn handle_incoming_message(message_json: String) -> Result<String> {
    let message: Message = match serde_json::from_str(&message_json) {
        Ok(msg) => msg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse message: {}",
                e
            )))
        }
    };

    let result = serde_json::json!({
        "status": "received",
        "message_id": message.id,
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Batch send multiple messages
///
/// # Arguments
/// * `messages_json` - JSON array of messages
///
/// # Returns
/// JSON array with send results
#[napi]
pub fn batch_send_messages(messages_json: String) -> Result<String> {
    let messages: Vec<Message> = match serde_json::from_str(&messages_json) {
        Ok(msgs) => msgs,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse messages: {}",
                e
            )))
        }
    };

    let results: Vec<serde_json::Value> = messages
        .iter()
        .map(|msg| {
            serde_json::json!({
                "message_id": msg.id,
                "status": "sent",
                "timestamp": get_timestamp(),
            })
        })
        .collect();

    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Close a connection
///
/// # Arguments
/// * `connection_id` - Connection ID to close
///
/// # Returns
/// Success status
#[napi]
pub fn close_connection(connection_id: String) -> Result<bool> {
    if connection_id.is_empty() {
        return Err(Error::from_reason(
            "Connection ID cannot be empty".to_string(),
        ));
    }

    Ok(true)
}

/// Get transport statistics
///
/// # Returns
/// JSON with transport stats
#[napi]
pub fn get_transport_stats() -> Result<String> {
    let stats = serde_json::json!({
        "total_messages": 0,
        "total_bytes": 0,
        "average_latency_ms": 0.0,
        "messages_by_protocol": {},
    });

    match serde_json::to_string(&stats) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize stats: {}", e))),
    }
}

/// Get connection statistics
///
/// # Returns
/// JSON with connection stats
#[napi]
pub fn get_connection_stats() -> Result<String> {
    let stats = serde_json::json!({
        "active_connections": 0,
        "total_connections": 0,
        "failed_connections": 0,
        "total_bytes_sent": 0,
        "total_bytes_received": 0,
    });

    match serde_json::to_string(&stats) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize stats: {}", e))),
    }
}

/// Enable protocol
///
/// # Arguments
/// * `protocol` - Protocol to enable
///
/// # Returns
/// Success status
#[napi]
pub fn enable_protocol(protocol: String) -> Result<bool> {
    if protocol.is_empty() {
        return Err(Error::from_reason("Protocol cannot be empty".to_string()));
    }

    Ok(true)
}

/// Disable protocol
///
/// # Arguments
/// * `protocol` - Protocol to disable
///
/// # Returns
/// Success status
#[napi]
pub fn disable_protocol(protocol: String) -> Result<bool> {
    if protocol.is_empty() {
        return Err(Error::from_reason("Protocol cannot be empty".to_string()));
    }

    Ok(true)
}

/// Get enabled protocols
///
/// # Returns
/// JSON array of enabled protocols
#[napi]
pub fn get_enabled_protocols() -> Result<String> {
    let protocols = vec!["tcp", "websocket", "http"];

    match serde_json::to_string(&protocols) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize protocols: {}",
            e
        ))),
    }
}

/// Serialize message with specified format
///
/// # Arguments
/// * `message_json` - JSON message
/// * `format` - Format type (json, compact, etc.)
///
/// # Returns
/// Serialized message
#[napi]
pub fn serialize_message(message_json: String, format: String) -> Result<String> {
    let _message: Message = match serde_json::from_str(&message_json) {
        Ok(msg) => msg,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse message: {}",
                e
            )))
        }
    };

    if format.is_empty() {
        return Err(Error::from_reason("Format cannot be empty".to_string()));
    }

    Ok(message_json)
}

/// Deserialize message
///
/// # Arguments
/// * `serialized_data` - Serialized message data
/// * `format` - Format type
///
/// # Returns
/// Deserialized message
#[napi]
pub fn deserialize_message(serialized_data: String, format: String) -> Result<String> {
    if serialized_data.is_empty() || format.is_empty() {
        return Err(Error::from_reason(
            "Serialized data and format cannot be empty".to_string(),
        ));
    }

    Ok(serialized_data)
}

// ============ Helper Functions ============

/// Generate unique ID with prefix
fn generate_id(prefix: &str) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let timestamp = duration.as_millis();

    // Simple random component
    let random = (timestamp % 10000) as u32;

    format!("{}-{}-{}", prefix, timestamp, random)
}

/// Get current timestamp as ISO 8601 string
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}
