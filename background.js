let lockedTabs = new Set();
let lockTimeout = 60000;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("lockTimer", { periodInMinutes: lockTimeout / 60000 });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "lock") {
    lockedTabs.add(message.tabId);
    lockTab(message.tabId);
  } else if (message.action === "unlock") {
    unlockTab(message.tabId);
  }
});

function lockTab(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      });
    }
  });
}

function unlockTab(tabId) {
  const userPassword = prompt("Enter password to unlock the tab:");
  chrome.storage.local.get("lockPassword", (data) => {
    if (data.lockPassword === userPassword) {
      lockedTabs.delete(tabId);
      alert("Tab unlocked successfully!");
    } else {
      alert("Incorrect password. Unable to unlock the tab.");
    }
  });
}

function checkLockConditions() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab && lockedTabs.has(activeTab.id)) {
      lockTab(activeTab.id);
    }
  });
}

chrome.tabs.onActivated.addListener(checkLockConditions);
chrome.windows.onFocusChanged.addListener(checkLockConditions);

chrome.alarms.onAlarm.addListener(() => {
  lockedTabs.forEach(tabId => lockTab(tabId));
});
