// Lean-Agentic - Dependent types with hash-consing
// TypeScript bindings for the napi-rs module

export interface Type {
  id: string
  name: string
  definition: string
  metadata?: Record<string, any>
}

export interface Term {
  id: string
  term_type: string
  value: string
  proof?: string
}

export interface EqualityOptions {
  use_hash_consing?: boolean
  cache_results?: boolean
  deep_equality?: boolean
}

export interface ProcessedType {
  id: string
  name: string
  original_definition: string
  normalized_definition: string
  hash: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface EqualityResult {
  type1_id: string
  type2_id: string
  equal: boolean
  hash1: string
  hash2: string
  method: string
  timestamp: string
}

export interface UnificationResult {
  type1_id: string
  type2_id: string
  unified_type: string
  success: boolean
  timestamp: string
}

export interface TypeCheckResult {
  term_id: string
  type_id: string
  valid: boolean
  reason: string
  timestamp: string
}

/**
 * Native bindings from lean_agentic Rust module
 */
let leanAgentic: any

try {
  // Load the native module via platform loader
  leanAgentic = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native lean_agentic module not loaded. Build the project first.')
  leanAgentic = null
}

/**
 * Process dependent type with hash-consing
 * @param type - Type object to process
 * @returns Processed type with hash
 */
export function processType(type: Type): ProcessedType {
  if (!leanAgentic) {
    throw new Error('Native module not available')
  }

  const typeJson = JSON.stringify(type)
  const result = leanAgentic.processType(typeJson)

  return JSON.parse(result)
}

/**
 * Check equality between two dependent types using hash-consing (150x faster)
 * @param type1 - First type
 * @param type2 - Second type
 * @param options - Equality checking options
 * @returns Equality result with method and metrics
 */
export function checkEquality(
  type1: Type,
  type2: Type,
  options?: EqualityOptions
): EqualityResult {
  if (!leanAgentic) {
    throw new Error('Native module not available')
  }

  const type1Json = JSON.stringify(type1)
  const type2Json = JSON.stringify(type2)
  const optionsJson = JSON.stringify(options || {})
  const result = leanAgentic.checkEquality(type1Json, type2Json, optionsJson)

  return JSON.parse(result)
}

/**
 * Batch check equality for multiple type pairs
 * @param pairs - Array of type pairs
 * @returns Array of equality results
 */
export function batchCheckEquality(pairs: Array<[Type, Type]>): EqualityResult[] {
  if (!leanAgentic) {
    throw new Error('Native module not available')
  }

  const pairsJson = JSON.stringify(pairs)
  const result = leanAgentic.batchCheckEquality(pairsJson)

  return JSON.parse(result)
}

/**
 * Unify two dependent types
 * @param type1 - First type
 * @param type2 - Second type
 * @returns Unification result or error
 */
export function unifyTypes(type1: Type, type2: Type): UnificationResult {
  if (!leanAgentic) {
    throw new Error('Native module not available')
  }

  const type1Json = JSON.stringify(type1)
  const type2Json = JSON.stringify(type2)
  const result = leanAgentic.unifyTypes(type1Json, type2Json)

  return JSON.parse(result)
}

/**
 * Type check a term against a dependent type
 * @param term - Term to check
 * @param type - Type to check against
 * @returns Type checking result
 */
export function typeCheck(term: Term, type: Type): TypeCheckResult {
  if (!leanAgentic) {
    throw new Error('Native module not available')
  }

  const termJson = JSON.stringify(term)
  const typeJson = JSON.stringify(type)
  const result = leanAgentic.typeCheck(termJson, typeJson)

  return JSON.parse(result)
}

/**
 * LeanAgentic class for advanced use cases
 */
export class LeanAgentic {
  /**
   * Create a new LeanAgentic instance
   */
  constructor() {
    if (!leanAgentic) {
      throw new Error('Native module not available')
    }
  }

  /**
   * Process a dependent type
   */
  process(type: Type): ProcessedType {
    return processType(type)
  }

  /**
   * Check equality between types
   */
  checkEquality(type1: Type, type2: Type, options?: EqualityOptions): EqualityResult {
    return checkEquality(type1, type2, options)
  }

  /**
   * Check equality for multiple pairs
   */
  batchCheckEquality(pairs: Array<[Type, Type]>): EqualityResult[] {
    return batchCheckEquality(pairs)
  }

  /**
   * Unify types
   */
  unifyTypes(type1: Type, type2: Type): UnificationResult {
    return unifyTypes(type1, type2)
  }

  /**
   * Type check a term
   */
  typeCheck(term: Term, type: Type): TypeCheckResult {
    return typeCheck(term, type)
  }
}

// Export all types and functions
export default {
  processType,
  checkEquality,
  batchCheckEquality,
  unifyTypes,
  typeCheck,
  LeanAgentic,
}
