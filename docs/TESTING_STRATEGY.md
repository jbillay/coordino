# Testing Strategy - Coordino

> **Silicon Valley Best Practices**: Automated, iterative, and coverage-driven testing with continuous integration

## Table of Contents

1. [Overview](#overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Technology Stack](#technology-stack)
4. [Coverage Requirements](#coverage-requirements)
5. [Testing Layers](#testing-layers)
6. [CI/CD Integration](#cicd-integration)
7. [Pre-commit Hooks](#pre-commit-hooks)
8. [Best Practices](#best-practices)
9. [Running Tests](#running-tests)

---

## Overview

This testing strategy follows **industry best practices** from leading Silicon Valley startups, emphasizing:

- ✅ **Automated Everything**: Zero manual testing in CI/CD pipeline
- ✅ **Fast Feedback**: Tests run in < 30 seconds locally, < 2 minutes in CI
- ✅ **High Coverage**: Minimum 80% code coverage enforced
- ✅ **Shift Left**: Catch bugs before they reach production
- ✅ **Iterative Testing**: Every code change must pass all tests
- ✅ **Living Documentation**: Tests serve as executable specifications

### Key Principles

1. **Test Early, Test Often**: Every PR requires passing tests
2. **Fail Fast**: Broken tests block deployment
3. **Parallel Execution**: Tests run concurrently for speed
4. **Isolation**: Tests never depend on each other
5. **Deterministic**: Same input = same output, always

---

## Testing Pyramid

We follow the industry-standard testing pyramid with specific distribution:

```
        /\
       /  \  E2E Tests (5-10%)
      /----\
     /      \  Integration Tests (20-30%)
    /--------\
   /          \  Unit Tests (60-75%)
  /____________\
```

### Distribution Goals

- **Unit Tests**: 60-75% of total tests
  - Fast (< 10ms each)
  - Isolated (no network, no database)
  - Cover: Utilities, composables, store logic

- **Integration Tests**: 20-30% of total tests
  - Medium speed (< 100ms each)
  - Test component interactions
  - Cover: Component + store, API integrations

- **E2E Tests**: 5-10% of total tests
  - Slower (< 5s each)
  - Critical user journeys only
  - Cover: Login, create task, complete workflow

---

## Technology Stack

### Core Testing Tools

| Tool | Purpose | Why This Choice |
|------|---------|----------------|
| **Vitest** | Unit & Integration | 5-10x faster than Jest, native ESM, Vite integration |
| **@vue/test-utils** | Component Testing | Official Vue testing library |
| **Playwright** | E2E Testing | Cross-browser, auto-wait, industry standard |
| **@vitest/coverage-v8** | Coverage Reporting | Native V8 coverage, accurate |
| **Husky** | Git Hooks | Enforce quality gates before commit |
| **lint-staged** | Pre-commit Linting | Only check changed files |

### Testing Libraries

```json
{
  "vitest": "^1.0.0",
  "@vue/test-utils": "^2.4.0",
  "@playwright/test": "^1.40.0",
  "@vitest/coverage-v8": "^1.0.0",
  "@vitest/ui": "^1.0.0",
  "happy-dom": "^12.0.0"
}
```

---

## Coverage Requirements

### Minimum Thresholds (Enforced in CI)

```javascript
{
  branches: 80,    // 80% of branches covered
  functions: 80,   // 80% of functions tested
  lines: 80,       // 80% of lines executed
  statements: 80   // 80% of statements run
}
```

### Coverage Exemptions

Files excluded from coverage requirements:
- `main.js` (app entry point)
- `router/index.js` (route config)
- `*.config.js` (configuration files)
- `__tests__/**` (test files themselves)
- `**/*.d.ts` (TypeScript definitions - we use JSDoc)

### Coverage Reports

- **Format**: HTML + JSON + LCOV
- **Location**: `coverage/` directory
- **CI Integration**: Uploaded to Codecov/Coveralls
- **PR Comments**: Coverage diff on every PR

---

## Testing Layers

### 1. Unit Tests

**Location**: `src/**/__tests__/*.test.js`

**Scope**: Test individual functions, utilities, and store methods in isolation

**Example Structure**:
```
src/
├── utils/
│   ├── validation.js
│   └── __tests__/
│       └── validation.test.js
├── features/tasks/
│   ├── store.js
│   ├── utils.js
│   └── __tests__/
│       ├── store.test.js
│       └── utils.test.js
```

**What to Test**:
- ✅ Utility functions (validation, formatting, calculations)
- ✅ Store methods (CRUD, state mutations)
- ✅ Composables (pure logic extraction)
- ✅ Edge cases and error handling
- ✅ Business logic

**What NOT to Test**:
- ❌ External libraries (trust they're tested)
- ❌ Vue framework internals
- ❌ Trivial getters/setters

**Example**:
```javascript
// src/utils/__tests__/validation.test.js
import { describe, it, expect } from 'vitest'
import { isValidEmail } from '../validation'

describe('isValidEmail', () => {
  it('validates correct email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
  })

  it('rejects invalid email formats', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
  })

  it('handles edge cases', () => {
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('  user@example.com  ')).toBe(true) // trimmed
  })
})
```

### 2. Component Tests

**Location**: `src/components/**/__tests__/*.test.js`

**Scope**: Test Vue components with user interactions

**What to Test**:
- ✅ Component renders correctly
- ✅ Props affect rendering
- ✅ Events are emitted
- ✅ User interactions work
- ✅ Conditional rendering
- ✅ Form validation

**Mocking Strategy**:
- Mock Supabase client
- Mock router navigation
- Mock Pinia stores (or use real stores with test data)

**Example**:
```javascript
// src/components/common/__tests__/ConfirmDialog.test.js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('renders with correct severity icon', () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        message: 'Delete this item?',
        severity: 'danger'
      }
    })

    expect(wrapper.find('.pi-exclamation-triangle').exists()).toBe(true)
    expect(wrapper.text()).toContain('Delete this item?')
  })

  it('emits confirm event on confirm button click', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { visible: true, message: 'Confirm?' }
    })

    await wrapper.find('[aria-label*="Confirm"]').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })
})
```

### 3. Integration Tests

**Location**: `src/**/__tests__/integration/*.test.js`

**Scope**: Test multiple components/modules working together

**What to Test**:
- ✅ Component + Store interactions
- ✅ API call workflows (mocked)
- ✅ Navigation flows
- ✅ Form submission with validation

**Example**:
```javascript
// src/features/tasks/__tests__/integration/task-creation.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskDialog from '../../components/TaskDialog.vue'
import { useTaskStore } from '../../store'

describe('Task Creation Flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('creates task when form is valid and submitted', async () => {
    const store = useTaskStore()
    vi.spyOn(store, 'createTask').mockResolvedValue({ success: true })

    const wrapper = mount(TaskDialog, {
      props: { visible: true }
    })

    await wrapper.find('#task-title').setValue('New Task')
    await wrapper.find('#task-status').setValue('status-1')
    await wrapper.find('[aria-label*="Create"]').trigger('click')

    expect(store.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Task' })
    )
  })
})
```

### 4. E2E Tests

**Location**: `tests/e2e/*.spec.js`

**Scope**: Test complete user journeys in real browser

**Critical Paths to Test**:
1. **Authentication**: Sign up, login, logout
2. **Task Management**: Create → Edit → Complete → Delete
3. **Navigation**: Move between pages
4. **Error Handling**: Network errors, validation errors

**Example**:
```javascript
// tests/e2e/task-management.spec.js
import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('creates and completes a task', async ({ page }) => {
    // Navigate to tasks
    await page.click('a[href="/tasks"]')

    // Create task
    await page.click('button:has-text("New Task")')
    await page.fill('#task-title', 'Buy groceries')
    await page.selectOption('#task-status', { label: 'Open' })
    await page.click('button:has-text("Create Task")')

    // Verify task appears
    await expect(page.locator('text=Buy groceries')).toBeVisible()

    // Complete task
    await page.click('[aria-label="Mark as complete"]')

    // Verify completion
    await expect(page.locator('text=Completed')).toBeVisible()
  })
})
```

---

## CI/CD Integration

### GitHub Actions Pipeline

**File**: `.github/workflows/test.yml`

**Stages**:

```yaml
1. Install Dependencies (parallel)
   └─ npm ci --prefer-offline

2. Lint & Type Check (parallel)
   ├─ npm run lint
   └─ npm run type-check (if using TypeScript)

3. Unit & Integration Tests (parallel)
   └─ npm run test:unit -- --coverage

4. E2E Tests (parallel across browsers)
   ├─ Chromium
   ├─ Firefox
   └─ WebKit

5. Coverage Check
   └─ Enforce 80% threshold
   └─ Upload to Codecov

6. Build Verification
   └─ npm run build
```

**Performance Targets**:
- Total pipeline: < 5 minutes
- Unit tests: < 30 seconds
- E2E tests: < 2 minutes

### Quality Gates

PRs must pass:
- ✅ All tests pass (0 failures)
- ✅ Coverage ≥ 80%
- ✅ No linting errors
- ✅ Build succeeds

### Branch Protection Rules

```yaml
main branch:
  - Require PR reviews: 1
  - Require status checks: test, coverage, lint
  - Require branches to be up to date
  - No force push
  - No deletions
```

---

## Pre-commit Hooks

### Husky Configuration

**Prevent bad commits** with automated checks:

```bash
# .husky/pre-commit
npm run lint-staged
npm run test:changed
```

### Lint-Staged Rules

```json
{
  "*.{js,vue}": [
    "eslint --fix",
    "vitest related --run"
  ],
  "*.{json,md}": "prettier --write"
}
```

**What This Does**:
1. Runs ESLint on changed files
2. Runs tests related to changed files
3. Formats JSON and Markdown files
4. Blocks commit if any check fails

---

## Best Practices

### 1. Test Organization (AAA Pattern)

```javascript
test('creates task with valid data', async () => {
  // Arrange
  const store = useTaskStore()
  const taskData = { title: 'Test Task', status_id: 1 }

  // Act
  const result = await store.createTask(taskData)

  // Assert
  expect(result.success).toBe(true)
  expect(store.tasks).toHaveLength(1)
})
```

### 2. Test Naming Convention

```javascript
// ✅ GOOD: Describes behavior
test('returns error when email is invalid')
test('emits submit event when form is valid')

// ❌ BAD: Implementation details
test('calls validateEmail function')
test('sets error ref to true')
```

### 3. Mocking Strategy

**Mock External Dependencies, Not Internal Logic**:

```javascript
// ✅ GOOD: Mock Supabase
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: () => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ data: [], error: null }))
      }))
    }
  })
}))

// ❌ BAD: Mocking internal utility
vi.mock('../utils', () => ({ filterTasks: vi.fn() }))
```

### 4. Test Data Management

```javascript
// ✅ GOOD: Test fixtures
const createMockTask = (overrides = {}) => ({
  id: 1,
  title: 'Test Task',
  status_id: 1,
  priority: 'medium',
  created_at: '2024-01-01',
  ...overrides
})

// Use in tests
const task = createMockTask({ priority: 'high' })
```

### 5. Async Testing

```javascript
// ✅ GOOD: Use async/await
test('fetches tasks on mount', async () => {
  const wrapper = mount(TaskList)
  await wrapper.vm.$nextTick()
  expect(wrapper.find('.task-card').exists()).toBe(true)
})

// ❌ BAD: Promises without await
test('fetches tasks', () => {
  store.fetchTasks().then(() => {
    expect(store.tasks).toHaveLength(1)
  })
})
```

### 6. Snapshot Testing (Use Sparingly)

```javascript
// ✅ GOOD: Snapshot error messages
expect(errorMessage).toMatchInlineSnapshot('"Email is required"')

// ❌ BAD: Snapshot entire component
expect(wrapper.html()).toMatchSnapshot() // Too brittle
```

### 7. Test Isolation

```javascript
// ✅ GOOD: Each test is independent
describe('TaskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('creates task', () => { /* ... */ })
  test('deletes task', () => { /* ... */ })
})
```

---

## Running Tests

### Local Development

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- validation.test.js

# Run tests matching pattern
npm run test -- --grep "email validation"

# Run E2E tests
npm run test:e2e

# Run E2E in UI mode (for debugging)
npm run test:e2e:ui
```

### CI Environment

```bash
# Run all tests (unit + integration + E2E)
npm run test:ci

# This runs:
# 1. Unit tests with coverage
# 2. Integration tests
# 3. E2E tests in headless browsers
# 4. Coverage enforcement
```

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

### Debugging Tests

```javascript
// Add debugger statement
test('debugs this test', () => {
  debugger
  expect(true).toBe(true)
})

// Run with inspect
node --inspect-brk node_modules/.bin/vitest run

// Use Vitest UI (recommended)
npm run test:ui
```

---

## Test Coverage Dashboard

### What Gets Measured

- **Statements**: Individual code statements executed
- **Branches**: If/else paths taken
- **Functions**: Functions called
- **Lines**: Physical lines of code hit

### Coverage Visualization

```
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
All files               |   85.2  |   82.1   |   88.5  |   85.2  |
 utils/                 |   92.3  |   90.0   |   95.0  |   92.3  |
  validation.js         |   95.0  |   92.5   |  100.0  |   95.0  |
 features/tasks/        |   83.1  |   80.2   |   85.5  |   83.1  |
  store.js              |   88.5  |   85.0   |   90.0  |   88.5  |
  utils.js              |   77.8  |   75.5   |   80.0  |   77.8  |
```

### Improving Coverage

1. **Find uncovered code**: Check coverage/index.html
2. **Write tests for red lines**: Lines not executed
3. **Test edge cases**: Focus on branches
4. **Add error scenarios**: Often missed in happy path testing

---

## Continuous Improvement

### Monthly Test Metrics

Track and improve:
- Test execution time (target: decreasing)
- Coverage percentage (target: > 80%)
- Test flakiness (target: < 1%)
- Time to fix broken tests (target: < 1 hour)

### Quarterly Test Review

- Remove obsolete tests
- Refactor slow tests
- Update test data fixtures
- Review and update this strategy

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices by Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Google Testing Blog](https://testing.googleblog.com/)

---

## Quick Reference

```bash
# Setup
npm install                    # Install dependencies

# Development
npm run test:watch            # Watch mode
npm run test:ui               # Visual test runner

# CI/CD
npm run test:ci               # Full test suite
npm run test:coverage         # With coverage

# Debugging
npm run test:debug            # Debug mode
npm run test:e2e:ui           # E2E UI mode
```

---

**Last Updated**: November 2025
**Maintained By**: Development Team
**Review Cadence**: Quarterly
