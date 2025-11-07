let lockedTabs = new Set(); // Track locked tabs by tab ID

// CRITICAL: Restore locked tabs from storage when service worker wakes up
async function restoreLockedTabs() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["lockedTabIds"], (data) => {
      if (data.lockedTabIds && Array.isArray(data.lockedTabIds)) {
        lockedTabs = new Set(data.lockedTabIds);
        console.log(`[Locksy] Service worker restored ${lockedTabs.size} locked tabs`);
      }
      resolve();
    });
  });
}

// CRITICAL: Initialize on service worker startup (including after it goes to sleep)
chrome.runtime.onStartup.addListener(async () => {
  console.log("[Locksy] Service worker started, restoring locked tabs...");
  await restoreLockedTabs();
});

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[Locksy] Extension installed/updated, initializing...");

  // Open welcome page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'https://locksy.dev',
      active: true
    });
    console.log("[Locksy] First install - opened welcome page");
  }

  // Initialize extension state
  chrome.storage.local.get(["extensionActive", "lockPassword", "lockedTabIds"], (data) => {
    // Set default active state if not set
    if (data.extensionActive === undefined) {
      chrome.storage.local.set({ extensionActive: true });
    }

    // Restore locked tabs from storage (in case of extension restart)
    if (data.lockedTabIds) {
      lockedTabs = new Set(data.lockedTabIds);
      console.log(`[Locksy] Restored ${lockedTabs.size} locked tabs on install`);
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
      lockedTabs.delete(tabId);
      // Update storage
      chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
      chrome.notifications.create({
        type: "basic",
        iconUrl: chrome.runtime.getURL('assets/images/icon.png'),
        title: "Tab Unlocked",
        message: "Tab has been unlocked successfully.",
        priority: 1,
      });
      sendResponse({ success: true });
    }
    // Removed insecure unlock action - tabs can only be unlocked by entering the correct password
  });

  return true; // Keep the message channel open for async response
});

function lockTab(tabId, sendResponse) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.error('[Locksy] Error getting tab:', chrome.runtime.lastError);
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
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["src/js/content.js"],
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
        console.error('[Locksy] Script injection error:', error);
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
  // Update storage
  chrome.storage.local.set({ lockedTabIds: Array.from(lockedTabs) });
});

// Handle tab updates (including refreshes) - ULTRA-FAST re-lock
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0) {
    await restoreLockedTabs();
  }

  // If this tab is locked and the page is loading/complete, re-inject the lock IMMEDIATELY
  if (lockedTabs.has(tabId)) {
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
});

// Handle navigation events to maintain locks - INSTANT re-lock
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0) {
    await restoreLockedTabs();
  }

  if (details.frameId === 0 && lockedTabs.has(details.tabId)) {
    // Tab is locked and user is trying to navigate - re-lock INSTANTLY
    setTimeout(() => {
      lockTab(details.tabId);
    }, 5); // Reduced from 200ms to 5ms
  }
});

// Additional security: Monitor for any committed navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0) {
    await restoreLockedTabs();
  }

  if (details.frameId === 0 && lockedTabs.has(details.tabId)) {
    // Re-lock immediately on committed navigation
    setTimeout(() => {
      lockTab(details.tabId);
    }, 1); // Almost instant - 1ms delay
  }
});

// Additional security: Monitor for DOM content loaded
chrome.webNavigation.onDOMContentLoaded.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0) {
    await restoreLockedTabs();
  }

  if (details.frameId === 0 && lockedTabs.has(details.tabId)) {
    // Re-lock when DOM is ready
    setTimeout(() => {
      lockTab(details.tabId);
    }, 1); // Almost instant - 1ms delay
  }
});

// Additional security: Monitor for completed navigation
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Ensure lockedTabs is loaded (in case service worker just woke up)
  if (lockedTabs.size === 0) {
    await restoreLockedTabs();
  }

  if (details.frameId === 0 && lockedTabs.has(details.tabId)) {
    // Final re-lock when page is fully loaded
    setTimeout(() => {
      lockTab(details.tabId);
    }, 5);
  }
});
