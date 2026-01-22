// Cross-browser compatibility note:
// For Chrome/Edge: Polyfill loaded via importScripts() below
// For Firefox: Polyfill loaded via manifest background.scripts array
if (typeof importScripts === 'function') {
  // Chrome/Edge service worker
  try {
    importScripts('browser-polyfill.min.js');
  } catch (e) {
    // Polyfill load skipped - not critical
  }
}

let lockedTabs = new Set(); // Track locked tabs by tab ID
let lockedDomains = []; // Track locked domain patterns
let temporarilyUnlockedTabs = new Set(); // Track tabs temporarily unlocked from domain locks
let isRestoring = false; // Flag to prevent race conditions during restoration
let restorationPromise = null; // Promise for ongoing restoration

// ============================================================================
// AUTO-LOCK TIMER & SCHEDULED LOCKING
// ============================================================================
let autoLockTimer = null; // Timer for auto-lock after inactivity
let autoLockEnabled = false; // Whether auto-lock is enabled
let autoLockDuration = 15 * 60 * 1000; // Default: 15 minutes in milliseconds
let autoLockScope = 'all'; // What to lock: 'all' or 'current'
let lastActivityTime = Date.now(); // Track last user activity
let scheduledLockEnabled = false; // Whether scheduled locking is enabled
let scheduledLockStart = '09:00'; // Default start time (24h format)
let scheduledLockEnd = '17:00'; // Default end time (24h format)
let scheduledLockScope = 'all'; // What to lock: 'all' or 'current'
// Using Chrome Alarms API instead of setInterval for persistent scheduling

// Function to update extension badge with locked tabs count
function updateBadge() {
  const count = lockedTabs.size;

  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#dc3545' }); // Red background
    chrome.action.setBadgeTextColor({ color: '#ffffff' }); // White text
  } else {
    chrome.action.setBadgeText({ text: '' }); // Clear badge when no locks
  }
}

// ============================================================================
// AUTO-LOCK TIMER FUNCTIONS
// ============================================================================

/**
 * Start the auto-lock timer
 */
function startAutoLockTimer() {
  // Clear existing timer
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
  }

  // Update last activity time
  lastActivityTime = Date.now();

  console.log(`[Auto-Lock] Timer started. Will lock in ${autoLockDuration / 1000} seconds`);

  // Set new timer
  autoLockTimer = setTimeout(() => {
    performAutoLock();
  }, autoLockDuration);
}

/**
 * Reset the auto-lock timer (called on user activity)
 */
function resetAutoLockTimer() {
  if (autoLockEnabled) {
    console.log('[Auto-Lock] Activity detected, resetting timer');
    startAutoLockTimer();
  }
}

/**
 * Perform auto-lock: lock tabs based on scope setting
 */
function performAutoLock() {
  console.log(`[Auto-Lock] Timer expired, locking ${autoLockScope === 'all' ? 'all tabs' : 'active tab only'}`);
  chrome.storage.local.get(["lockPassword"], (data) => {
    if (!data.lockPassword) {
      console.log('[Auto-Lock] Skipping - no password set');
      return;
    }

    console.log('[Auto-Lock] Password verified, proceeding with lock');

    // Helper function to lock a single active tab
    function lockActiveTab(tab) {
      // Skip if no URL (new tab, loading, etc.)
      if (!tab.url) {
        console.log('[Auto-Lock] No URL, skipping (new tab or loading)');
        return;
      }

      // Skip if already locked
      if (lockedTabs.has(tab.id)) {
        console.log('[Auto-Lock] Tab already locked, skipping');
        return;
      }

      // Skip system pages
      if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('file://')) {
        console.log('[Auto-Lock] System page, skipping:', tab.url);
        return;
      }

      console.log('[Auto-Lock] Locking tab ID:', tab.id, 'URL:', tab.url);
      lockedTabs.add(tab.id);
      lockTab(tab.id);
      chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
      updateBadge();

      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
        title: '🔒 Auto-Lock Activated',
        message: `Active tab locked due to inactivity`,
        priority: 1
      });
    }

    if (autoLockScope === 'current') {
      // Lock only the currently active tab in a normal browser window (not DevTools/popup)
      chrome.windows.getLastFocused({ populate: true }, (window) => {
        if (!window || window.type !== 'normal') {
          console.log('[Auto-Lock] Last focused window is not a normal browser window, finding first normal window');
          // Find first normal window with an active tab
          chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
            const firstWindow = windows.find(w => w.focused || w.tabs.some(t => t.active));
            if (!firstWindow) {
              console.log('[Auto-Lock] No normal browser window found');
              return;
            }
            const activeTab = firstWindow.tabs.find(t => t.active);
            if (activeTab) {
              lockActiveTab(activeTab);
            }
          });
          return;
        }

        // Get active tab from the last focused normal window
        const activeTab = window.tabs.find(t => t.active);
        console.log('[Auto-Lock] Active tab in last focused window:', activeTab?.url);

        if (!activeTab) {
          console.log('[Auto-Lock] No active tab found in window');
          return;
        }

        lockActiveTab(activeTab);
      });
    } else {
      // Lock all open tabs (default behavior)
      chrome.tabs.query({}, (tabs) => {
        let lockedCount = 0;

        tabs.forEach(tab => {
          // Skip if already locked
          if (lockedTabs.has(tab.id)) {
            return;
          }

          // Skip system pages
          if (tab.url &&
            (tab.url.startsWith('chrome://') ||
              tab.url.startsWith('chrome-extension://') ||
              tab.url.startsWith('edge://') ||
              tab.url.startsWith('about:') ||
              tab.url.startsWith('file://'))) {
            return;
          }

          // Lock the tab
          lockedTabs.add(tab.id);
          lockTab(tab.id);
          lockedCount++;
        });

        // Update storage and badge
        chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
        updateBadge();

        // Show notification
        if (lockedCount > 0) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
            title: '🔒 Auto-Lock Activated',
            message: `${lockedCount} tab${lockedCount !== 1 ? 's' : ''} locked due to inactivity`,
            priority: 1
          });
        }
      });
    }
  });
}

/**
 * Stop the auto-lock timer
 */
function stopAutoLockTimer() {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
}

// ============================================================================
// SCHEDULED LOCKING FUNCTIONS
// ============================================================================

/**
 * Check if current time is within scheduled lock hours
 */
