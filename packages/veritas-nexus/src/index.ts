// Veritas Nexus - Advanced Multi-Modal Lie Detection System
// TypeScript bindings for the napi-rs module

export interface AudioFeatures {
  pitch_variance?: number
  speech_rate?: number
  energy?: number
  pause_frequency?: number
  jitter?: number
}

export interface PhysiologicalData {
  heart_rate?: number
  gsr?: number
  pupil_dilation?: number
  respiration_rate?: number
  blood_pressure_systolic?: number
  eye_movement_velocity?: number
}

export interface TextAnalysisInput {
  text: string
}

export interface AudioAnalysisInput {
  features: AudioFeatures
}

export interface PhysiologicalAnalysisInput {
  data: PhysiologicalData
}

export interface MultiModalAnalysisInput {
  text?: string
  audio_features?: AudioFeatures
  physiological_data?: PhysiologicalData
  metadata?: Record<string, any>
}

export interface TextAnalysisResult {
  modality: string
  confidence: number
  indicators: string[]
  score: number
  text_length: number
  word_count: number
  timestamp: string
}

export interface AudioAnalysisResult {
  modality: string
  confidence: number
  indicators: string[]
  score: number
  features_analyzed: number
  timestamp: string
}

export interface PhysiologicalAnalysisResult {
  modality: string
  confidence: number
  indicators: string[]
  score: number
  parameters_analyzed: number
  timestamp: string
}

export interface ModalityResult {
  modality: string
  confidence: number
  indicators: string[]
  score: number
}

export interface DeceptionDetectionResult {
  overall_deception_score: number
  confidence: number
  modalities: ModalityResult[]
  reasoning: string
  recommendations: string[]
  timestamp: string
}

/**
 * Native bindings from veritas_nexus Rust module
 */
let veritasNexus: any

try {
  // Load the native module via platform loader
  veritasNexus = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native veritas_nexus module not loaded. Build the project first.')
  veritasNexus = null
}

/**
 * Analyze text for deceptive indicators
 * @param input - Text analysis input
 * @returns Text analysis result
 */
export function analyzeText(input: TextAnalysisInput): TextAnalysisResult {
  if (!veritasNexus) {
    throw new Error('Native module not available')
  }

  const inputJson = JSON.stringify(input)
  const result = veritasNexus.analyzeText(inputJson)

  return JSON.parse(result)
}

/**
 * Analyze audio features for deceptive indicators
 * @param input - Audio analysis input
 * @returns Audio analysis result
 */
export function analyzeAudio(input: AudioAnalysisInput): AudioAnalysisResult {
  if (!veritasNexus) {
    throw new Error('Native module not available')
  }

  const inputJson = JSON.stringify(input)
  const result = veritasNexus.analyzeAudio(inputJson)

  return JSON.parse(result)
}

/**
 * Analyze physiological data for deceptive indicators
 * @param input - Physiological analysis input
 * @returns Physiological analysis result
 */
export function analyzePhysiological(input: PhysiologicalAnalysisInput): PhysiologicalAnalysisResult {
  if (!veritasNexus) {
    throw new Error('Native module not available')
  }

  const inputJson = JSON.stringify(input)
  const result = veritasNexus.analyzePhysiological(inputJson)

  return JSON.parse(result)
}

/**
 * Perform comprehensive multi-modal lie detection analysis
 * @param input - Multi-modal analysis input
 * @returns Comprehensive deception detection result
 */
export function detectDeception(input: MultiModalAnalysisInput): DeceptionDetectionResult {
  if (!veritasNexus) {
    throw new Error('Native module not available')
  }

  const inputJson = JSON.stringify(input)
  const result = veritasNexus.detectDeception(inputJson)

  return JSON.parse(result)
}

/**
 * Compare two analyses for consistency
 * @param analysis1 - First deception detection result
 * @param analysis2 - Second deception detection result
 * @returns Consistency score (0.0 to 1.0)
 */
export function compareAnalyses(
  analysis1: DeceptionDetectionResult,
  analysis2: DeceptionDetectionResult
): number {
  if (!veritasNexus) {
    throw new Error('Native module not available')
  }

  const analysis1Json = JSON.stringify(analysis1)
  const analysis2Json = JSON.stringify(analysis2)

  return veritasNexus.compareAnalyses(analysis1Json, analysis2Json)
}

/**
 * Create a new VeritasNexus instance for advanced use cases
 */
export class VeritasNexus {
  /**
   * Create a new VeritasNexus instance
   */
  constructor() {
    if (!veritasNexus) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Analyze text
   */
  analyzeText(input: TextAnalysisInput): TextAnalysisResult {
    return analyzeText(input)
  }

  /**
   * Analyze audio
   */
  analyzeAudio(input: AudioAnalysisInput): AudioAnalysisResult {
    return analyzeAudio(input)
  }

  /**
   * Analyze physiological data
   */
  analyzePhysiological(input: PhysiologicalAnalysisInput): PhysiologicalAnalysisResult {
    return analyzePhysiological(input)
  }

  /**
   * Detect deception across multiple modalities
   */
  detectDeception(input: MultiModalAnalysisInput): DeceptionDetectionResult {
    return detectDeception(input)
  }

  /**
   * Compare two detection analyses
   */
  compareAnalyses(
    analysis1: DeceptionDetectionResult,
    analysis2: DeceptionDetectionResult
  ): number {
    return compareAnalyses(analysis1, analysis2)
  }
}

// Export all types and functions
export default {
  analyzeText,
  analyzeAudio,
  analyzePhysiological,
  detectDeception,
  compareAnalyses,
  VeritasNexus,
}
