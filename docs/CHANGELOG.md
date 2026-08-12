# Changelog

All notable changes to Locksy will be documented in this file.

## [3.3.0] - 2026-08-10

### 🎉 Major New Features

#### 🔑 Master Recovery Key & Emergency Password Reset Flow
- **Emergency Recovery Key Generation**: Automatically generates a secure 16-character recovery key (`LOCKSY-XXXX-XXXX-XXXX`) during initial master password setup or password changes.
- **PBKDF2 Hash Protection**: Recovery keys are normalized and hashed using PBKDF2-SHA256 (600,000 iterations), ensuring local storage contains only cryptographic verification hashes (`recoveryKeyHash`).
- **Offline Export & Download**: Built-in options to copy recovery keys to clipboard or save them as a local text file (`locksy-recovery-key.txt`).
- **Interactive "Forgot Password?" Flow**: Access a recovery key verification modal directly from the popup authentication screen.
- **Emergency Account Reset**: Safely reset forgotten passwords and clear corrupted or lost authentication states, with full warnings and automatic tab/session cleanup.
- **Dynamic Color Palette & Polish**: Enhanced UI layout for recovery screens with dark/light theme awareness and responsive control buttons.
- **Automatic Migration**: Background check generates a recovery key hash for existing password setups on launch without requiring manual user resets.

#### 🛡️ Smart Sessions & Sensitive Action Re-Authentication (PRO)
- **Bounded Session Duration**: Stay signed in between popup re-opens without re-entering your password for a configurable re-auth duration (Strict/0m, 2m, 5m, 10m default, or custom up to 60m).
- **Sensitive Action Re-Authentication**: Critical operations (unlocking tabs, removing domain locks, altering security/timer settings, toggling stealth mode) require explicit password or biometric re-authentication even while a session is active.
- **Biometric Re-Auth Integration**: Device-native WebAuthn (Touch ID, Face ID, Windows Hello) support for sensitive prompt verification.
- **Re-Auth Timing Selector**: Configurable control panel in the popup Security tab to customize session timeout rules and re-auth thresholds.

#### 📦 Build & Package Asset Optimization
- **Single Icon Asset Packaging**: Updated build process (`build.js`) and asset structure to package only the required `icon.png` in release ZIP archives (`dist/`), excluding redundant store promotional graphics and duplicate icon files.

---

## [3.2.1] - 2026-08-03

### 🐛 Bug Fixes

#### 🛡️ Domain Lock Persistence After Inactivity
- **Root Cause**: Chrome Manifest V3 Service Workers idle-terminate after inactivity (e.g. 2 days idle). On resuming, event listeners evaluated domain lock rules before storage hydration completed, causing domains to unlock.
- **What Changed**: All tab navigation and creation listeners now force storage state re-hydration before checking lock rules.

#### 🌐 Include Subdomains Toggle Preference
- **Root Cause**: The "Include subdomains" toggle in Domain Manager was stored in short-lived DOM memory and forcibly reset to `false` after adding a domain.
- **What Changed**: The toggle preference is now persisted in local storage (`domainManagerIncludeSubdomains`) across popup window re-opens and is preserved after adding domains.

#### 🎯 Wildcard & Subdomain Matching Consistency
- **Root Cause**: `*.domain.com` wildcard patterns previously excluded the apex domain and didn't strip FQDN trailing dots.
- **What Changed**: Standardized domain pattern matching across `background.js` and `locked.js` so apex domains and subdomains are reliably protected.

## [3.2.0] - 2026-07-31

### 🐛 Bug Fixes

#### 🚀 Startup Lock Now Fires Every Time (PRO)
- **Reliable session detection**: Startup Lock only worked some of the time. It hung off a single browser startup event that Edge's **"Startup boost"** suppresses entirely — if a background process stayed alive after you closed your last window, reopening the browser counted as the *same* session and nothing was locked. Locksy now treats "no windows were open" as the start of a new session, which is what closing the browser actually means, and does not care whether a process lingered.
- **Survives the browser suspending Locksy**: The lock-on-startup progress used to be held in memory, which browsers discard after about 30 seconds of inactivity — very likely in the middle of session restore. It is now kept in local storage and driven by alarms, so it completes even if Locksy is put to sleep partway through.
- **No more "some of my tabs got locked"**: The list of tabs eligible for locking was captured in a single snapshot taken as early as possible, and any tab that finished restoring afterwards was skipped permanently — so how many tabs actually got locked came down to how fast your disk was that morning. Locksy now re-checks repeatedly across a 30-second catch-up window.
- **Respects a manual unlock**: A tab you unlock yourself during that catch-up window is no longer re-locked by a later sweep.

