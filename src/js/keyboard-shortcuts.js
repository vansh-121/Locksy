// Keyboard Shortcuts Page Script

document.addEventListener('DOMContentLoaded', () => {
    loadCurrentShortcuts();
    setupEventListeners();
});

// Load and display current keyboard shortcuts
function loadCurrentShortcuts() {
    if (typeof chrome !== 'undefined' && chrome.commands) {
        chrome.commands.getAll((commands) => {
            commands.forEach((command) => {
                updateShortcutDisplay(command.name, command.shortcut);
            });
        });
    }
}

// Update shortcut display with actual configured shortcuts
function updateShortcutDisplay(commandName, shortcut) {
    const elementId = `shortcut-${commandName}`;
    const element = document.getElementById(elementId);

    if (element && shortcut) {
        // Parse the shortcut string and create kbd elements
        const keys = parseShortcut(shortcut);
        element.innerHTML = keys.map(key => `<kbd>${key}</kbd>`).join(' + ');
    }
}

// Parse shortcut string into individual keys
function parseShortcut(shortcut) {
    if (!shortcut) return [];

    // Replace common modifiers for better display
    return shortcut
        .replace(/\+/g, ' ')
        .split(' ')
        .map(key => {
            // Capitalize and format keys
            if (key.toLowerCase() === 'ctrl') return 'Ctrl';
            if (key.toLowerCase() === 'alt') return 'Alt';
            if (key.toLowerCase() === 'shift') return 'Shift';
            if (key.toLowerCase() === 'command' || key.toLowerCase() === 'cmd') return 'Cmd';
            return key.toUpperCase();
        });
}

// Setup event listeners for buttons
function setupEventListeners() {
    // Customize Shortcuts button
    const customizeBtn = document.getElementById('customizeShortcutsBtn');
    if (customizeBtn) {
        customizeBtn.addEventListener('click', openBrowserShortcutsPage);
    }

    // Back to popup button
    const backBtn = document.getElementById('backToPopupBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.close();
        });
    }
}

// Open browser-specific shortcuts page
function openBrowserShortcutsPage() {
    const userAgent = navigator.userAgent.toLowerCase();
    let shortcutsUrl = 'chrome://extensions/shortcuts';
    let browserName = 'Chrome';

    // Detect browser and set appropriate URL
    if (userAgent.includes('edg/')) {
        shortcutsUrl = 'edge://extensions/shortcuts';
        browserName = 'Edge';
    } else if (userAgent.includes('brave')) {
        shortcutsUrl = 'brave://extensions/shortcuts';
        browserName = 'Brave';
    } else if (userAgent.includes('opr/') || userAgent.includes('opera')) {
        shortcutsUrl = 'opera://extensions/shortcuts';
        browserName = 'Opera';
    } else if (userAgent.includes('vivaldi')) {
        shortcutsUrl = 'vivaldi://extensions/shortcuts';
        browserName = 'Vivaldi';
    } else if (userAgent.includes('firefox')) {
        shortcutsUrl = 'about:addons';
        browserName = 'Firefox';
    }

    // Open shortcuts page in new tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: shortcutsUrl }, (tab) => {
            if (chrome.runtime.lastError) {
                // Fallback: Show notification with manual instructions
                showNotification(
                    `Please manually open ${browserName} extensions and navigate to shortcuts settings.`,
                    'warning'
                );
            } else {
                showNotification(`Opening ${browserName} shortcuts settings...`, 'success');
                // Close this page after a short delay
                setTimeout(() => {
                    window.close();
                }, 1000);
            }
        });
    } else {
        showNotification('Unable to open shortcuts page automatically.', 'warning');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');

    if (!notification) return;

    // Remove existing classes
    notification.className = 'notification';

    // Add type class
    notification.classList.add(type);

    // Set message
    notification.textContent = message;

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC to close
    if (e.key === 'Escape') {
        window.close();
    }

    // Ctrl/Cmd + K to open shortcuts settings
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openBrowserShortcutsPage();
    }
});
