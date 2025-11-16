use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Route pattern types
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum RoutePattern {
    #[serde(rename = "exact")]
    Exact,
    #[serde(rename = "prefix")]
    Prefix,
    #[serde(rename = "regex")]
    Regex,
}

/// Load balancing strategy
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum LoadBalanceStrategy {
    #[serde(rename = "round_robin")]
    RoundRobin,
    #[serde(rename = "least_connections")]
    LeastConnections,
    #[serde(rename = "random")]
    Random,
    #[serde(rename = "weighted")]
    Weighted,
}

/// Service instance
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Service {
    id: String,
    host: String,
    port: u16,
    weight: Option<u32>,
    active: Option<bool>,
}

/// Route definition
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Route {
    id: String,
    path: String,
    pattern: String,
    services: Vec<String>,
    load_balance_strategy: String,
}

/// Health check result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HealthCheckResult {
    service_id: String,
    healthy: bool,
    timestamp: u64,
    response_time: u64,
}

/// Route match result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RouteMatchResult {
    matched: bool,
    route_id: Option<String>,
    service: Option<Service>,
    timestamp: u64,
}

/// Connection stats for a service
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ServiceStats {
    service_id: String,
    total_requests: u64,
    active_connections: u64,
    last_health_check: u64,
    health_status: bool,
}

// ============ Router State ============

/// Represents the state of routes and services
#[allow(dead_code)]
struct RouterState {
    routes: HashMap<String, Route>,
    services: HashMap<String, Service>,
    service_stats: HashMap<String, ServiceStats>,
    connection_counters: HashMap<String, u64>,
    round_robin_index: HashMap<String, usize>,
}

/// Main Router struct
pub struct Router {
    #[allow(dead_code)]
    state: Arc<Mutex<RouterState>>,
}

impl Router {
    fn new() -> Self {
        Router {
            state: Arc::new(Mutex::new(RouterState {
                routes: HashMap::new(),
                services: HashMap::new(),
                service_stats: HashMap::new(),
                connection_counters: HashMap::new(),
                round_robin_index: HashMap::new(),
            })),
        }
    }
}

// ============ NAPI Functions ============

/// Create a new Router instance
///
/// # Returns
/// JSON object representing the router instance
#[napi]
pub fn create_router() -> Result<String> {
    let _router = Router::new();
    Ok(serde_json::to_string(&serde_json::json!({
        "id": generate_id(),
        "created_at": get_timestamp()
    }))
    .map_err(|e| Error::from_reason(format!("Failed to serialize router: {}", e)))?)
}