#### 🧊 Browser No Longer Freezes on Startup with Biometric Unlock
- **The symptom**: With biometric set as your default unlock, reopening your browser with several tabs locked could leave the browser completely unresponsive — buttons dead, the window's close button doing nothing, and Task Manager the only way out.
- **Root cause**: Each restored lock screen raised its own Windows Hello prompt. Those are operating-system dialogs that block the window that opened them, and a dialog raised by a window that isn't in front gets drawn *behind* it while still blocking it — so it was unreachable but still holding the browser. The platform authenticator also serves one request at a time, so several tabs prompting at once blocked several windows.
- **What changed**: A biometric prompt can now only be raised by the tab you are actually looking at, in the window that has focus. Only one tab in the whole browser may hold the prompt at a time, coordinated through a short lease so a tab that is closed mid-prompt cannot block the others. Every request can now be cancelled, and one that never responds is dismissed automatically and hands you the password field instead.
- **Clearer waiting states**: Locked tabs that cannot prompt yet now explain why — "Switch to this tab to authenticate", or "Waiting for another locked tab to finish…".

### 🔒 Security Hardening

#### 🚫 Locksy's Internal Pages Are No Longer Reachable by Websites
- **Websites can no longer load Locksy's own pages**: The lock screen and the Intruder Log were both marked in the extension manifest as loadable by any website you visited. Nothing in Locksy needed that — the extension opens its own pages directly — so the entry has been removed from both the Chrome/Edge and Firefox manifests.
- **What this closed**: A malicious page could embed Locksy's lock screen invisibly and stack its own controls on top of it (a UI-redress or "clickjacking" attack), or embed the Intruder Log. It could also fingerprint the extension — confirming Locksy was installed and reading its internal extension ID. Such a page could **never** read your typed password or your stored intruder photos; browser cross-origin rules prevent that regardless.
- **Where it came from**: A leftover from an earlier design in which the lock screen was injected into the page as an overlay. Locksy has since moved the entire tab to its own lock page instead, which requires no such permission.

#### 🖼️ Lock Screen and Intruder Log Refuse to Run Inside a Frame
- **Defense in depth**: Both pages now confirm they own the whole tab and refuse to initialise otherwise, so neither can be embedded even if the manifest entry above were ever reintroduced by mistake.
- **Also closed**: A framed lock screen would have reported the *embedding* tab as its own when re-attaching itself after a browser restart, which could have marked a tab locked that you never locked.

### 🔑 Password Strength

#### ⬆️ Legacy Password Hashes Upgrade Themselves
- **Automatic upgrade to PBKDF2**: Locksy moved to PBKDF2-SHA256 (600,000 iterations) several versions ago and kept accepting the older single-pass SHA-256 format so long-time users would not be locked out — but nothing ever rewrote those older hashes. Users who first set their password on a pre-PBKDF2 version are now upgraded automatically on their first successful unlock, which is the only moment the password is known to be correct.
- **Nothing to do**: No re-entry, no reset, no visible change. It happens once, in the background.
- **Not affected**: Anyone who set or changed their password on a recent version was already on PBKDF2.

---

## [3.1.1] - 2026-07-29

### 🐛 Critical Bug Fixes

