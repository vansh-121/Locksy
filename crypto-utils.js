// Secure Password Hashing Utilities for Secure Tab Extension
// Uses Web Crypto API for SHA-256 hashing

/**
 * Hash a password using SHA-256
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} - The hashed password as a hex string
 */
async function hashPassword(password) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
}

/**
 * Verify a password against a stored hash
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash to compare against
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
async function verifyPassword(password, storedHash) {
    try {
        const hash = await hashPassword(password);
        return hash === storedHash;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}
