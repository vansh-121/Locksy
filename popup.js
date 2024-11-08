document.getElementById('setPassword').addEventListener('click', () => {
  const password = document.getElementById('password').value;
  if (password) {
    chrome.storage.local.set({ lockPassword: password }, () => {
      alert('Password set successfully!');
    });
  } else {
    alert('Please enter a password.');
  }
});

document.getElementById('lockTab').addEventListener('click', () => {
  chrome.storage.local.get("lockPassword", (data) => {
    if (data.lockPassword) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.runtime.sendMessage({ action: 'lock', tabId });
      });
    } else {
      alert("Please set a password first to enable tab locking.");
    }
  });
});

document.getElementById('unlockTab').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    chrome.runtime.sendMessage({ action: 'unlock', tabId });
  });
});
