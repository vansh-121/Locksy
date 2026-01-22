# Locksy Extension - Project Structure

## Overview
This is a cross-browser extension that provides military-grade tab protection with PBKDF2 key derivation (600,000 iterations), SHA-256 encryption, and cryptographic salt generation.

## Directory Structure

```
Locksy Extension/
├── assets/                    # Static assets
│   └── images/               # Image files
│       ├── icon.png          # Extension icon (16x16, 48x48, 128x128)
│       └── screenshots/      # Screenshot images for documentation
│
├── docs/                      # Documentation files
│   ├── CHANGELOG.md          # Version history and changes
│   ├── DESIGN_SYSTEM.md      # Design system and styling guide
│   ├── KEYBOARD_SHORTCUTS.md # Keyboard shortcuts documentation
│   ├── PRIVACY.md            # Privacy policy
│   └── PROJECT_STRUCTURE.md  # This file - project organization guide
│
├── src/                       # Source code
│   ├── css/                  # Stylesheets
│   │   ├── domain-manager.css      # Domain Lock Manager UI styles
│   │   ├── keyboard-shortcuts.css  # Keyboard shortcuts styles
│   │   ├── locked.css              # Locked tab overlay styles
│   │   └── popup.css               # Popup UI styles
│   │
│   ├── html/                 # HTML templates
│   │   ├── domain-manager.html     # Domain Lock Manager interface
│   │   ├── keyboard-shortcuts.html # Keyboard shortcuts guide
│   │   ├── locked.html             # Locked tab overlay interface
│   │   └── popup.html              # Extension popup interface
│   │
│   └── js/                   # JavaScript files
│       ├── activity-tracker.js     # Content script for activity detection
│       ├── background.js           # Service worker (background script)
│       ├── browser-polyfill.min.js # WebExtension API polyfill for cross-browser support
│       ├── crypto-utils.js         # PBKDF2 cryptographic utilities
│       ├── domain-manager.js       # Domain lock management logic
│       ├── keyboard-shortcuts.js   # Keyboard shortcuts guide logic
│       ├── locked.js               # Locked tab overlay logic
│       ├── popup.js                # Popup UI logic and event handlers
│       └── whats-new.js            # What's New overlay logic
│
├── archive/                   # Archived/legacy files
│   └── content.js.old        # Previous content script implementation
│
├── dist/                      # Build output directory
│   ├── locksy-chrome.zip     # Chrome/Edge distribution package
│   ├── locksy-firefox.zip    # Firefox distribution package
│   └── locksy-firefox/       # Firefox build directory
│
├── tests/                     # Testing files
│   ├── performance-dashboard.html # Performance monitoring UI
│   ├── performance-test.js   # PBKDF2 performance testing
│   ├── test-kdf.html         # KDF testing interface
│   └── README.md             # Testing documentation
│
├── .git/                      # Git repository data
├── .gitignore                # Git ignore rules
├── ACTIVITY_DETECTION.md     # Enhanced activity detection documentation
├── build.js                  # Build script for distribution packages
├── CHROME_WEB_STORE_DESCRIPTION.txt  # Chrome Web Store listing description
├── DEBUG_AUTO_LOCK.md        # Auto-lock debugging guide
├── EDGE_ADDONS_DESCRIPTION.txt       # Edge Add-ons listing description
├── FIREFOX_ADDON_DESCRIPTION.txt     # Firefox Add-ons listing description
├── FIREFOX_PRIVACY_POLICY.txt        # Firefox-specific privacy policy
├── LICENSE                   # MIT License
├── manifest.json             # Chrome/Edge extension manifest (Manifest V3)
├── manifest.firefox.json     # Firefox extension manifest
├── node_modules/             # npm dependencies
├── package.json              # npm package configuration
├── package-lock.json         # npm dependency lock file
├── README.md                 # Main documentation and features
├── RELEASE_NOTES_v2.0.0.txt  # Release notes for v2.0.0
├── TIMER_DESIGN_SHOWCASE.md  # Timer feature design showcase
├── TIMER_FEATURE_SUMMARY.md  # Comprehensive timer feature documentation
├── TIMER_QUICK_START.md      # Quick start guide for timer features
└── TEST_KEYBOARD_SHORTCUTS.md # Keyboard shortcuts testing guide

```

## File Descriptions

