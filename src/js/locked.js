// Locksy - Locked Page Script
// Handles password verification and unlock with rate limiting

let currentTabId = null;
let countdownInterval = null;

// Function to set red lock favicon
function setLockFavicon() {
    // Create canvas to draw lock icon
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Draw red background circle
    ctx.fillStyle = '#dc3545';
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, 2 * Math.PI);
    ctx.fill();

    // Draw lock icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔒', 16, 16);

    // Convert to data URL and set as favicon
    const faviconUrl = canvas.toDataURL('image/png');
    const favicon = document.getElementById('lockFavicon');
    if (favicon) {
        favicon.href = faviconUrl;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Set red lock favicon
    setLockFavicon();

    // Get tab ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentTabId = parseInt(urlParams.get('tab'));

    if (!currentTabId) {
        showError('Invalid tab ID. Please close this tab.');
        return;
    }

    // CRITICAL: Verify lock data exists and is valid
    // Firefox-specific: Retry logic for storage race condition
    try {
        let tabLockData = null;
        let attempts = 0;
        const maxAttempts = 10; // Increased attempts for slower systems

        // Retry up to 10 times with increasing delays for Firefox storage sync
        while (attempts < maxAttempts) {
            const lockData = await chrome.storage.local.get([`lockData_${currentTabId}`]);
            tabLockData = lockData[`lockData_${currentTabId}`];

            // Check if we have valid lock data
            if (tabLockData && tabLockData.originalUrl &&
                tabLockData.originalUrl !== 'about:blank' &&
                tabLockData.originalUrl !== '') {
                // Valid data found, break out
                console.log('Lock data loaded successfully:', tabLockData.originalUrl);
                break;
            }

            attempts++;
            if (attempts < maxAttempts) {
                // Exponential backoff: 50ms, 100ms, 200ms, etc.
                const delay = Math.min(50 * Math.pow(2, attempts - 1), 500);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // Only show error if data is STILL invalid after all retries
        if (!tabLockData || !tabLockData.originalUrl ||
            tabLockData.originalUrl === 'about:blank' ||
            tabLockData.originalUrl === '') {
            console.warn('Lock data invalid after retries. Tab ID:', currentTabId, 'Data:', tabLockData);
            showError('⚠️ Lock data may be invalid. Unlock will use browser default.');
        }
    } catch (error) {
        console.error('Error checking lock data:', error);
    }

    // Check initial rate limit status
    await checkRateLimitStatus();

    // Focus password input
    const passwordInput = document.getElementById('passwordInput');
    passwordInput.focus();

    // Enter key listener for password input
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            unlockWithPassword();
        }
    });

    // Unlock button listener
    document.getElementById('unlockBtn').addEventListener('click', unlockWithPassword);

    // Clear password on page unload (defense-in-depth)
    window.addEventListener('beforeunload', () => {
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) {
            passwordInput.value = '';
        }
    });
});

