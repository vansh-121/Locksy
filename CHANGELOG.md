# Changelog

All notable changes to Locksy will be documented in this file.

## [1.0.3] - 2025-10-31

### 🎯 Enhanced User Feedback

#### Added
- **Instant Visual Feedback**: Users now receive immediate notifications when attempting to lock restricted tabs
- **Pre-validation Check**: Tab URLs are validated before lock attempts to prevent confusion
- **Clear Error Messages**: Specific explanations for why a tab cannot be locked
- **Success Confirmations**: Visual confirmation when tabs are locked successfully
- **Multi-Browser Detection**: Enhanced detection for Chrome, Edge, and other Chromium-based browsers

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

#### Fixed
- **Silent Failure Issue**: Previously, clicking "Lock This Tab" on system pages did nothing, making users think the extension was broken. Now, users see clear feedback explaining why the tab cannot be locked.

#### Technical Details
- **Restricted Tab Types**: System pages (`chrome://`, `edge://`, `about:`), extension pages, Chrome Web Store, and empty tabs cannot be locked due to browser security restrictions
- **User Feedback**: All lock attempts now provide immediate visual feedback via the notification system
- **Error Handling**: Comprehensive error messages guide users when tabs cannot be locked

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
This version significantly improves user experience by providing clear feedback when attempting to lock tabs. Previously, users were confused when nothing happened on system pages. Now, they receive immediate, actionable feedback explaining exactly what's happening and why certain tabs cannot be locked.

**User Impact**: Eliminates confusion and improves trust in the extension's functionality.

### Version 1.0.2 Highlights
Added full support for incognito mode, allowing users to protect their private browsing sessions with the same level of security as regular tabs.

### Version 1.0.0 Highlights
Initial release with complete tab locking functionality, military-grade security, and modern user interface.
