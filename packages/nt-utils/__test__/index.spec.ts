import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateUrl,
  validateNumberRange,
  validateStringLength,
  formatNumber,
  formatCurrency,
  formatBytes,
  parseBoolean,
  hexToDecimal,
  decimalToHex,
  reverseString,
  countCharacter,
  capitalizeString,
  removeWhitespace,
  getCurrentTimestamp,
  timestampToIsoString,
  timeDifference,
  calculatePercentage,
  calculatePercentageIncrease,
  roundNumber,
  clampNumber,
  calculateAverage,
  NTUtils,
  ValidationResult,
} from '../src/index'

describe('NT Utils - Data Validation', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const result = validateEmail('test@example.com')
      expect(result.is_valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject email without @ symbol', () => {
      const result = validateEmail('testexample.com')
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject email without domain dot', () => {
      const result = validateEmail('test@example')
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject empty local part', () => {
      const result = validateEmail('@example.com')
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateUrl', () => {
    it('should validate HTTP URLs', () => {
      const result = validateUrl('http://example.com')
      expect(result.is_valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate HTTPS URLs', () => {
      const result = validateUrl('https://example.com')
      expect(result.is_valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject URLs without protocol', () => {
      const result = validateUrl('example.com')
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject short URLs', () => {
      const result = validateUrl('http://')
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateNumberRange', () => {
    it('should validate number within range', () => {
      const result = validateNumberRange(50, 0, 100)
      expect(result.is_valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject number below minimum', () => {
      const result = validateNumberRange(-10, 0, 100)
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject number above maximum', () => {
      const result = validateNumberRange(150, 0, 100)
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should accept boundary values', () => {
      const resultMin = validateNumberRange(0, 0, 100)
      const resultMax = validateNumberRange(100, 0, 100)
      expect(resultMin.is_valid).toBe(true)
      expect(resultMax.is_valid).toBe(true)
    })
  })

  describe('validateStringLength', () => {
    it('should validate string within length constraints', () => {
      const result = validateStringLength('hello', 3, 10)
      expect(result.is_valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject string too short', () => {
      const result = validateStringLength('hi', 3, 10)
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject string too long', () => {
      const result = validateStringLength('this is a very long string', 3, 10)
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should accept boundary lengths', () => {
      const resultMin = validateStringLength('abc', 3, 10)
      const resultMax = validateStringLength('abcdefghij', 3, 10)
      expect(resultMin.is_valid).toBe(true)
      expect(resultMax.is_valid).toBe(true)
    })
  })
})

describe('NT Utils - Formatting Utilities', () => {
  describe('formatNumber', () => {
    it('should format number with correct decimal places', () => {
      const result = formatNumber(3.14159, 2)
      expect(result).toBe('3.14')
    })

    it('should pad with zeros for decimal places', () => {
      const result = formatNumber(3.1, 3)
      expect(result).toContain('3.1')
    })

    it('should handle zero decimal places', () => {
      const result = formatNumber(3.9, 0)
      expect(result).toBe('4')
    })

    it('should handle large numbers', () => {
      const result = formatNumber(1234567.89, 2)
      expect(result.includes('1234567')).toBe(true)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with default options', () => {
      const result = formatCurrency(100.5)
      expect(result).toContain('$')
      expect(result).toContain('100')
    })

    it('should format currency with custom symbol', () => {
      const result = formatCurrency(100, { currency_symbol: '€' })
      expect(result).toContain('€')
    })

    it('should handle negative currency', () => {
      const result = formatCurrency(-50, { currency_symbol: '$' })
      expect(result).toContain('-')
      expect(result).toContain('$')
    })

    it('should format currency without thousand separator', () => {
      const result = formatCurrency(1000, { thousand_separator: false })
      expect(result).toBeDefined()
    })
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      const result = formatBytes(1024)
      expect(result).toContain('KB')
    })

    it('should format small byte values', () => {
      const result = formatBytes(512)
      expect(result).toContain('B')
    })

    it('should format megabytes', () => {
      const result = formatBytes(1048576)
      expect(result).toContain('MB')
    })

    it('should format gigabytes', () => {
      const result = formatBytes(1073741824)
      expect(result).toContain('GB')
    })

    it('should handle zero bytes', () => {
      const result = formatBytes(0)
      expect(result).toContain('0')
    })
  })
})

describe('NT Utils - Conversions', () => {
  describe('parseBoolean', () => {
    it('should parse true values', () => {
      expect(parseBoolean('true')).toBe(true)
      expect(parseBoolean('1')).toBe(true)
      expect(parseBoolean('yes')).toBe(true)
      expect(parseBoolean('on')).toBe(true)
    })

    it('should parse false values', () => {
      expect(parseBoolean('false')).toBe(false)
      expect(parseBoolean('0')).toBe(false)
      expect(parseBoolean('no')).toBe(false)
      expect(parseBoolean('off')).toBe(false)
    })

    it('should handle case insensitivity', () => {
      expect(parseBoolean('TRUE')).toBe(true)
      expect(parseBoolean('FALSE')).toBe(false)
    })
  })

  describe('hexToDecimal', () => {
    it('should convert hex to decimal', () => {
      expect(hexToDecimal('0xFF')).toBe(255)
      expect(hexToDecimal('0x10')).toBe(16)
    })

    it('should handle hex without prefix', () => {
      expect(hexToDecimal('FF')).toBe(255)
      expect(hexToDecimal('10')).toBe(16)
    })

    it('should handle lowercase hex', () => {
      expect(hexToDecimal('0xff')).toBe(255)
    })
  })

  describe('decimalToHex', () => {
    it('should convert decimal to hex with prefix', () => {
      const result = decimalToHex(255, true)
      expect(result.startsWith('0x')).toBe(true)
      expect(result).toContain('ff')
    })

    it('should convert decimal to hex without prefix', () => {
      const result = decimalToHex(255, false)
      expect(result.startsWith('0x')).toBe(false)
    })

    it('should handle default prefix parameter', () => {
      const result = decimalToHex(255)
      expect(result.startsWith('0x')).toBe(true)
    })
  })
})

describe('NT Utils - String Utilities', () => {
  describe('reverseString', () => {
    it('should reverse a string', () => {
      expect(reverseString('hello')).toBe('olleh')
    })

    it('should handle empty string', () => {
      expect(reverseString('')).toBe('')
    })

    it('should reverse string with spaces', () => {
      const result = reverseString('hello world')
      expect(result).toBe('dlrow olleh')
    })
  })

  describe('countCharacter', () => {
    it('should count character occurrences', () => {
      expect(countCharacter('hello', 'l')).toBe(2)
      expect(countCharacter('aaa', 'a')).toBe(3)
    })

    it('should return zero for non-existent character', () => {
      expect(countCharacter('hello', 'z')).toBe(0)
    })

    it('should be case sensitive', () => {
      expect(countCharacter('Hello', 'h')).toBe(0)
      expect(countCharacter('Hello', 'H')).toBe(1)
    })
  })

  describe('capitalizeString', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeString('hello')).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(capitalizeString('')).toBe('')
    })

    it('should not affect already capitalized strings', () => {
      const result = capitalizeString('Hello')
      expect(result).toBe('Hello')
    })
  })

  describe('removeWhitespace', () => {
    it('should remove spaces', () => {
      expect(removeWhitespace('hello world')).toBe('helloworld')
    })

    it('should remove tabs and newlines', () => {
      const result = removeWhitespace('hello\tworld\ntest')
      expect(result).toBe('helloworldtest')
    })

    it('should handle string without whitespace', () => {
      expect(removeWhitespace('helloworld')).toBe('helloworld')
    })
  })
})

