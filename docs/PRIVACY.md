# Privacy Policy for Locksy

**Last Updated:** November 12, 2026  
**Version:** 3.7.0  
**Effective Date:** November 12, 2026

---

## 1. Overview & Single Purpose Statement

Locksy ("the Extension", "we", "our") is designed to protect your browser privacy and secure sensitive tabs. The single purpose of the Extension is to allow users to lock and password-protect individual browser tabs, domains, and sensitive web elements.

We adhere strictly to a privacy-by-design, local-first philosophy. All core locking, tab management, biometric verification, and security analysis are processed locally on your device. We do not sell, rent, or monetize your personal data.

This Privacy Policy comprehensively discloses:
- The exact categories of user data collected and how they are handled
- Data storage locations and explicit data retention periods
- All third-party services and parties data may be shared with
- How you can access, control, and delete your data

---

## 2. User Data Collection and Handling

We believe in radical data minimization. We only collect the minimal technical data strictly required to deliver tab-locking functionality.

### 2.1 What Data We Collect & How We Handle It

| Data Category | Purpose of Collection | Collection Method | Handling & Processing |
| :--- | :--- | :--- | :--- |
| **Master Password, PIN & Emergency Recovery Key** | Authenticates you when unlocking protected tabs or recovering access. | Explicit user input during initial setup, password updates, or emergency key setup. | Cryptographically hashed using PBKDF2 with SHA-256 (600,000 iterations) with a unique salt before storage. **Plaintext passwords and recovery keys are never stored, logged, or transmitted.** |
| **Locked Tab Information (Tab IDs & URLs)** | Identifies locked tabs, enforces the lock screen overlay, and restores you to the original destination upon successful authentication. | Automatically captured by `tabs` and `webNavigation` browser APIs **only when you explicitly lock a tab or domain**. | Stored locally in `chrome.storage.local`. Used solely to reload the locked webpage after you enter the correct password/PIN. |
| **Domain Lock Rules & Preferences** | Remembers which websites/domains you have chosen to automatically lock, whitelist rules, and auto-lock schedules. | Configured by user in the Locksy options/popup interface. | Stored locally in `chrome.storage.local`. Read by background service worker to trigger locking on matching URLs. |
| **Authentication Session State & Security Logs** | Implements brute-force defense (lockouts after failed attempts) and generates your local Security Insights. | Generated automatically by the Extension during authentication events. | Tracks failed attempt counts and timestamps locally in memory and `chrome.storage.local`. Does not contain identifiable user data. |
| **Intruder Photo Capture (Optional)** | Captures a local webcam snapshot of unauthorized individuals attempting to guess your password after repeated failed attempts. | Captured via browser webcam API **only if explicitly enabled by the user** in settings. | Processed entirely on-device and stored as base64 images in `chrome.storage.local`. **Never transmitted over the network or uploaded to any server.** |
| **Privacy Blur Shield Configuration** | Remembers user-configured masking categories (e.g. banking, passwords, emails) and custom blur levels. | Configured by user in the Privacy Blur Manager. | Stored locally and applied client-side via content scripts on loaded pages. |
| **Pro License Key & Status (Pro Users Only)** | Verifies Pro tier activation and subscription entitlement. | Entered by user upon purchasing or activating Locksy Pro. | Transmitted securely over HTTPS to our license verification endpoint (`https://locksy-api.vansh-sethi98760.workers.dev`) to check validity with Polar.sh. No browsing data or passwords are ever included. |

### 2.2 What Data We DO NOT Collect

