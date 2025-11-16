// NT Agent Database Client - TypeScript bindings
// Database client for NT (Neural Trading) agent persistence

export interface AgentRecord {
  id: string
  agent_id: string
  data: Record<string, any>
  created_at: string
  updated_at: string
  version: number
}

export interface QueryFilter {
  field: string
  operator: string
  value: any
}

export interface QueryOptions {
  offset?: number
  limit?: number
  sort_by?: string
  sort_order?: string
}

export interface QueryResult {
  records: AgentRecord[]
  total_count: number
  offset: number
  limit: number
  has_more: boolean
}

export interface Transaction {
  id: string
  status: string
  operations: string[]
  created_at: string
}

/**
 * Native bindings from nt_agentdb_client Rust module
 */
let agentDbModule: any

try {
  // Load the native module via platform loader
  agentDbModule = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_agentdb_client module not loaded. Build the project first.')
  agentDbModule = null
}

/**
 * Create a new database client connection
 * @param connectionString - Connection string for the database
 * @returns AgentDbClient instance
 */
export function createClient(connectionString: string): AgentDbClient {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  return new AgentDbClient(connectionString)
}

/**
 * Check if database client is connected
 * @param clientJson - JSON string of client state
 * @returns Boolean indicating connection status
 */
export function isConnected(clientJson: string): boolean {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  return agentDbModule.isConnected(clientJson)
}

/**
 * Get connection information
 * @param connectionString - Connection string
 * @returns Connection info object
 */
export function getConnectionInfo(connectionString: string): Record<string, any> {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const result = agentDbModule.getConnectionInfo(connectionString)
  return JSON.parse(result)
}

/**
 * Create a new agent record in the database
 * @param record - Agent record object to create
 * @returns Created record with timestamps
 */
export function createRecord(record: AgentRecord): AgentRecord {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const recordJson = JSON.stringify(record)
  const result = agentDbModule.createRecord(recordJson)

  return JSON.parse(result)
}

/**
 * Read an agent record from the database
 * @param recordId - ID of the record to read
 * @returns Agent record
 */
export function readRecord(recordId: string): AgentRecord {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const result = agentDbModule.readRecord(recordId)

  return JSON.parse(result)
}

/**
 * Update an existing agent record
 * @param record - Updated record object
 * @returns Updated record with new timestamp and version
 */
export function updateRecord(record: AgentRecord): AgentRecord {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const recordJson = JSON.stringify(record)
  const result = agentDbModule.updateRecord(recordJson)

  return JSON.parse(result)
}

/**
 * Delete an agent record from the database
 * @param recordId - ID of the record to delete
 * @returns Deletion result
 */
export function deleteRecord(recordId: string): Record<string, any> {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const result = agentDbModule.deleteRecord(recordId)

  return JSON.parse(result)
}

/**
 * Query records with filtering and pagination
 * @param filters - Array of query filters
 * @param options - Query options (offset, limit, sorting)
 * @returns Query result with records and metadata
 */
export function queryRecords(
  filters: QueryFilter[] = [],
  options?: QueryOptions
): QueryResult {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const filtersJson = JSON.stringify(filters)
  const optionsJson = JSON.stringify(options || {})
  const result = agentDbModule.queryRecords(filtersJson, optionsJson)

  return JSON.parse(result)
}

/**
 * Query records by agent ID
 * @param agentId - Agent ID to query
 * @param limit - Maximum records to return
 * @returns Array of agent records
 */
export function queryByAgentId(agentId: string, limit: number = 10): AgentRecord[] {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const result = agentDbModule.queryByAgentId(agentId, limit)

  return JSON.parse(result)
}

/**
 * Count records matching filters
 * @param filters - Array of query filters
 * @returns Count of matching records
 */
export function countRecords(filters: QueryFilter[] = []): number {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const filtersJson = JSON.stringify(filters)

  return agentDbModule.countRecords(filtersJson)
}

/**
 * Begin a new transaction
 * @returns Transaction object with ID
 */
export function beginTransaction(): Transaction {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const result = agentDbModule.beginTransaction()

  return JSON.parse(result)
}

/**
 * Commit a transaction
 * @param transactionId - ID of transaction to commit
 * @returns Commit result
 */
export function commitTransaction(transactionId: string): Record<string, any> {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const result = agentDbModule.commitTransaction(transactionId)

  return JSON.parse(result)
}

