# 🔐 Security & Trust Documentation

**Version:** 3.5.0  
**Last Updated:** September 15, 2026

---

## 🎯 Building Trust Through Transparency

Locksy is designed from the ground up with an **offline-first, zero-knowledge architecture**. This document provides a transparent overview of how your data is protected, how encryption and biometric authentication work, why specific browser permissions are requested, and how you can independently verify our security guarantees.

---

## 🔍 Independent Security Verification

You do not need access to private source code to verify that Locksy respects your privacy. Every user or security researcher can independently audit the extension's runtime behavior in 5 minutes using standard browser tools.

### 1. Network Activity Audit (Browser DevTools)
1. Open your browser's Developer Tools (`F12` or `Ctrl+Shift+I`).
2. Navigate to the **Network** tab.
3. Lock any tab, enter passwords, trigger lock timers, or access the popup.
4. **Verification**: Confirm that **ZERO outbound network requests** are transmitted. Locksy never phones home, collects telemetry, or sends your URLs, passwords, or browsing data to external servers. *(The only network communication occurs if you opt to activate a Pro license, which contacts the licensing verification proxy).*

### 2. Full Offline Verification (Airplane Mode)
1. Disconnect your computer or mobile device from the internet (disable Wi-Fi or unplug ethernet).
2. Lock tabs, unlock them with passwords or biometrics, configure auto-lock schedules, and test webcam intruder detection.
3. **Verification**: Confirm that 100% of extension features work seamlessly offline. Core tab protection requires no cloud connectivity whatsoever.

### 3. Local Storage Audit
1. Open Developer Tools on the extension popup or lock screen.
2. In the **Application** (Chrome/Edge) or **Storage** (Firefox) tab, expand **Extension Storage** → `chrome.storage.local`.
3. **Verification**: Confirm that:
   - Passwords are never stored in plaintext — only salted PBKDF2 cryptographic digests are kept.
   - Webpage content, form inputs, session cookies, and full browsing histories are **never** written to storage.
   - Intruder photos (if enabled) are stored as local image blobs on your machine and never transmitted.

---

## 🌐 Why Does Locksy Request the `<all_urls>` Permission?

### The Browser Warning
When installing Locksy, the browser displays a standard permission alert:
> *"Read and change all your data on all websites"*

### The Technical Reality
Browser WebExtension architectures lack granular "redirect tab" permissions. Because you can choose to lock **any** website on the internet, Locksy requires broad URL matching for exactly two features:

1. **Domain Locking**: Detecting when a tab navigates to a domain you have added to your lock list (including wildcards like `*.google.com`) so Locksy can immediately redirect the tab to the secure lock screen before the page renders.
2. **Privacy Blur Shield (Optional)**: If you enable the Privacy Blur Shield, the extension applies local visual masks over sensitive inputs (credit card numbers, passwords, OTP fields) on pages matching your configured rules.

**What Locksy NEVER Does:**
- ❌ Never reads page contents, text, or form data on unlocked pages.
- ❌ Never logs browsing history or stores visit timestamps.
- ❌ Never modifies website logic or intercepts network traffic.
- ❌ Tab locking injects **no script** into the target site; it redirects the entire tab to Locksy's standalone, sandboxed lock screen (`locked.html`).

---

## 🛡️ Biometric Authentication Security (WebAuthn / FIDO2)

Locksy supports hardware-backed biometric unlock (Touch ID, Face ID, Windows Hello, and Android Biometrics) utilizing the international **W3C WebAuthn / FIDO2** standard.

```
┌─────────────────────────────────────────────────────────────┐
│                    Operating System                         │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Hardware Security Module (TPM / Apple Secure Enclave)│   │
│   │  • Biometric verification happens entirely HERE     │   │
│   │  • Raw fingerprint / facial scan NEVER leaves chip  │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ Valid Signature Assertion    │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Browser WebAuthn API (navigator.credentials)        │   │
│   └──────────────────────────┬──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │ Assertion Confirmed
                               ▼
            ┌────────────────────────────────────┐
            │         Locksy Extension           │
            │  • Stores only random Credential ID│
            │  • Never receives biometric data   │
            │  • 100% offline verification       │
            └────────────────────────────────────┘
```

### Key Security Properties

| Property | Implementation |
| :--- | :--- |
| **Standard** | W3C WebAuthn / FIDO2 Specification |
| **Hardware Boundary** | Handled by OS Security Processor (TPM, Secure Enclave) |
| **Biometric Data Access** | **NONE** — Locksy has zero access to raw biometric scans |
| **Data Transmission** | **NONE** — Cryptographic verification is 100% local |
| **Stored Credentials** | Random public key credential ID only |
| **Authentication Fallback** | Master Password is always available if biometric prompt fails |
| **Configuration** | Strictly opt-in (disabled by default) |

---

## 🔑 Master Password Cryptography & Key Derivation

Locksy never stores your master password on disk or in memory. Protection is built upon hardened cryptographic standards:

