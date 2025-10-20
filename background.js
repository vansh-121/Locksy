let lockedTabs = new Map(); // Track locked tabs: tabId -> {title, url, lockedAt}

chrome.runtime.onInstalled.addListener(() => {
  // Initialize extension state
  chrome.storage.local.get(["extensionActive", "lockPassword", "lockedTabs", "statistics"], (data) => {
    // Set default active state if not set
    if (data.extensionActive === undefined) {
      chrome.storage.local.set({ extensionActive: true });
    }

    // Load locked tabs from storage
    if (data.lockedTabs) {
      lockedTabs = new Map(Object.entries(data.lockedTabs));
    }

    // Initialize statistics
    if (!data.statistics) {
      chrome.storage.local.set({
        statistics: {
          totalLocks: 0,
          totalUnlocks: 0,
          sessionStart: Date.now()
        }
      });
    }

    if (!data.lockPassword) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Secure Tab Extension",
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
        iconUrl: "icon.png",
        title: "Extension Inactive",
        message: "Please activate the extension first to use this feature.",
        priority: 2,
      });
      return;
    }

    if (message.action === "lock") {
      chrome.storage.local.get("lockPassword", (data) => {
        if (data.lockPassword) {
          lockTab(message.tabId);
        } else {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Password Required",
            message: "Please set a password first in the extension popup.",
            priority: 2,
          });
        }
      });
    } else if (message.action === "lockMultiple") {
      chrome.storage.local.get("lockPassword", (data) => {
        if (data.lockPassword) {
          message.tabIds.forEach(tabId => lockTab(tabId));
        } else {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Password Required",
            message: "Please set a password first in the extension popup.",
            priority: 2,
          });
        }
      });
    } else if (message.action === "unlock") {
      unlockTab(message.tabId);
      sendResponse({ success: true });
    } else if (message.action === "unlockAll") {
      unlockAllTabs();
      sendResponse({ success: true });
    } else if (message.action === "getLockedTabs") {
      const tabsArray = Array.from(lockedTabs.entries()).map(([id, data]) => ({
        id: parseInt(id),
        ...data
      }));
      sendResponse({ lockedTabs: tabsArray });
    } else if (message.action === "getStatistics") {
      chrome.storage.local.get("statistics", (data) => {
        sendResponse({ statistics: data.statistics || { totalLocks: 0, totalUnlocks: 0 } });
      });
      return true; // Keep channel open for async response
    }
  });
  return true; // Keep message channel open
});

function lockTab(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      }).then(() => {
        // Store locked tab info
        lockedTabs.set(tabId.toString(), {
          title: tab.title,
          url: tab.url,
          lockedAt: Date.now()
        });
        saveLockedTabs();

        // Update statistics
        chrome.storage.local.get("statistics", (data) => {
          const stats = data.statistics || { totalLocks: 0, totalUnlocks: 0 };
          stats.totalLocks++;
          chrome.storage.local.set({ statistics: stats });
        });

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Tab Locked",
          message: `Tab "${tab.title}" has been locked successfully.`,
          priority: 1,
        });
      }).catch((error) => {
        console.error("Failed to execute content script:", error);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Lock Failed",
          message: "Unable to lock this tab. It may be a system page.",
          priority: 2,
        });
      });
    } else {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Cannot Lock Tab",
        message: "System pages and extension pages cannot be locked.",
        priority: 2,
      });
    }
  });
}

function unlockTab(tabId) {
  lockedTabs.delete(tabId.toString());
  saveLockedTabs();

  // Update statistics
  chrome.storage.local.get("statistics", (data) => {
    const stats = data.statistics || { totalLocks: 0, totalUnlocks: 0 };
    stats.totalUnlocks++;
    chrome.storage.local.set({ statistics: stats });
  });
}

function unlockAllTabs() {
  lockedTabs.clear();
  saveLockedTabs();

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "All Tabs Unlocked",
    message: "All locked tabs have been unlocked.",
    priority: 1,
  });
}

function saveLockedTabs() {
  const tabsObj = Object.fromEntries(lockedTabs);
  chrome.storage.local.set({ lockedTabs: tabsObj });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  lockedTabs.delete(tabId.toString());
  saveLockedTabs();
});
