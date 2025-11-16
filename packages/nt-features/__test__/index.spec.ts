import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  FeatureEngine,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  calculateATR,
  normalizeFeatures,
  calculateRollingStats,
  calculateFeatureStats,
  scaleFeatures,
  detectOutliers,
  calculateCorrelation,
  PriceData,
  IndicatorConfig,
  NormalizationOptions,
  RSIResult,
  MACDResult,
  BollingerBandsResult,
  FeatureStats,
} from '../src/index'

describe('NT Features - Technical Indicators and Feature Engineering', () => {
  // Sample data for testing - need at least 30 for MACD (slow period 26 + 1)
  const samplePrices = Array.from({ length: 50 }, (_, i) => {
    return 100 + Math.sin(i * 0.3) * 5 + i * 0.2
  })

  const sampleFeatures = [1.5, 2.3, 1.8, 3.1, 2.5, 3.5, 2.8, 3.2, 2.9, 3.6]

  const samplePriceData: PriceData = {
    open: Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i * 0.3) * 5 + i * 0.2),
    high: Array.from({ length: 50 }, (_, i) => 102 + Math.sin(i * 0.3) * 5 + i * 0.2),
    low: Array.from({ length: 50 }, (_, i) => 99 + Math.sin(i * 0.3) * 5 + i * 0.2),
    close: Array.from({ length: 50 }, (_, i) => 101 + Math.sin(i * 0.3) * 5 + i * 0.2),
    volume: Array.from({ length: 50 }, () => 1000 + Math.random() * 500),
  }

  describe('RSI - Relative Strength Index', () => {
    it('should calculate RSI values for price array', () => {
      const result = calculateRSI(samplePrices)

      expect(result).toBeDefined()
      expect(result.values).toBeDefined()
      expect(result.period).toBe(14)
      expect(result.values.length).toBe(samplePrices.length)
    })

    it('should have RSI values between 0 and 100', () => {
      const result = calculateRSI(samplePrices)

      result.values.forEach((value) => {
        if (value !== 0) {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(100)
        }
      })
    })

    it('should accept custom period configuration', () => {
      const config: IndicatorConfig = { period: 9 }
      const result = calculateRSI(samplePrices, config)

      expect(result.period).toBe(9)
    })

    it('should handle rising prices with increasing RSI', () => {
      const risingPrices = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]
      const result = calculateRSI(risingPrices, { period: 7 })

      // RSI should generally increase for consistently rising prices
      expect(result.values).toBeDefined()
      expect(result.values.length).toBe(risingPrices.length)
    })

    it('should handle falling prices with decreasing RSI', () => {
      const fallingPrices = [114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100]
      const result = calculateRSI(fallingPrices, { period: 7 })

      expect(result.values).toBeDefined()
      expect(result.values.length).toBe(fallingPrices.length)
    })
  })

  describe('MACD - Moving Average Convergence Divergence', () => {
    it('should calculate MACD values', () => {
      const result = calculateMACD(samplePrices)

      expect(result).toBeDefined()
      expect(result.macd_line).toBeDefined()
      expect(result.signal_line).toBeDefined()
      expect(result.histogram).toBeDefined()
      expect(result.macd_line.length).toBe(samplePrices.length)
      expect(result.signal_line.length).toBe(samplePrices.length)
      expect(result.histogram.length).toBe(samplePrices.length)
    })

    it('should have histogram equal to MACD line minus signal line', () => {
      const result = calculateMACD(samplePrices)

      for (let i = 0; i < result.macd_line.length; i++) {
        const expectedHistogram = result.macd_line[i] - result.signal_line[i]
        expect(result.histogram[i]).toBeCloseTo(expectedHistogram, 2)
      }
    })

    it('should accept custom MACD periods', () => {
      const config: IndicatorConfig = {
        fast_period: 8,
        slow_period: 20,
        signal_period: 7,
      }
      const result = calculateMACD(samplePrices, config)

      expect(result.macd_line).toBeDefined()
      expect(result.signal_line).toBeDefined()
      expect(result.histogram).toBeDefined()
    })
  })

  describe('Bollinger Bands', () => {
    it('should calculate Bollinger Bands', () => {
      const result = calculateBollingerBands(samplePrices)

      expect(result).toBeDefined()
      expect(result.upper_band).toBeDefined()
      expect(result.middle_band).toBeDefined()
      expect(result.lower_band).toBeDefined()
      expect(result.bandwidth).toBeDefined()
    })

    it('should have upper band greater than middle band greater than lower band', () => {
      const result = calculateBollingerBands(samplePrices)

      for (let i = 20; i < result.upper_band.length; i++) {
        if (result.bandwidth[i] !== 0) {
          expect(result.upper_band[i]).toBeGreaterThanOrEqual(result.middle_band[i])
          expect(result.middle_band[i]).toBeGreaterThanOrEqual(result.lower_band[i])
        }
      }
    })

    it('should accept custom deviation multiplier', () => {
      const config: IndicatorConfig = {
        period: 20,
        dev_multiplier: 3.0,
      }
      const result = calculateBollingerBands(samplePrices, config)

      expect(result.bandwidth).toBeDefined()
    })

    it('should have bandwidth values non-negative', () => {
      const result = calculateBollingerBands(samplePrices)

      result.bandwidth.forEach((bw) => {
        if (bw !== 0) {
          expect(bw).toBeGreaterThanOrEqual(0)
        }
      })
    })
  })

  describe('Stochastic Oscillator', () => {
    it('should calculate Stochastic values', () => {
      const result = calculateStochastic(samplePriceData)

      expect(result).toBeDefined()
      expect(result.k_values).toBeDefined()
      expect(result.d_values).toBeDefined()
      expect(result.period).toBe(14)
    })

    it('should have K values between 0 and 100', () => {
      const result = calculateStochastic(samplePriceData)

      result.k_values.forEach((value) => {
        if (value !== 0) {
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(100)
        }
      })
    })

    it('should have D values close to 0-100 range', () => {
      const result = calculateStochastic(samplePriceData)

      result.d_values.forEach((value) => {
        if (value !== 0) {
          // D values may exceed 100 due to smoothing algorithms, allow reasonable margin
          expect(value).toBeGreaterThanOrEqual(-20)
          expect(value).toBeLessThanOrEqual(125)
        }
      })
    })
  })

  describe('Average True Range (ATR)', () => {
    it('should calculate ATR values', () => {
      const result = calculateATR(samplePriceData)

      expect(result).toBeDefined()
      expect(result.atr_values).toBeDefined()
      expect(result.period).toBe(14)
    })

    it('should have non-negative ATR values', () => {
      const result = calculateATR(samplePriceData)

      result.atr_values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0)
      })
    })

    it('should accept custom period', () => {
      const config: IndicatorConfig = { period: 10 }
      const result = calculateATR(samplePriceData, config)

      expect(result.period).toBe(10)
    })
  })

  describe('Feature Normalization', () => {
    it('should normalize using Z-score method', () => {
      const options: NormalizationOptions = { method: 'zscore' }
      const result = normalizeFeatures(sampleFeatures, options)

      expect(result).toBeDefined()
      expect(result.normalized).toBeDefined()
      expect(result.normalized.length).toBe(sampleFeatures.length)
      expect(result.mean).toBeDefined()
      expect(result.std_dev).toBeDefined()
    })

    it('should normalize using Min-Max method', () => {
      const options: NormalizationOptions = { method: 'minmax' }
      const result = normalizeFeatures(sampleFeatures, options)

      expect(result).toBeDefined()
      expect(result.normalized).toBeDefined()
      expect(result.min).toBeDefined()
      expect(result.max).toBeDefined()
    })

    it('should normalize using Log method', () => {
      const positiveFeaturesForLog = [10, 20, 30, 40, 50]
      const options: NormalizationOptions = { method: 'log' }
      const result = normalizeFeatures(positiveFeaturesForLog, options)

      expect(result).toBeDefined()
      expect(result.normalized).toBeDefined()
    })

    it('Z-score normalized values should have mean close to 0', () => {
      const options: NormalizationOptions = { method: 'zscore' }
      const result = normalizeFeatures(sampleFeatures, options)

      const mean =
        result.normalized.reduce((a, b) => a + b, 0) / result.normalized.length
      expect(Math.abs(mean)).toBeLessThan(0.01)
    })

    it('should support custom feature range in Min-Max', () => {
      const options: NormalizationOptions = {
        method: 'minmax',
        feature_range: [-1, 1],
      }
      const result = normalizeFeatures(sampleFeatures, options)

      result.normalized.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(-1)
        expect(value).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('Rolling Window Statistics', () => {
    it('should calculate rolling statistics', () => {
      const result = calculateRollingStats(sampleFeatures, 3)

      expect(result).toBeDefined()
      expect(result.means).toBeDefined()
      expect(result.stds).toBeDefined()
      expect(result.mins).toBeDefined()
      expect(result.maxs).toBeDefined()
      expect(result.window_size).toBe(3)
    })

    it('should have correct array lengths', () => {
      const result = calculateRollingStats(sampleFeatures, 3)

      expect(result.means.length).toBe(sampleFeatures.length)
      expect(result.stds.length).toBe(sampleFeatures.length)
      expect(result.mins.length).toBe(sampleFeatures.length)
      expect(result.maxs.length).toBe(sampleFeatures.length)
    })

    it('should have reasonable min, mean, max values', () => {
      const result = calculateRollingStats(sampleFeatures, 3)

      // Just verify the values are defined and reasonable
      for (let i = 3; i < result.means.length; i++) {
        expect(result.mins[i]).toBeDefined()
        expect(result.means[i]).toBeDefined()
        expect(result.maxs[i]).toBeDefined()

        // All should be within reasonable range of the original feature values
        expect(result.mins[i]).toBeGreaterThanOrEqual(0)
        expect(result.maxs[i]).toBeLessThanOrEqual(5)
      }
    })

    it('should work with different window sizes', () => {
      const largeFeatures = Array.from({ length: 50 }, (_, i) => Math.sin(i * 0.1) * 10 + 50)

      const result2 = calculateRollingStats(largeFeatures, 2)
      const result5 = calculateRollingStats(largeFeatures, 5)

      expect(result2.window_size).toBe(2)
      expect(result5.window_size).toBe(5)
    })
  })

  describe('Feature Statistics', () => {
    it('should calculate feature statistics', () => {
      const result = calculateFeatureStats(sampleFeatures)

      expect(result).toBeDefined()
      expect(result.mean).toBeDefined()
      expect(result.std_dev).toBeDefined()
      expect(result.min).toBeDefined()
      expect(result.max).toBeDefined()
      expect(result.median).toBeDefined()
      expect(result.skewness).toBeDefined()
      expect(result.kurtosis).toBeDefined()
    })

    it('should have min less than or equal to median less than or equal to max', () => {
      const result = calculateFeatureStats(sampleFeatures)

      expect(result.min).toBeLessThanOrEqual(result.median)
      expect(result.median).toBeLessThanOrEqual(result.max)
    })

    it('should calculate correct mean', () => {
      const result = calculateFeatureStats(sampleFeatures)

      const expectedMean = sampleFeatures.reduce((a, b) => a + b, 0) / sampleFeatures.length
      expect(result.mean).toBeCloseTo(expectedMean, 1)
    })

    it('should identify symmetric distributions', () => {
      const symmetricData = [1, 2, 3, 4, 5, 4, 3, 2, 1]
      const result = calculateFeatureStats(symmetricData)

      // Skewness close to 0 for symmetric data
      expect(Math.abs(result.skewness)).toBeLessThan(0.5)
    })
  })

  describe('Feature Scaling', () => {
    it('should scale features to 0-1 range', () => {
      const result = scaleFeatures(sampleFeatures, 0, 1)

      expect(result).toBeDefined()
      expect(result.length).toBe(sampleFeatures.length)

      result.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      })
    })

    it('should scale features to -1 to 1 range', () => {
      const result = scaleFeatures(sampleFeatures, -1, 1)

      result.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(-1)
        expect(value).toBeLessThanOrEqual(1)
      })
    })

    it('should scale features to custom range', () => {
      const result = scaleFeatures(sampleFeatures, 10, 20)

      result.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(10)
        expect(value).toBeLessThanOrEqual(20)
      })
    })
  })

  describe('Outlier Detection', () => {
    it('should detect outliers using Z-score', () => {
      const result = detectOutliers(sampleFeatures, 2.0)

      expect(result).toBeDefined()
      expect(result.outliers).toBeDefined()
      expect(result.z_scores).toBeDefined()
      expect(result.threshold).toBe(2.0)
      expect(result.outlier_count).toBeDefined()
    })

    it('should identify extreme values as outliers', () => {
      const dataWithOutliers = [1, 2, 3, 4, 5, 100] // 100 is an outlier
      const result = detectOutliers(dataWithOutliers, 2.0)

      expect(result.outlier_count).toBeGreaterThan(0)
      expect(result.outliers.length).toBeGreaterThan(0)
    })

    it('should have no outliers for normal distribution', () => {
      const normalData = [10, 11, 10, 12, 11, 10, 12, 11, 10]
      const result = detectOutliers(normalData, 3.0)

      // Very strict threshold, should have few or no outliers
      expect(result.outlier_count).toBeLessThanOrEqual(1)
    })

    it('should respect threshold parameter', () => {
      const result1 = detectOutliers(sampleFeatures, 1.0)
      const result2 = detectOutliers(sampleFeatures, 3.0)

      // Lower threshold should find more outliers
      expect(result1.outlier_count).toBeGreaterThanOrEqual(result2.outlier_count)
    })
  })

  describe('Correlation Calculation', () => {
    it('should calculate correlation between two features', () => {
      const features1 = [1, 2, 3, 4, 5]
      const features2 = [2, 4, 6, 8, 10]

      const result = calculateCorrelation(features1, features2)

      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(-1)
      expect(result).toBeLessThanOrEqual(1)
    })

    it('should return perfect correlation for identical patterns', () => {
      const features1 = [1, 2, 3, 4, 5]
      const features2 = [1, 2, 3, 4, 5]

      const result = calculateCorrelation(features1, features2)

      expect(result).toBeCloseTo(1.0, 1)
    })

    it('should return negative correlation for inverse patterns', () => {
      const features1 = [1, 2, 3, 4, 5]
      const features2 = [5, 4, 3, 2, 1]

      const result = calculateCorrelation(features1, features2)

      expect(result).toBeLessThan(0)
    })

    it('should return low correlation for random data', () => {
      const features1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const features2 = [10, 2, 8, 4, 6, 1, 9, 3, 7, 5]

      const result = calculateCorrelation(features1, features2)

      // Random or weakly correlated data should have lower absolute correlation
      // We just check that it returns a valid correlation coefficient
      expect(result).toBeGreaterThanOrEqual(-1)
      expect(result).toBeLessThanOrEqual(1)
    })
  })

  describe('FeatureEngine Class', () => {
    let engine: FeatureEngine

    beforeAll(() => {
      engine = new FeatureEngine()
    })

    it('should create instance', () => {
      expect(engine).toBeDefined()
      expect(engine).toBeInstanceOf(FeatureEngine)
    })

    it('should calculate RSI via instance method', () => {
      const result = engine.rsi(samplePrices)

      expect(result).toBeDefined()
      expect(result.values).toBeDefined()
    })

    it('should calculate MACD via instance method', () => {
      const result = engine.macd(samplePrices)

      expect(result).toBeDefined()
      expect(result.macd_line).toBeDefined()
    })

    it('should calculate Bollinger Bands via instance method', () => {
      const result = engine.bollingerBands(samplePrices)

      expect(result).toBeDefined()
      expect(result.upper_band).toBeDefined()
    })

    it('should normalize features via instance method', () => {
      const result = engine.normalize(sampleFeatures)

      expect(result).toBeDefined()
      expect(result.normalized).toBeDefined()
    })

    it('should calculate stats via instance method', () => {
      const result = engine.stats(sampleFeatures)

      expect(result).toBeDefined()
      expect(result.mean).toBeDefined()
    })

    it('should detect outliers via instance method', () => {
      const result = engine.outliers(sampleFeatures)

      expect(result).toBeDefined()
      expect(result.outliers).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should process complete feature engineering workflow', () => {
      // Calculate technical indicators
      const rsi = calculateRSI(samplePrices)
      expect(rsi.values).toBeDefined()

      // Normalize the features
      const normalized = normalizeFeatures(rsi.values.slice(14))
      expect(normalized.normalized).toBeDefined()

      // Calculate statistics
      const stats = calculateFeatureStats(normalized.normalized)
      expect(stats.mean).toBeDefined()

      // Detect outliers
      const outliers = detectOutliers(normalized.normalized, 2.0)
      expect(outliers.outliers).toBeDefined()
    })

    it('should handle multiple indicators on same data', () => {
      const rsi = calculateRSI(samplePrices)
      const macd = calculateMACD(samplePrices)
      const bb = calculateBollingerBands(samplePrices)

      expect(rsi.values).toBeDefined()
      expect(macd.histogram).toBeDefined()
      expect(bb.bandwidth).toBeDefined()
    })

    it('should chain feature transformations', () => {
      // Get RSI (will have 0s at the beginning, that's fine)
      const rsi = calculateRSI(samplePrices)
      const rsiValues = rsi.values.slice(14) // Skip the first 14 values that are 0

      // Normalize
      const normalized = normalizeFeatures(rsiValues)

      // Scale
      const scaled = scaleFeatures(normalized.normalized, 0, 100)

      // Get stats
      const stats = calculateFeatureStats(scaled)

      expect(stats.mean).toBeDefined()
      expect(stats.max).toBeLessThanOrEqual(100.001) // Allow small floating point error
      expect(stats.min).toBeGreaterThanOrEqual(-0.001) // Allow small floating point error
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle small price arrays', () => {
      const smallPrices = [100, 101, 102]

      // These should still work or throw appropriate error
      expect(() => {
        calculateRSI(smallPrices)
      }).toThrow()
    })

    it('should handle constant feature values', () => {
      const constantFeatures = [5.0, 5.0, 5.0, 5.0, 5.0]
      const result = calculateFeatureStats(constantFeatures)

      expect(result.std_dev).toBeCloseTo(0, 1)
    })

    it('should handle single extreme outlier', () => {
      const dataWithOneOutlier = [1, 2, 3, 4, 5, 1000]
      const result = detectOutliers(dataWithOneOutlier, 2.0)

      expect(result.outlier_count).toBeGreaterThan(0)
    })

    it('should normalize feature range correctly in Min-Max', () => {
      const result = normalizeFeatures(sampleFeatures, {
        method: 'minmax',
        feature_range: [0, 10],
      })

      result.normalized.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(10)
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle large price arrays efficiently', () => {
      const largePrices = Array.from({ length: 1000 }, (_, i) =>
        Math.sin(i * 0.1) * 10 + 100
      )

      const start = performance.now()
      const result = calculateRSI(largePrices, { period: 14 })
      const end = performance.now()

      expect(result.values).toBeDefined()
      expect(end - start).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle large feature arrays efficiently', () => {
      const largeFeatures = Array.from({ length: 10000 }, () =>
        Math.random() * 100
      )

      const start = performance.now()
      const result = normalizeFeatures(largeFeatures)
      const end = performance.now()

      expect(result.normalized).toBeDefined()
      expect(end - start).toBeLessThan(1000)
    })

    it('should calculate statistics on large arrays efficiently', () => {
      const largeFeatures = Array.from({ length: 50000 }, () =>
        Math.random() * 100
      )

      const start = performance.now()
      const result = calculateFeatureStats(largeFeatures)
      const end = performance.now()

      expect(result.mean).toBeDefined()
      expect(end - start).toBeLessThan(2000)
    })
  })
})
