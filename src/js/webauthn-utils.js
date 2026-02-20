// WebAuthn Utility Module for Locksy
// Provides biometric/passkey authentication capabilities using Web Authentication API
// Supports: Fingerprint readers, Windows Hello (PIN/Face), Touch ID, Face ID, 
// Security keys (YubiKey), and Password Manager passkeys (Google, 1Password, etc.)

/**
 * Check if WebAuthn is supported in the current browser
 * @returns {boolean} - True if WebAuthn is supported
 */
function isWebAuthnSupported() {
    return window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential === 'function';
}

/**
 * Check if platform authenticator (fingerprint, face recognition, Windows Hello, etc.) is available
 * @returns {Promise<boolean>} - True if platform authenticator is available
 */
async function isPlatformAuthenticatorAvailable() {
    if (!isWebAuthnSupported()) {
        return false;
    }

    try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
        console.error('Error checking platform authenticator:', error);
        return false;
    }
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} - Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} - The decoded buffer
 */
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Register a new WebAuthn credential (biometric, PIN, or passkey)
 * This can use: Windows Hello (PIN/Face), Touch ID, Face ID, fingerprint readers,
 * security keys, or password manager passkeys (Google, 1Password, etc.)
 * @param {string} username - Username for the credential (default: "locksy_user")
 * @returns {Promise<{credentialId: string, publicKey: string}>} - Credential info to store
 */
async function registerFingerprint(username = "locksy_user") {
    if (!await isPlatformAuthenticatorAvailable()) {
        throw new Error('Platform authenticator not available. Please ensure your device supports Windows Hello, Touch ID, Face ID, or has a fingerprint reader.');
    }

    try {
        // Generate a challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // User ID
        const userId = new Uint8Array(16);
        crypto.getRandomValues(userId);

        // Create credential options
        // Using residentKey: "preferred" triggers the newer Windows Hello flow
        // which prioritizes biometric (fingerprint/face) over PIN
        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "Locksy",
                id: window.location.hostname || "locksy.extension"
            },
            user: {
                id: userId,
                name: username,
                displayName: "Locksy User"
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 },  // ES256
                { type: "public-key", alg: -257 } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                residentKey: "preferred",
                requireResidentKey: false,
                userVerification: "required"
            },
            // WebAuthn L3: hint to prefer built-in biometric authenticator
            hints: ["client-device"],
            timeout: 60000,
            attestation: "none"
        };

        // Create the credential
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        if (!credential) {
            throw new Error('Failed to create credential');
        }

        // Extract and store credential data
        const credentialId = arrayBufferToBase64(credential.rawId);
        const response = credential.response;

        // Store the public key for verification (though we mainly rely on the authenticator)
        const publicKey = arrayBufferToBase64(response.attestationObject);

        return {
            credentialId: credentialId,
            publicKey: publicKey,
            timestamp: Date.now()
        };

    } catch (error) {
        // Handle specific WebAuthn errors
        if (error.name === 'NotAllowedError') {
            throw new Error('Authentication was cancelled or timed out');
        } else if (error.name === 'InvalidStateError') {
            throw new Error('This authenticator is already registered. Try removing it first or use a different method.');
        } else if (error.name === 'NotSupportedError') {
            throw new Error('Your device does not support biometric authentication.');
        }
        throw error;
    }
}

/**
 * Authenticate using registered biometric/passkey
 * @param {string} credentialId - The stored credential ID from registration
 * @returns {Promise<boolean>} - True if authentication successful
 */
