// SECURE Popup Script - VERSION 4.0 - ULTIMATE SECURITY WITH EXTENSION ACCESS CONTROL
console.log("Popup script loaded - VERSION 4.0 - ULTIMATE SECURITY IMPLEMENTATION");

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
    console.log("DOM content loaded, starting initialization...");
    if (!initialized) {
      initialized = true;
      setTimeout(initializeExtension, 50);
    }
  });
} else {
  // DOM is already loaded
  console.log("DOM already loaded, starting initialization...");
  if (!initialized) {
    initialized = true;
    setTimeout(initializeExtension, 50);
  }
}

function initializeExtension() {
  try {
    console.log("Starting ULTIMATE SECURE extension initialization...");

    // Check if document is ready
    if (!document || !document.getElementById) {
      console.error("Document not ready");
      setTimeout(initializeExtension, 100);
      return;
    }

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

  } catch (error) {
    console.error("Critical error during secure initialization:", error);
  }
}

// SECURITY: Show lockout screen after too many failed attempts
function showLockoutScreen(remainingTime) {
  const container = document.querySelector('.container');
  const minutes = Math.ceil(remainingTime / 60000);

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 64px; margin-bottom: 20px;">🔒</div>
      <h2 style="color: #dc3545; margin-bottom: 16px;">Extension Locked</h2>
      <p style="color: #6c757d; margin-bottom: 20px;">
        Too many failed authentication attempts.<br>
        Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.
      </p>
      <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 12px; margin-top: 20px;">
        <p style="margin: 0; font-size: 12px; color: #721c24; font-weight: 500;">
          <strong>🛡️ Security Measure:</strong> This extension is temporarily locked to prevent brute force attacks.
        </p>
      </div>
    </div>
  `;

  // Auto-refresh when lockout expires
  setTimeout(() => {
    location.reload();
  }, remainingTime);
}

// SECURITY: Show authentication screen for existing password
function showAuthenticationScreen() {
  const container = document.querySelector('.container');

  container.innerHTML = `
    <div style="text-align: center; padding: 30px 20px;">
      <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
      <h2 style="color: #2c3e50; margin-bottom: 12px;">Authentication Required</h2>
      <p style="color: #6c757d; margin-bottom: 25px;">
        Enter your master password to access the extension
      </p>
      
      <div style="text-align: left;">
        <input type="password" id="authPassword" placeholder="Enter your master password" 
               style="width: 100%; padding: 14px 18px; margin: 10px 0; border: 2px solid #e9ecef; 
                      border-radius: 12px; font-size: 15px; background: white; 
                      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);" />
        
        <button id="authButton" class="btn-primary" 
                style="width: 100%; padding: 14px 18px; margin: 10px 0; border: none; 
                       border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; 
                       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;
                       box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
          Authenticate
        </button>
      </div>
      
      <div id="authError" style="color: #dc3545; font-size: 14px; margin-top: 10px; opacity: 0; 
                                 transition: opacity 0.3s ease;"></div>
      
      <div style="margin-top: 20px; padding: 12px; background: #d1f2eb; border-radius: 8px; border-left: 4px solid #28a745;">
        <p style="margin: 0; font-size: 12px; color: #155724; font-weight: 500;">
          <strong>🛡️ Security:</strong> Failed attempts: ${failedAttempts}/${MAX_FAILED_ATTEMPTS}
        </p>
      </div>
      
      ${failedAttempts > 0 ? `
      <div style="margin-top: 12px; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-size: 12px; color: #856404; font-weight: 500;">
          <strong>⚠️ Warning:</strong> ${MAX_FAILED_ATTEMPTS - failedAttempts} attempt${MAX_FAILED_ATTEMPTS - failedAttempts !== 1 ? 's' : ''} remaining before lockout
        </p>
      </div>` : ''}
    </div>
  `;

  const authPassword = document.getElementById('authPassword');
  const authButton = document.getElementById('authButton');
  const authError = document.getElementById('authError');

  // Focus on password input
  setTimeout(() => authPassword.focus(), 100);

  // Enter key support
  authPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      authButton.click();
    }
  });

  // Authentication handler
  authButton.addEventListener('click', () => {
    const password = authPassword.value.trim();

    if (!password) {
      showAuthError('Please enter your password');
      return;
    }

    // Show loading state
    authButton.textContent = 'Verifying...';
    authButton.disabled = true;

    chrome.storage.local.get(['lockPassword'], (data) => {
      setTimeout(() => { // Add delay for better UX
        if (data.lockPassword === password) {
          // Authentication successful
          isAuthenticated = true;
          resetFailedAttempts();
          startSessionTimeout();
          initializeMainUI();
          showNotification('Authentication successful!', 'success');
        } else {
          // Authentication failed
          handleFailedAuth();
          authButton.textContent = 'Authenticate';
          authButton.disabled = false;
          authPassword.value = '';
          authPassword.focus();
        }
      }, 500);
    });
  });

  function showAuthError(message) {
    authError.textContent = message;
    authError.style.opacity = '1';
    authPassword.style.borderColor = '#dc3545';

    setTimeout(() => {
      authError.style.opacity = '0';
      authPassword.style.borderColor = '#e9ecef';
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
        <span class="header-icon">SECURE</span>
        Secure Tab Extension
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

      <div class="button-group">
        <button id="lockTab" class="btn-warning">🔒 Lock Current Tab</button>
      </div>

      <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-size: 12px; color: #856404; font-weight: 500;">
          <strong>🛡️ Security:</strong> To change password, you must enter your current password first. No bypass methods available.
        </p>
      </div>

      <div style="margin-top: 12px; padding: 12px; background: #d1f2eb; border-radius: 8px; border-left: 4px solid #28a745;">
        <p style="margin: 0; font-size: 12px; color: #155724; font-weight: 500;">
          <strong>💡 Tip:</strong> Locked tabs can only be unlocked by entering the correct password on the tab itself.
        </p>
      </div>

      ${isAuthenticated ? `
      <div style="margin-top: 12px; padding: 12px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
        <p style="margin: 0; font-size: 12px; color: #155724; font-weight: 500;">
          <strong>🔓 Authenticated:</strong> Session expires in ${Math.round(SESSION_TIMEOUT / 60000)} minutes for security.
        </p>
      </div>` : ''}
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
  const strengthIndicator = document.getElementById("passwordStrengthIndicator");
  const strengthText = document.getElementById("strengthText");
  const strengthBar = document.getElementById("strengthBar");

  // Enhanced element validation
  const requiredElements = {
    toggleSwitch, statusIndicator, statusText, statusDot, controlsSection,
    passwordInput, currentPasswordInput, currentPasswordGroup, passwordLabel,
    setPasswordBtn, lockTabBtn, strengthIndicator, strengthText, strengthBar
  };

  // Check for missing elements
  const missingElements = [];
  for (const [name, element] of Object.entries(requiredElements)) {
    if (!element) {
      missingElements.push(name);
    }
  }

  if (missingElements.length > 0) {
    console.error("Missing required elements:", missingElements);
    return;
  }

  console.log("All security elements found successfully!");

  // Load extension state and check for existing password
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(["extensionActive", "lockPassword"], (data) => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        isExtensionActive = true;
        hasExistingPassword = false;
      } else {
        isExtensionActive = data.extensionActive !== false;
        hasExistingPassword = !!data.lockPassword;
        console.log("Security Status:", { isActive: isExtensionActive, hasPassword: hasExistingPassword });
      }
      updateSecureUI();
    });
  } else {
    console.error("Chrome storage not available");
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
        chrome.storage.local.set({ extensionActive: isExtensionActive });
      }
    } catch (error) {
      console.error("Error updating secure UI:", error);
    }
  }

  // CRITICAL SECURITY FUNCTION: Update Password UI
  function updatePasswordUI() {
    if (hasExistingPassword) {
      // Password exists - require current password to change
      currentPasswordGroup.style.display = "block";
      passwordLabel.textContent = "🔄 New Password";
      passwordInput.placeholder = "Enter new master password";
      setPasswordBtn.textContent = "Change Password";
      setPasswordBtn.className = "btn-warning";

      console.log("SECURITY: Existing password detected - requiring current password verification");
    } else {
      // No password exists - first time setup
      currentPasswordGroup.style.display = "none";
      passwordLabel.textContent = "🔑 Set Master Password";
      passwordInput.placeholder = "Set Your Master Password";
      setPasswordBtn.textContent = "Set Password";
      setPasswordBtn.className = "btn-primary";

      console.log("SECURITY: No existing password - first time setup mode");
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
        console.log(`SECURITY: Extension ${status}`);
      } catch (error) {
        console.error("Error toggling extension:", error);
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
              chrome.runtime.sendMessage({
                action: "lock",
                tabId: tabs[0].id
              });
              showNotification("Locking current tab...", "info");
            }
          });
        });
      } catch (error) {
        console.error("Error locking tab:", error);
        showNotification("Error locking tab", "error");
      }
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
        chrome.storage.local.get("lockPassword", (data) => {
          if (data.lockPassword !== currentPassword) {
            showNotification("Current password is incorrect!", "error");
            currentPasswordInput.value = "";
            currentPasswordInput.focus();

            // Security log
            console.warn("SECURITY: Failed password change attempt - incorrect current password");
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
      console.error("Error in secure password change:", error);
      showNotification("Error changing password", "error");
    }
  }

  // SECURE PASSWORD SAVE FUNCTION
  function saveNewPassword(password, isChange) {
    chrome.storage.local.set({ lockPassword: password }, () => {
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

      // Security log
      console.log(`SECURITY: Password ${action} successfully`);
    });
  }

  console.log("SECURE extension initialization completed!");
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
    console.error("Error showing notification:", error);
    alert(message); // Fallback to alert
  }
}
