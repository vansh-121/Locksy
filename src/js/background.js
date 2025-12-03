let lockedTabs = new Set(); // Track locked tabs by tab ID
let lockedDomains = []; // Track locked domain patterns
let temporarilyUnlockedTabs = new Set(); // Track tabs temporarily unlocked from domain locks

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
    chrome.storage.local.get(["lockedTabIds", "lockedDomains"], (data) => {
      if (data.lockedTabIds && Array.isArray(data.lockedTabIds)) {
        lockedTabs = new Set(data.lockedTabIds);
      }
      if (data.lockedDomains && Array.isArray(data.lockedDomains)) {
        lockedDomains = data.lockedDomains;
      }

      // Update badge after restoring
      updateBadge();

      resolve();
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
  await restoreLockedState();
});

chrome.runtime.onInstalled.addListener(async (details) => {
  // Open welcome page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'https://locksy.dev',
      active: true
    });
  }

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
  // Check if extension is active before processing any actions
  chrome.storage.local.get("extensionActive", (data) => {
    if (!data.extensionActive) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
        title: "Extension Inactive",
        message: "Please activate the extension first to use this feature.",
        priority: 2,
      });
      sendResponse({ success: false, error: "Extension is not active" });
      return;
    }

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
    } else if (message.action === "unlock") {
      // Unlock tab after successful password verification
      const tabId = sender.tab.id;

      // Handle unlock scope
      if (message.scope === "tab-only") {
        // Just unlock this specific tab
        lockedTabs.delete(tabId);
        chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
        // Update badge
        updateBadge();

        // If tab was domain-locked, add to temporary exemption
        chrome.tabs.get(tabId, (tab) => {
          if (tab && tab.url && isDomainLocked(tab.url)) {
            temporarilyUnlockedTabs.add(tabId);
          }
        });
      } else if (message.scope === "all-domain-tabs") {
        // Unlock all tabs of this domain (but keep domain lock active)
        chrome.tabs.get(tabId, (currentTab) => {
          if (currentTab && currentTab.url) {
            const currentDomain = new URL(currentTab.url).hostname;
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach(tab => {
                try {
                  if (tab.url && new URL(tab.url).hostname === currentDomain) {
                    lockedTabs.delete(tab.id);
                    temporarilyUnlockedTabs.add(tab.id);
                    // Send message to content script to remove overlay
                    chrome.tabs.sendMessage(tab.id, { action: "removeOverlay" }).catch(() => { });
                  }
                } catch (e) { }
              });
              chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
              // Update badge
              updateBadge();
            });
          }
        });
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
              chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
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
              tabs.forEach(tab => {
                if (tab.url && isDomainLocked(tab.url)) {
                  lockTab(tab.id);
                }
              });
              // Update badge after locking all matching tabs
              setTimeout(() => updateBadge(), 500);
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
          chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
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
    }
    // Removed insecure unlock action - tabs can only be unlocked by entering the correct password
  });

  return true; // Keep the message channel open for async response
});

function lockTab(tabId, sendResponse) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      if (sendResponse) {
        sendResponse({ success: false, error: "Could not access tab: " + chrome.runtime.lastError.message });
      }
      return;
    }

    if (tab && tab.url &&
      !tab.url.startsWith("chrome://") &&
      !tab.url.startsWith("chrome-extension://") &&
      !tab.url.startsWith("edge://") &&
      !tab.url.startsWith("about:") &&
      !tab.url.startsWith("file://")) {
      // Inject crypto-utils.js first, then content.js
      // This makes crypto functions available to content.js
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["src/js/crypto-utils.js", "src/js/content.js"],
      }).then(() => {
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
          title: "Tab Locked",
          message: `Tab "${tab.title}" has been locked successfully.`,
          priority: 1,
        });
        if (sendResponse) {
          sendResponse({ success: true, message: "Tab locked successfully" });
        }
      }).catch((error) => {
        const errorMsg = "Unable to lock this tab. It may be a restricted page, system page, or local file.";
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
      });
    } else {
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
    }
  });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  lockedTabs.delete(tabId);
  temporarilyUnlockedTabs.delete(tabId);
  // Update storage
  chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
  // Update badge
  updateBadge();
});

