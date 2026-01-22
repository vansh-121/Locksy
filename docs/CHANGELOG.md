# Changelog

All notable changes to Locksy will be documented in this file.

## [2.2.0] - 2026-01-22

### 🎉 Major New Features

#### ⏱️ Auto-Lock Timer
- **Automatic Inactivity Locking**: Locks all tabs after a period of inactivity
  - Preset durations: 5, 15, 30, 60 minutes
  - Custom duration support: 1-480 minutes (8 hours)
  - Smart activity tracking across tab switching, navigation, and window focus
  - Automatic timer reset on any user interaction
  - Real-time status display with countdown information
  - Desktop notifications when auto-lock activates
  
#### 📅 Scheduled Locking
- **Time-Based Automatic Locking**: Lock tabs during specific hours
  - Custom start and end time configuration (24-hour format)
  - Support for overnight schedules (e.g., 22:00 to 06:00)
  - Quick preset options:
    - Work Hours (9:00 AM - 5:00 PM)
    - Night Time (10:00 PM - 6:00 AM)
    - All Day (24/7 protection)
  - Automatic locking when entering scheduled period
  - Notifications for schedule activation and deactivation
  - Real-time schedule status indicator
  - **Day Selection**: Choose specific days of the week for scheduled locking
    - Individual day toggles (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
    - Quick presets: Weekdays, Weekends, Every Day
    - Visual day indicators showing active days
  - **Scope Options**: Choose what to lock during scheduled periods
    - Lock all tabs (system-wide protection)
    - Lock only active tab (focused protection)
    - Per-feature scope configuration

#### ⏰ Chrome Alarms API Integration
- **Reliable Scheduled Operations**: Chrome Alarms API ensures scheduled locks work consistently
  - Persistent alarms survive browser restarts
  - Minute-based checking for schedule activation
  - Automatic unlock checks when schedule ends
  - More reliable than setInterval for long-running tasks
  - Works even when extension popup is closed

#### 🎨 UI Enhancements
- **Beautiful Timer Settings Interface**
  - Modern gradient-based design matching extension theme
  - Collapsible sections for organized layout
  - Smooth toggle switches with animations
  - Active state highlighting on duration buttons
  - Color-coded status messages (green/blue/red)
  - Hover effects and transitions throughout
  - Real-time feedback on all interactions
  - **Developer Information Section**: Links to creator's website and GitHub profile
  - **Sponsor Button**: Integrated support button in popup UI with enhanced styling

#### 🔄 Scope Configuration (NEW!)
- **Flexible Locking Targets**: Choose what gets locked for each feature
  - **Auto-Lock Scope**: 
    - All Tabs: Lock entire browser when timer expires
    - Active Tab Only: Lock just the tab you're viewing
  - **Scheduled Lock Scope**:
    - All Tabs: System-wide protection during scheduled hours
    - Active Tab Only: Focused protection on current work
  - Independent configuration for each feature
  - Visual radio button selectors in settings
  - Settings persist across sessions

#### 🎯 Enhanced Activity Detection (NEW!)
- **Content Script Activity Tracker**: Comprehensive page-level activity monitoring
  - **Mouse Movement Detection**: Detects when user moves mouse on page
  - **Keyboard Input Detection**: Tracks typing and keyboard interactions
  - **Scrolling Detection**: Monitors page scrolling activity
  - **Video Playback Detection**: Special handling for watching videos
    - Detects video play/pause events
    - Periodic activity reporting while video plays (every 15 seconds)
    - Prevents unwanted locks during Netflix, YouTube, etc.
  - **Touch Gesture Support**: Mobile/tablet touch interactions
  - **Page Visibility Tracking**: Detects when user switches back to tab
  - **Performance Optimized**: 
    - Debounced activity (1-second delay)
    - Throttled reporting (max once per 10 seconds)
    - Passive event listeners (no scroll blocking)
    - Zero performance impact on browsing
  
- **Real-World Use Cases Now Supported**:
  - ✅ Watching videos without interruption
  - ✅ Reading long articles safely
  - ✅ Working on single-page apps
  - ✅ Coding in web-based IDEs
  - ✅ Any passive content consumption
  - ❌ Only locks when truly inactive
  
### 🔧 Technical Improvements
- **Enhanced Background Script**: 273 new lines
  - Auto-lock timer state management
  - Multi-point activity tracking listeners
  - Schedule checker running every minute
  - Message handlers for timer configuration
  - Persistent settings storage and restoration

- **New Content Script**: activity-tracker.js (150 lines)
  - Injected on all pages (`<all_urls>`)
  - 15+ event listeners for comprehensive detection
  - Smart throttling and debouncing
  - Video playback interval checking
  - Efficient messaging to background script
  
- **Expanded Popup Interface**: 367 new lines (70 HTML + 297 JS)
  - Complete timer settings initialization
  - UI event handlers for all controls
  - Settings save/load functionality
  - Status display and update functions
  - Integration with existing lock controls
  
- **Rich CSS Styling**: 331 new lines
  - Timer-specific component styles
  - Toggle switch animations
  - Button interaction effects
  - Responsive layout adjustments
  - Status message styling

### 📊 Storage Schema Updates
- New settings stored in `chrome.storage.local`:
  - `autoLockEnabled`: boolean
  - `autoLockDuration`: number (milliseconds)
  - `autoLockScope`: string ('all' or 'active')
  - `scheduledLockEnabled`: boolean
  - `scheduledLockStart`: string (HH:MM format)
  - `scheduledLockEnd`: string (HH:MM format)
  - `scheduledLockDays`: array of numbers (0-6, Sunday-Saturday)
  - `scheduledLockScope`: string ('all' or 'active')
  - `scheduledLockState`: boolean (currently active)

### 🚀 User Benefits
- **Set-and-Forget Security**: Automatic protection without manual intervention
- **Flexible Configuration**: Both preset options and custom settings
- **No More Unwanted Locks**: Smart detection knows when you're actually using the browser
- **Natural Behavior**: Works with how people really browse (watching videos, reading, etc.)
- **Multiple Use Cases**:
  - Office workers: Protection during meetings/breaks
  - Students: Scheduled locking during class hours
  - Families: Time-based restrictions
  - Privacy-conscious: Always-on inactivity protection
  - Content consumers: Watch videos without interruption
- **Zero Performance Impact**: Efficient implementation with minimal overhead

### 📝 Documentation
- **TIMER_FEATURE_SUMMARY.md**: Comprehensive 400+ line technical overview
- **TIMER_QUICK_START.md**: User-friendly quick start guide
- **ACTIVITY_DETECTION.md**: Detailed explanation of enhanced activity tracking (NEW!)
- Complete usage instructions and real-world use cases

### 🎯 Feature Highlights
- ✅ Smart activity detection prevents premature locking (mouse, keyboard, scroll, video)
- ✅ Handles video playback intelligently (YouTube, Netflix, etc.)
- ✅ Respects passive content consumption (reading, watching)
- ✅ Handles system pages gracefully (never locks browser settings)
- ✅ Settings persist across browser sessions and restarts
- ✅ Can use auto-lock and scheduled locking simultaneously
- ✅ Day-specific scheduling for flexible work/life balance
- ✅ Independent scope configuration (all tabs vs. active tab)
- ✅ Chrome Alarms API for reliable scheduled operations
- ✅ Developer information and support links integrated
- ✅ Visual feedback at every step
- ✅ Professional, polished user interface
- ✅ Zero performance impact with smart throttling

### 🔄 Implementation Stats
- **Total New Code**: 1,121 lines across 5 files
- **Core Files Modified**: 4 (background.js, popup.js, popup.html, popup.css)
- **New Content Script**: activity-tracker.js (150 lines)
- **Manifest Updates**: Both Chrome and Firefox manifests
- **New Documentation**: 3 comprehensive guides
- **New Documentation**: 2 comprehensive guides
- **Zero Breaking Changes**: Fully backward compatible

---

## [2.1.0] - 2026-01-06

### 🚀 Automation & User Experience

#### New Features
- **What's New Overlay**: Beautiful update notification displayed to users after extension updates
  - Shows version changes and key features
  - Highlights security and privacy benefits
  - Links to full changelog
  - Dismissible with smooth animations
  
- **Automated GitHub Releases**: Complete CI/CD pipeline using GitHub Actions
  - Automatic builds on push to main branch
  - SHA-256 checksums for all releases
  - Tagged releases with detailed release notes
  - Automated artifact uploads
  
- **Build Verification Workflow**: Additional GitHub Actions workflow for pull requests
  - Runs on all PR branches (main, feat/*, fixes/*)
  - Generates build artifacts for verification
  - Provides build summaries in GitHub UI

#### 🔐 Security Enhancements
- **Centralized Rate Limiting**: Moved password verification and rate limiting to background script
  - Prevents bypass attacks via multiple tabs or popup windows
  - Single shared rate limit state across entire extension
  - More robust against circumvention attempts
  - Popup and locked pages now communicate with background script for password verification
  
- **Removed `scripting` Permission**: Cleaned up Firefox manifest to remove unused permission

#### � Documentation Improvements
- **BUILD_GUIDE.md**: Comprehensive 296-line guide for building from source
  - Step-by-step build instructions
  - Verification procedures
  - Troubleshooting section
  - Security best practices
  
- **SECURITY.md**: Detailed 316-line security documentation
  - Explains `<all_urls>` permission in detail
  - Provides technical proof of offline operation
  - Verification checklists
  - Community security review guidelines
  
- **VERIFY.md**: Quick 241-line verification guide
  - 5-minute trust verification steps
  - Network activity checks
  - Offline functionality tests
  - Source code comparison methods
  
- **Enhanced README.md**: Added trust and verification section
  - Trust & Transparency badges
  - Quick verification guide
  - Three verification methods (releases, build from source, inspect installation)
  - Detailed permission explanations
  
- **Enhanced PRIVACY.md**: Added detailed explanation of `<all_urls>` permission
  - Clear explanation of why permission is needed
  - What the extension does vs. doesn't do
  - Technical proof of no data collection

#### 🎨 UI Improvements
- **What's New Page Styling**: Beautiful gradient design matching Locksy's brand
  - Responsive layout
  - Smooth animations
  - Feature highlights with icons
  - Privacy guarantees prominently displayed
  
- **Popup Integration**: What's New overlay can be displayed within popup
  - Seamless integration with existing popup design
  - Full CSS styling included in popup.css

#### 🏗️ Build Process Improvements
- **Screenshot Exclusion**: Screenshots now excluded from extension packages
  - Reduces package size
  - Only includes necessary assets
  
- **Removed README from Packages**: README.md no longer bundled in extension packages
  - Available on GitHub and web stores
  - Reduces package size

#### 🔧 Technical Improvements
- **Manifest Optimization**: Firefox manifest now imports crypto-utils.js in background scripts
  - Proper script loading order
  - Better error handling
  
- **Background Script Communication**: Enhanced message passing architecture
  - `verifyPassword` action for centralized password verification
  - `getRateLimitStatus` action for checking rate limit state
  - Better error handling and timeout management
  
- **Cleaner Console Output**: Removed excessive debug logging
  - Production-ready logging
  - Only critical errors logged

### 📊 Impact

**Security**: Centralized rate limiting makes bypass attacks significantly harder
**Trust**: Comprehensive documentation helps users verify extension integrity
**Transparency**: Automated builds with checksums provide verifiable releases
**User Experience**: What's New overlay keeps users informed about updates

### 🔗 Related Files

**New Files**:
- `.github/workflows/auto-release.yml` - Automated release workflow
- `.github/workflows/build.yml` - Build verification workflow  
- `src/html/whats-new.html` - What's New overlay page
- `src/css/whats-new.css` - What's New styling
- `src/js/whats-new.js` - What's New functionality
- `docs/BUILD_GUIDE.md` - Build from source guide
- `docs/SECURITY.md` - Security documentation
- `docs/VERIFY.md` - Quick verification guide

**Modified Files**:
- `src/js/background.js` - Added centralized rate limiting
- `src/js/popup.js` - Updated to use background script for password verification
- `src/js/locked.js` - Updated to use background script for password verification
- `src/js/crypto-utils.js` - Removed local rate limiting (moved to background)
- `src/css/popup.css` - Added What's New overlay styling
- `build.js` - Exclude screenshots from packages
- `manifest.json` - Version bump to 2.1.0
- `manifest.firefox.json` - Version bump, removed `scripting` permission
- `README.md` - Added trust & verification section
- `docs/PRIVACY.md` - Added `<all_urls>` explanation

---

## [2.0.0] - 2025-12-27

### 🔐 MAJOR SECURITY OVERHAUL - ENTERPRISE-GRADE CRYPTOGRAPHY

#### 🔥 Critical Bug Fixes & Security Patches

##### Security Fixes
- **BUG #4**: Fixed password exposure during rate limit countdown
  - Password now cleared immediately when rate limited
  - Added beforeunload listener for defense-in-depth
  - Closes DevTools inspection vulnerability (2-300 second exposure window)
  
- **BUG #9**: Fixed extensionActive bypass vulnerability
  - Removed security checks that could be disabled via DevTools
  - Lock functionality now always active if extension installed
  - Keyboard shortcuts and lock buttons cannot be bypassed
  - extensionActive toggle now UI-only (cosmetic)

##### Critical Fixes
- **BUG #2**: Fixed temporarilyUnlockedTabs persistence
  - Temporary domain unlocks now persist across service worker restarts
  - Prevents unexpected re-locking after browser sleep/restart
  - Added persistence at 6 modification points
  
- **BUG #3**: Fixed race condition in lock restoration
  - Added restoration flag pattern to prevent race conditions
  - Ensures locks are fully restored before enforcement checks
  - Updated 4 navigation listeners (onUpdated, onCreated, onActivated, onBeforeNavigate)

- **BUG #8**: Fixed CSP blocking red lock favicon
  - Added `img-src 'self' data:` to Content Security Policy
  - Red lock favicon now displays correctly

##### UI Improvements
- Changed security badge from technical "PBKDF2 (600k iterations)" to user-friendly "Secured with Advanced Encryption"

#### 🎯 Breaking Changes
- **PBKDF2 Key Derivation Function**: Replaced SHA-256 with industry-standard PBKDF2
  - 600,000 iterations (OWASP 2023 recommended minimum)
  - SHA-256 as underlying hash function
  - 256-bit derived keys with 128-bit random salts
  - ~120 years to crack vs ~7 days with old implementation
  - Backward compatible with existing passwords

#### 🛡️ Enhanced Security Features

##### Added
- **Advanced Rate Limiting & Brute-Force Protection**
  - 3 free authentication attempts
  - Exponential backoff delays (2s, 4s, 8s, 16s, 32s, 64s)
  - 10 failed attempts trigger 5-minute account lockout
  - Live countdown timers showing exact wait time
  - Progressive warning messages before lockouts
  - Automatic counter reset on successful authentication
  
- **Timing Attack Protection**
  - Constant-time string comparison for all password verifications
  - Prevents information leakage through timing analysis
  - Applied to both PBKDF2 and legacy SHA-256 formats
  
- **Enhanced User Experience**
  - Real-time countdown timers during rate limiting
  - Clear visual feedback with locked/unlocked states
  - Input fields auto-disable during lockout periods
  - Auto-recovery and re-enabling after wait periods
  - Informative error messages with remaining attempts

#### 🔧 Technical Improvements

##### Security
- **Crypto Variable Scoping**: Rate limiting variables prefixed with `crypto_` to avoid conflicts
- **Accurate Rate Limit Status**: New `getRateLimitStatus()` function tracks lockout and exponential backoff
- **Storage Format**: New `iterations:salt:key` format allows future security upgrades
- **Web Crypto API**: Full utilization of native cryptographic primitives

##### Code Quality
- Fixed variable name conflicts between popup.js and crypto-utils.js
- Improved error handling and user feedback throughout authentication flow
- Enhanced test suite in `tests/test-kdf.html` for PBKDF2 and rate limiting
- Comprehensive security documentation in `SECURITY_ASSESSMENT.md`

#### 📊 Security Rating
- **Overall Rating**: 9/10 (up from 7.5/10)
- **Brute-Force Resistance**: Very Strong
- **Timing Attack Protection**: Protected
- **Rate Limiting**: Fully Implemented
- **Industry Compliance**: OWASP 2023 Standards

#### 📝 Documentation
- Added comprehensive `SECURITY_ASSESSMENT.md` with:
  - Detailed threat model analysis
  - Before/after security comparison
  - Implementation details and code examples
  - Attack resistance metrics
  - Future enhancement recommendations

#### 🔄 Migration Notes
- Existing users: Passwords automatically remain functional (backward compatible)
- New passwords: Use new PBKDF2 format automatically
- Password changes: Upgrade to PBKDF2 format on next change
- No user action required for the upgrade

---

## [1.0.8] - 2025-12-17

### 🦊 Major Feature: Cross-Browser Support

#### Added
- **Full Cross-Browser Compatibility**: Locksy now works seamlessly across all major browsers
  - Chrome, Edge, Firefox, Brave, Opera, Vivaldi, and all Chromium-based browsers
  - WebExtension Polyfill integration for unified API support
  - Identical features and functionality across all platforms
  - Single unified codebase for all browsers
  
- **Firefox Manifest Support**: Dedicated Firefox manifest configuration
  - `manifest.firefox.json`: Firefox-specific settings
  - WebExtension polyfill for browser API compatibility
  - Service worker configuration for Firefox

### 🔒 Enhanced Security

#### Improved
- **XSS Prevention**: Advanced protection against cross-site scripting attacks
  - Replaced all `innerHTML` usage with safe DOM methods
  - Secure element creation using `document.createElement()`
  - Safe text content insertion using `textContent`
  - Protection against malicious dynamic HTML insertion
  - Multiple security layers for content sanitization
  
- **Secure DOM Manipulation**: Enhanced security across all components
  - Content scripts use safe DOM methods exclusively
  - Popup and domain manager use secure element creation
  - Keyboard shortcuts page implements safe DOM practices

### 📦 Technical Updates

#### Enhanced
- **WebExtension API Compatibility**: Seamless browser operation
  - Browser-agnostic API calls throughout codebase
  - WebExtension polyfill (`browser-polyfill.min.js`) integration
  - Unified manifest support for cross-browser deployment
  - Updated all HTML pages for cross-browser compatibility
  
- **Updated Files**:
  - `manifest.firefox.json`: Created Firefox-specific manifest
  - `src/js/content.js`: Replaced innerHTML with secure DOM methods
  - `src/js/popup.js`: Enhanced with safe element creation
  - `src/js/domain-manager.js`: Implemented secure DOM manipulation
  - `src/js/keyboard-shortcuts.js`: Updated with safe DOM practices
  - All HTML files: Added WebExtension polyfill support

### 🐛 Bug Fixes

#### Fixed
- **Lock All Tabs Functionality**: Resolved background script action handling
  - Implemented proper `lockAllTabs` action handler
  - Fixed message passing between popup and background script
  - Enhanced error handling for bulk operations
  
- **Popup Integration**: Improved communication with background service
  - Fixed action message handling
  - Enhanced response validation
  - Better error reporting for failed operations

---

## [1.0.7] - 2025-12-04

### ⌨️ New Feature: Keyboard Shortcuts

#### Added
- **Keyboard Shortcuts System**: Optional customizable shortcuts for power users
  - Lock current tab instantly
  - Open Domain Lock Manager
  - Lock all tabs in current window
  - **Default shortcuts**: Alt+Shift+9 (Lock), Alt+Shift+0 (Domain Manager), Alt+Shift+8 (Lock All)
  - **Customizable**: Change at `chrome://extensions/shortcuts` if needed
  
- **Smart Notifications**: Every keyboard action provides instant visual feedback
  - Success messages for completed actions
  - Error messages with helpful guidance
  - Status updates for bulk operations
  
- **Customizable Shortcuts**: Full browser support for customization
  - Chrome: `chrome://extensions/shortcuts`
  - Edge: `edge://extensions/shortcuts`
  - Custom key combinations for each command
  
- **Safety Checks**: Automatic validation before executing shortcuts
  - Checks extension activation status
  - Verifies password is set
  - Validates tab compatibility (skips system pages)
  - Prevents duplicate locks

- **Bulk Operations**: Lock all tabs feature via keyboard
  - Locks all compatible tabs in current window
  - Automatically skips system and extension pages
  - Reports count of locked and skipped tabs
  - Updates badge counter in real-time

#### Enhanced
- **User Interface**:
  - Added keyboard shortcuts info panel in popup
  - Displays all available shortcuts with visual kbd tags
  - Shows when password is set (auto-hides before setup)
  - Styled with modern gradient background
  
- **Documentation**:
  - New comprehensive keyboard shortcuts guide
  - Usage examples and tips
  - Customization instructions
  - Troubleshooting section

#### Technical Details
- **Updated Files**:
  - `manifest.json`: Added `commands` section with 4 keyboard shortcuts
  - `src/js/background.js`: Added command listener and 4 handler functions
  - `src/html/popup.html`: Added keyboard shortcuts info section
  - `src/js/popup.js`: Updated to show/hide shortcuts based on password state
  - `README.md`: Added keyboard shortcuts section with full documentation
  
- **New Files**:
  - `docs/KEYBOARD_SHORTCUTS.md`: Complete keyboard shortcuts documentation

- **Handler Functions**:
  - `handleLockCurrentTab()`: Locks active tab with validation
  - `handleToggleExtension()`: Toggles extension state
  - `handleOpenDomainManager()`: Opens domain manager window
  - `handleLockAllTabs()`: Bulk locks all tabs in window

### 🔒 Visual Indicators Enhancement

#### Added
- **Lock Icon on Tab Favicon**: Locked tabs now display a distinctive red lock icon
  - Dynamically generated using HTML5 Canvas
  - Red circle background with white lock emoji
  - Original favicon automatically restored on unlock
  
- **Badge Counter on Extension Icon**: Shows number of locked tabs at a glance
  - Red background (#dc3545) with white text
  - Auto-updates on lock/unlock operations
  - Persists across browser restarts
  - Disappears when no tabs are locked

#### Enhanced
- **Real-time Updates**: Badge updates instantly for all lock/unlock scenarios
  - Individual tab locks/unlocks
  - Domain locks/unlocks
  - Bulk operations
  - Tab closures
  - Browser restarts

#### Technical Details
- **Updated Files**:
  - `src/js/content.js`: Added favicon management functions
  - `src/js/background.js`: Added badge update system
  
- **New Functions**:
  - `setLockFavicon()`: Creates and applies lock icon to tab
  - `restoreOriginalFavicon()`: Restores original tab icon
  - `updateBadge()`: Updates extension icon badge counter

---

## [1.0.6] - 2025-11-22

### 🌐 New Feature: Domain Lock

#### Added
- **Domain Lock System**: Lock all tabs matching a domain pattern
  - Support for exact domain matching (e.g., `github.com`)
  - Support for wildcard subdomain matching (e.g., `*.google.com`)
  - Persistent domain locks across browser restarts
  - Auto-lock new tabs that match locked domain patterns
  - Dedicated Domain Lock Manager interface
  
- **Unlock Scope Options**: Flexible unlock behavior for domain-locked tabs
  - **Unlock This Tab Only**: Keeps domain lock active, temporarily unlocks current tab
  - **Unlock All Domain Tabs**: Unlocks all currently open tabs for the domain
  - **Remove Domain Lock**: Completely removes the domain lock
  
- **Unlock Preferences**: Customizable per-domain unlock behavior
  - Remember unlock choice for each domain
  - Configurable in Domain Lock Manager settings
  - Prevents repeated unlock prompts for trusted sessions
  
- **Temporary Exemptions**: Smart tracking of temporarily unlocked domain tabs
  - Exemptions cleared when tab is closed
  - Exemptions cleared when navigating to different domain
  - Re-lock on browser restart if domain lock still active

#### Enhanced
- **Service Worker State Management**: 
  - Automatic restoration of domain locks on service worker wake-up
  - Improved locked state persistence
  - Better handling of browser sleep/wake cycles
  
- **Pattern Matching Engine**:
  - Robust URL pattern matching for domain locks
  - Support for exact hostname matching
  - Wildcard subdomain support with `*.` prefix
  - Fallback pattern matching for flexible domain locking
  
- **User Interface**:
  - New "Domain Lock" button in main popup
  - Domain Lock Manager window with:
    - Add new domain pattern input
    - List of all locked domains
    - Per-domain settings panel
    - Remove domain lock functionality
  - Enhanced unlock dialog for domain-locked tabs
  - Visual indicators for locked domains

#### Technical Details
- **New Files**:
  - `src/js/domain-manager.js`: Domain lock management logic
  - `src/html/domain-manager.html`: Domain manager interface
  - `src/css/domain-manager.css`: Domain manager styles
  
- **Updated Files**:
  - `src/js/background.js`: Domain lock pattern matching and management
  - `src/js/content.js`: Unlock scope dialog and preference handling
  - `src/js/popup.js`: Domain Lock button integration
  - `manifest.json`: Version updated to 1.0.6
  
- **Storage Schema**:
  - `lockedDomains`: Array of locked domain patterns
  - `domainUnlockPreferences`: Object mapping domains to unlock preferences
  - `temporarilyUnlockedTabs`: Set of tab IDs temporarily exempted from domain locks

---

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
