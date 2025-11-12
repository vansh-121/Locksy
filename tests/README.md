# Performance Testing Guide for Locksy Extension

This directory contains automated performance tests for the Locksy extension.

## Quick Start

### Prerequisites
```cmd
npm install puppeteer
```

### Run Performance Tests
```cmd
npm run test:performance
```

Or manually:
```cmd
node tests/performance-test.js
```

## What Gets Tested

### 1. Memory Usage 📊
- Tests extension memory footprint on 10 popular websites
- Measures JS heap usage
- Calculates average memory consumption

### 2. Page Load Performance ⚡
- Measures page load times with extension active
- Tests on multiple high-traffic sites
- Compares against baseline expectations

### 3. Back/Forward Cache (bfcache) Compatibility 🔄
- Verifies extension doesn't invalidate browser caching
- Critical for Chrome Web Store approval
- Tests navigation performance

### 4. System Resource Usage 💻
- Monitors CPU impact
- Counts DOM nodes and event listeners
- Tracks layout recalculations

### 5. Extension Impact 🔬
- Measures timing breakdown (DNS, TCP, DOM, etc.)
- Identifies performance bottlenecks
- Ensures minimal overhead

## Test Results

After running tests, you'll get:
- Console output with real-time results
- `performance-report.json` with detailed metrics
- Pass/Fail recommendation for Chrome Web Store submission

## Interpreting Results

### ✅ Good Performance
- Average memory < 50 MB: EXCELLENT
- Average memory < 100 MB: GOOD
- Average load time < 3000ms: EXCELLENT
- Average load time < 5000ms: GOOD
- Zero errors: EXCELLENT

### ⚠️ Needs Attention
- Memory > 100 MB
- Load time > 5000ms
- Multiple errors (>3)

## Manual Testing

You can also test manually:

1. Open Chrome with extension loaded
2. Press `F12` to open DevTools
3. Go to **Performance** tab
4. Click **Record** and navigate to test sites
5. Check **Memory** tab for heap snapshots
6. Use **Application > Back/forward cache** to verify bfcache

## Chrome DevTools Commands

Test bfcache manually in Console:
```javascript
// Navigate to a page, then run:
window.performance.getEntriesByType('navigation')[0].type
// Should return "navigate" on first load, "back_forward" when cached
```

## Continuous Testing

Add to your development workflow:
```cmd
# Before every release
npm run test:performance

# Check the output
# If all tests pass, you can confidently check the "Performance" box
```

## Common Issues

### Extension Not Loaded
- Ensure you're in the correct directory
- Verify manifest.json exists
- Check file paths in test script

### Tests Failing
- Check internet connection
- Some sites may be slow (timeout issues)
- Browser might need updating

### High Memory Usage
- Could be legitimate if testing heavy sites
- Check if overlay is being created efficiently
- Review content.js for optimization opportunities

## Next Steps

After running tests:
1. Review `performance-report.json`
2. Address any issues found
3. Re-run tests to verify improvements
4. Document results in Chrome Web Store submission

## Support

If you encounter issues:
1. Check Chrome/Puppeteer versions
2. Verify extension loads correctly
3. Review test logs for specific errors
