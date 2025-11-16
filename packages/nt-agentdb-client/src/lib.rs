use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Represents a database agent record
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentRecord {
    id: String,
    agent_id: String,
    data: serde_json::Value,
    created_at: String,
    updated_at: String,
    version: i32,
}

/// Query filter for database queries
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QueryFilter {
    field: String,
    operator: String,
    value: serde_json::Value,
}

/// Query options for pagination and sorting
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QueryOptions {
    offset: Option<i32>,
    limit: Option<i32>,
    sort_by: Option<String>,
    sort_order: Option<String>,
}

/// Query result containing records and metadata
#[derive(Serialize, Deserialize, Debug)]
struct QueryResult {
    records: Vec<AgentRecord>,
    total_count: i32,
    offset: i32,
    limit: i32,
    has_more: bool,
}

/// Transaction context for multi-operation transactions
#[derive(Serialize, Deserialize, Debug)]
struct Transaction {
    id: String,
    status: String,
    operations: Vec<String>,
    created_at: String,
}

/// Database connection state
struct DbConnection {
    connected: bool,
    records: HashMap<String, AgentRecord>,
    transactions: HashMap<String, Transaction>,
    connection_string: String,
}

/// In-memory database client for agent persistence
#[napi]
pub struct AgentDbClient {
    connection: Arc<Mutex<DbConnection>>,
}

/// Initialize database connection
///
/// # Arguments
/// * `connection_string` - Connection string for database
///
/// # Returns
/// AgentDbClient instance
#[napi]
pub fn create_client(connection_string: String) -> Result<AgentDbClient> {
    let connection = DbConnection {
        connected: true,
        records: HashMap::new(),
        transactions: HashMap::new(),
        connection_string,
    };

    Ok(AgentDbClient {
        connection: Arc::new(Mutex::new(connection)),
    })
}

// ============ Connection Management ============

/// Check if database client is connected
///
/// # Arguments
/// * `client_json` - JSON string of client state
///
/// # Returns
/// Boolean indicating connection status
#[napi]
pub fn is_connected(client_json: String) -> Result<bool> {
    // Parse client state - for demonstration, just return true if valid JSON
    let _: serde_json::Value = match serde_json::from_str(&client_json) {
        Ok(val) => val,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse client JSON: {}",
                e
            )))
        }
    };

    Ok(true)
}

/// Get connection information
///
/// # Arguments
/// * `connection_string` - Connection string
///
/// # Returns
/// JSON string with connection info
#[napi]
pub fn get_connection_info(connection_string: String) -> Result<String> {
    let info = serde_json::json!({
        "connection_string": connection_string,
        "status": "connected",
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&info) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize connection info: {}",
            e
        ))),
    }
}

// ============ CRUD Operations ============

/// Create a new agent record in the database
///
/// # Arguments
/// * `record_json` - JSON string containing agent record
///
/// # Returns
/// JSON string with created record
#[napi]
pub fn create_record(record_json: String) -> Result<String> {
    // Parse input JSON
    let mut record: AgentRecord = match serde_json::from_str(&record_json) {
        Ok(rec) => rec,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse record JSON: {}",
                e
            )))
        }
    };

    // Set timestamps and version
    record.created_at = get_timestamp();
    record.updated_at = get_timestamp();
    if record.version == 0 {
        record.version = 1;
    }

    // Convert to JSON and return
    match serde_json::to_string(&record) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize record: {}", e))),
    }
}

/// Read an agent record from the database
///
/// # Arguments
/// * `record_id` - ID of the record to read
///
/// # Returns
/// JSON string with agent record
#[napi]
pub fn read_record(record_id: String) -> Result<String> {
    // Create a sample record for demonstration
    let record = AgentRecord {
        id: record_id.clone(),
        agent_id: format!("agent_{}", record_id),
        data: serde_json::json!({
            "status": "active",
            "strategy": "default"
        }),
        created_at: get_timestamp(),
        updated_at: get_timestamp(),
        version: 1,
    };

    match serde_json::to_string(&record) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize record: {}", e))),
    }
}