function isWithinScheduledHours() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Parse start and end times
  const [startHour, startMin] = scheduledLockStart.split(':').map(Number);
  const [endHour, endMin] = scheduledLockEnd.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight schedules (e.g., 22:00 - 06:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Start the schedule checker (runs every minute)
 * Uses Chrome Alarms API for persistence across service worker restarts
 */
function startScheduleChecker() {
  // Clear existing alarm
  chrome.alarms.clear('scheduledLockCheck');

  // Check immediately
  checkScheduleAndAct();

  // Create alarm to check every minute
  chrome.alarms.create('scheduledLockCheck', {
    periodInMinutes: 1
  });

  console.log('[Scheduled Lock] Alarm created - checking every minute');
}

/**
 * Check schedule and lock/unlock accordingly
 */
function checkScheduleAndAct() {
  if (!scheduledLockEnabled) {
    console.log('[Scheduled Lock] Check skipped - not enabled');
    return;
  }

  const shouldBeLocked = isWithinScheduledHours();
  console.log('[Scheduled Lock] Current time check - Should be locked:', shouldBeLocked);

  chrome.storage.local.get(["lockPassword", "extensionActive", "scheduledLockState"], (data) => {
    if (!data.lockPassword || !data.extensionActive) {
      console.log('[Scheduled Lock] Check skipped - no password or extension not active');
      return;
    }

    const previousState = data.scheduledLockState || false;
    console.log('[Scheduled Lock] Previous state:', previousState, '| Current state:', shouldBeLocked);

    if (shouldBeLocked && !previousState) {
      // Entering scheduled lock period - lock tabs based on scope
      console.log(`[Scheduled Lock] ⏰ ENTERING SCHEDULED LOCK PERIOD - Locking ${scheduledLockScope === 'all' ? 'all tabs' : 'active tab only'}`);

      if (scheduledLockScope === 'current') {
        // Lock only the currently active tab
        chrome.windows.getLastFocused({ populate: true }, (window) => {
          if (!window || window.type !== 'normal') {
            console.log('[Scheduled Lock] Last focused window is not a normal browser window, finding first normal window');
            chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }, (windows) => {
              const firstWindow = windows.find(w => w.focused || w.tabs.some(t => t.active));
              if (!firstWindow) {
                console.log('[Scheduled Lock] No normal browser window found');
                return;
              }
              const activeTab = firstWindow.tabs.find(t => t.active);
              if (activeTab && !lockedTabs.has(activeTab.id)) {
                const shouldLock = activeTab.url &&
                  !activeTab.url.startsWith('chrome://') &&
                  !activeTab.url.startsWith('chrome-extension://') &&
                  !activeTab.url.startsWith('edge://') &&
                  !activeTab.url.startsWith('about:') &&
                  !activeTab.url.startsWith('file://');

                if (shouldLock) {
                  lockedTabs.add(activeTab.id);
                  lockTab(activeTab.id);
                  chrome.storage.local.set({
                    lockedTabIds: Array.from(lockedTabs),
                    scheduledLockState: true
                  });
                  updateBadge();

                  chrome.notifications.create({
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
                    title: '⏰ Scheduled Lock Activated',
                    message: 'Active tab locked per schedule',
                    priority: 1
                  });
                }
              }
            });
            return;
          }

          const activeTab = window.tabs.find(t => t.active);
          if (activeTab && !lockedTabs.has(activeTab.id)) {
            const shouldLock = activeTab.url &&
              !activeTab.url.startsWith('chrome://') &&
              !activeTab.url.startsWith('chrome-extension://') &&
              !activeTab.url.startsWith('edge://') &&
              !activeTab.url.startsWith('about:') &&
              !activeTab.url.startsWith('file://');

            if (shouldLock) {
              lockedTabs.add(activeTab.id);
              lockTab(activeTab.id);
              chrome.storage.local.set({
                lockedTabIds: Array.from(lockedTabs),
                scheduledLockState: true
              });
              updateBadge();

              chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
                title: '⏰ Scheduled Lock Activated',
                message: 'Active tab locked per schedule',
                priority: 1
              });
            }
          }
        });
      } else {
        // Lock all tabs
        chrome.tabs.query({}, (tabs) => {
          let lockedCount = 0;

          tabs.forEach(tab => {
            // Skip if already locked
            if (lockedTabs.has(tab.id)) {
              return;
            }

            // Skip system pages
            if (tab.url &&
              (tab.url.startsWith('chrome://') ||
                tab.url.startsWith('chrome-extension://') ||
                tab.url.startsWith('edge://') ||
                tab.url.startsWith('about:') ||
                tab.url.startsWith('file://'))) {
              return;
            }

            // Lock the tab
            lockedTabs.add(tab.id);
            lockTab(tab.id);
            lockedCount++;
          });

          // Update storage and badge
          chrome.storage.local.set({
            lockedTabIds: Array.from(lockedTabs),
            scheduledLockState: true
          });
          updateBadge();

          // Show notification
          if (lockedCount > 0) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
              title: '⏰ Scheduled Lock Activated',
              message: `${lockedCount} tab${lockedCount !== 1 ? 's' : ''} locked per schedule`,
              priority: 1
            });
          }
        });
      }
    } else if (!shouldBeLocked && previousState) {
      // Exiting scheduled lock period - unlock all locked tabs
      chrome.tabs.query({}, async (tabs) => {
        let unlockedCount = 0;

        // Create array of promises for unlocking tabs
        const unlockPromises = [];

        tabs.forEach(tab => {
          // Only unlock tabs that are currently locked
          if (lockedTabs.has(tab.id)) {
            unlockPromises.push(
              unlockTab(tab.id).then(() => {
                unlockedCount++;
              }).catch(err => {
                console.error(`Failed to unlock tab ${tab.id}:`, err);
              })
            );
          }
        });

        // Wait for all unlocks to complete
        await Promise.all(unlockPromises);

        // Update state
        chrome.storage.local.set({ scheduledLockState: false });

        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
          title: '⏰ Scheduled Lock Period Ended',
          message: `${unlockedCount} tab${unlockedCount !== 1 ? 's' : ''} automatically unlocked`,
          priority: 1
        });
      });
    }
  });
}

/**
 * Stop the schedule checker
 */
function stopScheduleChecker() {
  chrome.alarms.clear('scheduledLockCheck');
  console.log('[Scheduled Lock] Alarm cleared');
}

// Pattern matching for domain locks
function matchesPattern(url, pattern) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Exact match
    if (pattern === hostname) return true;

    // Wildcard subdomain: *.example.com
    if (pattern.startsWith('*.')) {
      const domain = pattern.slice(2);
      return hostname.endsWith(domain) || hostname === domain.replace('*.', '');
    }

    // Check if pattern is contained in hostname or vice versa
    return hostname.includes(pattern) || pattern.includes(hostname);
  } catch (e) {
    return false;
  }
}

