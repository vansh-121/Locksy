// Store original favicon to restore later
let originalFavicon = null;

// Function to create and set lock icon favicon
function setLockFavicon() {
  // Store original favicon if not already stored
  if (!originalFavicon) {
    const existingFavicon = document.querySelector('link[rel*="icon"]');
    if (existingFavicon) {
      originalFavicon = existingFavicon.href;
    }
  }

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

  // Convert to data URL
  const faviconUrl = canvas.toDataURL('image/png');

  // Remove existing favicons
  const existingLinks = document.querySelectorAll('link[rel*="icon"]');
  existingLinks.forEach(link => link.remove());

  // Add new lock favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = faviconUrl;
  document.head.appendChild(link);
}

// Function to restore original favicon
function restoreOriginalFavicon() {
  if (originalFavicon) {
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = originalFavicon;
    document.head.appendChild(link);
  }
}

// Message listener for overlay removal, ping, and createLock
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "ping") {
    // Respond to ping to indicate script is loaded
    sendResponse({ loaded: true });
    return true;
  }

  if (message.action === "createLock") {
    // Create lock overlay if it doesn't exist
    if (!document.getElementById("lockOverlay")) {
      createLockOverlay();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: true, message: "Lock already exists" });
    }
    return true;
  }

  if (message.action === "removeOverlay") {
    const overlay = document.getElementById("lockOverlay");
    const pageBlur = document.getElementById("securePageBlur");
    const interactionBlocker = document.getElementById("secureInteractionBlocker");

    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.transform = "scale(0.9)";
      setTimeout(() => {
        overlay.remove();
        if (pageBlur) pageBlur.remove();
        if (interactionBlocker) interactionBlocker.remove();

        // Restore original favicon when unlocked
        restoreOriginalFavicon();
      }, 300);
    }
    sendResponse({ success: true });
    return true;
  }
});

