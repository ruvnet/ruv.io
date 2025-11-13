// TypeScript type definitions and exports for intrinsic-dim

/**
 * Metrics for dimensionality estimation
 */
export interface DimensionalityMetrics {
  /**
   * Variance ratio explained by the estimated dimensions
   */
  varianceRatio: number;

  /**
   * Number of samples used in estimation
   */
  samplesUsed: number;

  /**
   * Number of features in the input data
   */
  features: number;
}

/**
 * Result of dimensionality estimation
 */
export interface DimensionalityResult {
  /**
   * The estimated intrinsic dimension
   */
  dimension: number;

  /**
   * Confidence score (0.0 - 1.0)
   */
  confidence: number;

  /**
   * Additional metrics
   */
  metrics: DimensionalityMetrics;
}

/**
 * Estimation parameters
 */
export interface EstimationParams {
  /**
   * Variance threshold for determining dimension (default: 0.95)
   */
  varianceThreshold: number;

  /**
   * Minimum samples required
   */
  minSamples: number;

  /**
   * Maximum features to consider
   */
  maxFeatures: number;
}

/**
 * Estimate intrinsic dimensionality from data
 *
 * @param data - 2D array where each row is a sample and each column is a feature
 * @returns DimensionalityResult containing estimated dimension and confidence
 * @throws Error if data is invalid or empty
 *
 * @example
 * const result = estimate([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
 * console.log(result.dimension); // Estimated dimension
 */
export function estimate(data: number[][]): DimensionalityResult;

/**
 * Estimate dimensionality using MKKF method
 *
 * @param data - 2D array of numerical data
 * @param kMax - Maximum number of nearest neighbors to consider
 * @returns Estimated intrinsic dimension
 * @throws Error if data is invalid
 *
 * @example
 * const dimension = estimateMkkf([[1, 2], [3, 4], [5, 6]], 2);
 * console.log(dimension); // Estimated dimension
 */
export function estimateMkkf(data: number[][], kMax: number): number;

/**
 * Estimate dimensionality for batch data
 *
 * @param dataBatch - Vector of data samples
 * @returns Vector of DimensionalityResult for each sample
 * @throws Error if batch is empty or contains invalid data
 *
 * @example
 * const results = estimateBatch([
 *   [[1, 2], [3, 4]],
 *   [[5, 6], [7, 8]]
 * ]);
 */
export function estimateBatch(dataBatch: number[][][]): DimensionalityResult[];

/**
 * Get default estimation parameters
 *
 * @returns EstimationParams with default values
 *
 * @example
 * const params = getDefaultParams();
 * console.log(params.varianceThreshold); // 0.95
 */
export function getDefaultParams(): EstimationParams;

// Re-export native bindings
export * from './index.node';