// Check current rate limit status
async function checkRateLimitStatus() {
    try {
        const status = await getRateLimitStatus();

        if (status.isLockedOut && status.lockoutRemaining > 0) {
            // User is locked out
            const minutes = Math.ceil(status.lockoutRemaining / 60);
            showRateLimitInfo(
                `🔒 Too many attempts. Locked for ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
                true
            );
            disableUnlock(true);
            startCountdown(status.lockoutRemaining);
        } else if (status.waitRemaining > 0) {
            // User must wait before next attempt
            showRateLimitInfo(
                `⏳ Please wait ${status.waitRemaining} second${status.waitRemaining !== 1 ? 's' : ''} before trying again.`,
                false
            );
            disableUnlock(true);
            startCountdown(status.waitRemaining);
        } else {
            // No restrictions
            hideRateLimitInfo();
            disableUnlock(false);
        }
    } catch (error) {
        console.error('Error checking rate limit:', error);
    }
}

// Unlock with password
async function unlockWithPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value.trim();

    if (!password) {
        showError('Please enter your password');
        passwordInput.focus();
        return;
    }

    // Clear previous messages
    hideError();
    hideSuccess();
    hideRateLimitInfo();

    // Show loading
    showLoading(true);
    disableUnlock(true);

    try {
        // Get stored password hash
        const data = await chrome.storage.local.get('lockPassword');
        const storedHash = data.lockPassword;

        if (!storedHash) {
            showError('No password configured. Please set up a password first.');
            showLoading(false);
            disableUnlock(false);
            return;
        }

        // Verify password with rate limiting
        const result = await verifyPasswordWithRateLimit(password, storedHash);

        if (result.success) {
            // Password correct - check if this is a domain-locked tab
            const lockData = await chrome.storage.local.get([
                'lockedDomains',
                'domainUnlockPreferences',
                `lockData_${currentTabId}`
            ]);

            const lockedDomains = lockData.lockedDomains || [];
            const domainPreferences = lockData.domainUnlockPreferences || {};
            const tabLockData = lockData[`lockData_${currentTabId}`];

            if (tabLockData && tabLockData.originalUrl) {
                const currentUrl = tabLockData.originalUrl;
                let matchedPattern = null;

                // Check if current URL matches any locked domain
                const isDomainLocked = lockedDomains.some(pattern => {
                    try {
                        const hostname = new URL(currentUrl).hostname;
                        if (pattern === hostname) {
                            matchedPattern = pattern;
                            return true;
                        }
                        if (pattern.startsWith('*.')) {
                            const domain = pattern.slice(2);
                            if (hostname.endsWith(domain) || hostname === domain.replace('*.', '')) {
                                matchedPattern = pattern;
                                return true;
                            }
                        }
                        if (hostname.includes(pattern) || pattern.includes(hostname)) {
                            matchedPattern = pattern;
                            return true;
                        }
                    } catch (e) {
                        console.error('Error matching pattern:', e);
                    }
                    return false;
                });

                if (isDomainLocked && matchedPattern) {
                    // Check if user has a saved preference for this domain
                    if (domainPreferences[matchedPattern]) {
                        // Use saved preference and unlock
                        await unlockWithScope(domainPreferences[matchedPattern]);
                    } else {
                        // First time - show scope selection dialog
                        showScopeSelection(matchedPattern, currentUrl);
                    }
                } else {
                    // Regular tab lock - just unlock
                    await unlockWithScope('tab-only');
                }
            } else {
                // No lock data, just unlock
                await unlockWithScope('tab-only');
            }

        } else {
            // Password incorrect or rate limited
            showLoading(false);
            const unlockBtn = document.getElementById('unlockBtn');

            if (result.error) {
                showError(result.error);

                // Check if rate limited (error includes 'wait' or 'locked')
                if (result.error && (result.error.includes('wait') || result.error.includes('locked'))) {
                    unlockBtn.innerHTML = '🔒 Locked';
                    unlockBtn.disabled = true;
                    passwordInput.disabled = true;
                    passwordInput.classList.add('opacity-half');
                    passwordInput.classList.remove('opacity-full');
                    passwordInput.value = ''; // Clear password for security

                    // Get actual remaining time from rate limit status
                    const status = getRateLimitStatus();
                    const waitTime = status.isLockedOut ? status.lockoutRemaining : status.waitRemaining;

                    if (waitTime > 0) {
                        startCountdown(waitTime);
                    }
                } else {
                    // Not rate limited, just wrong password
                    unlockBtn.innerHTML = '<span class="btn-icon">🔓</span><span>Unlock Tab</span>';
                    unlockBtn.disabled = false;
                    passwordInput.disabled = false;
                    passwordInput.classList.add('opacity-full');
                    passwordInput.classList.remove('opacity-half');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } else {
                showError('Incorrect password. Please try again.');
                unlockBtn.innerHTML = '<span class="btn-icon">🔓</span><span>Unlock Tab</span>';
                unlockBtn.disabled = false;
                passwordInput.disabled = false;
                passwordInput.classList.add('opacity-full');
                passwordInput.classList.remove('opacity-half');
                passwordInput.value = '';
                passwordInput.focus();
            }
        }

    } catch (error) {
        console.error('Error verifying password:', error);
        showError('An error occurred. Please try again.');
        showLoading(false);
        disableUnlock(false);
    }
}

// Start countdown timer (matching old overlay implementation)
function startCountdown(seconds) {
    // Clear any existing countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    const unlockBtn = document.getElementById('unlockBtn');
    const passwordInput = document.getElementById('passwordInput');

    let remaining = seconds + 1; // Add 1 second buffer like old implementation

    countdownInterval = setInterval(() => {
        remaining--;

        if (remaining > 0) {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            // Show "Wait X sec" or "Wait X min Y sec" format
            if (mins > 0) {
                unlockBtn.innerHTML = `⏳ Wait ${mins} min ${secs} sec`;
            } else {
                unlockBtn.innerHTML = `⏳ Wait ${secs} sec`;
            }
        } else {
            clearInterval(countdownInterval);
            countdownInterval = null;

            // Verify rate limit is actually cleared
            const status = getRateLimitStatus();
            const totalWait = status.isLockedOut ? status.lockoutRemaining : status.waitRemaining;

            if (totalWait === 0) {
                unlockBtn.innerHTML = '<span class="btn-icon">🔓</span><span>Unlock Tab</span>';
                unlockBtn.disabled = false;
                passwordInput.disabled = false;
                passwordInput.classList.add('opacity-full');
                passwordInput.classList.remove('opacity-half');
                passwordInput.value = '';
                hideRateLimitInfo();
                showError('✅ Ready - you can try again now');
                setTimeout(() => hideError(), 3000);
                passwordInput.focus();
            } else {
                // Still locked, continue countdown
                startCountdown(totalWait);
            }
        }
    }, 1000);
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.classList.add('visible');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv.textContent === message) {
            hideError();
        }
    }, 5000);
}

// Hide error message
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
    errorDiv.classList.remove('visible');
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    successDiv.classList.add('visible');
}

// Hide success message
function hideSuccess() {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = '';
    successDiv.classList.add('hidden');
    successDiv.classList.remove('visible');
}

// Show loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

// Show rate limit info
function showRateLimitInfo(message, isLocked) {
    const infoDiv = document.getElementById('rateLimitInfo');
    infoDiv.textContent = message;
    infoDiv.classList.remove('hidden');
    infoDiv.classList.add('visible');

    if (isLocked) {
        infoDiv.classList.add('locked');
    } else {
        infoDiv.classList.remove('locked');
    }
}

// Hide rate limit info
function hideRateLimitInfo() {
    const infoDiv = document.getElementById('rateLimitInfo');
    infoDiv.textContent = '';
    infoDiv.classList.add('hidden');
    infoDiv.classList.remove('visible');
    infoDiv.classList.remove('locked');
}

// Disable/enable unlock button and password input
function disableUnlock(disabled) {
    const unlockBtn = document.getElementById('unlockBtn');
    const passwordInput = document.getElementById('passwordInput');

    unlockBtn.disabled = disabled;
    passwordInput.disabled = disabled;

    if (!disabled) {
        passwordInput.focus();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

// Show scope selection dialog for domain-locked tabs
function showScopeSelection(domainPattern, originalUrl) {
    showLoading(false);

    // Hide main lock content
    document.querySelector('.lock-content').classList.add('hidden');
    document.querySelector('.lock-content').classList.remove('visible');

    // Show scope selection
    const scopeSelection = document.getElementById('scopeSelection');
    scopeSelection.classList.remove('hidden');
    scopeSelection.classList.add('visible');

    // Set domain name
    try {
        const hostname = new URL(originalUrl).hostname;
        document.getElementById('domainName').textContent = domainPattern;
        document.getElementById('unlockAllText').textContent = `Unlock All ${hostname} Tabs`;
    } catch (e) {
        document.getElementById('domainName').textContent = domainPattern;
    }

    // Add event listeners
    document.getElementById('unlockThisTabBtn').onclick = async () => {
        const remember = document.getElementById('rememberChoice').checked;
        if (remember) {
            await saveUnlockPreference(domainPattern, 'tab-only');
        }
        await unlockWithScope('tab-only');
    };

    document.getElementById('unlockAllTabsBtn').onclick = async () => {
        const remember = document.getElementById('rememberChoice').checked;
        if (remember) {
            await saveUnlockPreference(domainPattern, 'all-domain-tabs');
        }
        await unlockWithScope('all-domain-tabs');
    };
}

// Save unlock preference for domain
async function saveUnlockPreference(domainPattern, scope) {
    try {
        const data = await chrome.storage.local.get('domainUnlockPreferences');
        const preferences = data.domainUnlockPreferences || {};
        preferences[domainPattern] = scope;
        await chrome.storage.local.set({ domainUnlockPreferences: preferences });
    } catch (error) {
        console.error('Error saving preference:', error);
    }
}

// Unlock with specified scope
async function unlockWithScope(scope) {
    try {
        showSuccess('✓ Unlocking...');

        // Validate tab ID
        if (!currentTabId || isNaN(currentTabId)) {
            throw new Error('Invalid tab ID');
        }

        // Tell background script to unlock with scope
        const response = await chrome.runtime.sendMessage({
            action: 'unlockTab',
            tabId: currentTabId,
            scope: scope
        });

        // Check if response is valid
        if (!response) {
            throw new Error('No response from background script');
        }

        if (!response.success) {
            showError('Error unlocking: ' + (response.error || 'Unknown error'));

            // Restore UI
            document.querySelector('.lock-content').classList.remove('hidden');
            document.querySelector('.lock-content').classList.add('visible');
            const scopeSelection = document.getElementById('scopeSelection');
            if (scopeSelection) {
                scopeSelection.classList.add('hidden');
                scopeSelection.classList.remove('visible');
            }
            showLoading(false);
            disableUnlock(false);
            return;
        }

        // SUCCESS: Background script has already navigated the tab
        // Just wait for the navigation to complete - don't navigate from here
        // The background script's chrome.tabs.update() is more reliable across browsers
        console.log('Tab unlocked successfully, waiting for navigation...');

        // The background script will handle navigation
        // This page will be replaced automatically when the navigation completes

    } catch (error) {
        console.error('Error unlocking tab:', error);
        showError('Error: ' + error.message);

        // Restore UI
        document.querySelector('.lock-content').classList.remove('hidden');
        document.querySelector('.lock-content').classList.add('visible');
        const scopeSelection = document.getElementById('scopeSelection');
        if (scopeSelection) {
            scopeSelection.classList.add('hidden');
            scopeSelection.classList.remove('visible');
        }
        showLoading(false);
        disableUnlock(false);
    }
}