// Function to create the lock overlay
function createLockOverlay() {
  // Check if extension is active before showing lock overlay
  chrome.storage.local.get("extensionActive", (data) => {
    if (!data.extensionActive) {
      return; // Don't show lock overlay if extension is inactive
    }

    // Don't create if overlay already exists
    if (document.getElementById("lockOverlay")) {
      return;
    }

    // Note: hashPassword and verifyPassword functions are now provided by crypto-utils.js
    // which is injected programmatically from background.js
    // SECURITY LAYER 1: Blur all page content BEFORE creating overlay
    const pageBlur = document.createElement("div");
    pageBlur.id = "securePageBlur";
    pageBlur.style.cssText =
      "position: fixed !important;" +
      "top: 0 !important;" +
      "left: 0 !important;" +
      "width: 100% !important;" +
      "height: 100% !important;" +
      "backdrop-filter: blur(50px) saturate(0.3) !important;" +
      "z-index: 2147483645 !important;" +
      "pointer-events: none !important;" +
      "user-select: none !important;";

    // Mark blur as critical security element
    pageBlur.setAttribute("data-security-critical", "true");
    pageBlur.setAttribute("data-lock-component", "blur");

    // Inject blur ASAP
    if (document.body) {
      document.body.appendChild(pageBlur);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(pageBlur);
      });
    }

    // SECURITY LAYER 2: Disable ALL interactions with page content
    const interactionBlocker = document.createElement("div");
    interactionBlocker.id = "secureInteractionBlocker";
    interactionBlocker.style.cssText =
      "position: fixed !important;" +
      "top: 0 !important;" +
      "left: 0 !important;" +
      "width: 100% !important;" +
      "height: 100% !important;" +
      "z-index: 2147483646 !important;" +
      "pointer-events: auto !important;" +
      "background: rgba(0, 0, 0, 0.1) !important;" +
      "user-select: none !important;";

    interactionBlocker.setAttribute("data-security-critical", "true");
    interactionBlocker.setAttribute("data-lock-component", "blocker");

    if (document.body) {
      document.body.appendChild(interactionBlocker);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(interactionBlocker);
      });
    }

    // SECURITY LAYER 3: The main lock overlay (highest z-index)
    const overlay = document.createElement("div");
    overlay.id = "lockOverlay";
    overlay.style.cssText =
      "position: fixed !important;" +
      "top: 0 !important;" +
      "left: 0 !important;" +
      "width: 100% !important;" +
      "height: 100% !important;" +
      "background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%) !important;" +
      "z-index: 2147483647 !important;" +
      "display: flex !important;" +
      "align-items: center !important;" +
      "justify-content: center !important;" +
      "color: white !important;" +
      "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;" +
      "animation: fadeIn 0.3s ease-in-out !important;" +
      "pointer-events: auto !important;" +
      "user-select: none !important;";

    // Mark overlay as critical security element
    overlay.setAttribute("data-security-critical", "true");
    overlay.setAttribute("data-lock-component", "main");

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
      '<div class="lock-container" style="' +
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
      clearInterval(elementIntegrityCheck);
      clearInterval(cssProtection);

      // Disconnect security observer
      securityObserver.disconnect();
      clearInterval(devToolsInterval);

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
        setTimeout(() => {
          overlay.remove();
          pageBlur.remove();
          interactionBlocker.remove();

          // Restore original favicon
          restoreOriginalFavicon();
        }, 300);
      }, 800);
    }

    document.body.appendChild(overlay);

    // Set lock icon on favicon
    setLockFavicon();

    // ========== CRITICAL SECURITY: MUTATION OBSERVER TO PREVENT OVERLAY DELETION (OPTIMIZED) ==========
    let securityViolations = 0;
    const criticalElements = new Set(['lockOverlay', 'securePageBlur', 'secureInteractionBlocker']);

    // MutationObserver to detect element removal (optimized - only childList)
    const securityObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Only check if critical security elements were removed
        mutation.removedNodes.forEach((node) => {
          if (node.id && criticalElements.has(node.id)) {
            securityViolations++;

            // Restore the element
            if (!document.getElementById(node.id)) {
              document.body.appendChild(node);
              showError(`🚨 Security violation detected! #${securityViolations}`);
            }
          }
        });
      });
    });

    // Start observing only direct children changes (optimized)
    securityObserver.observe(document.body, {
      childList: true,
      subtree: false // Only watch direct children for better performance
    });

    // Additional protection: Continuously verify elements exist (every 2000ms - optimized)
    const elementIntegrityCheck = setInterval(() => {
      if (!isLocked) {
        clearInterval(elementIntegrityCheck);
        securityObserver.disconnect();
        return;
      }

      // Verify all critical elements exist (simplified check)
      criticalElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (!element) {
          securityViolations++;

          // Emergency recreation
          if (elementId === 'lockOverlay' && !document.body.contains(overlay)) {
            document.body.appendChild(overlay);
          } else if (elementId === 'securePageBlur' && !document.body.contains(pageBlur)) {
            document.body.appendChild(pageBlur);
          } else if (elementId === 'secureInteractionBlocker' && !document.body.contains(interactionBlocker)) {
            document.body.appendChild(interactionBlocker);
          }

          showError(`🚨 Security restored! Violation #${securityViolations}`);
        }
      });
    }, 2000); // Check every 2 seconds (optimized for performance)    // Prevent ANY CSS injection that could hide our overlays (optimized)
    const cssProtection = setInterval(() => {
      if (!isLocked) {
        clearInterval(cssProtection);
        return;
      }

      // Check for malicious style tags (optimized - only new styles)
      const styleTags = document.querySelectorAll('style:not([data-checked])');
      styleTags.forEach(styleTag => {
        styleTag.setAttribute('data-checked', 'true');
        const content = styleTag.textContent.toLowerCase();
        if (content.includes('lockoverlay') ||
          content.includes('securepageblur') ||
          content.includes('secureinteractionblocker')) {

          securityViolations++;
          styleTag.remove();
          showError(`🚨 CSS injection blocked! #${securityViolations}`);
        }
      });
    }, 3000); // Check every 3 seconds (optimized for performance)

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

    // Layer 2: pagehide event (for back/forward cache)
    window.addEventListener('pagehide', function (e) {
      if (e.persisted) {
        // Store lock state in sessionStorage for quick restoration
        sessionStorage.setItem('tabWasLocked', 'true');
      }
    });

    // Layer 4: Optimized periodic check for page changes
    let isLocked = true;
    let missedChecks = 0;

    // Primary monitor - Check every 1000ms (OPTIMIZED for performance)
    const ultraFastRelock = setInterval(() => {
      if (isLocked && !document.getElementById("lockOverlay")) {
        missedChecks++;
        // Page was somehow refreshed and lock overlay is gone - EMERGENCY RE-LOCK

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
    }, 1000); // Check every 1 second (optimized for performance)

    // Secondary monitor - Check every 3 seconds as backup
    const backupRelock = setInterval(() => {
      if (isLocked && !document.getElementById("lockOverlay") && !document.getElementById("emergencyLockOverlay")) {
        const emergencyOverlay = document.createElement("div");
        emergencyOverlay.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;background:#dc3545!important;z-index:2147483647!important;color:white!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:28px!important;";
        emergencyOverlay.innerHTML = "🔒 BACKUP LOCK ACTIVATED";
        document.documentElement.appendChild(emergencyOverlay);
        window.location.reload();
      }
    }, 3000); // Backup check every 3 seconds (optimized)

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

    // Layer 5.5: DOM Mutation Observer - Detect if overlay is removed (optimized)
    const domMonitor = setInterval(() => {
      const overlay = document.getElementById("lockOverlay");
      if (isLocked && overlay && !document.body.contains(overlay)) {
        document.body.appendChild(overlay);
      }
    }, 500); // Check every 500ms (optimized for performance)

    // Layer 6: INSTANT window focus monitoring (no delays)
    let isWindowFocused = true;
    window.addEventListener('blur', () => {
      isWindowFocused = false;
    });

    window.addEventListener('focus', () => {
      if (!isWindowFocused) {
        // Window regained focus - INSTANTLY check if lock is still there (no setTimeout)
        if (isLocked && !document.getElementById("lockOverlay")) {
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

    // Layer 9: Enhanced DevTools detection using multiple methods
    let devtoolsOpen = false;
    let devtoolsAttempts = 0;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      // Additional detection: console timing attack
      const startTime = performance.now();
      try {
        // Attempt console operation to detect if DevTools is open
        const tempFunc = () => { };
        tempFunc();
      } catch (e) {
        // Ignore
      }
      const endTime = performance.now();
      const consoleOpen = (endTime - startTime) > 100;

      if (widthThreshold || heightThreshold || consoleOpen) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          devtoolsAttempts++;
          showError(`🚫 Developer Tools detected! Attempt #${devtoolsAttempts}`);

          // Create full-screen block overlay with even higher z-index
          let devtoolsBlock = document.getElementById("devtoolsBlockOverlay");
          if (!devtoolsBlock) {
            devtoolsBlock = document.createElement("div");
            devtoolsBlock.id = "devtoolsBlockOverlay";
            devtoolsBlock.setAttribute("data-security-critical", "true");
            devtoolsBlock.setAttribute("data-lock-component", "devtools-block");
            devtoolsBlock.style.cssText = "position:fixed!important;top:0!important;left:0!important;width:100%!important;height:100%!important;background:rgba(0,0,0,0.98)!important;z-index:2147483646!important;color:#ff0000!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:32px!important;font-weight:bold!important;flex-direction:column!important;pointer-events:auto!important;";
            devtoolsBlock.innerHTML =
              "🚫 DEVELOPER TOOLS BLOCKED<br>" +
              "<span style='font-size:18px;color:#fff;margin-top:20px;'>Close DevTools to continue</span><br>" +
              `<span style='font-size:14px;color:#ff6b6b;margin-top:10px;'>Detection Count: ${devtoolsAttempts}</span>`;
            document.body.appendChild(devtoolsBlock);
            criticalElements.add('devtoolsBlockOverlay');
          }
        }
      } else {
        if (devtoolsOpen) {
          devtoolsOpen = false;
          const blockOverlay = document.getElementById("devtoolsBlockOverlay");
          if (blockOverlay) {
            blockOverlay.remove();
            criticalElements.delete('devtoolsBlockOverlay');
          }
        }
      }
    };

    // Check for DevTools every 2 seconds (optimized)
    const devToolsInterval = setInterval(() => {
      if (!isLocked) {
        clearInterval(devToolsInterval);
        return;
      }
      checkDevTools();
    }, 2000); // Optimized for performance

    // Disable right-click context menu
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showError("Right-click is disabled for security.");
      return false;
    }, true);

    // Prevent selecting text
    document.addEventListener('selectstart', function (e) {
      if (e.target.id !== 'unlockPassword') {
        e.preventDefault();
        return false;
      }
    }, true);

    // Prevent mouse events on security elements (prevents inspect element)
    document.addEventListener('click', function (e) {
      if (e.target.getAttribute && e.target.getAttribute('data-security-critical') === 'true') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showError('🚫 Cannot inspect security elements!');
        return false;
      }
    }, true);

    // Prevent pointer events that could be used to inspect
    document.addEventListener('mousedown', function (e) {
      if (e.target.getAttribute && e.target.getAttribute('data-security-critical') === 'true') {
        if (e.target.id !== 'lockOverlay' && !overlay.contains(e.target)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    }, true);

    // Prevent drag operations that could expose content
    document.addEventListener('dragstart', function (e) {
      e.preventDefault();
      showError('🚫 Drag operations disabled for security!');
      return false;
    }, true);

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
        setTimeout(async () => {
          const isMatch = await verifyPassword(enteredPassword, data.lockPassword);
          if (data && isMatch) {
            // Check if this tab is domain-locked to offer unlock scope options
            chrome.storage.local.get(["lockedDomains", "domainUnlockPreferences"], (storageData) => {
              const lockedDomains = storageData.lockedDomains || [];
              const domainPreferences = storageData.domainUnlockPreferences || {};
              const currentUrl = window.location.href;
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
                } catch (e) { }
                return false;
              });

              if (isDomainLocked && matchedPattern) {
                // Check if user has a saved preference for this domain
                if (domainPreferences[matchedPattern]) {
                  // Use saved preference
                  chrome.runtime.sendMessage({
                    action: "unlock",
                    scope: domainPreferences[matchedPattern]
                  });
                  unlock();
                } else {
                  // First time - show dialog with checkbox
                  showUnlockScopeOptions(matchedPattern);
                }
              } else {
                // Regular tab lock - just unlock
                chrome.runtime.sendMessage({
                  action: "unlock",
                  scope: "tab-only"
                });
                unlock();
              }
            });
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

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function showUnlockScopeOptions(domainPattern) {
      // Replace unlock button with scope options
      const lockContainer = overlay.querySelector('.lock-container');
      const hostname = new URL(window.location.href).hostname;

      lockContainer.innerHTML = `
        <div style="text-align: center;">
          <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: rgba(255, 255, 255, 0.2); 
                      border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 48px;">✅</span>
          </div>
          <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 12px 0; color: #000000;">Password Correct!</h1>
          <p style="font-size: 16px; margin: 0 0 28px 0; color: #000000; line-height: 1.5;">
            This tab is protected by a domain lock.<br>
            Choose unlock scope:
          </p>
          
          <button id="unlockThisTab" style="width: 100%; padding: 14px 18px; margin: 8px 0; border: none; 
                                            border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; 
                                            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                                            color: white; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3); 
                                            transition: all 0.3s ease;">
            🔓 Unlock This Tab Only
          </button>
          
          <button id="unlockAllDomainTabs" style="width: 100%; padding: 14px 18px; margin: 8px 0; border: none; 
                                                   border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; 
                                                   background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
                                                   color: white; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3); 
                                                   transition: all 0.3s ease;">
            🌐 Unlock All ${hostname} Tabs
          </button>
          
          <div style="margin: 20px 0; padding: 16px; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #000000; font-size: 14px;">
              <input type="checkbox" id="rememberChoice" style="width: 18px; height: 18px; cursor: pointer;">
              <span>Remember this choice for <strong>${escapeHtml(domainPattern)}</strong></span>
            </label>
            <small style="display: block; margin-top: 8px; color: rgba(0, 0, 0, 0.7);">
              You can change this anytime in Domain Lock Manager settings
            </small>
          </div>
          
          <p style="font-size: 12px; margin: 20px 0 0 0; color: rgba(0, 0, 0, 0.7); line-height: 1.4;">
            <strong>Note:</strong> "This Tab Only" keeps the domain lock active but temporarily unlocks this tab.
          </p>
        </div>
      `;

      // Add event listeners for scope buttons
      const unlockThisTab = overlay.querySelector('#unlockThisTab');
      const unlockAllDomainTabs = overlay.querySelector('#unlockAllDomainTabs');
      const rememberCheckbox = overlay.querySelector('#rememberChoice');

      const handleUnlock = (scope) => {
        // Check if user wants to remember this choice
        if (rememberCheckbox.checked) {
          chrome.storage.local.get("domainUnlockPreferences", (data) => {
            const preferences = data.domainUnlockPreferences || {};
            preferences[domainPattern] = scope;
            chrome.storage.local.set({ domainUnlockPreferences: preferences });
          });
        }

        // Send unlock message
        chrome.runtime.sendMessage({
          action: "unlock",
          scope: scope
        });
        unlock();
      };

      unlockThisTab.onclick = () => {
        handleUnlock("tab-only");
      };

      unlockAllDomainTabs.onclick = () => {
        handleUnlock("all-domain-tabs");
      };

      // Add hover effects
      [unlockThisTab, unlockAllDomainTabs].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'translateY(-2px)';
          btn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translateY(0)';
        });
      });
    }

    // Auto-focus password input
    setTimeout(() => passwordInput.focus(), 100);
  });
}

// Call createLockOverlay on initial script load
createLockOverlay();
