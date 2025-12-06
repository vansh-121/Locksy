// SECURE Popup Script - VERSION 4.0 - ULTIMATE SECURITY WITH EXTENSION ACCESS CONTROL

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
    // Critical error during initialization
  }
}

// SECURITY: Show lockout screen after too many failed attempts
function showLockoutScreen(remainingTime) {
  const container = document.querySelector('.container');
  const minutes = Math.ceil(remainingTime / 60000);

  container.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <img src="../../assets/images/icon.png" alt="Locksy" style="width: 64px; height: 64px; margin-bottom: 20px; border-radius: 12px;">
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

      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
        <button id="toggleDeveloperInfo" class="btn-developer-toggle" style="width: 100%; padding: 12px 18px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); opacity: 0.9;">
          👨‍💻 Developer Info
        </button>
      </div>
    </div>
  `;

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
      
      ${failedAttempts > 0 ? `
      <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
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

    chrome.storage.local.get(['lockPassword'], async (data) => {
      setTimeout(async () => {
        const isMatch = await verifyPassword(password, data.lockPassword);
        if (isMatch) {
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
      // Detect browser and open appropriate shortcuts page
      const userAgent = navigator.userAgent.toLowerCase();
      let shortcutsUrl = 'chrome://extensions/shortcuts';

      if (userAgent.includes('edg/')) {
        shortcutsUrl = 'edge://extensions/shortcuts';
      } else if (userAgent.includes('brave')) {
        shortcutsUrl = 'brave://extensions/shortcuts';
      } else if (userAgent.includes('opr/') || userAgent.includes('opera')) {
        shortcutsUrl = 'opera://extensions/shortcuts';
      } else if (userAgent.includes('vivaldi')) {
        shortcutsUrl = 'vivaldi://extensions/shortcuts';
      }

      // Open shortcuts page in new tab
      chrome.tabs.create({ url: shortcutsUrl }, () => {
        if (chrome.runtime.lastError) {
          // Fallback if direct navigation fails
          showNotification("⚙️ Please manually navigate to your browser's extensions shortcuts page", "info");
        } else {
          showNotification("✅ Opening keyboard shortcuts page...", "success");
        }
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
          const isMatch = await verifyPassword(currentPassword, data.lockPassword);
          if (!isMatch) {
            showNotification("Current password is incorrect!", "error");
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
