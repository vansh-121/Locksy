# 🎨 Timer Feature - Visual Design Showcase

## Color Palette

### Primary Colors
- **Purple Gradient**: `#667eea` → `#764ba2`
- **Green Success**: `#28a745` → `#20c997`
- **Background**: `rgba(255, 255, 255, 0.95)` with blur

### Status Colors
- 🟢 **Success/Active**: `#d4edda` → `#c3e6cb` (green gradient)
- 🔵 **Info/Default**: `#d1ecf1` → `#bee5eb` (blue gradient)
- 🔴 **Error/Warning**: `#f8d7da` → `#f5c6cb` (red gradient)
- ⚪ **Inactive**: `#f8f9fa` → `#e9ecef` (gray gradient)

## Component Designs

### Toggle Switch
```
Inactive:              Active:
┌─────────┐           ┌─────────┐
│ ○       │           │       ● │
└─────────┘           └─────────┘
 Gray #ccc             Green Gradient
```

**Animation**: Smooth slide (0.3s ease)
**Shadow**: Soft drop shadow on slider

### Duration Buttons
```
Inactive:                     Active:
┌──────────┐                 ┌──────────┐
│  5 min   │                 │  5 min   │
└──────────┘                 └──────────┘
White + Border              Purple Gradient
```

**Hover Effect**: 
- Lift up 2px
- Border color changes to purple
- Soft shadow appears

**Grid Layout**: 2x2 for 4 preset buttons

### Time Input
```
┌─────────────────┐
│  Start Time     │
│  ┌───────────┐  │
│  │  09:00  ▼ │  │
│  └───────────┘  │
└─────────────────┘
```

**Style**: 
- White background
- Purple border on focus
- Native time picker

### Status Messages
```
┌─────────────────────────────────────┐
│ 🟢 Active - Locks after 30 min     │
└─────────────────────────────────────┘
```

**Animation**: Slide in from top (0.3s)
**Auto-hide**: After 3 seconds
**Types**: Success, Error, Info

## Layout Structure

### Full Timer Settings View
```
╔════════════════════════════════════════╗
║  ⏱️ Auto-Lock Timer              [−]   ║
╠════════════════════════════════════════╣
║  ┌──────────────────────────────────┐ ║
║  │ Enable Auto-Lock        [ON] ●   │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
║  Automatically lock all tabs after     ║
║  period of inactivity                  ║
║                                        ║
║  Lock after inactivity:                ║
║  ┌────────┬────────┐                  ║
║  │ 5 min  │ 15 min │                  ║
║  ├────────┼────────┤                  ║
║  │ 30 min │ 60 min │                  ║
║  └────────┴────────┘                  ║
║                                        ║
║  Custom (minutes):                     ║
║  ┌──────────────┬────────┐            ║
║  │ [Enter min]  │  Set   │            ║
║  └──────────────┴────────┘            ║
║                                        ║
║  🟢 Active - Locks after 30 min       ║
╠════════════════════════════════════════╣
║  📅 Scheduled Locking            [−]   ║
╠════════════════════════════════════════╣
║  ┌──────────────────────────────────┐ ║
║  │ Enable Schedule         [ON] ●   │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
║  Automatically lock tabs during        ║
║  specific hours                        ║
║                                        ║
║  ┌───────────┐    ┌───────────┐      ║
║  │ Start Time│    │  End Time │      ║
║  │  ┌─────┐  │    │  ┌─────┐  │      ║
║  │  │09:00│  │    │  │17:00│  │      ║
║  │  └─────┘  │    │  └─────┘  │      ║
║  └───────────┘    └───────────┘      ║
║                                        ║
║  ┌──────────────────────────────────┐ ║
║  │      Save Schedule               │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
║  Quick Presets:                        ║
║  ┌──────────────────────────────────┐ ║
║  │ Work Hours (9-5)                 │ ║
║  ├──────────────────────────────────┤ ║
║  │ Night (10pm-6am)                 │ ║
║  ├──────────────────────────────────┤ ║
║  │ All Day                          │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
║  🟢 Active - Locks from 09:00         ║
║     to 17:00                           ║
╚════════════════════════════════════════╝
```

## Collapsed View
```
╔════════════════════════════════════════╗
║  ⏱️ Auto-Lock Timer              [+]   ║
╠════════════════════════════════════════╣
║  📅 Scheduled Locking            [+]   ║
╚════════════════════════════════════════╝
```

## Interactive States

### Button States

