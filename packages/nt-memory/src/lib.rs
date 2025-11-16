use napi::{bindgen_prelude::*, Result};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Memory entry in the cache
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MemoryEntry {
    id: String,
    key: String,
    value: serde_json::Value,
    timestamp: u64,
    access_count: u32,
    last_accessed: u64,
    ttl: Option<u64>, // Time to live in milliseconds
}

/// Short-term memory item
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ShortTermMemory {
    id: String,
    content: serde_json::Value,
    timestamp: u64,
    priority: i32, // 0-100 scale
}

/// Long-term memory item
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LongTermMemory {
    id: String,
    key: String,
    content: serde_json::Value,
    created_at: u64,
    updated_at: u64,
    access_count: u32,
}

/// Memory pool allocation info
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MemoryPoolAllocation {
    pool_id: String,
    size_bytes: usize,
    allocated: usize,
    available: usize,
    utilization_percent: f64,
}

/// Memory manager configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MemoryManagerConfig {
    max_short_term_entries: Option<usize>,
    max_long_term_entries: Option<usize>,
    cache_size_bytes: Option<usize>,
    enable_persistence: Option<bool>,
    lru_enabled: Option<bool>,
}

/// State persistence format
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PersistenceState {
    short_term_entries: Vec<ShortTermMemory>,
    long_term_entries: Vec<LongTermMemory>,
    cache_entries: Vec<MemoryEntry>,
    timestamp: u64,
}

/// MemoryManager - Main struct for managing agent memory
#[napi]
pub struct MemoryManager {
    short_term: Vec<ShortTermMemory>,
    long_term: HashMap<String, LongTermMemory>,
    cache: Vec<MemoryEntry>,
    pool_allocation: HashMap<String, MemoryPoolAllocation>,
    config: MemoryManagerConfig,
    max_short_term: usize,
    max_long_term: usize,
    max_cache_size: usize,
}

#[napi]
impl MemoryManager {
    /// Create a new MemoryManager instance
    #[napi(constructor)]
    pub fn new(config_json: Option<String>) -> Result<Self> {
        let config: MemoryManagerConfig = if let Some(cfg) = config_json {
            serde_json::from_str(&cfg)
                .map_err(|e| Error::from_reason(format!("Invalid config JSON: {}", e)))?
        } else {
            MemoryManagerConfig {
                max_short_term_entries: Some(1000),
                max_long_term_entries: Some(10000),
                cache_size_bytes: Some(1024 * 1024 * 100), // 100MB
                enable_persistence: Some(true),
                lru_enabled: Some(true),
            }
        };

        Ok(MemoryManager {
            short_term: Vec::new(),
            long_term: HashMap::new(),
            cache: Vec::new(),
            pool_allocation: HashMap::new(),
            max_short_term: config.max_short_term_entries.unwrap_or(1000),
            max_long_term: config.max_long_term_entries.unwrap_or(10000),
            max_cache_size: config.cache_size_bytes.unwrap_or(1024 * 1024 * 100),
            config,
        })
    }

    /// Add to short-term memory
    #[napi]
    pub fn add_short_term(
        &mut self,
        id: String,
        content_json: String,
        priority: i32,
    ) -> Result<String> {
        let content: serde_json::Value = serde_json::from_str(&content_json)
            .map_err(|e| Error::from_reason(format!("Invalid JSON: {}", e)))?;

        let entry = ShortTermMemory {
            id: id.clone(),
            content,
            timestamp: get_current_timestamp(),
            priority: priority.clamp(0, 100),
        };

        // Remove oldest entry if at capacity
        if self.short_term.len() >= self.max_short_term {
            self.short_term.remove(0);
        }

        self.short_term.push(entry.clone());

        Ok(serde_json::to_string(&entry)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?)
    }

    /// Retrieve from short-term memory
    #[napi]
    pub fn get_short_term(&self, id: String) -> Result<Option<String>> {
        for entry in &self.short_term {
            if entry.id == id {
                return Ok(Some(
                    serde_json::to_string(&entry)
                        .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?,
                ));
            }
        }
        Ok(None)
    }