The Extension does **NOT** collect, monitor, harvest, or store:
- ❌ Continuous browsing history or search queries
- ❌ Website contents, form entries, or keystrokes (beyond password verification on Locksy's own lock screens)
- ❌ Personal identifiers (full name, home address, phone number, government ID)
- ❌ Financial, credit card, or payment instrument details (all payments are handled externally by Polar.sh)
- ❌ Third-party advertising identifiers, device fingerprinting, or tracking cookies
- ❌ Analytical telemetry or user behavior profiling

---

## 3. Data Storage, Security, and Retention Schedule

### 3.1 Storage Location
All user data and settings are stored **locally on your device** inside Chrome's isolated, sandboxed storage via `chrome.storage.local`. We do not maintain any cloud databases or remote servers that store your passwords, browsing history, locked URLs, or intruder photos.

### 3.2 Data Retention Periods

In compliance with Chrome Web Store User Data policies, our explicit retention schedule is as follows:

| Data Type | Retention Period | Deletion Trigger |
| :--- | :--- | :--- |
| **Locked Tab URLs & IDs** | Transient (Temporary) | **Deleted immediately** the moment the tab is unlocked, closed, or the browser session ends. |
| **Authentication Session Tokens** | Session-only (Up to 10 minutes) | **Cleared automatically** after 10 minutes of inactivity, on browser restart, or on manual lock. |
| **Intruder Photo Captures** | Local persistent | Retained locally until the user clicks "Clear Log" in the Security Dashboard, or upon extension uninstallation. |
| **Failed Attempt Lockout Timestamps** | Temporary (Up to 30 minutes) | Automatically cleared once the brute-force cooldown timer expires. |
| **Hashed Password & User Settings** | Persistent until modified | Retained until you update your settings, clear extension data, or uninstall Locksy. |

### 3.3 Security Safeguards
- **Cryptographic Hashing**: Master passwords, PINs, and recovery keys are hashed using PBKDF2 (SHA-256, 600,000 iterations).
- **Brute-Force Resistance**: Progressive cooldown locks prevent unauthorized automated password guessing.
- **Local Isolation**: Chrome's extension security sandbox prevents other extensions or websites from reading Locksy's internal storage.

---

## 4. Data Sharing and Third-Party Disclosures

### 4.1 Strict No-Sale & No-Broker Policy
- **We NEVER sell, rent, lease, or trade user data to third parties, data brokers, or advertisers.**
- **We NEVER use or transfer user data for personalized advertising, retargeting, or creditworthiness evaluation.**
- **We NEVER use user data for purposes unrelated to the single purpose of tab locking.**

### 4.2 Comprehensive List of Third-Party Parties & Service Providers

The Extension limits external communication strictly to Pro license validation. Below is the complete list of parties and services involved:

| Party / Service Provider | Role & Service Provided | Data Shared / Received | Privacy Link |
| :--- | :--- | :--- | :--- |
| **Cloudflare Workers** (`locksy-api.vansh-sethi98760.workers.dev`) | Secure serverless API proxy for license key verification. | License key and validation timestamp only. **No URLs, passwords, or personal information.** | [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/) |
| **Polar.sh** | Merchant of Record, payment processing, and license issuance. | License key, transaction status, and customer email (provided during checkout on Polar.sh). Extension queries Polar API via Cloudflare proxy to confirm license validity. | [Polar Privacy Policy](https://polar.sh/legal/privacy) |

*Note for Free Tier Users:* If you use the free version of Locksy, **zero external network requests are made**. The extension operates 100% offline.

---

## 5. Browser Permissions Explanation

Locksy declares minimal permissions in `manifest.json`. Below is the complete justification for each permission:

- **`storage`**: Used to store your hashed password, user preferences, domain lock rules, and intruder logs locally on your machine. Data never leaves your device.
- **`tabs`**: Used to identify tab IDs and URLs of tabs you choose to lock, so Locksy can display the lock overlay and restore the original URL upon successful unlock.
- **`activeTab`**: Allows one-click locking of the currently active tab when you click the Locksy toolbar action or use the lock shortcut.
- **`webNavigation`**: Detects when a locked tab or locked domain is refreshed or navigated, ensuring the lock screen cannot be bypassed by reloading the page.
- **`notifications`**: Displays desktop notifications for security events (e.g., successful lock, lockout warnings, auto-lock triggers).
- **`alarms`**: Powers auto-lock timers and scheduled lock intervals locally in the background.
- **`contextMenus`**: Adds right-click options ("Lock this tab", "Lock this domain") to the browser context menu.
- **`idle`**: Detects when your computer becomes idle or screensaver activates to automatically lock protected tabs if auto-lock on idle is enabled.
- **`<all_urls>` (Host Permissions)**: Required to display the lock screen overlay on any domain you designate to lock, and to inject Privacy Blur masks on pages where sensitive fields (passwords, banking numbers) are detected. Locksy does not automatically monitor, scrape, or log content across your browsing.
- **`https://locksy-api.vansh-sethi98760.workers.dev/*`**: Host permission used exclusively by Pro users to validate license keys against Polar.sh.
- **`https://locksy.dev/*`**: Host permission used for version update notes and documentation links.

---

## 6. User Data Rights & How to Delete Your Data

You maintain complete control over your data at all times:

1. **Accessing Your Data**: All stored configurations and logs can be reviewed directly in Locksy's popup, Settings, and Security Dashboard.
2. **Deleting Specific Data**:
   - Clear Intruder Photos: Open **Security Dashboard** -> Click **Clear Intruder Logs**.
   - Clear Domain Rules: Open **Domain Manager** -> Delete any configured domain.
   - Reset Master Password: Open **Settings** -> Change or Reset Password.
3. **Complete Deletion of All Data**:
   - **Method A (Uninstall)**: Right-click the Locksy extension icon in your browser toolbar, select **Remove from Chrome...**, and click **Remove**. Chrome immediately and irreversibly deletes all associated local storage, password hashes, and settings.
   - **Method B (Clear Extension Storage)**: Navigate to `chrome://extensions/` -> Click **Details** on Locksy -> Click **Extension options** or **Clear data**.

---

## 7. Compliance

### GDPR Compliance (European Economic Area)
For users in the EU/EEA:
- We process minimal data under the legal basis of **contractual necessity** and **legitimate interest** (providing the requested tab locking and security functionality).
- Data processing is local-first. Cross-border transfers are limited to license validation requests via Cloudflare/Polar under standard contractual clauses.
- You have the right to access, rectify, or erase your data at any time (exercisable locally as described in Section 6).

### CCPA / CPRA Compliance (California)
For California residents:
- We do not "sell" or "share" personal information as defined by the CCPA/CPRA.
- We do not collect sensitive personal information for the purpose of inferring characteristics.
- You have the right to know what personal data is collected and request its deletion.

### Children's Privacy
Locksy does not knowingly collect or solicit personal information from children under 13. The Extension is intended for general audience productivity and security.

---

## 8. Changes to This Privacy Policy

We may update this Privacy Policy periodically to reflect new features, security updates, or regulatory requirements. Any updates will be reflected with a revised **Last Updated** date at the top of this document and documented in our extension release notes.

---

## 9. Contact & Support

If you have questions, feedback, or security inquiries regarding this Privacy Policy:

- **Developer**: Vansh Sethi
- **GitHub Repository**: [https://github.com/vansh-121/Locksy](https://github.com/vansh-121/Locksy)
- **Issue Tracker & Inquiries**: [https://github.com/vansh-121/Locksy/issues](https://github.com/vansh-121/Locksy/issues)
- **Website**: [https://www.locksy.dev](https://www.locksy.dev)
- **Security Vulnerability Reporting**: Please submit security advisories privately via GitHub Security Advisories.