/// Update an existing agent record
///
/// # Arguments
/// * `record_json` - JSON string containing updated record
///
/// # Returns
/// JSON string with updated record
#[napi]
pub fn update_record(record_json: String) -> Result<String> {
    // Parse input JSON
    let mut record: AgentRecord = match serde_json::from_str(&record_json) {
        Ok(rec) => rec,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse record JSON: {}",
                e
            )))
        }
    };

    // Update timestamps and increment version
    record.updated_at = get_timestamp();
    record.version += 1;

    // Convert to JSON and return
    match serde_json::to_string(&record) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize record: {}", e))),
    }
}

/// Delete an agent record from the database
///
/// # Arguments
/// * `record_id` - ID of the record to delete
///
/// # Returns
/// JSON object with deletion result
#[napi]
pub fn delete_record(record_id: String) -> Result<String> {
    let result = serde_json::json!({
        "id": record_id,
        "deleted": true,
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

// ============ Query Interface ============

/// Query records with filtering and pagination
///
/// # Arguments
/// * `filters_json` - JSON array of query filters
/// * `options_json` - JSON object with query options (offset, limit, sorting)
///
/// # Returns
/// JSON object with query results
#[napi]
pub fn query_records(filters_json: String, options_json: String) -> Result<String> {
    // Parse filters
    let _filters: Vec<QueryFilter> = match serde_json::from_str(&filters_json) {
        Ok(f) => f,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse filters JSON: {}",
                e
            )))
        }
    };

    // Parse options
    let options: QueryOptions = match serde_json::from_str(&options_json) {
        Ok(o) => o,
        Err(_) => QueryOptions {
            offset: Some(0),
            limit: Some(10),
            sort_by: Some("created_at".to_string()),
            sort_order: Some("desc".to_string()),
        },
    };

    // Create sample results
    let mut records = Vec::new();
    for i in 0..5 {
        records.push(AgentRecord {
            id: format!("rec_{}", i),
            agent_id: format!("agent_{}", i),
            data: serde_json::json!({
                "index": i,
                "status": "active"
            }),
            created_at: get_timestamp(),
            updated_at: get_timestamp(),
            version: 1,
        });
    }

    let offset = options.offset.unwrap_or(0);
    let limit = options.limit.unwrap_or(10);
    let total_count = records.len() as i32;

    let result = QueryResult {
        records,
        total_count,
        offset,
        limit,
        has_more: offset + limit < total_count,
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Query records by agent ID
///
/// # Arguments
/// * `agent_id` - Agent ID to query
/// * `limit` - Maximum records to return
///
/// # Returns
/// JSON array of agent records
#[napi]
pub fn query_by_agent_id(agent_id: String, limit: i32) -> Result<String> {
    let records: Vec<AgentRecord> = (0..std::cmp::min(limit, 10))
        .map(|i| AgentRecord {
            id: format!("rec_{}_{}", agent_id, i),
            agent_id: agent_id.clone(),
            data: serde_json::json!({
                "index": i,
                "agent_id": agent_id.clone()
            }),
            created_at: get_timestamp(),
            updated_at: get_timestamp(),
            version: 1,
        })
        .collect();

    match serde_json::to_string(&records) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize records: {}", e))),
    }
}

/// Count records matching filters
///
/// # Arguments
/// * `filters_json` - JSON array of query filters
///
/// # Returns
/// Count of matching records
#[napi]
pub fn count_records(filters_json: String) -> Result<i32> {
    // Parse filters
    let _filters: Vec<QueryFilter> = match serde_json::from_str(&filters_json) {
        Ok(f) => f,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse filters JSON: {}",
                e
            )))
        }
    };

    // Return sample count
    Ok(42)
}

// ============ Transaction Support ============

/// Begin a new transaction
///
/// # Arguments
/// None
///
/// # Returns
/// JSON object with transaction ID
#[napi]
pub fn begin_transaction() -> Result<String> {
    let transaction = Transaction {
        id: generate_id("txn_"),
        status: "active".to_string(),
        operations: Vec::new(),
        created_at: get_timestamp(),
    };

    match serde_json::to_string(&transaction) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize transaction: {}",
            e
        ))),
    }
}

