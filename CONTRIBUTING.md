# Contributing to Coordino

Thank you for your interest in contributing to Coordino! This guide will help you get started and ensure smooth collaboration.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing opinions and experiences

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (we use v22.12.0 - see `.nvmrc`)
- npm 9+
- A Supabase account and project
- Git

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/coordino.git
   cd coordino
   ```

2. **Use Correct Node Version**
   ```bash
   nvm use
   # or: nvm use 22.12.0
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `chore/task-description` - Maintenance tasks
- `docs/documentation-update` - Documentation only

### Creating a Branch

```bash
# Feature
git checkout -b feature/add-task-templates

# Bug fix
git checkout -b fix/task-deletion-error

# Chore
git checkout -b chore/update-dependencies
```

## 💻 Coding Standards

### JavaScript/Vue Style

We follow these conventions:

- **2 spaces** for indentation (enforced by `.editorconfig` and Prettier)
- **Single quotes** for strings
- **No semicolons** (Prettier config)
- **100 character** line length
- **Composition API** for Vue 3 components
- **Arrow functions** preferred over function declarations

### File Naming

- **Components**: PascalCase - `TaskCard.vue`, `NoteEditor.vue`
- **Utilities**: camelCase - `dateUtils.js`, `validation.js`
- **Stores**: camelCase - `taskStore.js`, `noteStore.js`
- **Views**: PascalCase - `TasksView.vue`, `DashboardView.vue`

### Component Structure

Order component sections as follows:

```vue
<script setup>
// 1. Imports
import { ref, computed } from 'vue'

// 2. Props
const props = defineProps({...})

// 3. Emits
const emit = defineEmits([...])

// 4. Reactive state
const loading = ref(false)

// 5. Computed properties
const filteredItems = computed(() => {...})

// 6. Methods
const handleSubmit = () => {...}

// 7. Lifecycle hooks
onMounted(() => {...})
</script>

<template>
  <!-- Component template -->
</template>

<style scoped>
/* Scoped styles (prefer Tailwind classes) */
</style>
```

### Best Practices

- **Prefer Composition API** over Options API
- **Use Tailwind classes** instead of custom CSS when possible
- **Extract reusable logic** into composables
- **Keep components small** (under 300 lines)
- **Use TypeScript JSDoc** comments for better IDE support
- **Avoid magic numbers** - use named constants

### Accessibility Requirements

- All interactive elements must be keyboard accessible
- Use semantic HTML elements
- Include ARIA labels for icon-only buttons
- Maintain WCAG 2.1 Level AA contrast ratios
- Test with keyboard navigation

## 📝 Commit Guidelines

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(tasks): add bulk delete functionality"

# Bug fix
git commit -m "fix(notes): resolve autosave race condition"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(scheduling): extract timezone utils to separate file"
```

### Commit Body (Optional but Recommended)

```
feat(tasks): add task templates feature

Users can now create and save task templates for recurring workflows.
Templates include title, description, status, and priority defaults.

Closes #123
```

## 🔀 Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   npm run test:unit
   npm run lint
   ```

2. **Update documentation** if needed
   - Update README.md for user-facing changes
   - Update docs/ for technical changes
   - Add JSDoc comments to new functions

3. **Add tests** for new features
   - Target: 80%+ code coverage
   - Include unit tests for utilities
   - Include component tests for Vue components

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub**
   - Use a clear, descriptive title
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes

3. **PR Title Format**
   ```
   feat(scope): brief description of change
   ```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Accessibility tested

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console errors
```

### Review Process

- At least one approval required
- All CI checks must pass
- No merge conflicts
- Up-to-date with main branch

## 🧪 Testing Requirements

### Running Tests

```bash
# Unit tests
npm run test:unit

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Linting
npm run lint
```

### Coverage Requirements

- **Minimum**: 80% code coverage
- **Utilities**: 100% coverage (they're easy to test!)
- **Components**: 80%+ coverage
- **Stores**: 80%+ coverage

### Writing Tests

```javascript
// Example unit test
import { describe, it, expect } from 'vitest'
import { formatDate } from '@/utils/date'

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2025')
  })
})
```

## 📚 Documentation

### When to Update Documentation

- New features added
- API changes
- Configuration changes
- New dependencies
- Breaking changes

### Documentation Locations

- **User docs**: `README.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Developer reference**: `docs/QUICK_REFERENCE.md`
- **API docs**: JSDoc comments in code
- **Deployment**: `docs/DEPLOYMENT.md`

### JSDoc Example

```javascript
/**
 * Calculates the equity score for a meeting time
 * @param {Date} meetingTime - The proposed meeting time
 * @param {Array<Object>} participants - Array of participant objects
 * @param {string} participants[].timezone - IANA timezone string
 * @returns {number} Equity score from 0-100
 */
export function calculateEquityScore(meetingTime, participants) {
  // Implementation
}
```

## 🐛 Reporting Bugs

### Before Reporting

1. Check if the bug is already reported
2. Try to reproduce on latest `main` branch
3. Check if it's a configuration issue

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 22.12.0]
```

## 💡 Feature Requests

Feature requests are welcome! Please:

1. Check if it's already requested
2. Describe the use case
3. Explain why it's valuable
4. Consider implementation complexity

## 🔒 Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainers directly
3. Include steps to reproduce
4. Wait for acknowledgment before disclosing

## 📞 Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: Search existing issues
- **Discussions**: GitHub Discussions (if enabled)

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

---

Thank you for contributing to Coordino! Your efforts help make this project better for everyone.
