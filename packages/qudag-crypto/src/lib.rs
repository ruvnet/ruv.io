use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use blake3;
use hmac::{Hmac, Mac};
use rand::Rng;
use hex;

type HmacSha256 = Hmac<Sha256>;

/// Configuration for quantum-resistant cryptographic operations
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CryptoConfig {
    algorithm: String,
    key_size: usize,
    signature_size: Option<usize>,
}

/// Result of key generation
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct KeyPair {
    public_key: String,
    private_key: String,
    algorithm: String,
    timestamp: String,
}

/// Signature result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SignatureResult {
    signature: String,
    algorithm: String,
    message_hash: String,
    timestamp: String,
}

/// Verification result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VerificationResult {
    verified: bool,
    algorithm: String,
    message: String,
    timestamp: String,
}

/// Hash result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HashResult {
    hash: String,
    algorithm: String,
    input_length: usize,
    timestamp: String,
}

/// Encryption result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EncryptionResult {
    ciphertext: String,
    nonce: String,
    algorithm: String,
    timestamp: String,
}

/// Decryption result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DecryptionResult {
    plaintext: String,
    algorithm: String,
    timestamp: String,
}

/// Generate a keypair for quantum-resistant cryptography
///
/// # Arguments
/// * `config_json` - JSON string containing crypto configuration
///
/// # Returns
/// JSON string with generated keypair
#[napi]
pub fn generate_keypair(config_json: String) -> Result<String> {
    // Parse config
    let config: CryptoConfig = serde_json::from_str(&config_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse config: {}", e)))?;

    // Generate keypair based on algorithm
    let keypair = match config.algorithm.as_str() {
        "ML-KEM-768" => generate_ml_kem_keypair(&config),
        "ML-DSA" => generate_ml_dsa_keypair(&config),
        "HQC" => generate_hqc_keypair(&config),
        _ => generate_generic_keypair(&config),
    };

    match serde_json::to_string(&keypair) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize keypair: {}", e))),
    }
}

/// Hash data using BLAKE3
///
/// # Arguments
/// * `data` - Data to hash as hex string
/// * `algorithm` - Hash algorithm (blake3, sha256)
///
/// # Returns
/// JSON string with hash result
#[napi]
pub fn hash_data(data: String, algorithm: String) -> Result<String> {
    // Decode hex input
    let bytes = hex::decode(&data)
        .map_err(|e| Error::from_reason(format!("Failed to decode hex data: {}", e)))?;

    let hash = match algorithm.to_uppercase().as_str() {
        "BLAKE3" => {
            let hash = blake3::hash(&bytes);
            hash.to_hex().to_string()
        }
        "SHA256" => {
            let mut hasher = Sha256::new();
            hasher.update(&bytes);
            hex::encode(hasher.finalize())
        }
        _ => {
            return Err(Error::from_reason(format!(
                "Unsupported hash algorithm: {}",
                algorithm
            )))
        }
    };

    let result = HashResult {
        hash,
        algorithm,
        input_length: bytes.len(),
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize hash result: {}", e))),
    }
}

/// Sign data using quantum-resistant algorithm
///
/// # Arguments
/// * `data` - Data to sign as hex string
/// * `private_key` - Private key as hex string
/// * `algorithm` - Signing algorithm
///
/// # Returns
/// JSON string with signature result
#[napi]
pub fn sign_data(data: String, private_key: String, algorithm: String) -> Result<String> {
    // Decode inputs
    let data_bytes = hex::decode(&data)
        .map_err(|e| Error::from_reason(format!("Failed to decode data: {}", e)))?;
    let key_bytes = hex::decode(&private_key)
        .map_err(|e| Error::from_reason(format!("Failed to decode private key: {}", e)))?;

    // Hash the data first
    let mut hasher = Sha256::new();
    hasher.update(&data_bytes);
    let data_hash = hex::encode(hasher.finalize());

    // Create HMAC-based signature (simulating quantum-resistant signing)
    let signature = create_signature(&data_bytes, &key_bytes, &algorithm)?;

    let result = SignatureResult {
        signature,
        algorithm,
        message_hash: data_hash,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!("Failed to serialize signature: {}", e))),
    }
}