    /// Get all short-term memory entries
    #[napi]
    pub fn get_all_short_term(&self) -> Result<String> {
        serde_json::to_string(&self.short_term)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))
    }

    /// Clear short-term memory
    #[napi]
    pub fn clear_short_term(&mut self) -> Result<i32> {
        let count = self.short_term.len() as i32;
        self.short_term.clear();
        Ok(count)
    }

    /// Add to long-term memory
    #[napi]
    pub fn add_long_term(&mut self, key: String, content_json: String) -> Result<String> {
        let content: serde_json::Value = serde_json::from_str(&content_json)
            .map_err(|e| Error::from_reason(format!("Invalid JSON: {}", e)))?;

        let now = get_current_timestamp();
        let entry = LongTermMemory {
            id: uuid_v4(),
            key: key.clone(),
            content,
            created_at: now,
            updated_at: now,
            access_count: 0,
        };

        self.long_term.insert(key, entry.clone());

        Ok(serde_json::to_string(&entry)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?)
    }

    /// Retrieve from long-term memory
    #[napi]
    pub fn get_long_term(&mut self, key: String) -> Result<Option<String>> {
        if let Some(entry) = self.long_term.get_mut(&key) {
            entry.access_count += 1;
            entry.updated_at = get_current_timestamp();

            return Ok(Some(
                serde_json::to_string(&entry)
                    .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?,
            ));
        }
        Ok(None)
    }

    /// Get all long-term memory entries
    #[napi]
    pub fn get_all_long_term(&self) -> Result<String> {
        let entries: Vec<LongTermMemory> = self.long_term.values().cloned().collect();
        serde_json::to_string(&entries)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))
    }

    /// Delete from long-term memory
    #[napi]
    pub fn delete_long_term(&mut self, key: String) -> Result<bool> {
        Ok(self.long_term.remove(&key).is_some())
    }

    /// Clear all long-term memory
    #[napi]
    pub fn clear_long_term(&mut self) -> Result<i32> {
        let count = self.long_term.len() as i32;
        self.long_term.clear();
        Ok(count)
    }

    /// Add to cache with optional TTL
    #[napi]
    pub fn cache_set(
        &mut self,
        key: String,
        value_json: String,
        ttl_ms: i32,
    ) -> Result<String> {
        let value: serde_json::Value = serde_json::from_str(&value_json)
            .map_err(|e| Error::from_reason(format!("Invalid JSON: {}", e)))?;

        let ttl = if ttl_ms > 0 { Some(ttl_ms as u64) } else { None };

        let entry = MemoryEntry {
            id: uuid_v4(),
            key: key.clone(),
            value,
            timestamp: get_current_timestamp(),
            access_count: 0,
            last_accessed: get_current_timestamp(),
            ttl,
        };

        // Apply LRU eviction if needed
        if self.config.lru_enabled.unwrap_or(true)
            && self.cache.len() >= (self.max_cache_size / 1000)
        {
            self.evict_lru();
        }

        self.cache.push(entry.clone());

        Ok(serde_json::to_string(&entry)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?)
    }

    /// Get from cache
    #[napi]
    pub fn cache_get(&mut self, key: String) -> Result<Option<String>> {
        // Remove expired entries first
        self.cache.retain(|entry| {
            if let Some(ttl) = entry.ttl {
                get_current_timestamp() - entry.timestamp < ttl
            } else {
                true
            }
        });

        for entry in &mut self.cache {
            if entry.key == key {
                entry.access_count += 1;
                entry.last_accessed = get_current_timestamp();

                return Ok(Some(
                    serde_json::to_string(&entry)
                        .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?,
                ));
            }
        }
        Ok(None)
    }

    /// Delete from cache
    #[napi]
    pub fn cache_delete(&mut self, key: String) -> Result<bool> {
        let original_len = self.cache.len();
        self.cache.retain(|entry| entry.key != key);
        Ok(self.cache.len() < original_len)
    }

    /// Clear all cache
    #[napi]
    pub fn cache_clear(&mut self) -> Result<i32> {
        let count = self.cache.len() as i32;
        self.cache.clear();
        Ok(count)
    }

    /// Get cache statistics
    #[napi]
    pub fn cache_stats(&self) -> Result<String> {
        let stats = serde_json::json!({
            "total_entries": self.cache.len(),
            "capacity": self.max_cache_size / 1000,
            "utilization_percent": (self.cache.len() as f64 / ((self.max_cache_size / 1000) as f64)) * 100.0,
        });

        Ok(serde_json::to_string(&stats)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?)
    }

    /// Allocate memory pool
    #[napi]
    pub fn allocate_pool(
        &mut self,
        pool_id: String,
        size_bytes: i32,
    ) -> Result<String> {
        let allocation = MemoryPoolAllocation {
            pool_id: pool_id.clone(),
            size_bytes: size_bytes as usize,
            allocated: 0,
            available: size_bytes as usize,
            utilization_percent: 0.0,
        };

        self.pool_allocation.insert(pool_id, allocation.clone());

        Ok(serde_json::to_string(&allocation)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?)
    }

    /// Deallocate memory pool
    #[napi]
    pub fn deallocate_pool(&mut self, pool_id: String) -> Result<bool> {
        Ok(self.pool_allocation.remove(&pool_id).is_some())
    }

    /// Get pool status
    #[napi]
    pub fn get_pool_status(&self, pool_id: String) -> Result<Option<String>> {
        if let Some(pool) = self.pool_allocation.get(&pool_id) {
            return Ok(Some(
                serde_json::to_string(&pool)
                    .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?,
            ));
        }
        Ok(None)
    }

    /// Get all pool statuses
    #[napi]
    pub fn get_all_pool_statuses(&self) -> Result<String> {
        let pools: Vec<MemoryPoolAllocation> = self.pool_allocation.values().cloned().collect();
        serde_json::to_string(&pools)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))
    }

    /// Get overall memory statistics
    #[napi]
    pub fn get_memory_stats(&self) -> Result<String> {
        let stats = serde_json::json!({
            "short_term_count": self.short_term.len(),
            "short_term_max": self.max_short_term,
            "long_term_count": self.long_term.len(),
            "long_term_max": self.max_long_term,
            "cache_count": self.cache.len(),
            "cache_max": self.max_cache_size / 1000,
            "pool_count": self.pool_allocation.len(),
            "total_pools_size": self.pool_allocation.values().map(|p| p.size_bytes).sum::<usize>(),
        });

        Ok(serde_json::to_string(&stats)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?)
    }

    /// Save state to persistent storage (returns JSON)
    #[napi]
    pub fn persist_state(&self) -> Result<String> {
        let state = PersistenceState {
            short_term_entries: self.short_term.clone(),
            long_term_entries: self.long_term.values().cloned().collect(),
            cache_entries: self.cache.clone(),
            timestamp: get_current_timestamp(),
        };

        Ok(serde_json::to_string(&state)
            .map_err(|e| Error::from_reason(format!("Serialization failed: {}", e)))?)
    }

    /// Restore state from persistent storage
    #[napi]
    pub fn restore_state(&mut self, state_json: String) -> Result<String> {
        let state: PersistenceState = serde_json::from_str(&state_json)
            .map_err(|e| Error::from_reason(format!("Invalid state JSON: {}", e)))?;

        self.short_term = state.short_term_entries;
        self.long_term = state
            .long_term_entries
            .into_iter()
            .map(|entry| (entry.key.clone(), entry))
            .collect();
        self.cache = state.cache_entries;

        Ok(serde_json::json!({
            "restored_at": get_current_timestamp(),
            "short_term_restored": self.short_term.len(),
            "long_term_restored": self.long_term.len(),
            "cache_restored": self.cache.len(),
        })
        .to_string())
    }
}