#### 1. Duration Button
```
Default:
┌─────────┐
│  5 min  │  ← White, border #e9ecef
└─────────┘

Hover:
┌─────────┐
│  5 min  │  ← Lifts 2px, purple border
└─────────┘

Active:
┌─────────┐
│  5 min  │  ← Purple gradient, white text
└─────────┘
```

#### 2. Preset Button
```
Default:
┌──────────────────┐
│ Work Hours (9-5) │  ← White, border
└──────────────────┘

Hover:
┌──────────────────┐
│ Work Hours (9-5) │  ← Slides right 4px
└──────────────────┘
```

#### 3. Set Button
```
Default:
┌──────┐
│ Set  │  ← Purple gradient
└──────┘

Hover:
┌──────┐
│ Set  │  ← Lifts 2px, stronger shadow
└──────┘
```

### Toggle Switch Animation
```
Frame 1 (OFF):          Frame 2:            Frame 3 (ON):
┌─────────┐            ┌─────────┐         ┌─────────┐
│ ○       │    →       │  ○      │   →     │       ● │
└─────────┘            └─────────┘         └─────────┘
Gray                   Transitioning       Green Gradient
```

**Duration**: 0.3 seconds
**Easing**: ease-in-out

## Spacing & Dimensions

### Sizes
- **Toggle Switch**: 50px × 26px
- **Toggle Slider**: 20px × 20px (circle)
- **Duration Button**: Auto width × 40px height
- **Time Input**: Full width × 40px height
- **Preset Button**: Full width × 40px height

### Spacing
- **Section Gap**: 16px
- **Element Gap**: 8px - 12px
- **Content Padding**: 16px
- **Button Gap**: 8px

### Border Radius
- **Container**: 12px
- **Buttons**: 8px
- **Toggle**: 13px (pill shape)
- **Inputs**: 8px

## Typography

### Font Family
```
'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
```

### Sizes
- **Section Headers**: 16px, bold (700)
- **Labels**: 13-14px, semi-bold (600)
- **Descriptions**: 12px, medium (500)
- **Buttons**: 13-14px, bold (700)
- **Status Messages**: 12px, semi-bold (600)

### Colors
- **Headers**: `#2c3e50` (dark blue-gray)
- **Labels**: `#2c3e50`
- **Descriptions**: `#6c757d` (medium gray)
- **Buttons**: `#2c3e50` or `white` (when active)

## Shadows

### Button Shadow
```css
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
```

### Hover Shadow
```css
box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
```

### Active Shadow
```css
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
```

### Container Shadow
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
```

## Animations

### 1. Slide In
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 2. Float (Icon)
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}
```

### 3. Glow (Active State)
```css
@keyframes glow-green {
  from { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
  to { box-shadow: 0 2px 12px rgba(76, 175, 80, 0.3); }
}
```

## Responsive Behavior

### Width Adaptation
- **Minimum**: 320px
- **Maximum**: 400px (popup constraint)
- **Flexible**: Grid layouts adapt

### Grid Breakdowns
```
Duration Buttons: 2×2 grid
Time Inputs: 1×2 grid (side by side)
Preset Buttons: 1×3 stack
```

## Accessibility

### Features
- ✅ Clear labels for all inputs
- ✅ High contrast text
- ✅ Focus indicators (purple border)
- ✅ Descriptive status messages
- ✅ Proper heading hierarchy
- ✅ Keyboard navigation support

### Focus States
```
Input Focus:
┌──────────────┐
│ [09:00]    ▼ │  ← Purple border + glow
└──────────────┘
box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
```

## Dark Mode Consideration
*Currently uses light theme to match existing design*

Future enhancement could include:
- Dark background variants
- Adjusted gradient colors
- Inverted text colors

## Design Philosophy

### Principles
1. **Consistency**: Matches existing Locksy design
2. **Clarity**: Clear visual hierarchy
3. **Feedback**: Every action has visual response
4. **Beauty**: Gradient-based modern aesthetic
5. **Simplicity**: Easy to understand at a glance

### User Experience Goals
- **Discoverable**: Features are obvious
- **Learnable**: Quick to understand
- **Efficient**: Minimal clicks to configure
- **Forgiving**: Can easily change settings
- **Satisfying**: Smooth animations delight

---

**Design System**: Consistent with Locksy v2.0+ aesthetic
**Implementation**: Pure CSS with minimal JavaScript
**Performance**: GPU-accelerated animations
**Browser Support**: All modern browsers

*This design makes complex functionality feel simple and elegant.*