// Check if a URL matches any locked domain
function isDomainLocked(url) {
  if (!url || lockedDomains.length === 0) return false;

  // Skip system URLs
  if (url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("file://")) {
    return false;
  }

  return lockedDomains.some(pattern => matchesPattern(url, pattern));
}

// Add a domain pattern to locked list
function addLockedDomain(pattern) {
  if (!lockedDomains.includes(pattern)) {
    lockedDomains.push(pattern);
    chrome.storage.local.set({ lockedDomains: lockedDomains });
    return true;
  }
  return false;
}

// Remove a domain pattern from locked list
function removeLockedDomain(pattern) {
  const index = lockedDomains.indexOf(pattern);
  if (index > -1) {
    lockedDomains.splice(index, 1);
    chrome.storage.local.set({ lockedDomains: lockedDomains });

    // Clear preferences for this domain when it's removed
    chrome.storage.local.get("domainUnlockPreferences", (data) => {
      const prefs = data.domainUnlockPreferences || {};
      if (prefs[pattern]) {
        delete prefs[pattern];
        chrome.storage.local.set({ domainUnlockPreferences: prefs });
      }
    });

    return true;
  }
  return false;
}

// CRITICAL: Restore locked tabs and domains from storage when service worker wakes up
async function restoreLockedTabs() {
  return new Promise((resolve) => {
    chrome.storage.local.get([
      "lockedTabIds",
      "lockedDomains",
      "temporarilyUnlockedTabIds",
      "autoLockEnabled",
      "autoLockDuration",
      "autoLockScope",
      "scheduledLockEnabled",
      "scheduledLockStart",
      "scheduledLockEnd",
      "scheduledLockScope"
    ], (data) => {
      if (data.lockedTabIds && Array.isArray(data.lockedTabIds)) {
        lockedTabs = new Set(data.lockedTabIds);

        // Validate that tabs still exist after browser restart
        validateAndCleanLockedTabs();
      }
      if (data.lockedDomains && Array.isArray(data.lockedDomains)) {
        lockedDomains = data.lockedDomains;
      }
      if (data.temporarilyUnlockedTabIds && Array.isArray(data.temporarilyUnlockedTabIds)) {
        temporarilyUnlockedTabs = new Set(data.temporarilyUnlockedTabIds);
      }

      // Restore timer settings
      if (data.autoLockEnabled !== undefined) {
        autoLockEnabled = data.autoLockEnabled;
      }
      if (data.autoLockDuration !== undefined) {
        autoLockDuration = data.autoLockDuration;
      }
      if (data.autoLockScope !== undefined) {
        autoLockScope = data.autoLockScope;
      }
      if (data.scheduledLockEnabled !== undefined) {
        scheduledLockEnabled = data.scheduledLockEnabled;
      }
      if (data.scheduledLockStart !== undefined) {
        scheduledLockStart = data.scheduledLockStart;
      }
      if (data.scheduledLockEnd !== undefined) {
        scheduledLockEnd = data.scheduledLockEnd;
      }
      if (data.scheduledLockScope !== undefined) {
        scheduledLockScope = data.scheduledLockScope;
      }

      // Start timers if enabled
      if (autoLockEnabled) {
        startAutoLockTimer();
      }
      if (scheduledLockEnabled) {
        startScheduleChecker();
      }

      resolve();
    });
  });
}

// Validate locked tabs and remove stale ones
function validateAndCleanLockedTabs() {
  if (lockedTabs.size === 0) {
    updateBadge();
    return;
  }

  const tabIds = Array.from(lockedTabs);
  let validatedCount = 0;
  let checkedCount = 0;

  tabIds.forEach(tabId => {
    chrome.tabs.get(tabId, (tab) => {
      checkedCount++;

      if (chrome.runtime.lastError || !tab) {
        // Tab doesn't exist anymore, remove it
        lockedTabs.delete(tabId);
        temporarilyUnlockedTabs.delete(tabId);
      }

      // When all tabs are checked, update storage and badge
      if (checkedCount === tabIds.length) {
        chrome.storage.local.set({
          lockedTabIds: Array.from(lockedTabs),
          temporarilyUnlockedTabIds: Array.from(temporarilyUnlockedTabs)
        });
        updateBadge();
      }
    });
  });
}

// Restore locked state and lock all tabs matching domain patterns
async function restoreLockedState() {
  await restoreLockedTabs();

  // Lock all existing tabs that match locked domains
  if (lockedDomains.length > 0) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && isDomainLocked(tab.url) && !temporarilyUnlockedTabs.has(tab.id)) {
          lockTab(tab.id);
        }
      });
    });
  }
}

// CRITICAL: Initialize on service worker startup (including after it goes to sleep)
chrome.runtime.onStartup.addListener(async () => {
  try {
    await restoreLockedState();
  } catch (error) {
    console.error('Failed to restore locked state on startup:', error);
    // Attempt recovery
    setTimeout(() => restoreLockedState(), 1000);
  }
});

// ADDITIONAL: Initialize immediately when service worker wakes up
(async function initServiceWorker() {
  try {
    await restoreLockedState();
  } catch (error) {
    console.error('Failed to initialize service worker:', error);
  }
})();

chrome.runtime.onInstalled.addListener(async (details) => {
  // Open welcome page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'https://locksy.dev',
      active: true
    });
  }

  // Mark to show What's New on extension update
  if (details.reason === 'update') {
    const currentVersion = chrome.runtime.getManifest().version;
    const previousVersion = details.previousVersion;

    console.log(`Extension updated from v${previousVersion} to v${currentVersion}`);

    // Only show What's New if the version actually changed
    if (previousVersion && currentVersion !== previousVersion) {
      // Set flag and switch popup to whats-new.html
      chrome.storage.local.set({
        showWhatsNew: true,
        whatsNewVersion: currentVersion,
        whatsNewPreviousVersion: previousVersion
      }, () => {
        // Change the popup to whats-new.html
        chrome.action.setPopup({ popup: 'src/html/whats-new.html' }, () => {
          // Try to open the popup automatically
          chrome.action.openPopup().catch(err => {
            // If popup can't be opened automatically, create a notification
            chrome.notifications.create({
              type: "basic",
              iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
              title: "Locksy Updated! 🎉",
              message: `Click the extension icon to see what's new in v${currentVersion}`,
              priority: 2,
              requireInteraction: true
            });
          });
        });
      });
    } else {
      console.log('Extension reloaded with same version - skipping What\'s New');
    }
  }

  // Set uninstall URL - opens when user uninstalls the extension
  chrome.runtime.setUninstallURL('https://locksy.dev/uninstall');

  // Initialize extension state
  chrome.storage.local.get(["extensionActive", "lockPassword", "lockedTabIds", "lockedDomains"], (data) => {
    // Set default active state if not set
    if (data.extensionActive === undefined) {
      chrome.storage.local.set({ extensionActive: true });
    }

    // Restore locked tabs from storage (in case of extension restart)
    if (data.lockedTabIds) {
      lockedTabs = new Set(data.lockedTabIds);
    }

    // Restore locked domains from storage
    if (data.lockedDomains) {
      lockedDomains = data.lockedDomains;
    }

    if (!data.lockPassword) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
        title: "Locksy",
        message: "Welcome! Please set a password to start using the extension.",
        priority: 2,
      });
    }
  });
});

