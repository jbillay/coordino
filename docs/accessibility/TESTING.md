# Accessibility Testing Guide

**Feature**: 001-user-config - User Story 5 (Accessibility Compliance)
**Requirement**: FR-027 - WCAG 2.1 Level AA Compliance
**Date**: 2025-12-27

## Overview

This guide explains how to run automated and manual accessibility tests to ensure Coordino meets WCAG 2.1 Level AA standards.

## Automated Testing with axe-core

### Running Accessibility Tests

```bash
# Run all accessibility tests
npm run test:a11y

# Run with interactive UI (recommended for debugging)
npm run test:a11y:ui

# Run specific test file with Playwright
npx playwright test tests/e2e/accessibility.spec.js

# Run with headed browser to see what's happening
npx playwright test tests/e2e/accessibility.spec.js --headed

# Run and generate HTML report
npm run test:a11y && npx playwright show-report
```

### Test Coverage

The automated test suite (`tests/e2e/accessibility.spec.js`) scans all major views:

1. **Login Page** - Authentication form accessibility
2. **Dashboard** - Main dashboard with stats and widgets
3. **Tasks Page** - Task list, filters, and actions
4. **Notes Page** - Notes list, search, and organization
5. **Meetings Page** - Meeting scheduler and timezone grid
6. **Settings Page** - All settings tabs (Profile, Preferences, Account, Data Export)

Each test verifies:
- WCAG 2.1 Level A and AA compliance
- Proper ARIA attributes
- Keyboard navigation
- Focus indicators
- Form labels and descriptions
- Color contrast (basic check)

### Understanding Test Results

#### Passing Tests

```
✓ Login page should have no accessibility violations (1.2s)
✓ Dashboard should have no accessibility violations (0.8s)
```

All views passed! No action needed.

#### Failed Tests with Violations

```
✗ Settings page should have no accessibility violations

  Violations found:

  1. button-name (Critical)
     Impact: Critical
     Description: Buttons must have discernible text
     Affected elements:
       - button.close-btn (line 265)
     Fix: Add aria-label="Close" or visible text
```

**How to Fix:**
1. Note the violation ID (e.g., `button-name`)
2. Check the impact level (Critical > Serious > Moderate > Minor)
3. Review affected elements and line numbers
4. Apply the suggested fix
5. Re-run tests to verify

## Manual Testing

Automated tests catch ~60% of accessibility issues. Manual testing is essential.

See `tests/e2e/accessibility-manual.md` for detailed manual testing procedures covering:

- **Keyboard Navigation** - Tab order, focus management, shortcuts
- **Screen Reader Testing** - NVDA (Windows), JAWS (Windows), VoiceOver (Mac)
- **Focus Indicators** - Visual feedback for keyboard users
- **Color Contrast** - WCAG AA compliance (verified in `color-contrast-verification.md`)
- **Touch Targets** - Minimum 44x44px on mobile
- **Form Accessibility** - Labels, errors, autocomplete

## Common Violations and Fixes

### 1. Missing Form Labels

**Violation:** `label` (Critical)
**Problem:** Form inputs lack associated labels

```vue
<!-- ❌ Bad -->
<InputText v-model="email" placeholder="Email" />

<!-- ✅ Good -->
<label for="email-input">Email Address</label>
<InputText id="email-input" v-model="email" placeholder="Email" />

<!-- ✅ Also Good (with aria-label) -->
<InputText v-model="email" aria-label="Email address" placeholder="Email" />
```

### 2. Missing Button Text

**Violation:** `button-name` (Critical)
**Problem:** Icon-only buttons without accessible names

```vue
<!-- ❌ Bad -->
<Button icon="pi pi-trash" @click="delete" />

<!-- ✅ Good -->
<Button icon="pi pi-trash" aria-label="Delete item" @click="delete" />
```

### 3. Insufficient Color Contrast

**Violation:** `color-contrast` (Serious)
**Problem:** Text doesn't meet 4.5:1 ratio for normal text or 3:1 for large text

```css
/* ❌ Bad - 3.2:1 ratio */
.text {
  color: #999999;
  background: #ffffff;
}

/* ✅ Good - 4.7:1 ratio */
.text {
  color: #767676;
  background: #ffffff;
}
```

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) to verify.

### 4. Empty Links

**Violation:** `link-name` (Critical)
**Problem:** Links without discernible text

```vue
<!-- ❌ Bad -->
<router-link to="/tasks">
  <i class="pi pi-check"></i>
</router-link>

<!-- ✅ Good -->
<router-link to="/tasks" aria-label="View tasks">
  <i class="pi pi-check"></i>
</router-link>
```

### 5. Missing Heading Hierarchy

**Violation:** `heading-order` (Moderate)
**Problem:** Skipping heading levels (h1 → h3)

```vue
<!-- ❌ Bad -->
<h1>Dashboard</h1>
<h3>Tasks</h3> <!-- Skipped h2 -->

<!-- ✅ Good -->
<h1>Dashboard</h1>
<h2>Tasks</h2>
```

