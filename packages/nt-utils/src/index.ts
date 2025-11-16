// NT Utils - Utility functions for NT ecosystem
// TypeScript bindings for the napi-rs module

export interface ValidationResult {
  is_valid: boolean
  errors: string[]
  warnings: string[]
}

export interface FormattingOptions {
  decimal_places?: number
  currency_symbol?: string
  thousand_separator?: boolean
  uppercase?: boolean
}

/**
 * Native bindings from nt_utils Rust module
 */
let ntUtils: any

try {
  // Load the native module via platform loader
  ntUtils = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native nt_utils module not loaded. Build the project first.')
  ntUtils = null
}

// ============ DATA VALIDATION ============

/**
 * Validate if a string is a valid email address
 * @param email - Email string to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  const result = ntUtils.validateEmail(email)
  return JSON.parse(result)
}

/**
 * Validate if a string is a valid URL
 * @param url - URL string to validate
 * @returns Validation result
 */
export function validateUrl(url: string): ValidationResult {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  const result = ntUtils.validateUrl(url)
  return JSON.parse(result)
}

/**
 * Validate if a number is within range
 * @param value - Number to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validation result
 */
export function validateNumberRange(value: number, min: number, max: number): ValidationResult {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  const result = ntUtils.validateNumberRange(value, min, max)
  return JSON.parse(result)
}

/**
 * Validate string length constraints
 * @param value - String to validate
 * @param minLength - Minimum allowed length
 * @param maxLength - Maximum allowed length
 * @returns Validation result
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number
): ValidationResult {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  const result = ntUtils.validateStringLength(value, minLength, maxLength)
  return JSON.parse(result)
}

// ============ FORMATTING UTILITIES ============

/**
 * Format a number with specified decimal places
 * @param value - Number to format
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimalPlaces: number): string {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.formatNumber(value, decimalPlaces)
}

/**
 * Format currency with symbol and separators
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, options?: FormattingOptions): string {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  const optionsJson = JSON.stringify(options || {})
  return ntUtils.formatCurrency(value, optionsJson)
}

/**
 * Convert bytes to human-readable format
 * @param bytes - Number of bytes
 * @returns Human-readable string (B, KB, MB, GB, TB)
 */
export function formatBytes(bytes: number): string {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.formatBytes(bytes)
}

// ============ CONVERSIONS ============

/**
 * Convert string to boolean
 * @param value - String representation
 * @returns Boolean value
 */
export function parseBoolean(value: string): boolean {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.parseBoolean(value)
}

/**
 * Convert hex string to decimal number
 * @param hexString - Hexadecimal string
 * @returns Decimal number
 */
export function hexToDecimal(hexString: string): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.hexToDecimal(hexString)
}

/**
 * Convert decimal number to hex string
 * @param decimalNumber - Decimal number
 * @param includePrefix - Whether to include "0x" prefix
 * @returns Hex string
 */
export function decimalToHex(decimalNumber: number, includePrefix: boolean = true): string {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.decimalToHex(decimalNumber, includePrefix)
}

// ============ STRING UTILITIES ============

/**
 * Reverse a string
 * @param value - String to reverse
 * @returns Reversed string
 */
export function reverseString(value: string): string {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.reverseString(value)
}

/**
 * Count character occurrences in a string
 * @param value - String to search in
 * @param character - Character to count
 * @returns Count of occurrences
 */
export function countCharacter(value: string, character: string): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.countCharacter(value, character)
}

/**
 * Capitalize first letter of a string
 * @param value - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeString(value: string): string {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.capitalizeString(value)
}

/**
 * Remove all whitespace from a string
 * @param value - String to process
 * @returns String without whitespace
 */
export function removeWhitespace(value: string): string {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.removeWhitespace(value)
}

// ============ DATE/TIME UTILITIES ============

/**
 * Get current timestamp in milliseconds
 * @returns Current timestamp as number
 */
export function getCurrentTimestamp(): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.getCurrentTimestamp()
}

/**
 * Convert timestamp to ISO 8601 string
 * @param timestampMs - Timestamp in milliseconds
 * @returns ISO 8601 formatted date string
 */
export function timestampToIsoString(timestampMs: number): string {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.timestampToIsoString(timestampMs)
}

