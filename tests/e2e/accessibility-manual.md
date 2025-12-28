# Manual Accessibility Testing Checklist

**Feature**: 001-user-config - User Story 5 (Accessibility Compliance)
**Last Updated**: 2025-12-27
**WCAG Level**: 2.1 Level AA

## Purpose

This checklist provides manual testing procedures for accessibility features that cannot be fully validated through automated testing. Use this in conjunction with the automated accessibility test suite (`accessibility.spec.js`).

---

## Testing Tools

### Required
- **Keyboard only** (no mouse)
- **Screen reader**: NVDA (Windows), JAWS (Windows), or VoiceOver (macOS)
- **Browser**: Chrome, Firefox, Safari, or Edge

### Optional
- **Color contrast analyzer**: Browser DevTools or online tool
- **High contrast mode**: Windows High Contrast or browser extensions
- **Zoom**: Test at 200% zoom level

---

## 1. Keyboard Navigation (SC-007, FR-022)

### 1.1 Login Page

- [ ] Tab through all elements in logical order
- [ ] Email field receives focus first
- [ ] Password field receives focus second
- [ ] "Sign In" button receives focus third
- [ ] "Forgot Password" link is keyboard accessible
- [ ] "Sign Up" link is keyboard accessible
- [ ] All focused elements have visible focus indicators (2px outline, 2px offset)
- [ ] Enter key submits the form when focused on submit button
- [ ] Escape key closes any error dialogs

**Expected Tab Order**: Email → Password → Sign In Button → Forgot Password → Sign Up → (cycle)

### 1.2 Dashboard

- [ ] Tab key moves focus through all interactive elements
- [ ] Shift+Tab moves focus backward
- [ ] All navigation links are keyboard accessible
- [ ] Card buttons/links are keyboard accessible
- [ ] All focused elements have visible focus indicators
- [ ] Skip to main content link appears on first Tab press
- [ ] Skip link works correctly (jumps to main content)

**Expected Tab Order**: Skip Link → Logo → Navigation Items → Main Content → Footer

### 1.3 Settings View (FR-022)

- [ ] Tab through settings tabs (Profile, Preferences, Account, Data Export)
- [ ] Arrow keys navigate between tabs (left/right)
- [ ] Tab within active tab panel follows logical order
- [ ] All form fields are keyboard accessible
- [ ] Save buttons are keyboard accessible
- [ ] Cancel buttons are keyboard accessible
- [ ] Focus does not get trapped in any section
- [ ] Focus returns to triggering element after modal closes

**Expected Tab Order**: Tab Navigation → Form Fields (top to bottom) → Action Buttons

### 1.4 Profile Settings Tab

- [ ] Display name field is keyboard accessible
- [ ] Email field is keyboard accessible
- [ ] "Change Email" button is keyboard accessible
- [ ] "Change Password" button is keyboard accessible
- [ ] Save button is keyboard accessible
- [ ] All fields follow logical tab order
- [ ] Focus indicators are visible on all elements

**Expected Tab Order**: Display Name → Email → Change Email → Change Password → Save

### 1.5 Preferences Settings Tab

- [ ] Theme toggle is keyboard accessible
- [ ] Timezone dropdown is keyboard accessible
- [ ] Date format dropdown is keyboard accessible
- [ ] Save button is keyboard accessible
- [ ] Theme toggle works with Space or Enter key
- [ ] Dropdowns open with Enter or Space
- [ ] Dropdown options navigable with arrow keys

**Expected Tab Order**: Theme Toggle → Timezone → Date Format → Save

### 1.6 Tasks View

- [ ] All task items are keyboard accessible
- [ ] Enter key opens task details
- [ ] Space key toggles task completion
- [ ] Delete key (or designated shortcut) deletes task
- [ ] "New Task" button is keyboard accessible
- [ ] Filter/sort dropdowns are keyboard accessible
- [ ] Search field is keyboard accessible

### 1.7 Notes View (FR-026)

- [ ] All note items are keyboard accessible
- [ ] Arrow keys navigate between notes (up/down)
- [ ] Enter key opens note for editing
- [ ] "New Note" button is keyboard accessible
- [ ] Topic selector is keyboard accessible
- [ ] Search field is keyboard accessible
- [ ] Search results are announced (ARIA live region)

