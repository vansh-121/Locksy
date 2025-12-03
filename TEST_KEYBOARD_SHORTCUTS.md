# ⌨️ Keyboard Shortcuts - Testing Guide

## ✅ Features Implemented

### 1. **Four Keyboard Shortcuts**
- `Alt+Shift+9` - Lock current tab (default)
- `Alt+Shift+0` - Open Domain Lock Manager (default)
- `Alt+Shift+8` - Lock all tabs in window (default)

### 2. **Smart Handlers**
- Automatic validation (extension active, password set)
- Tab compatibility checks (skips system pages)
- Instant notifications for all actions
- Bulk operation support

### 3. **UI Integration**
- Keyboard shortcuts panel in popup
- Shows when password is set
- Beautiful kbd styling
- Auto-hides before setup

## 🧪 How to Test

### Test 1: Lock Current Tab (Alt+Shift+9)
1. Open any website (e.g., google.com)
2. Press `Alt+Shift+9`
3. **Expected**: 
   - Tab locks instantly
   - Notification: "Tab locked via keyboard shortcut!"
   - Tab favicon changes to lock icon
   - Badge shows "1"

### Test 2: Domain Lock Manager (Alt+Shift+0)
1. Ensure extension is active and password is set
2. Press `Alt+Shift+0`
3. **Expected**: Domain Lock Manager window opens

### Test 3: Lock All Tabs (Alt+Shift+8)
1. Open 3-4 different website tabs
2. Press `Alt+Shift+8`
3. **Expected**:
   - Notification shows count (e.g., "3 tabs locked successfully!")
   - All tabs lock simultaneously
   - Badge shows total count
   - System tabs are skipped with count

### Test 4: Error Handling
1. Deactivate extension using popup toggle
2. Press `Alt+Shift+9`
3. **Expected**: Error notification "Extension Inactive - Please activate first!"

### Test 5: System Page Skip
1. Navigate to `chrome://extensions`
2. Press `Alt+Shift+9`
3. **Expected**: Error notification "Cannot Lock Tab - System pages..."

### Test 6: UI Panel Display
1. Open popup before setting password
2. **Expected**: Keyboard shortcuts panel is hidden
3. Set password
4. **Expected**: Keyboard shortcuts panel appears with all shortcuts listed

### Test 7: Customization
1. Navigate to `chrome://extensions/shortcuts`
2. Find Locksy in the list
3. Click pencil icon next to any shortcut
4. Press new key combination (e.g., `Ctrl+Shift+P`)
5. Test new shortcut
6. **Expected**: Works with new keys

## 📋 Test Checklist

- [ ] Lock current tab shortcut works
- [ ] Domain manager shortcut works
- [ ] Lock all tabs shortcut works
- [ ] Notifications appear for all actions
- [ ] Error handling works (inactive extension)
- [ ] System pages are properly skipped
- [ ] Badge updates correctly
- [ ] Favicon changes on lock
- [ ] UI panel shows after password set
- [ ] UI panel hidden before password
- [ ] Shortcuts can be customized
- [ ] Mac shortcuts work (⌘ instead of Ctrl)

## 🎯 Expected Behaviors

### Success Cases
| Action | Notification | Badge | Favicon |
|--------|-------------|-------|---------|
| Lock tab | "Tab locked via keyboard shortcut!" | Increments | Changes to lock |
| Domain Manager | Opens window | - | - |
| Lock all (3 tabs) | "3 tabs locked successfully!" | Shows 3 | All change |

### Error Cases
| Condition | Notification |
|-----------|-------------|
| No password | "Password Required - Please set a master password first" |
| Extension inactive | "Extension Inactive - Please activate first!" |
| System page | "Cannot Lock Tab - System pages cannot be locked" |
| Already locked | "Already Locked - Tab is already locked" |

## 🐛 Known Limitations

1. Shortcuts may conflict with browser defaults
2. Some system pages override all shortcuts
3. Shortcuts don't work in PDF viewer (browser limitation)
4. Alt+Shift shortcuts work the same on both Windows and Mac

## ✨ Pro Tips

1. **Quick Lock Workflow**: Navigate → `Alt+Shift+9` → Done!
2. **Bulk Security**: Multiple tabs → `Alt+Shift+8` → All locked!
3. **Domain Management**: `Alt+Shift+0` to manage locked domains
4. **Customize**: Change shortcuts to your preference

## 📊 Feature Status

**Implementation**: ✅ 100% Complete
**Testing**: ⏳ Ready for testing
**Documentation**: ✅ Complete

All keyboard shortcuts are fully implemented and ready to use! 🎉
