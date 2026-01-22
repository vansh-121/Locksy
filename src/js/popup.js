// SECURE Popup Script - VERSION 4.0 - ULTIMATE SECURITY WITH EXTENSION ACCESS CONTROL

// ============================================================================
// CENTRALIZED RATE LIMITING - Background Script Communication
// ============================================================================
// These functions communicate with the background script for password verification
// to ensure a single, shared rate limiting state across the entire extension.

/**
 * Verify password with rate limiting via background script
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash (not used, background script handles this)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function verifyPasswordWithRateLimit(password, storedHash) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "verifyPassword", password: password },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: 'Failed to verify password' });
          return;
        }
        resolve(response);
      }
    );
  });
}

/**
 * Get current rate limit status from background script
 * @returns {Promise<{failedAttempts: number, isLockedOut: boolean, lockoutRemaining: number, waitRemaining: number}>}
 */
function getRateLimitStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "getRateLimitStatus" },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ failedAttempts: 0, isLockedOut: false, lockoutRemaining: 0, waitRemaining: 0 });
          return;
        }
        resolve(response);
      }
    );
  });
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// State management
let isExtensionActive = false;
let hasExistingPassword = false;
let initialized = false;
let isAuthenticated = false;
let authenticationTimeout = null;
let failedAttempts = 0;
let lockoutUntil = 0;

// Security constants
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_DURATION = 300000; // 5 minutes
const SESSION_TIMEOUT = 600000; // 10 minutes

// Wait for DOM to be ready - use only one event listener to avoid duplicate initialization
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", () => {
    if (!initialized) {
      initialized = true;
      setTimeout(initializeExtension, 50);
    }
  });
} else {
  // DOM is already loaded
  if (!initialized) {
    initialized = true;
    setTimeout(initializeExtension, 50);
  }
}

function initializeExtension() {
  try {
    // Check if document is ready
    if (!document || !document.getElementById) {
      setTimeout(initializeExtension, 100);
      return;
    }

    // Continue with normal initialization
    proceedWithNormalInitialization();

  } catch (error) {
    // Critical error during initialization
  }
}

function proceedWithNormalInitialization() {
  // SECURITY: Check for lockout first
  chrome.storage.local.get(["failedAttempts", "lockoutUntil"], (data) => {
    const now = Date.now();
    failedAttempts = data.failedAttempts || 0;
    lockoutUntil = data.lockoutUntil || 0;

    if (lockoutUntil > now) {
      showLockoutScreen(lockoutUntil - now);
      return;
    }

    // Check if password exists and require authentication
    chrome.storage.local.get(["lockPassword"], (passwordData) => {
      hasExistingPassword = !!passwordData.lockPassword;

      if (hasExistingPassword) {
        showAuthenticationScreen();
      } else {
        // First time setup - proceed directly
        isAuthenticated = true; // No auth needed for first setup
        initializeMainUI();
      }
    });
  });
}

// SECURITY: Show lockout screen after too many failed attempts
function showLockoutScreen(remainingTime) {
  const container = document.querySelector('.container');
  const minutes = Math.ceil(remainingTime / 60000);

  // Clear container
  container.textContent = '';

  // Create wrapper div
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'text-align: center; padding: 40px 20px;';

  // Create icon
  const icon = document.createElement('img');
  icon.src = '../../assets/images/icon.png';
  icon.alt = 'Locksy';
  icon.style.cssText = 'width: 64px; height: 64px; margin-bottom: 20px; border-radius: 12px;';
  wrapper.appendChild(icon);

  // Create heading
  const heading = document.createElement('h2');
  heading.textContent = 'Extension Locked';
  heading.style.cssText = 'color: #dc3545; margin-bottom: 16px;';
  wrapper.appendChild(heading);

  // Create message paragraph
  const message = document.createElement('p');
  message.style.cssText = 'color: #6c757d; margin-bottom: 20px;';
  message.appendChild(document.createTextNode('Too many failed authentication attempts.'));
  message.appendChild(document.createElement('br'));
  message.appendChild(document.createTextNode(`Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`));
  wrapper.appendChild(message);

  // Create security measure box
  const securityBox = document.createElement('div');
  securityBox.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 12px; margin-top: 20px;';
  const securityText = document.createElement('p');
  securityText.style.cssText = 'margin: 0; font-size: 12px; color: #721c24; font-weight: 500;';
  const securityStrong = document.createElement('strong');
  securityStrong.textContent = '🛡️ Security Measure:';
  securityText.appendChild(securityStrong);
  securityText.appendChild(document.createTextNode(' This extension is temporarily locked to prevent brute force attacks.'));
  securityBox.appendChild(securityText);
  wrapper.appendChild(securityBox);

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;';
  const devButton = document.createElement('button');
  devButton.id = 'toggleDeveloperInfo';
  devButton.className = 'btn-developer-toggle';
  devButton.textContent = '👨‍💻 Developer Info';
  devButton.style.cssText = 'width: 100%; padding: 12px 18px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); opacity: 0.9;';
  buttonContainer.appendChild(devButton);
  wrapper.appendChild(buttonContainer);

  container.appendChild(wrapper);

  // Auto-refresh when lockout expires
  setTimeout(() => {
    location.reload();
  }, remainingTime);

  // Initialize developer info after lockout screen is set up
  initializeDeveloperInfo();
}