### 1. PBKDF2-SHA256 Key Derivation (600,000 Iterations)
- When setting your master password, Locksy generates a **cryptographically secure 128-bit random salt**.
- The password and salt are processed through **600,000 iterations of PBKDF2-SHA256**, matching the latest security recommendations from OWASP and major password vault engines (1Password, Bitwarden).
- This high iteration count makes brute-force and dictionary attacks computationally prohibitive, even with specialized GPU hardware.

### 2. Constant-Time Verification
- When you enter your password to unlock a tab, the same 600,000-round PBKDF2 derivation is performed.
- The resulting digest is compared against the stored hash using **constant-time byte comparison**, eliminating timing side-channel attacks.

### 3. Master Recovery Key Architecture (v3.3.0+)
- During initial setup, a secure 16-character recovery key (`LOCKSY-XXXX-XXXX-XXXX`) is generated on your device.
- The recovery key is hashed via PBKDF2-SHA256 before saving to local storage. Only the cryptographic hash is stored; the plaintext key is displayed once for local backup and never retained on disk.
- Emergency password resets can be executed through the recovery key without contacting external servers or compromising device security.

---

## 🛠️ Disclosed Security Hardening & Fixes

We believe in responsible disclosure and transparent security documentation:

### v3.5.0 — Rapid-Navigation Protection & Multi-Device Synchronization
- **Rapid Navigation Lock Bypass Mitigation**: Resolved an edge case where rapidly clicking a domain-locked bookmark multiple times in succession could bypass tab redirection due to an aggressive debounce filter. Redirection evaluation is now instantaneous and uninterrupted for every requested page load, backed by an immediate commit listener.
- **Device Revocation Enforcement**: Multi-device license verification was hardened to track specific device activation identifiers. Removing a device from the popup immediately invalidates its slot on the next validation sweep without affecting active devices.
- **Network Resilience**: License validation gracefully tolerates transient network dropouts with a non-destructive, auto-recovering suspension state rather than abruptly signing out.

### v3.4.0 — Cross-Platform Mobile Security & Biometric Fallback Arbitration
- **Android WebExtension Sandbox Isolation**: Introduced cross-platform capability normalization for Firefox on Android (`geckoView`), preventing background service worker crashes in constrained mobile environments.
- **Biometric Error Arbitration**: Hardened WebAuthn exception handling on mobile to ensure clean fallback to Master Password / PIN whenever biometric sensors are cancelled or unavailable.

### v3.3.0 — Master Recovery Key & Sensitive Action Re-Authentication
- **Zero-Knowledge Emergency Recovery**: Implemented PBKDF2-hashed emergency recovery key infrastructure for forgotten passwords without requiring centralized accounts or cloud data escrow.
- **Sensitive Action Re-Auth**: High-security configuration actions (unlocking tabs, modifying domain lists, toggling stealth mode) enforce explicit re-authentication even during active sessions.

### v3.2.0 — Web-Accessible Page Isolation & Hash Upgrades
- **Strict Frame Isolation**: Removed extension resources from `web_accessible_resources` manifests, eliminating potential clickjacking or UI redress attacks by third-party web pages. Added tab-ownership verification so lock screens cannot be framed.
- **Transparent PBKDF2 Migration**: Automatically upgraded legacy single-pass SHA-256 hashes from early releases to 600,000-round PBKDF2 on the user's next successful unlock.

### v3.1.1 — Session Restore Security Hardening
- **Permanent Lock Identifiers**: Replaced ephemeral browser tab IDs with persistent unique lock identifiers, ensuring restored session tabs cannot unlock without full password or biometric verification.

---

## 📊 Project Maturity & Store Availability

Locksy is an established, actively maintained privacy extension available across all major browser marketplaces:

- **Chrome Web Store**: Fully certified and compliant with Google Manifest V3 standards.
- **Microsoft Edge Add-ons**: Verified and distributed via the Edge Add-ons catalog.
- **Mozilla Firefox Add-ons (AMO)**: Signed and available for Desktop and Android.
- **Development Status**: Actively Maintained (Regular security releases, automated test suites, and strict dependency pinning).

---

## 🧪 Security Verification Checklist for Users

| Verification Step | How to Verify | Expected Result |
| :--- | :--- | :--- |
| **No Outbound Traffic** | Inspect DevTools Network Tab during tab locks/unlocks | Zero network requests sent |
| **Offline Reliability** | Disconnect internet / enable Airplane Mode | All locking & biometric features work normally |
| **No Plaintext Passwords** | Check `chrome.storage.local` in Application tab | Only PBKDF2 salted hash strings present |
| **No Telemetry** | Inspect storage and network requests | Zero tracking IDs, analytics, or pingbacks |
| **Content Isolation** | Inspect storage keys | Zero webpage URLs, cookies, or DOM content stored |

---

## 📞 Security Contact & Responsible Disclosure

We welcome responsible security research and vulnerability reports.

- 🔒 **Private Security Email**: `vanshsethi.me@gmail.com`
- 🐛 **Public Bug Tracker**: [GitHub Issues](https://github.com/vansh-121/Locksy/issues) *(please report non-sensitive bugs here)*
- ⏱️ **Response SLA**: We aim to acknowledge and triage security disclosures within 48 hours.

---

*Last updated: September 15, 2026*
