let lockedTabs = new Set(); // Track locked tabs by tab ID

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("lockPassword", (data) => {
    if (!data.lockPassword) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Set Password",
        message: "Please set a password to start using the Tab Lock extension.",
        priority: 2,
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
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
  } else if (message.action === "unlock") {
    authenticateAndUnlockTab(message.tabId);
  }
});

function lockTab(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      }).catch((error) => {
        console.error("Failed to execute content script:", error);
      });
    }
  });
}

function authenticateAndUnlockTab(tabId) {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError || !token) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Authentication Failed",
        message: "Unable to authenticate. Please try again.",
        priority: 2,
      });
      return;
    }

    chrome.identity.getProfileUserInfo((userInfo) => {
      chrome.storage.local.get(["lockPassword", "userEmail"], (data) => {
        if (userInfo.email === data.userEmail) {
          lockedTabs.delete(tabId);
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Unlocked",
            message: "Tab unlocked successfully!",
            priority: 2,
          });
        } else {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Unauthorized User",
            message: "You are not authorized to unlock this tab.",
            priority: 2,
          });
        }
      });
    });
  });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  lockedTabs.delete(tabId);
});
