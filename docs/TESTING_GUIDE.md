# Testing Guide for Coordino

## 📊 Current Testing Status

**Coverage:** 23.23% baseline
- ✅ All utility functions (validation, task utils)
- ✅ Store state management (tasks store)
- ✅ Critical composables (useValidation)
- ✅ 178 tests passing - 100% pass rate

**Philosophy:** Incremental testing - add tests as you build new features.

---

## 🎯 When to Write Tests

### ✅ ALWAYS Test:
1. **New utility functions** - Pure business logic
2. **New composables** - Reusable Vue logic
3. **Complex algorithms** - Calculations, sorting, filtering
4. **Validation logic** - Form validation rules
5. **Store actions** - State management logic

### ⚠️ CONSIDER Testing:
1. **New Vue components** - If they contain complex logic
2. **Views with business logic** - Not just presentational
3. **Critical user flows** - Login, checkout, data submission

### 🔄 CAN SKIP (Initially):
1. **Pure presentational components** - Just render props
2. **Simple views** - Mostly layout
3. **Third-party integrations** - Test at integration level

---

## 📝 Testing Patterns by Type

### 1. Testing Utility Functions

**Location:** `src/utils/__tests__/`

**Example:** Validation utilities
```javascript
import { describe, it, expect } from 'vitest'
import { isValidEmail, validatePassword } from '../validation'

describe('isValidEmail', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false)
  })

  it('handles edge cases', () => {
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('  user@example.com  ')).toBe(true) // trims
  })
})
```

**Key Points:**
- ✅ Test happy path
- ✅ Test error cases
- ✅ Test edge cases (null, empty, whitespace)
- ✅ Use descriptive test names
- ✅ One assertion per test when possible

---

### 2. Testing Composables

**Location:** `src/composables/__tests__/`

**Example:** useValidation
```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { useValidation } from '../useValidation'

describe('useValidation', () => {
  let validation

  beforeEach(() => {
    validation = useValidation()
  })

  it('validates field with rules', () => {
    const rules = [
      { validator: (v) => v.length > 0, message: 'Required' }
    ]

    const isValid = validation.validateField('email', 'test@example.com', rules)
    expect(isValid).toBe(true)
    expect(validation.errors.email).toBeUndefined()
  })

  it('sets error for invalid field', () => {
    const rules = [
      { validator: (v) => v.length > 5, message: 'Too short' }
    ]

    const isValid = validation.validateField('password', '123', rules)
    expect(isValid).toBe(false)
    expect(validation.errors.password).toBe('Too short')
  })
})
```

**Key Points:**
- ✅ Use `beforeEach` to create fresh instances
- ✅ Test reactive state changes
- ✅ Access computed properties with `.value`
- ✅ Test return values AND side effects

---

### 3. Testing Pinia Stores

**Location:** `src/features/*/store.test.js` or `src/stores/__tests__/`

**Example:** Tasks store
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../store'

// Mock dependencies
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: vi.fn(() => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], error: null }))
      }))
    }
  }))
}))

describe('useTaskStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTaskStore()
  })

  describe('Initial State', () => {
    it('initializes with empty tasks', () => {
      expect(store.tasks).toEqual([])
    })
  })

  describe('Computed Properties', () => {
    it('filters active tasks', () => {
      store.tasks = [
        { id: 1, completed_at: null },
        { id: 2, completed_at: '2024-01-01' }
      ]

      expect(store.activeTasks).toHaveLength(1)
      expect(store.activeTasks[0].id).toBe(1)
    })
  })
})
```

**Key Points:**
- ✅ Create fresh Pinia instance in `beforeEach`
- ✅ Mock Supabase for stores that use it
- ✅ Test initial state
- ✅ Test computed properties
- ✅ Test state mutations directly (CRUD operations are complex)

---

### 4. Testing Vue Components (When Needed)

**Location:** `src/components/**/__tests__/` or `src/features/**/components/__tests__/`

**Example:** TaskCard component
```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskCard from '../TaskCard.vue'

describe('TaskCard', () => {
  it('renders task title', () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: {
          id: 1,
          title: 'Test Task',
          description: 'Test Description'
        }
      }
    })

    expect(wrapper.text()).toContain('Test Task')
  })

  it('emits delete event when delete button clicked', async () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: { id: 1, title: 'Test' }
      }
    })

    await wrapper.find('[data-testid="delete-button"]').trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual([1])
  })
})
```

**Key Points:**
- ✅ Use `mount()` from @vue/test-utils
- ✅ Pass required props
- ✅ Use `data-testid` attributes for reliable selectors
- ✅ Test user interactions with `trigger()`
- ✅ Test emitted events with `wrapper.emitted()`

---

## 🔧 Common Mocking Patterns

### Mocking Supabase

```javascript
vi.mock('@/composables/useSupabase', () => ({
  useSupabase: vi.fn(() => ({
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn((resolve) => resolve({ data: [], error: null }))
      }))
    }
  }))
}))
```

### Mocking Vue Router

```javascript
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn()
}

