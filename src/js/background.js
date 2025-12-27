// Cross-browser compatibility note:
// For Chrome/Edge: Polyfill loaded via importScripts() below
// For Firefox: Polyfill loaded via manifest background.scripts array
if (typeof importScripts === 'function') {
  // Chrome/Edge service worker
  try {
    importScripts('browser-polyfill.min.js');
  } catch (e) {
    console.log('Polyfill load skipped:', e.message);
  }
}

let lockedTabs = new Set(); // Track locked tabs by tab ID
let lockedDomains = []; // Track locked domain patterns
let temporarilyUnlockedTabs = new Set(); // Track tabs temporarily unlocked from domain locks
let isRestoring = false; // Flag to prevent race conditions during restoration
let restorationPromise = null; // Promise for ongoing restoration

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
    chrome.storage.local.get(["lockedTabIds", "lockedDomains", "temporarilyUnlockedTabIds"], (data) => {
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
  }
  // Removed insecure unlock action - tabs can only be unlocked by entering the correct password

  return true; // Keep the message channel open for async response
});

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
    await chrome.storage.local.set({
      lockedTabIds: Array.from(lockedTabs),
      [`lockData_${tabId}`]: lockData
    });

    // Update badge
    updateBadge();

    // Navigate to locked page
    const lockedUrl = chrome.runtime.getURL('src/html/locked.html') + `?tab=${tabId}`;
    await chrome.tabs.update(tabId, { url: lockedUrl });

    // Show notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
      title: "Tab Locked",
      message: `Tab "${tab.title || 'Untitled'}" has been locked successfully.`,
      priority: 1,
    });

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

    // Remove from locked set
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

    console.log('Tab unlocked successfully:', tabId);
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

  // Skip if already on locked page
  if (tab.url && tab.url.includes('/locked.html')) {
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
      console.log('Tab navigating while locked - enforcing lock:', tabId);
      const lockedUrl = chrome.runtime.getURL('src/html/locked.html') + `?tab=${tabId}`;

      // Store current URL as original URL if not already stored
      if (tab.url && !tab.url.includes('/locked.html')) {
        const lockData = {
          originalUrl: tab.url,
          title: tab.title || 'Untitled',
          timestamp: Date.now()
        };
        await chrome.storage.local.set({ [`lockData_${tabId}`]: lockData });
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
      console.log('Navigation detected on locked tab - enforcing lock:', details.tabId);
      const lockedUrl = chrome.runtime.getURL('src/html/locked.html') + `?tab=${details.tabId}`;

      // Store navigation URL as original URL if not already stored
      if (details.url && !details.url.includes('/locked.html')) {
        const lockData = {
          originalUrl: details.url,
          title: 'Loading...',
          timestamp: Date.now()
        };
        await chrome.storage.local.set({ [`lockData_${details.tabId}`]: lockData });
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
      console.log('Locked tab activated - enforcing lock:', tabId);
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