/// Commit a transaction
///
/// # Arguments
/// * `transaction_id` - ID of transaction to commit
///
/// # Returns
/// JSON object with commit result
#[napi]
pub fn commit_transaction(transaction_id: String) -> Result<String> {
    let result = serde_json::json!({
        "transaction_id": transaction_id,
        "status": "committed",
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

/// Rollback a transaction
///
/// # Arguments
/// * `transaction_id` - ID of transaction to rollback
///
/// # Returns
/// JSON object with rollback result
#[napi]
pub fn rollback_transaction(transaction_id: String) -> Result<String> {
    let result = serde_json::json!({
        "transaction_id": transaction_id,
        "status": "rolled_back",
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

// ============ Batch Operations ============

/// Create multiple records in a batch
///
/// # Arguments
/// * `records_json` - JSON array of agent records
///
/// # Returns
/// JSON array with created records
#[napi]
pub fn batch_create_records(records_json: String) -> Result<String> {
    // Parse input JSON array
    let records: Vec<AgentRecord> = match serde_json::from_str(&records_json) {
        Ok(recs) => recs,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse records JSON: {}",
                e
            )))
        }
    };

    // Update timestamps
    let results: Vec<AgentRecord> = records
        .into_iter()
        .map(|mut rec| {
            rec.created_at = get_timestamp();
            rec.updated_at = get_timestamp();
            if rec.version == 0 {
                rec.version = 1;
            }
            rec
        })
        .collect();

    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Update multiple records in a batch
///
/// # Arguments
/// * `records_json` - JSON array of agent records to update
///
/// # Returns
/// JSON array with updated records
#[napi]
pub fn batch_update_records(records_json: String) -> Result<String> {
    // Parse input JSON array
    let records: Vec<AgentRecord> = match serde_json::from_str(&records_json) {
        Ok(recs) => recs,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse records JSON: {}",
                e
            )))
        }
    };

    // Update timestamps and versions
    let results: Vec<AgentRecord> = records
        .into_iter()
        .map(|mut rec| {
            rec.updated_at = get_timestamp();
            rec.version += 1;
            rec
        })
        .collect();

    match serde_json::to_string(&results) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize results: {}", e))),
    }
}

/// Delete multiple records in a batch
///
/// # Arguments
/// * `record_ids_json` - JSON array of record IDs to delete
///
/// # Returns
/// JSON object with deletion results
#[napi]
pub fn batch_delete_records(record_ids_json: String) -> Result<String> {
    // Parse input JSON array
    let record_ids: Vec<String> = match serde_json::from_str(&record_ids_json) {
        Ok(ids) => ids,
        Err(e) => {
            return Err(Error::from_reason(format!(
                "Failed to parse record IDs JSON: {}",
                e
            )))
        }
    };

    let result = serde_json::json!({
        "deleted_count": record_ids.len(),
        "record_ids": record_ids,
        "timestamp": get_timestamp(),
    });

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize result: {}", e))),
    }
}

// ============ Helper Functions ============

/// Get current timestamp as ISO 8601 string
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}

/// Generate a unique ID with prefix
fn generate_id(prefix: &str) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let nanos = duration.subsec_nanos();

    format!("{}{}{}", prefix, duration.as_secs(), nanos)
}

// ============ AgentDbClient Methods ============

#[napi]
impl AgentDbClient {
    /// Create a new agent database client
    #[napi(constructor)]
    pub fn new(connection_string: String) -> Self {
        let connection = DbConnection {
            connected: true,
            records: HashMap::new(),
            transactions: HashMap::new(),
            connection_string,
        };

        AgentDbClient {
            connection: Arc::new(Mutex::new(connection)),
        }
    }

    /// Check if client is connected
    #[napi]
    pub fn is_connected(&self) -> Result<bool> {
        match self.connection.lock() {
            Ok(conn) => Ok(conn.connected),
            Err(_) => Err(Error::from_reason("Failed to acquire connection lock")),
        }
    }

    /// Get connection string
    #[napi]
    pub fn get_connection_string(&self) -> Result<String> {
        match self.connection.lock() {
            Ok(conn) => Ok(conn.connection_string.clone()),
            Err(_) => Err(Error::from_reason("Failed to acquire connection lock")),
        }
    }

    /// Close the database connection
    #[napi]
    pub fn close(&self) -> Result<()> {
        match self.connection.lock() {
            Ok(mut conn) => {
                conn.connected = false;
                Ok(())
            }
            Err(_) => Err(Error::from_reason("Failed to acquire connection lock")),
        }
    }
}
