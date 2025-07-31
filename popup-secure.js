// SECURE Popup Script - VERSION 3.0 - FIXED CRITICAL SECURITY VULNERABILITY
console.log("Popup script loaded - VERSION 3.0 - SECURE PASSWORD MANAGEMENT");

// State management
let isExtensionActive = false;
let hasExistingPassword = false;
let initialized = false;

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
        console.log("Starting SECURE extension initialization...");

        // Check if document is ready
        if (!document || !document.getElementById) {
            console.error("Document not ready");
            setTimeout(initializeExtension, 100);
            return;
        }

        // Get all required elements
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

    } catch (error) {
        console.error("Critical error during secure initialization:", error);
    }
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
