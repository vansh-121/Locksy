# 🔐 Security & Trust Documentation

**Version:** 2.0.0  
**Last Updated:** January 5, 2026

---

## 🎯 Building Trust Through Transparency

This document addresses common security concerns and provides technical proof of Locksy's privacy and security claims.

---

## 🔍 Verify The Source Code Matches The Store Version

### Why This Matters
When you install from Chrome Web Store, Edge Add-ons, or Firefox Add-ons, you want to know that the installed extension matches this open-source code—not some modified version with hidden backdoors.

### How to Verify

#### Option 1: Compare with GitHub Releases (Easiest)
1. Go to [GitHub Releases](https://github.com/vansh-121/Locksy/releases)
2. Download the `.zip` file for your browser (e.g., `locksy-chrome.zip`)
3. Verify the SHA-256 checksum matches the one listed in the release
4. Extract and compare files with your installed extension

#### Option 2: Build From Source (Most Trustworthy)
```bash
# Clone the repository
git clone https://github.com/vansh-121/Locksy.git
cd Locksy

# Install dependencies
npm install

# Build the extension
npm run build

# Your builds will be in the dist/ folder
# Compare with the store version or releases
```

#### Option 3: Inspect Your Installed Extension
**Chrome/Edge:**
1. Go to `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Find Locksy, click "Details"
4. Click the folder icon next to "Inspect views"
5. Compare files with this repository

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Find Locksy, click "Inspect"
3. Compare files with this repository

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
Look at [src/js/background.js](../src/js/background.js) - you'll see:
- No `fetch()` or `XMLHttpRequest` calls (no network access)
- No data collection code
- No analytics or tracking
- Only tab management and crypto functions

---

## 🔒 Your Data Never Leaves Your Device

### Technical Proof

**1. No Network Requests**
Search the entire codebase for network activity:
```bash
# Search for any network-related code
grep -r "fetch(" src/
grep -r "XMLHttpRequest" src/
grep -r "axios" src/
grep -r "http://" src/ --exclude="*.html" --exclude="*.md"
grep -r "https://" src/ --exclude="*.html" --exclude="*.md"

# Result: NONE (except in HTML/documentation)
```

**2. Chrome's Content Security Policy**
Our [manifest.json](../manifest.json) enforces:
- No external script loading
- No inline scripts
- All code is local and auditable

**3. Offline Test**
Try it yourself:
1. Install Locksy
2. Set a master password
3. Lock a tab
4. **Disconnect from the internet completely**
5. Try to unlock the tab

**Result:** It works perfectly offline! Because all crypto and data is 100% local.

---

## 🔐 Password Security Deep Dive

### How Your Password is Protected

**Never Stored in Plain Text:**
```javascript
// From src/js/crypto-utils.js

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
- **Development Status**: Active, open-source
- **Store Listings**: Chrome, Edge, Firefox

---

## 🧪 Security Audit Checklist

### Independent Verification Steps

Anyone can verify Locksy's security:

- [ ] **Source Code Review**: All code is on GitHub, nothing hidden
- [ ] **Build Verification**: Build from source and compare with store version
- [ ] **Network Monitoring**: Use browser DevTools to confirm zero network requests
- [ ] **Offline Test**: Disconnect internet, verify extension works
- [ ] **Storage Inspection**: Check `chrome.storage.local` - only hashed data
- [ ] **Permissions Review**: Read [PRIVACY.md](PRIVACY.md) for detailed explanation
- [ ] **Code Search**: Grep for suspicious patterns (fetch, XMLHttpRequest, analytics)

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
- ⚠️ **No formal security audit** - but code is fully open
- ✅ **Open source** - transparent and auditable
- ✅ **No telemetry** - cannot phone home
- ✅ **Offline-first** - provably private

### How We're Building Trust

1. **Full Transparency**: Everything is open source
2. **Build Verification**: GitHub releases with checksums
3. **Documentation**: Detailed security and privacy docs
4. **Responsive**: Quick bug fixes and security updates
5. **Community**: Welcoming feedback and contributions

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
3. 🧪 Review the code yourself (it's not that complex!)
4. 🤝 Check back in 6-12 months for community consensus
5. 🏗️ Build from source instead of using store version

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
- [Source Code](https://github.com/vansh-121/Locksy)
- [Changelog](CHANGELOG.md)
- [Build Instructions](../README.md#building-from-source)

---

## ✅ Summary: Trust But Verify

**Locksy's Promise:**
- 🔓 Open source = fully auditable
- 🏠 Offline-only = data stays local
- 🔐 Strong crypto = industry-standard security
- 📦 Verifiable builds = no hidden code
- 📖 Transparent = detailed documentation

**Your Responsibility:**
- Don't just trust our words
- Review the code
- Build from source
- Monitor network activity
- Wait for community validation if needed

**Security is a journey, not a destination.** We're committed to earning your trust through transparency and time.

---

*Last updated: January 5, 2026*