// SECURITY: Show authentication screen for existing password
function showAuthenticationScreen() {
  const container = document.querySelector('.container');

  // Clear container
  container.textContent = '';

  // Create wrapper div
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'text-align: center; padding: 30px 20px;';

  // Create lock icon
  const lockIcon = document.createElement('div');
  lockIcon.textContent = '🔐';
  lockIcon.style.cssText = 'font-size: 48px; margin-bottom: 20px;';
  wrapper.appendChild(lockIcon);

  // Create heading
  const heading = document.createElement('h2');
  heading.textContent = 'Authentication Required';
  heading.style.cssText = 'color: #2c3e50; margin-bottom: 12px;';
  wrapper.appendChild(heading);

  // Create description
  const description = document.createElement('p');
  description.textContent = 'Enter your master password to access the extension';
  description.style.cssText = 'color: #6c757d; margin-bottom: 25px;';
  wrapper.appendChild(description);

  // Create input container
  const inputContainer = document.createElement('div');
  inputContainer.style.cssText = 'text-align: left;';

  const authInput = document.createElement('input');
  authInput.type = 'password';
  authInput.id = 'authPassword';
  authInput.placeholder = 'Enter your master password';
  authInput.style.cssText = 'width: 100%; padding: 14px 18px; margin: 10px 0; border: 2px solid #e9ecef; border-radius: 12px; font-size: 15px; background: white; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);';
  inputContainer.appendChild(authInput);

  const authButton = document.createElement('button');
  authButton.id = 'authButton';
  authButton.className = 'btn-primary';
  authButton.textContent = 'Authenticate';
  authButton.style.cssText = 'width: 100%; padding: 14px 18px; margin: 10px 0; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);';
  inputContainer.appendChild(authButton);

  wrapper.appendChild(inputContainer);

  // Create error div
  const authError = document.createElement('div');
  authError.id = 'authError';
  authError.style.cssText = 'color: #dc3545; font-size: 14px; margin-top: 10px; opacity: 0; transition: opacity 0.3s ease;';
  wrapper.appendChild(authError);

  // Add warning if there are failed attempts
  if (failedAttempts > 0) {
    const warningBox = document.createElement('div');
    warningBox.style.cssText = 'margin-top: 16px; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;';
    const warningText = document.createElement('p');
    warningText.style.cssText = 'margin: 0; font-size: 12px; color: #856404; font-weight: 500;';
    const warningStrong = document.createElement('strong');
    warningStrong.textContent = '⚠️ Warning:';
    warningText.appendChild(warningStrong);
    const attemptsRemaining = MAX_FAILED_ATTEMPTS - failedAttempts;
    warningText.appendChild(document.createTextNode(` ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining before lockout`));
    warningBox.appendChild(warningText);
    wrapper.appendChild(warningBox);
  }

  container.appendChild(wrapper);

  // Get references to created elements
  const authPasswordInput = document.getElementById('authPassword');
  const authButtonElement = document.getElementById('authButton');
  const authErrorElement = document.getElementById('authError');

  // Focus on password input
  setTimeout(() => authPasswordInput.focus(), 100);

  // Enter key support
  authPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      authButtonElement.click();
    }
  });

  // Authentication handler
  authButtonElement.addEventListener('click', () => {
    const password = authPasswordInput.value.trim();

    if (!password) {
      showAuthError('Please enter your password');
      return;
    }

    // Show loading state
    authButtonElement.textContent = 'Verifying...';
    authButtonElement.disabled = true;

    chrome.storage.local.get(['lockPassword'], async (data) => {
      setTimeout(async () => {
        const result = await verifyPasswordWithRateLimit(password, data.lockPassword);
        if (result.success) {
          // Authentication successful
          isAuthenticated = true;
          resetFailedAttempts();
          startSessionTimeout();
          initializeMainUI();
          showNotification('Authentication successful!', 'success');
        } else {
          // Authentication failed
          handleFailedAuth();
          showAuthError(result.error || 'Incorrect password');

          // Check if we need to disable the button due to rate limiting
          if (result.error && (result.error.includes('wait') || result.error.includes('locked'))) {
            authButtonElement.textContent = '🔒 Locked';
            authButtonElement.disabled = true;
            authPasswordInput.disabled = true;
            authPasswordInput.style.opacity = '0.5';

            // Get actual remaining time from rate limit status
            const status = await getRateLimitStatus();
            const waitTime = status.isLockedOut ? status.lockoutRemaining : status.waitRemaining;

            if (waitTime > 0) {
              startRateLimitCountdown(waitTime);
            }
          } else {
            authButtonElement.textContent = 'Authenticate';
            authButtonElement.disabled = false;
            authPasswordInput.value = '';
            authPasswordInput.focus();
          }
        }
      }, 500);
    });
  });

  function startRateLimitCountdown(seconds) {
    let remaining = seconds + 1; // Add 1 second buffer
    const countdownInterval = setInterval(async () => {
      remaining--;
      if (remaining > 0) {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        authButtonElement.textContent = `⏳ Wait ${mins > 0 ? mins + 'm ' : ''}${secs}s`;
      } else {
        clearInterval(countdownInterval);
        // Verify rate limit is actually cleared
        const status = await getRateLimitStatus();
        const totalWait = status.isLockedOut ? status.lockoutRemaining : status.waitRemaining;

        if (totalWait === 0) {
          authButtonElement.textContent = 'Authenticate';
          authButtonElement.disabled = false;
          authPasswordInput.disabled = false;
          authPasswordInput.style.opacity = '1';
          authPasswordInput.value = '';
          showAuthError('✅ Ready - you can try again now');
          authPasswordInput.focus();
        } else {
          // Still locked, continue countdown
          startRateLimitCountdown(totalWait);
        }
      }
    }, 1000);
  }

  function showAuthError(message) {
    authErrorElement.textContent = message;
    authErrorElement.style.opacity = '1';
    authPasswordInput.style.borderColor = '#dc3545';

    setTimeout(() => {
      authErrorElement.style.opacity = '0';
      authPasswordInput.style.borderColor = '#e9ecef';
    }, 3000);
  }
}

// SECURITY: Handle failed authentication attempts
function handleFailedAuth() {
  failedAttempts++;

  chrome.storage.local.set({ failedAttempts }, () => {
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION;
      chrome.storage.local.set({ lockoutUntil }, () => {
        showLockoutScreen(LOCKOUT_DURATION);
      });
    } else {
      showAuthenticationScreen(); // Refresh to show updated attempt count
    }
  });
}

// SECURITY: Reset failed attempts counter
function resetFailedAttempts() {
  failedAttempts = 0;
  chrome.storage.local.remove(['failedAttempts', 'lockoutUntil']);
}

