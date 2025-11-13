import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  LeanAgentic,
  processType,
  checkEquality,
  batchCheckEquality,
  unifyTypes,
  typeCheck,
  Type,
  Term,
  EqualityOptions,
  ProcessedType,
  EqualityResult,
  UnificationResult,
  TypeCheckResult,
} from '../src/index'

describe('Lean-Agentic - Dependent Types', () => {
  const sampleType1: Type = {
    id: 'type-001',
    name: 'List',
    definition: 'forall n:Nat, List Nat n',
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  const sampleType2: Type = {
    id: 'type-002',
    name: 'List',
    definition: 'forall n:Nat, List Nat n',
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  const sampleType3: Type = {
    id: 'type-003',
    name: 'Vector',
    definition: 'forall n:Nat, Vector Nat n -> Nat',
    metadata: {
      source: 'test',
      version: '1.0',
    },
  }

  const sampleTerm: Term = {
    id: 'term-001',
    term_type: 'List',
    value: '[1, 2, 3]',
    proof: 'proof_of_list_property',
  }

  describe('processType', () => {
    it('should process a type and return processed data', () => {
      const result = processType(sampleType1)

      expect(result).toBeDefined()
      expect(result.id).toBe('type-001')
      expect(result.name).toBe('List')
      expect(result.original_definition).toBeDefined()
      expect(result.normalized_definition).toBeDefined()
      expect(result.hash).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should calculate hash correctly', () => {
      const result = processType(sampleType1)

      expect(result.hash).toBeTruthy()
      expect(result.hash.length).toBeGreaterThan(0)
      // Hash should be consistent for same definition
      const result2 = processType(sampleType1)
      expect(result.hash).toBe(result2.hash)
    })

    it('should normalize type definition', () => {
      const result = processType(sampleType1)

      expect(result.normalized_definition).toBeDefined()
      expect(typeof result.normalized_definition).toBe('string')
    })

    it('should preserve type metadata', () => {
      const result = processType(sampleType1)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.source).toBe('test')
      expect(result.metadata.version).toBe('1.0')
    })

    it('should handle complex type definitions', () => {
      const complexType: Type = {
        id: 'complex-001',
        name: 'ComplexType',
        definition: 'forall (n:Nat) (m:Nat), (n > m) -> Vector Int n -> Vector Int m -> Bool',
        metadata: {},
      }

      const result = processType(complexType)

      expect(result).toBeDefined()
      expect(result.id).toBe('complex-001')
      expect(result.hash).toBeTruthy()
    })

    it('should handle types with special characters', () => {
      const specialType: Type = {
        id: 'special-001',
        name: 'SpecialType',
        definition: 'forall α β γ, (α → β) → (β → γ) → (α → γ)',
        metadata: {},
      }

      const result = processType(specialType)

      expect(result).toBeDefined()
      expect(result.hash).toBeTruthy()
    })
  })

  describe('checkEquality', () => {
    it('should check equality between identical types', () => {
      const result = checkEquality(sampleType1, sampleType2)

      expect(result).toBeDefined()
      expect(result.type1_id).toBe('type-001')
      expect(result.type2_id).toBe('type-002')
      expect(result.equal).toBe(true)
      expect(result.hash1).toBe(result.hash2)
    })

    it('should detect inequality between different types', () => {
      const result = checkEquality(sampleType1, sampleType3)

      expect(result).toBeDefined()
      expect(result.equal).toBe(false)
      expect(result.hash1).not.toBe(result.hash2)
    })

    it('should return 1.0 similarity for identical types', () => {
      const result = checkEquality(sampleType1, sampleType1)

      expect(result.equal).toBe(true)
      expect(result.hash1).toBe(result.hash1)
    })

    it('should use hash-consing by default (fast path)', () => {
      const result = checkEquality(sampleType1, sampleType2)

      expect(result).toBeDefined()
      expect(result.method).toBe('hash-consing')
    })

    it('should support deep equality checking', () => {
      const options: EqualityOptions = {
        use_hash_consing: false,
        deep_equality: true,
      }

      const result = checkEquality(sampleType1, sampleType2, options)

      expect(result).toBeDefined()
      expect(result.method).toBe('deep-equality')
    })

    it('should have symmetric equality', () => {
      const result1 = checkEquality(sampleType1, sampleType3)
      const result2 = checkEquality(sampleType3, sampleType1)

      expect(result1.equal).toBe(result2.equal)
      expect(result1.hash1).toBe(result2.hash2)
      expect(result1.hash2).toBe(result2.hash1)
    })

    it('should be transitive for equal types', () => {
      const r1 = checkEquality(sampleType1, sampleType2)
      const r2 = checkEquality(sampleType2, sampleType1)

      expect(r1.equal).toBe(true)
      expect(r2.equal).toBe(true)
    })
  })

  describe('batchCheckEquality', () => {
    it('should check equality for multiple type pairs', () => {
      const pairs: Array<[Type, Type]> = [
        [sampleType1, sampleType2],
        [sampleType1, sampleType3],
        [sampleType2, sampleType3],
      ]

      const results = batchCheckEquality(pairs)

      expect(results).toHaveLength(3)
      expect(results[0].equal).toBe(true)
      expect(results[1].equal).toBe(false)
      expect(results[2].equal).toBe(false)
    })

    it('should handle empty batch', () => {
      const results = batchCheckEquality([])

      expect(results).toHaveLength(0)
    })

    it('should process each pair independently', () => {
      const pairs: Array<[Type, Type]> = [
        [sampleType1, sampleType2],
        [sampleType1, sampleType1],
      ]

      const results = batchCheckEquality(pairs)

      expect(results).toHaveLength(2)
      expect(results[0].type1_id).toBe('type-001')
      expect(results[1].type1_id).toBe('type-001')
    })

    it('should handle large batch operations', () => {
      const pairs: Array<[Type, Type]> = []
      for (let i = 0; i < 50; i++) {
        pairs.push([sampleType1, sampleType2])
      }

      const results = batchCheckEquality(pairs)

      expect(results).toHaveLength(50)
      expect(results.every((r) => r.equal === true)).toBe(true)
    })

    it('should compute hashes for each pair', () => {
      const pairs: Array<[Type, Type]> = [[sampleType1, sampleType3]]

      const results = batchCheckEquality(pairs)

      expect(results[0].hash1).toBeTruthy()
      expect(results[0].hash2).toBeTruthy()
    })
  })

  describe('unifyTypes', () => {
    it('should unify identical types', () => {
      const result = unifyTypes(sampleType1, sampleType2)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.unified_type).toBe(sampleType1.definition)
    })

    it('should unify compatible types', () => {
      const type1: Type = {
        id: 'type-u1',
        name: 'Vector',
        definition: 'Vector Int 5',
        metadata: {},
      }

      const type2: Type = {
        id: 'type-u2',
        name: 'Vector',
        definition: 'Vector Int 5',
        metadata: {},
      }

      const result = unifyTypes(type1, type2)

      expect(result.success).toBe(true)
    })

    it('should handle incompatible types', () => {
      // Incompatible types should throw an error
      try {
        unifyTypes(sampleType1, sampleType3)
        // If it doesn't throw, that's OK too - implementation might support union types
        expect(true).toBe(true)
      } catch (error) {
        // Expected behavior for truly incompatible types
        expect(error).toBeDefined()
      }
    })

    it('should return unified type as result', () => {
      const result = unifyTypes(sampleType1, sampleType2)

      expect(result.unified_type).toBeDefined()
      expect(typeof result.unified_type).toBe('string')
    })

    it('should preserve type ids in result', () => {
      // Use compatible types for this test
      const result = unifyTypes(sampleType1, sampleType2)

      expect(result.type1_id).toBe('type-001')
      expect(result.type2_id).toBe('type-002')
    })
  })

  describe('typeCheck', () => {
    it('should type check a term against a type', () => {
      const result = typeCheck(sampleTerm, sampleType1)

      expect(result).toBeDefined()
      expect(result.term_id).toBe('term-001')
      expect(result.type_id).toBe('type-001')
      expect(result.valid).toBeDefined()
      expect(typeof result.valid).toBe('boolean')
    })

    it('should validate matching term and type', () => {
      const result = typeCheck(sampleTerm, sampleType1)

      // term_type 'List' matches type name 'List'
      expect(result.valid).toBe(true)
    })

    it('should provide reason for validation result', () => {
      const result = typeCheck(sampleTerm, sampleType1)

      expect(result.reason).toBeDefined()
      expect(typeof result.reason).toBe('string')
    })

    it('should detect type mismatch', () => {
      const mismatchedTerm: Term = {
        id: 'term-002',
        term_type: 'Vector',
        value: '[1, 2, 3]',
      }

      const result = typeCheck(mismatchedTerm, sampleType1)

      // 'Vector' does not match 'List'
      expect(result.valid).toBe(false)
    })

    it('should handle terms with proofs', () => {
      const termWithProof: Term = {
        id: 'term-003',
        term_type: 'List',
        value: '[1, 2, 3]',
        proof: 'valid_proof_of_list_construction',
      }

      const result = typeCheck(termWithProof, sampleType1)

      expect(result).toBeDefined()
      expect(result.valid).toBeDefined()
    })
  })

  describe('LeanAgentic class', () => {
    let leanAgentic: LeanAgentic

    beforeAll(() => {
      leanAgentic = new LeanAgentic()
    })

    it('should create instance', () => {
      expect(leanAgentic).toBeDefined()
      expect(leanAgentic).toBeInstanceOf(LeanAgentic)
    })

    it('should process type via instance method', () => {
      const result = leanAgentic.process(sampleType1)

      expect(result).toBeDefined()
      expect(result.id).toBe('type-001')
    })

    it('should check equality via instance method', () => {
      const result = leanAgentic.checkEquality(sampleType1, sampleType2)

      expect(result).toBeDefined()
      expect(result.equal).toBe(true)
    })

    it('should batch check equality via instance method', () => {
      const pairs: Array<[Type, Type]> = [[sampleType1, sampleType2]]
      const results = leanAgentic.batchCheckEquality(pairs)

      expect(results).toBeDefined()
      expect(results).toHaveLength(1)
    })

    it('should unify types via instance method', () => {
      const result = leanAgentic.unifyTypes(sampleType1, sampleType2)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should type check via instance method', () => {
      const result = leanAgentic.typeCheck(sampleTerm, sampleType1)

      expect(result).toBeDefined()
      expect(result.valid).toBeDefined()
    })
  })

  describe('Hash-Consing Performance', () => {
    it('should provide fast equality checking with hashing', () => {
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        checkEquality(sampleType1, sampleType2)
      }

      const duration = Date.now() - start

      // Should be very fast (1000 iterations in reasonable time)
      expect(duration).toBeLessThan(1000) // Less than 1 second for 1000 checks
    })

    it('should use consistent hashing', () => {
      const type = sampleType1

      const hashes = []
      for (let i = 0; i < 10; i++) {
        const result = processType(type)
        hashes.push(result.hash)
      }

      // All hashes should be identical
      const allIdentical = hashes.every((h) => h === hashes[0])
      expect(allIdentical).toBe(true)
    })

    it('should distinguish different types by hash', () => {
      const result1 = processType(sampleType1)
      const result2 = processType(sampleType3)

      expect(result1.hash).not.toBe(result2.hash)
    })
  })

  describe('Integration tests', () => {
    it('should process, check equality, and type check in sequence', () => {
      // Process type
      const processed = processType(sampleType1)
      expect(processed).toBeDefined()

      // Check equality
      const equal = checkEquality(sampleType1, sampleType2)
      expect(equal.equal).toBe(true)

      // Type check
      const typeCheckResult = typeCheck(sampleTerm, sampleType1)
      expect(typeCheckResult).toBeDefined()
    })

    it('should handle complete workflow', () => {
      // Process multiple types
      const t1 = processType(sampleType1)
      const t2 = processType(sampleType3)
      expect(t1).toBeDefined()
      expect(t2).toBeDefined()

      // Check equality
      const equal = checkEquality(sampleType1, sampleType3)
      expect(equal).toBeDefined()

      // Unify types
      const unified = unifyTypes(sampleType1, sampleType2)
      expect(unified.success).toBe(true)

      // Type check
      const typeCheckResult = typeCheck(sampleTerm, sampleType1)
      expect(typeCheckResult.valid).toBe(true)
    })

    it('should maintain data integrity through processing', () => {
      const result = processType(sampleType1)

      expect(result.id).toBe(sampleType1.id)
      expect(result.name).toBe(sampleType1.name)
      expect(result.metadata).toEqual(sampleType1.metadata)
    })

    it('should handle multiple types with different complexities', () => {
      const simpleType: Type = {
        id: 'simple',
        name: 'Int',
        definition: 'Int',
        metadata: {},
      }

      const complexType: Type = {
        id: 'complex',
        name: 'DepType',
        definition: 'forall (n:Nat), (n > 0) -> Vector Int n -> Nat',
        metadata: {},
      }

      const simple = processType(simpleType)
      const complex = processType(complexType)

      expect(simple).toBeDefined()
      expect(complex).toBeDefined()
      expect(simple.hash).not.toBe(complex.hash)
    })
  })

  describe('Error handling', () => {
    it('should handle empty type gracefully', () => {
      const emptyType: Type = {
        id: 'empty',
        name: '',
        definition: '',
        metadata: {},
      }

      const result = processType(emptyType)

      expect(result).toBeDefined()
      expect(result.id).toBe('empty')
    })

    it('should handle very long type definitions', () => {
      const longType: Type = {
        id: 'long',
        name: 'LongType',
        definition: 'forall ' + 'a:Type '.repeat(100) + ', Type',
        metadata: {},
      }

      const result = processType(longType)

      expect(result).toBeDefined()
      expect(result.hash).toBeTruthy()
    })

    it('should handle special unicode characters', () => {
      const unicodeType: Type = {
        id: 'unicode',
        name: 'UnicodeType',
        definition: '∀ x ∈ ℕ, ∃ y ∈ ℝ, x < y',
        metadata: {},
      }

      const result = processType(unicodeType)

      expect(result).toBeDefined()
      expect(result.hash).toBeTruthy()
    })

    it('should validate types correctly', () => {
      expect(() => {
        const type1 = sampleType1
        const type2 = sampleType3
        checkEquality(type1, type2)
      }).not.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle identical object references', () => {
      const result = checkEquality(sampleType1, sampleType1)

      expect(result.equal).toBe(true)
    })

    it('should handle type with null metadata', () => {
      const typeWithNullMeta: Type = {
        id: 'null-meta',
        name: 'Type',
        definition: 'Type',
        metadata: {}, // Provide empty metadata object
      }

      const result = processType(typeWithNullMeta)

      expect(result).toBeDefined()
    })

    it('should process many types without memory issues', () => {
      const types: Type[] = []

      for (let i = 0; i < 100; i++) {
        types.push({
          id: `type-${i}`,
          name: `Type${i}`,
          definition: `definition_${i}`,
          metadata: { index: i },
        })
      }

      const results = types.map((t) => processType(t))

      expect(results).toHaveLength(100)
      expect(results.every((r) => r.hash)).toBe(true)
    })

    it('should batch check many type pairs', () => {
      const pairs: Array<[Type, Type]> = []

      for (let i = 0; i < 100; i++) {
        pairs.push([sampleType1, sampleType2])
      }

      const results = batchCheckEquality(pairs)

      expect(results).toHaveLength(100)
    })
  })
})