### 6. Non-Unique IDs

**Violation:** `duplicate-id` (Serious)
**Problem:** Multiple elements with the same ID

```vue
<!-- ❌ Bad -->
<template v-for="item in items">
  <label for="name">Name</label>
  <input id="name" /> <!-- Same ID repeated! -->
</template>

<!-- ✅ Good -->
<template v-for="(item, index) in items">
  <label :for="`name-${index}`">Name</label>
  <input :id="`name-${index}`" />
</template>
```

### 7. Missing ARIA Roles/Labels for Custom Components

**Violation:** `aria-roles` (Serious)
**Problem:** Interactive elements without proper roles

```vue
<!-- ❌ Bad -->
<div @click="openModal">Open</div>

<!-- ✅ Good -->
<button @click="openModal">Open</button>

<!-- ✅ Also Good (if div is necessary) -->
<div role="button" tabindex="0" @click="openModal" @keydown.enter="openModal">
  Open
</div>
```

### 8. Images Without Alt Text

**Violation:** `image-alt` (Critical)
**Problem:** Images missing alternative text

```vue
<!-- ❌ Bad -->
<img src="/logo.png" />

<!-- ✅ Good (informative image) -->
<img src="/logo.png" alt="Coordino - Task Management App" />

<!-- ✅ Good (decorative image) -->
<img src="/decoration.png" alt="" aria-hidden="true" />
```

## Continuous Integration

### Pre-Commit Hook

Accessibility tests run automatically on commit via Husky:

```json
// .husky/pre-commit
npm run test:a11y
```

If violations are found, the commit is blocked.

### GitHub Actions (Recommended)

Add to `.github/workflows/accessibility.yml`:

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:a11y
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: accessibility-report
          path: playwright-report/
```

## Browser Extensions for Manual Testing

### Recommended Tools

1. **axe DevTools** (Chrome, Firefox, Edge)
   - https://www.deque.com/axe/devtools/
   - Free browser extension
   - Real-time accessibility analysis

2. **WAVE** (Chrome, Firefox, Edge)
   - https://wave.webaim.org/extension/
   - Visual feedback
   - Highlights errors on the page

3. **Lighthouse** (Chrome DevTools)
   - Built into Chrome
   - Run: DevTools → Lighthouse → Accessibility
   - Scores 0-100, aim for 100

### Using axe DevTools

1. Open DevTools (F12)
2. Go to "axe DevTools" tab
3. Click "Scan ALL of my page"
4. Review violations by severity
5. Click violations for details and remediation guidance

## Regression Testing

After fixing violations:

```bash
# 1. Run automated tests
npm run test:a11y

# 2. Manual keyboard navigation test
# - Tab through all interactive elements
# - Verify focus indicators visible
# - Test Escape, Enter, Arrow keys

# 3. Screen reader test (quick check)
# - Turn on screen reader
# - Navigate one full workflow (e.g., create task)
# - Listen for all announcements

# 4. Mobile touch target test
# - Open in mobile viewport (DevTools)
# - Verify all buttons at least 44x44px
# - Test tap targets don't overlap
```

## Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Name Calculator](https://www.w3.org/TR/accname-1.1/)

### Screen Readers
- [NVDA Download](https://www.nvaccess.org/download/) (Windows, Free)
- [JAWS Free Trial](https://www.freedomscientific.com/downloads/jaws/) (Windows, 40-min sessions)
- VoiceOver (Mac/iOS, Built-in, Cmd+F5)

### Learning Resources
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Articles](https://webaim.org/articles/)

## Success Criteria

✅ **Phase 5 Complete When:**

1. All automated axe-core tests pass (0 violations)
2. Manual keyboard navigation works in all views
3. Screen reader announces all content correctly
4. Color contrast meets WCAG AA (verified in color-contrast-verification.md)
5. All touch targets ≥ 44x44px on mobile
6. Focus indicators visible and clear
7. No critical or serious violations in axe DevTools
8. Lighthouse accessibility score ≥ 95

## Troubleshooting

### Tests Timeout

```bash
# Increase timeout
npx playwright test tests/e2e/accessibility.spec.js --timeout=60000
```

### False Positives

Some violations may be false positives (e.g., third-party library code). Document these:

```js
// tests/e2e/accessibility.spec.js
await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .disableRules(['color-contrast']) // If contrast verified manually
  .analyze()
```

### PrimeVue Component Issues

PrimeVue components generally have good accessibility, but may need enhancements:

```vue
<!-- Use pass-through props to add ARIA attributes -->
<InputText
  :pt="{
    root: {
      'aria-label': 'Search notes',
      'aria-describedby': 'search-help'
    }
  }"
/>
```

---

**Last Updated**: 2025-12-27
**Maintained By**: Development Team
**Next Review**: After any major UI changes
