let lockedTabs = new Set(); // Track locked tabs by tab ID
let lockTimeout = 60000;

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
        lockedTabs.add(message.tabId); // Lock this specific tab by ID
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
    unlockTab(message.tabId);
  }
});

function lockTab(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      }).catch((error) => {
        console.error("Failed to execute content script:", error);
      });
    }
  });
}

function unlockTab(tabId) {
  const userPassword = prompt("Enter password to unlock the tab:");
  chrome.storage.local.get("lockPassword", (data) => {
    if (data.lockPassword === userPassword) {
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
        title: "Incorrect Password",
        message: "Unable to unlock the tab.",
        priority: 2,
      });
    }
  });
}

// Automatically lock the active tab if it’s in the locked tabs set
function checkLockConditions() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && lockedTabs.has(activeTab.id)) {
      lockTab(activeTab.id);
    }
  });
}

// Clear locked tab from the set if the tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  lockedTabs.delete(tabId);
});

chrome.tabs.onActivated.addListener(checkLockConditions);
chrome.windows.onFocusChanged.addListener(checkLockConditions);

chrome.alarms.create("lockTimer", { periodInMinutes: lockTimeout / 60000 });
chrome.alarms.onAlarm.addListener(() => {
  lockedTabs.forEach((tabId) => lockTab(tabId));
});
