// Secure Password Hashing Utilities for Locksy
// Uses Web Crypto API for SHA-256 hashing with salt

/**
 * Generate a cryptographically secure random salt
 * @returns {string} - A 32-character hex salt
 */
function generateSalt() {
    try {
        const array = new Uint8Array(16); // 16 bytes = 128 bits
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        throw new Error('Failed to generate salt');
    }
}

/**
 * Hash a password with salt using SHA-256
 * @param {string} password - The plain text password to hash
 * @param {string} salt - The salt to use (if not provided, generates new salt)
 * @returns {Promise<string>} - The salted hash in format: salt:hash
 */
async function hashPassword(password, salt = null) {
    try {
        // Generate new salt if not provided
        if (!salt) {
            salt = generateSalt();
        }

        const encoder = new TextEncoder();
        const saltedPassword = salt + password;
        const data = encoder.encode(saltedPassword);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Return salt:hash format for storage
        return `${salt}:${hashHex}`;
    } catch (error) {
        throw new Error('Failed to hash password');
    }
}

/**
 * Verify a password against a stored salted hash
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash in format salt:hash
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
async function verifyPassword(password, storedHash) {
    try {
        // Check if stored hash is in new format (salt:hash) or old format (just hash)
        if (storedHash.includes(':')) {
            // New format with salt
            const [salt, hash] = storedHash.split(':');
            // Hash the password with the extracted salt
            const encoder = new TextEncoder();
            const saltedPassword = salt + password;
            const data = encoder.encode(saltedPassword);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            // Compare just the hash part
            return hashHex === hash;
        } else {
            // Legacy format without salt (for backward compatibility)
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex === storedHash;
        }
    } catch (error) {
        return false;
    }
}
