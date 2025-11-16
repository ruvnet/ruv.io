use napi::{bindgen_prelude::*, Error};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// DHT Key-Value pair stored in the distributed hash table
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DhtEntry {
    pub key: String,
    pub value: String,
    pub timestamp: String,
    pub ttl: u64,
    pub replication_factor: u32,
}

/// DHT Routing table entry
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RoutingEntry {
    pub node_id: String,
    pub distance: u32,
    pub last_seen: String,
    pub reachable: bool,
}

/// DHT Node configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DhtConfig {
    pub node_id: Option<String>,
    pub k_param: Option<u32>,
    pub replication_factor: Option<u32>,
    pub default_ttl_ms: Option<u64>,
    pub max_storage_bytes: Option<usize>,
}

/// Lookup result from DHT
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LookupResult {
    pub found: bool,
    pub value: Option<String>,
    pub nodes_queried: u32,
    pub hops: u32,
    pub timestamp: String,
}

/// Replication status
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ReplicationStatus {
    pub key: String,
    pub replicas_created: u32,
    pub consistency_level: String,
    pub last_sync: String,
}

/// DHT Node structure - main interface for distributed hash table operations
#[napi]
pub struct DhtNode {
    node_id: String,
    config: Arc<DhtConfig>,
    storage: Arc<Mutex<HashMap<String, DhtEntry>>>,
    routing_table: Arc<Mutex<Vec<RoutingEntry>>>,
    replication_map: Arc<Mutex<HashMap<String, ReplicationStatus>>>,
}

#[napi]
impl DhtNode {
    /// Create a new DHT Node
    #[napi(constructor)]
    pub fn new(config_json: Option<String>) -> Result<Self> {
        let config = match config_json {
            Some(json) => {
                match serde_json::from_str::<DhtConfig>(&json) {
                    Ok(cfg) => cfg,
                    Err(e) => {
                        return Err(Error::from_reason(format!(
                            "Failed to parse DHT config: {}",
                            e
                        )))
                    }
                }
            }
            None => DhtConfig {
                node_id: Some("dht-node-default".to_string()),
                k_param: Some(20),
                replication_factor: Some(3),
                default_ttl_ms: Some(3600000),
                max_storage_bytes: Some(1073741824),
            },
        };

        let node_id = config.node_id.clone().unwrap_or_else(|| generate_node_id());

        Ok(Self {
            node_id,
            config: Arc::new(config),
            storage: Arc::new(Mutex::new(HashMap::new())),
            routing_table: Arc::new(Mutex::new(Vec::new())),
            replication_map: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    /// Store a value in the DHT
    #[napi]
    pub fn put(&self, key: String, value: String, ttl_ms: i64) -> Result<bool> {
        let ttl = if ttl_ms > 0 { ttl_ms as u64 } else { self.config.default_ttl_ms.unwrap_or(3600000) };

        let entry = DhtEntry {
            key: key.clone(),
            value: value.clone(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            ttl,
            replication_factor: self.config.replication_factor.unwrap_or(3),
        };

        match self.storage.lock() {
            Ok(mut storage) => {
                storage.insert(key.clone(), entry);

                // Trigger replication in background
                self.replicate_entry(&key)?;

                Ok(true)
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire storage lock".to_string(),
            )),
        }
    }

    /// Retrieve a value from the DHT
    #[napi]
    pub fn get(&self, key: String) -> Result<String> {
        match self.storage.lock() {
            Ok(storage) => {
                if let Some(entry) = storage.get(&key) {
                    // Check if entry has expired
                    if has_expired(&entry) {
                        return Err(Error::from_reason(format!(
                            "Entry expired for key: {}",
                            key
                        )));
                    }

                    match serde_json::to_string(entry) {
                        Ok(json) => Ok(json),
                        Err(e) => Err(Error::from_reason(format!(
                            "Failed to serialize entry: {}",
                            e
                        ))),
                    }
                } else {
                    Err(Error::from_reason(format!("Key not found: {}", key)))
                }
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire storage lock".to_string(),
            )),
        }
    }

    /// Delete a value from the DHT
    #[napi]
    pub fn delete(&self, key: String) -> Result<bool> {
        match self.storage.lock() {
            Ok(mut storage) => {
                if storage.remove(&key).is_some() {
                    // Remove replication entry
                    match self.replication_map.lock() {
                        Ok(mut rep_map) => {
                            rep_map.remove(&key);
                        }
                        Err(_) => {}
                    }
                    Ok(true)
                } else {
                    Err(Error::from_reason(format!("Key not found: {}", key)))
                }
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire storage lock".to_string(),
            )),
        }
    }

    /// Check if a key exists in the DHT
    #[napi]
    pub fn exists(&self, key: String) -> Result<bool> {
        match self.storage.lock() {
            Ok(storage) => {
                if let Some(entry) = storage.get(&key) {
                    Ok(!has_expired(entry))
                } else {
                    Ok(false)
                }
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire storage lock".to_string(),
            )),
        }
    }

