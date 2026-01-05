# Privacy Policy for Locksy

**Last Updated:** October 20, 2025  
**Version:** 6.1.0

---

## Overview

Locksy ("the Extension") is committed to protecting your privacy. This privacy policy explains how the Extension handles your data and what information is collected, stored, and processed.

---

## Data Collection and Storage

### What Data We Collect

Locksy collects and stores the following data **locally on your device only**:

1. **Master Password (Hashed)**
   - Your master password is hashed using SHA-256 cryptographic hashing
   - Only the hash is stored, never the plain text password
   - Stored locally using Chrome's `chrome.storage.local` API
   - Used solely for tab locking and unlocking functionality

2. **Extension State**
   - Whether the extension is currently active or inactive
   - Stored locally on your device

3. **Locked Tab Information**
   - List of tab IDs that are currently locked
   - Stored temporarily in local storage
   - Automatically cleared when tabs are closed or unlocked

4. **Authentication Session Data**
   - Failed login attempts counter (for brute force protection)
   - Temporary lockout timestamps (for security)
   - Session authentication status

### What Data We DO NOT Collect

The Extension does **NOT** collect, transmit, or store:

- ❌ Browsing history
- ❌ Website URLs you visit
- ❌ Personal information (name, email, address, etc.)
- ❌ Payment information
- ❌ Cookies or tracking data
- ❌ Any data from locked or unlocked web pages
- ❌ Analytics or usage statistics
- ❌ Device information beyond what's necessary for functionality

---

## How We Use Your Data

All data collected by the Extension is used **exclusively** for the following purposes:

1. **Password Protection**: To verify your identity when unlocking locked tabs
2. **Tab Security**: To maintain the list of locked tabs and enforce access restrictions
3. **Security Features**: To implement brute-force protection and session management
4. **Extension State**: To remember your preference for keeping the extension active or inactive

---

## Data Storage and Security

### Local Storage Only

- **All data is stored locally** on your device using Chrome's secure storage APIs
- **No cloud storage**: Nothing is uploaded to external servers
- **No third-party services**: We don't use any external analytics, tracking, or data processing services
- **Offline functionality**: The extension works entirely offline

### Security Measures

1. **Password Hashing**: Passwords are hashed using SHA-256 before storage
2. **No Plain Text Storage**: Your actual password is never stored in plain text
3. **Chrome's Secure Storage**: We use `chrome.storage.local` which is protected by Chrome's security model
4. **Brute Force Protection**: Automatic lockout after multiple failed attempts
5. **Session Timeouts**: Authentication sessions expire after 10 minutes of inactivity

---

## Permissions Explanation

The Extension requests the following Chrome permissions:

### Required Permissions

1. **`storage`**
   - **Purpose**: Store your hashed password, extension settings, and locked tab information locally
   - **Data Access**: Local device storage only
   - **No Network Access**: This data never leaves your device

2. **`tabs`**
   - **Purpose**: Identify and manage tabs that you want to lock
   - **Data Access**: Tab IDs and basic tab metadata only
   - **No Content Access**: We don't read the content of web pages

3. **`<all_urls>` (Host Permissions)**
   - **Why This Looks Scary**: Browser warns "Read and change all your data on all websites"
   - **What We Actually Do**: Only inject the lock screen overlay on tabs YOU choose to lock
   - **What We DON'T Do**: 
     - ❌ Never read page content
     - ❌ Never access passwords or form data
     - ❌ Never track browsing history
     - ❌ Never modify page behavior (except showing lock screen)
   - **Technical Reason**: We need permission to display the lock screen on ANY domain you choose to lock. Since we can't predict which sites you'll lock, we need `<all_urls>`.
   - **Proof**: Search our code for `fetch()`, `XMLHttpRequest`, or network calls - you'll find none!

3. **`scripting`**
   - **Purpose**: Inject the lock overlay onto tabs you choose to lock
   - **Data Access**: None - only injects visual lock interface
   - **User-Initiated**: Only runs when you explicitly lock a tab

4. **`activeTab`**
   - **Purpose**: Lock the currently active tab when you click the lock button
   - **Data Access**: Current tab identifier only
   - **No Browsing Data**: Doesn't access page content or history

5. **`notifications`**
   - **Purpose**: Show you helpful notifications about lock/unlock actions
   - **Data Access**: None - only displays messages
   - **User Benefit**: Provides feedback on security actions

6. **`webNavigation`**
   - **Purpose**: Detect when locked tabs are navigated or refreshed to maintain the lock
   - **Data Access**: Navigation events for locked tabs only
   - **Security Feature**: Prevents bypass attempts through page refresh

### Host Permissions

**`<all_urls>`**
- **Purpose**: Allow the extension to lock any tab you choose
- **Limitation**: Only activates on tabs you explicitly lock
- **No Automatic Access**: The extension doesn't automatically access or monitor all tabs
- **User Control**: You decide which tabs to lock

