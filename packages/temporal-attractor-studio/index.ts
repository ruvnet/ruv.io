// Temporal Attractor Studio - TypeScript bindings for the napi-rs module

export interface TrajectoryPoint {
  x: number
  y: number
  z?: number | null
  time: number
}

export interface FTLEConfig {
  integration_time?: number
  delta?: number
  max_iterations?: number
}

export interface FTLEResult {
  ftle_value: number
  point: TrajectoryPoint
  convergence_time: number
  stability: number
}

export interface AttractorAnalysis {
  center: {
    x: number
    y: number
    z: number
  }
  radius: number
  dimension: number
  strength: number
  stability_index: number
}

export interface TemporalDynamicsResult {
  lyapunov_exponent: number
  entropy: number
  dimension: number
  period?: number | null
  chaos_indicator: number
}

export interface PredictedPoint {
  x: number
  y: number
  z: number | null
  time: number
  confidence: number
}

export interface NearestNeighbor {
  index: number
  distance: number
  point: TrajectoryPoint
}

/**
 * Native bindings from temporal_attractor_studio Rust module
 */
let temporalStudio: any

try {
  // Load the native module via auto-generated loader
  temporalStudio = require('./index.napi.js')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native temporal_attractor_studio module not loaded. Build the project first.')
  temporalStudio = null
}

/**
 * Calculate Finite-Time Lyapunov Exponent (FTLE) for a point
 * @param point - Trajectory point
 * @param config - FTLE calculation configuration
 * @returns FTLE result with stability metrics
 */
export function calculateFTLE(point: TrajectoryPoint, config?: FTLEConfig): FTLEResult {
  if (!temporalStudio) {
    throw new Error('Native module not available')
  }

  const pointJson = JSON.stringify(point)
  const configJson = JSON.stringify(config || {})
  const result = temporalStudio.calculateFtle(pointJson, configJson)

  return JSON.parse(result)
}

/**
 * Analyze attractor dynamics for a trajectory
 * @param trajectory - Array of trajectory points
 * @param config - Analysis configuration
 * @returns Attractor analysis including center, radius, and dimension
 */
export function analyzeAttractor(trajectory: TrajectoryPoint[], config?: any): AttractorAnalysis {
  if (!temporalStudio) {
    throw new Error('Native module not available')
  }

  const trajectoryJson = JSON.stringify(trajectory)
  const configJson = JSON.stringify(config || {})
  const result = temporalStudio.analyzeAttractor(trajectoryJson, configJson)

  return JSON.parse(result)
}

/**
 * Analyze temporal dynamics of a trajectory
 * @param trajectory - Array of trajectory points
 * @returns Temporal dynamics analysis including Lyapunov exponent and entropy
 */
export function analyzeTemporalDynamics(trajectory: TrajectoryPoint[]): TemporalDynamicsResult {
  if (!temporalStudio) {
    throw new Error('Native module not available')
  }

  const trajectoryJson = JSON.stringify(trajectory)
  const result = temporalStudio.analyzeTemporalDynamics(trajectoryJson)

  return JSON.parse(result)
}

/**
 * Predict future trajectory points based on attractor dynamics
 * @param trajectory - Array of past trajectory points
 * @param steps - Number of steps to predict
 * @returns Array of predicted trajectory points with confidence scores
 */
export function predictTrajectory(trajectory: TrajectoryPoint[], steps: number): PredictedPoint[] {
  if (!temporalStudio) {
    throw new Error('Native module not available')
  }

  const trajectoryJson = JSON.stringify(trajectory)
  const result = temporalStudio.predictTrajectory(trajectoryJson, Math.floor(steps))

  return JSON.parse(result)
}

/**
 * Find k nearest neighbors using VP-tree optimization
 * @param points - Array of trajectory points to search
 * @param queryPoint - Query point for nearest neighbor search
 * @param k - Number of nearest neighbors to find
 * @returns Array of k nearest neighbors with distances
 */
export function findNearestNeighbors(
  points: TrajectoryPoint[],
  queryPoint: TrajectoryPoint,
  k: number,
): NearestNeighbor[] {
  if (!temporalStudio) {
    throw new Error('Native module not available')
  }

  const pointsJson = JSON.stringify(points)
  const queryPointJson = JSON.stringify(queryPoint)
  const result = temporalStudio.findNearestNeighbors(pointsJson, queryPointJson, Math.floor(k))

  return JSON.parse(result)
}

/**
 * Create a new TemporalAttractorStudio instance for advanced use cases
 */
export class TemporalAttractorStudio {
  private initialized: boolean

  /**
   * Create a new TemporalAttractorStudio instance
   */
  constructor() {
    if (!temporalStudio) {
      throw new Error('Native module not available')
    }
    this.initialized = true
  }

  /**
   * Calculate FTLE for a single point
   */
  calculateFTLE(point: TrajectoryPoint, config?: FTLEConfig): FTLEResult {
    return calculateFTLE(point, config)
  }

  /**
   * Analyze attractor dynamics
   */
  analyzeAttractor(trajectory: TrajectoryPoint[], config?: any): AttractorAnalysis {
    return analyzeAttractor(trajectory, config)
  }

  /**
   * Analyze temporal dynamics
   */
  analyzeTemporalDynamics(trajectory: TrajectoryPoint[]): TemporalDynamicsResult {
    return analyzeTemporalDynamics(trajectory)
  }

  /**
   * Predict future trajectory
   */
  predictTrajectory(trajectory: TrajectoryPoint[], steps: number): PredictedPoint[] {
    return predictTrajectory(trajectory, steps)
  }

  /**
   * Find nearest neighbors
   */
  findNearestNeighbors(
    points: TrajectoryPoint[],
    queryPoint: TrajectoryPoint,
    k: number,
  ): NearestNeighbor[] {
    return findNearestNeighbors(points, queryPoint, k)
  }

  /**
   * Check if the instance is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized && temporalStudio !== null
  }
}

// Export all types and functions
export default {
  calculateFTLE,
  analyzeAttractor,
  analyzeTemporalDynamics,
  predictTrajectory,
  findNearestNeighbors,
  TemporalAttractorStudio,
}