    /// Perform a DHT lookup (simulated Kademlia-style)
    #[napi]
    pub fn lookup(&self, key: String, max_hops: u32) -> Result<String> {
        let max_hops = if max_hops > 0 { max_hops } else { 20 };

        // Check local storage first
        match self.storage.lock() {
            Ok(storage) => {
                if let Some(entry) = storage.get(&key) {
                    if !has_expired(entry) {
                        let result = LookupResult {
                            found: true,
                            value: Some(entry.value.clone()),
                            nodes_queried: 1,
                            hops: 0,
                            timestamp: chrono::Utc::now().to_rfc3339(),
                        };
                        return match serde_json::to_string(&result) {
                            Ok(json) => Ok(json),
                            Err(e) => Err(Error::from_reason(format!(
                                "Failed to serialize lookup result: {}",
                                e
                            ))),
                        };
                    }
                }
            }
            Err(_) => {}
        }

        // Simulate querying routing table
        let routing_result = query_routing_table(self, &key, max_hops)?;

        match serde_json::to_string(&routing_result) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize lookup result: {}",
                e
            ))),
        }
    }

    /// Add a peer node to the routing table
    #[napi]
    pub fn add_peer(&self, node_id: String, distance: u32) -> Result<bool> {
        let entry = RoutingEntry {
            node_id: node_id.clone(),
            distance,
            last_seen: chrono::Utc::now().to_rfc3339(),
            reachable: true,
        };

        match self.routing_table.lock() {
            Ok(mut table) => {
                // Check if peer already exists and update it
                if let Some(pos) = table.iter().position(|e| e.node_id == node_id) {
                    table[pos] = entry;
                } else {
                    table.push(entry);
                    // Keep only k closest peers
                    let k = self.config.k_param.unwrap_or(20) as usize;
                    if table.len() > k {
                        table.sort_by_key(|e| e.distance);
                        table.truncate(k);
                    }
                }
                Ok(true)
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire routing table lock".to_string(),
            )),
        }
    }

    /// Remove a peer from the routing table
    #[napi]
    pub fn remove_peer(&self, node_id: String) -> Result<bool> {
        match self.routing_table.lock() {
            Ok(mut table) => {
                if let Some(pos) = table.iter().position(|e| e.node_id == node_id) {
                    table.remove(pos);
                    Ok(true)
                } else {
                    Err(Error::from_reason(format!(
                        "Peer not found: {}",
                        node_id
                    )))
                }
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire routing table lock".to_string(),
            )),
        }
    }

    /// Get all peers in routing table
    #[napi]
    pub fn get_peers(&self) -> Result<String> {
        match self.routing_table.lock() {
            Ok(table) => match serde_json::to_string(&*table) {
                Ok(json) => Ok(json),
                Err(e) => Err(Error::from_reason(format!(
                    "Failed to serialize peers: {}",
                    e
                ))),
            },
            Err(_) => Err(Error::from_reason(
                "Failed to acquire routing table lock".to_string(),
            )),
        }
    }

    /// Get peer count in routing table
    #[napi]
    pub fn peer_count(&self) -> Result<u32> {
        match self.routing_table.lock() {
            Ok(table) => Ok(table.len() as u32),
            Err(_) => Err(Error::from_reason(
                "Failed to acquire routing table lock".to_string(),
            )),
        }
    }

    /// Get all stored entries in local storage
    #[napi]
    pub fn get_all_entries(&self) -> Result<String> {
        match self.storage.lock() {
            Ok(storage) => {
                let entries: Vec<DhtEntry> = storage
                    .values()
                    .filter(|e| !has_expired(e))
                    .cloned()
                    .collect();

                match serde_json::to_string(&entries) {
                    Ok(json) => Ok(json),
                    Err(e) => Err(Error::from_reason(format!(
                        "Failed to serialize entries: {}",
                        e
                    ))),
                }
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire storage lock".to_string(),
            )),
        }
    }

    /// Get entry count in local storage
    #[napi]
    pub fn entry_count(&self) -> Result<u32> {
        match self.storage.lock() {
            Ok(storage) => {
                let count = storage
                    .values()
                    .filter(|e| !has_expired(e))
                    .count();
                Ok(count as u32)
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire storage lock".to_string(),
            )),
        }
    }

    /// Get node ID
    #[napi]
    pub fn get_node_id(&self) -> Result<String> {
        Ok(self.node_id.clone())
    }

    /// Get configuration
    #[napi]
    pub fn get_config(&self) -> Result<String> {
        match serde_json::to_string(&*self.config) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize config: {}",
                e
            ))),
        }
    }

    /// Replicate an entry to other nodes (simulated)
    fn replicate_entry(&self, key: &str) -> Result<String> {
        let replication_factor = self.config.replication_factor.unwrap_or(3);

        let status = ReplicationStatus {
            key: key.to_string(),
            replicas_created: replication_factor,
            consistency_level: "eventual".to_string(),
            last_sync: chrono::Utc::now().to_rfc3339(),
        };

        match self.replication_map.lock() {
            Ok(mut map) => {
                map.insert(key.to_string(), status.clone());
            }
            Err(_) => {}
        }

        match serde_json::to_string(&status) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize replication status: {}",
                e
            ))),
        }
    }

    /// Get replication status for a key
    #[napi]
    pub fn get_replication_status(&self, key: String) -> Result<String> {
        match self.replication_map.lock() {
            Ok(map) => {
                if let Some(status) = map.get(&key) {
                    match serde_json::to_string(status) {
                        Ok(json) => Ok(json),
                        Err(e) => Err(Error::from_reason(format!(
                            "Failed to serialize replication status: {}",
                            e
                        ))),
                    }
                } else {
                    Err(Error::from_reason(format!(
                        "Replication status not found for key: {}",
                        key
                    )))
                }
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire replication map lock".to_string(),
            )),
        }
    }

    /// Perform health check
    #[napi]
    pub fn health_check(&self) -> Result<String> {
        let entry_count = self.entry_count()?;
        let peer_count = self.peer_count()?;

        let health = serde_json::json!({
            "status": "healthy",
            "node_id": &self.node_id,
            "entries_stored": entry_count,
            "peers_connected": peer_count,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });

        match serde_json::to_string(&health) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize health check: {}",
                e
            ))),
        }
    }

    /// Get DHT statistics
    #[napi]
    pub fn get_stats(&self) -> Result<String> {
        let entry_count = self.entry_count()?;
        let peer_count = self.peer_count()?;

        let stats = serde_json::json!({
            "node_id": &self.node_id,
            "total_entries": entry_count,
            "total_peers": peer_count,
            "k_parameter": self.config.k_param.unwrap_or(20),
            "replication_factor": self.config.replication_factor.unwrap_or(3),
            "default_ttl_ms": self.config.default_ttl_ms.unwrap_or(3600000),
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });

        match serde_json::to_string(&stats) {
            Ok(json) => Ok(json),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize stats: {}",
                e
            ))),
        }
    }

    /// Clear all local storage
    #[napi]
    pub fn clear(&self) -> Result<bool> {
        match self.storage.lock() {
            Ok(mut storage) => {
                storage.clear();
                Ok(true)
            }
            Err(_) => Err(Error::from_reason(
                "Failed to acquire storage lock".to_string(),
            )),
        }
    }
}

