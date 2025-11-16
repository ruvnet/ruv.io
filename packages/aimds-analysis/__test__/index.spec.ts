import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  AnalysisEngine,
  createAnalysisEngine,
  getLibraryVersion,
  AnalysisConfig,
  ComprehensiveAnalysisResult,
  AnomalyDetectionResult,
  PatternRecognitionResult,
  ThreatAssessmentResult,
  EngineStatistics,
} from '../src/index'

describe('AnalysisEngine', () => {
  let engine: AnalysisEngine

  beforeEach(() => {
    engine = new AnalysisEngine()
  })

  afterEach(() => {
    if (engine) {
      engine.reset()
    }
  })

  describe('Constructor', () => {
    it('should create engine with default configuration', () => {
      const e = new AnalysisEngine()
      expect(e).toBeDefined()
      expect(e.isReady()).toBe(true)
    })

    it('should create engine with custom configuration', () => {
      const config: AnalysisConfig = {
        sensitivity: 0.9,
        minConfidence: 0.8,
        anomalyThreshold: 0.85,
        patternWindowSize: 200,
        maxThreats: 20,
      }
      const e = new AnalysisEngine(config)
      expect(e).toBeDefined()
      expect(e.isReady()).toBe(true)
    })

    it('should create engine with partial configuration', () => {
      const config: AnalysisConfig = {
        sensitivity: 0.5,
      }
      const e = new AnalysisEngine(config)
      expect(e).toBeDefined()
      expect(e.getSensitivity()).toBe(0.5)
    })
  })

  describe('Anomaly Detection', () => {
    it('should detect anomalies in normal data', () => {
      const data = { type: 'normal', value: 42 }
      const result = engine.detectAnomalies(data)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('anomaly_score')
      expect(result).toHaveProperty('is_anomaly')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('details')
      expect(typeof result.anomaly_score).toBe('number')
      expect(typeof result.is_anomaly).toBe('boolean')
      expect(typeof result.confidence).toBe('number')
    })

    it('should detect anomalies in string data', () => {
      const result = engine.detectAnomalies(JSON.stringify('test data for anomaly detection'))

      expect(result).toBeDefined()
      expect(result.anomaly_score).toBeGreaterThanOrEqual(0)
      expect(result.anomaly_score).toBeLessThanOrEqual(1)
    })

    it('should handle JSON string input', () => {
      const dataJson = JSON.stringify({ type: 'json', value: 'test' })
      const result = engine.detectAnomalies(dataJson)

      expect(result).toBeDefined()
      expect(typeof result.anomaly_score).toBe('number')
    })

    it('should calculate confidence based on anomaly score', () => {
      const data = { test: 'data' }
      const result = engine.detectAnomalies(data)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should provide anomaly details', () => {
      const result = engine.detectAnomalies({ data: 'test' })

      expect(result.details).toBeDefined()
      expect(result.details.length).toBeGreaterThan(0)
    })
  })

  describe('Pattern Recognition', () => {
    it('should recognize patterns in single data item', () => {
      const data = { pattern: 'test' }
      const result = engine.recognizePatterns(data)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('patterns_found')
      expect(result).toHaveProperty('matches')
      expect(result).toHaveProperty('total_score')
      expect(result).toHaveProperty('analysis_data')
      expect(typeof result.patterns_found).toBe('number')
      expect(Array.isArray(result.matches)).toBe(true)
    })

    it('should recognize patterns across multiple calls', () => {
      const data1 = { sequence: 1 }
      const data2 = { sequence: 2 }

      engine.recognizePatterns(data1)
      const result = engine.recognizePatterns(data2)

      expect(result).toBeDefined()
      expect(result.patterns_found).toBeGreaterThanOrEqual(0)
    })

    it('should return pattern matches array', () => {
      const result = engine.recognizePatterns({ test: 'data' })

      expect(Array.isArray(result.matches)).toBe(true)
    })

    it('should calculate total score for patterns', () => {
      const result = engine.recognizePatterns({ data: 'pattern' })

      expect(result.total_score).toBeGreaterThanOrEqual(0)
      expect(result.total_score).toBeLessThanOrEqual(1)
    })

    it('should accumulate patterns in history', () => {
      for (let i = 0; i < 5; i++) {
        engine.recognizePatterns({ item: i })
      }

      const result = engine.recognizePatterns({ item: 5 })
      expect(result).toBeDefined()
    })
  })

  describe('Threat Assessment', () => {
    it('should assess threat level', () => {
      const data = { event: 'suspicious' }
      const result = engine.assessThreat(data)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('threat_level')
      expect(result).toHaveProperty('severity')
      expect(result).toHaveProperty('threat_type')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('timestamp')
    })

    it('should have valid threat levels', () => {
      const result = engine.assessThreat({ test: 'data' })

      const validLevels = ['critical', 'high', 'medium', 'low', 'minimal']
      expect(validLevels).toContain(result.threat_level)
    })

    it('should provide severity score', () => {
      const result = engine.assessThreat({ data: 'test' })

      expect(result.severity).toBeGreaterThanOrEqual(0)
      expect(result.severity).toBeLessThanOrEqual(1)
    })

    it('should provide threat type', () => {
      const result = engine.assessThreat({ data: 'test' })

      expect(typeof result.threat_type).toBe('string')
      expect(result.threat_type.length).toBeGreaterThan(0)
    })

    it('should provide recommendations', () => {
      const result = engine.assessThreat({ data: 'test' })

      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should include timestamp in result', () => {
      const result = engine.assessThreat({ data: 'test' })

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })
  })

  describe('Comprehensive Analysis', () => {
    it('should perform comprehensive analysis', () => {
      const data = { event: 'test' }
      const result = engine.analyze(data)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('anomaly_analysis')
      expect(result).toHaveProperty('pattern_analysis')
      expect(result).toHaveProperty('threat_assessment')
      expect(result).toHaveProperty('analysis_timestamp')
      expect(result).toHaveProperty('status')
    })

    it('should include all analysis types in result', () => {
      const result = engine.analyze({ data: 'test' })

      expect(result.anomaly_analysis).toBeDefined()
      expect(result.pattern_analysis).toBeDefined()
      expect(result.threat_assessment).toBeDefined()
    })

    it('should have completed status', () => {
      const result = engine.analyze({ data: 'test' })

      expect(result.status).toBe('completed')
    })

    it('should include timestamp', () => {
      const result = engine.analyze({ data: 'test' })

      expect(result.analysis_timestamp).toBeDefined()
      expect(typeof result.analysis_timestamp).toBe('string')
    })

    it('should handle different data types in comprehensive analysis', () => {
      const stringResult = engine.analyze(JSON.stringify('test string'))
      expect(stringResult.status).toBe('completed')

      const objectResult = engine.analyze({ key: 'value' })
      expect(objectResult.status).toBe('completed')
    })
  })

  describe('Engine Statistics', () => {
    it('should get engine statistics', () => {
      const stats = engine.getStatistics()

      expect(stats).toBeDefined()
      expect(stats).toHaveProperty('sensitivity')
      expect(stats).toHaveProperty('min_confidence')
      expect(stats).toHaveProperty('anomaly_threshold')
      expect(stats).toHaveProperty('pattern_window_size')
      expect(stats).toHaveProperty('data_history_length')
      expect(stats).toHaveProperty('anomaly_count')
      expect(stats).toHaveProperty('pattern_cache_size')
    })

    it('should track data history length', () => {
      let stats = engine.getStatistics()
      const initialLength = stats.data_history_length

      engine.recognizePatterns({ test: 1 })
      stats = engine.getStatistics()

      expect(stats.data_history_length).toBeGreaterThanOrEqual(initialLength)
    })

    it('should report anomaly count', () => {
      const stats = engine.getStatistics()

      expect(typeof stats.anomaly_count).toBe('number')
      expect(stats.anomaly_count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Engine Configuration', () => {
    it('should set sensitivity', () => {
      engine.setSensitivity(0.5)
      expect(engine.getSensitivity()).toBe(0.5)
    })

    it('should validate sensitivity bounds', () => {
      expect(() => {
        engine.setSensitivity(1.5)
      }).toThrow()

      expect(() => {
        engine.setSensitivity(-0.1)
      }).toThrow()
    })

    it('should accept valid sensitivity values', () => {
      engine.setSensitivity(0.0)
      expect(engine.getSensitivity()).toBe(0.0)

      engine.setSensitivity(1.0)
      expect(engine.getSensitivity()).toBe(1.0)

      engine.setSensitivity(0.75)
      expect(engine.getSensitivity()).toBe(0.75)
    })

    it('should report ready status', () => {
      expect(engine.isReady()).toBe(true)
    })

    it('should return version string', () => {
      const version = engine.getVersion()

      expect(typeof version).toBe('string')
      expect(version.length).toBeGreaterThan(0)
      expect(version).toContain('analysis')
    })
  })

  describe('Engine Reset', () => {
    it('should reset engine state', () => {
      engine.recognizePatterns({ data: 1 })
      engine.recognizePatterns({ data: 2 })

      engine.reset()

      const stats = engine.getStatistics()
      expect(stats.data_history_length).toBe(0)
    })

    it('should clear pattern cache on reset', () => {
      engine.recognizePatterns({ test: 1 })
      engine.reset()

      const stats = engine.getStatistics()
      expect(stats.pattern_cache_size).toBe(0)
    })

    it('should allow analysis after reset', () => {
      engine.recognizePatterns({ test: 1 })
      engine.reset()

      const result = engine.analyze({ test: 2 })
      expect(result.status).toBe('completed')
    })
  })

  describe('Batch Analysis', () => {
    it('should batch analyze multiple items', () => {
      const dataArray = [{ item: 1 }, { item: 2 }, { item: 3 }]
      const result = engine.batchAnalyze(dataArray)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('items_processed')
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('timestamp')
    })

    it('should process correct number of items', () => {
      const dataArray = [{ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }]
      const result = engine.batchAnalyze(dataArray)

      expect(result.items_processed).toBe(4)
      expect(result.results.length).toBe(4)
    })

    it('should return array of results', () => {
      const dataArray = [{ item: 1 }, { item: 2 }]
      const result = engine.batchAnalyze(dataArray)

      expect(Array.isArray(result.results)).toBe(true)
      result.results.forEach(item => {
        expect(item).toHaveProperty('anomaly_analysis')
        expect(item).toHaveProperty('pattern_analysis')
        expect(item).toHaveProperty('threat_assessment')
      })
    })

    it('should handle string data in batch', () => {
      const dataArray = [
        JSON.stringify('data1'),
        JSON.stringify('data2'),
        JSON.stringify('data3'),
      ]
      const result = engine.batchAnalyze(dataArray as any)

      expect(result.items_processed).toBeGreaterThan(0)
    })

    it('should include timestamp in batch result', () => {
      const result = engine.batchAnalyze([{ test: 1 }])

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('string')
    })
  })

  describe('Factory Functions', () => {
    it('should create engine with factory function', () => {
      const e = createAnalysisEngine()

      expect(e).toBeDefined()
      expect(e).toBeInstanceOf(AnalysisEngine)
      expect(e.isReady()).toBe(true)
    })

    it('should get library version', () => {
      const version = getLibraryVersion()

      expect(typeof version).toBe('string')
      expect(version.length).toBeGreaterThan(0)
      expect(version).toContain('aimds-analysis')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      expect(() => {
        engine.analyze(JSON.stringify({}))
      }).not.toThrow()
    })

    it('should return valid result for empty objects', () => {
      const result = engine.analyze({})

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })

    it('should handle large objects', () => {
      const largeObject = { data: 'x'.repeat(10000) }
      const result = engine.analyze(largeObject)

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })
  })

  describe('Data Integrity', () => {
    it('should preserve data analysis consistency', () => {
      const data = { consistent: 'data' }
      const result1 = engine.analyze(data)
      const result2 = engine.analyze(data)

      expect(result1.anomaly_analysis.anomaly_score).toBeCloseTo(
        result2.anomaly_analysis.anomaly_score,
        2
      )
    })

    it('should handle UTF-8 encoded strings', () => {
      const utf8String = 'Hello, 世界! 🌍'
      const result = engine.analyze(JSON.stringify(utf8String))

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
    })
  })

  describe('Performance', () => {
    it('should analyze small data quickly', () => {
      const start = Date.now()
      const result = engine.analyze({ quick: 'test' })
      const duration = Date.now() - start

      expect(result).toBeDefined()
      expect(duration).toBeLessThan(1000)
    })

    it('should handle multiple analyses efficiently', () => {
      const start = Date.now()

      for (let i = 0; i < 10; i++) {
        engine.analyze({ item: i })
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000)
    })

    it('should batch process efficiently', () => {
      const dataArray = Array.from({ length: 20 }, (_, i) => ({ item: i }))

      const start = Date.now()
      const result = engine.batchAnalyze(dataArray)
      const duration = Date.now() - start

      expect(result.items_processed).toBe(20)
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('Type Safety', () => {
    it('should properly type anomaly detection result', () => {
      const result: AnomalyDetectionResult = engine.detectAnomalies({ test: 1 })

      expect(typeof result.anomaly_score).toBe('number')
      expect(typeof result.is_anomaly).toBe('boolean')
      expect(typeof result.confidence).toBe('number')
      expect(typeof result.details).toBe('string')
    })

    it('should properly type pattern recognition result', () => {
      const result: PatternRecognitionResult = engine.recognizePatterns({
        test: 1,
      })

      expect(typeof result.patterns_found).toBe('number')
      expect(Array.isArray(result.matches)).toBe(true)
      expect(typeof result.total_score).toBe('number')
      expect(typeof result.analysis_data).toBe('string')
    })

    it('should properly type threat assessment result', () => {
      const result: ThreatAssessmentResult = engine.assessThreat({ test: 1 })

      expect(typeof result.threat_level).toBe('string')
      expect(typeof result.severity).toBe('number')
      expect(typeof result.threat_type).toBe('string')
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(typeof result.timestamp).toBe('string')
    })
  })
})