// ============================================================================
// CENTRALIZED RATE LIMITING & PASSWORD VERIFICATION
// ============================================================================
// This ensures a single, shared rate limiting state across the entire extension,
// preventing bypass attacks by opening multiple tabs or popups.

// Import crypto-utils for password verification
if (typeof importScripts === 'function') {
  try {
    importScripts('crypto-utils.js');
  } catch (e) {
    console.error('Failed to load crypto-utils:', e);
  }
}

// Rate limiting state (centralized in background script)
let crypto_failedAttempts = 0;
let crypto_lastAttemptTime = 0;
const CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY = 3;
const CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT = 10;
const CRYPTO_LOCKOUT_DURATION = 300000; // 5 minutes in milliseconds

/**
 * Centralized password verification with rate limiting
 * Called by popup and locked tabs via messaging
 */
async function verifyPasswordWithRateLimit(password, storedHash) {
  const now = Date.now();

  // Check if in lockout period
  if (crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    const timeSinceLast = now - crypto_lastAttemptTime;
    if (timeSinceLast < CRYPTO_LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((CRYPTO_LOCKOUT_DURATION - timeSinceLast) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      return {
        success: false,
        error: `Too many failed attempts. Please wait ${minutes}m ${seconds}s before trying again.`
      };
    }
    // Lockout expired, reset counter
    crypto_failedAttempts = 0;
  }

  // Apply delay after initial failed attempts (exponential backoff)
  if (crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY) {
    const timeSinceLast = now - crypto_lastAttemptTime;
    const requiredDelay = Math.pow(2, crypto_failedAttempts - CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY) * 1000;

    if (timeSinceLast < requiredDelay) {
      const waitTime = Math.ceil((requiredDelay - timeSinceLast) / 1000);
      return {
        success: false,
        error: `Please wait ${waitTime} seconds before trying again.`
      };
    }
  }

  // Attempt verification using crypto-utils function
  try {
    const isValid = await verifyPassword(password, storedHash);

    if (isValid) {
      // Reset on successful authentication
      crypto_failedAttempts = 0;
      crypto_lastAttemptTime = 0;
      return { success: true };
    } else {
      // Increment failed attempts
      crypto_failedAttempts++;
      crypto_lastAttemptTime = now;

      let errorMsg = 'Incorrect password.';

      // Warn about upcoming delays
      if (crypto_failedAttempts === CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY) {
        errorMsg = 'Incorrect password. ⚠️ Warning: Next failed attempt will require a 2-second wait.'
      } else if (crypto_failedAttempts > CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY && crypto_failedAttempts < CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT) {
        const remaining = CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT - crypto_failedAttempts;
        const nextDelay = Math.pow(2, crypto_failedAttempts - CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY + 1);
        errorMsg = `Incorrect password. ⚠️ ${remaining} attempts left before 5-minute lockout. Next wait: ${nextDelay}s.`;
      } else if (crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT) {
        errorMsg = '🚫 Account locked for 5 minutes due to too many failed attempts.';
      }

      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('Password verification error:', error);
    return { success: false, error: 'Verification failed. Please try again.' };
  }
}

/**
 * Get current rate limit status
 */
function getRateLimitStatus() {
  const now = Date.now();
  const isLockedOut = crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT &&
    (now - crypto_lastAttemptTime) < CRYPTO_LOCKOUT_DURATION;
  const lockoutRemaining = isLockedOut ?
    Math.ceil((CRYPTO_LOCKOUT_DURATION - (now - crypto_lastAttemptTime)) / 1000) : 0;

  // Calculate exponential backoff remaining time
  let waitRemaining = 0;
  if (crypto_failedAttempts >= CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY && crypto_failedAttempts < CRYPTO_MAX_ATTEMPTS_BEFORE_LOCKOUT) {
    const timeSinceLast = now - crypto_lastAttemptTime;
    const requiredDelay = Math.pow(2, crypto_failedAttempts - CRYPTO_MAX_ATTEMPTS_BEFORE_DELAY) * 1000;
    if (timeSinceLast < requiredDelay) {
      waitRemaining = Math.ceil((requiredDelay - timeSinceLast) / 1000);
    }
  }

  return {
    failedAttempts: crypto_failedAttempts,
    isLockedOut,
    lockoutRemaining,
    waitRemaining
  };
}

/**
 * Reset rate limiting (for testing or administrative purposes)
 */
function resetRateLimit() {
  crypto_failedAttempts = 0;
  crypto_lastAttemptTime = 0;
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Process all lock/unlock actions regardless of extensionActive toggle
  // (Security-critical functionality should not be bypassable via DevTools)

  if (message.action === "lock") {
    chrome.storage.local.get("lockPassword", (data) => {
      if (data.lockPassword) {
        lockedTabs.add(message.tabId);
        // Persist locked tabs to storage
        chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
        // Update badge
        updateBadge();
        lockTab(message.tabId, sendResponse);
      } else {
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
          title: "Password Required",
          message: "Please set a password first in the extension popup.",
          priority: 2,
        });
        sendResponse({ success: false, error: "Password not set" });
      }
    });
    return true; // Keep the message channel open for async response
  } else if (message.action === "unlockTab") {
    // Unlock tab by tabId (called from locked.html)
    const tabId = message.tabId;
    const scope = message.scope || 'tab-only';

    if (scope === 'all-domain-tabs') {
      // Unlock all tabs of this domain - use async IIFE
      (async () => {
        try {
          const lockData = await chrome.storage.local.get([`lockData_${tabId}`]);
          const tabLockData = lockData[`lockData_${tabId}`];

          if (tabLockData && tabLockData.originalUrl) {
            const currentDomain = new URL(tabLockData.originalUrl).hostname;
            const allTabs = await chrome.tabs.query({});

            for (const tab of allTabs) {
              try {
                const tabData = await chrome.storage.local.get([`lockData_${tab.id}`]);
                const lockInfo = tabData[`lockData_${tab.id}`];

                if (lockInfo && lockInfo.originalUrl) {
                  const tabDomain = new URL(lockInfo.originalUrl).hostname;
                  if (tabDomain === currentDomain) {
                    await unlockTab(tab.id);
                  }
                }
              } catch (e) {
                console.error('Error unlocking domain tab:', e);
              }
            }
            sendResponse({ success: true });
          } else {
            await unlockTab(tabId);
            sendResponse({ success: true });
          }
        } catch (error) {
          console.error('Error unlocking domain tabs:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
    } else {
      // Unlock only this tab
      unlockTab(tabId).then((result) => {
        sendResponse(result);
      }).catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    }
    return true; // Keep message channel open
  } else if (message.action === "unlock") {
    // Legacy unlock for content script (if still used)
    const tabId = sender.tab.id;

    // Handle unlock scope
    if (message.scope === "tab-only") {
      unlockTab(tabId).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    } else if (message.scope === "all-domain-tabs") {
      // Unlock all tabs of this domain (but keep domain lock active)
      chrome.tabs.get(tabId, (currentTab) => {
        if (currentTab && currentTab.url) {
          const currentDomain = new URL(currentTab.url).hostname;
          chrome.tabs.query({}, async (tabs) => {
            for (const tab of tabs) {
              try {
                if (tab.url && new URL(tab.url).hostname === currentDomain) {
                  await unlockTab(tab.id);
                }
              } catch (e) {
                console.error('Error unlocking domain tab:', e);
              }
            }
            sendResponse({ success: true });
          });
        }
      });
      return true;
    } else if (message.scope === "remove-domain-lock") {
      // Remove domain lock entirely and unlock all tabs
      chrome.tabs.get(tabId, (currentTab) => {
        if (currentTab && currentTab.url) {
          // Find and remove matching domain patterns
          const urlToCheck = currentTab.url;
          const matchingPatterns = lockedDomains.filter(pattern => matchesPattern(urlToCheck, pattern));

          matchingPatterns.forEach(pattern => {
            removeLockedDomain(pattern);
          });

          // Unlock all tabs matching this domain
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              if (tab.url && matchesPattern(tab.url, urlToCheck)) {
                lockedTabs.delete(tab.id);
                temporarilyUnlockedTabs.delete(tab.id);
                // Send message to content script to remove overlay
                chrome.tabs.sendMessage(tab.id, { action: "removeOverlay" }).catch(() => { });
              }
            });
            chrome.storage.local.set({
              lockedTabIds: Array.from(lockedTabs),
              temporarilyUnlockedTabIds: Array.from(temporarilyUnlockedTabs)
            });
            // Update badge
            updateBadge();
          });
        }
      });
    } else {
      // Default: just unlock this tab
      lockedTabs.delete(tabId);
      chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
      // Update badge
      updateBadge();
    }

    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: "Tab Unlocked",
      message: "Tab has been unlocked successfully.",
      priority: 1,
    });
    sendResponse({ success: true });
  } else if (message.action === "lockDomain") {
    // Lock a domain pattern
    chrome.storage.local.get("lockPassword", (data) => {
      if (data.lockPassword) {
        const pattern = message.pattern;

        // Validate pattern
        if (!pattern || pattern.trim() === "") {
          sendResponse({ success: false, error: "Invalid domain pattern" });
          return;
        }

        // Prevent locking system URLs
        if (pattern.includes("chrome://") || pattern.includes("chrome-extension://") ||
          pattern.includes("edge://") || pattern.includes("about:") || pattern.includes("file://")) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
            title: "Cannot Lock Domain",
            message: "System domains cannot be locked for security reasons.",
            priority: 2,
          });
          sendResponse({ success: false, error: "System domains cannot be locked" });
          return;
        }

        if (addLockedDomain(pattern)) {
          // Lock all existing tabs matching this domain
          chrome.tabs.query({}, (tabs) => {
            const matchingTabs = tabs.filter(tab => tab.url && isDomainLocked(tab.url));

            if (matchingTabs.length === 0) {
              updateBadge();
              chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
                title: "Domain Locked",
                message: `Domain "${pattern}" has been locked successfully. (No matching tabs currently open)`,
                priority: 1,
              });
              sendResponse({ success: true, pattern: pattern });
              return;
            }

            // Add tabs to lockedTabs immediately
            matchingTabs.forEach(tab => {
              lockedTabs.add(tab.id);
            });

            // Persist to storage and update badge immediately
            chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
            updateBadge();

            // Then inject the lock overlay
            matchingTabs.forEach(tab => {
              lockTab(tab.id);
            });
          });

          chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
            title: "Domain Locked",
            message: `Domain "${pattern}" has been locked successfully.`,
            priority: 1,
          });
          sendResponse({ success: true, pattern: pattern });
        } else {
          sendResponse({ success: false, error: "Domain already locked" });
        }
      } else {
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
          title: "Password Required",
          message: "Please set a password first in the extension popup.",
          priority: 2,
        });
        sendResponse({ success: false, error: "Password not set" });
      }
    });
    return true;
  } else if (message.action === "unlockDomain") {
    // Remove a domain from locked list
    const pattern = message.pattern;
    if (removeLockedDomain(pattern)) {
      // Unlock all tabs matching this domain
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && matchesPattern(tab.url, pattern)) {
            lockedTabs.delete(tab.id);
            temporarilyUnlockedTabs.delete(tab.id);
            // Send message to content script to remove overlay
            chrome.tabs.sendMessage(tab.id, { action: "removeOverlay" }).catch(() => { });
          }
        });
        chrome.storage.local.set({
          lockedTabIds: Array.from(lockedTabs),
          temporarilyUnlockedTabIds: Array.from(temporarilyUnlockedTabs)
        });
        updateBadge();
      });

      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
        title: "Domain Unlocked",
        message: `Domain "${pattern}" has been unlocked.`,
        priority: 1,
      });
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "Domain not found" });
    }
  } else if (message.action === "getLockedDomains") {
    // Return list of locked domains
    sendResponse({ success: true, domains: lockedDomains });
  } else if (message.action === "verifyPassword") {
    // Centralized password verification with rate limiting
    // Called by popup and locked pages
    chrome.storage.local.get("lockPassword", async (data) => {
      if (!data.lockPassword) {
        sendResponse({ success: false, error: "No password configured" });
        return;
      }

      const result = await verifyPasswordWithRateLimit(message.password, data.lockPassword);
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "getRateLimitStatus") {
    // Return current rate limit status
    const status = getRateLimitStatus();
    sendResponse(status);
  } else if (message.action === "lockAllTabs") {
    // Lock all tabs in current window
    chrome.storage.local.get("lockPassword", (data) => {
      if (!data.lockPassword) {
        sendResponse({ success: false, error: "Password not set" });
        return;
      }

      // Delegate to existing handleLockAllTabs function
      handleLockAllTabs(true, true);
      sendResponse({ success: true });
    });
    return true;
  } else if (message.action === "setAutoLock") {
    // Update auto-lock settings
    const { enabled, duration, scope } = message;
    autoLockEnabled = enabled;
    if (duration !== undefined) {
      autoLockDuration = duration;
    }
    if (scope !== undefined) {
      autoLockScope = scope;
    }

    console.log(`[Auto-Lock] Settings updated - Enabled: ${enabled}, Duration: ${autoLockDuration}ms (${autoLockDuration / 60000} min), Scope: ${autoLockScope}`);

    chrome.storage.local.set({
      autoLockEnabled: enabled,
      autoLockDuration: autoLockDuration,
      autoLockScope: autoLockScope
    });

    if (enabled) {
      console.log('[Auto-Lock] Starting timer now');
      startAutoLockTimer();
    } else {
      console.log('[Auto-Lock] Stopping timer');
      stopAutoLockTimer();
    }

    sendResponse({ success: true });
    return true;
  } else if (message.action === "getAutoLockSettings") {
    // Return current auto-lock settings
    sendResponse({
      enabled: autoLockEnabled,
      duration: autoLockDuration,
      scope: autoLockScope,
      lastActivity: lastActivityTime
    });
    return true;
  } else if (message.action === "setScheduledLock") {
    // Update scheduled lock settings
    const { enabled, startTime, endTime, scope } = message;
    scheduledLockEnabled = enabled;
    if (startTime !== undefined) {
      scheduledLockStart = startTime;
    }
    if (endTime !== undefined) {
      scheduledLockEnd = endTime;
    }
    if (scope !== undefined) {
      scheduledLockScope = scope;
    }

    chrome.storage.local.set({
      scheduledLockEnabled: enabled,
      scheduledLockStart: scheduledLockStart,
      scheduledLockEnd: scheduledLockEnd,
      scheduledLockScope: scheduledLockScope
    });

    if (enabled) {
      startScheduleChecker();
    } else {
      stopScheduleChecker();
    }

    sendResponse({ success: true });
    return true;
  } else if (message.action === "getScheduledLockSettings") {
    // Return current scheduled lock settings
    sendResponse({
      enabled: scheduledLockEnabled,
      startTime: scheduledLockStart,
      endTime: scheduledLockEnd,
      scope: scheduledLockScope,
      currentlyActive: isWithinScheduledHours()
    });
    return true;
  } else if (message.action === "userActivity") {
    // Reset auto-lock timer on user activity
    resetAutoLockTimer();
    sendResponse({ success: true });
    return true;
  } else if (message.action === "isTabLocked") {
    // Check if a specific tab is currently locked
    const tabId = message.tabId;
    const isLocked = lockedTabs.has(tabId);
    sendResponse({ isLocked: isLocked });
    return true;
  }
  // Removed insecure unlock action - tabs can only be unlocked by entering the correct password

  return true; // Keep the message channel open for async response
});