/**
 * Calculate time difference between two timestamps
 * @param startTimestampMs - Start timestamp in milliseconds
 * @param endTimestampMs - End timestamp in milliseconds
 * @returns Time difference in milliseconds
 */
export function timeDifference(startTimestampMs: number, endTimestampMs: number): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.timeDifference(startTimestampMs, endTimestampMs)
}

// ============ NUMBER UTILITIES ============

/**
 * Calculate percentage of a value
 * @param value - The value
 * @param total - The total
 * @returns Percentage value (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.calculatePercentage(value, total)
}

/**
 * Calculate percentage increase
 * @param original - Original value
 * @param newValue - New value
 * @returns Percentage increase
 */
export function calculatePercentageIncrease(original: number, newValue: number): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.calculatePercentageIncrease(original, newValue)
}

/**
 * Round number to nearest value
 * @param value - Value to round
 * @param decimalPlaces - Number of decimal places
 * @returns Rounded value
 */
export function roundNumber(value: number, decimalPlaces: number): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.roundNumber(value, decimalPlaces)
}

/**
 * Clamp a number between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clampNumber(value: number, min: number, max: number): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  return ntUtils.clampNumber(value, min, max)
}

/**
 * Calculate average of numbers
 * @param numbers - Array of numbers
 * @returns Average value
 */
export function calculateAverage(numbers: number[]): number {
  if (!ntUtils) {
    throw new Error('Native module not available')
  }

  const numbersJson = JSON.stringify(numbers)
  return ntUtils.calculateAverage(numbersJson)
}

/**
 * NTUtils class for advanced use cases
 */
export class NTUtils {
  /**
   * Create a new NTUtils instance
   */
  constructor() {
    if (!ntUtils) {
      throw new Error('Native module not available')
    }
  }

  // Validation methods
  validateEmail(email: string): ValidationResult {
    return validateEmail(email)
  }

  validateUrl(url: string): ValidationResult {
    return validateUrl(url)
  }

  validateNumberRange(value: number, min: number, max: number): ValidationResult {
    return validateNumberRange(value, min, max)
  }

  validateStringLength(value: string, minLength: number, maxLength: number): ValidationResult {
    return validateStringLength(value, minLength, maxLength)
  }

  // Formatting methods
  formatNumber(value: number, decimalPlaces: number): string {
    return formatNumber(value, decimalPlaces)
  }

  formatCurrency(value: number, options?: FormattingOptions): string {
    return formatCurrency(value, options)
  }

  formatBytes(bytes: number): string {
    return formatBytes(bytes)
  }

  // Conversion methods
  parseBoolean(value: string): boolean {
    return parseBoolean(value)
  }

  hexToDecimal(hexString: string): number {
    return hexToDecimal(hexString)
  }

  decimalToHex(decimalNumber: number, includePrefix?: boolean): string {
    return decimalToHex(decimalNumber, includePrefix)
  }

  // String methods
  reverseString(value: string): string {
    return reverseString(value)
  }

  countCharacter(value: string, character: string): number {
    return countCharacter(value, character)
  }

  capitalizeString(value: string): string {
    return capitalizeString(value)
  }

  removeWhitespace(value: string): string {
    return removeWhitespace(value)
  }

  // Date/Time methods
  getCurrentTimestamp(): number {
    return getCurrentTimestamp()
  }

  timestampToIsoString(timestampMs: number): string {
    return timestampToIsoString(timestampMs)
  }

  timeDifference(startTimestampMs: number, endTimestampMs: number): number {
    return timeDifference(startTimestampMs, endTimestampMs)
  }

  // Number methods
  calculatePercentage(value: number, total: number): number {
    return calculatePercentage(value, total)
  }

  calculatePercentageIncrease(original: number, newValue: number): number {
    return calculatePercentageIncrease(original, newValue)
  }

  roundNumber(value: number, decimalPlaces: number): number {
    return roundNumber(value, decimalPlaces)
  }

  clampNumber(value: number, min: number, max: number): number {
    return clampNumber(value, min, max)
  }

  calculateAverage(numbers: number[]): number {
    return calculateAverage(numbers)
  }
}

// Export all types and functions
export default {
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
}
