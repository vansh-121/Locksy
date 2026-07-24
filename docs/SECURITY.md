# 🔐 Security & Trust Documentation

**Version:** 3.1.0  
**Last Updated:** July 24, 2026

---

## 🎯 Building Trust Through Transparency

This document addresses common security concerns and provides technical proof of Locksy's privacy and security claims.

---

## 🔍 Verify Our Offline-First Operations

### Why This Matters
When you install Locksy, you want to verify that the extension runs locally and does not transmit your private browsing data, passwords, or log files to external servers.

### How to Verify (5-Minute Audit)

#### 🚀 Network DevTools Audit
1. Open your browser's Developer Tools (`F12` or `Ctrl+Shift+I`).
2. Navigate to the **Network** tab.
3. Lock any tab, type a password, and unlock it.
4. Verify that **ZERO network requests** are sent (except for the secure Pro license key check to our Cloudflare Worker proxy if you choose to activate Pro).

#### 📡 Offline Verification
1. Fully disconnect your device from the internet (unplug ethernet or turn off Wi-Fi).
2. Lock a tab, try to enter a wrong password to trigger the webcam logger, and unlock it with your correct password or biometrics.
3. Confirm that all local operations — hashing, locking, timers, and webcam captures — operate 100% offline.

#### 🔎 Inspect Local Extension Files
You can view the exact source code files running in your browser:
1. Go to `chrome://extensions/` (or `edge://extensions/` / `about:debugging` in Firefox).
2. Enable **Developer Mode**.
3. Locate Locksy, click **Details**, and inspect the background scripts or popup views directly. You will see that the code runs entirely locally from your disk.

---

## 🌐 Why Does Locksy Need `<all_urls>` Permission?

### The Concern
When you install Locksy, Chrome/Firefox warn: **"Read and change all your data on all websites"**

This sounds scary! But here's the technical truth:

### The Technical Reality

**What Locksy Actually Does:**
- ✅ Replaces locked tab content with `locked.html` overlay
- ✅ Only runs code when YOU lock a tab
- ✅ Never reads page content, cookies, or form data
- ✅ Never modifies page behavior (except the lock screen)

**Why `<all_urls>` is Required:**
```json
// In manifest.json
"web_accessible_resources": [
  {
    "resources": ["src/html/locked.html", "src/css/locked.css"],
    "matches": ["<all_urls>"]
  }
]
```

When you lock a tab on `https://bank.com`, Locksy needs to:
1. Inject `locked.html` as an iframe overlay
2. Block access until password is entered
3. Work on ANY domain you choose to lock

**We Cannot Predict Which Sites You'll Lock**, so we need `<all_urls>`.

### Proof: Inspect the Code
You can audit the extension's code locally (see the [Security Audit Checklist](#-security-audit-checklist) below). In the extension package, you'll see:
- Only secure Polar license activation/validation calls via the local licensing manager module (no telemetry, tracking, or data harvesting)
- No data collection code
- No analytics or tracking
- Only tab management and crypto functions

---

## 🔒 Your Data Never Leaves Your Device

### Technical Proof

**1. Minimal, Opt-In Network Requests**
If you extract the extension package locally, you can search the codebase for network activity:
```bash
# Search for fetch calls inside the extracted extension folder
grep -r "fetch(" .
# Result: Only found in the local license manager (proxied through Locksy API worker)
```

**2. Chrome's Content Security Policy**
The extension's `manifest.json` enforces:
- No external script loading
- No inline scripts
- All code is local and auditable

**3. Offline-First Test**
Try it yourself:
1. Install Locksy
2. Set a master password
3. Lock a tab
4. **Disconnect from the internet completely**
5. Try to unlock the tab

**Result:** It works perfectly offline! Core features (tab locking, biometrics, intruder captures) are 100% local. If you purchase Locksy Pro, the licensing checks are verified via network, but a 7-day offline grace period is supported so you don't need persistent internet.

---

## � Biometric Authentication Security (WebAuthn / FIDO2)

### How Biometric Unlock Works

Locksy v2.3.0 introduces WebAuthn-based biometric unlock. Here's exactly what happens — and what doesn't:

**What Locksy Does:**
- ✅ Calls `navigator.credentials.create()` to register a PassKey credential with the device's platform authenticator (e.g., Windows Hello, Touch ID, Face ID)
- ✅ Stores only the returned **credential ID** (a random base64 string) in `chrome.storage.local`
- ✅ On unlock, calls `navigator.credentials.get()` with the stored credential ID to challenge the platform authenticator
- ✅ Verifies only that the OS returned a valid assertion — no biometric data is ever seen, handled, or stored by Locksy

**What Locksy Does NOT Do:**
- ❌ Never accesses, reads, or stores any raw biometric data (fingerprint image, face scan, etc.)
- ❌ Never transmits anything — WebAuthn is 100% local, no server involved
- ❌ Never bypasses the OS security chip; the authenticator lives entirely inside the OS/hardware

### Security Properties

| Property | Value |
|---|---|
| Standard | WebAuthn / FIDO2 (W3C spec) |
| Authenticator Type | Platform (TPM, Secure Enclave, etc.) |
| Biometric Data Stored by Locksy | **NONE** |
| Data Transmitted | **NONE** (100% local) |
| Stored Credential | Public-key credential ID only |
| Fallback | Master password always available |
| Opt-in | Yes — disabled by default |

### Technical Proof

If you extract the extension package locally, you can search the codebase for biometric handling and network requests:
```bash
# No biometric data handling inside local files:
grep -r "fingerprint\|biometricData\|rawBiometric" .
# Result: NONE

# No network requests in webauthn-utils.js:
grep -r "fetch\|XMLHttpRequest" js/webauthn-utils.js
# Result: NONE
```