async function authenticateWithFingerprint(credentialId) {
    if (!await isPlatformAuthenticatorAvailable()) {
        throw new Error('Platform authenticator not available');
    }

    try {
        // Generate a challenge
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        // Convert stored credential ID back to ArrayBuffer
        const credentialIdBuffer = base64ToArrayBuffer(credentialId);

        // Create assertion options
        // hints: ["client-device"] tells the browser to prefer biometric over PIN
        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [{
                id: credentialIdBuffer,
                type: 'public-key',
                transports: ['internal']
            }],
            // WebAuthn L3: hint to prefer built-in biometric authenticator
            hints: ["client-device"],
            timeout: 60000,
            userVerification: "required"
        };

        // Get the assertion (authenticate)
        // mediation: "optional" avoids showing unnecessary credential picker UI
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions,
            mediation: "optional"
        });

        if (!assertion) {
            return false;
        }

        // If we got an assertion, authentication was successful
        // The authenticator has verified the user's biometric
        return true;

    } catch (error) {
        // Handle specific WebAuthn errors
        if (error.name === 'NotAllowedError') {
            throw new Error('Authentication was cancelled or timed out');
        } else if (error.name === 'NotFoundError') {
            throw new Error('No authenticator found. Please set up biometric authentication or use your password.');
        }
        console.error('Authentication error:', error);
        return false;
    }
}

/**
 * Remove stored authenticator credential
 * @returns {Promise<void>}
 */
async function removeFingerprint() {
    try {
        await chrome.storage.local.remove(['fingerprintCredential']);
    } catch (error) {
        console.error('Error removing credential:', error);
        throw new Error('Failed to remove authenticator credential');
    }
}

/**
 * Check if authenticator is registered
 * @returns {Promise<boolean>} - True if authenticator is registered
 */
async function isFingerprintRegistered() {
    try {
        const data = await chrome.storage.local.get('fingerprintCredential');
        return data.fingerprintCredential && data.fingerprintCredential.credentialId ? true : false;
    } catch (error) {
        console.error('Error checking registration:', error);
        return false;
    }
}

/**
 * Get stored authenticator credential
 * @returns {Promise<{credentialId: string, publicKey: string, timestamp: number} | null>}
 */
async function getFingerprintCredential() {
    try {
        const data = await chrome.storage.local.get('fingerprintCredential');
        return data.fingerprintCredential || null;
    } catch (error) {
        console.error('Error getting credential:', error);
        return null;
    }
}

/**
 * Detect available biometric capabilities on the current device
 * IMPORTANT: On Windows, isPlatformAuthenticatorAvailable() returns true even with
 * only PIN configured (no fingerprint/face hardware). We must handle this carefully
 * to avoid showing "Biometric available" on devices that only have PIN.
 * @returns {Promise<{available: boolean, type: string, label: string, icon: string, description: string, needsHardwareCheck: boolean}>}
 */