---

## Data Sharing and Third Parties

### No Data Sharing

- ✅ **We do NOT sell** your data to anyone
- ✅ **We do NOT share** your data with third parties
- ✅ **We do NOT transmit** your data over the internet
- ✅ **We do NOT use** analytics or tracking services
- ✅ **We do NOT have** access to your data (it's stored locally on your device)

### No External Services

The Extension operates **entirely on your local device** and does not:
- Connect to external servers
- Send telemetry or usage data
- Use third-party APIs
- Include tracking pixels or beacons
- Integrate with analytics platforms

---

## Data Retention and Deletion

### How Long We Keep Your Data

- **Password Hash**: Stored until you manually change or delete it
- **Extension Settings**: Stored until you uninstall the extension
- **Locked Tab Information**: Automatically cleared when tabs are closed or unlocked
- **Authentication Session**: Expires after 10 minutes of inactivity

### How to Delete Your Data

You can delete all data stored by the Extension at any time:

**Option 1: Uninstall the Extension**
1. Right-click the extension icon in Chrome
2. Select "Remove from Chrome"
3. Confirm removal
4. All data is automatically deleted

**Option 2: Clear Extension Data**
1. Go to `chrome://extensions/`
2. Find "Locksy"
3. Click "Details"
4. Scroll to "Site settings" or use "Clear storage"
5. Confirm deletion

**Option 3: Clear Chrome Storage**
1. Go to `chrome://settings/clearBrowserData`
2. Select "Advanced"
3. Check "Site settings" or "Hosted app data"
4. Select "All time"
5. Click "Clear data"

---

## User Rights

You have the following rights regarding your data:

1. **Right to Access**: View all data stored by the extension via Chrome DevTools
2. **Right to Delete**: Delete all data by uninstalling the extension
3. **Right to Control**: Choose which tabs to lock and when
4. **Right to Export**: Data is stored locally and accessible to you
5. **Right to Opt-Out**: Disable or uninstall the extension at any time

---

## Children's Privacy

The Extension does not knowingly collect data from children under 13 years of age. The Extension is designed for general use and does not target children. No personal information is collected from any user, regardless of age.

---

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in:
- Extension functionality
- Legal requirements
- Security improvements
- User feedback

**Notification of Changes:**
- The "Last Updated" date at the top of this policy will be updated
- Significant changes will be announced in the extension's update notes
- Continued use of the Extension after changes constitutes acceptance

---

## Compliance

### GDPR Compliance (European Union)

For users in the EU, this Extension:
- ✅ Processes data locally only (no cross-border transfer)
- ✅ Collects minimal data necessary for functionality
- ✅ Provides transparent information about data use
- ✅ Allows easy data deletion
- ✅ Does not use automated decision-making

### CCPA Compliance (California)

For California residents:
- ✅ We do not sell personal information
- ✅ We do not share personal information with third parties
- ✅ You can request deletion at any time (via uninstall)
- ✅ We provide transparent disclosure of data practices

---

## Security

We take security seriously:

- **Encryption**: Passwords are hashed with SHA-256
- **Local Storage**: All data stored securely on your device
- **No Transmission**: Data never leaves your computer
- **Brute Force Protection**: Automatic lockout after failed attempts
- **Regular Updates**: Security improvements in each version

However, please note:
- No system is 100% secure
- Protect your master password
- Use a strong, unique password
- Keep Chrome updated for best security

---

## Open Source

This Extension is open source and available at:
- **GitHub Repository**: https://github.com/vansh-121/Secure-Tab-Extension

You can:
- Review the source code
- Verify our privacy claims
- Contribute improvements
- Report security issues

---

## Contact Information

If you have questions about this Privacy Policy or the Extension:

- **GitHub Issues**: https://github.com/vansh-121/Secure-Tab-Extension/issues
- **Developer**: vansh-121

For security vulnerabilities:
- Please report privately via GitHub Security Advisories
- Do not disclose security issues publicly until patched

---

## Legal Basis for Processing (GDPR)

For EU users, our legal basis for processing your data is:

1. **Legitimate Interest**: Providing tab locking functionality you requested
2. **Consent**: By installing and using the extension, you consent to data processing as described
3. **Necessity**: Data processing is necessary for the extension to function

---

## Data Protection Officer

As a small open-source project, we do not have a dedicated Data Protection Officer. For privacy inquiries, please use the contact information above.

---

## Conclusion

**Bottom Line:**
- ✅ Your data stays on your device
- ✅ Your password is hashed, not stored in plain text
- ✅ No tracking, analytics, or third-party services
- ✅ You control your data completely
- ✅ Delete everything by uninstalling

We built this Extension to **protect your privacy**, not invade it.

---

**By installing and using Locksy, you acknowledge that you have read and understood this Privacy Policy.**

---

*This privacy policy is effective as of October 20, 2025.*