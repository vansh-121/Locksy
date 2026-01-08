// Secure Password Key Derivation Utilities for Locksy
// Uses Web Crypto API with PBKDF2 for proper password-based key derivation

// PBKDF2 configuration
const PBKDF2_ITERATIONS = 600000; // OWASP recommended minimum for PBKDF2-SHA-256 (2023)
const SALT_LENGTH = 16; // 16 bytes = 128 bits
const KEY_LENGTH = 32; // 32 bytes = 256 bits

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings are equal
 */
function constantTimeCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Generate a cryptographically secure random salt
 * @returns {string} - A hex-encoded salt
 */
function generateSalt() {
    try {
        const array = new Uint8Array(SALT_LENGTH);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        throw new Error('Failed to generate salt');
    }
}

/**
 * Derive a key from password using PBKDF2
 * @param {string} password - The plain text password
 * @param {string} salt - The salt to use (if not provided, generates new salt)
 * @param {number} iterations - Number of PBKDF2 iterations (default: 600000)
 * @returns {Promise<string>} - The derived key in format: iterations:salt:key
 */
async function hashPassword(password, salt = null, iterations = PBKDF2_ITERATIONS) {
    try {
        // Generate new salt if not provided
        if (!salt) {
            salt = generateSalt();
        }

        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Convert hex salt to Uint8Array
        const saltBuffer = new Uint8Array(salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        // Import password as a key
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        // Derive key using PBKDF2
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            KEY_LENGTH * 8 // bits
        );

        const keyArray = Array.from(new Uint8Array(derivedBits));
        const keyHex = keyArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Return iterations:salt:key format for storage
        return `${iterations}:${salt}:${keyHex}`;
    } catch (error) {
        throw new Error('Failed to derive key from password: ' + error.message);
    }
}

/**
 * Verify a password against a stored derived key
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash (supports multiple formats for backward compatibility)
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
async function verifyPassword(password, storedHash) {
    try {
        // Check format and extract parameters
        const parts = storedHash.split(':');

        if (parts.length === 3 && !isNaN(parts[0])) {
            // New PBKDF2 format: iterations:salt:key
            const iterations = parseInt(parts[0], 10);
            const salt = parts[1];
            const storedKey = parts[2];

            // Derive key with same parameters
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);
            const saltBuffer = new Uint8Array(salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits']
            );

            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: saltBuffer,
                    iterations: iterations,
                    hash: 'SHA-256'
                },
                keyMaterial,
                KEY_LENGTH * 8
            );

            const keyArray = Array.from(new Uint8Array(derivedBits));
            const keyHex = keyArray.map(b => b.toString(16).padStart(2, '0')).join('');

            return constantTimeCompare(keyHex, storedKey);

        } else if (parts.length === 2) {
            // Legacy SHA-256 format with salt: salt:hash
            const salt = parts[0];
            const hash = parts[1];
            const encoder = new TextEncoder();
            const saltedPassword = salt + password;
            const data = encoder.encode(saltedPassword);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return constantTimeCompare(hashHex, hash);

        } else {
            // Legacy SHA-256 format without salt: hash only
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return constantTimeCompare(hashHex, storedHash);
        }
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