async function detectBiometricCapability() {
    // Default: not available
    const result = {
        available: false,
        type: 'none',
        label: 'Not Available',
        icon: '🚫',
        description: 'Your device does not support biometric authentication.',
        needsHardwareCheck: false
    };

    if (!isWebAuthnSupported()) {
        result.description = 'Your browser does not support biometric authentication (WebAuthn).';
        return result;
    }

    const platformAvailable = await isPlatformAuthenticatorAvailable();
    if (!platformAvailable) {
        result.description = 'No biometric hardware detected on your device. A fingerprint reader or face recognition camera is required.';
        return result;
    }

    // Platform authenticator is available - detect type by platform
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform ? navigator.platform.toLowerCase() : '';

    if (ua.includes('mac') || platform.includes('mac')) {
        // macOS — platform auth = Touch ID (always biometric, no PIN-only scenario)
        result.available = true;
        result.type = 'fingerprint';
        result.label = 'Touch ID';
        result.icon = '👆';
        result.description = 'Use Touch ID to unlock instantly with your fingerprint.';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
        // iOS — Face ID or Touch ID (always real biometric)
        result.available = true;
        if (window.screen && window.screen.height >= 812) {
            result.type = 'face';
            result.label = 'Face ID';
            result.icon = '😊';
            result.description = 'Use Face ID to unlock instantly with your face.';
        } else {
            result.type = 'fingerprint';
            result.label = 'Touch ID';
            result.icon = '👆';
            result.description = 'Use Touch ID to unlock instantly with your fingerprint.';
        }
    } else if (ua.includes('android')) {
        // Android — platform auth = fingerprint or face (real biometric)
        result.available = true;
        result.type = 'fingerprint';
        result.label = 'Biometric Unlock';
        result.icon = '👆';
        result.description = 'Use your fingerprint or face to unlock instantly.';
    } else if (ua.includes('windows') || platform.includes('win')) {
        // WINDOWS — CRITICAL: isPlatformAuthenticatorAvailable() returns true even
        // with only Windows Hello PIN (no biometric hardware at all!).
        // We CANNOT trust this alone. We need to verify biometric hardware exists.

        // Check if user has already successfully set up biometric before
        // If they have, we know the hardware exists (they proved it during setup)
        const isRegistered = await isFingerprintRegistered();
        if (isRegistered) {
            // User previously set up biometric — hardware confirmed
            result.available = true;
            result.type = 'windows_hello';
            result.label = 'Fingerprint / Face';
            result.icon = '👆';
            result.description = 'Use your fingerprint or face to unlock instantly.';
        } else {
            // Not yet registered — we can't tell if hardware exists
            // Mark as needing hardware verification during setup
            result.available = false;
            result.needsHardwareCheck = true;
            result.type = 'windows_hello_unverified';
            result.label = 'Fingerprint / Face';
            result.icon = '👆';
            result.description = 'Requires a fingerprint reader or face recognition camera. A PIN alone is not supported — it\'s no different from a password.';
        }
    } else if (ua.includes('linux') || ua.includes('chromeos')) {
        // LINUX/ChromeOS — SAME ISSUE AS WINDOWS: isPlatformAuthenticatorAvailable()
        // can return true from software authenticators (GNOME Keyring, KDE Wallet,
        // software FIDO2 tokens) even without real biometric hardware (fprintd, howdy).
        // Apply the same conservative verification approach.

        const isRegistered = await isFingerprintRegistered();
        if (isRegistered) {
            // Previously set up — hardware confirmed
            result.available = true;
            result.type = 'fingerprint';
            result.label = 'Biometric Unlock';
            result.icon = '👆';
            result.description = 'Use your biometric sensor to unlock instantly.';
        } else {
            // Not yet registered — can't confirm biometric hardware exists
            result.available = false;
            result.needsHardwareCheck = true;
            result.type = 'linux_unverified';
            result.label = 'Biometric Lock';
            result.icon = '👆';
            result.description = 'Requires a fingerprint reader or face recognition camera. Software authenticators alone are not supported.';
        }
    } else {
        // Generic fallback — be conservative
        result.available = false;
        result.needsHardwareCheck = true;
        result.type = 'unknown';
        result.label = 'Biometric Lock';
        result.icon = '🔐';
        result.description = 'Biometric lock requires a fingerprint reader or face recognition camera on your device.';
    }

    return result;
}

/**
 * Verify biometric hardware by attempting a WebAuthn registration.
 * Called during setup on Windows where we can't trust isPlatformAuthenticatorAvailable().
 * If the user successfully completes the prompt using fingerprint/face (not PIN),
 * we consider hardware verified. If they cancel, we assume no hardware.
 * @returns {Promise<{success: boolean, credential: object|null, cancelledOrPinOnly: boolean}>}
 */
async function verifyBiometricHardwareAndRegister(username = "locksy_user") {
    try {
        // Attempt registration — this will show the Windows Hello prompt.
        // If the device has biometric hardware, the user CAN choose fingerprint/face.
        // If it only has PIN, they'll see only PIN and should cancel.
        const credential = await registerFingerprint(username);
        return { success: true, credential: credential, cancelledOrPinOnly: false };
    } catch (error) {
        if (error.name === 'NotAllowedError' || error.message.includes('cancelled')) {
            return { success: false, credential: null, cancelledOrPinOnly: true };
        }
        throw error;
    }
}
