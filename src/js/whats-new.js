// What's New Page - Locksy Extension

document.addEventListener('DOMContentLoaded', () => {
    // Set version from manifest
    const manifest = chrome.runtime.getManifest();
    const versionBadge = document.getElementById('whatsNewVersion');
    if (versionBadge) {
        versionBadge.textContent = 'v' + manifest.version;
    }

    // Handle dismiss button
    const dismissBtn = document.getElementById('dismissWhatsNew');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            // Mark as seen and close this window
            chrome.storage.local.set({ showWhatsNew: false }, () => {
                window.close();
            });
        });
    }

    // Handle changelog link
    const changelogLink = document.querySelector('.changelog-link');
    if (changelogLink) {
        changelogLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: e.target.href });
        });
    }
});