// ============ Helper Functions ============

/// Generate a unique node ID
fn generate_node_id() -> String {
    format!("node-{}", uuid::Uuid::new_v4())
}

/// Check if a DHT entry has expired
fn has_expired(entry: &DhtEntry) -> bool {
    if let Ok(entry_time) = chrono::DateTime::parse_from_rfc3339(&entry.timestamp) {
        let now = chrono::Utc::now();
        let entry_time_utc = entry_time.with_timezone(&chrono::Utc);

        let elapsed = (now - entry_time_utc).num_milliseconds() as u64;
        elapsed > entry.ttl
    } else {
        false
    }
}

/// Query the routing table for a key (Kademlia-style simulation)
fn query_routing_table(dht_node: &DhtNode, key: &str, max_hops: u32) -> Result<LookupResult> {
    // Simulate XOR distance metric (used conceptually for Kademlia routing)
    let _distance = calculate_xor_distance(key, &dht_node.node_id);

    // Simulate querying nodes in routing table
    let mut nodes_queried = 1u32;

    match dht_node.routing_table.lock() {
        Ok(table) => {
            // Sort by distance and query closest nodes
            let mut sorted = table.clone();
            sorted.sort_by_key(|e| e.distance);

            nodes_queried += (sorted.len() as u32).min(5);
        }
        Err(_) => {}
    }

    Ok(LookupResult {
        found: false,
        value: None,
        nodes_queried,
        hops: max_hops,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

/// Calculate XOR distance between two identifiers (for Kademlia routing)
fn calculate_xor_distance(id1: &str, id2: &str) -> u32 {
    use sha2::{Sha256, Digest};

    let mut hasher1 = Sha256::new();
    hasher1.update(id1);
    let hash1 = hasher1.finalize();

    let mut hasher2 = Sha256::new();
    hasher2.update(id2);
    let hash2 = hasher2.finalize();

    let mut distance = 0u32;
    for (byte1, byte2) in hash1.iter().zip(hash2.iter()).take(4) {
        distance = distance.wrapping_mul(256).wrapping_add((byte1 ^ byte2) as u32);
    }

    distance
}

// ============ Standalone Functions ============

/// Hash a key for DHT storage
#[napi]
pub fn hash_key(key: String) -> Result<String> {
    use sha2::{Sha256, Digest};

    let mut hasher = Sha256::new();
    hasher.update(&key);
    let result = hasher.finalize();

    Ok(hex::encode(result))
}

/// Validate DHT key format
#[napi]
pub fn validate_key(key: String) -> Result<bool> {
    Ok(!key.is_empty() && key.len() <= 256)
}

/// Create a default DHT configuration
#[napi]
pub fn create_default_config() -> Result<String> {
    let config = DhtConfig {
        node_id: Some(format!("dht-node-{}", uuid::Uuid::new_v4())),
        k_param: Some(20),
        replication_factor: Some(3),
        default_ttl_ms: Some(3600000),
        max_storage_bytes: Some(1073741824),
    };

    match serde_json::to_string(&config) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize config: {}",
            e
        ))),
    }
}

/// Calculate storage size for an entry
#[napi]
pub fn calculate_entry_size(key: String, value: String) -> Result<u32> {
    let size = key.len() + value.len() + 256; // Add overhead for metadata
    Ok(size as u32)
}

/// Create a DHTEntry object
#[napi]
pub fn create_dht_entry(key: String, value: String, ttl_ms: i64) -> Result<String> {
    let entry = DhtEntry {
        key,
        value,
        timestamp: chrono::Utc::now().to_rfc3339(),
        ttl: if ttl_ms > 0 { ttl_ms as u64 } else { 3600000 },
        replication_factor: 3,
    };

    match serde_json::to_string(&entry) {
        Ok(json) => Ok(json),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize entry: {}",
            e
        ))),
    }
}
