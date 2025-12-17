<div align="center">
  <img src="assets/images/icon.png" alt="Locksy Logo" width="128" height="128">
  
  # 🔒 Locksy
  
  ### Military-Grade Tab Protection for All Major Browsers
  
  [![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?style=for-the-badge&logo=google-chrome)](https://chromewebstore.google.com/detail/kiediieibclgkcnkkmjlhmdainpoidim)
  [![Edge Add-ons](https://img.shields.io/badge/Edge-Add--ons-0078D7?style=for-the-badge&logo=microsoft-edge)](https://microsoftedge.microsoft.com/addons/detail/igobelagfjckjogmmmgcngpdcccnohmn)
  [![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-FF7139?style=for-the-badge&logo=firefox-browser)](https://addons.mozilla.org)
  [![Version](https://img.shields.io/badge/version-1.0.8-green?style=for-the-badge)](https://github.com/vansh-121/Secure-Tab-Extension)
  [![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
  [![Security](https://img.shields.io/badge/Security-SHA--256%20%2B%20Salt-red?style=for-the-badge)](https://github.com/vansh-121/Secure-Tab-Extension)

  
  **A modern browser extension that provides military-grade tab protection with advanced security features.**
  
  **Compatible with:** • Chrome • Edge • Firefox • Brave • Opera • Comet • Vivaldi and all Chromium-based browsers
  
  [Features](#-features) • [Installation](#-installation) • [Security](#-security-notes) • [Privacy](PRIVACY.md)
  
</div>

---

## 🎥 Video Demo

<div align="center">
  
**See Locksy in action!** Watch our video demonstration to learn how to protect your tabs with military-grade security.
  
  [![Locksy Extension Demo](https://img.youtube.com/vi/C99yuKTqEFA/maxresdefault.jpg)](https://youtu.be/C99yuKTqEFA?si=ZIoSZel8nwgcSzZo)
  
  [🎬 Watch on YouTube](https://youtu.be/C99yuKTqEFA?si=ZIoSZel8nwgcSzZo)
  
</div>

---

## 🆕 Recent Improvements

### Version 1.0.8 - CROSS-BROWSER SUPPORT & SECURITY ENHANCEMENTS (December 17, 2025)

<div align="center">
  
  ![Status](https://img.shields.io/badge/status-production%20ready-success?style=flat-square)
  ![Security](https://img.shields.io/badge/encryption-SHA--256%20%2B%20Salt-critical?style=flat-square)
  ![Privacy](https://img.shields.io/badge/privacy-100%25%20local-informational?style=flat-square)
  ![No Tracking](https://img.shields.io/badge/tracking-none-success?style=flat-square)
  ![New Feature](https://img.shields.io/badge/feature-cross%20browser-brightgreen?style=flat-square)
  
</div>

#### 🦊 **Major Feature: Cross-Browser Support**
- 🌐 **Full Cross-Browser Compatibility**: Works seamlessly across all major browsers
  - Chrome, Edge, Firefox, Brave, Opera, Vivaldi, and all Chromium-based browsers
  - WebExtension Polyfill for unified API support
  - Identical features and functionality across all platforms
  - Single unified codebase for all browsers

#### 🔒 **Enhanced Security**
- 🛡️ **XSS Prevention**: Advanced protection against code injection attacks
  - Replaced all `innerHTML` with safe DOM methods
  - Secure element creation and manipulation
  - Protection against malicious dynamic HTML insertion
  - Multiple security layers for content sanitization

#### 📦 **Technical Improvements**
- ⚡ **WebExtension API Compatibility**: Seamless browser operation
  - Browser-agnostic API calls
  - Unified manifest support for Firefox
  - Enhanced polyfill integration
  - Updated all HTML pages for cross-browser compatibility

#### 🐛 **Bug Fixes**
- Fixed "Lock All Tabs" functionality in background script
- Improved popup integration with background actions
- Enhanced service worker reliability across browsers

**What's New:** This version introduces full cross-browser support with Firefox compatibility, enhanced XSS prevention for improved security, and a unified WebExtension API for seamless operation across all major browsers. The extension now provides identical features and security across Chrome, Edge, Firefox, Brave, Opera, and all Chromium-based browsers!

---

### Version 1.0.7 - KEYBOARD SHORTCUTS & VISUAL INDICATORS (December 7, 2025)

<div align="center">
  
  ![Status](https://img.shields.io/badge/status-production%20ready-success?style=flat-square)
  ![Security](https://img.shields.io/badge/encryption-SHA--256%20%2B%20Salt-critical?style=flat-square)
  ![Privacy](https://img.shields.io/badge/privacy-100%25%20local-informational?style=flat-square)
  ![No Tracking](https://img.shields.io/badge/tracking-none-success?style=flat-square)
  ![New Feature](https://img.shields.io/badge/feature-keyboard%20shortcuts-blueviolet?style=flat-square)
  
</div>

#### ⌨️ **New Feature: Keyboard Shortcuts**
- 🎯 **Pre-configured Shortcuts**: Ready-to-use keyboard shortcuts that work immediately
  - **Alt+Shift+9**: Lock current tab instantly
  - **Alt+Shift+0**: Open Domain Lock Manager
  - **Alt+Shift+8**: Lock all tabs in current window
  - **Fully Customizable**: All the shortcut keys are customizable in keyboard shortcut manager.

- ⚡ **Bulk Operations**: Lock all tabs feature via keyboard
  - Locks all compatible tabs in current window
  - Automatically skips system and extension pages
  - Reports count of locked and skipped tabs

#### 🔒 **Visual Indicators**

- 🎨 **Lock Icon on Tab Favicon**: Locked tabs display a distinctive red lock icon
  - Dynamically generated using HTML5 Canvas
  - Original favicon automatically restored on unlock
  
- 🔢 **Badge Counter on Extension Icon**: Shows number of locked tabs at a glance
  - Red background with white text
  - Auto-updates on lock/unlock operations
  - Persists across browser restarts
  - Real-time updates for all scenarios

#### 🎨 **Enhanced User Interface**

- 📋 **Keyboard Shortcuts Info Panel**: Added in popup with visual kbd tags
- 💡 **Contextual Display**: Shows shortcuts only when password is set
- 🌈 **Modern Styling**: Gradient backgrounds and smooth animations

#### 🔧 **Technical Improvements**
- **Command Handlers**: Four dedicated functions for keyboard shortcuts
- **Badge System**: Real-time counter updates across all operations
- **Favicon Management**: Dynamic lock icon generation and restoration
- **Enhanced Documentation**: Comprehensive keyboard shortcuts guide

**What's New:** This version introduces power-user features with pre-configured keyboard shortcuts for instant tab locking, domain management, and bulk operations. Visual indicators including lock icons on tab favicons and a badge counter provide clear feedback about locked tabs. The shortcuts work out-of-the-box and can be customized if needed!

---

### Version 1.0.6 - DOMAIN LOCK FEATURE (November 22, 2025)

<div align="center">
  
  ![Status](https://img.shields.io/badge/status-production%20ready-success?style=flat-square)
  ![Security](https://img.shields.io/badge/encryption-SHA--256%20%2B%20Salt-critical?style=flat-square)
  ![Privacy](https://img.shields.io/badge/privacy-100%25%20local-informational?style=flat-square)
  ![No Tracking](https://img.shields.io/badge/tracking-none-success?style=flat-square)
  ![New Feature](https://img.shields.io/badge/feature-domain%20lock-blueviolet?style=flat-square)
  
</div>

#### 🌐 **New Feature: Domain Lock**
- 🔒 **Lock Entire Domains**: Lock all tabs matching a domain pattern (e.g., `*.google.com`, `github.com`)
- 🔄 **Persistent Protection**: Domain locks persist across browser restarts and sessions
- 🆕 **Auto-Lock New Tabs**: Automatically locks new tabs that match locked domain patterns
- ⚙️ **Unlock Preferences**: Choose default unlock behavior for each domain:
  - Unlock only the current tab (keeps domain lock active)
  - Unlock all tabs for this domain (temporary exemption)
  - Remember your preference for future unlocks
- 🎯 **Wildcard Support**: Lock entire subdomains with `*.example.com` pattern
- 🛡️ **Domain Manager**: Dedicated interface to manage all locked domains and preferences

#### 🔧 **Technical Improvements**
- **Pattern Matching**: Smart domain pattern matching with exact match and wildcard support
- **Temporary Exemptions**: Track temporarily unlocked tabs separately from domain locks
- **Preference Storage**: Per-domain unlock preference persistence
- **Service Worker Optimization**: Domain locks restored on service worker wake-up

**What's New:** This version introduces a powerful domain locking feature that lets you protect all tabs from specific websites. Perfect for locking work domains (like company portals), sensitive services (like banking sites), or entire platforms (like social media). Set it once, and all matching tabs are automatically protected!

---

### Version 1.0.5 - Release (November 15, 2025)

<div align="center">
  
  ![Status](https://img.shields.io/badge/status-production%20ready-success?style=flat-square)
  ![Security](https://img.shields.io/badge/encryption-SHA--256%20%2B%20Salt-critical?style=flat-square)
  ![Privacy](https://img.shields.io/badge/privacy-100%25%20local-informational?style=flat-square)
  ![No Tracking](https://img.shields.io/badge/tracking-none-success?style=flat-square)
  
</div>

#### ⚡ **Performance Optimization & Code Enhancement**
- 🚀 **Improved Speed**: Optimized core JavaScript for faster execution and enhanced responsiveness
- 💻 **Code Quality**: Refactored and cleaned up codebase for improved maintainability
- 🎯 **Enhanced Efficiency**: Overall extension performs faster with better responsiveness

---

> 📜 **Full Version History**: See [CHANGELOG.md](docs/CHANGELOG.md) for complete version history and older releases.

---

## 🔒 Security Notes

### 🛡️ Password Security
- **SHA-256 Hashing**: Passwords are hashed before storage using industry-standard cryptography
- **No Plain Text Storage**: Your actual password is never stored, only the hash
- **Current Password Required**: To change password, you must enter your current password first
- **No Administrative Bypass**: No way to change password without knowing current one
- **First-Time Setup**: Only when no password exists can you set one without verification
- **Secure Storage**: Password hashes stored locally using Chrome's secure storage API
- **No External Transmission**: No data sent to external servers

### 🎯 Tab Locking Security
- **Password-Only Unlock**: Tabs can ONLY be unlocked by entering correct password
- **No Bypass Methods**: No administrative unlock or backdoor access
- **Local Operation**: Extension works entirely offline
- **System Page Protection**: Chrome system pages cannot be locked for security

### 🚨 What's Protected Against
- ✅ **Unauthorized Password Changes**: Requires current password verification
- ✅ **Brute Force Attacks**: Failed attempts logged and blocked
- ✅ **Administrative Bypass**: No backdoor or override methods
- ✅ **Extension Hijacking**: Secure state management prevents tampering

---

**🔐 SECURITY GUARANTEE: This extension is now truly secure against all known bypass methods and unauthorized access attempts.**

---

## ✨ Features

<div align="center">

| 🔐 Security | 🎯 Functionality | ⚡ Performance | 🛡️ Privacy |
|------------|------------------|---------------|-----------|
| SHA-256 Encryption | One-Click Locking | 70% CPU Reduction | 100% Offline |
| Brute Force Protection | Password-Only Unlock | Lightweight | No Tracking |
| No Plain Text Storage | Persistent Locks | Instant Response | GDPR Compliant |
| Session Timeout | Navigation Protection | Optimized Code | No Data Collection |

</div>

### 🎯 Core Functionality
- **Toggle Activation**: Easy on/off switch to enable/disable the extension
- **Tab Locking**: Secure any tab with a password-protected overlay
- **Domain Locking**: Lock entire domains with wildcard support
- **Password Protection**: Set a master password to control access
- **Instant Unlock**: Quick unlock from the extension popup
- **Keyboard Shortcuts**: Optional customizable shortcuts for power users
- **Badge Counter**: See number of locked tabs at a glance
- **Incognito Mode**: Works seamlessly in private browsing windows (requires manual activation)

### 🎨 Enhanced UI
- **Modern Design**: Clean, gradient-based interface with smooth animations
- **Status Indicators**: Clear visual feedback for extension state
- **Password Strength**: Real-time password strength indicator
- **Responsive Layout**: Optimized for the extension popup size
- **Smooth Animations**: Floating icons, glowing effects, and transitions

### 🔒 Security Features
- **Local Storage**: Password stored locally in Chrome's secure storage
- **Extension State**: Only works when activated by the user
- **Tab Validation**: Cannot lock Chrome system pages
- **Secure Overlay**: Full-screen lock with blur effects

---

## 📥 Installation

### 🌐 From Official Stores (Recommended)

<div align="center">

#### Chrome & Chromium Browsers
**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/kiediieibclgkcnkkmjlhmdainpoidim)** 🚀

Works on: Chrome • Brave • Opera • Vivaldi • and more

#### Microsoft Edge
**[Install from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/igobelagfjckjogmmmgcngpdcccnohmn)** 🌐

</div>

**Installation Steps:**
1. Click the link above for your browser
2. Click **"Add to Chrome"** or **"Get"** (for Edge)
3. Confirm by clicking **"Add extension"**
4. Locksy icon will appear in your toolbar! 🎉
5. Pin it for quick access (click puzzle icon → pin Locksy)

### 💻 Manual Installation (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/vansh-121/Secure-Tab-Extension.git
   cd Secure-Tab-Extension
   ```

2. **Open Browser Extensions**
   - **Chrome/Brave/Opera/Vivaldi**: Navigate to `chrome://extensions/`
   - **Edge**: Navigate to `edge://extensions/`
   - Enable **Developer mode** (toggle in top-right)

3. **Load the extension**
   - Click **"Load unpacked"**
   - Select the `Secure-Tab-Extension` folder
   - Locksy icon will appear in your toolbar! 🎉

4. **Pin the extension** (Optional)
   - Click the puzzle piece icon in browser toolbar
   - Pin Locksy for quick access

5. **Enable Incognito/Private Mode** (Optional)
   - Go to your browser's extensions page
   - Find Locksy extension
   - Click **"Details"**
   - Scroll down and toggle **"Allow in Incognito"** or **"Allow in InPrivate"**
   - Now you can lock tabs in private browsing windows too! 🕶️

---

## 🚀 How to Use

### 🚀 First Time Setup
1. **Activate Extension**: Click the toggle switch to activate the extension
2. **Set Initial Password**: Enter a master password (you'll see "🔑 Set Master Password")
3. **Password Strength**: Use the real-time strength indicator to create a strong password
4. **Confirm Setup**: Click "Set Password" to save your master password

### 🔄 Changing Your Password (SECURE)
1. **Current Password Required**: You'll see "🔐 Current Password" field
2. **Enter Current**: You MUST enter your current password first
3. **Enter New**: Set your new master password (you'll see "🔄 New Password")
4. **Verification**: System verifies your current password before allowing change
5. **Security**: If current password is wrong, change is blocked for security

### 🔒 Locking Tabs
1. **Password Required**: Ensure you have set a master password first
2. **Lock Current Tab**: Click "🔒 Lock Current Tab" button
3. **Secure Overlay**: Tab will be covered with password-protected overlay
4. **Unlock Only**: Enter correct password on the locked tab to unlock

#### ⚠️ Tabs That Cannot Be Locked
For security and technical reasons, the following types of tabs **cannot be locked**:
- 🚫 **Browser Settings Pages**: `chrome://`, `edge://`, `about:` pages
- 🚫 **Extension Pages**: Chrome Web Store, extension management pages
- 🚫 **New Tab Pages**: Empty tabs or browser new tab pages
- 🚫 **System Pages**: Browser internal pages and configurations

**Why?** Browsers restrict extensions from modifying these pages for security. When you try to lock these tabs, you'll now see a clear message explaining why it cannot be locked.

✅ **Lockable Tabs**: All regular websites (http://, https://) including news sites, social media, banking, email, etc.

### 🛡️ Security Features
- **No Bypass Methods**: Only correct password unlocks tabs
- **Current Password Verification**: Password changes require current password
- **Visual Security Indicators**: Clear UI showing security requirements
- **Failed Attempt Logging**: Security events tracked in console
- **Incognito Protection**: Same security level in private browsing mode

### ⌨️ Keyboard Shortcuts

Locksy includes **pre-configured keyboard shortcuts** that work out-of-the-box. **Ready to use** - No setup required!

#### 🎯 Available Shortcuts

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Alt+Shift+9` | **Lock Current Tab** | Instantly locks the active tab |
| `Alt+Shift+0` | **Open Domain Manager** | Opens Domain Lock Manager window |
| `Alt+Shift+8` | **Lock All Tabs** | Locks all tabs in current window |

#### ✨ Features
- 🔔 Smart notifications for every action
- 🛡️ Automatic safety checks (password, activation status)
- ⚡ Instant feedback with detailed messages
- 🎯 Bulk operations (lock all tabs at once)

#### ⚙️ Customize Shortcuts (Optional)

1. **Navigate to Shortcuts Page:**
   - Chrome: `chrome://extensions/shortcuts`
   - Edge: `edge://extensions/shortcuts`
   - Brave: `brave://extensions/shortcuts`

2. **Find Locksy** in the list

3. **Click the pencil icon** next to any command and press your desired key combination

4. **Best Practices:**
   - ✅ Use `Alt+Shift+[Key]` combinations for least conflicts
   - ✅ Try alternative keys if conflicts occur (e.g., `Alt+Shift+Q`, `Alt+Shift+Z`)
   - ❌ Avoid browser shortcuts (`Ctrl+T`, `Ctrl+W`, `Ctrl+D`, etc.)
   - ❌ Don't use keys already taken by other extensions

#### 🔧 Troubleshooting
- **"Not set" or grayed out?** → Another extension is using that combo
- **Not working?** → Check if browser shortcuts override it
- **Still conflicts?** → Try alternative combinations like `Alt+Shift+Q`, `Ctrl+Shift+Period`, or `Alt+Shift+[0-9]`

See [Keyboard Shortcuts Documentation](docs/KEYBOARD_SHORTCUTS.md) for detailed usage guide.

### 🕶️ Incognito Mode
1. **Enable Permission**: Go to `chrome://extensions/` → Locksy → Details → "Allow in Incognito"
2. **Unified Password**: Same master password works for both normal and incognito tabs
3. **Seamless Experience**: Lock and unlock tabs in private windows just like regular tabs
4. **Privacy First**: No separate configuration needed - it just works!

## 🎮 User Interface

### Main Popup
- **Header**: Animated lock icon with extension title
- **Status Indicator**: Shows active/inactive state with color coding
- **Toggle Switch**: Large, modern switch for activation
- **Password Input**: Secure input with strength indicator
- **Action Buttons**: Lock/Unlock controls with emoji icons

### Lock Overlay
- **Full Screen**: Complete tab coverage with gradient background
- **Secure Input**: Password field with focus animations
- **Error Handling**: Shake animations for incorrect passwords
- **Success Feedback**: Smooth unlock animation

## 🔧 Technical Details

### Permissions
- `storage`: For saving passwords and settings
- `tabs`: For tab management and locking
- `scripting`: For injecting the lock overlay
- `activeTab`: For current tab access
- `notifications`: For user feedback
- `webNavigation`: For monitoring navigation events
- `incognito` (spanning): For optional incognito mode support

### Files Structure
- `manifest.json`: Extension configuration
- `popup.html/js`: Main interface and logic
- `content.js`: Lock overlay injection
- `background.js`: Service worker for tab management
- `icon.png`: Extension icon

---

## 💡 Tips

- ✅ Use a strong password with letters, numbers, and symbols
- ✅ The extension only works when activated via the toggle
- ⚠️ System pages (`chrome://`, `edge://`, `about:`) cannot be locked for security reasons
- ⚠️ Extension pages and new tab pages cannot be locked due to browser restrictions
- 💡 If you see an error when locking, check if the tab is a system or extension page
- 🔒 Your password is stored securely in Chrome's local storage
- 🕶️ Enable incognito mode in extension settings to protect private browsing tabs
- 🔑 Same password works across both normal and incognito windows for convenience
- ✅ All regular websites (http://, https://) can be locked successfully

## 📚 Documentation

- **[PRIVACY.md](PRIVACY.md)** - Comprehensive privacy policy (GDPR/CCPA compliant)
- **Security Notes** - See above for detailed security information
- **Version History** - Check commit history for all changes

---

<div align="center">

## 🌟 Support Locksy

If you find Locksy useful, please consider:

[![Star on GitHub](https://img.shields.io/github/stars/vansh-121/Secure-Tab-Extension?style=social)](https://github.com/vansh-121/Secure-Tab-Extension)
[![Follow](https://img.shields.io/github/followers/vansh-121?style=social&label=Follow)](https://github.com/vansh-121)
[![Issues](https://img.shields.io/github/issues/vansh-121/Secure-Tab-Extension?style=flat-square)](https://github.com/vansh-121/Secure-Tab-Extension/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/vansh-121/Secure-Tab-Extension?style=flat-square)](https://github.com/vansh-121/Secure-Tab-Extension/pulls)

---

### 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

### 🔒 Security is not a feature, it's a necessity.

<img src="assets/images/icon.png" alt="Locksy Logo" width="80" height="80">

**Locksy** - Your Tabs, Your Password, Your Privacy.

[Report Bug](https://github.com/vansh-121/Secure-Tab-Extension/issues) • [Request Feature](https://github.com/vansh-121/Secure-Tab-Extension/issues) • [Privacy Policy](PRIVACY.md)

---

**Made with ❤️ for Privacy & Security** | © 2025 Locksy

</div>
