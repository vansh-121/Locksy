# 🔨 Building Locksy From Source

This guide explains how to build Locksy extension from source code to verify its integrity and trustworthiness.

---

## 🎯 Why Build From Source?

Building from source allows you to:
- ✅ **Verify Transparency**: Confirm the store version matches the source code
- ✅ **Audit Security**: Review every line of code before installing
- ✅ **Trust But Verify**: Don't just take our word - see for yourself!
- ✅ **Customize**: Make modifications if needed (following MIT license)

---

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js (or use `yarn` if preferred)
- **Git**: For cloning the repository ([Download](https://git-scm.com/))

### Check Your Installation
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
git --version   # Any recent version is fine
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/vansh-121/Locksy.git
cd Locksy
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- `archiver` - For creating `.zip` files
- `puppeteer` - For automated testing (optional)

### 3. Build the Extension
```bash
npm run build
```

**Output:**
```
✓ Created locksy-chrome.zip (xxxxx bytes)
✓ Created locksy-firefox.zip (xxxxx bytes)

✓ Build completed successfully!
```

### 4. Find Your Builds
Built files will be in the `dist/` folder:
```
dist/
  ├── locksy-chrome.zip   # For Chrome, Edge, Brave, Opera, etc.
  └── locksy-firefox.zip  # For Firefox
```

---

## 📦 What Gets Built?

The build process creates two versions:

### Chrome/Chromium Build (`locksy-chrome.zip`)
- Uses `manifest.json` (Manifest V3)
- Compatible with: Chrome, Edge, Brave, Opera, Vivaldi, and all Chromium-based browsers

### Firefox Build (`locksy-firefox.zip`)
- Uses `manifest.firefox.json` (Firefox-specific)
- Compatible with: Firefox and Firefox-based browsers

### Included Files
Both builds contain:
```
manifest.json         # Extension configuration
LICENSE              # MIT License
README.md            # Documentation
src/                 # Source code
  ├── js/           # JavaScript files
  ├── css/          # Stylesheets
  └── html/         # HTML pages
assets/             # Icons and images
```

---

## 🔍 Verify the Build

### Compare with Store Version

#### Chrome/Edge:
1. Install Locksy from the Chrome Web Store or Edge Add-ons
2. Go to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode"
4. Find Locksy, click "Details"
5. Click the folder icon to view installation directory
6. Compare files with your `dist/locksy-chrome.zip` contents

#### Firefox:
1. Install Locksy from Firefox Add-ons
2. Go to `about:debugging#/runtime/this-firefox`
3. Find Locksy, click "Inspect"
4. Use "Open Directory" to view installation files
5. Compare with your `dist/locksy-firefox.zip` contents

### Verify Checksums
```bash
# Generate SHA-256 checksums
cd dist
sha256sum locksy-chrome.zip locksy-firefox.zip

# Compare with GitHub Release checksums
```

---

## 🧪 Testing Your Build

### Load Unpacked Extension

#### Chrome/Edge/Brave:
1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the **extracted folder** from `dist/locksy-chrome.zip`
5. The extension should load successfully!

#### Firefox:
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to `dist/` and select `locksy-firefox.zip`
4. Or extract the zip and select `manifest.json`
5. The extension should load successfully!

### Test Basic Functionality
1. Set a master password
2. Lock a tab (e.g., `https://example.com`)
3. Try to unlock with correct password
4. Verify offline functionality (disconnect internet)
5. Check that no network requests are made (DevTools → Network tab)

---

## 🔧 Build Scripts Explained

### Available Commands

```bash
# Clean build directory
npm run clean

# Build extension (Chrome + Firefox)
npm run build

# Clean and build
npm run build:all

# Run performance tests
npm run test:performance
```

### Build Process Details

The `build.js` script:
1. Creates `dist/` directory
2. Packages source files with appropriate manifest
3. Creates `.zip` files for distribution
4. Reports file sizes and completion

**No minification or obfuscation!** What you see in `src/` is exactly what gets packaged.

---

## 🛡️ Security Best Practices

### Before Building
- ✅ Review the source code in `src/` directory
- ✅ Check `manifest.json` and `manifest.firefox.json` for permissions
- ✅ Read `docs/SECURITY.md` for security details
- ✅ Verify repository authenticity (official: `vansh-121/Locksy`)

### During Build
- ✅ Use official repository (not forks unless you trust them)
- ✅ Check for unexpected network activity during build
- ✅ Verify no additional files are added to `dist/`

### After Build
- ✅ Generate and save checksums of your builds
- ✅ Compare with official GitHub Release checksums
- ✅ Test in isolated browser profile first
- ✅ Monitor extension behavior with DevTools

---

## 🐛 Troubleshooting

### Build Fails: "Cannot find module 'archiver'"
**Solution:** Run `npm install` first

### Build Fails: "Permission denied"
**Solution:** Run as administrator/sudo, or check folder permissions

### Extension Won't Load: "Manifest file is missing or unreadable"
**Solution:** Make sure you're loading the **extracted folder**, not the `.zip` file (except in Firefox)

### Extension Won't Load: "Manifest version 3 is not supported"
**Solution:** Update your browser to the latest version (Chrome 88+, Edge 88+)

### "Dependencies have known vulnerabilities"
**Solution:** Run `npm audit fix` - development dependencies don't affect extension security

---

## 📚 Advanced Building

### Custom Builds

You can modify the build process by editing `build.js`:

```javascript
// Example: Add custom files
const rootFiles = ['LICENSE', 'README.md', 'CUSTOM_FILE.txt'];

// Example: Exclude directories
archive.directory('src/', 'src', (entry) => {
  return !entry.name.includes('tests');
});
```

### Source Code Modifications

If you modify the source code:
1. Make changes in `src/` directory
2. Test thoroughly
3. Rebuild with `npm run build`
4. Test the new build before using

**Remember:** Modified versions are forks - follow MIT license requirements!

---

## 🔗 Related Documentation

- **[Installation Guide](../README.md#-installation)** - Installing pre-built versions
- **[Security Documentation](SECURITY.md)** - Detailed security analysis
- **[Project Structure](PROJECT_STRUCTURE.md)** - Code architecture
- **[Privacy Policy](PRIVACY.md)** - Data handling details

---

## ❓ FAQ

**Q: Why do I need to build from source?**
A: You don't *need* to, but it's the best way to verify the extension's integrity and trustworthiness.

**Q: Is the store version different from the source code?**
A: No! The store versions are built from this exact source code using the same `npm run build` command.

**Q: Can I modify the extension?**
A: Yes! Locksy is MIT licensed. You can modify, distribute, and use commercially (see LICENSE).

**Q: How often should I rebuild?**
A: Only when a new version is released, or if you make modifications.

**Q: Are the builds reproducible?**
A: The builds are deterministic for code, but zip metadata (timestamps) may vary. File contents and checksums should match.

**Q: Can I automate this?**
A: Yes! Use CI/CD tools or the provided GitHub Actions workflow (`.github/workflows/release.yml`).

---

## 💬 Need Help?

- 🐛 [Report Build Issues](https://github.com/vansh-121/Locksy/issues)
- 📖 [Read Documentation](../README.md)
- 🔒 [Security Questions](SECURITY.md)

---

**🔨 Build with confidence, verify with certainty!**

*Last updated: May 10, 2026*