### 1.8 Scheduling View

- [ ] All timezone inputs are keyboard accessible
- [ ] Add participant button is keyboard accessible
- [ ] Time picker is keyboard accessible
- [ ] Calendar navigation uses arrow keys
- [ ] Submit button is keyboard accessible

---

## 2. Screen Reader Testing (FR-020, FR-025)

### 2.1 Page Structure

- [ ] Page title is announced when navigating to new page
- [ ] Headings are properly announced (h1, h2, h3)
- [ ] Landmarks are announced (main, nav, aside, footer)
- [ ] Lists are announced with item count
- [ ] Links are announced with purpose/destination

### 2.2 Forms (FR-020)

- [ ] All form fields have labels that are announced
- [ ] Required fields are announced as required
- [ ] Error messages are announced immediately
- [ ] Success messages are announced
- [ ] Field instructions/help text is announced
- [ ] Validation errors associate with correct fields

**Test Each Form Field**:
- Display name: "Display name, edit text"
- Email: "Email address, edit text, required"
- Password: "Password, protected edit text, required"
- Theme toggle: "Theme, toggle button, pressed" or "not pressed"

### 2.3 Interactive Elements

- [ ] Buttons announce their purpose
- [ ] Links announce link text and destination
- [ ] Checkboxes announce label and checked state
- [ ] Radio buttons announce label and selected state
- [ ] Dropdowns announce current selection
- [ ] Toggles announce on/off state

### 2.4 Dynamic Content (FR-025)

- [ ] Search results are announced when they update (ARIA live region)
- [ ] Toast/notification messages are announced
- [ ] Loading states are announced
- [ ] Error dialogs are announced and focus is moved
- [ ] Success confirmations are announced

### 2.5 Navigation

- [ ] Main navigation is announced as navigation landmark
- [ ] Number of navigation items is announced
- [ ] Current page/tab is announced as "current"
- [ ] Breadcrumbs are navigable and announced

---

## 3. Visual Focus Indicators (FR-023)

### 3.1 Focus Visibility

- [ ] All interactive elements have visible focus indicators
- [ ] Focus indicator has 2px solid outline
- [ ] Focus indicator has 2px offset from element
- [ ] Focus indicator is visible in light mode
- [ ] Focus indicator is visible in dark mode
- [ ] Focus indicator color contrasts with background (3:1 minimum)

**Test Elements**:
- Buttons
- Links
- Input fields
- Dropdowns
- Checkboxes
- Radio buttons
- Custom controls

### 3.2 Focus Order

- [ ] Focus order matches visual order
- [ ] Focus does not jump unexpectedly
- [ ] Focus does not skip elements
- [ ] Focus wraps appropriately at page boundaries
- [ ] Modal dialogs trap focus appropriately (FR-024)

---

## 4. Color Contrast (FR-027)

### 4.1 Light Mode

- [ ] Body text has 4.5:1 contrast ratio minimum
- [ ] Large text (18pt+) has 3:1 contrast ratio minimum
- [ ] Button text has 4.5:1 contrast ratio
- [ ] Link text has 4.5:1 contrast ratio
- [ ] Focus indicators have 3:1 contrast ratio

**Test with**:
- Chrome DevTools Accessibility panel
- WebAIM Contrast Checker
- Browser high contrast mode

### 4.2 Dark Mode (FR-027)

- [ ] Body text has 4.5:1 contrast ratio minimum
- [ ] Large text has 3:1 contrast ratio minimum
- [ ] Button text has 4.5:1 contrast ratio
- [ ] Link text has 4.5:1 contrast ratio
- [ ] Focus indicators have 3:1 contrast ratio
- [ ] All UI elements remain usable

---

## 5. Touch Targets (FR-028)

### 5.1 Mobile Device Testing (375px width)

- [ ] All buttons are at least 44x44 pixels
- [ ] All links are at least 44x44 pixels
- [ ] All form controls are at least 44x44 pixels
- [ ] Interactive elements have adequate spacing (8px minimum)
- [ ] Tap targets do not overlap

**Test on**:
- iPhone (Safari)
- Android (Chrome)
- Browser responsive mode

### 5.2 Tablet Device Testing (768px width)