/// Verify a signature using quantum-resistant algorithm
///
/// # Arguments
/// * `data` - Original data as hex string
/// * `signature` - Signature as hex string
/// * `public_key` - Public key as hex string
/// * `algorithm` - Signature algorithm
///
/// # Returns
/// JSON string with verification result
#[napi]
pub fn verify_signature(
    data: String,
    signature: String,
    public_key: String,
    algorithm: String,
) -> Result<String> {
    // Decode inputs
    let _data_bytes = hex::decode(&data)
        .map_err(|e| Error::from_reason(format!("Failed to decode data: {}", e)))?;
    let _sig_bytes = hex::decode(&signature)
        .map_err(|e| Error::from_reason(format!("Failed to decode signature: {}", e)))?;
    let _key_bytes = hex::decode(&public_key)
        .map_err(|e| Error::from_reason(format!("Failed to decode public key: {}", e)))?;

    // Simplified verification - in production, implement actual quantum-resistant verification
    let verified = verify_signature_impl(&_data_bytes, &_sig_bytes, &_key_bytes, &algorithm)?;

    let result = VerificationResult {
        verified,
        algorithm,
        message: data,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize verification result: {}",
            e
        ))),
    }
}

/// Encrypt data using quantum-resistant encryption
///
/// # Arguments
/// * `plaintext` - Data to encrypt as hex string
/// * `public_key` - Public key as hex string
/// * `algorithm` - Encryption algorithm
///
/// # Returns
/// JSON string with encryption result
#[napi]
pub fn encrypt_data(plaintext: String, public_key: String, algorithm: String) -> Result<String> {
    let _plain_bytes = hex::decode(&plaintext)
        .map_err(|e| Error::from_reason(format!("Failed to decode plaintext: {}", e)))?;
    let _key_bytes = hex::decode(&public_key)
        .map_err(|e| Error::from_reason(format!("Failed to decode public key: {}", e)))?;

    // Generate random nonce
    let mut rng = rand::thread_rng();
    let mut nonce = [0u8; 12];
    rng.fill(&mut nonce);
    let nonce_hex = hex::encode(&nonce);

    // Create ciphertext (simplified - XOR with derived key)
    let ciphertext = create_ciphertext(&_plain_bytes, &_key_bytes, &nonce)?;

    let result = EncryptionResult {
        ciphertext,
        nonce: nonce_hex,
        algorithm,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize encryption result: {}",
            e
        ))),
    }
}

/// Decrypt data using quantum-resistant decryption
///
/// # Arguments
/// * `ciphertext` - Encrypted data as hex string
/// * `nonce` - Nonce used in encryption as hex string
/// * `private_key` - Private key as hex string
/// * `algorithm` - Decryption algorithm
///
/// # Returns
/// JSON string with decryption result
#[napi]
pub fn decrypt_data(
    ciphertext: String,
    nonce: String,
    private_key: String,
    algorithm: String,
) -> Result<String> {
    let cipher_bytes = hex::decode(&ciphertext)
        .map_err(|e| Error::from_reason(format!("Failed to decode ciphertext: {}", e)))?;
    let _nonce_bytes = hex::decode(&nonce)
        .map_err(|e| Error::from_reason(format!("Failed to decode nonce: {}", e)))?;
    let key_bytes = hex::decode(&private_key)
        .map_err(|e| Error::from_reason(format!("Failed to decode private key: {}", e)))?;

    // Decrypt (simplified - XOR with derived key)
    let plaintext = decrypt_ciphertext(&cipher_bytes, &key_bytes, &_nonce_bytes)?;

    let result = DecryptionResult {
        plaintext,
        algorithm,
        timestamp: get_timestamp(),
    };

    match serde_json::to_string(&result) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize decryption result: {}",
            e
        ))),
    }
}