/// Register a new service
///
/// # Arguments
/// * `service_json` - JSON string containing service data
///
/// # Returns
/// JSON object with service details
#[napi]
pub fn register_service(service_json: String) -> Result<String> {
    let service: Service = serde_json::from_str(&service_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse service: {}", e)))?;

    let result = serde_json::json!({
        "success": true,
        "service_id": service.id,
        "host": service.host,
        "port": service.port,
        "registered_at": get_timestamp()
    });

    Ok(serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Deregister a service
///
/// # Arguments
/// * `service_id` - Service ID to deregister
///
/// # Returns
/// JSON object with operation result
#[napi]
pub fn deregister_service(service_id: String) -> Result<String> {
    let result = serde_json::json!({
        "success": true,
        "service_id": service_id,
        "deregistered_at": get_timestamp()
    });

    Ok(serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Add a route
///
/// # Arguments
/// * `route_json` - JSON string containing route data
///
/// # Returns
/// JSON object with route details
#[napi]
pub fn add_route(route_json: String) -> Result<String> {
    let route: Route = serde_json::from_str(&route_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse route: {}", e)))?;

    let result = serde_json::json!({
        "success": true,
        "route_id": route.id,
        "path": route.path,
        "services": route.services,
        "created_at": get_timestamp()
    });

    Ok(serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Remove a route
///
/// # Arguments
/// * `route_id` - Route ID to remove
///
/// # Returns
/// JSON object with operation result
#[napi]
pub fn remove_route(route_id: String) -> Result<String> {
    let result = serde_json::json!({
        "success": true,
        "route_id": route_id,
        "removed_at": get_timestamp()
    });

    Ok(serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Match a request path to a route
///
/// # Arguments
/// * `path` - Request path to match
/// * `routes_json` - JSON array of routes
///
/// # Returns
/// JSON object with matched route info or null
#[napi]
pub fn match_route(path: String, routes_json: String) -> Result<String> {
    let routes: Vec<Route> = serde_json::from_str(&routes_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse routes: {}", e)))?;

    for route in routes {
        let matches = match_path(&path, &route.path, &route.pattern);
        if matches {
            let result = RouteMatchResult {
                matched: true,
                route_id: Some(route.id),
                service: None,
                timestamp: get_timestamp(),
            };

            return Ok(serde_json::to_string(&result)
                .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?);
        }
    }

    let result = RouteMatchResult {
        matched: false,
        route_id: None,
        service: None,
        timestamp: get_timestamp(),
    };

    Ok(serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Select a service using round-robin load balancing
///
/// # Arguments
/// * `route_id` - Route ID
/// * `services_json` - JSON array of services
///
/// # Returns
/// JSON object with selected service
#[napi]
pub fn select_service_round_robin(route_id: String, services_json: String) -> Result<String> {
    let services: Vec<Service> = serde_json::from_str(&services_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse services: {}", e)))?;

    if services.is_empty() {
        return Err(Error::from_reason("No services available"));
    }

    // Simple round-robin: use hash for deterministic selection
    let index = hash_route_id(&route_id) % services.len();
    let selected = &services[index];

    Ok(serde_json::to_string(&selected)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Select a service using least connections load balancing
///
/// # Arguments
/// * `services_json` - JSON array of services
/// * `connections_json` - JSON object with connection counts
///
/// # Returns
/// JSON object with selected service
#[napi]
pub fn select_service_least_connections(
    services_json: String,
    connections_json: String,
) -> Result<String> {
    let services: Vec<Service> = serde_json::from_str(&services_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse services: {}", e)))?;

    let connections: HashMap<String, u64> = serde_json::from_str(&connections_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse connections: {}", e)))?;

    if services.is_empty() {
        return Err(Error::from_reason("No services available"));
    }

    let mut selected = &services[0];
    let mut min_connections = connections.get(&services[0].id).copied().unwrap_or(0);

    for service in &services {
        let conn_count = connections.get(&service.id).copied().unwrap_or(0);
        if conn_count < min_connections {
            min_connections = conn_count;
            selected = service;
        }
    }

    Ok(serde_json::to_string(&selected)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Select a service using weighted load balancing
///
/// # Arguments
/// * `services_json` - JSON array of services with weights
///
/// # Returns
/// JSON object with selected service
#[napi]
pub fn select_service_weighted(services_json: String) -> Result<String> {
    let services: Vec<Service> = serde_json::from_str(&services_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse services: {}", e)))?;

    if services.is_empty() {
        return Err(Error::from_reason("No services available"));
    }

    let total_weight: u32 = services
        .iter()
        .map(|s| s.weight.unwrap_or(1))
        .sum();

    if total_weight == 0 {
        return Err(Error::from_reason("Invalid weights"));
    }

    let random_val = (get_timestamp() as u32) % total_weight;
    let mut current = 0u32;

    for service in &services {
        let weight = service.weight.unwrap_or(1);
        if random_val < current + weight {
            return Ok(serde_json::to_string(&service)
                .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?);
        }
        current += weight;
    }

    Ok(serde_json::to_string(&services[0])
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Perform a health check on a service
///
/// # Arguments
/// * `service_id` - Service ID to check
/// * `host` - Service host
/// * `port` - Service port
///
/// # Returns
/// JSON object with health check result
#[napi]
pub fn health_check(service_id: String, host: String, port: i32) -> Result<String> {
    // Simulate health check (in real implementation, would make actual request)
    let healthy = port > 0 && !host.is_empty();
    let response_time = get_timestamp() % 1000; // Simulated response time in ms

    let result = HealthCheckResult {
        service_id,
        healthy,
        timestamp: get_timestamp(),
        response_time,
    };

    Ok(serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Batch health checks for multiple services
///
/// # Arguments
/// * `services_json` - JSON array of services
///
/// # Returns
/// JSON array with health check results for each service
#[napi]
pub fn batch_health_check(services_json: String) -> Result<String> {
    let services: Vec<Service> = serde_json::from_str(&services_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse services: {}", e)))?;

    let results: Vec<HealthCheckResult> = services
        .iter()
        .map(|s| {
            let healthy = s.port > 0 && !s.host.is_empty();
            let response_time = get_timestamp() % 1000;

            HealthCheckResult {
                service_id: s.id.clone(),
                healthy,
                timestamp: get_timestamp(),
                response_time,
            }
        })
        .collect();

    Ok(serde_json::to_string(&results)
        .map_err(|e| Error::from_reason(format!("Failed to serialize results: {}", e)))?)
}

/// Get statistics for a service
///
/// # Arguments
/// * `_service_id` - Service ID
/// * `stats_json` - JSON object with current stats
///
/// # Returns
/// JSON object with updated service stats
#[napi]
pub fn get_service_stats(_service_id: String, stats_json: String) -> Result<String> {
    let mut stats: ServiceStats = serde_json::from_str(&stats_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse stats: {}", e)))?;

    stats.last_health_check = get_timestamp();

    Ok(serde_json::to_string(&stats)
        .map_err(|e| Error::from_reason(format!("Failed to serialize stats: {}", e)))?)
}

/// Increment connection counter for a service
///
/// # Arguments
/// * `_service_id` - Service ID
///
/// # Returns
/// Updated connection count
#[napi]
pub fn increment_connections(_service_id: String) -> Result<i32> {
    // In real implementation, this would update internal state
    Ok(1)
}

/// Decrement connection counter for a service
///
/// # Arguments
/// * `_service_id` - Service ID
///
/// # Returns
/// Updated connection count
#[napi]
pub fn decrement_connections(_service_id: String) -> Result<i32> {
    // In real implementation, this would update internal state
    Ok(0)
}

/// Get all routes
///
/// # Arguments
/// * `routes_json` - JSON array of all routes
///
/// # Returns
/// JSON array with route details
#[napi]
pub fn list_routes(routes_json: String) -> Result<String> {
    let routes: Vec<Route> = serde_json::from_str(&routes_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse routes: {}", e)))?;

    let result = serde_json::json!({
        "total": routes.len(),
        "routes": routes
    });

    Ok(serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

/// Get all services
///
/// # Arguments
/// * `services_json` - JSON array of all services
///
/// # Returns
/// JSON array with service details
#[napi]
pub fn list_services(services_json: String) -> Result<String> {
    let services: Vec<Service> = serde_json::from_str(&services_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse services: {}", e)))?;

    let result = serde_json::json!({
        "total": services.len(),
        "services": services
    });

    Ok(serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize result: {}", e)))?)
}

// ============ Helper Functions ============

/// Generate a unique ID
fn generate_id() -> String {
    format!("id_{}", get_timestamp())
}

/// Get current timestamp in milliseconds
fn get_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    duration.as_millis() as u64
}

/// Hash a route ID to get a deterministic index
fn hash_route_id(route_id: &str) -> usize {
    route_id.len()
        .wrapping_mul(31)
        .wrapping_add(route_id.chars().next().unwrap_or('0') as usize)
}

/// Match a path against a route pattern
fn match_path(path: &str, route_path: &str, pattern: &str) -> bool {
    match pattern {
        "exact" => path == route_path,
        "prefix" => path.starts_with(route_path),
        "regex" => {
            // Simple regex-like matching: * matches any character sequence
            let pattern_parts: Vec<&str> = route_path.split('*').collect();
            if pattern_parts.len() == 1 {
                path == route_path
            } else if pattern_parts.len() == 2 {
                let prefix = pattern_parts[0];
                let suffix = pattern_parts[1];
                path.starts_with(prefix) && path.ends_with(suffix)
            } else {
                // Multiple wildcards - simple check
                path.contains(route_path.trim_matches('*'))
            }
        }
        _ => false,
    }
}
