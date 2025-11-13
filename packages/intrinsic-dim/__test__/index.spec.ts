import { describe, it, expect, beforeAll } from 'vitest';
import {
  estimate,
  estimateMkkf,
  estimateBatch,
  getDefaultParams,
  DimensionalityResult,
  EstimationParams,
} from '../src/index';

describe('intrinsic-dim', () => {
  describe('estimate', () => {
    it('should estimate dimensionality for 2D data', () => {
      const data = [
        [1.0, 2.0],
        [3.0, 4.0],
        [5.0, 6.0],
        [7.0, 8.0],
      ];

      const result = estimate(data);

      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThan(0);
      expect(result.dimension).toBeLessThanOrEqual(2);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.samplesUsed).toBe(4);
      expect(result.metrics.features).toBe(2);
    });

    it('should estimate dimensionality for 3D data', () => {
      const data = [
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [7.0, 8.0, 9.0],
        [10.0, 11.0, 12.0],
      ];

      const result = estimate(data);

      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThan(0);
      expect(result.dimension).toBeLessThanOrEqual(3);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.metrics.features).toBe(3);
    });

    it('should handle higher dimensional data', () => {
      const data = [
        [1.0, 2.0, 3.0, 4.0, 5.0],
        [2.0, 3.0, 4.0, 5.0, 6.0],
        [3.0, 4.0, 5.0, 6.0, 7.0],
        [4.0, 5.0, 6.0, 7.0, 8.0],
      ];

      const result = estimate(data);

      expect(result).toBeDefined();
      expect(result.dimension).toBeGreaterThan(0);
      expect(result.dimension).toBeLessThanOrEqual(5);
      expect(result.metrics.features).toBe(5);
    });

    it('should throw error for empty data', () => {
      expect(() => estimate([])).toThrow();
    });

    it('should throw error for data with inconsistent row lengths', () => {
      const data = [
        [1.0, 2.0],
        [3.0, 4.0, 5.0], // Different length
      ];

      expect(() => estimate(data)).toThrow();
    });

    it('should throw error for data with empty rows', () => {
      const data = [
        [],
        [],
      ];

      expect(() => estimate(data)).toThrow();
    });
  });

  describe('estimateMkkf', () => {
    it('should estimate dimensionality using MKKF method', () => {
      const data = [
        [1.0, 2.0],
        [3.0, 4.0],
        [5.0, 6.0],
        [7.0, 8.0],
      ];

      const dimension = estimateMkkf(data, 2);

      expect(dimension).toBeGreaterThan(0);
      expect(dimension).toBeLessThanOrEqual(2);
    });

    it('should handle higher k_max values', () => {
      const data = [
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [5.0, 6.0, 7.0],
        [8.0, 9.0, 10.0],
        [11.0, 12.0, 13.0],
      ];

      const dimension = estimateMkkf(data, 4);

      expect(dimension).toBeGreaterThan(0);
      expect(dimension).toBeLessThanOrEqual(3);
    });

    it('should throw error for empty data', () => {
      expect(() => estimateMkkf([], 2)).toThrow();
    });

    it('should throw error for k_max of 0', () => {
      const data = [
        [1.0, 2.0],
        [3.0, 4.0],
      ];

      expect(() => estimateMkkf(data, 0)).toThrow();
    });
  });

  describe('estimateBatch', () => {
    it('should estimate dimensionality for multiple datasets', () => {
      const dataBatch = [
        [
          [1.0, 2.0],
          [3.0, 4.0],
          [5.0, 6.0],
        ],
        [
          [1.0, 2.0, 3.0],
          [4.0, 5.0, 6.0],
          [7.0, 8.0, 9.0],
        ],
      ];

      const results = estimateBatch(dataBatch);

      expect(results).toHaveLength(2);
      expect(results[0].dimension).toBeGreaterThan(0);
      expect(results[0].dimension).toBeLessThanOrEqual(2);
      expect(results[1].dimension).toBeGreaterThan(0);
      expect(results[1].dimension).toBeLessThanOrEqual(3);
    });

    it('should throw error for empty batch', () => {
      expect(() => estimateBatch([])).toThrow();
    });
  });

  describe('getDefaultParams', () => {
    it('should return default parameters', () => {
      const params = getDefaultParams();

      expect(params).toBeDefined();
      expect(params.varianceThreshold).toBe(0.95);
      expect(params.minSamples).toBe(2);
      expect(params.maxFeatures).toBe(10000);
    });

    it('should have valid parameter values', () => {
      const params = getDefaultParams();

      expect(params.varianceThreshold).toBeGreaterThan(0);
      expect(params.varianceThreshold).toBeLessThanOrEqual(1);
      expect(params.minSamples).toBeGreaterThan(0);
      expect(params.maxFeatures).toBeGreaterThan(0);
    });
  });

  describe('Result structure', () => {
    it('should return properly structured DimensionalityResult', () => {
      const data = [
        [1.0, 2.0],
        [3.0, 4.0],
        [5.0, 6.0],
      ];

      const result = estimate(data);

      // Check result structure
      expect(result).toHaveProperty('dimension');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('metrics');

      // Check metrics structure
      expect(result.metrics).toHaveProperty('varianceRatio');
      expect(result.metrics).toHaveProperty('samplesUsed');
      expect(result.metrics).toHaveProperty('features');
    });

    it('should have valid metric ranges', () => {
      const data = [
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [7.0, 8.0, 9.0],
        [10.0, 11.0, 12.0],
      ];

      const result = estimate(data);

      expect(result.metrics.varianceRatio).toBeGreaterThanOrEqual(0);
      expect(result.metrics.varianceRatio).toBeLessThanOrEqual(1);
      expect(result.metrics.samplesUsed).toBeGreaterThan(0);
      expect(result.metrics.features).toBeGreaterThan(0);
    });
  });

  describe('Integration tests', () => {
    it('should handle realistic ML data scenario', () => {
      // Simulate feature vectors from an ML model
      const features = [];
      for (let i = 0; i < 100; i++) {
        const row = [];
        for (let j = 0; j < 50; j++) {
          row.push(Math.random() * 100);
        }
        features.push(row);
      }

      const result = estimate(features);

      expect(result.dimension).toBeGreaterThan(0);
      expect(result.dimension).toBeLessThanOrEqual(50);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metrics.samplesUsed).toBe(100);
      expect(result.metrics.features).toBe(50);
    });

    it('should distinguish between high and low intrinsic dimension data', () => {
      // Low dimensional data (points on a line)
      const lineFits = [
        [1.0, 1.0],
        [2.0, 2.0],
        [3.0, 3.0],
        [4.0, 4.0],
        [5.0, 5.0],
      ];

      // High dimensional random data
      const highDim = [];
      for (let i = 0; i < 5; i++) {
        highDim.push([Math.random(), Math.random(), Math.random(), Math.random(), Math.random()]);
      }

      const lowDimResult = estimate(lineFits);
      const highDimResult = estimate(highDim);

      expect(lowDimResult.dimension).toBeLessThanOrEqual(2);
      expect(highDimResult.dimension).toBeGreaterThanOrEqual(2);
    });
  });
});