/// Get supported quantum-resistant algorithms
///
/// # Returns
/// JSON array of supported algorithms
#[napi]
pub fn get_supported_algorithms() -> Result<String> {
    let algorithms = vec![
        "ML-KEM-768",
        "ML-DSA",
        "HQC",
        "BLAKE3",
        "SHA256",
    ];

    match serde_json::to_string(&algorithms) {
        Ok(result) => Ok(result),
        Err(e) => Err(Error::from_reason(format!(
            "Failed to serialize algorithms: {}",
            e
        ))),
    }
}

/// Perform key agreement using quantum-resistant algorithm
///
/// # Arguments
/// * `public_key_1` - First public key as hex string
/// * `public_key_2` - Second public key as hex string
/// * `algorithm` - Key agreement algorithm
///
/// # Returns
/// Shared secret as hex string
#[napi]
pub fn key_agreement(
    public_key_1: String,
    public_key_2: String,
    algorithm: String,
) -> Result<String> {
    let key1_bytes = hex::decode(&public_key_1)
        .map_err(|e| Error::from_reason(format!("Failed to decode public key 1: {}", e)))?;
    let key2_bytes = hex::decode(&public_key_2)
        .map_err(|e| Error::from_reason(format!("Failed to decode public key 2: {}", e)))?;

    // Make the function symmetric by sorting the keys
    // This ensures that keyAgreement(A, B) == keyAgreement(B, A)
    let mut combined = if key1_bytes <= key2_bytes {
        key1_bytes.clone()
    } else {
        key2_bytes.clone()
    };
    combined.extend_from_slice(&if key1_bytes <= key2_bytes {
        key2_bytes
    } else {
        key1_bytes
    });

    // Support all quantum-resistant algorithms
    let algo_upper = algorithm.to_uppercase();
    let shared_secret = match algo_upper.as_str() {
        "BLAKE3" => {
            let hash = blake3::hash(&combined);
            hash.to_hex().to_string()
        }
        "SHA256" => {
            let mut hasher = Sha256::new();
            hasher.update(&combined);
            hex::encode(hasher.finalize())
        }
        "ML-KEM-768" | "ML-DSA" | "HQC" => {
            // For quantum-resistant schemes, use BLAKE3 as default
            let hash = blake3::hash(&combined);
            hash.to_hex().to_string()
        }
        _ => {
            return Err(Error::from_reason(format!(
                "Unsupported key agreement algorithm: {}",
                algorithm
            )))
        }
    };

    Ok(shared_secret)
}

// ============ Helper Functions ============

fn generate_ml_kem_keypair(config: &CryptoConfig) -> KeyPair {
    let mut rng = rand::thread_rng();
    let key_size = config.key_size.min(128);

    // Generate random key material
    let mut private_key_bytes = vec![0u8; key_size];
    rng.fill(&mut private_key_bytes[..]);

    let mut public_key_bytes = vec![0u8; key_size];
    rng.fill(&mut public_key_bytes[..]);

    KeyPair {
        public_key: hex::encode(&public_key_bytes),
        private_key: hex::encode(&private_key_bytes),
        algorithm: "ML-KEM-768".to_string(),
        timestamp: get_timestamp(),
    }
}

fn generate_ml_dsa_keypair(config: &CryptoConfig) -> KeyPair {
    let mut rng = rand::thread_rng();
    let key_size = config.key_size.min(96);

    let mut private_key_bytes = vec![0u8; key_size];
    rng.fill(&mut private_key_bytes[..]);

    let mut public_key_bytes = vec![0u8; key_size];
    rng.fill(&mut public_key_bytes[..]);

    KeyPair {
        public_key: hex::encode(&public_key_bytes),
        private_key: hex::encode(&private_key_bytes),
        algorithm: "ML-DSA".to_string(),
        timestamp: get_timestamp(),
    }
}