The `webauthn-utils.js` module is entirely local and only interacts with the browser's built-in `navigator.credentials` API.

---

## �🔐 Password Security Deep Dive

### How Your Password is Protected

**Never Stored in Plain Text:**
```javascript
// From the extension's cryptographic helper module (crypto-utils.js)

// When you set a password:
const passwordHash = await sha256(password);
// Only this hash is stored, never the password itself

// When you unlock:
const enteredHash = await sha256(enteredPassword);
if (enteredHash === storedHash) {
  // Unlock tab
}
```

**PBKDF2 Key Derivation (600,000 iterations):**
- Used for tab-specific encryption
- Makes brute-force attacks computationally infeasible
- Industry-standard used by 1Password, Bitwarden, etc.

**Where is Data Stored?**
```javascript
// Uses Chrome's secure local storage API
chrome.storage.local.set({
  passwordHash: hash,  // SHA-256 hash only
  lockedTabs: [],      // Just tab IDs, no content
  sessionAuth: false   // Current auth state
});
```

**What is NOT stored:**
- ❌ Your actual password
- ❌ Page content from locked tabs
- ❌ URLs or browsing history
- ❌ Any personal information

---

## 📊 Version History & Project Maturity

### Why v2.0 for a New Project?

**Transparency:**
- **v1.0.0 - v1.5.0**: Initial development, limited release, bug fixes
- **v2.0.0**: Complete rewrite with:
  - PBKDF2 encryption upgrade (from basic SHA-256)
  - Manifest V3 migration
  - Enhanced security features
  - Professional codebase structure

**This is v2.0 because:**
- Major architecture changes justified a major version bump
- Followed semantic versioning (semver.org)
- Transparent history in [CHANGELOG.md](CHANGELOG.md)

### Project Timeline
- **First Commit**: [Check repository for accurate date]
- **Public Release**: v2.0.0 (2025)
- **Development Status**: Active
- **Store Listings**: Chrome, Edge, Firefox

---

## 🧪 Security Audit Checklist

### Independent Verification Steps

Anyone can verify Locksy's security by auditing the extension package:

- [ ] **Source Code Review**: Extract the extension locally and inspect the code (which is delivered unminified and fully readable)
- [ ] **Package Verification**: Unpack the installed extension from your browser's local extensions folder and verify the integrity of the files
- [ ] **Network Monitoring**: Use browser DevTools to confirm zero network requests
- [ ] **Offline Test**: Disconnect internet, verify extension works
- [ ] **Storage Inspection**: Check `chrome.storage.local` - only hashed data
- [ ] **Permissions Review**: Read [PRIVACY.md](PRIVACY.md) for detailed explanation
- [ ] **Code Search**: Grep for suspicious patterns (fetch, XMLHttpRequest, analytics) inside the extension files

### Community Security Review

**We Welcome Security Research!**

If you're a security researcher:
1. Review our code
2. Run security scans
3. Report vulnerabilities via GitHub Issues (responsibly)
4. Suggest improvements

**Hall of Fame**: We'll credit security researchers who help improve Locksy.

---

## 🤝 Building Community Trust

### Current Status
- ⚠️ **New project** - limited community validation
- ⚠️ **No formal security audit** - but code is fully clean and readable
- ✅ **Auditable** - clean and readable extension source package
- ✅ **No telemetry** - cannot phone home
- ✅ **Offline-first** - provably private

### How We're Building Trust

1. **Full Transparency**: Inspect clean source files directly inside your browser
2. **Build Verification**: Match and inspect files in your local extension folder
3. **Documentation**: Detailed security and privacy guides
4. **Responsive**: Quick bug fixes and security updates

### Future Goals
- [ ] Professional security audit (when resources allow)
- [ ] Bug bounty program
- [ ] More community contributors and reviewers
- [ ] Security badges and certifications
- [ ] Regular security updates

---

## 🚀 For Privacy-Conscious Users

### If You're Still Concerned

**Totally Valid!** Security is about trust, and trust takes time.

**Conservative Approach:**
1. ⏸️ Wait for community validation and reviews
2. 🔍 Star/watch the repo to follow security updates
3. 🧪 Review the code yourself by inspecting your local installation (it's not that complex!)
4. 🤝 Check back in 6-12 months for community consensus
5. 🧪 Inspect the local package files directly before enabling the extension

**We Understand:**
- New projects need to earn trust
- "Just trust me" isn't enough for security software
- Time and transparency build credibility

---

## 📞 Security Contact

**Found a security issue?**
- 🔒 **Private**: Email security@locksy.dev (if available)
- 🐛 **Public**: Open GitHub Issue (for non-critical bugs)
- 💬 **Questions**: GitHub Discussions

**Response Time**: We aim to respond to security issues within 48 hours.

---

## 📚 Additional Resources

- [Privacy Policy](PRIVACY.md)
- [Changelog](CHANGELOG.md)

---

## ✅ Summary: Trust Through Verification

**Locksy's Promise:**
- 🔓 Auditable = inspect files inside your browser
- 🏠 Offline-only = data stays local
- 🔐 Strong crypto = PBKDF2 encryption
- 📦 Verifiable = match files locally
- 📖 Transparent = detailed documentation

**Your Responsibility:**
- Don't just trust our words
- Review the locally installed code
- Monitor network activity
- Wait for community validation if needed

**Security is a journey, not a destination.** We're committed to earning your trust through transparency and time.

---

*Last updated: July 18, 2026*
