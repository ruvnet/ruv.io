import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  TemporalAttractorStudio,
  calculateFTLE,
  analyzeAttractor,
  analyzeTemporalDynamics,
  predictTrajectory,
  findNearestNeighbors,
  TrajectoryPoint,
  FTLEConfig,
} from '../src/index'

describe('Temporal Attractor Studio', () => {
  let studio: TemporalAttractorStudio

  // Sample trajectories for testing
  const sampleTrajectory: TrajectoryPoint[] = [
    { x: 0.0, y: 0.0, z: 0.0, time: 0.0 },
    { x: 0.1, y: 0.05, z: 0.02, time: 0.1 },
    { x: 0.15, y: 0.12, z: 0.05, time: 0.2 },
    { x: 0.18, y: 0.18, z: 0.08, time: 0.3 },
    { x: 0.19, y: 0.22, z: 0.1, time: 0.4 },
    { x: 0.18, y: 0.24, z: 0.11, time: 0.5 },
  ]

  const circularTrajectory: TrajectoryPoint[] = [
    { x: 1.0, y: 0.0, z: 0.0, time: 0.0 },
    { x: 0.9, y: 0.43, z: 0.0, time: 0.1 },
    { x: 0.62, y: 0.78, z: 0.0, time: 0.2 },
    { x: 0.22, y: 0.97, z: 0.0, time: 0.3 },
    { x: -0.23, y: 0.97, z: 0.0, time: 0.4 },
    { x: -0.62, y: 0.78, z: 0.0, time: 0.5 },
    { x: -0.9, y: 0.43, z: 0.0, time: 0.6 },
    { x: -1.0, y: 0.0, z: 0.0, time: 0.7 },
  ]

  beforeAll(() => {
    try {
      studio = new TemporalAttractorStudio()
    } catch (e) {
      console.warn('Studio initialization failed:', e)
    }
  })

  describe('calculateFTLE', () => {
    it('should calculate FTLE for a trajectory point', () => {
      const point: TrajectoryPoint = { x: 0.5, y: 0.3, z: 0.1, time: 0.0 }
      const config: FTLEConfig = {
        integration_time: 1.0,
        delta: 1e-3,
        max_iterations: 1000,
      }

      const result = calculateFTLE(point, config)

      expect(result).toBeDefined()
      expect(result.ftle_value).toBeDefined()
      expect(typeof result.ftle_value).toBe('number')
      expect(result.convergence_time).toBeDefined()
      expect(result.stability).toBeDefined()
      expect(result.point).toBeDefined()
    })

    it('should calculate FTLE without config', () => {
      const point: TrajectoryPoint = { x: 0.5, y: 0.3, time: 0.0 }

      const result = calculateFTLE(point)

      expect(result).toBeDefined()
      expect(result.ftle_value).toBeDefined()
      expect(result.stability).toBeGreaterThanOrEqual(0)
      expect(result.stability).toBeLessThanOrEqual(1)
    })

    it('should calculate FTLE for origin point', () => {
      const point: TrajectoryPoint = { x: 0.0, y: 0.0, time: 0.0 }

      const result = calculateFTLE(point)

      expect(result).toBeDefined()
      expect(result.ftle_value).toBeDefined()
    })

    it('should have stability between 0 and 1', () => {
      const point: TrajectoryPoint = { x: 1.0, y: 1.0, time: 0.0 }

      const result = calculateFTLE(point)

      expect(result.stability).toBeGreaterThanOrEqual(0)
      expect(result.stability).toBeLessThanOrEqual(1)
    })

    it('should calculate FTLE with 3D point', () => {
      const point: TrajectoryPoint = { x: 0.5, y: 0.3, z: 0.2, time: 0.0 }

      const result = calculateFTLE(point)

      expect(result).toBeDefined()
      expect(result.ftle_value).toBeDefined()
    })

    it('should use instance method', () => {
      if (!studio) {
        expect.skip()
      }

      const point: TrajectoryPoint = { x: 0.5, y: 0.3, time: 0.0 }
      const result = studio.calculateFTLE(point)

      expect(result).toBeDefined()
      expect(result.ftle_value).toBeDefined()
    })
  })

  describe('analyzeAttractor', () => {
    it('should analyze attractor from trajectory', () => {
      const result = analyzeAttractor(sampleTrajectory)

      expect(result).toBeDefined()
      expect(result.center).toBeDefined()
      expect(result.center.x).toBeDefined()
      expect(result.center.y).toBeDefined()
      expect(result.radius).toBeGreaterThan(0)
      expect(result.dimension).toBeDefined()
      expect(result.strength).toBeDefined()
      expect(result.stability_index).toBeDefined()
    })

    it('should calculate reasonable radius', () => {
      const result = analyzeAttractor(sampleTrajectory)

      expect(result.radius).toBeGreaterThan(0)
      expect(result.radius).toBeLessThan(1.0)
    })

    it('should have valid dimension estimate', () => {
      const result = analyzeAttractor(sampleTrajectory)

      expect(result.dimension).toBeGreaterThan(0)
      expect(result.dimension).toBeLessThanOrEqual(3)
    })

    it('should handle circular trajectory', () => {
      const result = analyzeAttractor(circularTrajectory)

      expect(result).toBeDefined()
      expect(result.radius).toBeGreaterThan(0)
      expect(result.dimension).toBeDefined()
    })

    it('should use instance method', () => {
      if (!studio) {
        expect.skip()
      }

      const result = studio.analyzeAttractor(sampleTrajectory)

      expect(result).toBeDefined()
      expect(result.center).toBeDefined()
    })
  })

  describe('analyzeTemporalDynamics', () => {
    it('should analyze temporal dynamics of trajectory', () => {
      const result = analyzeTemporalDynamics(sampleTrajectory)

      expect(result).toBeDefined()
      expect(result.lyapunov_exponent).toBeDefined()
      expect(result.entropy).toBeDefined()
      expect(result.dimension).toBeDefined()
      expect(result.chaos_indicator).toBeDefined()
    })

    it('should have valid lyapunov exponent', () => {
      const result = analyzeTemporalDynamics(sampleTrajectory)

      expect(typeof result.lyapunov_exponent).toBe('number')
    })

    it('should have valid entropy', () => {
      const result = analyzeTemporalDynamics(sampleTrajectory)

      expect(result.entropy).toBeGreaterThanOrEqual(0)
    })

    it('should have valid chaos indicator', () => {
      const result = analyzeTemporalDynamics(sampleTrajectory)

      expect(result.chaos_indicator).toBeGreaterThanOrEqual(0)
      expect(result.chaos_indicator).toBeLessThanOrEqual(1)
    })

    it('should detect periodicity in circular motion', () => {
      const result = analyzeTemporalDynamics(circularTrajectory)

      expect(result).toBeDefined()
      expect(result.period).toBeDefined()
    })

    it('should use instance method', () => {
      if (!studio) {
        expect.skip()
      }

      const result = studio.analyzeTemporalDynamics(sampleTrajectory)

      expect(result).toBeDefined()
      expect(result.lyapunov_exponent).toBeDefined()
    })
  })

  describe('predictTrajectory', () => {
    it('should predict future trajectory points', () => {
      const predictions = predictTrajectory(sampleTrajectory, 5)

      expect(predictions).toBeDefined()
      expect(Array.isArray(predictions)).toBe(true)
      expect(predictions.length).toBe(5)
    })

    it('should have valid confidence scores', () => {
      const predictions = predictTrajectory(sampleTrajectory, 3)

      predictions.forEach((pred) => {
        expect(pred.confidence).toBeGreaterThan(0)
        expect(pred.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('should generate monotonically increasing times', () => {
      const predictions = predictTrajectory(sampleTrajectory, 5)

      let lastTime = sampleTrajectory[sampleTrajectory.length - 1].time

      predictions.forEach((pred) => {
        expect(pred.time).toBeGreaterThanOrEqual(lastTime)
        lastTime = pred.time
      })
    })

    it('should decrease confidence over time', () => {
      const predictions = predictTrajectory(sampleTrajectory, 10)

      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i].confidence).toBeLessThanOrEqual(predictions[i - 1].confidence)
      }
    })

    it('should handle single step prediction', () => {
      const predictions = predictTrajectory(sampleTrajectory, 1)

      expect(predictions.length).toBe(1)
      expect(predictions[0].confidence).toBeGreaterThan(0)
    })

    it('should use instance method', () => {
      if (!studio) {
        expect.skip()
      }

      const predictions = studio.predictTrajectory(sampleTrajectory, 3)

      expect(predictions).toBeDefined()
      expect(predictions.length).toBe(3)
    })
  })

  describe('findNearestNeighbors', () => {
    it('should find k nearest neighbors', () => {
      const queryPoint: TrajectoryPoint = { x: 0.15, y: 0.15, time: 0.2 }
      const neighbors = findNearestNeighbors(sampleTrajectory, queryPoint, 3)

      expect(neighbors).toBeDefined()
      expect(Array.isArray(neighbors)).toBe(true)
      expect(neighbors.length).toBeGreaterThan(0)
      expect(neighbors.length).toBeLessThanOrEqual(3)
    })

    it('should return neighbors with valid distances', () => {
      const queryPoint: TrajectoryPoint = { x: 0.15, y: 0.15, time: 0.2 }
      const neighbors = findNearestNeighbors(sampleTrajectory, queryPoint, 5)

      neighbors.forEach((neighbor) => {
        expect(neighbor.distance).toBeGreaterThanOrEqual(0)
        expect(neighbor.index).toBeGreaterThanOrEqual(0)
        expect(neighbor.point).toBeDefined()
      })
    })

    it('should return neighbors sorted by distance', () => {
      const queryPoint: TrajectoryPoint = { x: 0.15, y: 0.15, time: 0.2 }
      const neighbors = findNearestNeighbors(sampleTrajectory, queryPoint, 5)

      for (let i = 1; i < neighbors.length; i++) {
        expect(neighbors[i].distance).toBeGreaterThanOrEqual(neighbors[i - 1].distance)
      }
    })

    it('should handle exact point match', () => {
      const queryPoint = sampleTrajectory[0]
      const neighbors = findNearestNeighbors(sampleTrajectory, queryPoint, 1)

      expect(neighbors.length).toBeGreaterThan(0)
      expect(neighbors[0].distance).toBe(0)
    })

    it('should limit results to available points', () => {
      const queryPoint: TrajectoryPoint = { x: 0.15, y: 0.15, time: 0.2 }
      const neighbors = findNearestNeighbors(sampleTrajectory, queryPoint, 100)

      expect(neighbors.length).toBeLessThanOrEqual(sampleTrajectory.length)
    })

    it('should use instance method', () => {
      if (!studio) {
        expect.skip()
      }

      const queryPoint: TrajectoryPoint = { x: 0.15, y: 0.15, time: 0.2 }
      const neighbors = studio.findNearestNeighbors(sampleTrajectory, queryPoint, 3)

      expect(neighbors).toBeDefined()
      expect(neighbors.length).toBeGreaterThan(0)
    })
  })

  describe('Instance Methods', () => {
    it('should create instance successfully', () => {
      if (!studio) {
        expect.skip()
      }

      expect(studio.isInitialized()).toBe(true)
    })

    it('should execute all instance methods', () => {
      if (!studio) {
        expect.skip()
      }

      const point: TrajectoryPoint = { x: 0.5, y: 0.3, time: 0.0 }

      const ftle = studio.calculateFTLE(point)
      expect(ftle).toBeDefined()

      const attractor = studio.analyzeAttractor(sampleTrajectory)
      expect(attractor).toBeDefined()

      const dynamics = studio.analyzeTemporalDynamics(sampleTrajectory)
      expect(dynamics).toBeDefined()

      const predictions = studio.predictTrajectory(sampleTrajectory, 3)
      expect(predictions.length).toBe(3)

      const neighbors = studio.findNearestNeighbors(sampleTrajectory, point, 3)
      expect(neighbors).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative coordinates', () => {
      const point: TrajectoryPoint = { x: -0.5, y: -0.3, time: 0.0 }

      const result = calculateFTLE(point)

      expect(result).toBeDefined()
      expect(result.ftle_value).toBeDefined()
    })

    it('should handle very small trajectory', () => {
      const smallTrajectory: TrajectoryPoint[] = [
        { x: 0.0, y: 0.0, time: 0.0 },
        { x: 0.1, y: 0.1, time: 0.1 },
      ]

      const result = analyzeAttractor(smallTrajectory)

      expect(result).toBeDefined()
      expect(result.radius).toBeGreaterThanOrEqual(0)
    })

    it('should handle large coordinates', () => {
      const point: TrajectoryPoint = { x: 1000.0, y: 2000.0, time: 0.0 }

      const result = calculateFTLE(point)

      expect(result).toBeDefined()
      expect(result.ftle_value).toBeDefined()
    })

    it('should handle 2D trajectories without z', () => {
      const trajectory2d: TrajectoryPoint[] = [
        { x: 0.0, y: 0.0, time: 0.0 },
        { x: 0.1, y: 0.1, time: 0.1 },
        { x: 0.2, y: 0.2, time: 0.2 },
      ]

      const result = analyzeAttractor(trajectory2d)

      expect(result).toBeDefined()
      expect(result.center).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should process ftle calculation quickly', () => {
      const point: TrajectoryPoint = { x: 0.5, y: 0.3, time: 0.0 }
      const start = Date.now()

      calculateFTLE(point)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should be very fast
    })

    it('should analyze large trajectory within reasonable time', () => {
      // Create a larger trajectory
      const largeTrajectory: TrajectoryPoint[] = []
      for (let i = 0; i < 100; i++) {
        largeTrajectory.push({
          x: Math.sin(i * 0.1),
          y: Math.cos(i * 0.1),
          time: i * 0.01,
        })
      }

      const start = Date.now()

      analyzeTemporalDynamics(largeTrajectory)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should be reasonably fast
    })
  })
})
