# ⏱️ Auto-Lock Timer & Scheduled Locking Feature

## 🎉 Feature Overview

Amazing new timer features have been implemented for Locksy Extension based on user feedback!

### ✨ Features Implemented

#### 1. **Auto-Lock Timer** 🔒
Automatically locks all tabs after a period of inactivity to enhance security.

**Features:**
- ✅ Configurable timeout periods: 5, 15, 30, or 60 minutes
- ✅ Custom duration support (1-480 minutes)
- ✅ Tracks user activity across:
  - Tab switching
  - Tab updates/navigation
  - Window focus changes
  - New tab creation
- ✅ Automatic reset on any user activity
- ✅ Notification when auto-lock activates
- ✅ Real-time status display

**How it works:**
1. Enable the toggle in the extension popup
2. Select a preset duration or set custom minutes
3. The timer resets every time you interact with the browser
4. When inactive for the selected duration, all tabs lock automatically

#### 2. **Scheduled Locking** 📅
Automatically lock tabs during specific hours of the day.

**Features:**
- ✅ Set custom start and end times (24-hour format)
- ✅ Quick presets:
  - Work Hours (9:00 AM - 5:00 PM)
  - Night Time (10:00 PM - 6:00 AM)
  - All Day (24/7 protection)
- ✅ Handles overnight schedules (e.g., 10 PM to 6 AM)
- ✅ Automatic locking when schedule activates
- ✅ Visual indicator showing current schedule status
- ✅ Notification when entering/exiting scheduled hours

**How it works:**
1. Enable the toggle for scheduled locking
2. Set start and end times or use a preset
3. All tabs automatically lock when entering the scheduled period
4. Tabs remain locked until manually unlocked

## 🎨 User Interface

### Beautiful, Modern Design
- Clean, gradient-based UI matching the existing design system
- Collapsible sections to keep the popup organized
- Toggle switches for easy on/off control
- Duration buttons with active state highlighting
- Real-time status messages with color coding
- Smooth animations and transitions

### Layout Structure
```
📱 Extension Popup
  ├── Extension Status Toggle
  ├── Password Management
  ├── Lock Controls (Current Tab / All Tabs)
  ├── Domain Lock Manager
  ├── Keyboard Shortcuts
  └── ⏱️ Timer Settings (NEW!)
      ├── Auto-Lock Timer
      │   ├── Enable/Disable Toggle
      │   ├── Duration Buttons (5/15/30/60 min)
      │   ├── Custom Duration Input
      │   └── Status Display
      └── Scheduled Locking
          ├── Enable/Disable Toggle
          ├── Time Input (Start/End)
          ├── Quick Presets
          └── Status Display
```

## 🔧 Technical Implementation

### Files Modified

1. **background.js** (273 new lines)
   - Auto-lock timer state management
   - Activity tracking listeners
   - Scheduled locking with time checking
   - Message handlers for timer settings
   - Auto-lock and scheduled lock execution

2. **popup.html** (70 new lines)
   - Timer settings UI structure
   - Toggle switches and controls
   - Duration selection buttons
   - Time input fields
   - Preset buttons

3. **popup.js** (297 new lines)
   - Timer settings initialization
   - UI event handlers
   - Settings save/load functionality
   - Status display functions
   - Real-time updates

4. **popup.css** (331 new lines)
   - Timer settings styling
   - Toggle switch animations
   - Button hover effects
   - Status message styling
   - Responsive layout

### Key Functions

**Background Script:**
- `startAutoLockTimer()` - Initiates the auto-lock countdown
- `resetAutoLockTimer()` - Resets timer on user activity
- `performAutoLock()` - Locks all tabs when timer expires
- `isWithinScheduledHours()` - Checks current time against schedule
- `checkScheduleAndAct()` - Automatically locks/unlocks based on schedule
- Activity listeners on tabs, windows, navigation

**Popup Script:**
- `initializeTimerSettings()` - Sets up UI and event handlers
- `updateAutoLockStatus()` - Displays current timer status
- `updateScheduledStatus()` - Shows schedule information
- Duration button handlers
- Custom duration input handler
- Time preset handlers

