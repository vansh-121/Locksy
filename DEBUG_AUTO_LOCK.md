# 🐛 Auto-Lock Timer Debugging Guide

## Steps to Test 1-Minute Auto-Lock

### 1. Reload the Extension
1. Go to `chrome://extensions/`
2. Click the **Reload** button on Locksy
3. This ensures all new code with logging is active

### 2. Open Browser Console
1. Press `F12` or right-click → Inspect
2. Go to the **Console** tab
3. Keep this open to see debug messages

### 3. Set 1-Minute Timer
1. Click the Locksy extension icon
2. Scroll to **Auto-Lock Timer** section
3. Toggle **Enable Auto-Lock** ON
4. Type `1` in the custom duration box
5. Click **Set**

### 4. Check Console Messages
You should see:
```
[Auto-Lock] Settings updated - Enabled: true, Duration: 60000ms (1 min)
[Auto-Lock] Starting timer now
[Auto-Lock] Timer started. Will lock in 60 seconds
```

### 5. Test Scenarios

#### Test A: Complete Inactivity (Should Lock)
1. After setting 1-min timer
2. **Don't touch ANYTHING**:
   - No mouse movement
   - No keyboard
   - No tab switching
   - No clicking
3. Wait 60 seconds
4. **Expected**: All tabs should lock + notification

#### Test B: Activity Detection (Should NOT Lock)
1. Set 1-min timer
2. After 30 seconds, move your mouse
3. Console should show:
   ```
   [Activity Tracker] Reporting activity to background
   [Auto-Lock] Activity detected, resetting timer
   [Auto-Lock] Timer started. Will lock in 60 seconds
   ```
4. Wait another 60 seconds
5. **Expected**: Tabs should lock now

### 6. Common Issues & Solutions

#### Issue: Timer not starting
**Console shows**: Nothing after clicking "Set"

**Solution**:
- Reload extension
- Make sure Extension Status toggle is ON
- Make sure you have a password set

#### Issue: Activity keeps resetting timer
**Console shows**: `[Auto-Lock] Activity detected, resetting timer` every few seconds

**Possible causes**:
1. **Background process activity**: Some websites auto-refresh
2. **Extensions**: Other extensions might be triggering events
3. **System notifications**: Can trigger window focus events

**Solution**: Open a simple static page like `about:blank` for testing

#### Issue: Timer runs but doesn't lock
**Console shows**: `[Auto-Lock] Timer expired, locking all tabs`
**Then shows**: `[Auto-Lock] Skipping - no password or extension inactive`

**Solution**:
- Make sure you've set a master password
- Make sure Extension Status toggle is ON

### 7. Quick Test Commands

Open extension background console:
1. Go to `chrome://extensions/`
2. Click **service worker** under Locksy
3. In console, type:

```javascript
// Check current settings
chrome.storage.local.get(['autoLockEnabled', 'autoLockDuration'], (data) => {
  console.log('Auto-lock enabled:', data.autoLockEnabled);
  console.log('Duration (ms):', data.autoLockDuration);
  console.log('Duration (min):', data.autoLockDuration / 60000);
});

// Manually trigger auto-lock (testing only)
chrome.runtime.sendMessage({action: 'setAutoLock', enabled: true, duration: 60000});
```

### 8. Expected Console Output (Success)

**When you set timer:**
```
[Auto-Lock] Settings updated - Enabled: true, Duration: 60000ms (1 min)
[Auto-Lock] Starting timer now
[Auto-Lock] Timer started. Will lock in 60 seconds
```

**After 60 seconds of inactivity:**
```
[Auto-Lock] Timer expired, locking all tabs
🔒 Tab locked successfully (x tabs)
```

**If you move mouse during wait:**
```
[Activity Tracker] Reporting activity to background
[Auto-Lock] Activity detected, resetting timer
[Auto-Lock] Timer started. Will lock in 60 seconds
```

### 9. Disable Activity Tracker for Testing

If activity tracker is preventing locks during testing, temporarily disable it:

1. Go to `e:\Locksy Extension\manifest.json`
2. Comment out the content_scripts section:
```json
// "content_scripts": [
//   {
//     "matches": ["<all_urls>"],
//     "js": ["src/js/activity-tracker.js"],
//     "run_at": "document_idle",
//     "all_frames": false
//   }
// ],
```
3. Reload extension
4. Now ONLY browser-level events will reset timer

### 10. Re-enable for Normal Use

After testing, uncomment the content_scripts section and reload!

---

## What to Report

If still not working, please share:
1. Console output from background script
2. Console output from browser page
3. Extension Status (Active/Inactive)?
4. Password set? (Yes/No)
5. What browser? (Chrome/Edge/Firefox)
6. Any error messages in console?

---

## Known Working State

✅ Timer should start immediately when you click "Set"
✅ Console should show countdown duration
✅ Activity detection should log when triggered
✅ After timeout, all tabs lock
✅ Notification appears
