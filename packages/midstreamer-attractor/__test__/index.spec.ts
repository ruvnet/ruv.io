import { describe, it, expect, beforeAll } from 'vitest'
import {
  MidstreamerAttractor,
  simulateLorenz,
  simulateRossler,
  computeLyapunovExponents,
  computeTrajectoryStatistics,
  extractAttractorPoints,
  computeRecurrenceTime,
  SimulationConfig,
  Trajectory,
} from '../src/index'

describe('Midstreamer Attractor - Dynamical Systems', () => {
  let attractor: MidstreamerAttractor

  beforeAll(() => {
    attractor = new MidstreamerAttractor()
  })

  describe('simulateLorenz', () => {
    it('should simulate Lorenz attractor with default parameters', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 1000,
        parameters: {
          sigma: 10.0,
          rho: 28.0,
          beta: 8.0 / 3.0,
        },
      }

      const trajectory = simulateLorenz(config, [1.0, 1.0, 1.0])

      expect(trajectory).toBeDefined()
      expect(trajectory.id).toBeDefined()
      expect(trajectory.system_type).toBe('lorenz')
      expect(trajectory.points).toBeDefined()
      expect(trajectory.points.length).toBe(config.num_steps + 1) // includes initial point
    })

    it('should preserve initial point', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 100,
        parameters: {},
      }

      const initial: [number, number, number] = [1.5, 2.0, 3.5]
      const trajectory = simulateLorenz(config, initial)

      expect(trajectory.initial_point.x).toBe(initial[0])
      expect(trajectory.initial_point.y).toBe(initial[1])
      expect(trajectory.initial_point.z).toBe(initial[2])
      expect(trajectory.points[0].x).toBe(initial[0])
      expect(trajectory.points[0].y).toBe(initial[1])
      expect(trajectory.points[0].z).toBe(initial[2])
    })

    it('should generate multiple distinct points', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 500,
        parameters: {
          sigma: 10.0,
          rho: 28.0,
          beta: 2.666666667,
        },
      }

      const trajectory = simulateLorenz(config, [0.1, 0.1, 0.1])

      expect(trajectory.points.length).toBeGreaterThan(100)

      // Check that points are not all identical
      let uniquePoints = 0
      const seenPoints = new Set<string>()
      for (const point of trajectory.points) {
        const key = `${point.x.toFixed(4)},${point.y.toFixed(4)},${point.z.toFixed(4)}`
        if (!seenPoints.has(key)) {
          uniquePoints++
          seenPoints.add(key)
        }
      }

      expect(uniquePoints).toBeGreaterThan(100)
    })

    it('should handle custom parameters', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 200,
        parameters: {
          sigma: 15.0,
          rho: 30.0,
          beta: 3.0,
        },
      }

      const trajectory = simulateLorenz(config, [1.0, 1.0, 1.0])

      expect(trajectory.parameters.sigma).toBe(15.0)
      expect(trajectory.parameters.rho).toBe(30.0)
      expect(trajectory.parameters.beta).toBe(3.0)
    })

    it('should work with instance method', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 100,
        parameters: {},
      }

      const trajectory = attractor.simulateLorenz(config, [1.0, 1.0, 1.0])

      expect(trajectory).toBeDefined()
      expect(trajectory.system_type).toBe('lorenz')
    })
  })

  describe('simulateRossler', () => {
    it('should simulate Rössler attractor with default parameters', () => {
      const config: SimulationConfig = {
        system_type: 'rossler',
        time_step: 0.01,
        num_steps: 1000,
        parameters: {
          a: 0.2,
          b: 0.2,
          c: 5.7,
        },
      }

      const trajectory = simulateRossler(config, [1.0, 1.0, 1.0])

      expect(trajectory).toBeDefined()
      expect(trajectory.id).toBeDefined()
      expect(trajectory.system_type).toBe('rossler')
      expect(trajectory.points).toBeDefined()
      expect(trajectory.points.length).toBe(config.num_steps + 1)
    })

    it('should preserve initial point for Rössler', () => {
      const config: SimulationConfig = {
        system_type: 'rossler',
        time_step: 0.01,
        num_steps: 100,
        parameters: {},
      }

      const initial: [number, number, number] = [0.5, 0.5, 0.5]
      const trajectory = simulateRossler(config, initial)

      expect(trajectory.initial_point.x).toBe(initial[0])
      expect(trajectory.initial_point.y).toBe(initial[1])
      expect(trajectory.initial_point.z).toBe(initial[2])
    })

    it('should generate different trajectories for different initial conditions', () => {
      const config: SimulationConfig = {
        system_type: 'rossler',
        time_step: 0.01,
        num_steps: 200,
        parameters: {
          a: 0.2,
          b: 0.2,
          c: 5.7,
        },
      }

      const traj1 = simulateRossler(config, [1.0, 1.0, 1.0])
      const traj2 = simulateRossler(config, [2.0, 2.0, 2.0])

      // The trajectories should diverge over time
      expect(traj1.points[traj1.points.length - 1].x).not.toBe(
        traj2.points[traj2.points.length - 1].x
      )
    })

    it('should work with instance method', () => {
      const config: SimulationConfig = {
        system_type: 'rossler',
        time_step: 0.01,
        num_steps: 100,
        parameters: {},
      }

      const trajectory = attractor.simulateRossler(config, [1.0, 1.0, 1.0])

      expect(trajectory).toBeDefined()
      expect(trajectory.system_type).toBe('rossler')
    })
  })

  describe('computeLyapunovExponents', () => {
    let lorenzTrajectory: Trajectory

    beforeAll(() => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 5000,
        parameters: {
          sigma: 10.0,
          rho: 28.0,
          beta: 8.0 / 3.0,
        },
      }
      lorenzTrajectory = simulateLorenz(config, [1.0, 1.0, 1.0])
    })

    it('should compute Lyapunov exponents', () => {
      const analysis = computeLyapunovExponents(lorenzTrajectory)

      expect(analysis).toBeDefined()
      expect(analysis.exponents).toBeDefined()
      expect(analysis.exponents.length).toBe(3)
      expect(analysis.max_exponent).toBeDefined()
      expect(analysis.is_chaotic).toBeDefined()
    })

    it('should detect chaotic behavior in Lorenz system', () => {
      const analysis = computeLyapunovExponents(lorenzTrajectory)

      // Lorenz system is known to be chaotic
      expect(analysis.is_chaotic).toBe(true)
      expect(analysis.max_exponent).toBeGreaterThan(0)
    })

    it('should estimate fractal dimension', () => {
      const analysis = computeLyapunovExponents(lorenzTrajectory)

      expect(analysis.dimension).toBeGreaterThan(0)
      expect(analysis.dimension).toBeLessThanOrEqual(3)
    })

    it('should have all exponents defined', () => {
      const analysis = computeLyapunovExponents(lorenzTrajectory)

      for (const exp of analysis.exponents) {
        expect(typeof exp).toBe('number')
        expect(isFinite(exp)).toBe(true)
      }
    })

    it('should work with instance method', () => {
      const analysis = attractor.analyzeChaos(lorenzTrajectory)

      expect(analysis).toBeDefined()
      expect(analysis.is_chaotic).toBeDefined()
    })
  })

  describe('computeTrajectoryStatistics', () => {
    let trajectory: Trajectory

    beforeAll(() => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 2000,
        parameters: {},
      }
      trajectory = simulateLorenz(config, [1.0, 1.0, 1.0])
    })

    it('should compute trajectory statistics', () => {
      const stats = computeTrajectoryStatistics(trajectory)

      expect(stats).toBeDefined()
      expect(stats.trajectory_id).toBe(trajectory.id)
      expect(stats.total_distance).toBeGreaterThan(0)
      expect(stats.mean_distance).toBeGreaterThan(0)
      expect(stats.std_dev).toBeGreaterThanOrEqual(0)
    })

    it('should have valid distance metrics', () => {
      const stats = computeTrajectoryStatistics(trajectory)

      expect(stats.min_distance).toBeLessThanOrEqual(stats.mean_distance)
      expect(stats.mean_distance).toBeLessThanOrEqual(stats.max_distance)
      expect(stats.point_count).toBe(trajectory.points.length)
    })

    it('should have reasonable standard deviation', () => {
      const stats = computeTrajectoryStatistics(trajectory)

      expect(stats.std_dev).toBeLessThanOrEqual(stats.max_distance)
      expect(stats.std_dev).toBeGreaterThanOrEqual(0)
    })

    it('should work with instance method', () => {
      const stats = attractor.getStatistics(trajectory)

      expect(stats).toBeDefined()
      expect(stats.total_distance).toBeGreaterThan(0)
    })
  })

  describe('extractAttractorPoints', () => {
    let trajectory: Trajectory

    beforeAll(() => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 1000,
        parameters: {},
      }
      trajectory = simulateLorenz(config, [0.1, 0.1, 0.1])
    })

    it('should extract attractor points with skip ratio', () => {
      const filtered = extractAttractorPoints(trajectory, 0.3)

      expect(filtered).toBeDefined()
      expect(filtered.points.length).toBeLessThan(trajectory.points.length)
      expect(filtered.points.length).toBeGreaterThan(0)
    })

    it('should respect skip ratio', () => {
      const skipRatio = 0.5
      const filtered = extractAttractorPoints(trajectory, skipRatio)

      const expectedLength = Math.floor(trajectory.points.length * (1 - skipRatio))
      expect(filtered.points.length).toBeCloseTo(expectedLength, -1)
    })

    it('should handle zero skip ratio', () => {
      const filtered = extractAttractorPoints(trajectory, 0.0)

      expect(filtered.points.length).toBe(trajectory.points.length)
    })

    it('should handle near-full skip ratio', () => {
      const filtered = extractAttractorPoints(trajectory, 0.99)

      expect(filtered.points.length).toBeLessThan(trajectory.points.length)
      expect(filtered.points.length).toBeGreaterThan(0)
    })

    it('should work with instance method', () => {
      const filtered = attractor.extractAttractor(trajectory, 0.3)

      expect(filtered).toBeDefined()
      expect(filtered.points.length).toBeLessThan(trajectory.points.length)
    })

    it('should throw on invalid skip ratio', () => {
      expect(() => extractAttractorPoints(trajectory, -0.1)).toThrow()
      expect(() => extractAttractorPoints(trajectory, 1.5)).toThrow()
    })
  })

  describe('computeRecurrenceTime', () => {
    let trajectory: Trajectory

    beforeAll(() => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 3000,
        parameters: {},
      }
      trajectory = simulateLorenz(config, [1.0, 1.0, 1.0])
    })

    it('should compute recurrence times', () => {
      const analysis = computeRecurrenceTime(trajectory, 0.5)

      expect(analysis).toBeDefined()
      expect(analysis.trajectory_id).toBe(trajectory.id)
      expect(analysis.threshold).toBe(0.5)
      expect(analysis.recurrence_count).toBeGreaterThanOrEqual(0)
    })

    it('should find recurrence patterns with small threshold', () => {
      const analysis = computeRecurrenceTime(trajectory, 0.1)

      expect(analysis.recurrence_count).toBeGreaterThanOrEqual(0)
      if (analysis.recurrence_count > 0) {
        expect(analysis.mean_recurrence_time).toBeGreaterThan(0)
      }
    })

    it('should find more recurrences with larger threshold', () => {
      const analysis1 = computeRecurrenceTime(trajectory, 0.1)
      const analysis2 = computeRecurrenceTime(trajectory, 1.0)

      expect(analysis2.recurrence_count).toBeGreaterThanOrEqual(analysis1.recurrence_count)
    })

    it('should work with instance method', () => {
      const analysis = attractor.analyzeRecurrence(trajectory, 0.5)

      expect(analysis).toBeDefined()
      expect(analysis.recurrence_count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Integration tests', () => {
    it('should perform complete analysis workflow', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 2000,
        parameters: {
          sigma: 10.0,
          rho: 28.0,
          beta: 8.0 / 3.0,
        },
      }

      // Simulate
      const fullTrajectory = simulateLorenz(config, [1.0, 1.0, 1.0])
      expect(fullTrajectory.points.length).toBeGreaterThan(0)

      // Extract attractor
      const attractor_points = extractAttractorPoints(fullTrajectory, 0.3)
      expect(attractor_points.points.length).toBeLessThan(fullTrajectory.points.length)

      // Analyze
      const stats = computeTrajectoryStatistics(attractor_points)
      expect(stats.total_distance).toBeGreaterThan(0)

      const chaos = computeLyapunovExponents(attractor_points)
      expect(chaos.is_chaotic).toBe(true)
    })

    it('should compare Lorenz and Rössler attractors', () => {
      const config: SimulationConfig = {
        system_type: 'generic',
        time_step: 0.01,
        num_steps: 1000,
        parameters: {},
      }

      const lorenz = simulateLorenz(config, [1.0, 1.0, 1.0])
      const rossler = simulateRossler(config, [1.0, 1.0, 1.0])

      const lorenz_stats = computeTrajectoryStatistics(lorenz)
      const rossler_stats = computeTrajectoryStatistics(rossler)

      expect(lorenz_stats.total_distance).toBeGreaterThan(0)
      expect(rossler_stats.total_distance).toBeGreaterThan(0)
      // They should have different distances due to different dynamics
      expect(lorenz_stats.total_distance).not.toBeCloseTo(rossler_stats.total_distance, 0)
    })

    it('should handle large trajectory analysis', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.001,
        num_steps: 10000,
        parameters: {},
      }

      const trajectory = simulateLorenz(config, [1.0, 1.0, 1.0])
      expect(trajectory.points.length).toBe(10001)

      const stats = computeTrajectoryStatistics(trajectory)
      expect(stats.point_count).toBe(10001)

      const filtered = extractAttractorPoints(trajectory, 0.5)
      expect(filtered.points.length).toBeLessThan(trajectory.points.length)
    })
  })

  describe('Error handling', () => {
    it('should handle insufficient trajectory points for Lyapunov', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 5,
        parameters: {},
      }

      const trajectory = simulateLorenz(config, [1.0, 1.0, 1.0])
      expect(() => computeLyapunovExponents(trajectory)).toThrow()
    })

    it('should handle empty trajectory for statistics', () => {
      const emptyTrajectory: Trajectory = {
        id: 'empty',
        system_type: 'test',
        initial_point: { x: 0, y: 0, z: 0 },
        points: [],
        parameters: {},
        metadata: {},
      }

      expect(() => computeTrajectoryStatistics(emptyTrajectory)).toThrow()
    })

    it('should reject invalid skip ratios', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 100,
        parameters: {},
      }

      const trajectory = simulateLorenz(config, [1.0, 1.0, 1.0])

      expect(() => extractAttractorPoints(trajectory, -0.5)).toThrow()
      expect(() => extractAttractorPoints(trajectory, 1.5)).toThrow()
    })

    it('should handle invalid initial conditions gracefully', () => {
      const config: SimulationConfig = {
        system_type: 'lorenz',
        time_step: 0.01,
        num_steps: 100,
        parameters: {},
      }

      // Very large values
      const trajectory = simulateLorenz(config, [1000.0, 1000.0, 1000.0])
      expect(trajectory.points.length).toBeGreaterThan(0)
    })
  })

  describe('Module availability', () => {
    it('should have MidstreamerAttractor class', () => {
      expect(MidstreamerAttractor).toBeDefined()
    })

    it('should export all functions', () => {
      expect(typeof simulateLorenz).toBe('function')
      expect(typeof simulateRossler).toBe('function')
      expect(typeof computeLyapunovExponents).toBe('function')
      expect(typeof computeTrajectoryStatistics).toBe('function')
      expect(typeof extractAttractorPoints).toBe('function')
      expect(typeof computeRecurrenceTime).toBe('function')
    })
  })
})
