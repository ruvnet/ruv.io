// Midstreamer Attractor - Dynamical Systems Analysis
// TypeScript bindings for the napi-rs module

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Trajectory {
  id: string
  system_type: string
  initial_point: Point3D
  points: Point3D[]
  parameters: Record<string, any>
  metadata: Record<string, any>
}

export interface SimulationConfig {
  system_type: string
  time_step: number
  num_steps: number
  parameters: Record<string, any>
}

export interface LyapunovAnalysis {
  trajectory_id: string
  exponents: number[]
  max_exponent: number
  is_chaotic: boolean
  dimension: number
  timestamp: string
}

export interface TrajectoryStatistics {
  trajectory_id: string
  total_distance: number
  mean_distance: number
  std_dev: number
  min_distance: number
  max_distance: number
  point_count: number
  timestamp: string
}

export interface RecurrenceAnalysis {
  trajectory_id: string
  threshold: number
  recurrence_count: number
  mean_recurrence_time: number
  recurrence_times: number[]
  timestamp: string
}

/**
 * Native bindings from midstreamer_attractor Rust module
 */
let attractorModule: any

try {
  // Load the native module via platform loader
  attractorModule = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native midstreamer_attractor module not loaded. Build the project first.')
  attractorModule = null
}

/**
 * Simulate Lorenz attractor trajectory
 * @param config - Simulation configuration
 * @param initial - Initial point [x, y, z]
 * @returns Trajectory with simulated points
 */
export function simulateLorenz(config: SimulationConfig, initial: [number, number, number]): Trajectory {
  if (!attractorModule) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const initialJson = JSON.stringify(initial)
  const result = attractorModule.simulateLorenz(configJson, initialJson)

  return JSON.parse(result)
}

/**
 * Simulate Rössler attractor trajectory
 * @param config - Simulation configuration
 * @param initial - Initial point [x, y, z]
 * @returns Trajectory with simulated points
 */
export function simulateRossler(config: SimulationConfig, initial: [number, number, number]): Trajectory {
  if (!attractorModule) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const initialJson = JSON.stringify(initial)
  const result = attractorModule.simulateRossler(configJson, initialJson)

  return JSON.parse(result)
}

/**
 * Compute Lyapunov exponents for a trajectory
 * @param trajectory - Trajectory to analyze
 * @returns Lyapunov analysis results
 */
export function computeLyapunovExponents(trajectory: Trajectory): LyapunovAnalysis {
  if (!attractorModule) {
    throw new Error('Native module not available')
  }

  const trajectoryJson = JSON.stringify(trajectory)
  const result = attractorModule.computeLyapunovExponents(trajectoryJson)

  return JSON.parse(result)
}

/**
 * Compute trajectory statistics
 * @param trajectory - Trajectory to analyze
 * @returns Statistics including distances and metrics
 */
export function computeTrajectoryStatistics(trajectory: Trajectory): TrajectoryStatistics {
  if (!attractorModule) {
    throw new Error('Native module not available')
  }

  const trajectoryJson = JSON.stringify(trajectory)
  const result = attractorModule.computeTrajectoryStatistics(trajectoryJson)

  return JSON.parse(result)
}

/**
 * Extract attractor points after transient behavior
 * @param trajectory - Full trajectory including transients
 * @param skipRatio - Ratio of initial points to skip (0.0 to 1.0)
 * @returns Filtered trajectory with transient behavior removed
 */
export function extractAttractorPoints(trajectory: Trajectory, skipRatio: number = 0.3): Trajectory {
  if (!attractorModule) {
    throw new Error('Native module not available')
  }

  if (skipRatio < 0 || skipRatio > 1) {
    throw new Error('skipRatio must be between 0.0 and 1.0')
  }

  const trajectoryJson = JSON.stringify(trajectory)
  const result = attractorModule.extractAttractorPoints(trajectoryJson, skipRatio)

  return JSON.parse(result)
}

/**
 * Compute recurrence time statistics
 * @param trajectory - Trajectory to analyze
 * @param threshold - Distance threshold for recurrence detection
 * @returns Recurrence analysis results
 */
export function computeRecurrenceTime(trajectory: Trajectory, threshold: number): RecurrenceAnalysis {
  if (!attractorModule) {
    throw new Error('Native module not available')
  }

  const trajectoryJson = JSON.stringify(trajectory)
  const result = attractorModule.computeRecurrenceTime(trajectoryJson, threshold)

  return JSON.parse(result)
}

/**
 * Main class for attractor analysis
 */
export class MidstreamerAttractor {
  /**
   * Create a new MidstreamerAttractor instance
   */
  constructor() {
    if (!attractorModule) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Simulate Lorenz attractor
   */
  simulateLorenz(
    config: SimulationConfig,
    initial: [number, number, number]
  ): Trajectory {
    return simulateLorenz(config, initial)
  }

  /**
   * Simulate Rössler attractor
   */
  simulateRossler(
    config: SimulationConfig,
    initial: [number, number, number]
  ): Trajectory {
    return simulateRossler(config, initial)
  }

  /**
   * Analyze trajectory for chaotic behavior
   */
  analyzeChaos(trajectory: Trajectory): LyapunovAnalysis {
    return computeLyapunovExponents(trajectory)
  }

  /**
   * Get trajectory statistics
   */
  getStatistics(trajectory: Trajectory): TrajectoryStatistics {
    return computeTrajectoryStatistics(trajectory)
  }

  /**
   * Extract steady-state attractor
   */
  extractAttractor(trajectory: Trajectory, skipRatio?: number): Trajectory {
    return extractAttractorPoints(trajectory, skipRatio)
  }

  /**
   * Analyze recurrence patterns
   */
  analyzeRecurrence(trajectory: Trajectory, threshold: number): RecurrenceAnalysis {
    return computeRecurrenceTime(trajectory, threshold)
  }
}

// Export all types and functions
export default {
  simulateLorenz,
  simulateRossler,
  computeLyapunovExponents,
  computeTrajectoryStatistics,
  extractAttractorPoints,
  computeRecurrenceTime,
  MidstreamerAttractor,
}