describe('NT Utils - Date/Time Utilities', () => {
  describe('getCurrentTimestamp', () => {
    it('should return current timestamp', () => {
      const timestamp = getCurrentTimestamp()
      expect(timestamp).toBeGreaterThan(0)
      expect(typeof timestamp).toBe('number')
    })

    it('should return increasing timestamps', () => {
      const ts1 = getCurrentTimestamp()
      const ts2 = getCurrentTimestamp()
      expect(ts2).toBeGreaterThanOrEqual(ts1)
    })
  })

  describe('timestampToIsoString', () => {
    it('should convert timestamp to ISO string', () => {
      const result = timestampToIsoString(0)
      expect(result).toContain('1970')
    })

    it('should return valid ISO format', () => {
      const result = timestampToIsoString(1000)
      expect(result).toContain('T')
      expect(result).toContain('Z')
    })
  })

  describe('timeDifference', () => {
    it('should calculate time difference', () => {
      const diff = timeDifference(1000, 5000)
      expect(diff).toBe(4000)
    })

    it('should handle negative time differences', () => {
      const diff = timeDifference(5000, 1000)
      expect(diff).toBe(4000)
    })

    it('should handle zero difference', () => {
      const diff = timeDifference(1000, 1000)
      expect(diff).toBe(0)
    })
  })
})