// SECURITY: Start session timeout
function startSessionTimeout() {
  if (authenticationTimeout) {
    clearTimeout(authenticationTimeout);
  }

  authenticationTimeout = setTimeout(() => {
    isAuthenticated = false;
    showNotification('Session expired. Please authenticate again.', 'warning');
    showAuthenticationScreen();
  }, SESSION_TIMEOUT);
}

// SECURITY: Initialize main UI (only after authentication or first setup)
function initializeMainUI() {
  // Restore original HTML structure for main interface
  const container = document.querySelector('.container');
  container.innerHTML = `
    <div class="header">
      <h2>
        <img src="../../assets/images/icon.png" alt="Locksy" class="header-icon" style="width: 28px; height: 28px; border-radius: 6px;">
        Locksy
      </h2>
      <div id="statusIndicator" class="status-indicator status-inactive">
        <span id="statusDot">•</span>
        <span id="statusText">Inactive</span>
      </div>
    </div>

    <div class="toggle-section">
      <div class="toggle-container">
        <span class="toggle-label">Extension Status</span>
        <div id="toggleSwitch" class="toggle-switch">
          <div class="toggle-slider"></div>
        </div>
      </div>
      <p style="margin: 0; color: #6c757d; font-size: 13px; font-weight: 500;">
        Toggle to activate/deactivate the extension
      </p>
    </div>

    <div id="controlsSection" class="controls-section">
      <div id="passwordSection">
        <div id="currentPasswordGroup" style="display: none; margin-bottom: 16px;">
          <label for="currentPassword" style="font-size: 14px; font-weight: 600; color: #2c3e50; margin-bottom: 8px; display: block;">🔐 Current Password</label>
          <input type="password" id="currentPassword" placeholder="Enter current password to change it" maxlength="50" />
          <div style="font-size: 12px; color: #dc3545; margin-top: 4px; font-weight: 500;">
            ⚠️ Required to change password for security
          </div>
        </div>
        
        <label for="password" style="font-size: 14px; font-weight: 600; color: #2c3e50; margin-bottom: 8px; display: block;">
          <span id="passwordLabel">🔑 Set Master Password</span>
        </label>
        <input type="password" id="password" placeholder="Set Your Master Password" maxlength="50" />
        
        <div id="passwordStrengthIndicator" style="display: none; margin-top: 8px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #6c757d;">Password Strength:</span>
            <span id="strengthText" style="font-size: 12px; font-weight: 600;"></span>
          </div>
          <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
            <div id="strengthBar" style="height: 100%; width: 0%; transition: all 0.3s ease; border-radius: 2px;"></div>
          </div>
        </div>

        <button id="setPassword" class="btn-primary">Set Password</button>
      </div>

      <div id="lockControls" class="button-group" style="display: none;">
        <div class="lock-buttons-group">
          <button id="lockTab" class="btn-lock-single">
            <span class="btn-icon">🔒</span>
            <span class="btn-text">Current Tab</span>
          </button>
          <button id="lockAllTabs" class="btn-lock-all">
            <span class="btn-icon">🔐</span>
            <span class="btn-text">All Tabs</span>
          </button>
        </div>
        <button id="openDomainManager" class="btn-domain">🌐 Domain Lock</button>
        <button id="openShortcutsPage" class="btn-shortcuts" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 18px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; width: 100%; margin-top: 8px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2); transition: all 0.3s ease;">⌨️ Keyboard Shortcuts</button>
        
        <!-- Timer Settings Section -->
        <div class="timer-settings" id="timerSettings" style="display: block; margin-top: 16px;">
          <div class="timer-header">
            <h3>⏱️ Auto-Lock Timer</h3>
            <button class="collapse-btn" id="collapseAutoLock">−</button>
          </div>
          <div class="timer-content" id="autoLockContent">
            <div class="toggle-container-small">
              <span class="toggle-label-small">Enable Auto-Lock</span>
              <div id="autoLockToggle" class="toggle-switch-small">
                <div class="toggle-slider-small"></div>
              </div>
            </div>
            <p class="timer-description">Automatically lock tabs after period of inactivity</p>
            
            <div id="autoLockOptions" style="display: none;">
              <label class="timer-label">What to lock:</label>
              <div class="lock-scope-buttons">
                <button class="scope-btn active" data-scope="all">🔐 All Tabs</button>
                <button class="scope-btn" data-scope="current">🔒 Active Tab Only</button>
              </div>
              
              <label class="timer-label" style="margin-top: 12px;">Lock after inactivity:</label>
              <div class="duration-buttons">
                <button class="duration-btn" data-duration="300000">5 min</button>
                <button class="duration-btn" data-duration="900000">15 min</button>
                <button class="duration-btn active" data-duration="1800000">30 min</button>
                <button class="duration-btn" data-duration="3600000">60 min</button>
              </div>
              <div class="custom-duration">
                <label class="timer-label">Custom (minutes):</label>
                <input type="number" id="customDuration" min="1" max="480" placeholder="Custom" />
                <button id="setCustomDuration" class="btn-custom-duration">Set</button>
              </div>
              <div id="autoLockStatus" class="status-message"></div>
            </div>
          </div>

          <div class="timer-header" style="margin-top: 16px;">
            <h3>📅 Scheduled Locking</h3>
            <button class="collapse-btn" id="collapseScheduled">−</button>
          </div>
          <div class="timer-content" id="scheduledContent">
            <div class="toggle-container-small">
              <span class="toggle-label-small">Enable Schedule</span>
              <div id="scheduledLockToggle" class="toggle-switch-small">
                <div class="toggle-slider-small"></div>
              </div>
            </div>
            <p class="timer-description">Automatically lock tabs during specific hours</p>
            
            <div id="scheduledOptions" style="display: none;">
              <label class="timer-label">What to lock:</label>
              <div class="lock-scope-buttons schedule-scope-buttons">
                <button class="scope-btn active" data-scope="all">🔐 All Tabs</button>
                <button class="scope-btn" data-scope="current">🔒 Active Tab Only</button>
              </div>
              
              <div class="time-input-group" style="margin-top: 12px;">
                <div class="time-input">
                  <label class="timer-label">Start Time:</label>
                  <input type="time" id="scheduleStart" value="09:00" />
                </div>
                <div class="time-input">
                  <label class="timer-label">End Time:</label>
                  <input type="time" id="scheduleEnd" value="17:00" />
                </div>
              </div>
              <button id="setSchedule" class="btn-set-schedule">Save Schedule</button>
              <div id="scheduledStatus" class="status-message"></div>
              
              <div class="schedule-presets">
                <label class="timer-label">Quick Presets:</label>
                <button class="preset-btn" data-start="09:00" data-end="17:00">Work Hours (9-5)</button>
                <button class="preset-btn" data-start="22:00" data-end="06:00">Night (10pm-6am)</button>
                <button class="preset-btn" data-start="00:00" data-end="23:59">All Day</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="lockTip" style="display: none; margin-top: 12px; padding: 12px; background: #d1f2eb; border-radius: 8px; border-left: 4px solid #28a745;">
        <p style="margin: 0; font-size: 12px; color: #155724; font-weight: 500;">
          <strong>💡 Tip:</strong> Locked tabs can only be unlocked by entering the correct password on the tab itself.
        </p>
      </div>
    </div>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e9ecef;">
      <button id="toggleDeveloperInfo" class="btn-developer-toggle">
        👨‍💻 Developer Info
      </button>
    </div>
  `;

  // Get all required elements after restoring HTML
  const toggleSwitch = document.getElementById("toggleSwitch");
  const statusIndicator = document.getElementById("statusIndicator");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const controlsSection = document.getElementById("controlsSection");
  const passwordInput = document.getElementById("password");
  const currentPasswordInput = document.getElementById("currentPassword");
  const currentPasswordGroup = document.getElementById("currentPasswordGroup");
  const passwordLabel = document.getElementById("passwordLabel");
  const setPasswordBtn = document.getElementById("setPassword");
  const lockTabBtn = document.getElementById("lockTab");
  const lockAllTabsBtn = document.getElementById("lockAllTabs");
  const strengthIndicator = document.getElementById("passwordStrengthIndicator");
  const strengthText = document.getElementById("strengthText");
  const strengthBar = document.getElementById("strengthBar");
  const openDomainManagerBtn = document.getElementById("openDomainManager");

  // Enhanced element validation
  const requiredElements = {
    toggleSwitch, statusIndicator, statusText, statusDot, controlsSection,
    passwordInput, currentPasswordInput, currentPasswordGroup, passwordLabel,
    setPasswordBtn, lockTabBtn, lockAllTabsBtn, strengthIndicator, strengthText, strengthBar,
    openDomainManagerBtn
  };

  // Check for missing elements
  const missingElements = [];
  for (const [name, element] of Object.entries(requiredElements)) {
    if (!element) {
      missingElements.push(name);
    }
  }

  if (missingElements.length > 0) {
    return;
  }  // Load extension state and check for existing password
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(["extensionActive", "lockPassword"], (data) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to load extension state:', chrome.runtime.lastError);
        // Use safe defaults
        isExtensionActive = true;
        hasExistingPassword = false;
      } else {
        isExtensionActive = data.extensionActive !== false;
        hasExistingPassword = !!data.lockPassword;
      }
      updateSecureUI();
    });
  } else {
    console.warn('Chrome storage API not available');
    isExtensionActive = true;
    hasExistingPassword = false;
    updateSecureUI();
  }

  // SECURE UI Update Function
  function updateSecureUI() {
    try {
      // Update toggle switch
      if (toggleSwitch) {
        toggleSwitch.classList.toggle("active", isExtensionActive);
      }

      // Update status indicator
      if (statusIndicator && statusText && statusDot) {
        if (isExtensionActive) {
          statusIndicator.className = "status-indicator status-active";
          statusText.textContent = "Active";
          statusDot.textContent = "●";
          controlsSection.classList.add("enabled");
        } else {
          statusIndicator.className = "status-indicator status-inactive";
          statusText.textContent = "Inactive";
          statusDot.textContent = "●";
          controlsSection.classList.remove("enabled");
        }
      }

      // SECURITY: Update password UI based on existing password
      updatePasswordUI();

      // Save state
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ extensionActive: isExtensionActive }, () => {
          if (chrome.runtime.lastError) {
            console.error('Failed to save extension state:', chrome.runtime.lastError);
            showNotification('Failed to save settings', 'error');
          }
        });
      }
    } catch (error) {
      // Error updating UI
    }
  }

  // CRITICAL SECURITY FUNCTION: Update Password UI
  function updatePasswordUI() {
    const lockControls = document.getElementById("lockControls");
    const lockTip = document.getElementById("lockTip");
    const keyboardShortcuts = document.getElementById("keyboardShortcuts");

    if (hasExistingPassword) {
      // Password exists - require current password to change
      currentPasswordGroup.style.display = "block";
      passwordLabel.textContent = "🔄 New Password";
      passwordInput.placeholder = "Enter new master password";
      setPasswordBtn.textContent = "Change Password";
      setPasswordBtn.className = "btn-primary";

      // Show lock controls since password is set
      if (lockControls) lockControls.style.display = "block";
      if (lockTip) lockTip.style.display = "block";
      if (keyboardShortcuts) keyboardShortcuts.style.display = "block";
    } else {
      // No password exists - first time setup
      currentPasswordGroup.style.display = "none";
      passwordLabel.textContent = "🔑 Set Master Password";
      passwordInput.placeholder = "Set Your Master Password";
      setPasswordBtn.textContent = "Set Password";
      setPasswordBtn.className = "btn-primary";

      // Hide lock controls until password is set
      if (lockControls) lockControls.style.display = "none";
      if (lockTip) lockTip.style.display = "none";
      if (keyboardShortcuts) keyboardShortcuts.style.display = "none";
    }
  }

  // Password strength indicator
  function updatePasswordStrength() {
    if (!passwordInput.value) {
      strengthIndicator.style.display = "none";
      return;
    }

    strengthIndicator.style.display = "block";
    const password = passwordInput.value;
    let strength = 0;
    let strengthLabel = "";
    let color = "";

    // Calculate strength
    if (password.length >= 4) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // Set strength level
    if (strength <= 2) {
      strengthLabel = "Weak";
      color = "#dc3545";
    } else if (strength <= 4) {
      strengthLabel = "Medium";
      color = "#ffc107";
    } else {
      strengthLabel = "Strong";
      color = "#28a745";
    }

    strengthText.textContent = strengthLabel;
    strengthText.style.color = color;
    strengthBar.style.background = color;
    strengthBar.style.width = `${(strength / 6) * 100}%`;
  }

  // SECURE Event Listeners

  // Toggle switch
  if (toggleSwitch) {
    toggleSwitch.addEventListener("click", () => {
      try {
        isExtensionActive = !isExtensionActive;
        updateSecureUI();

        const status = isExtensionActive ? "activated" : "deactivated";
        showNotification(`Extension ${status} successfully!`, "success");
      } catch (error) {
        showNotification("Error toggling extension", "error");
      }
    });
  }

  // Password input with strength checking
  if (passwordInput) {
    passwordInput.addEventListener("input", updatePasswordStrength);
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        setPasswordBtn.click();
      }
    });
  }

  // Current password input
  if (currentPasswordInput) {
    currentPasswordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        passwordInput.focus();
      }
    });
  }

  // CRITICAL SECURITY: Set/Change Password Handler
  if (setPasswordBtn) {
    setPasswordBtn.addEventListener("click", () => {
      handleSecurePasswordChange();
    });
  }

  // Lock tab button
  if (lockTabBtn) {
    lockTabBtn.addEventListener("click", () => {
      try {
        if (!isExtensionActive) {
          showNotification("Please activate the extension first!", "warning");
          return;
        }

        // Check if password is set
        chrome.storage.local.get("lockPassword", (data) => {
          if (!data.lockPassword) {
            showNotification("Please set a master password first!", "warning");
            return;
          }

          // Get current tab and lock it
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              const currentTab = tabs[0];

              // Check if the tab can be locked BEFORE sending message
              if (currentTab.url &&
                (currentTab.url.startsWith("chrome://") ||
                  currentTab.url.startsWith("edge://") ||
                  currentTab.url.startsWith("about:") ||
                  currentTab.url.startsWith("chrome-extension://") ||
                  currentTab.url.startsWith("extension://") ||
                  currentTab.url === "")) {
                showNotification("⚠️ Cannot lock this tab! System pages, browser settings, and extension pages cannot be locked for security reasons.", "error");
                return;
              }

              // Tab can be locked - send message
              chrome.runtime.sendMessage({
                action: "lock",
                tabId: currentTab.id
              }, (response) => {
                // Handle response from background script
                if (chrome.runtime.lastError) {
                  showNotification("❌ Failed to lock tab: " + chrome.runtime.lastError.message, "error");
                } else if (response && response.success) {
                  showNotification("✅ Tab locked successfully!", "success");
                } else if (response && response.error) {
                  showNotification("❌ " + response.error, "error");
                }
              });
            }
          });
        });
      } catch (error) {
        showNotification("Error locking tab", "error");
      }
    });
  }

  // Lock All Tabs button
  if (lockAllTabsBtn) {
    lockAllTabsBtn.addEventListener("click", () => {
      try {
        if (!isExtensionActive) {
          showNotification("Please activate the extension first!", "warning");
          return;
        }

        // Check if password is set
        chrome.storage.local.get("lockPassword", (data) => {
          if (!data.lockPassword) {
            showNotification("Please set a master password first!", "warning");
            return;
          }

          // Get all tabs
          chrome.tabs.query({}, (tabs) => {
            if (!tabs || tabs.length === 0) {
              showNotification("No tabs to lock!", "warning");
              return;
            }

            let lockedCount = 0;
            let skippedCount = 0;
            let totalTabs = tabs.length;

            // Filter lockable tabs
            const lockableTabs = tabs.filter(tab => {
              if (tab.url &&
                (tab.url.startsWith("chrome://") ||
                  tab.url.startsWith("edge://") ||
                  tab.url.startsWith("about:") ||
                  tab.url.startsWith("chrome-extension://") ||
                  tab.url.startsWith("extension://") ||
                  tab.url === "")) {
                skippedCount++;
                return false;
              }
              return true;
            });

            if (lockableTabs.length === 0) {
              showNotification("⚠️ No lockable tabs found! All tabs are system pages or extensions.", "warning");
              return;
            }

            // Show processing notification
            showNotification(`🔄 Locking ${lockableTabs.length} tab${lockableTabs.length !== 1 ? 's' : ''}...`, "info");

            // Lock each tab
            lockableTabs.forEach((tab, index) => {
              chrome.runtime.sendMessage({
                action: "lock",
                tabId: tab.id
              }, (response) => {
                if (response && response.success) {
                  lockedCount++;
                }

                // Show final result after all tabs processed
                if (index === lockableTabs.length - 1) {
                  setTimeout(() => {
                    if (lockedCount === lockableTabs.length) {
                      showNotification(`✅ Successfully locked ${lockedCount} tab${lockedCount !== 1 ? 's' : ''}!`, "success");
                    } else if (lockedCount > 0) {
                      showNotification(`✅ Locked ${lockedCount} of ${lockableTabs.length} tab${lockableTabs.length !== 1 ? 's' : ''}!`, "success");
                    } else {
                      showNotification("❌ Failed to lock tabs. Please try again.", "error");
                    }

                    if (skippedCount > 0) {
                      setTimeout(() => {
                        showNotification(`ℹ️ Skipped ${skippedCount} system tab${skippedCount !== 1 ? 's' : ''}`, "info");
                      }, 2000);
                    }
                  }, 500);
                }
              });
            });
          });
        });
      } catch (error) {
        showNotification("Error locking tabs", "error");
      }
    });
  }

  // Open Domain Manager button
  if (openDomainManagerBtn) {
    openDomainManagerBtn.addEventListener("click", () => {
      chrome.windows.create({
        url: chrome.runtime.getURL('src/html/domain-manager.html'),
        type: 'popup',
        width: 500,
        height: 650
      });
    });
  }

  // Open Keyboard Shortcuts Page button
  const openShortcutsBtn = document.getElementById("openShortcutsPage");
  if (openShortcutsBtn) {
    openShortcutsBtn.addEventListener("click", () => {
      // Open keyboard shortcuts in a popup window (like Domain Manager)
      chrome.windows.create({
        url: chrome.runtime.getURL('src/html/keyboard-shortcuts.html'),
        type: 'popup',
        width: 700,
        height: 700
      });
    });
  }

  // CRITICAL SECURITY FUNCTION: Handle Password Change with Verification
  function handleSecurePasswordChange() {
    try {
      if (!isExtensionActive) {
        showNotification("Please activate the extension first!", "warning");
        return;
      }

      const newPassword = passwordInput.value.trim();

      // Validate new password
      if (!newPassword) {
        showNotification("Please enter a password.", "warning");
        return;
      }

      if (newPassword.length < 4) {
        showNotification("Password must be at least 4 characters long.", "warning");
        return;
      }

      // SECURITY CHECK: If password exists, verify current password
      if (hasExistingPassword) {
        const currentPassword = currentPasswordInput.value.trim();

        if (!currentPassword) {
          showNotification("Please enter your current password!", "error");
          currentPasswordInput.focus();
          return;
        }

        // Verify current password
        chrome.storage.local.get("lockPassword", async (data) => {
          const result = await verifyPasswordWithRateLimit(currentPassword, data.lockPassword);
          if (!result.success) {
            showNotification(result.error || "Current password is incorrect!", "error");
            currentPasswordInput.value = "";
            currentPasswordInput.focus();
            return;
          }

          // Current password verified - proceed with change
          saveNewPassword(newPassword, true);
        });
      } else {
        // First time setup - no verification needed
        saveNewPassword(newPassword, false);
      }

    } catch (error) {
      showNotification("Error changing password", "error");
    }
  }

  // SECURE PASSWORD SAVE FUNCTION
  async function saveNewPassword(password, isChange) {
    const hashedPassword = await hashPassword(password);
    chrome.storage.local.set({ lockPassword: hashedPassword }, () => {
      if (chrome.runtime.lastError) {
        showNotification("Error saving password!", "error");
        return;
      }

      // Success
      const action = isChange ? "changed" : "set";
      showNotification(`Password ${action} successfully!`, "success");

      // Clear inputs
      passwordInput.value = "";
      if (currentPasswordInput) currentPasswordInput.value = "";

      // Update state
      hasExistingPassword = true;
      updatePasswordUI();

      // Hide strength indicator
      strengthIndicator.style.display = "none";
    });
  }

  // Initialize developer info after main UI is set up
  initializeDeveloperInfo();

  // Initialize timer settings
  initializeTimerSettings();
}