#### 🔓 "No Lock Data Found" After Restarting Your Browser
- **Locked tabs now survive a browser restart**: Some users found that after closing and reopening their browser, entering the correct password on a restored locked tab returned the error *"No lock data found"* — leaving the tab permanently stuck on the lock screen with no way back to the original page. Locked tabs are now restored and unlocked correctly after a restart.
- **Root cause**: Locksy identified each lock by the browser's internal tab ID. Browsers discard and reassign those IDs on every restart, while the lock screen itself is restored exactly as it was — still referencing the old ID. The information needed to return you to your page was also being cleaned up during browser shutdown, before session restore could bring those tabs back.
- **Restart-proof lock records**: Every lock now carries its own permanent identifier, independent of tab IDs, so the original page can always be recovered. Restored lock screens automatically re-attach themselves to their new tab as soon as the browser reopens.
- **Correct tab restored every time**: Fixed a related issue where a reassigned tab ID could cause an unlock to send the *wrong* tab to your page.
- **Accurate badge count after restart**: Locked tabs restored by the browser are recognised again immediately, so the badge count and Quick-Unlock panel reflect reality.
- **Never stuck again**: In the rare case no recovery information remains (a lock screen created by an older version), the lock is now released and the page restored from tab history instead of trapping you on the lock screen.

### 🔒 Security Hardening
- **Closed an unauthenticated unlock path**: After a browser restart, a restored lock screen could in some cases determine that its (now non-existent) tab was no longer locked and navigate itself back to the protected page **without asking for a password or biometric**. The lock screen now verifies its own identity with the background service before acting on any unlock signal, so a protected page can only ever be revealed after successful authentication.

### 🧹 Housekeeping
- **Automatic cleanup of stale lock records**: Recovery records belonging to windows that were closed and never restored are swept automatically after 30 days, so nothing accumulates in local storage.

---

## [3.1.0] - 2026-07-24

### 🎉 Major New Features

#### 🛡️ Privacy Blur Shield
- **Sensitive Data Masking**: Automatically hides passwords, credit card numbers, OTP codes, emails, and phone numbers on web pages.
- **Window & Focus Blur**: Automatically blurs your active web page when switching windows, locking your device, or stepping away to prevent shoulder-surfing.
- **Privacy Blur Manager**: Dedicated dashboard to configure blur intensity (Light, Medium, High, Solid), select blur targets, set auto-blur categories (Banking, Webmail, Password Managers), and whitelist trusted domains.
- **Context Menu Shortcuts**: Right-click any webpage to instantly add domain blur rules.

#### 🔑 Seamless License Sync & Offline Recovery
- **Offline & Sleep Protection**: Pro status, license keys, and personal preferences (such as Fingerprint default unlock) remain safely saved during laptop sleep or Wi-Fi disconnections.
- **Background Auto-Sync**: Automatically checks and restores Pro activation as soon as your device reconnects to the internet.

### 🐛 Bug Fixes & Performance Improvements

#### ⏱️ Auto-Lock Timer Fixes
- **Accurate Inactivity Lock**: Fixed an issue where Auto-Lock timers could trigger early after short breaks. Your custom lock timer is now strictly honored.

#### 🎨 Interface & Stability Improvements
- **Active Tab Blur Scope**: Fixed an issue where "Active Tab Only" blur mode did not trigger correctly on active tabs.
- **Smoother Interactions**: Optimized click listeners for faster response times and smoother screen transitions.
- **Dark & Light Mode Polish**: Enhanced visual theme support and color contrasts across Privacy Report and Biometric Setup screens.

---

## [3.0.0] - 2026-07-18

### 🎉 Major New Features

#### 🎨 Premium UI Redesign & Tabbed App Shell
- **Modern aesthetics**: Enjoy a premium interface featuring sleek glassmorphism panels, updated typography (using Outfit / Inter fonts), and clean layout cards.
- **Tabbed app shell**: Organized popup layout split into distinct tabs (Lock, Security, Timers, More) to avoid clutter in a compact popup.
- **Micro-animations**: Smooth layout shifts, fade transitions, and icon animations to make the interface feel responsive and alive.

#### 💎 Polar.sh License Manager Integration
- **License validation layer**: Integrate the extension to manage license activation, periodic validations, and local token checks.
- **Integrity verification**: Anti-tamper verification using HMAC-SHA256 tokens generated server-side.
- **Free/Pro tier limits**: Enforce usage limits on the Free tier (max 3 domain locks, max 3 intruder photos, max 5 biometric unlocks per day, and 3 uses of "Lock All Tabs").

