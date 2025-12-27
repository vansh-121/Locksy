// Secure Password Key Derivation Utilities for Locksy
// Uses Web Crypto API with PBKDF2 for proper password-based key derivation

// PBKDF2 configuration
const PBKDF2_ITERATIONS = 600000; // OWASP recommended minimum for PBKDF2-SHA-256 (2023)
const SALT_LENGTH = 16; // 16 bytes = 128 bits
const KEY_LENGTH = 32; // 32 bytes = 256 bits

// Rate limiting configuration (scoped with crypto_ prefix to avoid conflicts)
let crypto_failedAttempts = 0;
let crypto_lastAttemptTime = 0;
const CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY = 3;
const CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT = 10;
const CRYPTO_LOCKOUT_DURATION = 300000; // 5 minutes in milliseconds

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

/**
 * Verify password with rate limiting protection
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash
 * @returns {Promise<{success: boolean, error?: string}>} - Verification result with rate limiting
 */
async function verifyPasswordWithRateLimit(password, storedHash) {
    const now = Date.now();

    // Check if in lockout period
    if (crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT) {
        const timeSinceLast = now - crypto_lastAttemptTime;
        if (timeSinceLast < CRYPTO_LOCKOUT_DURATION) {
            const remainingTime = Math.ceil((CRYPTO_LOCKOUT_DURATION - timeSinceLast) / 1000);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            return {
                success: false,
                error: `Too many failed attempts. Please wait ${minutes}m ${seconds}s before trying again.`
            };
        }
        // Lockout expired, reset counter
        crypto_failedAttempts = 0;
    }

    // Apply delay after initial failed attempts (exponential backoff)
    if (crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY) {
        const timeSinceLast = now - crypto_lastAttemptTime;
        const requiredDelay = Math.pow(2, crypto_failedAttempts - CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY) * 1000;

        if (timeSinceLast < requiredDelay) {
            const waitTime = Math.ceil((requiredDelay - timeSinceLast) / 1000);
            return {
                success: false,
                error: `Please wait ${waitTime} seconds before trying again.`
            };
        }
    }

    // Attempt verification
    try {
        const isValid = await verifyPassword(password, storedHash);

        if (isValid) {
            // Reset on successful authentication
            crypto_failedAttempts = 0;
            crypto_lastAttemptTime = 0;
            return { success: true };
        } else {
            // Increment failed attempts
            crypto_failedAttempts++;
            crypto_lastAttemptTime = now;

            let errorMsg = 'Incorrect password.';

            // Warn about upcoming delays
            if (crypto_failedAttempts === CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY) {
                errorMsg = 'Incorrect password. ⚠️ Warning: Next failed attempt will require a 2-second wait.'
            } else if (crypto_failedAttempts > CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY && crypto_failedAttempts < CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT) {
                const remaining = CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT - crypto_failedAttempts;
                const nextDelay = Math.pow(2, crypto_failedAttempts - CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY + 1);
                errorMsg = `Incorrect password. ⚠️ ${remaining} attempts left before 5-minute lockout. Next wait: ${nextDelay}s.`;
            } else if (crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT) {
                errorMsg = '🚫 Account locked for 5 minutes due to too many failed attempts.';
            }

            return { success: false, error: errorMsg };
        }
    } catch (error) {
        console.error('Password verification error:', error);
        return { success: false, error: 'Verification failed. Please try again.' };
    }
}

/**
 * Reset rate limiting (for testing or administrative purposes)
 */
function resetRateLimit() {
    crypto_failedAttempts = 0;
    crypto_lastAttemptTime = 0;
}

/**
 * Get current rate limit status
 * @returns {{failedAttempts: number, isLockedOut: boolean, lockoutRemaining: number, waitRemaining: number}}
 */
function getRateLimitStatus() {
    const now = Date.now();
    const isLockedOut = crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT &&
        (now - crypto_lastAttemptTime) < CRYPTO_LOCKOUT_DURATION;
    const lockoutRemaining = isLockedOut ?
        Math.ceil((CRYPTO_LOCKOUT_DURATION - (now - crypto_lastAttemptTime)) / 1000) : 0;

    // Calculate exponential backoff remaining time
    let waitRemaining = 0;
    if (crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY && crypto_failedAttempts < CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT) {
        const timeSinceLast = now - crypto_lastAttemptTime;
        const requiredDelay = Math.pow(2, crypto_failedAttempts - CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY) * 1000;
        if (timeSinceLast < requiredDelay) {
            waitRemaining = Math.ceil((requiredDelay - timeSinceLast) / 1000);
        }
    }

    return {
        failedAttempts: crypto_failedAttempts,
        isLockedOut,
        lockoutRemaining,
        waitRemaining
    };
}