// ============ Helper Functions ============

impl MemoryManager {
    fn evict_lru(&mut self) {
        if self.cache.is_empty() {
            return;
        }

        // Find least recently used entry
        let mut lru_index = 0;
        for (i, entry) in self.cache.iter().enumerate() {
            if entry.access_count < self.cache[lru_index].access_count
                || (entry.access_count == self.cache[lru_index].access_count
                    && entry.last_accessed < self.cache[lru_index].last_accessed)
            {
                lru_index = i;
            }
        }

        self.cache.remove(lru_index);
    }
}

/// Get current timestamp in milliseconds
fn get_current_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    duration.as_millis() as u64
}

/// Generate a simple UUID v4-like string
fn uuid_v4() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    let nanos = duration.subsec_nanos();
    let secs = duration.as_secs();

    format!(
        "{:08x}-{:04x}-4{:03x}-{:04x}-{:012x}",
        nanos,
        (nanos >> 8) & 0xffff,
        (nanos >> 20) & 0xfff,
        ((secs >> 16) & 0x3fff) as u32 | 0x8000,
        (secs.wrapping_mul(1103515245).wrapping_add(12345)) & 0xffffffffffff
    )
}

// Standalone functions for simpler API

/// Create a new memory manager
#[napi]
pub fn create_memory_manager(config_json: Option<String>) -> Result<MemoryManager> {
    MemoryManager::new(config_json)
}

/// Get current timestamp (utility function)
#[napi]
pub fn get_timestamp() -> i64 {
    get_current_timestamp() as i64
}