// ============================================================================
// CHROME ALARMS LISTENER FOR SCHEDULED LOCK
// ============================================================================
// Handle alarms for scheduled lock checking
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'scheduledLockCheck') {
    console.log('[Scheduled Lock] ⏰ Alarm triggered - checking schedule');
    checkScheduleAndAct();
  }
});

console.log('[Scheduled Lock] Alarm listener registered');

// Navigation-based locking - stores original URL and navigates to locked.html
async function lockTab(tabId, sendResponse) {
  try {
    const tab = await chrome.tabs.get(tabId);

    if (chrome.runtime.lastError) {
      console.error('Failed to get tab:', chrome.runtime.lastError);
      if (sendResponse) {
        sendResponse({ success: false, error: "Could not access tab: " + chrome.runtime.lastError.message });
      }
      return;
    }

    // Check if already locked or already showing locked page
    if (tab.url && tab.url.includes('/locked.html')) {
      if (sendResponse) {
        sendResponse({ success: true, message: "Tab already locked" });
      }
      return;
    }

    // Skip system pages and restricted URLs
    if (!tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:") ||
      tab.url.startsWith("file://")) {
      const errorMsg = "Cannot lock this tab. System pages, browser settings, local files, and extension pages cannot be locked for security reasons.";
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
        title: "Cannot Lock Tab",
        message: errorMsg,
        priority: 2,
      });
      if (sendResponse) {
        sendResponse({ success: false, error: errorMsg });
      }
      return;
    }

    // Store lock data with original URL
    const lockData = {
      originalUrl: tab.url,
      title: tab.title || 'Untitled',
      timestamp: Date.now()
    };

    // Add to locked tabs set and store data
    lockedTabs.add(tabId);

    // CRITICAL: Ensure storage write completes before navigation (Firefox fix)
    await chrome.storage.local.set({
      lockedTabIds: Array.from(lockedTabs),
      [`lockData_${tabId}`]: lockData
    });

    // Add small delay to ensure storage sync in Firefox
    await new Promise(resolve => setTimeout(resolve, 50));

    // Update badge
    updateBadge();

    // Navigate to locked page
    const lockedUrl = chrome.runtime.getURL('src/html/locked.html') + `?tab=${tabId}`;
    await chrome.tabs.update(tabId, { url: lockedUrl });

    // Note: Notification removed - popup.js handles user feedback
    // This prevents duplicate notifications

    if (sendResponse) {
      sendResponse({ success: true, message: "Tab locked successfully" });
    }

  } catch (error) {
    console.error('Error locking tab:', error);
    const errorMsg = "Failed to lock tab: " + error.message;
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: "Lock Failed",
      message: errorMsg,
      priority: 2,
    });
    if (sendResponse) {
      sendResponse({ success: false, error: errorMsg });
    }
  }
}

