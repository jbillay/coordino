# Testing Quick Start Guide

> **TL;DR**: `npm test` runs tests. `npm run test:coverage` checks 80%+ coverage. `npm run test:e2e` runs E2E tests.

## 📋 Table of Contents
- [Quick Commands](#quick-commands)
- [First Time Setup](#first-time-setup)
- [Writing Tests](#writing-tests)
- [Pre-commit Hooks](#pre-commit-hooks)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Commands

```bash
# Run all unit tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:unit

# Run with coverage (enforces 80% minimum)
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Open E2E test UI (for debugging)
npm run test:e2e:ui

# Run tests for changed files only
npm run test:changed
```

---

## 🛠️ First Time Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- ✅ Vitest - Fast unit test runner
- ✅ Playwright - E2E test framework
- ✅ @vue/test-utils - Vue component testing
- ✅ Husky - Pre-commit hooks

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Run Initial Tests

```bash
# Run example tests
npm run test:unit

# Run E2E example
npm run test:e2e
```

---

## ✍️ Writing Tests

### Unit Test Example

Create: `src/utils/__tests__/myutil.test.js`

```javascript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../myutil'

describe('myFunction', () => {
  it('returns expected output', () => {
    expect(myFunction('input')).toBe('output')
  })
})
```

### Component Test Example

Create: `src/components/__tests__/MyComponent.test.js`

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    })

    expect(wrapper.text()).toContain('Test')
  })
})
```

### E2E Test Example

Create: `tests/e2e/myfeature.spec.js`

```javascript
import { test, expect } from '@playwright/test'

test('feature works correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Coordino/)
})
```

---

## 🎯 Coverage Requirements

Tests **must** achieve:
- ✅ 80% line coverage
- ✅ 80% branch coverage
- ✅ 80% function coverage
- ✅ 80% statement coverage

**Check coverage:**
```bash
npm run test:coverage
open coverage/index.html  # View detailed report
```

**Coverage will FAIL CI if below 80%**

---

## 🔒 Pre-commit Hooks

Husky runs automatically on `git commit`:

1. ✅ Runs tests related to changed files
2. ✅ Blocks commit if tests fail
3. ✅ Ensures broken code never reaches repository

**To skip (emergency only):**
```bash
git commit --no-verify -m "message"
```

---

## 🤖 CI/CD Pipeline

Every PR runs:
1. ✅ Unit & integration tests
2. ✅ E2E tests (3 browsers in parallel)
3. ✅ Coverage check (must be ≥80%)
4. ✅ Build verification

**PR cannot merge if any check fails**

View pipeline: `.github/workflows/test.yml`

---

## 🐛 Troubleshooting

### Tests are slow
```bash
# Run in parallel (default)
npm test

# Run specific file
npm test -- validation.test.js
```

### E2E tests fail locally
```bash
# Reinstall browsers
npx playwright install

# Run with UI to debug
npm run test:e2e:ui
```

### Coverage below 80%
```bash
# See what's not covered
npm run test:coverage
open coverage/index.html

# Add tests for red (uncovered) lines
```

### Pre-commit hook blocks commit
```bash
# Fix the failing tests
npm test

# Then commit again
git commit -m "message"
```

### Tests pass locally but fail in CI
```bash
# Run in CI mode locally
npm run test:ci

# Check for environment-specific issues
# (e.g., hardcoded dates, timezone differences)
```

---

## 📚 Documentation

Full strategy: [docs/TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md)

Topics covered:
- Testing pyramid
- Best practices
- Mocking strategies
- Component testing patterns
- E2E test patterns
- Coverage optimization

---

## 📊 Test Structure

```
coordino/
├── src/
│   ├── utils/
│   │   ├── validation.js
│   │   └── __tests__/
│   │       └── validation.test.js    ✅ Unit tests here
│   ├── features/
│   │   └── tasks/
│   │       ├── store.js
│   │       ├── utils.js
│   │       └── __tests__/
│   │           ├── store.test.js     ✅ Feature tests here
│   │           └── utils.test.js
│   └── components/
│       └── __tests__/
│           └── Component.test.js      ✅ Component tests here
├── tests/
│   └── e2e/
│       └── feature.spec.js            ✅ E2E tests here
├── vitest.config.js                   ⚙️ Unit test config
├── playwright.config.js               ⚙️ E2E test config
└── .github/workflows/test.yml         🤖 CI/CD pipeline
```

---

## 🎓 Learning Resources

- [Vitest Docs](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Checklist for New Features

When adding a feature:
- [ ] Write unit tests for utilities/logic
- [ ] Write component tests for Vue components
- [ ] Add E2E test for critical user paths
- [ ] Verify coverage is ≥80%
- [ ] Run `npm run test:coverage` before committing
- [ ] Ensure tests pass in CI

**Questions?** Check [docs/TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md)