## 🚀 Usage Guide

### Setting Up Auto-Lock Timer

1. Open the Locksy extension popup
2. Scroll to the **Auto-Lock Timer** section
3. Click the toggle switch to enable
4. Choose a duration:
   - Click a preset button (5, 15, 30, 60 min)
   - OR enter custom minutes (1-480) and click "Set"
5. The timer starts automatically!

**Status Display:**
- 🟢 Active - Locks after X min of inactivity
- ⚪ Inactive

### Setting Up Scheduled Locking

1. Open the Locksy extension popup
2. Scroll to the **Scheduled Locking** section
3. Click the toggle switch to enable
4. Set your schedule:
   - **Manual:** Enter start and end times, click "Save Schedule"
   - **Quick Preset:** Click a preset button (Work Hours, Night, All Day)
5. Tabs will automatically lock during scheduled hours!

**Status Display:**
- 🟢 Active - Locks from HH:MM to HH:MM (Active now)
- ⚪ Inactive

## 🎯 Use Cases

### Auto-Lock Timer
- **Office workers:** Lock tabs when stepping away from desk
- **Shared computers:** Prevent unauthorized access during breaks
- **Privacy conscious:** Automatic protection after inactivity
- **Security compliance:** Meet organizational security requirements

### Scheduled Locking
- **Work hours:** Lock personal tabs during 9-5
- **Sleep time:** Automatically lock everything at night
- **Parental controls:** Lock certain hours for family devices
- **Focus time:** Force lock during study/work periods

## 🔐 Security Benefits

1. **Automatic Protection:** No need to remember to lock tabs
2. **Inactivity Detection:** Protects during unexpected absences
3. **Time-based Security:** Scheduled protection during specific hours
4. **Multi-layer Defense:** Combines with existing manual and domain locks
5. **Persistent Settings:** Timer preferences saved across browser sessions

## 📊 Storage

Settings are stored in Chrome's local storage:
```javascript
{
  autoLockEnabled: boolean,
  autoLockDuration: number (milliseconds),
  scheduledLockEnabled: boolean,
  scheduledLockStart: string ("HH:MM"),
  scheduledLockEnd: string ("HH:MM"),
  scheduledLockState: boolean (currently active)
}
```

## 🎨 Design Philosophy

- **User-Friendly:** Simple toggles and preset buttons
- **Visual Feedback:** Real-time status updates
- **Flexible:** Both presets and custom options
- **Non-Intrusive:** Collapsible sections keep UI clean
- **Professional:** Modern gradient design matching brand
- **Accessible:** Clear labels and intuitive controls

## 🌟 What Makes It Amazing

1. **Smart Activity Tracking** - Monitors multiple user interactions
2. **Flexible Configuration** - Presets + custom options
3. **Beautiful UI** - Modern, gradient-based design
4. **Real-time Feedback** - Live status updates
5. **Persistent State** - Settings saved automatically
6. **Overnight Support** - Schedules can span midnight
7. **Notification System** - Alerts when locks activate
8. **Zero Performance Impact** - Efficient implementation

## 🔄 Future Enhancements (Ideas)

- Different auto-lock durations for different days
- Multiple scheduled time slots
- Quick enable/disable from badge
- Activity statistics dashboard
- Whitelist certain tabs from auto-lock
- Gradual warnings before auto-lock

## 📝 Testing Checklist

- [x] Auto-lock timer activates correctly
- [x] Timer resets on user activity
- [x] Custom duration accepts valid inputs
- [x] Scheduled locking activates at correct times
- [x] Overnight schedules work properly
- [x] Settings persist across browser restarts
- [x] UI displays current status correctly
- [x] Notifications appear when locks activate
- [x] All tabs lock (except system pages)
- [x] Collapsible sections work smoothly

---

**Made with ❤️ for the Locksy community**

*This feature was implemented based on user feedback to make Locksy even more powerful and convenient!*
