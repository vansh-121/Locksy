# ✅ Quick Verification Guide

**Don't trust, verify!** Here's how to confirm Locksy is safe in 5 minutes.

---

## 🚀 5-Minute Trust Verification

### ✅ Step 1: Verify No Network Activity (2 min)

1. Install Locksy in your browser
2. Open DevTools (F12)
3. Go to **Network** tab
4. Set a master password in Locksy
5. Lock a tab, unlock a tab
6. **Look at Network tab** → Should be **ZERO requests**

**Expected:** No network activity whatsoever.  
**If you see network requests:** Report as security issue!

---

### ✅ Step 2: Verify Offline Functionality (1 min)

1. **Disconnect from the internet completely**
   - Turn off WiFi
   - Or unplug ethernet cable
2. Lock a tab with Locksy
3. Try to unlock it
4. **Expected:** Works perfectly offline!

**This proves:** All data stays local. No cloud, no servers, no tracking.

---

### ✅ Step 3: Verify Source Code Match (2 min)

#### Option A: Quick Check
```bash
# Clone and compare file count
git clone https://github.com/vansh-121/Locksy.git
cd Locksy/src/js
ls -l  # Compare with your installed extension
```

#### Option B: SHA-256 Verification
1. Go to [GitHub Releases](https://github.com/vansh-121/Locksy/releases)
2. Download `checksums.txt`
3. Download `locksy-chrome.zip` or `locksy-firefox.zip`
4. Run: `sha256sum locksy-chrome.zip`
5. **Compare** with checksum in `checksums.txt`

**Expected:** Checksums match exactly.

---

## 🔍 Deep Verification (15 minutes)

Want to be extra thorough? Here's the comprehensive check:

### 1. Source Code Audit

```bash
# Search for network requests (should find NONE)
git clone https://github.com/vansh-121/Locksy.git
cd Locksy
grep -r "fetch(" src/
grep -r "XMLHttpRequest" src/
grep -r "axios" src/
grep -r "http://" src/ --exclude="*.html" --exclude="*.md"
grep -r "https://" src/ --exclude="*.html" --exclude="*.md"
```

**Expected:** Zero results (except in documentation/HTML files)

### 2. Build From Source

```bash
# Build it yourself
npm install
npm run build

# Compare with store version
# Your build is in dist/locksy-chrome.zip
```

### 3. Inspect Storage

```javascript
// In browser console on any page:
chrome.storage.local.get(null, (data) => {
  console.log(data);
});

// Or for Firefox:
browser.storage.local.get(null).then(console.log);
```

**Expected to see:**
- `passwordHash`: A long hex string (SHA-256 hash)
- `lockedTabs`: Array of tab IDs
- `pbkdf2Hash`: Another hash (if you've locked tabs)

**NOT expected:**
- ❌ Plain text passwords
- ❌ URLs or page content
- ❌ Personal information
- ❌ Tracking data

---

## 🛡️ Permission Check

### Why Does Locksy Need These?

| Permission | Why Needed | What We DON'T Do |
|------------|------------|------------------|
| `storage` | Save password hash locally | ❌ No cloud sync |
| `tabs` | Get tab IDs for locking | ❌ No URL tracking |
| `<all_urls>` | Inject lock screen overlay | ❌ No content reading |
| `activeTab` | Know which tab to lock | ❌ No history access |
| `webNavigation` | Maintain locks on navigation | ❌ No tracking |

**Verify:** Read [manifest.json](../manifest.json) - it's just 60 lines!

---

## 🧪 Red Flag Checklist

Run these tests. If ANY fail, don't trust Locksy:

- [ ] **Network Test**: Zero network requests in DevTools
- [ ] **Offline Test**: Works with internet disconnected
- [ ] **Source Match**: Code on GitHub matches installed version
- [ ] **No Obfuscation**: All JavaScript is readable
- [ ] **Storage Inspection**: No plain text passwords or personal data
- [ ] **Open Source**: Repository is public and accessible
- [ ] **Build Process**: Can build from source successfully
- [ ] **Manifest Check**: Permissions match documentation

**Current Status:** ✅ All tests pass (verify yourself!)

---

## 📊 What Good Looks Like

### ✅ Safe Extension Indicators
- All source code visible and readable
- No network requests in DevTools
- Works completely offline
- Minimal permissions with clear explanations
- Active development and documentation
- Can be built from source

### ❌ Suspicious Extension Indicators
- Obfuscated code
- Network requests to unknown servers
- Requires internet connection
- Excessive permissions without explanation
- Closed source or missing source
- Can't be built from source

**Locksy:** Passes all ✅ tests, fails all ❌ tests

---

## 🤝 Trust, But Verify

### Our Promise
We say Locksy is:
- 100% offline
- Open source
- No data collection
- Strong encryption

### Your Responsibility
**Don't believe us - verify it:**
1. Read the source code
2. Monitor network traffic
3. Test offline functionality
4. Build from source
5. Inspect storage

**Takes 5-15 minutes. Worth it for peace of mind!**

---

## 📚 Detailed Documentation

For deeper analysis:
- **[Full Security Analysis](SECURITY.md)** - Technical deep-dive
- **[Build Instructions](BUILD_GUIDE.md)** - Build from source
- **[Privacy Policy](PRIVACY.md)** - Data handling details
- **[Source Code](https://github.com/vansh-121/Locksy)** - Browse on GitHub

---

## ❓ FAQs

**Q: This seems like a lot of work. Can I just trust you?**
A: No! For security software, always verify. But it only takes 5 minutes for basic checks.

**Q: What if I find something suspicious?**
A: Report it immediately via [GitHub Issues](https://github.com/vansh-121/Locksy/issues). We'll investigate publicly.

**Q: Can I pay for a security audit?**
A: We'd love that! If you're a security professional, please [reach out](https://github.com/vansh-121/Locksy/issues).

**Q: Should I wait for community validation?**
A: That's a valid approach! Star the repo and check back in 6-12 months.

**Q: What if Locksy adds tracking later?**
A: Every release is tagged on GitHub. You can compare any version to verify no changes were sneaked in.

---

## 🎯 Quick Summary

**Fastest verification (2 minutes):**
1. Open DevTools Network tab
2. Use the extension
3. Confirm zero network requests

**Medium verification (5 minutes):**
1. Network test
2. Offline test  
3. Source code quick scan

**Full verification (15 minutes):**
1. All above
2. Build from source
3. Compare with installed version
4. Inspect storage

**Choose your level of paranoia!** All methods are valid.

---

**🔐 Security Through Transparency**

*Last updated: January 5, 2026*