// Handle new tabs - auto-lock if domain is locked
chrome.tabs.onCreated.addListener(async (tab) => {
  // Ensure locked state is loaded
  if (lockedTabs.size === 0 && lockedDomains.length === 0) {
    await restoreLockedTabs();
  }

  // Wait for URL to be available and check if it matches a locked domain
  const checkAndLock = (tabId, changeInfo) => {
    if (changeInfo.url && isDomainLocked(changeInfo.url) && !temporarilyUnlockedTabs.has(tabId)) {
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

// Handle tab updates (including refreshes) - ULTRA-FAST re-lock
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0 && lockedDomains.length === 0) {
    await restoreLockedTabs();
  }

  // Check if tab is locked (either by tab ID or domain pattern)
  const isTabLocked = lockedTabs.has(tabId);
  const isTabDomainLocked = tab.url && isDomainLocked(tab.url) && !temporarilyUnlockedTabs.has(tabId);

  // If this tab is locked and the page is loading/complete, re-inject the lock IMMEDIATELY
  if (isTabLocked || isTabDomainLocked) {
    if (changeInfo.status === 'loading') {
      // IMMEDIATE re-lock on loading - 10ms delay only
      setTimeout(() => {
        lockTab(tabId);
      }, 10);
    } else if (changeInfo.status === 'complete') {
      // Double-check re-lock on complete - 5ms delay
      setTimeout(() => {
        lockTab(tabId);
      }, 5);
    }

    // Additional check for any URL changes
    if (changeInfo.url) {
      setTimeout(() => {
        lockTab(tabId);
      }, 5);
    }
  }

  // Clear temporary exemption if URL changes to non-matching domain
  if (changeInfo.url && temporarilyUnlockedTabs.has(tabId)) {
    if (!isDomainLocked(changeInfo.url)) {
      temporarilyUnlockedTabs.delete(tabId);
    }
  }
});

// Handle navigation events to maintain locks - INSTANT re-lock
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0 && lockedDomains.length === 0) {
    await restoreLockedTabs();
  }

  if (details.frameId === 0) {
    const isTabLocked = lockedTabs.has(details.tabId);
    const isUrlDomainLocked = isDomainLocked(details.url) && !temporarilyUnlockedTabs.has(details.tabId);

    if (isTabLocked || isUrlDomainLocked) {
      // Tab is locked and user is trying to navigate - re-lock INSTANTLY
      setTimeout(() => {
        lockTab(details.tabId);
      }, 5); // Reduced from 200ms to 5ms
    }
  }
});

// Additional security: Monitor for any committed navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0 && lockedDomains.length === 0) {
    await restoreLockedTabs();
  }

  if (details.frameId === 0) {
    const isTabLocked = lockedTabs.has(details.tabId);
    const isUrlDomainLocked = isDomainLocked(details.url) && !temporarilyUnlockedTabs.has(details.tabId);

    if (isTabLocked || isUrlDomainLocked) {
      // Re-lock immediately on committed navigation
      setTimeout(() => {
        lockTab(details.tabId);
      }, 1); // Almost instant - 1ms delay
    }
  }
});

// Additional security: Monitor for DOM content loaded
chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0 && lockedDomains.length === 0) {
    await restoreLockedTabs();
  }

  if (details.frameId === 0) {
    const isTabLocked = lockedTabs.has(details.tabId);
    const isUrlDomainLocked = isDomainLocked(details.url) && !temporarilyUnlockedTabs.has(details.tabId);

    if (isTabLocked || isUrlDomainLocked) {
      // Re-lock when DOM is ready
      setTimeout(() => {
        lockTab(details.tabId);
      }, 1); // Almost instant - 1ms delay
    }
  }
});

// Additional security: Monitor for completed navigation
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0 && lockedDomains.length === 0) {
    await restoreLockedTabs();
  }

  if (details.frameId === 0) {
    const isTabLocked = lockedTabs.has(details.tabId);
    const isUrlDomainLocked = isDomainLocked(details.url) && !temporarilyUnlockedTabs.has(details.tabId);

    if (isTabLocked || isUrlDomainLocked) {
      // Final re-lock when page is fully loaded
      setTimeout(() => {
        lockTab(details.tabId);
      }, 5);
    }
  }
});

// ========== KEYBOARD SHORTCUTS HANDLER ==========
chrome.commands.onCommand.addListener((command) => {
  chrome.storage.local.get(['extensionActive', 'lockPassword'], (data) => {
    const isActive = data.extensionActive !== false;
    const hasPassword = !!data.lockPassword;

    switch (command) {
      case 'lock-current-tab':
        handleLockCurrentTab(isActive, hasPassword);
        break;

      case 'open-domain-manager':
        handleOpenDomainManager(isActive, hasPassword);
        break;

      case 'lock-all-tabs':
        handleLockAllTabs(isActive, hasPassword);
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

      // Lock the tab (lockTab will add to lockedTabs)
      lockTab(tab.id);
      lockedCount++;
    });

    // Update storage and badge after a small delay to ensure all locks are added
    setTimeout(() => {
      chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
      updateBadge();
    }, 100);

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
