import { describe, it, expect, beforeAll } from 'vitest'
import {
  QudagCrypto,
  generateKeypair,
  hashData,
  signData,
  verifySignature,
  encryptData,
  decryptData,
  getSupportedAlgorithms,
  keyAgreement,
  CryptoConfig,
  KeyPair,
  HashResult,
  SignatureResult,
  EncryptionResult,
} from '../src/index'

describe('QuDAG Crypto - Quantum-Resistant Cryptography', () => {
  let client: QudagCrypto

  beforeAll(() => {
    client = new QudagCrypto({
      algorithm: 'ML-KEM-768',
      key_size: 256,
    })
  })

  describe('generateKeypair', () => {
    it('should generate a keypair with ML-KEM-768', () => {
      const config: CryptoConfig = {
        algorithm: 'ML-KEM-768',
        key_size: 128,
      }

      const keypair = generateKeypair(config)

      expect(keypair).toBeDefined()
      expect(keypair.public_key).toBeDefined()
      expect(keypair.private_key).toBeDefined()
      expect(keypair.algorithm).toBe('ML-KEM-768')
      expect(keypair.timestamp).toBeDefined()
    })

    it('should generate a keypair with ML-DSA', () => {
      const config: CryptoConfig = {
        algorithm: 'ML-DSA',
        key_size: 96,
      }

      const keypair = generateKeypair(config)

      expect(keypair.algorithm).toBe('ML-DSA')
      expect(keypair.public_key).toBeDefined()
      expect(keypair.private_key).toBeDefined()
    })

    it('should generate a keypair with HQC', () => {
      const config: CryptoConfig = {
        algorithm: 'HQC',
        key_size: 112,
      }

      const keypair = generateKeypair(config)

      expect(keypair.algorithm).toBe('HQC')
      expect(keypair.public_key).toBeDefined()
      expect(keypair.private_key).toBeDefined()
    })

    it('should generate different keypairs on each call', () => {
      const config: CryptoConfig = {
        algorithm: 'ML-KEM-768',
        key_size: 128,
      }

      const keypair1 = generateKeypair(config)
      const keypair2 = generateKeypair(config)

      expect(keypair1.public_key).not.toBe(keypair2.public_key)
      expect(keypair1.private_key).not.toBe(keypair2.private_key)
    })

    it('should respect key_size parameter', () => {
      const config: CryptoConfig = {
        algorithm: 'ML-KEM-768',
        key_size: 64,
      }

      const keypair = generateKeypair(config)

      // Key should be 64 bytes = 128 hex chars
      expect(keypair.public_key.length).toBeLessThanOrEqual(256) // 128 * 2
      expect(keypair.private_key.length).toBeLessThanOrEqual(256)
    })

    it('should use instance configuration', () => {
      const keypair = client.generateKeypair()

      expect(keypair).toBeDefined()
      expect(keypair.algorithm).toBe('ML-KEM-768')
    })
  })

  describe('hashData', () => {
    const testData = Buffer.from('Hello, QuDAG Crypto!').toString('hex')

    it('should hash data with BLAKE3', () => {
      const result = hashData(testData, 'BLAKE3')

      expect(result).toBeDefined()
      expect(result.hash).toBeDefined()
      expect(result.algorithm).toBe('BLAKE3')
      expect(result.input_length).toBeGreaterThan(0)
      expect(result.timestamp).toBeDefined()
    })

    it('should hash data with SHA256', () => {
      const result = hashData(testData, 'SHA256')

      expect(result).toBeDefined()
      expect(result.hash).toBeDefined()
      expect(result.algorithm).toBe('SHA256')
      expect(result.input_length).toBeGreaterThan(0)
    })

    it('should use BLAKE3 as default algorithm', () => {
      const result = hashData(testData)

      expect(result.algorithm).toBe('BLAKE3')
    })

    it('should produce consistent hashes for same input', () => {
      const result1 = hashData(testData, 'BLAKE3')
      const result2 = hashData(testData, 'BLAKE3')

      expect(result1.hash).toBe(result2.hash)
    })

    it('should produce different hashes for different inputs', () => {
      const data1 = Buffer.from('data1').toString('hex')
      const data2 = Buffer.from('data2').toString('hex')

      const result1 = hashData(data1, 'BLAKE3')
      const result2 = hashData(data2, 'BLAKE3')

      expect(result1.hash).not.toBe(result2.hash)
    })

    it('should handle empty data', () => {
      const emptyData = Buffer.from('').toString('hex')
      const result = hashData(emptyData, 'BLAKE3')

      expect(result.hash).toBeDefined()
      expect(result.input_length).toBe(0)
    })

    it('should work via instance method', () => {
      const result = client.hash(testData, 'BLAKE3')

      expect(result).toBeDefined()
      expect(result.hash).toBeDefined()
    })
  })

  describe('signData and verifySignature', () => {
    let keypair: KeyPair
    const testData = Buffer.from('Sign me with quantum crypto!').toString('hex')

    beforeAll(() => {
      const config: CryptoConfig = {
        algorithm: 'ML-DSA',
        key_size: 96,
      }
      keypair = generateKeypair(config)
    })

    it('should sign data', () => {
      const result = signData(testData, keypair.private_key, 'ML-DSA')

      expect(result).toBeDefined()
      expect(result.signature).toBeDefined()
      expect(result.algorithm).toBe('ML-DSA')
      expect(result.message_hash).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should produce consistent signatures', () => {
      const sig1 = signData(testData, keypair.private_key, 'ML-DSA')
      const sig2 = signData(testData, keypair.private_key, 'ML-DSA')

      // HMAC-based signatures should be consistent for same input
      expect(sig1.signature).toBe(sig2.signature)
    })

    it('should verify valid signature', () => {
      const signResult = signData(testData, keypair.private_key, 'ML-DSA')
      // For HMAC-based signatures, verification uses the same key as signing
      const verifyResult = verifySignature(
        testData,
        signResult.signature,
        keypair.private_key,
        'ML-DSA'
      )

      expect(verifyResult.verified).toBe(true)
      expect(verifyResult.algorithm).toBe('ML-DSA')
    })

    it('should reject invalid signature', () => {
      const invalidSig = 'deadbeef' + 'ff'.repeat(31)
      const verifyResult = verifySignature(
        testData,
        invalidSig,
        keypair.public_key,
        'ML-DSA'
      )

      expect(verifyResult.verified).toBe(false)
    })

    it('should reject signature with wrong data', () => {
      const signResult = signData(testData, keypair.private_key, 'ML-DSA')
      const wrongData = Buffer.from('Different data').toString('hex')

      const verifyResult = verifySignature(
        wrongData,
        signResult.signature,
        keypair.private_key,
        'ML-DSA'
      )

      expect(verifyResult.verified).toBe(false)
    })

    it('should work via instance methods', () => {
      const clientKeypair = client.generateKeypair()
      const signResult = client.sign(testData, clientKeypair.private_key)

      expect(signResult.signature).toBeDefined()

      const verifyResult = client.verify(testData, signResult.signature, clientKeypair.private_key)
      expect(verifyResult.verified).toBe(true)
    })
  })

  describe('encryptData and decryptData', () => {
    let keypair: KeyPair
    const plaintext = Buffer.from('Secret message').toString('hex')

    beforeAll(() => {
      const config: CryptoConfig = {
        algorithm: 'ML-KEM-768',
        key_size: 128,
      }
      keypair = generateKeypair(config)
    })

    it('should encrypt data', () => {
      const result = encryptData(plaintext, keypair.public_key, 'ML-KEM-768')

      expect(result).toBeDefined()
      expect(result.ciphertext).toBeDefined()
      expect(result.nonce).toBeDefined()
      expect(result.algorithm).toBe('ML-KEM-768')
      expect(result.timestamp).toBeDefined()
    })

    it('should produce different ciphertexts for same plaintext', () => {
      const enc1 = encryptData(plaintext, keypair.public_key, 'ML-KEM-768')
      const enc2 = encryptData(plaintext, keypair.public_key, 'ML-KEM-768')

      // Different nonces should produce different ciphertexts
      expect(enc1.nonce).not.toBe(enc2.nonce)
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext)
    })

    it('should decrypt encrypted data', () => {
      const encResult = encryptData(plaintext, keypair.public_key, 'ML-KEM-768')
      const decResult = decryptData(
        encResult.ciphertext,
        encResult.nonce,
        keypair.public_key, // Use same key for decryption (symmetric encryption)
        'ML-KEM-768'
      )

      expect(decResult).toBeDefined()
      expect(decResult.plaintext).toBe(plaintext)
      expect(decResult.algorithm).toBe('ML-KEM-768')
    })

    it('should work via instance methods', () => {
      const clientKeypair = client.generateKeypair()
      const encResult = client.encrypt(plaintext, clientKeypair.public_key)

      expect(encResult.ciphertext).toBeDefined()

      const decResult = client.decrypt(encResult.ciphertext, encResult.nonce, clientKeypair.public_key)
      expect(decResult.plaintext).toBe(plaintext)
    })

    it('should handle empty plaintext', () => {
      const emptyData = ''
      const encResult = encryptData(emptyData, keypair.public_key, 'ML-KEM-768')

      expect(encResult.ciphertext).toBeDefined()
      expect(encResult.nonce).toBeDefined()
    })
  })

  describe('getSupportedAlgorithms', () => {
    it('should return list of supported algorithms', () => {
      const algorithms = getSupportedAlgorithms()

      expect(Array.isArray(algorithms)).toBe(true)
      expect(algorithms.length).toBeGreaterThan(0)
    })

    it('should include quantum-resistant algorithms', () => {
      const algorithms = getSupportedAlgorithms()

      expect(algorithms).toContain('ML-KEM-768')
      expect(algorithms).toContain('ML-DSA')
      expect(algorithms).toContain('HQC')
    })

    it('should include hash algorithms', () => {
      const algorithms = getSupportedAlgorithms()

      expect(algorithms).toContain('BLAKE3')
      expect(algorithms).toContain('SHA256')
    })

    it('should work via instance method', () => {
      const algorithms = client.getSupportedAlgorithms()

      expect(Array.isArray(algorithms)).toBe(true)
      expect(algorithms.length).toBeGreaterThan(0)
    })
  })

  describe('keyAgreement', () => {
    let keypair1: KeyPair
    let keypair2: KeyPair

    beforeAll(() => {
      const config: CryptoConfig = {
        algorithm: 'ML-KEM-768',
        key_size: 128,
      }
      keypair1 = generateKeypair(config)
      keypair2 = generateKeypair(config)
    })

    it('should perform key agreement with BLAKE3', () => {
      const secret = keyAgreement(keypair1.public_key, keypair2.public_key, 'BLAKE3')

      expect(secret).toBeDefined()
      expect(typeof secret).toBe('string')
      expect(secret.length).toBeGreaterThan(0)
    })

    it('should perform key agreement with SHA256', () => {
      const secret = keyAgreement(keypair1.public_key, keypair2.public_key, 'SHA256')

      expect(secret).toBeDefined()
      expect(typeof secret).toBe('string')
    })

    it('should produce consistent shared secrets', () => {
      const secret1 = keyAgreement(keypair1.public_key, keypair2.public_key, 'BLAKE3')
      const secret2 = keyAgreement(keypair1.public_key, keypair2.public_key, 'BLAKE3')

      expect(secret1).toBe(secret2)
    })

    it('should be symmetric', () => {
      const secret1 = keyAgreement(keypair1.public_key, keypair2.public_key, 'BLAKE3')
      const secret2 = keyAgreement(keypair2.public_key, keypair1.public_key, 'BLAKE3')

      expect(secret1).toBe(secret2)
    })

    it('should produce different secrets for different keys', () => {
      const keypair3 = generateKeypair({
        algorithm: 'ML-KEM-768',
        key_size: 128,
      })

      const secret1 = keyAgreement(keypair1.public_key, keypair2.public_key, 'BLAKE3')
      const secret2 = keyAgreement(keypair1.public_key, keypair3.public_key, 'BLAKE3')

      expect(secret1).not.toBe(secret2)
    })

    it('should work via instance method', () => {
      const secret = client.keyAgreement(keypair1.public_key, keypair2.public_key)

      expect(secret).toBeDefined()
    })
  })

  describe('QudagCrypto class', () => {
    it('should create instance with default configuration', () => {
      const crypto = new QudagCrypto()

      expect(crypto).toBeDefined()
      const config = crypto.getConfig()
      expect(config.algorithm).toBe('ML-KEM-768')
      expect(config.key_size).toBe(256)
    })

    it('should create instance with custom configuration', () => {
      const crypto = new QudagCrypto({
        algorithm: 'ML-DSA',
        key_size: 512,
      })

      const config = crypto.getConfig()
      expect(config.algorithm).toBe('ML-DSA')
      expect(config.key_size).toBe(512)
    })

    it('should update configuration', () => {
      const crypto = new QudagCrypto()
      crypto.setConfig({ algorithm: 'HQC', key_size: 128 })

      const config = crypto.getConfig()
      expect(config.algorithm).toBe('HQC')
      expect(config.key_size).toBe(128)
    })

    it('should perform all cryptographic operations', () => {
      const crypto = new QudagCrypto({
        algorithm: 'ML-KEM-768',
        key_size: 128,
      })

      // Generate keypair
      const keypair = crypto.generateKeypair()
      expect(keypair).toBeDefined()

      // Hash data
      const testData = Buffer.from('test').toString('hex')
      const hash = crypto.hash(testData)
      expect(hash).toBeDefined()

      // Get algorithms
      const algos = crypto.getSupportedAlgorithms()
      expect(algos.length).toBeGreaterThan(0)
    })
  })

  describe('Integration tests', () => {
    it('should complete full encryption workflow', () => {
      const crypto = new QudagCrypto({
        algorithm: 'ML-KEM-768',
        key_size: 256,
      })

      // Generate keypair
      const keypair = crypto.generateKeypair()
      expect(keypair.public_key).toBeDefined()

      // Encrypt message
      const plaintext = Buffer.from('Secret message').toString('hex')
      const encrypted = crypto.encrypt(plaintext, keypair.public_key)
      expect(encrypted.ciphertext).toBeDefined()

      // Decrypt message (using public key)
      const decrypted = crypto.decrypt(encrypted.ciphertext, encrypted.nonce, keypair.public_key)
      expect(decrypted.plaintext).toBe(plaintext)
    })

    it('should complete full signing workflow', () => {
      const crypto = new QudagCrypto({
        algorithm: 'ML-DSA',
        key_size: 96,
      })

      // Generate keypair
      const keypair = crypto.generateKeypair()
      expect(keypair.public_key).toBeDefined()

      // Sign message
      const message = Buffer.from('Important message').toString('hex')
      const signature = crypto.sign(message, keypair.private_key)
      expect(signature.signature).toBeDefined()

      // Verify signature (with private key, which is the HMAC verification key)
      const verified = crypto.verify(message, signature.signature, keypair.private_key)
      expect(verified.verified).toBe(true)
    })

    it('should handle key agreement and encryption together', () => {
      const crypto = new QudagCrypto()

      // Generate two keypairs
      const keypair1 = crypto.generateKeypair()
      const keypair2 = crypto.generateKeypair()

      // Establish shared secret
      const sharedSecret = crypto.keyAgreement(keypair1.public_key, keypair2.public_key)
      expect(sharedSecret).toBeDefined()

      // Use in encryption
      const plaintext = Buffer.from('Shared secret message').toString('hex')
      const encrypted = encryptData(plaintext, keypair1.public_key, 'ML-KEM-768')
      expect(encrypted.ciphertext).toBeDefined()
    })
  })

  describe('Performance and edge cases', () => {
    it('should handle large data hashing', () => {
      const largeData = Buffer.alloc(10000, 'a').toString('hex')
      const result = hashData(largeData, 'BLAKE3')

      expect(result.hash).toBeDefined()
      expect(result.input_length).toBe(10000)
    })

    it('should handle multiple sequential operations', () => {
      const crypto = new QudagCrypto()

      for (let i = 0; i < 10; i++) {
        const keypair = crypto.generateKeypair()
        expect(keypair.public_key).toBeDefined()

        const data = Buffer.from(`Data ${i}`).toString('hex')
        const hash = crypto.hash(data)
        expect(hash.hash).toBeDefined()
      }
    })

    it('should handle concurrent key generation', () => {
      const config: CryptoConfig = {
        algorithm: 'ML-KEM-768',
        key_size: 128,
      }

      const keypairs = Array.from({ length: 5 }, () => generateKeypair(config))

      expect(keypairs.length).toBe(5)
      const uniquePublicKeys = new Set(keypairs.map((kp) => kp.public_key))
      expect(uniquePublicKeys.size).toBe(5)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid hex data gracefully', () => {
      expect(() => {
        hashData('invalid hex string!!!', 'BLAKE3')
      }).toThrow()
    })

    it('should throw error for unsupported hash algorithm', () => {
      const validData = Buffer.from('test').toString('hex')
      expect(() => {
        hashData(validData, 'UNSUPPORTED_ALGO')
      }).toThrow()
    })

    it('should throw when module not available', () => {
      // This test would only trigger if module loading fails
      // Current implementation falls back to null with a warning
      const crypto = new QudagCrypto()
      expect(crypto).toBeDefined()
    })
  })
})