describe('NT Utils - Number Utilities', () => {
  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const result = calculatePercentage(50, 100)
      expect(result).toBe(50)
    })

    it('should handle different values', () => {
      const result = calculatePercentage(25, 100)
      expect(result).toBe(25)
    })

    it('should handle fractions', () => {
      const result = calculatePercentage(1, 3)
      expect(result).toBeCloseTo(33.33, 1)
    })
  })

  describe('calculatePercentageIncrease', () => {
    it('should calculate percentage increase', () => {
      const result = calculatePercentageIncrease(100, 150)
      expect(result).toBe(50)
    })

    it('should handle decrease', () => {
      const result = calculatePercentageIncrease(100, 50)
      expect(result).toBe(-50)
    })

    it('should handle zero original value', () => {
      const result = calculatePercentageIncrease(0, 100)
      expect(result).toBe(0)
    })
  })

  describe('roundNumber', () => {
    it('should round to decimal places', () => {
      expect(roundNumber(3.14159, 2)).toBe(3.14)
      expect(roundNumber(3.5, 0)).toBe(4)
    })

    it('should handle negative numbers', () => {
      expect(roundNumber(-3.14159, 2)).toBe(-3.14)
    })

    it('should handle zero decimal places', () => {
      expect(roundNumber(3.9, 0)).toBe(4)
    })
  })

  describe('clampNumber', () => {
    it('should clamp number to range', () => {
      expect(clampNumber(50, 0, 100)).toBe(50)
      expect(clampNumber(-10, 0, 100)).toBe(0)
      expect(clampNumber(150, 0, 100)).toBe(100)
    })

    it('should handle equal min and max', () => {
      expect(clampNumber(50, 100, 100)).toBe(100)
    })
  })

  describe('calculateAverage', () => {
    it('should calculate average correctly', () => {
      expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3)
    })

    it('should handle single value', () => {
      expect(calculateAverage([42])).toBe(42)
    })

    it('should handle empty array', () => {
      expect(calculateAverage([])).toBe(0)
    })

    it('should handle floating point values', () => {
      const result = calculateAverage([1.5, 2.5, 3.0])
      expect(result).toBeCloseTo(2.33, 1)
    })
  })
})

describe('NT Utils - Class Interface', () => {
  it('should create NTUtils instance', () => {
    const utils = new NTUtils()
    expect(utils).toBeDefined()
  })

  it('should provide class methods for validation', () => {
    const utils = new NTUtils()
    const result = utils.validateEmail('test@example.com')
    expect(result.is_valid).toBe(true)
  })

  it('should provide class methods for formatting', () => {
    const utils = new NTUtils()
    const result = utils.formatNumber(3.14159, 2)
    expect(result).toBe('3.14')
  })

  it('should provide class methods for conversions', () => {
    const utils = new NTUtils()
    expect(utils.hexToDecimal('0xFF')).toBe(255)
  })

  it('should provide class methods for string utilities', () => {
    const utils = new NTUtils()
    expect(utils.reverseString('hello')).toBe('olleh')
  })

  it('should provide class methods for date/time utilities', () => {
    const utils = new NTUtils()
    const timestamp = utils.getCurrentTimestamp()
    expect(timestamp).toBeGreaterThan(0)
  })

  it('should provide class methods for number utilities', () => {
    const utils = new NTUtils()
    expect(utils.calculateAverage([1, 2, 3])).toBe(2)
  })
})