function showNotification(message, type = "info") {
  try {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-weight: 600;
      font-size: 12px;
      z-index: 1000;
      max-width: 250px;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    switch (type) {
      case "success":
        notification.style.background = "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)";
        break;
      case "error":
        notification.style.background = "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)";
        break;
      case "warning":
        notification.style.background = "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)";
        break;
      default:
        notification.style.background = "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)";
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  } catch (error) {
    alert(message); // Fallback to alert
  }
}

// Developer Information - Configuration
const DEVELOPER_INFO = {
  name: "Vansh Sethi",
  github: "https://github.com/vansh-121",
  linkedin: "https://linkedin.com/in/vansh-sethi-vs",
  email: "vansh.sethi98760@gmail.com"
};

// Track if developer info has been initialized to prevent duplicate listeners
let developerInfoInitialized = false;

// Initialize developer information links and toggle
function initializeDeveloperInfo() {
  // Prevent duplicate initialization
  if (developerInfoInitialized) {
    return;
  }

  try {
    const developerName = document.getElementById("developerName");
    const githubLink = document.getElementById("githubLink");
    const linkedinLink = document.getElementById("linkedinLink");
    const emailLink = document.getElementById("emailLink");
    const toggleButton = document.getElementById("toggleDeveloperInfo");
    const developerInfoSection = document.getElementById("developerInfo");

    // Only proceed if at least some elements exist
    if (!toggleButton && !githubLink) {
      return;
    }

    if (developerName) {
      developerName.textContent = DEVELOPER_INFO.name;
    }

    if (githubLink) {
      githubLink.href = DEVELOPER_INFO.github;
      githubLink.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: DEVELOPER_INFO.github });
      });
    }

    if (linkedinLink) {
      linkedinLink.href = DEVELOPER_INFO.linkedin;
      linkedinLink.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: DEVELOPER_INFO.linkedin });
      });
    }

    if (emailLink) {
      emailLink.href = `mailto:${DEVELOPER_INFO.email}`;
      // Allow default mailto: behavior to open default mail client
      // No need to prevent default or use chrome.tabs.create for mailto links
    }

    // Toggle button functionality
    if (toggleButton && developerInfoSection) {
      toggleButton.addEventListener("click", () => {
        if (developerInfoSection.style.display === "none") {
          developerInfoSection.style.display = "block";
          toggleButton.textContent = "👨‍💻 Hide Developer Info";
        } else {
          developerInfoSection.style.display = "none";
          toggleButton.textContent = "👨‍💻 Developer Info";
        }
      });
    }

    // Mark as initialized
    developerInfoInitialized = true;
  } catch (error) {
    // Silently handle initialization errors
  }
}

