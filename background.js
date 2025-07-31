let lockedTabs = new Set(); // Track locked tabs by tab ID

chrome.runtime.onInstalled.addListener(() => {
  // Initialize extension state
  chrome.storage.local.get(["extensionActive", "lockPassword"], (data) => {
    // Set default active state if not set
    if (data.extensionActive === undefined) {
      chrome.storage.local.set({ extensionActive: true });
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

chrome.runtime.onMessage.addListener((message, sender) => {
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
          lockedTabs.add(message.tabId);
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
    }
    // Removed insecure unlock action - tabs can only be unlocked by entering the correct password
  });
});

function lockTab(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      }).then(() => {
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

chrome.tabs.onRemoved.addListener((tabId) => {
  lockedTabs.delete(tabId);
});
