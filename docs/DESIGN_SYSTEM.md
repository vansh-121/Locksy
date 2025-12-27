# 🎨 Locksy Extension - Design System

**Version:** 1.0.8  
**Last Updated:** December 7, 2025

---

## Color Palette

### Primary Colors
- **Purple Gradient:** `#667eea` → `#764ba2`
  - Used for: Primary actions, branding, authentication
  - Hex codes: `#667eea` (light purple), `#764ba2` (dark purple)

- **Green Gradient:** `#4CAF50` → `#45a049`
  - Used for: Success states, lock actions, positive feedback
  - Hex codes: `#4CAF50` (light green), `#45a049` (medium green), `#388e3c` (dark green)

- **Orange Gradient:** `#ff9800` → `#f57c00`
  - Used for: Warning states, important notices
  - Hex codes: `#ff9800` (light orange), `#f57c00` (medium orange), `#ef6c00` (dark orange)

- **Red Gradient:** `#f44336` → `#d32f2f`
  - Used for: Danger states, destructive actions, errors
  - Hex codes: `#f44336` (light red), `#d32f2f` (medium red), `#c62828` (dark red)

### Neutral Colors
- **White:** `#ffffff` - Backgrounds, text on dark backgrounds
- **Light Gray:** `#f8f9fa` → `#e9ecef` - Sections, disabled states
- **Medium Gray:** `#6c757d` - Placeholder text, secondary text
- **Dark Gray:** `#2c3e50` - Primary text, headings

---

## Button Styles

### Button Classes & Usage

#### `.btn-primary` (Purple Gradient)
**Color:** Purple gradient (`#667eea` → `#764ba2`)  
**Used For:**
- Set Password button (first time)
- Change Password button
- Authentication button
- Primary extension actions

**Example:**
```html
<button class="btn-primary">Set Password</button>
```

#### `.btn-success` (Green Gradient)
**Color:** Green gradient (`#4CAF50` → `#45a049`)  
**Used For:**
- Lock Current Tab button
- Success confirmations
- Positive actions

**Example:**
```html
<button class="btn-success">🔒 Lock Current Tab</button>
```

#### `.btn-warning` (Orange Gradient)
**Color:** Orange gradient (`#ff9800` → `#f57c00`)  
**Used For:**
- Warning messages
- Caution actions
- Important notices

**Example:**
```html
<button class="btn-warning">⚠️ Warning Action</button>
```

#### `.btn-danger` (Red Gradient)
**Color:** Red gradient (`#f44336` → `#d32f2f`)  
**Used For:**
- Destructive actions
- Delete/Remove operations
- Critical warnings

**Example:**
```html
<button class="btn-danger">🗑️ Delete</button>
```

#### `.btn-developer-toggle` (Purple Gradient)
**Color:** Purple gradient (`#667eea` → `#764ba2`)  
**Used For:**
- Developer info toggle
- Secondary navigation

**Example:**
```html
<button class="btn-developer-toggle">👨‍💻 Developer Info</button>
```

---

## Button States

### Hover State
- **Transform:** `translateY(-2px)` (lift effect)
- **Shadow:** Enhanced to `0 6px 20px rgba(0, 0, 0, 0.2)`
- **Filter:** `brightness(1.05)` (slight brightening)
- **Gradient:** Reverses direction for visual feedback

### Active/Pressed State
- **Transform:** `translateY(0)` (returns to normal position)
- **Transition:** Fast `0.1s ease` for immediate feedback

### Disabled State
- **Opacity:** `0.6` (60% transparency)
- **Cursor:** `not-allowed`
- **Transform:** None (no hover effects)

---

## Consistent Button Usage Guide

### Current Implementation (v1.0.4)

| Button | Class | Color | Purpose |
|--------|-------|-------|---------|
| **Set Password** | `btn-primary` | Purple | Initial password setup |
| **Change Password** | `btn-primary` | Purple | Modify existing password |
| **Authenticate** | `btn-primary` | Purple | Login/verify identity |
| **Lock Current Tab** | `btn-success` | Green | Primary lock action |
| **Developer Info** | `btn-developer-toggle` | Purple | Toggle developer section |