### Root Files
- **manifest.json**: Chrome/Edge extension configuration (Manifest V3)
- **manifest.firefox.json**: Firefox extension configuration with browser-specific adaptations
- **README.md**: Main documentation, installation guide, and features
- **LICENSE**: MIT License for the project
- **.gitignore**: Git ignore patterns
- **build.js**: Automated build script for creating distribution packages
- **package.json**: npm configuration with build dependencies
- **package-lock.json**: npm dependency version lock file
- **TEST_KEYBOARD_SHORTCUTS.md**: Manual testing guide for keyboard shortcuts
- **CHROME_WEB_STORE_DESCRIPTION.txt**: Store listing description for Chrome Web Store
- **EDGE_ADDONS_DESCRIPTION.txt**: Store listing description for Edge Add-ons
- **FIREFOX_ADDON_DESCRIPTION.txt**: Store listing description for Firefox Add-ons
- **FIREFOX_PRIVACY_POLICY.txt**: Privacy policy formatted for Firefox submission
- **ACTIVITY_DETECTION.md**: Documentation for enhanced activity detection system
- **DEBUG_AUTO_LOCK.md**: Debugging guide for auto-lock functionality
- **TIMER_DESIGN_SHOWCASE.md**: Design showcase for timer features
- **TIMER_FEATURE_SUMMARY.md**: Comprehensive technical overview of timer and scheduling features
- **TIMER_QUICK_START.md**: Quick start guide for auto-lock timer and scheduled locking
- **RELEASE_NOTES_v2.0.0.txt**: Detailed release notes for version 2.0.0

### Source Files (`src/`)

#### JavaScript (`src/js/`)
- **activity-tracker.js**: Content script injected on all pages for comprehensive activity detection (mouse, keyboard, scroll, video playback) with throttled reporting to background script
- **background.js**: Service worker that manages locked tabs, domain locks, auto-lock timers, scheduled locking with Chrome Alarms API, activity tracking, keyboard shortcut handlers, badge updates, and monitors tab events
- **locked.js**: Locked tab overlay logic with password verification, rate limiting, and unlock functionality
- **crypto-utils.js**: PBKDF2-SHA256 cryptographic utilities (600k iterations), secure salt generation using Web Crypto API, and constant-time comparison
- **browser-polyfill.min.js**: Mozilla's WebExtension API polyfill for cross-browser compatibility (Chrome, Edge, Firefox)
- **domain-manager.js**: Domain lock management UI logic, pattern handling, and unlock preferences
- **keyboard-shortcuts.js**: Keyboard shortcuts guide page logic and navigation
- **popup.js**: Extension popup UI logic, password management, tab locking controls, auto-lock timer settings, scheduled locking configuration with day selection and scope options, developer information section, and sponsor button
- **whats-new.js**: What's New overlay logic for displaying update notifications
 with timer settings, scheduled locking, and developer information
- **locked.html**: Locked tab overlay interface with password input
- **domain-manager.html**: Domain Lock Manager user interface
- **keyboard-shortcuts.html**: Keyboard shortcuts guide and help page
- **whats-new.html**: What's New overlay for displaying update notifications
- **domain-manager.html**: Domain Lock Manager user interface
- **keyboard-shortcuts.html**: Keyboard shortcuts guide and help page

#### CSS (`src/css/`) with timer settings, toggle switches, and enhanced button styles
- **locked.css**: Styles for the locked tab overlay
- **domain-manager.css**: Styles for the Domain Lock Manager interface
- **keyboard-shortcuts.css**: Styles for the keyboard shortcuts guide page
- **whats-new.css**: Styles for the What's New overlayyboard shortcuts guide page
- **popup.css**: Styles for the popup interface