// ============================================================================
// TIMER SETTINGS FUNCTIONALITY
// ============================================================================

// Initialize timer settings
function initializeTimerSettings() {
  const timerSettings = document.getElementById('timerSettings');
  const autoLockToggle = document.getElementById('autoLockToggle');
  const scheduledLockToggle = document.getElementById('scheduledLockToggle');
  const autoLockOptions = document.getElementById('autoLockOptions');
  const scheduledOptions = document.getElementById('scheduledOptions');
  const collapseAutoLock = document.getElementById('collapseAutoLock');
  const collapseScheduled = document.getElementById('collapseScheduled');
  const autoLockContent = document.getElementById('autoLockContent');
  const scheduledContent = document.getElementById('scheduledContent');

  if (!timerSettings) return;

  // Show timer settings (it will be hidden if password is not set via parent lockControls)
  timerSettings.style.display = 'block';

  // Collapse/Expand functionality
  if (collapseAutoLock && autoLockContent) {
    collapseAutoLock.addEventListener('click', () => {
      if (autoLockContent.style.display === 'none') {
        autoLockContent.style.display = 'block';
        collapseAutoLock.textContent = '−';
      } else {
        autoLockContent.style.display = 'none';
        collapseAutoLock.textContent = '+';
      }
    });
  }

  if (collapseScheduled && scheduledContent) {
    collapseScheduled.addEventListener('click', () => {
      if (scheduledContent.style.display === 'none') {
        scheduledContent.style.display = 'block';
        collapseScheduled.textContent = '−';
      } else {
        scheduledContent.style.display = 'none';
        collapseScheduled.textContent = '+';
      }
    });
  }

  // Load current settings
  chrome.runtime.sendMessage({ action: 'getAutoLockSettings' }, (response) => {
    if (response && autoLockToggle) {
      const isActive = response.enabled;
      autoLockToggle.classList.toggle('active', isActive);
      if (autoLockOptions) {
        autoLockOptions.style.display = isActive ? 'block' : 'none';
      }

      // Set active duration button
      const durationButtons = document.querySelectorAll('.duration-btn');
      durationButtons.forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.duration) === response.duration) {
          btn.classList.add('active');
        }
      });

      // Set active scope button
      const scopeButtons = document.querySelectorAll('.scope-btn');
      scopeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.scope === response.scope) {
          btn.classList.add('active');
        }
      });

      updateAutoLockStatus(response.enabled, response.duration);
    }
  });

  chrome.runtime.sendMessage({ action: 'getScheduledLockSettings' }, (response) => {
    if (response && scheduledLockToggle) {
      const isActive = response.enabled;
      scheduledLockToggle.classList.toggle('active', isActive);
      if (scheduledOptions) {
        scheduledOptions.style.display = isActive ? 'block' : 'none';
      }

      // Set time inputs
      const scheduleStart = document.getElementById('scheduleStart');
      const scheduleEnd = document.getElementById('scheduleEnd');
      if (scheduleStart) scheduleStart.value = response.startTime;
      if (scheduleEnd) scheduleEnd.value = response.endTime;

      // Set active scope button for scheduled lock
      const scheduleScopeButtons = document.querySelectorAll('.schedule-scope-buttons .scope-btn');
      scheduleScopeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.scope === response.scope) {
          btn.classList.add('active');
        }
      });

      updateScheduledStatus(response.enabled, response.startTime, response.endTime, response.currentlyActive);
    }
  });

  // Auto-lock toggle
  if (autoLockToggle) {
    autoLockToggle.addEventListener('click', () => {
      const isActive = !autoLockToggle.classList.contains('active');
      autoLockToggle.classList.toggle('active', isActive);

      if (autoLockOptions) {
        autoLockOptions.style.display = isActive ? 'block' : 'none';
      }

      // Get current duration
      const activeBtn = document.querySelector('.duration-btn.active');
      const duration = activeBtn ? parseInt(activeBtn.dataset.duration) : 1800000; // Default 30 min

      chrome.runtime.sendMessage({
        action: 'setAutoLock',
        enabled: isActive,
        duration: duration
      }, (response) => {
        if (response && response.success) {
          updateAutoLockStatus(isActive, duration);
        }
      });
    });
  }

  // Duration buttons
  const durationButtons = document.querySelectorAll('.duration-btn');
  durationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      durationButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const duration = parseInt(btn.dataset.duration);
      chrome.runtime.sendMessage({
        action: 'setAutoLock',
        enabled: true,
        duration: duration
      }, (response) => {
        if (response && response.success) {
          updateAutoLockStatus(true, duration);
          if (autoLockToggle) autoLockToggle.classList.add('active');
          if (autoLockOptions) autoLockOptions.style.display = 'block';
        }
      });
    });
  });

  // Custom duration
  const setCustomDuration = document.getElementById('setCustomDuration');
  const customDuration = document.getElementById('customDuration');
  if (setCustomDuration && customDuration) {
    setCustomDuration.addEventListener('click', () => {
      const minutes = parseInt(customDuration.value);
      if (minutes && minutes > 0 && minutes <= 480) {
        const duration = minutes * 60 * 1000;

        // Clear active state from preset buttons
        durationButtons.forEach(b => b.classList.remove('active'));

        chrome.runtime.sendMessage({
          action: 'setAutoLock',
          enabled: true,
          duration: duration
        }, (response) => {
          if (response && response.success) {
            updateAutoLockStatus(true, duration);
            if (autoLockToggle) autoLockToggle.classList.add('active');
            if (autoLockOptions) autoLockOptions.style.display = 'block';
            customDuration.value = '';
          }
        });
      } else {
        showAutoLockStatus('Please enter 1-480 minutes', 'error');
      }
    });
  }

  // Scheduled lock toggle
  if (scheduledLockToggle) {
    scheduledLockToggle.addEventListener('click', () => {
      const isActive = !scheduledLockToggle.classList.contains('active');
      scheduledLockToggle.classList.toggle('active', isActive);

      if (scheduledOptions) {
        scheduledOptions.style.display = isActive ? 'block' : 'none';
      }

      // Only disable when toggling off, don't auto-enable with default values
      if (!isActive) {
        chrome.runtime.sendMessage({
          action: 'setScheduledLock',
          enabled: false
        }, (response) => {
          if (response && response.success) {
            showScheduledStatus('Scheduled lock disabled', 'info');
          }
        });
      } else {
        // Just show the options, don't enable yet
        showScheduledStatus('Configure your schedule and click "Save Schedule"', 'info');
      }
    });
  }

  // Set schedule button
  const setSchedule = document.getElementById('setSchedule');
  if (setSchedule) {
    setSchedule.addEventListener('click', () => {
      const scheduleStart = document.getElementById('scheduleStart');
      const scheduleEnd = document.getElementById('scheduleEnd');
      const activeScopeBtn = document.querySelector('.schedule-scope-buttons .scope-btn.active');
      const scope = activeScopeBtn ? activeScopeBtn.dataset.scope : 'all';

      if (scheduleStart && scheduleEnd) {
        chrome.runtime.sendMessage({
          action: 'setScheduledLock',
          enabled: true,
          startTime: scheduleStart.value,
          endTime: scheduleEnd.value,
          scope: scope
        }, (response) => {
          if (response && response.success) {
            updateScheduledStatus(true, scheduleStart.value, scheduleEnd.value, false);
            if (scheduledLockToggle) scheduledLockToggle.classList.add('active');
            if (scheduledOptions) scheduledOptions.style.display = 'block';
            showScheduledStatus('Schedule saved successfully!', 'success');
          }
        });
      }
    });
  }

  // Preset buttons
  const presetButtons = document.querySelectorAll('.preset-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const startTime = btn.dataset.start;
      const endTime = btn.dataset.end;

      const scheduleStart = document.getElementById('scheduleStart');
      const scheduleEnd = document.getElementById('scheduleEnd');
      const activeScopeBtn = document.querySelector('.schedule-scope-buttons .scope-btn.active');
      const scope = activeScopeBtn ? activeScopeBtn.dataset.scope : 'all';

      if (scheduleStart) scheduleStart.value = startTime;
      if (scheduleEnd) scheduleEnd.value = endTime;

      chrome.runtime.sendMessage({
        action: 'setScheduledLock',
        enabled: true,
        startTime: startTime,
        endTime: endTime,
        scope: scope
      }, (response) => {
        if (response && response.success) {
          updateScheduledStatus(true, startTime, endTime, false);
          if (scheduledLockToggle) scheduledLockToggle.classList.add('active');
          if (scheduledOptions) scheduledOptions.style.display = 'block';
          showScheduledStatus('Preset applied!', 'success');
        }
      });
    });
  });

  // Scheduled lock scope buttons
  const scheduleScopeButtons = document.querySelectorAll('.schedule-scope-buttons .scope-btn');
  scheduleScopeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      scheduleScopeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Just update the UI, don't send message yet
      // The scope will be saved when user clicks "Save Schedule" or a preset
      const scope = btn.dataset.scope;
      const scopeText = scope === 'all' ? 'all tabs' : 'active tab only';
      showScheduledStatus(`Scope set to ${scopeText} (click "Save Schedule" to apply)`, 'info');
    });
  });

  // Scope buttons (auto-lock)
  const scopeButtons = document.querySelectorAll('.lock-scope-buttons:not(.schedule-scope-buttons) .scope-btn');
  scopeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      scopeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const scope = btn.dataset.scope;

      // Get current settings
      const activeBtn = document.querySelector('.duration-btn.active');
      const duration = activeBtn ? parseInt(activeBtn.dataset.duration) : 1800000; // Default 30 min
      const isEnabled = autoLockToggle ? autoLockToggle.classList.contains('active') : false;

      chrome.runtime.sendMessage({
        action: 'setAutoLock',
        enabled: isEnabled,
        duration: duration,
        scope: scope
      }, (response) => {
        if (response && response.success) {
          const scopeText = scope === 'all' ? 'all tabs' : 'active tab only';
          showAutoLockStatus(`Lock scope set to ${scopeText}`, 'success');
        }
      });
    });
  });
}

