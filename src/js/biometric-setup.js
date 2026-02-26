// Biometric Setup Script - Locksy
// Runs in a dedicated window so the popup doesn't close when the OS passkey
// dialog steals focus (which silently cancels WebAuthn in the popup).

(function () {
    const mainIcon = document.getElementById('mainIcon');
    const mainTitle = document.getElementById('mainTitle');
    const statusBox = document.getElementById('statusBox');
    const spinner = document.getElementById('spinner');
    const statusText = document.getElementById('statusText');
    const hintText = document.getElementById('hintText');
    const retryBtn = document.getElementById('retryBtn');
    const closeBtn = document.getElementById('closeBtn');

    function setStatus(type, text) {
        statusBox.className = `status-box ${type}`;
        statusText.textContent = text;
        spinner.style.display = type === 'waiting' ? 'inline-block' : 'none';
    }

    async function startSetup() {
        retryBtn.classList.add('hidden');
        closeBtn.classList.add('hidden');

        setStatus('waiting', 'Waiting for system prompt…');
        hintText.textContent = 'Keep this window open and in focus. Do not close it until the setup is complete.';

        try {
            const capability = await detectBiometricCapability();

            if (!capability.available && !capability.needsHardwareCheck) {
                setStatus('error', 'Biometric not available on this device.');
                hintText.textContent = capability.description;
                closeBtn.classList.remove('hidden');
                return;
            }

            let credential = null;

            if (capability.needsHardwareCheck) {
                // Windows / Linux: must attempt registration to verify hardware exists
                setStatus('waiting', 'Follow the on-screen prompt — use fingerprint or face (not PIN)…');
                const result = await verifyBiometricHardwareAndRegister();
                if (result.success && result.credential) {
                    credential = result.credential;
                } else {
                    throw new Error('Setup cancelled. If you only saw a PIN option, your device may not have biometric hardware.');
                }
            } else {
                // macOS / iOS / Android — direct registration
                setStatus('waiting', 'Follow the on-screen prompt to complete setup…');
                credential = await registerFingerprint();
            }

            // Save credential to storage
            await chrome.storage.local.set({ fingerprintCredential: credential });

            // Signal the popup (if still open) via a storage flag
            await chrome.storage.local.set({ biometricSetupResult: { success: true, ts: Date.now() } });

            // Success UI
            mainIcon.textContent = '✅';
            mainTitle.textContent = 'Biometric Setup Complete!';
            setStatus('success', 'Biometric unlock is now active.');
            hintText.textContent = 'You can now use your fingerprint or face to unlock tabs.';

            // Auto-close after 2 seconds
            setTimeout(() => window.close(), 2000);

        } catch (error) {
            console.error('Biometric setup error:', error);

            // Signal failure to popup
            await chrome.storage.local.set({
                biometricSetupResult: { success: false, error: error.message, ts: Date.now() }
            }).catch(() => { });

            mainIcon.textContent = '❌';
            setStatus('error', error.message || 'Setup failed or was cancelled.');
            hintText.textContent = 'You can try again or close this window.';
            retryBtn.classList.remove('hidden');
            closeBtn.classList.remove('hidden');
        }
    }

    retryBtn.addEventListener('click', () => {
        mainIcon.textContent = '👆';
        mainTitle.textContent = 'Set Up Biometric Unlock';
        startSetup();
    });

    closeBtn.addEventListener('click', () => window.close());

    // Auto-start — small delay to let the window fully render first
    setTimeout(startSetup, 300);
})();