/**
 * Rollback a transaction
 * @param transactionId - ID of transaction to rollback
 * @returns Rollback result
 */
export function rollbackTransaction(transactionId: string): Record<string, any> {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const result = agentDbModule.rollbackTransaction(transactionId)

  return JSON.parse(result)
}

/**
 * Create multiple records in a batch
 * @param records - Array of agent records to create
 * @returns Array of created records
 */
export function batchCreateRecords(records: AgentRecord[]): AgentRecord[] {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const recordsJson = JSON.stringify(records)
  const result = agentDbModule.batchCreateRecords(recordsJson)

  return JSON.parse(result)
}

/**
 * Update multiple records in a batch
 * @param records - Array of agent records to update
 * @returns Array of updated records
 */
export function batchUpdateRecords(records: AgentRecord[]): AgentRecord[] {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const recordsJson = JSON.stringify(records)
  const result = agentDbModule.batchUpdateRecords(recordsJson)

  return JSON.parse(result)
}

/**
 * Delete multiple records in a batch
 * @param recordIds - Array of record IDs to delete
 * @returns Batch deletion result
 */
export function batchDeleteRecords(recordIds: string[]): Record<string, any> {
  if (!agentDbModule) {
    throw new Error('Native module not available')
  }

  const recordIdsJson = JSON.stringify(recordIds)
  const result = agentDbModule.batchDeleteRecords(recordIdsJson)

  return JSON.parse(result)
}

/**
 * Agent Database Client class for object-oriented interface
 */
export class AgentDbClient {
  private client: any

  /**
   * Create a new agent database client
   * @param connectionString - Connection string for the database
   */
  constructor(connectionString: string) {
    if (!agentDbModule) {
      throw new Error('Native module not available')
    }

    this.client = new agentDbModule.AgentDbClient(connectionString)
  }

  /**
   * Check if client is connected
   */
  async isConnected(): Promise<boolean> {
    return this.client.isConnected()
  }

  /**
   * Get connection string
   */
  getConnectionString(): string {
    return this.client.getConnectionString()
  }

  /**
   * Create a record
   */
  create(record: AgentRecord): AgentRecord {
    return createRecord(record)
  }

  /**
   * Read a record
   */
  read(recordId: string): AgentRecord {
    return readRecord(recordId)
  }

  /**
   * Update a record
   */
  update(record: AgentRecord): AgentRecord {
    return updateRecord(record)
  }

  /**
   * Delete a record
   */
  delete(recordId: string): Record<string, any> {
    return deleteRecord(recordId)
  }

  /**
   * Query records with filtering and pagination
   */
  query(filters?: QueryFilter[], options?: QueryOptions): QueryResult {
    return queryRecords(filters, options)
  }

  /**
   * Query records by agent ID
   */
  queryByAgentId(agentId: string, limit?: number): AgentRecord[] {
    return queryByAgentId(agentId, limit)
  }

  /**
   * Count records
   */
  count(filters?: QueryFilter[]): number {
    return countRecords(filters)
  }

  /**
   * Begin a transaction
   */
  beginTransaction(): Transaction {
    return beginTransaction()
  }

  /**
   * Commit a transaction
   */
  commit(transactionId: string): Record<string, any> {
    return commitTransaction(transactionId)
  }

  /**
   * Rollback a transaction
   */
  rollback(transactionId: string): Record<string, any> {
    return rollbackTransaction(transactionId)
  }

  /**
   * Batch create records
   */
  batchCreate(records: AgentRecord[]): AgentRecord[] {
    return batchCreateRecords(records)
  }

  /**
   * Batch update records
   */
  batchUpdate(records: AgentRecord[]): AgentRecord[] {
    return batchUpdateRecords(records)
  }

  /**
   * Batch delete records
   */
  batchDelete(recordIds: string[]): Record<string, any> {
    return batchDeleteRecords(recordIds)
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.client && this.client.close) {
      this.client.close()
    }
  }
}

// Export all types and functions
export default {
  createClient,
  isConnected,
  getConnectionInfo,
  createRecord,
  readRecord,
  updateRecord,
  deleteRecord,
  queryRecords,
  queryByAgentId,
  countRecords,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  batchCreateRecords,
  batchUpdateRecords,
  batchDeleteRecords,
  AgentDbClient,
}