function updateAutoLockStatus(enabled, duration) {
  const minutes = Math.floor(duration / 60000);
  const statusText = enabled ? `🟢 Active - Locks after ${minutes} min of inactivity` : '⚪ Inactive';
  showAutoLockStatus(statusText, enabled ? 'success' : 'info');
}

function showAutoLockStatus(message, type) {
  const statusDiv = document.getElementById('autoLockStatus');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = 'status-message ' + type;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

function updateScheduledStatus(enabled, startTime, endTime, currentlyActive) {
  const statusText = enabled
    ? `🟢 Active - Locks from ${startTime} to ${endTime}${currentlyActive ? ' (Active now)' : ''}`
    : '⚪ Inactive';
  showScheduledStatus(statusText, enabled ? 'success' : 'info');
}

function showScheduledStatus(message, type) {
  const statusDiv = document.getElementById('scheduledStatus');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = 'status-message ' + type;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// ============================================================================
// WHAT'S NEW OVERLAY FUNCTIONALITY
// ============================================================================

function showWhatsNewOverlay(version) {
  const overlay = document.getElementById('whatsNewOverlay');
  const versionBadge = document.getElementById('whatsNewVersion');
  const dismissBtn = document.getElementById('dismissWhatsNew');

  if (!overlay) return;

  // Set version
  if (versionBadge && version) {
    versionBadge.textContent = 'v' + version;
  }

  // Show overlay
  overlay.style.display = 'block';

  // Handle dismiss button
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      // Hide overlay
      overlay.style.display = 'none';

      // Mark as seen
      chrome.storage.local.set({ showWhatsNew: false }, () => {
        // Continue with normal initialization
        proceedWithNormalInitialization();
      });
    });
  }

  // Handle external changelog link (allow default behavior)
  const changelogLink = overlay.querySelector('.changelog-link');
  if (changelogLink) {
    changelogLink.addEventListener('click', (e) => {
      // Let it open in new tab (default behavior for target="_blank")
      // After opening, user can still dismiss the overlay to continue
    });
  }
}