- [ ] Touch targets remain adequately sized
- [ ] Layout adapts appropriately
- [ ] No horizontal scrolling required
- [ ] All features remain accessible

---

## 6. Focus Trap (FR-024)

### 6.1 Modal Dialogs

- [ ] Focus moves to modal when opened
- [ ] Tab key cycles through modal elements only
- [ ] Shift+Tab cycles backward through modal only
- [ ] Escape key closes modal
- [ ] Focus returns to triggering element when modal closes
- [ ] Background content is not accessible while modal is open

**Test Modals**:
- Confirmation dialogs
- Account deletion confirmation
- Password change dialog
- Error dialogs

### 6.2 Mobile Menu (FR-024)

- [ ] Focus moves to menu when opened
- [ ] Tab key stays within menu
- [ ] Menu button closes menu
- [ ] Escape key closes menu
- [ ] Focus returns to menu button when closed
- [ ] Background content is inert while menu is open

---

## 7. Autocomplete Attributes (FR-021)

### 7.1 Login Page

- [ ] Email field has `autocomplete="email"`
- [ ] Password field has `autocomplete="current-password"`

### 7.2 Sign Up Page

- [ ] Email field has `autocomplete="email"`
- [ ] Password field has `autocomplete="new-password"`
- [ ] Full name field has `autocomplete="name"`

### 7.3 Profile Settings

- [ ] Display name field has `autocomplete="name"`
- [ ] New email field has `autocomplete="email"`
- [ ] Current password field has `autocomplete="current-password"`
- [ ] New password field has `autocomplete="new-password"`

---

## 8. Zoom and Reflow

### 8.1 200% Zoom (WCAG 1.4.4)

- [ ] All content is visible at 200% zoom
- [ ] No horizontal scrolling required
- [ ] Text remains readable
- [ ] Buttons remain usable
- [ ] Forms remain usable
- [ ] Layout adapts appropriately

### 8.2 400% Zoom (WCAG 1.4.10)

- [ ] Content reflows to single column
- [ ] All functionality remains available
- [ ] No content is hidden or cut off
- [ ] Interactions remain possible

---

## 9. Screen Reader Specific Tests

### 9.1 NVDA (Windows)

- [ ] All tests in Section 2 pass with NVDA
- [ ] Tables are announced with row/column count
- [ ] Forms are properly structured
- [ ] Navigation landmarks work correctly

### 9.2 JAWS (Windows)

- [ ] All tests in Section 2 pass with JAWS
- [ ] Headings list (Insert+F6) shows page structure
- [ ] Links list (Insert+F7) shows all links
- [ ] Form controls are properly labeled

### 9.3 VoiceOver (macOS)

- [ ] All tests in Section 2 pass with VoiceOver
- [ ] Rotor navigation works for all element types
- [ ] Forms are navigable with VoiceOver
- [ ] Custom controls work with VoiceOver

---

## 10. High Contrast Mode

### 10.1 Windows High Contrast

- [ ] All text is visible
- [ ] All icons are visible
- [ ] Borders are visible
- [ ] Focus indicators are visible
- [ ] Custom colors are overridden appropriately

### 10.2 Browser High Contrast Extensions

- [ ] Application remains usable
- [ ] No content is hidden
- [ ] Interactions remain possible

---

## Severity Classification

### Critical (Must Fix Before Release)
- Keyboard trap (user cannot escape)
- Missing form labels
- Color contrast below 3:1
- No focus indicators
- Inaccessible critical functions

### High (Fix Soon)
- Color contrast between 3:1 and 4.5:1
- Illogical tab order
- Missing autocomplete attributes
- Touch targets below 40x40px

### Medium (Should Fix)
- Missing ARIA live regions
- Suboptimal keyboard shortcuts
- Touch targets between 40x40px and 44x44px

### Low (Nice to Have)
- Additional keyboard shortcuts
- Enhanced screen reader announcements
- Optimized focus flow

---

## Testing Sign-Off

**Tester**: ________________
**Date**: ________________
**Browser(s)**: ________________
**Screen Reader(s)**: ________________
**Assistive Technology**: ________________

**Critical Issues Found**: ____
**High Issues Found**: ____
**Medium Issues Found**: ____
**Low Issues Found**: ____

**Ready for Release**: [ ] Yes [ ] No

**Notes**:
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