// Unlock tab and navigate back to original URL
async function unlockTab(tabId) {
  try {
    // Get lock data
    const result = await chrome.storage.local.get([`lockData_${tabId}`]);
    const lockData = result[`lockData_${tabId}`];

    if (!lockData || !lockData.originalUrl) {
      console.warn('No lock data found for tab:', tabId);
      // Still remove from locked set
      lockedTabs.delete(tabId);
      await chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
      updateBadge();
      return { success: false, error: 'No lock data found' };
    }

    const originalUrl = lockData.originalUrl;

    // Remove from locked set FIRST (so periodic check in locked.js can detect this)
    lockedTabs.delete(tabId);

    // Check if this was a domain-locked tab
    if (isDomainLocked(originalUrl)) {
      temporarilyUnlockedTabs.add(tabId);
      // Persist temporarily unlocked tabs
      await chrome.storage.local.set({ temporarilyUnlockedTabIds: Array.from(temporarilyUnlockedTabs) });
    }

    // Update storage
    await chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
    await chrome.storage.local.remove(`lockData_${tabId}`);

    // Update badge
    updateBadge();

    // Navigate back to original URL
    await chrome.tabs.update(tabId, { url: originalUrl });

    return { success: true };

  } catch (error) {
    console.error('Error unlocking tab:', error);
    return { success: false, error: error.message };
  }
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const wasLocked = lockedTabs.has(tabId);
  const wasTemporarilyUnlocked = temporarilyUnlockedTabs.has(tabId);

  lockedTabs.delete(tabId);
  temporarilyUnlockedTabs.delete(tabId);

  if (wasLocked || wasTemporarilyUnlocked) {
    // Update storage
    await chrome.storage.local.set({
      lockedTabIds: Array.from(lockedTabs),
      temporarilyUnlockedTabIds: Array.from(temporarilyUnlockedTabs)
    });
    // Clean up lock data
    await chrome.storage.local.remove(`lockData_${tabId}`);
    // Update badge
    updateBadge();
  }
});

