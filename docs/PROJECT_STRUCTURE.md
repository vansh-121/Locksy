# Locksy Extension - Project Structure

## Overview
This is a Chrome browser extension that provides military-grade tab protection with SHA-256 encryption and salted password hashing.

## Directory Structure

```
Locksy Extension/
├── assets/                    # Static assets
│   └── images/               # Image files
│       └── icon.png          # Extension icon (16x16, 48x48, 128x128)
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
│   │   ├── domain-manager.css # Domain Lock Manager UI styles
│   │   ├── keyboard-shortcuts.css # Keyboard shortcuts styles
│   │   └── popup.css         # Popup UI styles
│   │
│   ├── html/                 # HTML templates
│   │   ├── domain-manager.html # Domain Lock Manager interface
│   │   ├── keyboard-shortcuts.html # Keyboard shortcuts guide
│   │   └── popup.html        # Extension popup interface
│   │
│   └── js/                   # JavaScript files
│       ├── background.js     # Service worker (background script)
│       ├── content.js        # Content script (injected into locked tabs)
│       ├── crypto-utils.js   # Cryptographic utilities (SHA-256, salt generation)
│       ├── domain-manager.js # Domain lock management logic
│       ├── keyboard-shortcuts.js # Keyboard shortcuts guide logic
│       └── popup.js          # Popup UI logic and event handlers
│
├── .gitignore                # Git ignore rules
├── LICENSE                   # MIT License
├── manifest.json             # Chrome extension manifest (v3)
├── README.md                 # Main documentation and features
└── test-crypto.html          # Local test file for crypto functions

```

## File Descriptions

### Root Files
- **manifest.json**: Chrome extension configuration (Manifest V3)
- **README.md**: Project documentation, installation guide, and features
- **LICENSE**: MIT License for the project
- **.gitignore**: Git ignore patterns

### Source Files (`src/`)

#### JavaScript (`src/js/`)
- **background.js**: Service worker that manages locked tabs, domain locks, keyboard shortcut handlers, badge updates, and monitors tab events
- **content.js**: Injected into locked tabs to display the password overlay, verify passwords, and manage favicon lock indicators
- **crypto-utils.js**: Utility functions for secure password hashing with SHA-256 and salt generation
- **domain-manager.js**: Domain lock management UI logic and domain pattern handling
- **keyboard-shortcuts.js**: Keyboard shortcuts guide page logic and navigation
- **popup.js**: Logic for the extension popup UI, password management, tab locking controls, and keyboard shortcuts display

#### HTML (`src/html/`)
- **domain-manager.html**: User interface for the Domain Lock Manager
- **keyboard-shortcuts.html**: Keyboard shortcuts guide and help page
- **popup.html**: User interface for the extension popup

#### CSS (`src/css/`)
- **domain-manager.css**: Styles for the Domain Lock Manager interface
- **keyboard-shortcuts.css**: Styles for the keyboard shortcuts guide page
- **popup.css**: Styles for the popup interface

### Assets (`assets/`)
- **images/icon.png**: Extension icon used in toolbar, notifications, and manifest

### Documentation (`docs/`)
- **CHANGELOG.md**: Version history with detailed change logs
- **DESIGN_SYSTEM.md**: Design system, color palette, and styling guidelines
- **KEYBOARD_SHORTCUTS.md**: Comprehensive keyboard shortcuts documentation
- **PRIVACY.md**: Privacy policy explaining data handling
- **PROJECT_STRUCTURE.md**: This file - explains project organization

## Key Features

### Security
- SHA-256 password hashing with cryptographic salt
- Salt generation using `crypto.getRandomValues()`
- Local-only storage (no external servers)
- Protection against rainbow table attacks

### Functionality
- Lock any browser tab with password protection
- Lock entire domains with pattern matching (exact and wildcard)
- Keyboard shortcuts for quick locking and bulk operations
- Visual indicators: lock icons on tab favicons and badge counter
- Persistent lock state across browser restarts
- Auto-lock new tabs matching locked domain patterns
- Instant re-locking on navigation/refresh
- Extension enable/disable toggle
- Password strength indicator
- Domain Lock Manager with unlock preferences
- Smart notifications for keyboard shortcut actions

## Development Notes

### Build Process
This extension does not require a build step. All files are used directly by Chrome.

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
Current Version: 1.0.8

## Technology Stack
- JavaScript (ES6+)
- Chrome Extension Manifest V3
- Web Crypto API
- HTML5 Canvas API (for favicon manipulation)
- Chrome Storage API
- Chrome Tabs API
- Chrome Scripting API
- Chrome Notifications API
- Chrome Web Navigation API
- Chrome Commands API (keyboard shortcuts)

## Browser Compatibility
- Chrome (Manifest V3)
- Edge (Chromium-based, Manifest V3)

## License
MIT License - See LICENSE file for details