### Assets (`assets/`)
- **images/icon.png**: Extension icon used in toolbar, notifications, and manifest (16x16, 48x48, 128x128)
- **images/screenshots/**: Screenshot images for README, store listings, and documentation

### Distribution (`dist/`)
- **locksy-chrome.zip**: Production-ready package for Chrome Web Store and Edge Add-ons
- **locksy-firefox.zip**: Production-ready package for Firefox Add-ons
- **locksy-firefox/**: Temporary build directory for Firefox-specific files

### Tests (`tests/`)
- **test-kdf.html**: Interactive testing interface for PBKDF2 key derivation function
- **performance-test.js**: Performance benchmarking for PBKDF2 operations
- **performance-dashboard.html**: Visual dashboard for performance metrics
- **README.md**: Testing documentation and guidelines
BUILD_GUIDE.md**: Complete guide for building and verifying the extension
- **DESIGN_SYSTEM.md**: Design system, color palette, and styling guidelines
- **KEYBOARD_SHORTCUTS.md**: Comprehensive keyboard shortcuts documentation
- **PRIVACY.md**: Privacy policy explaining data handling
- **PROJECT_STRUCTURE.md**: This file - explains project organization
- **SECURITY.md**: Security architecture and threat model documentation
- **VERIFY.md**: Build verification and trust establishment guide
### Documentation (`docs/`)
- **CHANGELOG.md**: Version history with detailed change logs
- **DESIGN_SYSTEM.md**: Design system, color palette, and styling guidelines
- **KEYBOARD_SHORTCUTS.md**: Comprehensive keyboard shortcuts documentation
- **PRIVACY.md**: Privacy policy explaining data handling
- **PROJECT_STRUCTURE.md**: This file - explains project organization

## Key Features

### Security
- **PBKDF2 Key Derivation**: 600,000 iterations (OWASP 2023 recommended minimum)
- **SHA-256**: Used as the underlying hash function in PBKDF2
- **256-bit Derived Keys**: With 128-bit cryptographically secure random salts
- **Salt Generation**: Using Web Crypto API `crypto.getRandomValues()`
- **Local-Only Storage**: No external servers, all data stored locally
- **Protection Against**: Rainbow table attacks, brute-force attacks (~120 years to crack)
- **Rate Limiting**: 5 failed attempts trigger 5-minute lockout
- **Password Security**: Cleared from memory immediately during rate limit

### Functionality
- Lock any browser tab with password protection
- Lock entire domains with pattern matching (exact and wildcard)
- **Auto-Lock Timer**: Automatic locking after inactivity (5, 15, 30, 60 minutes, or custom 1-480 minutes)
  - Smart activity detection (mouse, keyboard, scrolling, video playback)
  - Configurable scope: all tabs or active tab only
  - Activity tracking via content script
- **Scheduled Locking**: Time-based automatic locking with day selection
  - Custom start/end times in 24-hour format
  - Day-of-week selection (Mon-Sun)
  - Quick presets: Work Hours, Night Time, All Day, Weekdays, Weekends
  - Configurable scope: all tabs or active tab only
  - Chrome Alarms API for reliable scheduling
- Keyboard shortcuts for quick locking and bulk operations
- Visual indicators: lock icons on tab favicons and badge counter
- Persistent lock state across browser restarts
- Auto-lock new tabs matching locked domain patterns
- Instant re-locking on navigation/refresh
- Extension enable/disable toggle
- Password strength indicator
- Domain Lock Manager with unlock preferences
- Smart notifications for keyboard shortcut actions and auto-lock events
- Developer information section with GitHub and website links
- Integrated sponsor support button

## Development Notes

### Build Process
The extension uses an automated build system for creating distribution packages:

```bash
# Install dependencies
npm install

# Build distribution packages
node build.js
```

The build script:
- Creates `dist/locksy-chrome.zip` for Chrome/Edge (uses `manifest.json`)
- Creates `dist/locksy-firefox.zip` for Firefox (uses `manifest.firefox.json`)
- Excludes development files (tests, node_modules, .git, etc.)
- Generates clean, production-ready packages

### Testing
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `Locksy Extension` directory

### Code Organization
- All source code is in the `src/` directory organized by file type
- Assets are separated in the `assets/` directory
- Documentation is centralized in the `docs/` directory
- Root directory contains only essential files (manifest, readme, license)

## Version
Current Version: 2.0.0
Last Updated: December 27, 2025

## Architecture

### Security Implementation

#### Cryptographic Stack
- **PBKDF2-SHA256**: Password-Based Key Derivation Function 2
  - 600,000 iterations (OWASP 2023 standard)
  - SHA-256 as the pseudo-random function (PRF)
  - 256-bit (32-byte) derived keys
  - 128-bit (16-byte) random salts per password

#### Lock State Management
- **Service Worker Pattern**: Persistent background script using Chrome's service worker
- **Restoration Flag Pattern**: Prevents race conditions during lock restoration
  - `isRestoring` flag blocks enforcement during startup
  - Applied to 4 navigation listeners: onUpdated, onCreated, onActivated, onBeforeNavigate
- **Multi-layer Storage**: 
  - `lockedTabs`: Set of locked tab IDs
  - `lockedDomains`: Array of domain lock patterns
  - `temporarilyUnlockedTabs`: Set of tabs with temporary domain unlock
  - Persistence at 6 modification points to survive service worker restarts

#### Security Bug Fixes (v2.0.0)
1. **Password Exposure Prevention**: Password cleared immediately on rate limit
2. **Bypass Protection**: Removed `extensionActive` security checks that could be disabled via DevTools
3. **Race Condition Fix**: Added restoration flag pattern to prevent premature enforcement
4. **Persistence Fix**: Temporary domain unlocks now persist across browser restarts
5. **CSP Fix**: Added `img-src 'self' data:` for red lock favicon display

## Technology Stack
- JavaScript (ES6+)
- Chrome Extension Manifest V3
- **Web Crypto API** (PBKDF2, secure random generation)
- HTML5 Canvas API (for favicon manipulation)
- Chrome Storage API
- Chrome Tabs API
- Chrome Scripting API
- Chrome Notifications API
- Chrome Web Navigation API
- Chrome Commands API (keyboard shortcuts)

## Browser Compatibility
- Chrome (Manifest V3) - Full support
- Edge (Chromium-based, Manifest V3) - Full support
- Firefox (Manifest V2/V3) - Full support with browser-polyfill
- Brave, Opera, Vivaldi, and all Chromium-based browsers - Compatible

## License
MIT License - See LICENSE file for details
