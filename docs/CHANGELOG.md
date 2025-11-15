# Changelog

All notable changes to Locksy will be documented in this file.

## [1.0.5] - 2025-11-15

### ⚡ Performance Optimization & Code Enhancement

#### Improved
- **Code Performance**: Optimized core JavaScript files for faster execution and improved efficiency
  - Enhanced script loading and initialization processes
  - Streamlined event handlers for better responsiveness
  - Reduced execution overhead in background service worker and content scripts
  
#### Enhanced
- **Overall Speed**: Improved extension responsiveness and tab locking operations
- **Code Quality**: Refactored and cleaned up codebase for better maintainability
- **Extension Efficiency**: Better resource management and reduced memory footprint

---

## [1.0.4] - 2025-11-01

### � Security Enhancements

#### Added
- **Salted Password Hashing**: Implemented cryptographically secure salted hashing for all passwords
  - Each password now uses a unique 128-bit random salt generated via `crypto.getRandomValues()`
  - Salt is stored with hash in format `salt:hash` for maximum security
  - Protects against rainbow table and precomputed hash attacks
  - Backward compatible with existing passwords (automatic migration on next password verification)

### �🐛 Bug Fixes

#### Fixed
- **File URL Protection**: Added blocking for `file://` protocol URLs to prevent errors when attempting to lock local file tabs
- **Error Handling**: Enhanced error messages to specifically mention local files cannot be locked
- **Console Logging**: Added debug console.error logs for better troubleshooting of tab access and script injection errors

#### Technical Details
- **crypto-utils.js**: 
  - Added `generateSalt()` function for secure random salt generation
  - Updated `hashPassword()` to accept optional salt parameter and return `salt:hash` format
  - Enhanced `verifyPassword()` to support both new salted format and legacy format for backward compatibility
- **content.js**: Updated password verification to support new salted hash format
- **Background Script**: Updated `lockTab()` function to include `file://` URL validation
- **Error Messages**: Now clearly indicates when local files, restricted pages, or system pages cannot be locked
- **Security Compliance**: Prevents extension errors when users attempt to lock file:// URLs, which browsers restrict for security

---

## [1.0.3] - 2025-10-31

### 🎯 Enhanced User Feedback

#### Added
- **Instant Visual Feedback**: Users now receive immediate notifications when attempting to lock restricted tabs
- **Pre-validation Check**: Tab URLs are validated before lock attempts to prevent confusion
- **Clear Error Messages**: Specific explanations for why a tab cannot be locked
- **Success Confirmations**: Visual confirmation when tabs are locked successfully
- **Multi-Browser Detection**: Enhanced detection for Chrome, Edge, and other Chromium-based browsers
- **Service Worker Startup Handler**: Added `chrome.runtime.onStartup` listener to restore locked tabs when service worker wakes up
- **Auto-Recovery System**: Implemented lazy loading of locked tabs state in all event listeners

#### Improved
- **popup.js**: Enhanced lock button handler with pre-validation and response handling
  - Added URL validation before sending lock message
  - Checks for `chrome://`, `edge://`, `about:`, extension pages, and empty tabs
  - Displays user-friendly error messages for restricted tabs
  - Shows success messages when tabs lock successfully

- **background.js**: Improved message handling and response system
  - Added `sendResponse` callback to `lockTab` function
  - Enhanced error handling with descriptive messages
  - Better communication between background script and popup
  - Added support for async response handling
  - Implemented `restoreLockedTabs()` function to reload state from storage
  - Added `chrome.runtime.onStartup` listener for service worker restart handling
  - Added safety checks in all event listeners to restore state if service worker just woke up
  - Prevents loss of locked tabs protection due to service worker lifecycle

#### Fixed
- **Silent Failure Issue**: Previously, clicking "Lock This Tab" on system pages did nothing, making users think the extension was broken. Now, users see clear feedback explaining why the tab cannot be locked.
- **Service Worker Sleep Bug**: Critical fix for locked tabs losing protection after Chrome's service worker goes to sleep (~30 seconds of inactivity). The extension now properly restores locked tabs from storage when the service worker wakes up, ensuring continuous protection even after periods of inactivity.

#### Technical Details
- **Restricted Tab Types**: System pages (`chrome://`, `edge://`, `about:`), extension pages, Chrome Web Store, and empty tabs cannot be locked due to browser security restrictions
- **User Feedback**: All lock attempts now provide immediate visual feedback via the notification system
- **Error Handling**: Comprehensive error messages guide users when tabs cannot be locked
- **Service Worker Lifecycle**: Chrome MV3 service workers sleep after ~30 seconds of inactivity. The extension now handles this by persisting locked tabs to `chrome.storage.local` and restoring them on service worker wake-up
- **State Persistence**: `lockedTabs` Set is now automatically restored from storage when service worker starts or when any event listener fires after sleep
- **Console Logging**: Added debug logs to track service worker restarts and locked tabs restoration

---

## [1.0.2] - 2025-10-31

### 🕶️ Incognito Mode Support

#### Added
- **Incognito Mode Compatibility**: Extension now works seamlessly in private browsing windows
- **Unified Password System**: Same master password protects tabs in both normal and incognito modes
- **Spanning Incognito**: Configured manifest to support incognito mode with shared storage

#### Fixed
- **Deprecated Event**: Removed deprecated `unload` event listener
- **Event Handling**: Improved `pagehide` event handling for better lock persistence

---

## [1.0.0] - 2025-10-27

### 🚀 Initial Release

#### Core Features
- **SHA-256 Password Hashing**: Military-grade encryption for password security
- **Tab Locking**: Secure any tab with password-protected overlay
- **Master Password**: Set and change master password with verification
- **Extension Toggle**: Easy activation/deactivation switch
- **Modern UI**: Clean, gradient-based interface with smooth animations
- **Password Strength Indicator**: Real-time feedback on password strength

#### Security Features
- **No Plain Text Storage**: Passwords hashed before storage
- **Current Password Verification**: Required for password changes
- **Brute Force Protection**: Failed attempt tracking and lockout system
- **Session Timeout**: Automatic session expiration for security
- **Local Storage Only**: No external data transmission

#### Privacy & Compliance
- **100% Offline Operation**: No external servers or data collection
- **GDPR/CCPA Compliant**: Comprehensive privacy policy
- **No Tracking**: Zero analytics or user tracking
- **Secure Storage**: Chrome's secure local storage API

#### User Interface
- **Responsive Design**: Optimized for extension popup
- **Status Indicators**: Clear visual feedback for extension state
- **Smooth Animations**: Floating icons, glowing effects, and transitions
- **Error Handling**: Shake animations and visual feedback

---

## Release Notes

### Version 1.0.3 Highlights
This version significantly improves user experience and fixes a critical service worker bug:

**UX Improvements**: Users now receive clear, immediate feedback when attempting to lock tabs. Previously, when users tried to lock system pages, nothing would happen, causing confusion. Now they get specific error messages explaining why certain tabs cannot be locked.

**Critical Bug Fix**: Fixed a major issue where locked tabs would lose protection after Chrome's service worker went to sleep (~30 seconds of inactivity). The extension now properly restores and maintains lock protection even after service worker restarts, ensuring continuous security for locked tabs.

**User Impact**: Eliminates confusion, improves trust in the extension's functionality, and ensures locked tabs remain protected at all times.

### Version 1.0.2 Highlights
Added full support for incognito mode, allowing users to protect their private browsing sessions with the same level of security as regular tabs.

### Version 1.0.0 Highlights
Initial release with complete tab locking functionality, military-grade security, and modern user interface.
