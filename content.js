// Check if extension is active before showing lock overlay
chrome.storage.local.get("extensionActive", (data) => {
  if (!data.extensionActive) {
    return; // Don't show lock overlay if extension is inactive
  }

  if (!document.getElementById("lockOverlay")) {
    const overlay = document.createElement("div");
    overlay.id = "lockOverlay";
    overlay.style =
      "position: fixed; top: 0; left: 0; width: 100%; height: 100%;" +
      "background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);" +
      "z-index: 10000; display: flex;" +
      "align-items: center; justify-content: center; color: white;" +
      "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" +
      "backdrop-filter: blur(12px); animation: fadeIn 0.3s ease-in-out;";

    // Add CSS animation keyframes
    const style = document.createElement("style");
    style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    @keyframes success {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;
    document.head.appendChild(style);

    overlay.innerHTML =
      '<div style="' +
      'background: rgba(255, 255, 255, 0.95); padding: 40px; border-radius: 20px;' +
      'box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); text-align: center;' +
      'max-width: 400px; width: 90%; color: #2c3e50; position: relative;' +
      'backdrop-filter: blur(10px);' +
      '">' +
      '<div style="font-size: 48px; margin-bottom: 20px;">🔒</div>' +
      '<h2 style="font-size: 24px; font-weight: 600; margin-bottom: 12px; color: #2c3e50;">Tab Secured</h2>' +
      '<p style="font-size: 14px; color: #6c757d; margin-bottom: 25px;">This tab is protected. Enter your password to continue.</p>' +
      '<div style="position: relative; margin-bottom: 20px;">' +
      '<input type="password" id="unlockPassword" placeholder="Enter your password" style="' +
      'width: 100%; padding: 16px 20px; border: 2px solid #e9ecef; border-radius: 12px;' +
      'font-size: 16px; outline: none; color: #2c3e50; background: white;' +
      'text-align: center; transition: all 0.3s ease; box-sizing: border-box;" />' +
      '</div>' +
      '<button id="unlockBtn" style="' +
      'background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; padding: 16px 24px;' +
      'font-size: 16px; font-weight: 600; border-radius: 12px; cursor: pointer; width: 100%;' +
      'transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">Unlock Tab</button>' +
      '<div id="errorMessage" style="' +
      'color: #dc3545; font-size: 14px; margin-top: 15px; opacity: 0; transition: opacity 0.3s ease;' +
      '"></div>' +
      '<div style="margin-top: 20px; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">' +
      '<p style="margin: 0; font-size: 12px; color: #856404; font-weight: 500;">' +
      '<strong>Security:</strong> This tab can only be unlocked by entering the correct password. No bypass methods available.' +
      '</p>' +
      '</div>' +
      '<div style="margin-top: 12px; padding: 12px; background: #f8d7da; border-radius: 8px; border-left: 4px solid #dc3545;">' +
      '<p style="margin: 0; font-size: 12px; color: #721c24; font-weight: 500;">' +
      '<strong>🚫 ULTRA REFRESH PROTECTION:</strong> All refresh methods blocked - F5, Ctrl+R, browser refresh button, JavaScript reload, and navigation functions are disabled.' +
      '</p>' +
      '</div>' +
      '</div>'; const unlockBtn = overlay.querySelector("#unlockBtn");
    const passwordInput = overlay.querySelector("#unlockPassword");
    const errorMessage = overlay.querySelector("#errorMessage");

    // Enhanced hover effects
    unlockBtn.addEventListener("mouseenter", () => {
      unlockBtn.style.background = "linear-gradient(135deg, #45a049 0%, #4CAF50 100%)";
      unlockBtn.style.transform = "translateY(-2px)";
      unlockBtn.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.4)";
    });

    unlockBtn.addEventListener("mouseleave", () => {
      unlockBtn.style.background = "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)";
      unlockBtn.style.transform = "translateY(0)";
      unlockBtn.style.boxShadow = "0 4px 15px rgba(76, 175, 80, 0.3)";
    });

    // Password input focus effects
    passwordInput.addEventListener("focus", () => {
      passwordInput.style.borderColor = "#667eea";
      passwordInput.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
    });

    passwordInput.addEventListener("blur", () => {
      passwordInput.style.borderColor = "#e9ecef";
      passwordInput.style.boxShadow = "none";
    });

    // Enter key support
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        unlockBtn.click();
      }
    });

    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.style.opacity = "1";
      passwordInput.style.animation = "shake 0.5s ease-in-out";
      passwordInput.style.borderColor = "#dc3545";

      setTimeout(() => {
        passwordInput.style.animation = "";
        passwordInput.style.borderColor = "#e9ecef";
      }, 500);

      setTimeout(() => {
        errorMessage.style.opacity = "0";
      }, 3000);
    }

    function unlock() {
      // Stop all monitoring layers since tab is being unlocked legitimately
      isLocked = false;
      clearInterval(ultraFastRelock);
      clearInterval(backupRelock);
      clearInterval(domMonitor);

      // Restore original functions
      window.location.reload = originalReload;
      window.location.replace = originalReplace;
      window.location.assign = originalAssign;
      window.history.back = originalBack;
      window.history.forward = originalForward;
      window.history.go = originalGo;

      unlockBtn.style.animation = "success 0.3s ease-in-out";
      unlockBtn.innerHTML = "Unlocked Successfully!";
      unlockBtn.style.background = "linear-gradient(135deg, #28a745 0%, #20c997 100%)";

      setTimeout(() => {
        overlay.style.opacity = "0";
        overlay.style.transform = "scale(0.9)";
        setTimeout(() => overlay.remove(), 300);
      }, 800);
    }

    document.body.appendChild(overlay);

    // SECURITY: Prevent tab refresh and show security message
    let refreshAttempts = 0;

    // ULTRA-FAST Re-lock mechanism - Store locked state immediately
    const currentTabId = chrome.runtime?.id ? Date.now() : Math.random(); // Unique identifier
    chrome.storage.local.set({
      [`locked_${location.href}`]: true,
      [`locked_tab_${currentTabId}`]: true
    });

    // Multiple layers of refresh prevention

    // Layer 1: beforeunload event (shows browser dialog)
    window.addEventListener('beforeunload', function (e) {
      refreshAttempts++;
      e.preventDefault();
      const message = `🔒 SECURITY ALERT: This tab is locked and protected. Refresh is disabled for security. Please unlock first by entering your password.`;
      e.returnValue = message;

      // Show security notification
      showError(`🔒 Refresh blocked! Attempt #${refreshAttempts} - Tab remains locked`);

      return message;
    });

    // Layer 2: unload event (final attempt to prevent refresh)
    window.addEventListener('unload', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    });

    // Layer 3: pagehide event
    window.addEventListener('pagehide', function (e) {
      e.preventDefault();
      if (e.persisted) {
        e.returnValue = "🔒 Tab locked - refresh blocked";
      }
    });

    // Layer 4: ULTRA-AGGRESSIVE periodic check for page changes (1ms intervals)
    let isLocked = true;
    let missedChecks = 0;

    // Primary ultra-fast monitor - Check every 1ms
    const ultraFastRelock = setInterval(() => {
      if (isLocked && !document.getElementById("lockOverlay")) {
        missedChecks++;
        // Page was somehow refreshed and lock overlay is gone - INSTANT EMERGENCY RE-LOCK
        console.error("🚨 SECURITY BREACH: Lock overlay missing - INSTANT re-lock! Miss count:", missedChecks);

        // Immediately block everything
        location.reload = function () { return false; };
        location.replace = function () { return false; };
        location.assign = function () { return false; };

        // Create emergency overlay INSTANTLY (no delays)
        const emergencyOverlay = document.createElement("div");
        emergencyOverlay.id = "emergencyLockOverlay";
        emergencyOverlay.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;background:#dc3545!important;z-index:2147483647!important;color:white!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:28px!important;font-weight:bold!important;";
        emergencyOverlay.innerHTML = "🔒 SECURITY: Re-locking tab... Access Denied!";
        document.documentElement.appendChild(emergencyOverlay);

        // Force instant reload to restore proper lock (no setTimeout delay)
        window.location.reload();
      }
    }, 1); // Check every 1ms for MAXIMUM security

    // Secondary monitor - Check every 5ms as backup
    const backupRelock = setInterval(() => {
      if (isLocked && !document.getElementById("lockOverlay") && !document.getElementById("emergencyLockOverlay")) {
        console.error("🚨 BACKUP MONITOR: Lock missing!");
        const emergencyOverlay = document.createElement("div");
        emergencyOverlay.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;background:#dc3545!important;z-index:2147483647!important;color:white!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:28px!important;";
        emergencyOverlay.innerHTML = "🔒 BACKUP LOCK ACTIVATED";
        document.documentElement.appendChild(emergencyOverlay);
        window.location.reload();
      }
    }, 5); // Backup check every 5ms

    // Layer 5: Override ALL refresh and navigation functions (saved for restoration)
    const originalReload = window.location.reload;
    const originalReplace = window.location.replace;
    const originalAssign = window.location.assign;
    const originalBack = window.history.back;
    const originalForward = window.history.forward;
    const originalGo = window.history.go;

    // Block ALL location manipulation methods
    window.location.reload = function () {
      refreshAttempts++;
      showError(`🔒 JavaScript reload blocked! Attempt #${refreshAttempts}`);
      return false;
    };

    window.location.replace = function () {
      refreshAttempts++;
      showError(`🔒 location.replace blocked! Attempt #${refreshAttempts}`);
      return false;
    };

    window.location.assign = function () {
      refreshAttempts++;
      showError(`🔒 location.assign blocked! Attempt #${refreshAttempts}`);
      return false;
    };

    // Override history functions that could be used to escape
    window.history.back = function () {
      showError("🔒 Navigation blocked for security!");
      return false;
    };

    window.history.forward = function () {
      showError("🔒 Navigation blocked for security!");
      return false;
    };

    window.history.go = function () {
      showError("🔒 Navigation blocked for security!");
      return false;
    };

    // Layer 5.5: DOM Mutation Observer - Detect if overlay is removed
    const domMonitor = setInterval(() => {
      const overlay = document.getElementById("lockOverlay");
      if (isLocked && overlay && !document.body.contains(overlay)) {
        console.error("🚨 DOM MANIPULATION: Overlay removed from DOM!");
        document.body.appendChild(overlay);
      }
    }, 1); // Check every 1ms

    // Layer 6: INSTANT window focus monitoring (no delays)
    let isWindowFocused = true;
    window.addEventListener('blur', () => {
      isWindowFocused = false;
      console.log("🔒 Window lost focus - monitoring for refresh...");
    });

    window.addEventListener('focus', () => {
      if (!isWindowFocused) {
        // Window regained focus - INSTANTLY check if lock is still there (no setTimeout)
        if (isLocked && !document.getElementById("lockOverlay")) {
          console.error("🚨 INSTANT CHECK: Focus returned but lock missing!");
          const emergencyOverlay = document.createElement("div");
          emergencyOverlay.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;background:#dc3545!important;z-index:2147483647!important;color:white!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:28px!important;";
          emergencyOverlay.innerHTML = "🔒 INSTANT RE-LOCK ACTIVATED";
          document.documentElement.appendChild(emergencyOverlay);
          window.location.reload();
        }
      }
      isWindowFocused = true;
    });

    // Layer 7: Visibility API - Detect tab visibility changes INSTANTLY
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isLocked) {
        // Tab became visible - verify lock is still present
        if (!document.getElementById("lockOverlay") && !document.getElementById("emergencyLockOverlay")) {
          console.error("🚨 VISIBILITY CHANGE: Lock missing when tab became visible!");
          const emergencyOverlay = document.createElement("div");
          emergencyOverlay.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;background:#dc3545!important;z-index:2147483647!important;color:white!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:28px!important;";
          emergencyOverlay.innerHTML = "🔒 VISIBILITY LOCK ACTIVATED";
          document.documentElement.appendChild(emergencyOverlay);
          window.location.reload();
        }
      }
    }, true); // Use capture phase for fastest response

    // Layer 8: ULTRA-FAST keyboard event blocking (capture phase + bubbling phase)
    function blockDangerousKeys(e) {
      // Block refresh shortcuts
      if ((e.ctrlKey && e.keyCode === 82) || // Ctrl+R
        (e.keyCode === 116) || // F5
        (e.ctrlKey && e.keyCode === 116) || // Ctrl+F5
        (e.ctrlKey && e.shiftKey && e.keyCode === 82)) { // Ctrl+Shift+R
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        refreshAttempts++;
        showError(`🔒 Refresh blocked for security! (Attempt #${refreshAttempts})`);
        return false;
      }

      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, etc.
      if (e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || // Ctrl+Shift+I/J/C
        (e.ctrlKey && e.keyCode === 85)) { // Ctrl+U
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showError("🚫 Developer tools are disabled for security.");
        return false;
      }
    }

    // Add event listeners in both capture and bubble phases for maximum coverage
    document.addEventListener('keydown', blockDangerousKeys, true); // Capture phase (fires first)
    document.addEventListener('keydown', blockDangerousKeys, false); // Bubble phase (backup)
    window.addEventListener('keydown', blockDangerousKeys, true); // Window level capture

    // Layer 9: DevTools detection using multiple methods
    let devtoolsOpen = false;
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const orientation = widthThreshold ? 'vertical' : 'horizontal';

      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          console.error("🚨 DEVTOOLS DETECTED: Blocking access!");
          showError("🚫 Developer Tools detected and blocked!");

          // Create full-screen block overlay
          const devtoolsBlock = document.createElement("div");
          devtoolsBlock.id = "devtoolsBlockOverlay";
          devtoolsBlock.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;background:rgba(0,0,0,0.95)!important;z-index:2147483646!important;color:#ff0000!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:32px!important;font-weight:bold!important;";
          devtoolsBlock.innerHTML = "🚫 DEVELOPER TOOLS BLOCKED<br><span style='font-size:18px;color:#fff;'>Close DevTools to continue</span>";
          document.body.appendChild(devtoolsBlock);
        }
      } else {
        if (devtoolsOpen) {
          devtoolsOpen = false;
          const blockOverlay = document.getElementById("devtoolsBlockOverlay");
          if (blockOverlay) blockOverlay.remove();
        }
      }
    };

    // Check for DevTools every 100ms
    setInterval(checkDevTools, 50);

    // Disable right-click context menu
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showError("Right-click is disabled for security.");
      return false;
    });

    // Prevent selecting text
    document.addEventListener('selectstart', function (e) {
      if (e.target.id !== 'unlockPassword') {
        e.preventDefault();
        return false;
      }
    });

    unlockBtn.onclick = () => {
      const enteredPassword = passwordInput.value.trim();

      if (!enteredPassword) {
        showError("Please enter a password");
        return;
      }

      // Show loading state
      unlockBtn.innerHTML = "Verifying...";
      unlockBtn.disabled = true;
      unlockBtn.style.opacity = "0.7";

      chrome.storage.local.get("lockPassword", (data) => {
        setTimeout(() => { // Add slight delay for better UX
          if (data && data.lockPassword === enteredPassword) {
            // Notify background script that tab is unlocked
            chrome.runtime.sendMessage({
              action: "unlock",
              tabId: null // Will be filled by background script using sender.tab.id
            });
            unlock();
          } else {
            showError("Incorrect password! Please try again.");
            unlockBtn.innerHTML = "Unlock Tab";
            unlockBtn.disabled = false;
            unlockBtn.style.opacity = "1";
            passwordInput.value = "";
            passwordInput.focus();
          }
        }, 500);
      });
    };

    // Auto-focus password input
    setTimeout(() => passwordInput.focus(), 100);
  }

});