#### 💬 Custom Lock Screen Messages (PRO)
- **Lock screen overlays**: Allow users to configure personal warning messages or guidelines to display on the tab lock screen.

#### 🚨 Intruder Desktop Notifications
- **Desktop alerts**: Issue browser notification alerts if someone enters incorrect passwords repeatedly on locked tabs.

---

## [2.7.1] - 2026-07-08

### 🐛 Bug Fixes & Refinements
- **Manually unlocked tabs tracking**: Improved startup locking behavior to record and track tabs that are manually unlocked by the user during the browser startup cycle, preventing redundant or duplicate lock screen overlays.
- **Stale Tab ID resolution**: Fixed startup unlock logic to handle stale tab IDs during session restores cleanly.

---

## [2.7.0] - 2026-07-04

### 🎉 Major New Feature

#### 🚀 Startup Lock — Auto-Lock All Tabs on Browser Start
- **Instant protection on browser launch**: All tabs from your last session are locked the moment the browser opens, with no timer or inactivity delay
  - Triggers via browser startup hooks — fires only on fresh browser start
  - Works with browser **"Continue where you left off"** session restore
  - Smart **session guard** (the session check) prevents re-locking mid-session
  - Skipping system pages (chrome://, edge://, about:, file://, etc.) and already-locked tabs
- **New 🚀 Startup Lock toggle** in the popup settings panel (collapsible section with detailed info)
  - Toggle state persisted to secure local storage as the settings
  - Requires a master password to be set
  - Single summary notification on activation showing how many tabs were locked
## [2.6.0] - 2026-05-10

### 🎉 Major New Features

#### 📸 Intruder Detection
- **Webcam Photo Capture on Failed Unlock Attempts**: Automatically captures a photo when someone enters the wrong password 3 or more times on a locked tab
  - Photos captured silently on the 3rd+ failed attempt (browser requests camera permission once)
  - All photos stored **100% locally** — never uploaded, never transmitted
  - Each photo tagged with an attempt number and timestamp
  - Intruder Log page for reviewing captured photos
    - Grid layout showing newest photos first
    - Per-photo delete button and "Delete All" action
    - Dark mode support for the log page
  - Toggle in popup settings → **📸 Intruder Detection** collapsible section
  - **"View Intruder Log"** button in popup shows real-time photo count badge
  - Feature defaults to OFF; user must explicitly enable it

#### 🔒 Locked Tabs Quick-Unlock Panel
- **Authenticated In-Popup Tab Unlock**: Since the popup itself is already authenticated, locked tabs can now be unlocked directly from the popup without re-entering the password
  - **🔒 Locked Tabs** collapsible panel in the main popup shows all currently locked tabs
  - Each tab displayed with its favicon, truncated title, and a **🔓 Unlock** button
  - Unlocking from the panel navigates the tab back to its original URL instantly
  - Panel updates in real time: new locks/unlocks are reflected immediately via local storage events
  - Panel and count badge auto-hide when no tabs are locked
  - Avoids password re-entry — authentication is already established by the popup's own auth screen

#### 👆 Enhanced Biometric Authentication
- **Biometric-Default Preference**: Users can now designate biometric as the primary unlock method per-device
  - New **"Use as Default Unlock"** toggle in the Biometric Lock settings section
  - When enabled: locked pages open in **biometric-first mode** — fingerprint/face prompt fires automatically, password is secondary
  - When disabled: password is primary, biometric appears as a secondary "Unlock with [Method]" button
  - Preference stored as the settings in secure local storage
- **Visibility-Aware Auto-Trigger**: Biometric prompt now fires only when the locked tab is actually visible and focused
  - Eliminates the "approve → loop again" bug where background tabs triggered WebAuthn prompts that immediately failed with browser security alerts
  - Shows "Switch to this tab to authenticate" message while waiting for tab focus
  - Uses tab focus triggers events to detect when the tab becomes active
  - the internal guard guard prevents duplicate prompt fires on the same page load
- **Popup-Level Biometric Auth**: Popup authentication screen now supports biometric unlock
  - Users with biometric enabled can authenticate into the popup using fingerprint/face instead of password
  - Platform-adaptive UI: shows correct icon and label for fingerprint vs. Windows Hello vs. Face ID
  - "Use Password Instead" / "Use Biometric Instead" toggle links for seamless switching
  - Biometric retry button on failure

### 🐛 Bug Fixes

- **Biometric Loop on Multi-Tab Restore**: Fixed the browser security alerts loop where session-restoring multiple locked tabs caused each background tab to fire its OS biometric prompt and fail immediately. Auto-trigger now deferred until tab gains focus.
- **Intruder Photo Storage Overflow**: Added silent guard preventing unbounded growth of the local photos store array — capped at 50 photos (oldest automatically pruned).

### 🚀 User Benefits

- **Catch Intruders**: Know exactly who tried to access your locked tabs — with timestamped photos
- **Zero-Friction Unlock**: Unlock any locked tab directly from the popup — no password required once authenticated
- **Seamless Biometrics**: Biometric-first mode removes the need to manually choose fingerprint — it just works
- **Privacy First**: Intruder photos are stored locally only, never uploaded

### 🎯 Feature Highlights

- ✅ Intruder Detection — webcam photo on 3+ failed attempts, local-only storage
- ✅ Intruder Log page — review, delete, and manage captured photos
- ✅ Locked Tabs Quick-Unlock Panel — unlock tabs from popup without password re-entry
- ✅ Biometric-Default preference — set fingerprint/face as primary unlock method
- ✅ Visibility-aware biometric auto-trigger — no more WebAuthn browser security alerts loops
- ✅ Popup biometric authentication — authenticate into the popup with biometrics
- ✅ Zero breaking changes — fully backward compatible with v2.5.x and earlier

---

## [2.5.0] - 2026-04-17

### 🎉 Major New Features

#### 🖱️ Right-Click Context Menus
- **Native Tab Context Menus**: Locksy actions are now accessible via right-click on any webpage
  - **🔒 Lock this tab**: Instantly lock the current tab without opening the popup
  - **🌐 Lock this domain**: Add the current site's root domain to domain lock list with a single right-click
  - **📂 Lock all tabs in this window**: Bulk-lock all compatible tabs via context menu
  - **👁️ Toggle Stealth Mode**: Flip stealth mode on/off directly from the right-click menu
  - Parent menu labeled "Locksy - Tab Locker 🔐" groups all actions neatly
  - Menus available in all page contexts: page, link, image, selection, editable
  - Menus re-register on every service worker wake to survive SW idle restarts
  - All actions validated: password check, system-page guard, duplicate-lock prevention

#### 🕵️ Stealth Mode
- **Invisible Lock Indicators**: Hide all visual evidence of Locksy from casual observers
  - Badge counter cleared — locked tab count no longer visible on the extension icon
  - All browser notifications suppressed while stealth is active
  - Locked pages can still be unlocked via triple-click on the error text or **Alt+U**
  - **Keyboard Shortcut**: `Alt+Shift+7` toggles stealth mode without opening the popup
  - **Right-Click Toggle**: Context menu item for instant stealth toggle
  - **Popup Toggle**: Dedicated collapsible Stealth Mode section in popup settings
  - State persisted in secure local storage and restored after service worker restarts
  - Disabling stealth shows a confirmation notification; enabling is always silent

#### 🎨 Manual Theme Toggle (Light / Dark Mode)
- **New the theme engine Module**: Centralized, persistent theme system for all extension pages
  - Two-state manual toggle: Light ☀️ / Dark 🌙 — no more auto-detection dependency
  - Preference stored in secure local storage (the theme configuration key)
  - Synchronizes instantly across popup, locked page, domain manager, shortcuts page, everywhere
  - Flash-prevention: theme applied before DOM is fully parsed via early `initThemeEarly()`
  - Toggle button embedded in popup header; `data-theme` attribute on `<html>` drives CSS
  - `window.reinitThemeToggle()` exposed globally so popup can re-bind after dynamic DOM rebuilds
  - Lock screen  ships with its own navigation shell with theme toggle for seamless UX

### 🐛 Bug Fixes

- **Domain Lock URL Normalization**: Fixed domain matching ignoring `www.` prefix and `https://` protocols
  - Entering `youtube.com` now correctly locks both `youtube.com` and `www.youtube.com`
  - Entering `https://youtube.com` or `https://www.youtube.com` is now accepted and normalized
  - Pattern matching engine updated: exact hostname OR `www.` variant both match a bare domain pattern
  - Context menu "Lock this domain" strips `www.` automatically before storing the pattern
- **Context Menu Persistence**: Menus now call `setupContextMenus()` on every SW wake, not only on install/update
- **Stealth Notification Bypass**: `notify()` helper added — all notification callsites route through it so stealth mode suppression is enforced globally

### 🚀 User Benefits

- **Faster Locking**: Lock tabs, domains, or windows without ever opening the popup — just right-click
- **Complete Privacy**: Stealth mode makes Locksy invisible; even the icon badge gives nothing away
- **Themed UI**: Choose Light or Dark — preference follows you across every Locksy page
- **No More URL Confusion**: Domain lock correctly handles `www.` and `https://` prefixes automatically

### 🎯 Feature Highlights

- ✅ Right-click context menu with 4 Locksy actions on every web page
- ✅ Stealth Mode — suppresses badge, notifications, and any visual lock indicator
- ✅ Alt+Shift+7 keyboard shortcut to toggle Stealth Mode
- ✅ Persistent light/dark theme across all extension pages
- ✅ Domain lock URL normalization (www. / https:// prefix handling)
- ✅ Theme toggle button in popup header and locked-page navigation shell
- ✅ Zero breaking changes — fully backward compatible with all earlier versions

---

## [2.4.0] - 2026-02-25

### ✨ New Features
- **Unlock All Tabs**: New button in the popup that unlocks every locked tab simultaneously with a single click
  - Batch implementation — one storage read, one storage write, all the batch action calls fire in parallel
  - All tabs navigate back to their original URLs at the same time (no sequential unlocking)

### 🐛 Bug Fixes
- **Temporarily unlocked tabs state persistence**: Fixed the unlock session being omitted from the storage write after a scheduled lock period ends. Previously, if the service worker restarted at that moment, tabs that were temporarily unlocked (via domain lock bypass) would be incorrectly re-locked on the next navigation check.

---

## [2.3.0] - 2026-02-21

### 🎉 Major New Features

#### 🔑 Biometric Authentication (WebAuthn)
- **Fingerprint & Face Recognition Unlock**: Unlock protected tabs using your device's built-in biometrics
  - Register biometric credential once per device via device authenticator (Windows Hello, Touch ID, Face ID, etc.)
  - One-tap biometric unlock on the locked tab screen
  - Graceful fallback to master password if biometric fails or is unavailable
  - Retry option with clear status messaging for each biometric attempt
  - Works with any FIDO2 / WebAuthn-compatible authenticator
  - Biometric toggle in popup settings — enable or disable at any time
  - Stored credentials never leave the device (public-key only, no biometric data stored)

#### 📬 Newsletter Subscription
- **Stay Updated**: Subscribe to Locksy updates directly from the extension popup
  - Single-click newsletter subscription button integrated into the popup UI
  - Opens subscription page without cluttering the popup flow

### 🎨 UI & Responsive Design Improvements
- **Responsive Layout Overhaul**: Better usability across all device viewports and screen sizes
  - `locked.css`: Full responsive redesign — lock screen adapts cleanly to all display sizes
  - `popup.css`: Layout and spacing adjustments for smaller popups and high-DPI screens
  - `domain-manager.css`: Improved table and button layout on narrow viewports
- **Biometric UI Components**: New styled states for biometric prompts, spinner, status badges, and retry buttons
- **Authentication Screen Enhancements**: Cleaner visual separation between biometric and password flows
- **Popup Settings Section**: New biometric lock settings panel with toggle and registration controls

### 🚀 User Benefits
- **Effortless Unlocking**: No more typing password every time — use your fingerprint or face
- **Device-Native Security**: Leverages the same security chip used by banking apps
- **No Biometric Data Stored**: Only a reference ID is saved; actual biometric never leaves the OS
- **Backward Compatible**: Existing password-only setups continue to work unchanged
- **Privacy Preserved**: WebAuthn is fully local — zero server communication

### 🎯 Feature Highlights
- ✅ Biometric unlock (fingerprint / face / Windows Hello / Touch ID / Face ID)
- ✅ Password fallback always available
- ✅ Responsive lock screen for all screen sizes
- ✅ Newsletter subscription button in popup
- ✅ Zero biometric data ever transmitted or stored beyond the device

---

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
    - Zero performance impact on browsing
  
- **Real-World Use Cases Now Supported**:
  - ✅ Watching videos without interruption
  - ✅ Reading long articles safely
  - ✅ Working on single-page apps
  - ✅ Coding in web-based IDEs
  - ✅ Any passive content consumption
  - ❌ Only locks when truly inactive
  
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

### 🔗 Related Files

**New Files**:
- `.github/workflows/auto-release.yml` - Automated release workflow
- `.github/workflows/build.yml` - Build verification workflow  
- the interface - What's New overlay page
- `src/css/whats-new.css` - What's New styling
- the extension - What's New functionality
- `docs/BUILD_GUIDE.md` - Build from source guide
- `docs/SECURITY.md` - Security documentation
- `docs/VERIFY.md` - Quick verification guide

**Modified Files**:
- the extension - Added centralized rate limiting
- the extension - Updated to use background script for password verification
- the extension - Updated to use background script for password verification
- the extension - Removed local rate limiting (moved to background)
- `src/css/popup.css` - Added What's New overlay styling
- `build.js` - Exclude screenshots from packages
- the extension configuration - Version bump to 2.1.0
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

#### 📝 Documentation
- Added comprehensive `SECURITY_ASSESSMENT.md` with:
  - Detailed threat model analysis
  - Before/after security comparison
  - Implementation details and code examples
  - Attack resistance metrics
  - Future enhancement recommendations

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
  - the extension: Replaced innerHTML with secure DOM methods
  - the extension: Enhanced with safe element creation
  - the extension: Implemented secure DOM manipulation
  - the extension: Updated with safe DOM practices
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
  - the extension configuration: Added `commands` section with 4 keyboard shortcuts
  - the interface: Added keyboard shortcuts info section
  - the extension: Updated to show/hide shortcuts based on password state
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
  - the extension: Added favicon management functions
  - the extension: Added badge update system
  
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
  - the extension: Domain lock management logic
  - the interface: Domain manager interface
  - `src/css/domain-manager.css`: Domain manager styles
  
- **Updated Files**:
  - the extension: Domain lock pattern matching and management
  - the extension: Unlock scope dialog and preference handling
  - the extension: Domain Lock button integration
  - the extension configuration: Version updated to 1.0.6
  
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
  - Prevents loss of locked tabs protection due to service worker lifecycle

#### Fixed
- **Silent Failure Issue**: Previously, clicking "Lock This Tab" on system pages did nothing, making users think the extension was broken. Now, users see clear feedback explaining why the tab cannot be locked.
- **Service Worker Sleep Bug**: Critical fix for locked tabs losing protection after Chrome's service worker goes to sleep (~30 seconds of inactivity). The extension now properly restores locked tabs from storage when the service worker wakes up, ensuring continuous protection even after periods of inactivity.

#### Technical Details
- **Restricted Tab Types**: System pages (`chrome://`, `edge://`, `about:`), extension pages, Chrome Web Store, and empty tabs cannot be locked due to browser security restrictions
- **User Feedback**: All lock attempts now provide immediate visual feedback via the notification system
- **Error Handling**: Comprehensive error messages guide users when tabs cannot be locked
- **Service Worker Lifecycle**: Chrome MV3 service workers sleep after ~30 seconds of inactivity. The extension now handles this by persisting locked tabs to secure local storage and restoring them on service worker wake-up
- **Console Logging**: Added debug logs to track service worker restarts and locked tabs restoration

---

## [1.0.2] - 2025-10-31

### 🕶️ Incognito Mode Support

#### Added
- **Incognito Mode Compatibility**: Extension now works seamlessly in private browsing windows
- **Unified Password System**: Same master password protects tabs in both normal and incognito modes
- **Spanning Incognito**: Configured manifest to support incognito mode with shared storage

#### Fixed
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
