import { describe, it, expect, beforeAll } from 'vitest'
import {
  VeritasNexus,
  analyzeText,
  analyzeAudio,
  analyzePhysiological,
  detectDeception,
  compareAnalyses,
  TextAnalysisInput,
  AudioAnalysisInput,
  PhysiologicalAnalysisInput,
  MultiModalAnalysisInput,
  DeceptionDetectionResult,
} from '../src/index'

describe('Veritas Nexus - Lie Detection System', () => {
  describe('analyzeText', () => {
    it('should analyze text for deceptive indicators', () => {
      const input: TextAnalysisInput = {
        text: 'I was definitely not at the location. Maybe I was somewhere else.',
      }

      const result = analyzeText(input)

      expect(result).toBeDefined()
      expect(result.modality).toBe('text')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.indicators).toBeDefined()
      expect(Array.isArray(result.indicators)).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
      expect(result.text_length).toBe(input.text.length)
      expect(result.word_count).toBeGreaterThan(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should detect hedging language', () => {
      const input: TextAnalysisInput = {
        text: 'I think maybe I sort of was there, probably.',
      }

      const result = analyzeText(input)

      expect(result.indicators).toBeDefined()
      expect(result.indicators.length).toBeGreaterThan(0)
      // Should contain hedging language indicators
      const hasHedging = result.indicators.some((ind) => ind.includes('Hedging'))
      expect(hasHedging).toBe(true)
    })

    it('should detect filler words', () => {
      const input: TextAnalysisInput = {
        text: 'Um, like, I was there, you know, basically doing things.',
      }

      const result = analyzeText(input)

      expect(result.indicators.length).toBeGreaterThan(0)
      const hasFillers = result.indicators.some((ind) => ind.includes('Filler'))
      expect(hasFillers).toBe(true)
    })

    it('should detect strong negations', () => {
      const input: TextAnalysisInput = {
        text: 'I absolutely never did that. Definitely not.',
      }

      const result = analyzeText(input)

      expect(result.indicators.length).toBeGreaterThan(0)
      const hasNegation = result.indicators.some((ind) => ind.includes('Strong negation'))
      expect(hasNegation).toBe(true)
    })

    it('should handle short text', () => {
      const input: TextAnalysisInput = {
        text: 'No.',
      }

      const result = analyzeText(input)

      expect(result).toBeDefined()
      expect(result.modality).toBe('text')
    })

    it('should analyze long text', () => {
      const longText = 'I was not there. ' + 'Word '.repeat(1000)
      const input: TextAnalysisInput = {
        text: longText,
      }

      const result = analyzeText(input)

      expect(result).toBeDefined()
      expect(result.text_length).toBeGreaterThan(1000)
      expect(result.word_count).toBeGreaterThan(100)
    })

    it('should handle text with special characters', () => {
      const input: TextAnalysisInput = {
        text: "I didn't do it! @#$% (Really!)",
      }

      const result = analyzeText(input)

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })
  })

  describe('analyzeAudio', () => {
    it('should analyze audio features for deceptive indicators', () => {
      const input: AudioAnalysisInput = {
        features: {
          pitch_variance: 2.8,
          speech_rate: 160,
          energy: 0.85,
          pause_frequency: 3.5,
          jitter: 0.07,
        },
      }

      const result = analyzeAudio(input)

      expect(result).toBeDefined()
      expect(result.modality).toBe('audio')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.indicators).toBeDefined()
      expect(Array.isArray(result.indicators)).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
      expect(result.timestamp).toBeDefined()
    })

    it('should detect elevated pitch variance', () => {
      const input: AudioAnalysisInput = {
        features: {
          pitch_variance: 3.0,
        },
      }

      const result = analyzeAudio(input)

      expect(result.indicators.length).toBeGreaterThan(0)
      const hasIndicator = result.indicators.some((ind) =>
        ind.includes('pitch variance')
      )
      expect(hasIndicator).toBe(true)
    })

    it('should detect accelerated speech rate', () => {
      const input: AudioAnalysisInput = {
        features: {
          speech_rate: 180,
        },
      }

      const result = analyzeAudio(input)

      expect(result.indicators.some((ind) => ind.includes('speech rate'))).toBe(true)
    })

    it('should detect voice instability', () => {
      const input: AudioAnalysisInput = {
        features: {
          jitter: 0.08,
        },
      }

      const result = analyzeAudio(input)

      expect(result.indicators.some((ind) => ind.includes('instability'))).toBe(true)
    })

    it('should handle normal audio features', () => {
      const input: AudioAnalysisInput = {
        features: {
          pitch_variance: 1.2,
          speech_rate: 120,
          energy: 0.5,
          pause_frequency: 1.0,
          jitter: 0.02,
        },
      }

      const result = analyzeAudio(input)

      expect(result).toBeDefined()
      // Normal features should have lower deception score
      expect(result.score).toBeLessThan(0.5)
    })

    it('should handle empty features object', () => {
      const input: AudioAnalysisInput = {
        features: {},
      }

      const result = analyzeAudio(input)

      expect(result).toBeDefined()
      expect(result.modality).toBe('audio')
    })
  })

  describe('analyzePhysiological', () => {
    it('should analyze physiological data for deceptive indicators', () => {
      const input: PhysiologicalAnalysisInput = {
        data: {
          heart_rate: 110,
          gsr: 0.65,
          pupil_dilation: 0.8,
          respiration_rate: 22,
          blood_pressure_systolic: 145,
          eye_movement_velocity: 550,
        },
      }

      const result = analyzePhysiological(input)

      expect(result).toBeDefined()
      expect(result.modality).toBe('physiological')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.indicators).toBeDefined()
      expect(Array.isArray(result.indicators)).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
      expect(result.timestamp).toBeDefined()
    })

    it('should detect elevated heart rate', () => {
      const input: PhysiologicalAnalysisInput = {
        data: {
          heart_rate: 115,
        },
      }

      const result = analyzePhysiological(input)

      expect(result.indicators.some((ind) => ind.includes('heart rate'))).toBe(true)
    })

    it('should detect high galvanic skin response', () => {
      const input: PhysiologicalAnalysisInput = {
        data: {
          gsr: 0.7,
        },
      }

      const result = analyzePhysiological(input)

      expect(result.indicators.some((ind) => ind.includes('galvanic'))).toBe(true)
    })

    it('should detect pupil dilation', () => {
      const input: PhysiologicalAnalysisInput = {
        data: {
          pupil_dilation: 0.9,
        },
      }

      const result = analyzePhysiological(input)

      expect(result.indicators.some((ind) => ind.includes('pupil'))).toBe(true)
    })

    it('should detect elevated respiration', () => {
      const input: PhysiologicalAnalysisInput = {
        data: {
          respiration_rate: 25,
        },
      }

      const result = analyzePhysiological(input)

      expect(result.indicators.some((ind) => ind.includes('respiration'))).toBe(true)
    })

    it('should handle normal physiological data', () => {
      const input: PhysiologicalAnalysisInput = {
        data: {
          heart_rate: 70,
          gsr: 0.2,
          pupil_dilation: 0.3,
          respiration_rate: 16,
          blood_pressure_systolic: 120,
          eye_movement_velocity: 300,
        },
      }

      const result = analyzePhysiological(input)

      expect(result).toBeDefined()
      // Normal data should have lower deception score
      expect(result.score).toBeLessThan(0.5)
    })
  })

  describe('detectDeception', () => {
    let veritasNexus: VeritasNexus

    beforeAll(() => {
      veritasNexus = new VeritasNexus()
    })

    it('should perform comprehensive multi-modal analysis', () => {
      const input: MultiModalAnalysisInput = {
        text: 'I was definitely not there. Maybe I was somewhere else.',
        audio_features: {
          pitch_variance: 2.8,
          speech_rate: 160,
          energy: 0.85,
        },
        physiological_data: {
          heart_rate: 110,
          gsr: 0.65,
          pupil_dilation: 0.8,
        },
        metadata: { case_id: 'test-001' },
      }

      const result = detectDeception(input)

      expect(result).toBeDefined()
      expect(result.overall_deception_score).toBeGreaterThanOrEqual(0)
      expect(result.overall_deception_score).toBeLessThanOrEqual(1)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.modalities).toBeDefined()
      expect(Array.isArray(result.modalities)).toBe(true)
      expect(result.modalities.length).toBe(3)
      expect(result.reasoning).toBeDefined()
      expect(result.recommendations).toBeDefined()
      expect(Array.isArray(result.recommendations)).toBe(true)
      expect(result.timestamp).toBeDefined()
    })

    it('should analyze only available modalities', () => {
      const input: MultiModalAnalysisInput = {
        text: 'I was there that night.',
      }

      const result = detectDeception(input)

      expect(result).toBeDefined()
      expect(result.modalities.length).toBe(1)
      expect(result.modalities[0].modality).toBe('text')
    })

    it('should generate reasoning and recommendations', () => {
      const input: MultiModalAnalysisInput = {
        text: 'I did not do it!',
        audio_features: {
          speech_rate: 180,
          jitter: 0.08,
        },
        physiological_data: {
          heart_rate: 130,
        },
      }

      const result = detectDeception(input)

      expect(result.reasoning).toBeDefined()
      expect(result.reasoning.includes('Thought')).toBe(true)
      expect(result.reasoning.includes('Action')).toBe(true)
      expect(result.reasoning.includes('Observation')).toBe(true)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should provide high-risk recommendations for high deception scores', () => {
      const input: MultiModalAnalysisInput = {
        text: 'Maybe I sort of think I kind of probably was not there.',
        audio_features: {
          pitch_variance: 3.5,
          speech_rate: 200,
          energy: 0.95,
          pause_frequency: 5.0,
          jitter: 0.1,
        },
        physiological_data: {
          heart_rate: 140,
          gsr: 0.9,
          pupil_dilation: 0.95,
          respiration_rate: 28,
          blood_pressure_systolic: 160,
          eye_movement_velocity: 700,
        },
      }

      const result = detectDeception(input)

      expect(result.overall_deception_score).toBeGreaterThan(0.4)
      const hasWarning = result.recommendations.some((rec) =>
        rec.includes('investigation') || rec.includes('high')
      )
      expect(hasWarning).toBe(true)
    })

    it('should handle truthful indicators', () => {
      const input: MultiModalAnalysisInput = {
        text: 'I was at home that evening.',
        audio_features: {
          pitch_variance: 1.2,
          speech_rate: 120,
          energy: 0.5,
          pause_frequency: 1.0,
          jitter: 0.02,
        },
        physiological_data: {
          heart_rate: 72,
          gsr: 0.2,
          pupil_dilation: 0.4,
          respiration_rate: 16,
          blood_pressure_systolic: 118,
          eye_movement_velocity: 300,
        },
      }

      const result = detectDeception(input)

      expect(result.overall_deception_score).toBeLessThan(0.5)
    })

    it('should use class instance methods', () => {
      const input: MultiModalAnalysisInput = {
        text: 'I was not there.',
      }

      const result = veritasNexus.detectDeception(input)

      expect(result).toBeDefined()
      expect(result.overall_deception_score).toBeDefined()
    })

    it('should handle mixed high and low indicators', () => {
      const input: MultiModalAnalysisInput = {
        text: 'I was definitely there.',
        audio_features: {
          speech_rate: 200, // High
          pitch_variance: 1.2, // Normal
        },
        physiological_data: {
          heart_rate: 75, // Normal
          gsr: 0.8, // High
        },
      }

      const result = detectDeception(input)

      expect(result).toBeDefined()
      expect(result.overall_deception_score).toBeGreaterThanOrEqual(0)
      expect(result.overall_deception_score).toBeLessThanOrEqual(1)
    })
  })

  describe('compareAnalyses', () => {
    it('should compare two detection analyses for consistency', () => {
      const input1: MultiModalAnalysisInput = {
        text: 'I was not there.',
      }

      const input2: MultiModalAnalysisInput = {
        text: 'I was definitely not there.',
      }

      const result1 = detectDeception(input1)
      const result2 = detectDeception(input2)
      const consistency = compareAnalyses(result1, result2)

      expect(typeof consistency).toBe('number')
      expect(consistency).toBeGreaterThanOrEqual(0)
      expect(consistency).toBeLessThanOrEqual(1)
    })

    it('should return high consistency for identical analyses', () => {
      const input: MultiModalAnalysisInput = {
        text: 'I was there.',
      }

      const result1 = detectDeception(input)
      const result2 = detectDeception(input)
      const consistency = compareAnalyses(result1, result2)

      expect(consistency).toBe(1.0)
    })

    it('should return different consistency for analyses with different scores', () => {
      const input1: MultiModalAnalysisInput = {
        text: 'I was definitely there and very calm about it.',
        audio_features: { speech_rate: 100, pitch_variance: 0.5 },
        physiological_data: {
          heart_rate: 60,
          gsr: 0.1,
        },
      }

      const input2: MultiModalAnalysisInput = {
        text: 'I was not there! Maybe I was somewhere else!',
        audio_features: { speech_rate: 200, pitch_variance: 4.0 },
        physiological_data: {
          heart_rate: 150,
          gsr: 0.9,
        },
      }

      const result1 = detectDeception(input1)
      const result2 = detectDeception(input2)
      const consistency = compareAnalyses(result1, result2)

      // Consistency should be between 0 and 1, reflecting differences between analyses
      expect(consistency).toBeGreaterThanOrEqual(0)
      expect(consistency).toBeLessThanOrEqual(1)
      // Divergent analyses should have lower consistency than identical ones
      expect(consistency).toBeLessThan(1.0)
    })

    it('should use class instance method', () => {
      const veritasNexus = new VeritasNexus()

      const input1: MultiModalAnalysisInput = {
        text: 'Test analysis 1',
      }

      const input2: MultiModalAnalysisInput = {
        text: 'Test analysis 2',
      }

      const result1 = detectDeception(input1)
      const result2 = detectDeception(input2)
      const consistency = veritasNexus.compareAnalyses(result1, result2)

      expect(typeof consistency).toBe('number')
      expect(consistency).toBeGreaterThanOrEqual(0)
    })
  })

  describe('VeritasNexus class', () => {
    let nexus: VeritasNexus

    beforeAll(() => {
      nexus = new VeritasNexus()
    })

    it('should create instance', () => {
      expect(nexus).toBeDefined()
      expect(nexus).toBeInstanceOf(VeritasNexus)
    })

    it('should perform text analysis via instance method', () => {
      const input: TextAnalysisInput = {
        text: 'I did not do it.',
      }

      const result = nexus.analyzeText(input)

      expect(result).toBeDefined()
      expect(result.modality).toBe('text')
    })

    it('should perform audio analysis via instance method', () => {
      const input: AudioAnalysisInput = {
        features: {
          speech_rate: 160,
        },
      }

      const result = nexus.analyzeAudio(input)

      expect(result).toBeDefined()
      expect(result.modality).toBe('audio')
    })

    it('should perform physiological analysis via instance method', () => {
      const input: PhysiologicalAnalysisInput = {
        data: {
          heart_rate: 110,
        },
      }

      const result = nexus.analyzePhysiological(input)

      expect(result).toBeDefined()
      expect(result.modality).toBe('physiological')
    })
  })

  describe('Integration tests', () => {
    it('should perform complete lie detection workflow', () => {
      // Text analysis
      const textResult = analyzeText({
        text: 'I was not at the location that night.',
      })

      expect(textResult).toBeDefined()

      // Audio analysis
      const audioResult = analyzeAudio({
        features: {
          pitch_variance: 2.5,
          speech_rate: 150,
        },
      })

      expect(audioResult).toBeDefined()

      // Physiological analysis
      const physioResult = analyzePhysiological({
        data: {
          heart_rate: 105,
          gsr: 0.6,
        },
      })

      expect(physioResult).toBeDefined()

      // Comprehensive detection
      const fullAnalysis = detectDeception({
        text: 'I was not at the location that night.',
        audio_features: {
          pitch_variance: 2.5,
          speech_rate: 150,
        },
        physiological_data: {
          heart_rate: 105,
          gsr: 0.6,
        },
      })

      expect(fullAnalysis.modalities.length).toBe(3)
      expect(fullAnalysis.overall_deception_score).toBeGreaterThan(0)
    })

    it('should handle sequential analyses', () => {
      const input1 = {
        text: 'I was there.',
        audio_features: { speech_rate: 120 },
      }

      const input2 = {
        text: 'I was definitely there.',
        audio_features: { speech_rate: 125 },
      }

      const result1 = detectDeception(input1)
      const result2 = detectDeception(input2)

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()

      const consistency = compareAnalyses(result1, result2)
      expect(consistency).toBeGreaterThan(0.5)
    })

    it('should maintain data integrity through multi-modal analysis', () => {
      const metadata = { case_id: 'test-case-001', investigator: 'agent' }
      const input: MultiModalAnalysisInput = {
        text: 'Test statement',
        metadata,
      }

      const result = detectDeception(input)

      expect(result.timestamp).toBeDefined()
      expect(result.modalities.length).toBeGreaterThan(0)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid audio features gracefully', () => {
      expect(() => {
        analyzeAudio({ features: {} })
      }).not.toThrow()
    })

    it('should handle empty text analysis', () => {
      const result = analyzeText({
        text: '',
      })

      expect(result).toBeDefined()
      expect(result.text_length).toBe(0)
    })

    it('should handle large-scale analysis', () => {
      const largeText = 'Word '.repeat(10000)
      const result = analyzeText({
        text: largeText,
      })

      expect(result).toBeDefined()
      expect(result.word_count).toBeGreaterThan(5000)
    })

    it('should handle missing optional fields', () => {
      const input: MultiModalAnalysisInput = {
        text: 'Just text analysis',
      }

      const result = detectDeception(input)

      expect(result).toBeDefined()
      expect(result.modalities.length).toBe(1)
    })
  })

  describe('Boundary conditions', () => {
    it('should handle minimum deception score', () => {
      const input: MultiModalAnalysisInput = {
        text: 'Short.',
        audio_features: {
          speech_rate: 100,
          pitch_variance: 1.0,
        },
        physiological_data: {
          heart_rate: 60,
          gsr: 0.1,
        },
      }

      const result = detectDeception(input)

      expect(result.overall_deception_score).toBeGreaterThanOrEqual(0)
    })

    it('should handle maximum deception score', () => {
      const input: MultiModalAnalysisInput = {
        text: 'Um like you know maybe I sort of kind of probably was not there definitely',
        audio_features: {
          pitch_variance: 5.0,
          speech_rate: 250,
          energy: 1.0,
          pause_frequency: 10.0,
          jitter: 0.2,
        },
        physiological_data: {
          heart_rate: 180,
          gsr: 1.0,
          pupil_dilation: 1.0,
          respiration_rate: 40,
          blood_pressure_systolic: 200,
          eye_movement_velocity: 1000,
        },
      }

      const result = detectDeception(input)

      expect(result.overall_deception_score).toBeLessThanOrEqual(1.0)
    })
  })
})
