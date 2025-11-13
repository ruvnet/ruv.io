// QuDAG Crypto - Quantum-Resistant Cryptography
// TypeScript bindings for the napi-rs module

export interface CryptoConfig {
  algorithm: string
  key_size: number
  signature_size?: number
}

export interface KeyPair {
  public_key: string
  private_key: string
  algorithm: string
  timestamp: string
}

export interface SignatureResult {
  signature: string
  algorithm: string
  message_hash: string
  timestamp: string
}

export interface VerificationResult {
  verified: boolean
  algorithm: string
  message: string
  timestamp: string
}

export interface HashResult {
  hash: string
  algorithm: string
  input_length: number
  timestamp: string
}

export interface EncryptionResult {
  ciphertext: string
  nonce: string
  algorithm: string
  timestamp: string
}

export interface DecryptionResult {
  plaintext: string
  algorithm: string
  timestamp: string
}

/**
 * Native bindings from qudag_crypto Rust module
 */
let qudagCrypto: any

try {
  // Load the native module via platform loader
  qudagCrypto = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native qudag_crypto module not loaded. Build the project first.')
  qudagCrypto = null
}

/**
 * Generate a keypair for quantum-resistant cryptography
 * @param config - Crypto configuration with algorithm and key size
 * @returns Generated keypair with public and private keys
 */
export function generateKeypair(config: CryptoConfig): KeyPair {
  if (!qudagCrypto) {
    throw new Error('Native module not available')
  }

  const configJson = JSON.stringify(config)
  const result = qudagCrypto.generateKeypair(configJson)

  return JSON.parse(result)
}

/**
 * Hash data using quantum-resistant hash algorithm
 * @param data - Data to hash as hex string
 * @param algorithm - Hash algorithm (blake3, sha256)
 * @returns Hash result with hash and metadata
 */
export function hashData(data: string, algorithm: string = 'BLAKE3'): HashResult {
  if (!qudagCrypto) {
    throw new Error('Native module not available')
  }

  const result = qudagCrypto.hashData(data, algorithm)
  return JSON.parse(result)
}

/**
 * Sign data using quantum-resistant signing algorithm
 * @param data - Data to sign as hex string
 * @param privateKey - Private key as hex string
 * @param algorithm - Signing algorithm
 * @returns Signature result with signature and metadata
 */
export function signData(data: string, privateKey: string, algorithm: string = 'ML-DSA'): SignatureResult {
  if (!qudagCrypto) {
    throw new Error('Native module not available')
  }

  const result = qudagCrypto.signData(data, privateKey, algorithm)
  return JSON.parse(result)
}

/**
 * Verify a signature using quantum-resistant algorithm
 * @param data - Original data as hex string
 * @param signature - Signature as hex string
 * @param publicKey - Public key as hex string
 * @param algorithm - Signature algorithm
 * @returns Verification result with verification status
 */
export function verifySignature(
  data: string,
  signature: string,
  publicKey: string,
  algorithm: string = 'ML-DSA'
): VerificationResult {
  if (!qudagCrypto) {
    throw new Error('Native module not available')
  }

  const result = qudagCrypto.verifySignature(data, signature, publicKey, algorithm)
  return JSON.parse(result)
}

/**
 * Encrypt data using quantum-resistant encryption
 * @param plaintext - Data to encrypt as hex string
 * @param publicKey - Public key as hex string
 * @param algorithm - Encryption algorithm
 * @returns Encryption result with ciphertext and nonce
 */
export function encryptData(
  plaintext: string,
  publicKey: string,
  algorithm: string = 'ML-KEM-768'
): EncryptionResult {
  if (!qudagCrypto) {
    throw new Error('Native module not available')
  }

  const result = qudagCrypto.encryptData(plaintext, publicKey, algorithm)
  return JSON.parse(result)
}

/**
 * Decrypt data using quantum-resistant decryption
 * @param ciphertext - Encrypted data as hex string
 * @param nonce - Nonce used in encryption as hex string
 * @param privateKey - Private key as hex string
 * @param algorithm - Decryption algorithm
 * @returns Decryption result with plaintext
 */
export function decryptData(
  ciphertext: string,
  nonce: string,
  privateKey: string,
  algorithm: string = 'ML-KEM-768'
): DecryptionResult {
  if (!qudagCrypto) {
    throw new Error('Native module not available')
  }

  const result = qudagCrypto.decryptData(ciphertext, nonce, privateKey, algorithm)
  return JSON.parse(result)
}

/**
 * Get supported quantum-resistant algorithms
 * @returns Array of supported algorithm names
 */
export function getSupportedAlgorithms(): string[] {
  if (!qudagCrypto) {
    throw new Error('Native module not available')
  }

  const result = qudagCrypto.getSupportedAlgorithms()
  return JSON.parse(result)
}

/**
 * Perform key agreement using quantum-resistant algorithm
 * @param publicKey1 - First public key as hex string
 * @param publicKey2 - Second public key as hex string
 * @param algorithm - Key agreement algorithm
 * @returns Shared secret as hex string
 */
export function keyAgreement(
  publicKey1: string,
  publicKey2: string,
  algorithm: string = 'BLAKE3'
): string {
  if (!qudagCrypto) {
    throw new Error('Native module not available')
  }

  return qudagCrypto.keyAgreement(publicKey1, publicKey2, algorithm)
}

/**
 * QudagCrypto class for quantum-resistant cryptographic operations
 */
export class QudagCrypto {
  private config: CryptoConfig

  /**
   * Create a new QudagCrypto instance
   * @param config - Initial crypto configuration
   */
  constructor(config: Partial<CryptoConfig> = {}) {
    if (!qudagCrypto) {
      throw new Error('Native module not available')
    }

    this.config = {
      algorithm: config.algorithm || 'ML-KEM-768',
      key_size: config.key_size || 256,
      signature_size: config.signature_size,
    }
  }

  /**
   * Generate a new keypair
   */
  generateKeypair(): KeyPair {
    return generateKeypair(this.config)
  }

  /**
   * Hash data
   */
  hash(data: string, algorithm: string = 'BLAKE3'): HashResult {
    return hashData(data, algorithm)
  }

  /**
   * Sign data
   */
  sign(data: string, privateKey: string): SignatureResult {
    return signData(data, privateKey, this.config.algorithm)
  }

  /**
   * Verify a signature
   */
  verify(data: string, signature: string, publicKey: string): VerificationResult {
    return verifySignature(data, signature, publicKey, this.config.algorithm)
  }

  /**
   * Encrypt data
   */
  encrypt(plaintext: string, publicKey: string): EncryptionResult {
    return encryptData(plaintext, publicKey, this.config.algorithm)
  }

  /**
   * Decrypt data
   */
  decrypt(ciphertext: string, nonce: string, privateKey: string): DecryptionResult {
    return decryptData(ciphertext, nonce, privateKey, this.config.algorithm)
  }

  /**
   * Perform key agreement
   */
  keyAgreement(publicKey1: string, publicKey2: string): string {
    return keyAgreement(publicKey1, publicKey2, this.config.algorithm)
  }

  /**
   * Get supported algorithms
   */
  getSupportedAlgorithms(): string[] {
    return getSupportedAlgorithms()
  }

  /**
   * Update configuration
   */
  setConfig(newConfig: Partial<CryptoConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): CryptoConfig {
    return { ...this.config }
  }
}

// Export all types and functions
export default {
  generateKeypair,
  hashData,
  signData,
  verifySignature,
  encryptData,
  decryptData,
  getSupportedAlgorithms,
  keyAgreement,
  QudagCrypto,
}