// Handle new tabs - auto-lock if domain is locked
chrome.tabs.onCreated.addListener(async (tab) => {
  // Ensure locked state is loaded (with race condition protection)
  if (!isRestoring && (lockedTabs.size === 0 && lockedDomains.length === 0)) {
    isRestoring = true;
    restorationPromise = restoreLockedTabs();
    await restorationPromise;
    isRestoring = false;
  } else if (isRestoring) {
    await restorationPromise;
  }

  // Wait for URL to be available and check if it matches a locked domain
  const checkAndLock = (tabId, changeInfo) => {
    if (changeInfo.url && isDomainLocked(changeInfo.url) && !temporarilyUnlockedTabs.has(tabId)) {
      lockedTabs.add(tabId);
      chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
      updateBadge();
      lockTab(tabId);
    }
  };

  // Listen for this specific tab's URL
  const listener = (updatedTabId, changeInfo) => {
    if (updatedTabId === tab.id && changeInfo.url) {
      checkAndLock(updatedTabId, changeInfo);
      chrome.tabs.onUpdated.removeListener(listener);
    }
  };

  chrome.tabs.onUpdated.addListener(listener);
});

// Handle tab updates (including refreshes and navigation) - enforce lock via navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up) with race condition protection
  if (!isRestoring && (lockedTabs.size === 0 && lockedDomains.length === 0)) {
    isRestoring = true;
    restorationPromise = restoreLockedTabs();
    await restorationPromise;
    isRestoring = false;
  } else if (isRestoring) {
    await restorationPromise;
  }

  // Skip if already on locked page OR navigating to locked page
  if (tab.url && tab.url.includes('/locked.html')) {
    return;
  }
  if (changeInfo.url && changeInfo.url.includes('/locked.html')) {
    return;
  }

  // Check if tab is locked (either by tab ID or domain pattern)
  const isTabLocked = lockedTabs.has(tabId);
  const isTabDomainLocked = tab.url && isDomainLocked(tab.url) && !temporarilyUnlockedTabs.has(tabId);

  // If this tab should be locked and navigating away from locked.html, re-lock immediately
  if (isTabLocked || isTabDomainLocked) {
    // Ensure tab is in lockedTabs Set for badge counting
    if (!lockedTabs.has(tabId)) {
      lockedTabs.add(tabId);
      chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
      updateBadge();
    }

    // Re-navigate to locked page if loading or URL changed
    if (changeInfo.status === 'loading' || changeInfo.url) {
      const lockedUrl = chrome.runtime.getURL('src/html/locked.html') + `?tab=${tabId}`;

      // Store current URL as original URL if not already stored
      if (tab.url && !tab.url.includes('/locked.html')) {
        const lockData = {
          originalUrl: tab.url,
          title: tab.title || 'Untitled',
          timestamp: Date.now()
        };
        await chrome.storage.local.set({ [`lockData_${tabId}`]: lockData });
        // Firefox fix: Small delay to ensure storage sync
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Navigate to locked page
      chrome.tabs.update(tabId, { url: lockedUrl }).catch((error) => {
        console.error('Error enforcing lock:', error);
      });
    }
  }

  // Clear temporary exemption if URL changes to non-matching domain
  if (changeInfo.url && temporarilyUnlockedTabs.has(tabId)) {
    if (!isDomainLocked(changeInfo.url)) {
      temporarilyUnlockedTabs.delete(tabId);
      // Persist the change
      chrome.storage.local.set({ temporarilyUnlockedTabIds: Array.from(temporarilyUnlockedTabs) });
    }
  }
});

// Handle navigation events to maintain locks - enforce via navigation
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up) with race condition protection
  if (!isRestoring && (lockedTabs.size === 0 && lockedDomains.length === 0)) {
    isRestoring = true;
    restorationPromise = restoreLockedTabs();
    await restorationPromise;
    isRestoring = false;
  } else if (isRestoring) {
    await restorationPromise;
  }

  if (details.frameId === 0) {
    // Skip if navigating to locked page
    if (details.url && details.url.includes('/locked.html')) {
      return;
    }

    const isTabLocked = lockedTabs.has(details.tabId);
    const isUrlDomainLocked = isDomainLocked(details.url) && !temporarilyUnlockedTabs.has(details.tabId);

    if (isTabLocked || isUrlDomainLocked) {
      // Tab is locked and user is trying to navigate - enforce lock
      const lockedUrl = chrome.runtime.getURL('src/html/locked.html') + `?tab=${details.tabId}`;

      // Store navigation URL as original URL if not already stored
      if (details.url && !details.url.includes('/locked.html')) {
        const lockData = {
          originalUrl: details.url,
          title: 'Loading...',
          timestamp: Date.now()
        };
        await chrome.storage.local.set({ [`lockData_${details.tabId}`]: lockData });
        // Firefox fix: Small delay to ensure storage sync
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      chrome.tabs.update(details.tabId, { url: lockedUrl }).catch((error) => {
        console.error('Error enforcing lock on navigation:', error);
      });
    }
  }
});