### Future Additions (if needed)

| Button Type | Suggested Class | Color | Use Case |
|-------------|----------------|-------|----------|
| Unlock All Tabs | `btn-warning` | Orange | Bulk unlock operation |
| Reset Extension | `btn-danger` | Red | Clear all data |
| Export Settings | `btn-primary` | Purple | Save configuration |
| Import Settings | `btn-primary` | Purple | Load configuration |

---

## Status Indicators

### Active Status
- **Background:** Green gradient (`#d4edda` → `#c3e6cb`)
- **Text:** Dark green `#155724`
- **Border:** `#c3e6cb`
- **Animation:** Pulsing green glow effect

### Inactive Status
- **Background:** Red gradient (`#f8d7da` → `#f5c6cb`)
- **Text:** Dark red `#721c24`
- **Border:** `#f5c6cb`
- **Animation:** None

---

## Typography

### Font Family
```css
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

### Font Sizes
- **Headings (h2):** `24px`, `700` weight
- **Subheadings (h3):** `18px`, `700` weight
- **Body Text:** `15px`, `400-500` weight
- **Button Text:** `15px`, `700` weight
- **Small Text:** `13px`, `500-600` weight
- **Micro Text:** `12px`, `500` weight

---

## Spacing & Layout

### Border Radius
- **Large elements:** `16px` (containers, sections)
- **Medium elements:** `12px` (buttons, inputs)
- **Small elements:** `8px` (badges, chips)
- **Tiny elements:** `6px` (icons)

### Padding
- **Containers:** `24px`
- **Sections:** `20px`
- **Buttons:** `14px 18px`
- **Inputs:** `14px 18px`

### Margins
- **Between sections:** `24px`
- **Between elements:** `10-12px`
- **Between related items:** `8px`

---

## Shadows

### Button Shadow
```css
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
```

### Button Shadow (Hover)
```css
box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
```

### Container Shadow
```css
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

### Input Shadow
```css
box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
```

---

## Animations

### Float Animation (Icon)
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}
```

### Glow Animation (Active Status)
```css
@keyframes glow-green {
  from { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
  to { box-shadow: 0 2px 12px rgba(76, 175, 80, 0.3); }
}
```

### Pulse Animation (Notifications)
```css
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

### Slide Down (Developer Info)
```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Accessibility

### Focus States
- **Border Color:** `#667eea` (primary purple)
- **Shadow:** `0 0 0 3px rgba(102, 126, 234, 0.1)`
- **Transform:** `translateY(-1px)` (slight lift)

### Contrast Ratios
- **White on Purple:** 4.5:1+ (WCAG AA compliant)
- **White on Green:** 4.5:1+ (WCAG AA compliant)
- **White on Orange:** 4.5:1+ (WCAG AA compliant)
- **White on Red:** 4.5:1+ (WCAG AA compliant)

---

## Consistency Checklist

When adding new UI elements, ensure:

- ✅ Buttons use defined class names (`.btn-primary`, `.btn-success`, etc.)
- ✅ Colors match the established gradient palette
- ✅ Hover effects include lift + shadow + brightness
- ✅ Disabled states have reduced opacity and no hover effects
- ✅ Spacing follows the 8px grid system (8, 12, 16, 20, 24)
- ✅ Border radius is consistent (6, 8, 12, or 16px)
- ✅ Typography uses defined font sizes and weights
- ✅ Shadows are subtle and consistent
- ✅ Animations are smooth (0.3s ease transitions)

---

## Design Principles

1. **Consistency:** All similar elements should look and behave the same way
2. **Clarity:** Button colors should match their semantic meaning
3. **Feedback:** Every interaction should have visual feedback
4. **Accessibility:** Meet WCAG AA standards minimum
5. **Modern:** Use gradients, shadows, and animations tastefully
6. **Professional:** Clean, polished, and production-ready appearance

---

**Last Updated:** November 7, 2025  
**Maintainer:** Locksy Development Team
