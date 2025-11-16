// NT Features - Feature Engineering for Neural Trader
// TypeScript bindings for the napi-rs module

export interface PriceData {
  open: number[]
  high: number[]
  low: number[]
  close: number[]
  volume?: number[]
}

export interface IndicatorConfig {
  period?: number
  fast_period?: number
  slow_period?: number
  signal_period?: number
  dev_multiplier?: number
  threshold?: number
}

export interface NormalizationOptions {
  method?: 'zscore' | 'minmax' | 'log'
  feature_range?: [number, number]
  epsilon?: number
}

export interface RSIResult {
  values: number[]
  period: number
}

export interface MACDResult {
  macd_line: number[]
  signal_line: number[]
  histogram: number[]
}

export interface BollingerBandsResult {
  upper_band: number[]
  middle_band: number[]
  lower_band: number[]
  bandwidth: number[]
}

export interface NormalizationResult {
  normalized: number[]
  mean?: number
  std_dev?: number
  min?: number
  max?: number
}

export interface FeatureStats {
  mean: number
  std_dev: number
  min: number
  max: number
  median: number
  skewness: number
  kurtosis: number
}

/**
 * Native bindings from nt_features Rust module
 */
let ntFeatures: any

try {
  // Load the native module via platform loader
  ntFeatures = require('..')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_features module not loaded. Build the project first.')
  ntFeatures = null
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param prices - Array of price values
 * @param config - RSI configuration (period default: 14)
 * @returns RSI values and period
 */
export function calculateRSI(prices: number[], config?: IndicatorConfig): RSIResult {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const pricesJson = JSON.stringify(prices)
  const configJson = JSON.stringify(config || { period: 14 })
  const result = ntFeatures.calculateRsi(pricesJson, configJson)

  return JSON.parse(result)
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param prices - Array of price values
 * @param config - MACD configuration (fast: 12, slow: 26, signal: 9)
 * @returns MACD line, signal line, and histogram
 */
export function calculateMACD(prices: number[], config?: IndicatorConfig): MACDResult {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const pricesJson = JSON.stringify(prices)
  const configJson = JSON.stringify(
    config || {
      fast_period: 12,
      slow_period: 26,
      signal_period: 9,
    }
  )
  const result = ntFeatures.calculateMacd(pricesJson, configJson)

  return JSON.parse(result)
}

/**
 * Calculate Bollinger Bands
 * @param prices - Array of price values
 * @param config - Bollinger Bands configuration (period: 20, dev_multiplier: 2.0)
 * @returns Upper, middle, lower bands and bandwidth
 */
export function calculateBollingerBands(
  prices: number[],
  config?: IndicatorConfig
): BollingerBandsResult {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const pricesJson = JSON.stringify(prices)
  const configJson = JSON.stringify(
    config || {
      period: 20,
      dev_multiplier: 2.0,
    }
  )
  const result = ntFeatures.calculateBollingerBands(pricesJson, configJson)

  return JSON.parse(result)
}

/**
 * Calculate Stochastic Oscillator
 * @param priceData - Price data with high, low, close
 * @param config - Stochastic configuration (period: 14, fast_period: 3, slow_period: 3)
 * @returns K values and D values
 */
export function calculateStochastic(
  priceData: PriceData,
  config?: IndicatorConfig
): Record<string, any> {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const priceDataJson = JSON.stringify(priceData)
  const configJson = JSON.stringify(
    config || {
      period: 14,
      fast_period: 3,
      slow_period: 3,
    }
  )
  const result = ntFeatures.calculateStochastic(priceDataJson, configJson)

  return JSON.parse(result)
}

/**
 * Calculate Average True Range (ATR)
 * @param priceData - Price data with high, low, close
 * @param config - ATR configuration (period: 14)
 * @returns ATR values
 */
export function calculateATR(
  priceData: PriceData,
  config?: IndicatorConfig
): Record<string, any> {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const priceDataJson = JSON.stringify(priceData)
  const configJson = JSON.stringify(config || { period: 14 })
  const result = ntFeatures.calculateAtr(priceDataJson, configJson)

  return JSON.parse(result)
}

/**
 * Normalize features using various methods
 * @param features - Array of feature values
 * @param options - Normalization options (method: 'zscore' | 'minmax' | 'log')
 * @returns Normalized features and statistics
 */
export function normalizeFeatures(
  features: number[],
  options?: NormalizationOptions
): NormalizationResult {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const featuresJson = JSON.stringify(features)
  const optionsJson = JSON.stringify(
    options || {
      method: 'zscore',
      epsilon: 1e-8,
    }
  )
  const result = ntFeatures.normalizeFeatures(featuresJson, optionsJson)

  return JSON.parse(result)
}

/**
 * Calculate rolling window statistics
 * @param features - Array of feature values
 * @param windowSize - Size of the rolling window
 * @returns Rolling means, stds, mins, and maxs
 */
export function calculateRollingStats(features: number[], windowSize: number): Record<string, any> {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const featuresJson = JSON.stringify(features)
  const result = ntFeatures.calculateRollingStats(featuresJson, windowSize)

  return JSON.parse(result)
}

/**
 * Calculate feature statistics
 * @param features - Array of feature values
 * @returns Mean, std_dev, min, max, median, skewness, kurtosis
 */
export function calculateFeatureStats(features: number[]): FeatureStats {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const featuresJson = JSON.stringify(features)
  const result = ntFeatures.calculateFeatureStats(featuresJson)

  return JSON.parse(result)
}

/**
 * Scale features to a specific range
 * @param features - Array of feature values
 * @param minValue - Minimum value for the scaled range
 * @param maxValue - Maximum value for the scaled range
 * @returns Scaled features
 */
export function scaleFeatures(
  features: number[],
  minValue: number,
  maxValue: number
): number[] {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const featuresJson = JSON.stringify(features)
  const result = ntFeatures.scaleFeatures(featuresJson, minValue, maxValue)

  return JSON.parse(result)
}

/**
 * Detect outliers using Z-score method
 * @param features - Array of feature values
 * @param threshold - Z-score threshold for outlier detection
 * @returns Outliers and Z-scores
 */
export function detectOutliers(features: number[], threshold: number = 3.0): Record<string, any> {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const featuresJson = JSON.stringify(features)
  const result = ntFeatures.detectOutliers(featuresJson, threshold)

  return JSON.parse(result)
}

/**
 * Calculate correlation between two feature arrays
 * @param features1 - First feature array
 * @param features2 - Second feature array
 * @returns Correlation coefficient (-1 to 1)
 */
export function calculateCorrelation(features1: number[], features2: number[]): number {
  if (!ntFeatures) {
    throw new Error('Native module not available')
  }

  const features1Json = JSON.stringify(features1)
  const features2Json = JSON.stringify(features2)

  return ntFeatures.calculateCorrelation(features1Json, features2Json)
}

/**
 * FeatureEngine class for advanced feature engineering operations
 */
export class FeatureEngine {
  /**
   * Create a new FeatureEngine instance
   */
  constructor() {
    if (!ntFeatures) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Calculate RSI for prices
   */
  rsi(prices: number[], config?: IndicatorConfig): RSIResult {
    return calculateRSI(prices, config)
  }

  /**
   * Calculate MACD for prices
   */
  macd(prices: number[], config?: IndicatorConfig): MACDResult {
    return calculateMACD(prices, config)
  }

  /**
   * Calculate Bollinger Bands for prices
   */
  bollingerBands(prices: number[], config?: IndicatorConfig): BollingerBandsResult {
    return calculateBollingerBands(prices, config)
  }

  /**
   * Calculate Stochastic Oscillator
   */
  stochastic(priceData: PriceData, config?: IndicatorConfig): Record<string, any> {
    return calculateStochastic(priceData, config)
  }

  /**
   * Calculate ATR
   */
  atr(priceData: PriceData, config?: IndicatorConfig): Record<string, any> {
    return calculateATR(priceData, config)
  }

  /**
   * Normalize features
   */
  normalize(features: number[], options?: NormalizationOptions): NormalizationResult {
    return normalizeFeatures(features, options)
  }

  /**
   * Calculate rolling statistics
   */
  rollingStats(features: number[], windowSize: number): Record<string, any> {
    return calculateRollingStats(features, windowSize)
  }

  /**
   * Calculate feature statistics
   */
  stats(features: number[]): FeatureStats {
    return calculateFeatureStats(features)
  }

  /**
   * Scale features to range
   */
  scale(features: number[], minValue: number, maxValue: number): number[] {
    return scaleFeatures(features, minValue, maxValue)
  }

  /**
   * Detect outliers
   */
  outliers(features: number[], threshold?: number): Record<string, any> {
    return detectOutliers(features, threshold)
  }

  /**
   * Calculate correlation
   */
  correlation(features1: number[], features2: number[]): number {
    return calculateCorrelation(features1, features2)
  }
}

// Export all types and functions
export default {
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
  FeatureEngine,
}