const wrapper = mount(Component, {
  global: {
    mocks: {
      $router: mockRouter
    }
  }
})
```

### Mocking PrimeVue Components

```javascript
const wrapper = mount(Component, {
  global: {
    stubs: {
      'Button': true,
      'InputText': true,
      'Dialog': true
    }
  }
})
```

---

## ✅ Test Quality Checklist

Before committing tests, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Tests are isolated (don't depend on each other)
- [ ] Test names clearly describe what is being tested
- [ ] Both happy path AND error cases are tested
- [ ] Edge cases are covered (null, empty, boundary conditions)
- [ ] No console errors or warnings during test run
- [ ] Tests run fast (< 100ms per test ideally)
- [ ] Mocks are properly cleaned up between tests

---

## 🚀 Running Tests

```bash
# Run all tests (watch mode)
npm test

# Run tests once
npm run test:unit

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- validation.test.js

# Run tests for changed files only
npm run test:changed
```

---

## 📈 Coverage Goals

**Current Baseline:** 23%

**Target for New Features:**
- New utility files: 100% coverage
- New composables: 100% coverage
- New components: 80%+ coverage
- New views: 60%+ coverage

**Coverage Report:**
```bash
npm run test:coverage
open coverage/index.html
```

---

## 🎓 Testing Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Example Tests](./TESTING_README.md)

---

## 🤝 Getting Help

If you're unsure how to test something:

1. Check existing tests for similar patterns
2. Refer to this guide
3. Ask the team in Slack #testing channel
4. Consult the full [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)

**Remember:** Tests should give you confidence, not frustration. Start simple, add complexity as needed.

---

## 📝 Examples by Feature

### Example 1: Adding New Validation Rule

**File:** `src/utils/validation.js`
```javascript
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone?.trim())
}
```

**Test:** `src/utils/__tests__/validation.test.js`
```javascript
describe('isValidPhoneNumber', () => {
  it('accepts valid phone numbers', () => {
    expect(isValidPhoneNumber('+1234567890')).toBe(true)
    expect(isValidPhoneNumber('1234567890')).toBe(true)
  })

  it('rejects invalid phone numbers', () => {
    expect(isValidPhoneNumber('abc')).toBe(false)
    expect(isValidPhoneNumber('123')).toBe(false)
  })

  it('handles edge cases', () => {
    expect(isValidPhoneNumber(null)).toBe(false)
    expect(isValidPhoneNumber('')).toBe(false)
    expect(isValidPhoneNumber('  1234567890  ')).toBe(true)
  })
})
```

### Example 2: Adding New Task Utility

**File:** `src/features/tasks/utils.js`
```javascript
export const getTaskPriorityScore = (task) => {
  const priorityScores = { urgent: 4, high: 3, medium: 2, low: 1 }
  return priorityScores[task.priority] || 0
}
```

**Test:** `src/features/tasks/__tests__/utils.test.js`
```javascript
describe('getTaskPriorityScore', () => {
  it('returns correct scores for each priority', () => {
    expect(getTaskPriorityScore({ priority: 'urgent' })).toBe(4)
    expect(getTaskPriorityScore({ priority: 'high' })).toBe(3)
    expect(getTaskPriorityScore({ priority: 'medium' })).toBe(2)
    expect(getTaskPriorityScore({ priority: 'low' })).toBe(1)
  })

  it('returns 0 for invalid priority', () => {
    expect(getTaskPriorityScore({ priority: 'invalid' })).toBe(0)
    expect(getTaskPriorityScore({ priority: null })).toBe(0)
    expect(getTaskPriorityScore({})).toBe(0)
  })
})
```

---

## 🎯 Summary

**Golden Rule:** Write tests that give you confidence to refactor.

**Quick Start:**
1. Create test file next to your code (in `__tests__` folder)
2. Import `describe`, `it`, `expect` from vitest
3. Write tests following patterns in this guide
4. Run `npm test` to verify
5. Commit tests with your feature

**Test Pyramid:**
- Many unit tests (utils, composables) ← **Start here**
- Some component tests (Vue components)
- Few integration/E2E tests (critical user flows)

Happy testing! 🧪