// Monitor tab activation to enforce locks
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId;

  try {
    const tab = await chrome.tabs.get(tabId);

    // Skip if already on locked page
    if (tab.url && tab.url.includes('/locked.html')) {
      return;
    }

    // Ensure lockedTabs is loaded (with race condition protection)
    if (!isRestoring && (lockedTabs.size === 0 && lockedDomains.length === 0)) {
      isRestoring = true;
      restorationPromise = restoreLockedTabs();
      await restorationPromise;
      isRestoring = false;
    } else if (isRestoring) {
      await restorationPromise;
    }

    // Check if tab should be locked
    const isTabLocked = lockedTabs.has(tabId);
    const isTabDomainLocked = tab.url && isDomainLocked(tab.url) && !temporarilyUnlockedTabs.has(tabId);

    if (isTabLocked || isTabDomainLocked) {
      const lockedUrl = chrome.runtime.getURL('src/html/locked.html') + `?tab=${tabId}`;
      chrome.tabs.update(tabId, { url: lockedUrl }).catch((error) => {
        console.error('Error enforcing lock on activation:', error);
      });
    }
  } catch (error) {
    console.error('Error in tab activation handler:', error);
  }
});
// ========== KEYBOARD SHORTCUTS HANDLER ==========
chrome.commands.onCommand.addListener((command) => {
  // Keyboard shortcuts always work (security-critical functionality)
  // extensionActive toggle is UI-only, does not affect security
  chrome.storage.local.get(['lockPassword'], (data) => {
    const hasPassword = !!data.lockPassword;

    switch (command) {
      case 'lock-current-tab':
        handleLockCurrentTab(true, hasPassword); // Always active
        break;

      case 'open-domain-manager':
        handleOpenDomainManager(true, hasPassword); // Always active
        break;

      case 'lock-all-tabs':
        handleLockAllTabs(true, hasPassword); // Always active
        break;
    }
  });
});

// Handler: Lock current tab via keyboard shortcut
function handleLockCurrentTab(isActive, hasPassword) {
  if (!isActive) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: 'Extension Inactive',
      message: 'Please activate the extension first! (Ctrl+Shift+E)',
      priority: 2
    });
    return;
  }

  if (!hasPassword) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: 'Password Required',
      message: 'Please set a master password first in the extension popup.',
      priority: 2
    });
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const tab = tabs[0];

      // Check if tab is already locked
      if (lockedTabs.has(tab.id)) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
          title: 'Already Locked',
          message: `Tab "${tab.title}" is already locked.`,
          priority: 1
        });
        return;
      }

      // Check if tab can be locked
      if (tab.url &&
        (tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('file://'))) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
          title: 'Cannot Lock Tab',
          message: 'System pages and extension pages cannot be locked for security reasons.',
          priority: 2
        });
        return;
      }

      // Lock the tab
      // Add to locked tabs BEFORE calling lockTab (same as popup button)
      lockedTabs.add(tab.id);
      chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
      updateBadge();

      lockTab(tab.id, (response) => {
        if (response && response.success) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
            title: '🔒 Tab Locked',
            message: `"${tab.title}" locked via keyboard shortcut!`,
            priority: 1
          });
        }
      });
    }
  });
}

// Handler: Open Domain Lock Manager via keyboard shortcut
function handleOpenDomainManager(isActive, hasPassword) {
  if (!isActive) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: 'Extension Inactive',
      message: 'Please activate the extension first! (Ctrl+Shift+E)',
      priority: 2
    });
    return;
  }

  if (!hasPassword) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: 'Password Required',
      message: 'Please set a master password first.',
      priority: 2
    });
    return;
  }

  chrome.windows.create({
    url: chrome.runtime.getURL('src/html/domain-manager.html'),
    type: 'popup',
    width: 500,
    height: 650
  });
}

// Handler: Lock all tabs in current window via keyboard shortcut
function handleLockAllTabs(isActive, hasPassword) {
  if (!isActive) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: 'Extension Inactive',
      message: 'Please activate the extension first! (Ctrl+Shift+E)',
      priority: 2
    });
    return;
  }

  if (!hasPassword) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: 'Password Required',
      message: 'Please set a master password first.',
      priority: 2
    });
    return;
  }

  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    let lockedCount = 0;
    let skippedCount = 0;

    tabs.forEach(tab => {
      // Skip if already locked
      if (lockedTabs.has(tab.id)) {
        return;
      }

      // Skip system pages
      if (tab.url &&
        (tab.url.startsWith('chrome://') ||
          tab.url.startsWith('chrome-extension://') ||
          tab.url.startsWith('edge://') ||
          tab.url.startsWith('about:') ||
          tab.url.startsWith('file://'))) {
        skippedCount++;
        return;
      }

      // Add to locked tabs and lock the tab
      lockedTabs.add(tab.id);
      lockTab(tab.id);
      lockedCount++;
    });

    // Update storage and badge after locking all tabs
    chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
    updateBadge();

    // Show notification
    let message = `${lockedCount} tab${lockedCount !== 1 ? 's' : ''} locked successfully!`;
    if (skippedCount > 0) {
      message += ` (${skippedCount} system tab${skippedCount !== 1 ? 's' : ''} skipped)`;
    }

    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: '🔒 Bulk Lock Complete',
      message: message,
      priority: 1
    });
  });
}

// ============================================================================
// ACTIVITY TRACKING FOR AUTO-LOCK
// ============================================================================

// Track tab activation (switching tabs)
chrome.tabs.onActivated.addListener(() => {
  resetAutoLockTimer();
});

// Track tab updates (navigation, refresh)
chrome.tabs.onUpdated.addListener(() => {
  resetAutoLockTimer();
});

// Track window focus changes
chrome.windows.onFocusChanged.addListener(() => {
  resetAutoLockTimer();
});

// Track new tabs
chrome.tabs.onCreated.addListener(() => {
  resetAutoLockTimer();
});