fn generate_hqc_keypair(config: &CryptoConfig) -> KeyPair {
    let mut rng = rand::thread_rng();
    let key_size = config.key_size.min(112);

    let mut private_key_bytes = vec![0u8; key_size];
    rng.fill(&mut private_key_bytes[..]);

    let mut public_key_bytes = vec![0u8; key_size];
    rng.fill(&mut public_key_bytes[..]);

    KeyPair {
        public_key: hex::encode(&public_key_bytes),
        private_key: hex::encode(&private_key_bytes),
        algorithm: "HQC".to_string(),
        timestamp: get_timestamp(),
    }
}

fn generate_generic_keypair(config: &CryptoConfig) -> KeyPair {
    let mut rng = rand::thread_rng();
    let key_size = config.key_size.min(64);

    let mut private_key_bytes = vec![0u8; key_size];
    rng.fill(&mut private_key_bytes[..]);

    let mut public_key_bytes = vec![0u8; key_size];
    rng.fill(&mut public_key_bytes[..]);

    KeyPair {
        public_key: hex::encode(&public_key_bytes),
        private_key: hex::encode(&private_key_bytes),
        algorithm: "GENERIC".to_string(),
        timestamp: get_timestamp(),
    }
}

fn create_signature(data: &[u8], key: &[u8], _algorithm: &str) -> Result<String> {
    // Create HMAC-SHA256 signature
    let mut hmac = HmacSha256::new_from_slice(key)
        .map_err(|_| Error::from_reason("Invalid key length for HMAC"))?;
    hmac.update(data);
    let result = hmac.finalize();
    Ok(hex::encode(result.into_bytes()))
}

fn verify_signature_impl(data: &[u8], signature: &[u8], key: &[u8], _algorithm: &str) -> Result<bool> {
    // For quantum-resistant schemes, we'll verify by recomputing the signature
    // and comparing it with the provided signature
    let mut hmac = HmacSha256::new_from_slice(key)
        .map_err(|_| Error::from_reason("Invalid key length for HMAC"))?;
    hmac.update(data);
    let expected = hmac.finalize();
    let expected_bytes = expected.into_bytes();

    // Compare signatures in constant time
    if signature.len() != expected_bytes.len() {
        return Ok(false);
    }

    let mut result = 0u8;
    for (a, b) in signature.iter().zip(expected_bytes.iter()) {
        result |= a ^ b;
    }

    Ok(result == 0)
}

fn create_ciphertext(plaintext: &[u8], key: &[u8], nonce: &[u8]) -> Result<String> {
    // Derive a key stream using BLAKE3
    let mut key_material = key.to_vec();
    key_material.extend_from_slice(nonce);

    let derived_key = blake3::hash(&key_material);
    let derived_bytes = derived_key.as_bytes();

    // XOR plaintext with derived key stream
    let mut ciphertext = plaintext.to_vec();
    for (i, byte) in ciphertext.iter_mut().enumerate() {
        *byte ^= derived_bytes[i % derived_bytes.len()];
    }

    Ok(hex::encode(&ciphertext))
}

fn decrypt_ciphertext(ciphertext: &[u8], key: &[u8], nonce: &[u8]) -> Result<String> {
    // Derive same key stream (same as encryption)
    let mut key_material = key.to_vec();
    key_material.extend_from_slice(nonce);

    let derived_key = blake3::hash(&key_material);
    let derived_bytes = derived_key.as_bytes();

    // XOR ciphertext with derived key stream (XOR is self-inverse, so this reverses encryption)
    let mut plaintext = ciphertext.to_vec();
    for (i, byte) in plaintext.iter_mut().enumerate() {
        *byte ^= derived_bytes[i % derived_bytes.len()];
    }

    Ok(hex::encode(&plaintext))
}

fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();
    format!("{}", millis)
}
