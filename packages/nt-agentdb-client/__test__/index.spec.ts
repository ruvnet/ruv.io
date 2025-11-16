import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  AgentDbClient,
  AgentRecord,
  QueryFilter,
  QueryOptions,
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
} from '../src/index'

describe('NT Agent Database Client - Core Functionality', () => {
  let client: AgentDbClient
  const connectionString = 'postgresql://localhost/nt_agent_db'

  const sampleRecord: AgentRecord = {
    id: 'rec-001',
    agent_id: 'agent-001',
    data: {
      status: 'active',
      strategy: 'momentum',
      balance: 10000,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    version: 1,
  }

  const sampleRecord2: AgentRecord = {
    id: 'rec-002',
    agent_id: 'agent-002',
    data: {
      status: 'active',
      strategy: 'mean-reversion',
      balance: 5000,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    version: 1,
  }

  describe('Connection Management', () => {
    it('should create a new database client', () => {
      client = createClient(connectionString)

      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(AgentDbClient)
    })

    it('should get connection string from client', () => {
      client = createClient(connectionString)
      const connStr = client.getConnectionString()

      expect(connStr).toBe(connectionString)
    })

    it('should check connection status', async () => {
      client = createClient(connectionString)
      const connected = await client.isConnected()

      expect(typeof connected).toBe('boolean')
      expect(connected).toBe(true)
    })

    it('should get connection info', () => {
      const info = getConnectionInfo(connectionString)

      expect(info).toBeDefined()
      expect(info.connection_string).toBe(connectionString)
      expect(info.status).toBe('connected')
      expect(info.timestamp).toBeDefined()
    })

    it('should close database connection', () => {
      client = createClient(connectionString)
      expect(() => {
        client.close()
      }).not.toThrow()
    })
  })

  describe('CRUD Operations - Create', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should create a new agent record', () => {
      const record = createRecord(sampleRecord)

      expect(record).toBeDefined()
      expect(record.id).toBe(sampleRecord.id)
      expect(record.agent_id).toBe(sampleRecord.agent_id)
      expect(record.created_at).toBeDefined()
      expect(record.updated_at).toBeDefined()
    })

    it('should create record via client method', () => {
      const record = client.create(sampleRecord)

      expect(record).toBeDefined()
      expect(record.id).toBe(sampleRecord.id)
      expect(record.version).toBe(1)
    })

    it('should set timestamps on created record', () => {
      const record = createRecord(sampleRecord)

      expect(record.created_at).not.toBeNull()
      expect(record.updated_at).not.toBeNull()
    })

    it('should increment version on creation', () => {
      const recordInput = { ...sampleRecord, version: 0 }
      const record = createRecord(recordInput)

      expect(record.version).toBe(1)
    })
  })

  describe('CRUD Operations - Read', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should read an agent record by ID', () => {
      const record = readRecord('rec-001')

      expect(record).toBeDefined()
      expect(record.id).toBe('rec-001')
      expect(record.agent_id).toBeDefined()
      expect(record.data).toBeDefined()
    })

    it('should read record via client method', () => {
      const record = client.read('rec-001')

      expect(record).toBeDefined()
      expect(record.id).toBe('rec-001')
    })

    it('should preserve agent data in read record', () => {
      const record = readRecord('rec-001')

      expect(record.data).toBeInstanceOf(Object)
      expect(record.data.status).toBeDefined()
    })

    it('should include version information', () => {
      const record = readRecord('rec-001')

      expect(record.version).toBeGreaterThan(0)
    })
  })

  describe('CRUD Operations - Update', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should update an agent record', () => {
      const updated = { ...sampleRecord, data: { ...sampleRecord.data, balance: 15000 } }
      const record = updateRecord(updated)

      expect(record).toBeDefined()
      expect(record.id).toBe(sampleRecord.id)
      expect(record.data.balance).toBe(15000)
    })

    it('should update record via client method', () => {
      const updated = { ...sampleRecord, data: { ...sampleRecord.data, status: 'paused' } }
      const record = client.update(updated)

      expect(record).toBeDefined()
      expect(record.data.status).toBe('paused')
    })

    it('should increment version on update', () => {
      const originalVersion = sampleRecord.version
      const updated = { ...sampleRecord, version: originalVersion }
      const record = updateRecord(updated)

      expect(record.version).toBe(originalVersion + 1)
    })

    it('should update timestamp on update', () => {
      const record = updateRecord(sampleRecord)

      expect(record.updated_at).toBeDefined()
      expect(record.created_at).toBeDefined()
    })
  })

  describe('CRUD Operations - Delete', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should delete an agent record', () => {
      const result = deleteRecord('rec-001')

      expect(result).toBeDefined()
      expect(result.deleted).toBe(true)
      expect(result.id).toBe('rec-001')
    })

    it('should delete record via client method', () => {
      const result = client.delete('rec-002')

      expect(result).toBeDefined()
      expect(result.deleted).toBe(true)
    })

    it('should return timestamp on deletion', () => {
      const result = deleteRecord('rec-003')

      expect(result.timestamp).toBeDefined()
    })
  })

  describe('Query Interface - Filtering', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should query records with filters', () => {
      const filters: QueryFilter[] = [
        { field: 'status', operator: 'eq', value: 'active' },
      ]
      const result = queryRecords(filters)

      expect(result).toBeDefined()
      expect(Array.isArray(result.records)).toBe(true)
      expect(result.total_count).toBeGreaterThanOrEqual(0)
    })

    it('should query records via client method', () => {
      const filters: QueryFilter[] = [
        { field: 'agent_id', operator: 'eq', value: 'agent-001' },
      ]
      const result = client.query(filters)

      expect(result).toBeDefined()
      expect(result.records).toBeDefined()
    })

    it('should support multiple filters', () => {
      const filters: QueryFilter[] = [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'strategy', operator: 'eq', value: 'momentum' },
      ]
      const result = queryRecords(filters)

      expect(result).toBeDefined()
      expect(result.total_count).toBeGreaterThanOrEqual(0)
    })

    it('should return query results with pagination info', () => {
      const filters: QueryFilter[] = []
      const result = queryRecords(filters)

      expect(result.offset).toBeDefined()
      expect(result.limit).toBeDefined()
      expect(result.has_more).toBeDefined()
    })
  })

  describe('Query Interface - Pagination', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should support offset and limit options', () => {
      const options: QueryOptions = {
        offset: 0,
        limit: 10,
      }
      const result = queryRecords([], options)

      expect(result).toBeDefined()
      expect(result.offset).toBe(0)
      expect(result.limit).toBe(10)
    })

    it('should support sorting options', () => {
      const options: QueryOptions = {
        sort_by: 'created_at',
        sort_order: 'desc',
      }
      const result = queryRecords([], options)

      expect(result).toBeDefined()
      expect(result.records).toBeDefined()
    })

    it('should apply pagination via client method', () => {
      const options: QueryOptions = {
        offset: 5,
        limit: 20,
      }
      const result = client.query([], options)

      expect(result.offset).toBe(5)
      expect(result.limit).toBe(20)
    })

    it('should indicate if more records are available', () => {
      const options: QueryOptions = {
        offset: 0,
        limit: 10,
      }
      const result = queryRecords([], options)

      expect(typeof result.has_more).toBe('boolean')
    })
  })

  describe('Query Interface - Specialized Queries', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should query records by agent ID', () => {
      const records = queryByAgentId('agent-001')

      expect(Array.isArray(records)).toBe(true)
      expect(records.length).toBeGreaterThanOrEqual(0)
    })

    it('should query by agent ID via client', () => {
      const records = client.queryByAgentId('agent-001', 5)

      expect(Array.isArray(records)).toBe(true)
    })

    it('should respect limit in agent ID query', () => {
      const records = queryByAgentId('agent-001', 3)

      expect(records.length).toBeLessThanOrEqual(3)
    })

    it('should count records with filters', () => {
      const filters: QueryFilter[] = [
        { field: 'status', operator: 'eq', value: 'active' },
      ]
      const count = countRecords(filters)

      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should count records via client method', () => {
      const count = client.count()

      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Transaction Support', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should begin a new transaction', () => {
      const transaction = beginTransaction()

      expect(transaction).toBeDefined()
      expect(transaction.id).toBeDefined()
      expect(transaction.status).toBe('active')
      expect(transaction.created_at).toBeDefined()
    })

    it('should begin transaction via client method', () => {
      const transaction = client.beginTransaction()

      expect(transaction).toBeDefined()
      expect(transaction.id).toBeDefined()
    })

    it('should commit a transaction', () => {
      const transaction = beginTransaction()
      const result = commitTransaction(transaction.id)

      expect(result).toBeDefined()
      expect(result.status).toBe('committed')
      expect(result.transaction_id).toBe(transaction.id)
    })

    it('should commit transaction via client method', () => {
      const transaction = beginTransaction()
      const result = client.commit(transaction.id)

      expect(result.status).toBe('committed')
    })

    it('should rollback a transaction', () => {
      const transaction = beginTransaction()
      const result = rollbackTransaction(transaction.id)

      expect(result).toBeDefined()
      expect(result.status).toBe('rolled_back')
      expect(result.transaction_id).toBe(transaction.id)
    })

    it('should rollback transaction via client method', () => {
      const transaction = beginTransaction()
      const result = client.rollback(transaction.id)

      expect(result.status).toBe('rolled_back')
    })
  })

  describe('Batch Operations', () => {
    beforeAll(() => {
      client = createClient(connectionString)
    })

    it('should batch create records', () => {
      const records = [sampleRecord, sampleRecord2]
      const results = batchCreateRecords(records)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(2)
    })

    it('should batch create via client method', () => {
      const records = [sampleRecord, sampleRecord2]
      const results = client.batchCreate(records)

      expect(results.length).toBe(2)
    })

    it('should batch update records', () => {
      const records = [
        { ...sampleRecord, data: { ...sampleRecord.data, balance: 20000 } },
        { ...sampleRecord2, data: { ...sampleRecord2.data, balance: 8000 } },
      ]
      const results = batchUpdateRecords(records)

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(2)
    })

    it('should batch update via client method', () => {
      const records = [
        { ...sampleRecord, version: 2 },
        { ...sampleRecord2, version: 2 },
      ]
      const results = client.batchUpdate(records)

      expect(results.length).toBe(2)
      results.forEach((record) => {
        expect(record.version).toBeGreaterThanOrEqual(2)
      })
    })

    it('should batch delete records', () => {
      const recordIds = ['rec-001', 'rec-002', 'rec-003']
      const result = batchDeleteRecords(recordIds)

      expect(result).toBeDefined()
      expect(result.deleted_count).toBe(3)
      expect(Array.isArray(result.record_ids)).toBe(true)
    })

    it('should batch delete via client method', () => {
      const recordIds = ['rec-004', 'rec-005']
      const result = client.batchDelete(recordIds)

      expect(result.deleted_count).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid connection string gracefully', () => {
      expect(() => {
        createClient('')
      }).not.toThrow()
    })

    it('should handle query with empty filters', () => {
      expect(() => {
        queryRecords([])
      }).not.toThrow()
    })

    it('should handle batch operations with empty arrays', () => {
      expect(() => {
        batchCreateRecords([])
      }).not.toThrow()
    })

    it('should handle transaction operations gracefully', () => {
      expect(() => {
        const transaction = beginTransaction()
        commitTransaction(transaction.id)
      }).not.toThrow()
    })
  })

  describe('Integration Tests', () => {
    it('should perform complete CRUD workflow', () => {
      const client = createClient(connectionString)

      // Create
      const created = createRecord(sampleRecord)
      expect(created.id).toBe(sampleRecord.id)

      // Read
      const read = readRecord(created.id)
      expect(read.id).toBe(created.id)

      // Update
      const updated = updateRecord({ ...read, data: { ...read.data, balance: 25000 } })
      expect(updated.version).toBeGreaterThan(read.version)

      // Query
      const queryResult = queryRecords()
      expect(queryResult.records).toBeDefined()

      // Delete
      const deleted = deleteRecord(updated.id)
      expect(deleted.deleted).toBe(true)

      client.close()
    })

    it('should perform transaction workflow', () => {
      const client = createClient(connectionString)

      // Begin transaction
      const transaction = beginTransaction()
      expect(transaction.status).toBe('active')

      // Perform operations within transaction
      const created = createRecord(sampleRecord)
      expect(created).toBeDefined()

      // Commit
      const committed = commitTransaction(transaction.id)
      expect(committed.status).toBe('committed')

      client.close()
    })

    it('should perform batch operations workflow', () => {
      const records = [sampleRecord, sampleRecord2]

      // Batch create
      const created = batchCreateRecords(records)
      expect(created.length).toBe(2)

      // Batch update
      const toUpdate = created.map((r) => ({
        ...r,
        data: { ...r.data, status: 'processing' },
      }))
      const updated = batchUpdateRecords(toUpdate)
      expect(updated.length).toBe(2)

      // Batch delete
      const ids = updated.map((r) => r.id)
      const deleted = batchDeleteRecords(ids)
      expect(deleted.deleted_count).toBe(2)
    })

    it('should handle complex query scenarios', () => {
      const filters: QueryFilter[] = [
        { field: 'status', operator: 'eq', value: 'active' },
        { field: 'strategy', operator: 'in', value: ['momentum', 'mean-reversion'] },
      ]

      const options: QueryOptions = {
        offset: 0,
        limit: 25,
        sort_by: 'updated_at',
        sort_order: 'desc',
      }

      const result = queryRecords(filters, options)

      expect(result).toBeDefined()
      expect(result.records).toBeDefined()
      expect(result.total_count).toBeGreaterThanOrEqual(0)
      expect(result.has_more).toBeDefined()
    })

    it('should maintain data integrity across operations', () => {
      const originalRecord = { ...sampleRecord }

      // Create
      const created = createRecord(originalRecord)

      // Update
      const updated = updateRecord({
        ...created,
        data: { ...created.data, balance: 50000 },
      })

      // Verify data integrity
      expect(updated.id).toBe(originalRecord.id)
      expect(updated.agent_id).toBe(originalRecord.agent_id)
      expect(updated.created_at).toBe(created.created_at)
      expect(updated.version).toBeGreaterThan(created.version)
    })
  })
})
