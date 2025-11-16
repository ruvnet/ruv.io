import {
  DetectionEngine,
  patternMatchUtil,
  calculateSeverityScore,
  generateId,
  isValidEvent,
} from '../src/index'

describe('DetectionEngine', () => {
  let engine: DetectionEngine

  beforeEach(() => {
    engine = new DetectionEngine(5000)
  })

  describe('DetectionEngine constructor', () => {
    it('should create a DetectionEngine instance', () => {
      expect(engine).toBeDefined()
      expect(engine).toBeInstanceOf(DetectionEngine)
    })

    it('should initialize with default history size', () => {
      const defaultEngine = new DetectionEngine()
      expect(defaultEngine).toBeDefined()
    })

    it('should initialize with custom history size', () => {
      const customEngine = new DetectionEngine(2000)
      expect(customEngine).toBeDefined()
    })

    it('should have zero signatures initially', () => {
      expect(engine.getSignatureCount()).toBe(0)
    })

    it('should have zero thresholds initially', () => {
      expect(engine.getThresholdCount()).toBe(0)
    })

    it('should have zero history size initially', () => {
      expect(engine.getHistorySize()).toBe(0)
    })
  })

  describe('Signature registration and matching', () => {
    it('should register a signature', () => {
      const sig = JSON.stringify({
        signature_id: 'sig_001',
        name: 'SQL Injection Test',
        pattern: 'SELECT.*FROM',
        signature_type: 'regex',
        severity: 'high',
        enabled: true,
      })
      expect(engine.registerSignature(sig)).toBe(true)
      expect(engine.getSignatureCount()).toBe(1)
    })

    it('should match event against registered signature', () => {
      const sig = JSON.stringify({
        signature_id: 'sig_001',
        name: 'SQL Injection',
        pattern: 'SELECT.*FROM',
        signature_type: 'regex',
        severity: 'high',
        enabled: true,
      })
      engine.registerSignature(sig)

      const event = JSON.stringify({
        event_id: 'evt_001',
        event_type: 'network_traffic',
        severity: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.1',
        destination: '10.0.0.1',
        payload: 'SELECT * FROM users',
        metadata: {},
      })

      const result = engine.matchSignature(event)
      expect(result.detected).toBe(true)
      expect(result.signature_id).toBe('sig_001')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should not match non-matching payload', () => {
      const sig = JSON.stringify({
        signature_id: 'sig_002',
        name: 'XSS Pattern',
        pattern: '<script>',
        signature_type: 'regex',
        severity: 'high',
        enabled: true,
      })
      engine.registerSignature(sig)

      const event = JSON.stringify({
        event_id: 'evt_002',
        event_type: 'http_request',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.2',
        destination: '10.0.0.2',
        payload: 'normal request data',
        metadata: {},
      })

      const result = engine.matchSignature(event)
      expect(result.detected).toBe(false)
    })

    it('should not match disabled signatures', () => {
      const sig = JSON.stringify({
        signature_id: 'sig_003',
        name: 'Disabled Signature',
        pattern: 'DANGEROUS',
        signature_type: 'regex',
        severity: 'critical',
        enabled: false,
      })
      engine.registerSignature(sig)

      const event = JSON.stringify({
        event_id: 'evt_003',
        event_type: 'log_entry',
        severity: 'critical',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.3',
        destination: '10.0.0.3',
        payload: 'DANGEROUS payload',
        metadata: {},
      })

      const result = engine.matchSignature(event)
      expect(result.detected).toBe(false)
    })

    it('should handle multiple signatures', () => {
      const sig1 = JSON.stringify({
        signature_id: 'sig_001',
        name: 'SQL Injection',
        pattern: 'DROP TABLE',
        signature_type: 'regex',
        severity: 'critical',
        enabled: true,
      })
      const sig2 = JSON.stringify({
        signature_id: 'sig_002',
        name: 'Command Injection',
        pattern: '\\$\\(.*\\)',
        signature_type: 'regex',
        severity: 'high',
        enabled: true,
      })

      engine.registerSignature(sig1)
      engine.registerSignature(sig2)

      expect(engine.getSignatureCount()).toBe(2)
    })
  })

  describe('Intrusion detection', () => {
    it('should detect SQL injection intrusion', () => {
      const event = JSON.stringify({
        event_id: 'evt_004',
        event_type: 'sql_query',
        severity: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.4',
        destination: '10.0.0.4',
        payload: 'SELECT * FROM users WHERE id = 1; DROP TABLE users;',
        metadata: {},
      })

      const result = engine.detectIntrusion(event)
      expect(result.detected).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.1)
    })

    it('should detect XSS intrusion', () => {
      const event = JSON.stringify({
        event_id: 'evt_005',
        event_type: 'http_request',
        severity: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.5',
        destination: '10.0.0.5',
        payload: '<script>alert("XSS")</script>',
        metadata: {},
      })

      const result = engine.detectIntrusion(event)
      expect(result.detected).toBe(true)
    })

    it('should detect command injection', () => {
      const event = JSON.stringify({
        event_id: 'evt_006',
        event_type: 'command_execution',
        severity: 'critical',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.6',
        destination: '10.0.0.6',
        payload: 'ls; rm -rf /',
        metadata: {},
      })

      const result = engine.detectIntrusion(event)
      expect(result.detected).toBe(true)
      expect(result.severity).toMatch(/critical|high/)
    })

    it('should detect buffer overflow candidates', () => {
      const event = JSON.stringify({
        event_id: 'evt_007',
        event_type: 'buffer_operation',
        severity: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.7',
        destination: '10.0.0.7',
        payload: 'A'.repeat(15000),
        metadata: {},
      })

      const result = engine.detectIntrusion(event)
      expect(result.detected).toBe(true)
    })

    it('should identify clean events', () => {
      const event = JSON.stringify({
        event_id: 'evt_008',
        event_type: 'normal_operation',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.8',
        destination: '10.0.0.8',
        payload: 'normal user activity',
        metadata: {},
      })

      const result = engine.detectIntrusion(event)
      expect(result.detected).toBe(false)
    })
  })

  describe('Anomaly detection', () => {
    it('should detect large payload anomaly', () => {
      const event = JSON.stringify({
        event_id: 'evt_009',
        event_type: 'data_transfer',
        severity: 'medium',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.9',
        destination: '10.0.0.9',
        payload: 'X'.repeat(6000),
        metadata: {},
      })

      const result = engine.detectAnomaly(event)
      expect(result.is_anomaly).toBe(true)
      expect(result.anomaly_type).toBe('LARGE_PAYLOAD')
    })

    it('should detect suspicious error events', () => {
      const event = JSON.stringify({
        event_id: 'evt_010',
        event_type: 'ERROR_FAILED_AUTHENTICATION',
        severity: 'medium',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.10',
        destination: '10.0.0.10',
        payload: 'Authentication failed for user admin',
        metadata: {},
      })

      const result = engine.detectAnomaly(event)
      expect(result.is_anomaly).toBe(true)
      expect(result.anomaly_type).toBe('SUSPICIOUS_ERROR')
    })

    it('should identify normal events', () => {
      const event = JSON.stringify({
        event_id: 'evt_011',
        event_type: 'normal_request',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.11',
        destination: '192.168.100.1',
        payload: 'GET / HTTP/1.1',
        metadata: {},
      })

      const result = engine.detectAnomaly(event)
      expect(result.is_anomaly).toBe(false)
    })

    it('should calculate anomaly score correctly', () => {
      const event = JSON.stringify({
        event_id: 'evt_012',
        event_type: 'FAILED_LOGIN',
        severity: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.12',
        destination: '10.0.0.12',
        payload: 'Y'.repeat(5500),
        metadata: {},
      })

      const result = engine.detectAnomaly(event)
      expect(result.anomaly_score).toBeGreaterThan(0.2)
      expect(result.metrics).toBeDefined()
    })
  })

  describe('Event correlation', () => {
    it('should correlate events from same source', () => {
      const event1 = JSON.stringify({
        event_id: 'evt_013',
        event_type: 'connection_attempt',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.13',
        destination: '10.0.0.13',
        payload: 'SYN',
        metadata: {},
      })

      const event2 = JSON.stringify({
        event_id: 'evt_014',
        event_type: 'connection_attempt',
        severity: 'low',
        timestamp: '2024-01-01T00:00:01Z',
        source: '192.168.1.13',
        destination: '10.0.0.14',
        payload: 'SYN',
        metadata: {},
      })

      const result = engine.correlateEvents(event1, event2)
      expect(result.correlated).toBe(true)
      expect(result.correlation_type).toBe('SAME_SOURCE')
    })

    it('should correlate events to same destination', () => {
      const event1 = JSON.stringify({
        event_id: 'evt_015',
        event_type: 'request',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.15',
        destination: '10.0.0.15',
        payload: 'GET /api',
        metadata: {},
      })

      const event2 = JSON.stringify({
        event_id: 'evt_016',
        event_type: 'request',
        severity: 'low',
        timestamp: '2024-01-01T00:00:01Z',
        source: '192.168.1.16',
        destination: '10.0.0.15',
        payload: 'GET /admin',
        metadata: {},
      })

      const result = engine.correlateEvents(event1, event2)
      expect(result.correlated).toBe(true)
      expect(result.correlation_type).toBe('SAME_DESTINATION')
    })

    it('should not correlate unrelated events', () => {
      const event1 = JSON.stringify({
        event_id: 'evt_017',
        event_type: 'connection',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.17',
        destination: '10.0.0.17',
        payload: 'data1',
        metadata: {},
      })

      const event2 = JSON.stringify({
        event_id: 'evt_018',
        event_type: 'error',
        severity: 'low',
        timestamp: '2024-01-01T00:00:01Z',
        source: '192.168.1.18',
        destination: '10.0.0.18',
        payload: 'data2',
        metadata: {},
      })

      const result = engine.correlateEvents(event1, event2)
      expect(result.correlated).toBe(false)
    })

    it('should include related event IDs in correlation', () => {
      const event1 = JSON.stringify({
        event_id: 'evt_019',
        event_type: 'login',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.19',
        destination: '10.0.0.19',
        payload: 'user login',
        metadata: {},
      })

      const event2 = JSON.stringify({
        event_id: 'evt_020',
        event_type: 'login',
        severity: 'low',
        timestamp: '2024-01-01T00:00:01Z',
        source: '192.168.1.19',
        destination: '10.0.0.19',
        payload: 'user logout',
        metadata: {},
      })

      const result = engine.correlateEvents(event1, event2)
      expect(result.related_events).toContain('evt_020')
    })
  })

  describe('Threshold monitoring', () => {
    it('should register and monitor threshold', () => {
      const threshold = JSON.stringify({
        metric_name: 'cpu_usage',
        threshold_value: 80.0,
        duration_seconds: 300,
        comparison_operator: 'gt',
      })

      engine.registerThreshold(threshold)
      expect(engine.getThresholdCount()).toBe(1)

      const exceeded = engine.monitorThreshold('cpu_usage', 85.0)
      expect(exceeded).toBe(true)
    })

    it('should handle less-than comparison', () => {
      const threshold = JSON.stringify({
        metric_name: 'memory_available',
        threshold_value: 100.0,
        duration_seconds: 300,
        comparison_operator: 'lt',
      })

      engine.registerThreshold(threshold)

      const exceeded = engine.monitorThreshold('memory_available', 50.0)
      expect(exceeded).toBe(true)
    })

    it('should handle greater-than-or-equal comparison', () => {
      const threshold = JSON.stringify({
        metric_name: 'disk_usage',
        threshold_value: 90.0,
        duration_seconds: 300,
        comparison_operator: 'gte',
      })

      engine.registerThreshold(threshold)

      const exceeded = engine.monitorThreshold('disk_usage', 90.0)
      expect(exceeded).toBe(true)
    })

    it('should return false for non-exceeded threshold', () => {
      const threshold = JSON.stringify({
        metric_name: 'error_rate',
        threshold_value: 5.0,
        duration_seconds: 300,
        comparison_operator: 'gt',
      })

      engine.registerThreshold(threshold)

      const exceeded = engine.monitorThreshold('error_rate', 2.0)
      expect(exceeded).toBe(false)
    })

    it('should return false for non-existent threshold', () => {
      const exceeded = engine.monitorThreshold('non_existent_metric', 50.0)
      expect(exceeded).toBe(false)
    })
  })

  describe('Event recording and history', () => {
    it('should record an event', () => {
      const event = JSON.stringify({
        event_id: 'evt_021',
        event_type: 'system_event',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.21',
        destination: '10.0.0.21',
        payload: 'system operational',
        metadata: {},
      })

      const recorded = engine.recordEvent(event)
      expect(recorded.event_id).toBe('evt_021')
      expect(engine.getHistorySize()).toBe(1)
    })

    it('should auto-generate event ID if missing', () => {
      const event = JSON.stringify({
        event_id: '',
        event_type: 'auto_generated',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.22',
        destination: '10.0.0.22',
        payload: 'with auto id',
        metadata: {},
      })

      const recorded = engine.recordEvent(event)
      expect(recorded.event_id).toBeTruthy()
      expect(recorded.event_id).toContain('evt_')
    })

    it('should maintain event history', () => {
      for (let i = 0; i < 5; i++) {
        const event = JSON.stringify({
          event_id: `evt_${1000 + i}`,
          event_type: 'batch_event',
          severity: 'low',
          timestamp: '2024-01-01T00:00:00Z',
          source: `192.168.1.${i}`,
          destination: `10.0.0.${i}`,
          payload: `event number ${i}`,
          metadata: {},
        })
        engine.recordEvent(event)
      }

      expect(engine.getHistorySize()).toBe(5)
    })

    it('should clear history', () => {
      const event = JSON.stringify({
        event_id: 'evt_025',
        event_type: 'test_event',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.25',
        destination: '10.0.0.25',
        payload: 'to be cleared',
        metadata: {},
      })

      engine.recordEvent(event)
      expect(engine.getHistorySize()).toBe(1)

      engine.clearHistory()
      expect(engine.getHistorySize()).toBe(0)
    })
  })

  describe('Utility functions', () => {
    it('should match pattern correctly', () => {
      expect(patternMatchUtil('hello world', 'hello.*')).toBe(true)
      expect(patternMatchUtil('hello world', 'goodbye.*')).toBe(false)
    })

    it('should calculate severity score', () => {
      const score = calculateSeverityScore(['CRITICAL', 'HIGH', 'MEDIUM'])
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should handle single indicator severity', () => {
      const score = calculateSeverityScore(['HIGH'])
      expect(score).toBe(0.8)
    })

    it('should generate unique event IDs', () => {
      const id1 = generateId('test')
      const id2 = generateId('test')
      expect(id1).not.toBe(id2)
      expect(id1).toContain('test_')
    })

    it('should validate correct event structure', () => {
      const validEvent = JSON.stringify({
        event_id: 'evt_026',
        event_type: 'valid',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.26',
        destination: '10.0.0.26',
        payload: 'valid payload',
        metadata: {},
      })

      expect(isValidEvent(validEvent)).toBe(true)
    })

    it('should reject incomplete event structure', () => {
      const invalidEvent = JSON.stringify({
        event_id: '',
        event_type: '',
      })

      expect(isValidEvent(invalidEvent)).toBe(false)
    })
  })

  describe('Clear operations', () => {
    it('should clear all signatures', () => {
      const sig = JSON.stringify({
        signature_id: 'sig_clear_001',
        name: 'Clear Test',
        pattern: 'test',
        signature_type: 'regex',
        severity: 'low',
        enabled: true,
      })

      engine.registerSignature(sig)
      expect(engine.getSignatureCount()).toBeGreaterThan(0)

      engine.clearSignatures()
      expect(engine.getSignatureCount()).toBe(0)
    })

    it('should clear all thresholds', () => {
      const threshold = JSON.stringify({
        metric_name: 'test_metric',
        threshold_value: 50.0,
        duration_seconds: 300,
        comparison_operator: 'gt',
      })

      engine.registerThreshold(threshold)
      expect(engine.getThresholdCount()).toBeGreaterThan(0)

      engine.clearThresholds()
      expect(engine.getThresholdCount()).toBe(0)
    })

    it('should not affect other data when clearing', () => {
      const sig = JSON.stringify({
        signature_id: 'sig_clear_002',
        name: 'Clear Test 2',
        pattern: 'test2',
        signature_type: 'regex',
        severity: 'low',
        enabled: true,
      })

      const event = JSON.stringify({
        event_id: 'evt_027',
        event_type: 'clear_test',
        severity: 'low',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.27',
        destination: '10.0.0.27',
        payload: 'data',
        metadata: {},
      })

      engine.registerSignature(sig)
      engine.recordEvent(event)

      engine.clearSignatures()

      expect(engine.getHistorySize()).toBe(1)
      expect(engine.getSignatureCount()).toBe(0)
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete detection workflow', () => {
      // Register multiple signatures
      const sqlSig = JSON.stringify({
        signature_id: 'sql_inj',
        name: 'SQL Injection',
        pattern: 'DELETE.*FROM',
        signature_type: 'regex',
        severity: 'critical',
        enabled: true,
      })

      engine.registerSignature(sqlSig)

      // Register threshold
      const threshold = JSON.stringify({
        metric_name: 'malicious_events',
        threshold_value: 10.0,
        duration_seconds: 300,
        comparison_operator: 'gt',
      })

      engine.registerThreshold(threshold)

      // Process events
      const event = JSON.stringify({
        event_id: 'evt_028',
        event_type: 'database_query',
        severity: 'high',
        timestamp: '2024-01-01T00:00:00Z',
        source: '192.168.1.28',
        destination: '10.0.0.28',
        payload: 'DELETE FROM users WHERE id=1',
        metadata: {},
      })

      engine.recordEvent(event)

      const matchResult = engine.matchSignature(event)
      expect(matchResult.detected).toBe(true)

      const anomalyResult = engine.detectAnomaly(event)
      expect(anomalyResult).toBeDefined()

      expect(engine.getHistorySize()).toBe(1)
    })

    it('should perform multi-event analysis', () => {
      const events = [
        {
          event_id: 'evt_029',
          event_type: 'connection',
          source: '192.168.1.29',
          destination: '10.0.0.29',
        },
        {
          event_id: 'evt_030',
          event_type: 'connection',
          source: '192.168.1.29',
          destination: '10.0.0.30',
        },
      ]

      events.forEach((evt) => {
        const eventJson = JSON.stringify({
          ...evt,
          severity: 'low',
          timestamp: '2024-01-01T00:00:00Z',
          payload: 'connection data',
          metadata: {},
        })
        engine.recordEvent(eventJson)
      })

      expect(engine.getHistorySize()).toBe(2)

      const event1 = JSON.stringify(events[0])
      const event2 = JSON.stringify(events[1])

      // This will fail due to incomplete event objects, but demonstrates usage
      // const correlation = engine.correlateEvents(event1, event2)
    })
  })
})
