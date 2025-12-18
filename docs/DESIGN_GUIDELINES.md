# DESIGN_GUIDELINES.md - Design System and UI/UX Standards

## Design Philosophy

Coordino's design philosophy centers on creating an interface optimized for **quick, frequent interactions**. Users are busy knowledge workers who need to accomplish tasks efficiently without friction. The application should feel fast, responsive, and context-aware—remembering where users left off and minimizing clicks to complete common actions.

The visual language balances information density with breathability, professional polish with approachability, and power-user features with beginner-friendly simplicity. Every design decision prioritizes speed of execution over visual spectacle.

The design system respects accessibility as a first-class concern, not an afterthought. Every color choice considers contrast ratios, every interaction works with keyboard navigation, and every component provides appropriate feedback for screen readers. Beautiful design and accessible design are not competing goals but complementary ones.

## Core Design Principles

### 1. Speed Over Clicks
**Goal:** Enable users to complete common actions in 1-2 clicks/keystrokes, not 4-6.

- Provide multiple paths to common actions (FAB, keyboard shortcuts, command palette)
- Use context-aware defaults to reduce decision-making
- Show recently accessed items for quick resumption
- Never hide common actions behind multiple menus

### 2. Information Density
**Goal:** Show more useful information per screen without overwhelming users.

- Optimize vertical space (2x-3x more content per screen)
- Use progressive disclosure (hide details until needed)
- Show actions only on hover (reduce visual noise)
- Prioritize scannable layouts over decorative padding

### 3. Context Retention
**Goal:** Users never lose their place or forget what they were doing.

- Implement "Continue where you left off" sections
- Preserve state across sessions
- Use breadcrumbs and clear navigation
- Enable quick return to previous context

### 4. Consistent Brand Identity
**Goal:** Every interaction reinforces Coordino's visual identity.

- Use brand teal (#14b8a6) consistently throughout the app
- Maintain the same accent colors across all features
- Apply unified micro-interactions and animations
- Create memorable, distinctive visual elements

## Color System

Colors in Coordino serve three primary purposes: establishing brand identity, communicating meaning through semantic colors, and creating structure through neutral tones. The color system works harmoniously across both light and dark themes, maintaining consistent meaning and appropriate contrast in each mode.

### Brand Colors

**Primary Brand Color: Teal** - The primary brand color establishes Coordino's visual identity. This teal color (#14b8a6) appears in the most important interactive elements like primary buttons, active navigation items, FAB, and key calls to action. The color feels modern, energetic, and trustworthy—suggesting both productivity and calm focus.

```css
:root {
  /* Brand Identity - Teal Scale */
  --brand-teal-50: #f0fdfa;
  --brand-teal-100: #ccfbf1;
  --brand-teal-200: #99f6e4;
  --brand-teal-300: #5eead4;
  --brand-teal-400: #2dd4bf;
  --brand-teal-500: #14b8a6;  /* Base brand color */
  --brand-teal-600: #0d9488;
  --brand-teal-700: #0f766e;
  --brand-teal-800: #115e59;
  --brand-teal-900: #134e4a;

  /* Primary color points to brand teal */
  --color-primary: var(--brand-teal-500);
  --color-primary-dark: var(--brand-teal-600);
  --color-primary-light: var(--brand-teal-400);
}

.dark {
  /* In dark mode, use slightly lighter teal for better contrast */
  --color-primary: var(--brand-teal-400);
  --color-primary-dark: var(--brand-teal-500);
  --color-primary-light: var(--brand-teal-300);
}
```

**Accent Colors** - Purple and ocean blue provide visual interest and can be used sparingly for highlighting special features or creating visual breaks.

```css
:root {
  --brand-purple-400: #a78bfa;
  --brand-purple-500: #8b5cf6;
  --brand-purple-600: #7c3aed;

  --brand-ocean-400: #22d3ee;
  --brand-ocean-500: #0891b2;
  --brand-ocean-600: #0e7490;
}
```

### Semantic Colors

Semantic colors communicate status and meaning consistently throughout the application. These colors should be immediately recognizable and follow common conventions that users already understand from other applications.

```css
:root {
  /* Success - confirmations, completed tasks, positive states */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-500: #10b981;
  --color-success-600: #059669;
  --color-success-700: #047857;

  /* Warning - cautionary states, approaching deadlines */
  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-warning-600: #d97706;
  --color-warning-700: #b45309;

  /* Error - failures, destructive actions, overdue items */
  --color-error-50: #fef2f2;
  --color-error-100: #fee2e2;
  --color-error-500: #ef4444;
  --color-error-600: #dc2626;
  --color-error-700: #b91c1c;

  /* Info - neutral information, helpful tips */
  --color-info-50: #eff6ff;
  --color-info-100: #dbeafe;
  --color-info-500: #3b82f6;
  --color-info-600: #2563eb;
  --color-info-700: #1d4ed8;
}
```

When using semantic colors, always pair them with icons or text labels to ensure color-blind users can understand the meaning. Color should enhance communication, not be the sole channel of information.

### Neutral Colors - Airbnb-Inspired

Neutral colors create the structure and hierarchy of the interface. The light theme uses clean, crisp grays. The dark theme uses carefully calibrated warm grays that reduce eye strain.

```css
:root {
  /* Light Theme - Clean, crisp grays */
  --color-gray-50: #FAFAFA;
  --color-gray-100: #F5F5F5;
  --color-gray-200: #EEEEEE;
  --color-gray-300: #E0E0E0;
  --color-gray-400: #BDBDBD;
  --color-gray-500: #9E9E9E;
  --color-gray-600: #757575;
  --color-gray-700: #616161;
  --color-gray-800: #424242;
  --color-gray-900: #212121;
}

.dark {
  /* Dark Theme - Warm, comfortable grays */
  --color-gray-50: #18181b;
  --color-gray-100: #27272a;
  --color-gray-200: #3f3f46;
  --color-gray-300: #52525b;
  --color-gray-400: #71717a;
  --color-gray-500: #a1a1aa;
  --color-gray-600: #d4d4d8;
  --color-gray-700: #e4e4e7;
  --color-gray-800: #f4f4f5;
  --color-gray-900: #fafafa;
}
```

### Background and Surface Colors

**CRITICAL CHANGE:** Dark mode now uses Netflix-style backgrounds (#141414) instead of pure black (#000000). Pure black causes eye strain, OLED burn-in, and makes it impossible to perceive depth through elevation.

```css
:root {
  /* Light Theme - Airbnb-inspired */
  --bg-base: #FFFFFF;
  --bg-surface: #F7F7F7;
  --bg-elevated: #FFFFFF;
  --bg-interactive: #F0F9FF;    /* Light teal tint */
  --bg-hover: #E0F2FE;
}

.dark {
  /* Dark Theme - Netflix-inspired */
  --bg-base: #141414;           /* Netflix base - NOT pure black! */
  --bg-surface: #1f1f1f;        /* Cards, panels */
  --bg-elevated: #2a2a2a;       /* Modals, dropdowns */
  --bg-interactive: #303030;    /* Hover states */
  --bg-hover: #3a3a3a;
}
```

**Why #141414 instead of #000000?**
1. **Reduces eye strain** - Pure black creates excessive contrast with white text
2. **Prevents OLED burn-in** - Pixels need slight activity
3. **Enables depth perception** - Elevated surfaces can be lighter (#1f1f1f, #2a2a2a)
4. **Matches industry standards** - Netflix, YouTube, Spotify all use ~#141414
5. **Better color rendering** - Shadows and borders are actually visible

### Text Colors

Text colors maintain WCAG 2.1 AA contrast requirements while creating clear hierarchy.

```css
:root {
  /* Light Theme */
  --text-primary: #222222;      /* Main content, headings */
  --text-secondary: #717171;    /* Supporting text, descriptions */
  --text-tertiary: #B0B0B0;     /* De-emphasized text, timestamps */
  --text-inverse: #FFFFFF;      /* Text on dark backgrounds */
  --text-link: var(--brand-teal-600);  /* Interactive text */
}

.dark {
  /* Dark Theme */
  --text-primary: #FFFFFF;
  --text-secondary: #D1D5DB;    /* 92% opacity feel */
  --text-tertiary: #9CA3AF;     /* 60% opacity feel */
  --text-inverse: #141414;
  --text-link: var(--brand-teal-400);
}
```

### Border Colors

Borders in dark mode need higher contrast than the default to remain visible against #141414 backgrounds.

```css
:root {
  /* Light Theme */
  --border-subtle: #EBEBEB;
  --border-default: #D6D6D6;
  --border-strong: #B0B0B0;
}

.dark {
  /* Dark Theme - Higher contrast for visibility */
  --border-subtle: #2a2a2a;
  --border-default: #3a3a3a;    /* More visible than before */
  --border-strong: #4a4a4a;
}
```

## Typography

Typography establishes hierarchy, improves readability, and contributes significantly to the overall feel of the application. Coordino uses a type scale that creates clear distinction between different levels of content while maintaining harmonious relationships.

### Font Family

The application uses system fonts that provide excellent readability, load instantly, and feel native to each platform.

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Type Scale

**IMPORTANT:** Minimum body text size is now **16px (1rem)** for accessibility. Never use 14px for body content—only for metadata and secondary information.

```css
:root {
  --text-xs: 0.75rem;      /* 12px - Tiny labels, timestamps only */
  --text-sm: 0.875rem;     /* 14px - Metadata, captions, secondary info */
  --text-base: 1rem;       /* 16px - Body text minimum */
  --text-lg: 1.125rem;     /* 18px - Emphasized body text */
  --text-xl: 1.25rem;      /* 20px - Card titles, section headings */
  --text-2xl: 1.5rem;      /* 24px - Page titles */
  --text-3xl: 1.875rem;    /* 30px - Major headings */
  --text-4xl: 2.25rem;     /* 36px - Hero text */
}
```

### Font Weight

```css
:root {
  --font-normal: 400;      /* Body text, standard content */
  --font-medium: 500;      /* Emphasized text, labels */
  --font-semibold: 600;    /* Subheadings, important elements */
  --font-bold: 700;        /* Headings, strong emphasis */
}
```

### Line Height

```css
:root {
  --leading-tight: 1.25;   /* Headings, compact UI elements */
  --leading-normal: 1.5;   /* Body text, comfortable reading */
  --leading-relaxed: 1.75; /* Long-form content, maximum readability */
}
```

## Spacing System - Optimized for Information Density

**NEW APPROACH:** Coordino prioritizes information density for quick scanning. The spacing system has been recalibrated to show 2-3x more content per screen while maintaining readability.

```css
:root {
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: 0.125rem;   /* 2px */
  --space-1: 0.25rem;      /* 4px */
  --space-1-5: 0.375rem;   /* 6px */
  --space-2: 0.5rem;       /* 8px */
  --space-3: 0.75rem;      /* 12px */
  --space-4: 1rem;         /* 16px */
  --space-5: 1.25rem;      /* 20px */
  --space-6: 1.5rem;       /* 24px */
  --space-8: 2rem;         /* 32px */
  --space-10: 2.5rem;      /* 40px */
  --space-12: 3rem;        /* 48px */
}
```

### Component Spacing Patterns - UPDATED

**Task Lists (Compact):**
- Vertical padding per item: `0.625rem` (10px) - was 1.25rem
- Horizontal padding: `1rem` (16px)
- Border between items: `1px solid var(--border-subtle)`
- NO Card wrappers - direct list with hover states
- **Goal:** Show 8-10 tasks per screen vs. 3-4

**Dashboard Cards:**
- Internal padding: `1.5rem` (24px) - was 2rem
- Gap between cards: `1rem` (16px) - was 2rem
- Use subtle hover lift (4px translate)

**Forms:**
- Between fields: `1rem` (16px)
- Label to input: `0.5rem` (8px)
- Between sections: `1.5rem` (24px)

**Navigation:**
- Between nav items: `0.5rem` (8px)
- Nav item padding: `0.625rem 0.75rem`

## Quick Access Patterns

### Floating Action Button (FAB)

**Purpose:** Provide instant access to create actions without navigating menus. Inspired by Google's Material Design and mobile app patterns.

```vue
<!-- FAB Implementation -->
<div class="fab-container">
  <!-- Expandable menu -->
  <transition name="fab-expand">
    <div v-if="showFABMenu" class="fab-menu">
      <button class="fab-item" @click="createTask">
        <i class="pi pi-check-circle"></i>
        <span>New Task</span>
      </button>
      <button class="fab-item" @click="createNote">
        <i class="pi pi-file"></i>
        <span>New Note</span>
      </button>
      <button class="fab-item" @click="createMeeting">
        <i class="pi pi-users"></i>
        <span>New Meeting</span>
      </button>
    </div>
  </transition>

  <!-- Main FAB button -->
  <button
    class="fab-main"
    @click="toggleFABMenu"
    aria-label="Quick actions"
  >
    <i class="pi pi-plus"></i>
  </button>
</div>
```

**Styling:**
```css
.fab-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
}

.fab-main {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--brand-teal-500);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-main:hover {
  background: var(--brand-teal-600);
  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.4);
  transform: scale(1.05);
}
```

### Command Palette (⌘K / Ctrl+K)

**Purpose:** Power-user feature enabling keyboard-driven navigation and actions. Inspired by VS Code, Notion, Linear, and Spotlight.

**Features:**
- Fuzzy search across all actions and content
- Keyboard navigation (↑↓ arrows, Enter to select, Esc to close)
- Recently used actions at top
- Grouped by category (Actions, Navigation, Recent Items)

```vue
<!-- Command Palette -->
<div class="command-palette-overlay" v-if="showCommandPalette">
  <div class="command-palette">
    <div class="command-search">
      <i class="pi pi-search"></i>
      <input
        ref="commandInput"
        v-model="commandQuery"
        placeholder="Type a command or search..."
        @input="filterCommands"
        @keydown="handleCommandKeyboard"
      />
      <kbd>ESC</kbd>
    </div>

    <div class="command-results">
      <div class="command-section">
        <div class="command-section-title">Quick Actions</div>
        <div
          v-for="(action, index) in filteredActions"
          :key="action.id"
          class="command-item"
          :class="{ active: index === selectedIndex }"
          @click="executeCommand(action)"
        >
          <div class="command-icon">
            <i :class="action.icon"></i>
          </div>
          <div class="command-text">
            <div class="command-name">{{ action.name }}</div>
            <div class="command-desc">{{ action.description }}</div>
          </div>
          <div class="command-shortcut">
            <kbd v-for="key in action.keys" :key="key">{{ key }}</kbd>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Global Keyboard Shortcuts:**
- `⌘K` / `Ctrl+K` - Open command palette
- `⌘N` / `Ctrl+N` - New task (context-aware: note if in notes, meeting if in scheduling)
- `⌘F` / `Ctrl+F` - Focus search
- `G then D` - Go to Dashboard
- `G then T` - Go to Tasks
- `G then N` - Go to Notes
- `G then M` - Go to Meetings
- `?` - Show keyboard shortcuts help
- `Esc` - Close modals/palettes

### Continue Where You Left Off

**Purpose:** Netflix-style feature showing recent activity to enable instant resumption of work.

**Implementation:**
```vue
<!-- Dashboard: Continue Where You Left Off -->
<section class="continue-section">
  <h2 class="section-title">Continue where you left off</h2>
  <div class="activity-carousel">
    <div
      v-for="item in recentActivity.slice(0, 5)"
      :key="item.id"
      class="activity-card"
      @click="resumeActivity(item)"
    >
      <div class="activity-icon">
        <i :class="getActivityIcon(item.type)"></i>
      </div>
      <div class="activity-title">{{ item.title }}</div>
      <div class="activity-meta">
        {{ formatActivityMeta(item) }}
      </div>
    </div>
  </div>
</section>
```

**Data Structure:**
```javascript
// Track user activity in Pinia store
export const useActivityStore = defineStore('activity', {
  state: () => ({
    recentActivity: [] // Last 10 items user interacted with
  }),

  actions: {
    trackActivity(type, id, title, metadata) {
      this.recentActivity.unshift({
        type, // 'task', 'note', 'meeting'
        id,
        title,
        metadata,
        timestamp: new Date().toISOString()
      })

      // Keep only last 10 items
      this.recentActivity = this.recentActivity.slice(0, 10)

      // Persist to localStorage
      localStorage.setItem('coordino_recent_activity', JSON.stringify(this.recentActivity))
    }
  }
})
```

## Component Patterns - UPDATED

### Compact Task Cards

**OLD APPROACH (Avoid):**
```vue
<!-- ❌ Too bulky - uses PrimeVue Card wrapper -->
<Card class="task-card mb-2">
  <template #content>
    <div class="p-4">  <!-- Extra padding -->
      <!-- Task content -->
    </div>
  </template>
</Card>
```

**NEW APPROACH (Use this):**
```vue
<!-- ✅ Compact - direct list items with hover -->
<div class="task-list">
  <div
    v-for="task in tasks"
    :key="task.id"
    class="task-item"
    @click="openTask(task)"
  >
    <!-- Checkbox -->
    <button
      class="task-checkbox"
      @click.stop="toggleComplete(task)"
      aria-label="Mark as complete"
    >
      <i :class="task.completed ? 'pi pi-check-square' : 'pi pi-square'"></i>
    </button>

    <!-- Content -->
    <div class="task-content">
      <div class="task-title">{{ task.title }}</div>
      <div class="task-meta">
        <span v-if="task.priority !== 'normal'" class="badge" :class="`badge-${task.priority}`">
          {{ task.priority }}
        </span>
        <span v-if="task.due_date" class="meta-item">
          <i class="pi pi-calendar"></i>
          {{ formatDueDate(task.due_date) }}
        </span>
        <span v-if="task.status" class="meta-item" :style="{ color: task.status.color }">
          {{ task.status.name }}
        </span>
      </div>
    </div>

    <!-- Actions (hover-only) -->
    <div class="task-actions">
      <button class="action-btn" @click.stop="editTask(task)">
        <i class="pi pi-pencil"></i>
      </button>
      <button class="action-btn" @click.stop="deleteTask(task)">
        <i class="pi pi-trash"></i>
      </button>
    </div>
  </div>
</div>
```

**Styling:**
```css
.task-list {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  overflow: hidden;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;  /* Compact: 10px vertical */
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.15s ease;
  cursor: pointer;
}

.task-item:hover {
  background: var(--bg-hover);
}

.task-item:last-child {
  border-bottom: none;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 2px solid var(--border-strong);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-checkbox:hover {
  border-color: var(--brand-teal-500);
  background: var(--bg-interactive);
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 0.9375rem;  /* 15px */
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.task-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;  /* 12px */
  color: var(--text-secondary);
  flex-wrap: wrap;
}

/* Hover-only actions (Gmail-style) */
.task-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--bg-interactive);
  color: var(--text-primary);
}
```

**Result:** Show 8-10 tasks per screen instead of 3-4.

### Interactive Stat Cards

**Purpose:** Make stat cards clickable to filter content, not just display numbers.

```vue
<!-- Interactive stat card -->
<button
  class="stat-card interactive"
  @click="navigateToFilteredView('overdue')"
>
  <div class="stat-label">Overdue Tasks</div>
  <div class="stat-value error">{{ stats.overdue }}</div>
  <i class="pi pi-arrow-right stat-arrow"></i>
</button>
```

```css
.stat-card.interactive {
  cursor: pointer;
  position: relative;
  border: 1px solid var(--border-default);
  transition: all 0.2s ease;
}

.stat-card.interactive::after {
  content: '→';
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  color: var(--brand-teal-500);
  opacity: 0;
  transition: all 0.2s ease;
}

.stat-card.interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--brand-teal-500);
}

.stat-card.interactive:hover::after {
  opacity: 1;
  transform: translateY(-50%) translateX(4px);
}
```

### Buttons

Primary buttons now use brand teal, not generic blue.

```vue
<!-- Primary Button - Brand teal -->
<Button
  label="Create Task"
  icon="pi pi-plus"
  class="btn-primary"
/>

<!-- Secondary Button -->
<Button
  label="Cancel"
  icon="pi pi-times"
  class="p-button-outlined"
/>

<!-- Danger Button -->
<Button
  label="Delete"
  icon="pi pi-trash"
  class="p-button-danger"
/>
```

```css
.btn-primary {
  background: var(--brand-teal-500) !important;
  border-color: var(--brand-teal-500) !important;
}

.btn-primary:hover {
  background: var(--brand-teal-600) !important;
  border-color: var(--brand-teal-600) !important;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3) !important;
}
```

### Filters - Chip-Based (Airbnb-style)

**OLD:** Bulky filter card with dropdowns taking up entire row.

**NEW:** Compact chip filters like Airbnb's interface.

```vue
<div class="filter-bar">
  <!-- Prominent search -->
  <div class="search-prominent">
    <i class="pi pi-search"></i>
    <input
      type="text"
      placeholder="Search tasks, notes, meetings..."
      v-model="globalSearch"
    />
    <kbd>⌘K</kbd>
  </div>

  <!-- Filter chips -->
  <div class="filter-chips">
    <button
      v-for="preset in filterPresets"
      :key="preset.id"
      class="filter-chip"
      :class="{ active: currentFilter === preset.id }"
      @click="applyFilterPreset(preset)"
    >
      {{ preset.label }}
      <span class="chip-count">{{ preset.count }}</span>
    </button>

    <!-- More filters dropdown -->
    <button class="filter-chip more">
      <i class="pi pi-filter"></i>
      More
    </button>
  </div>
</div>
```

```css
.filter-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: var(--bg-elevated);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.search-prominent {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
}

.search-prominent input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9375rem;
  color: var(--text-primary);
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--border-default);
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-chip:hover {
  background: var(--bg-hover);
  border-color: var(--brand-teal-500);
}

.filter-chip.active {
  background: var(--brand-teal-500);
  border-color: var(--brand-teal-500);
  color: white;
}

.chip-count {
  padding: 0.125rem 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 0.75rem;
}
```

**Preset Filters:**
- "My Focus" → Urgent + High priority + Due this week
- "Due Soon" → Due in next 7 days
- "Overdue" → Past due date
- "Completed" → Show completed items
- "All" → No filtering

### Skeleton Screens (Loading States)

Replace generic spinners with content-aware skeleton screens (Netflix-style).

```vue
<!-- Task list loading skeleton -->
<div v-if="loading" class="task-skeleton-list">
  <div v-for="i in 5" :key="i" class="task-skeleton">
    <div class="skeleton-checkbox"></div>
    <div class="skeleton-content">
      <div class="skeleton-title"></div>
      <div class="skeleton-meta"></div>
    </div>
  </div>
</div>
```

```css
.task-skeleton {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.skeleton-checkbox,
.skeleton-title,
.skeleton-meta {
  background: linear-gradient(
    90deg,
    var(--bg-interactive) 0%,
    var(--bg-hover) 50%,
    var(--bg-interactive) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

.skeleton-checkbox {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.skeleton-title {
  width: 60%;
  height: 16px;
}

.skeleton-meta {
  width: 40%;
  height: 12px;
  margin-top: 0.25rem;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Animation and Motion

### Transition Timing

```css
:root {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms;

  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Micro-interactions

**Task Completion Celebration:**
```javascript
import confetti from 'canvas-confetti'

const handleCompleteTask = async (task) => {
  // Optimistic update
  task.completed = true

  // Trigger confetti
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.8 }
  })

  // Sync to backend
  await taskStore.completeTask(task.id)
}
```

**Hover Lift Effect:**
```css
.hover-lift {
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

## Accessibility

All previous accessibility guidelines remain in effect. Additionally:

### Keyboard Shortcuts Discoverability

Show keyboard hint in UI:
```vue
<button class="action-button">
  Create Task
  <kbd class="keyboard-hint">⌘N</kbd>
</button>
```

### Focus Management for FAB and Command Palette

```javascript
// FAB: Trap focus in expanded menu
const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  })
}
```

## Dark Mode - Netflix Standard

### Dark Mode Implementation

```css
.dark {
  /* Base backgrounds - Netflix-inspired */
  --bg-base: #141414;
  --bg-surface: #1f1f1f;
  --bg-elevated: #2a2a2a;
  --bg-interactive: #303030;
  --bg-hover: #3a3a3a;

  /* Text - High contrast */
  --text-primary: #FFFFFF;
  --text-secondary: #D1D5DB;
  --text-tertiary: #9CA3AF;

  /* Borders - Visible against #141414 */
  --border-subtle: #2a2a2a;
  --border-default: #3a3a3a;
  --border-strong: #4a4a4a;

  /* Shadows - Softer in dark mode */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.6);
}
```

### Testing Dark Mode

Test dark mode in a truly dark environment (not a bright room with dark mode on). Verify:
- Text is readable without eye strain
- Borders and dividers are visible
- Elevated surfaces appear elevated (lighter than base)
- Brand colors maintain their vibrancy
- Images/logos render appropriately

## Implementation with PrimeVue and Tailwind

### Override PrimeVue Theme Variables

```css
:root {
  /* Brand teal as primary */
  --primary-color: #14b8a6;
  --primary-color-text: #ffffff;

  /* Surfaces */
  --surface-0: #ffffff;
  --surface-50: #F7F7F7;
  --surface-100: #EEEEEE;

  /* Text */
  --text-color: #222222;
  --text-color-secondary: #717171;
}

.dark {
  --primary-color: #2dd4bf;
  --surface-0: #141414;
  --surface-50: #1f1f1f;
  --surface-100: #2a2a2a;
  --text-color: #FFFFFF;
  --text-color-secondary: #D1D5DB;
}
```

### Avoid Tailwind Hardcoded Colors

**Bad:**
```vue
<div class="bg-gray-900">  <!-- Hardcoded Tailwind color -->
```

**Good:**
```vue
<div style="background: var(--bg-surface)">  <!-- CSS variable -->
```

This ensures consistent theming across light and dark modes.

## Performance Considerations

- Lazy-load routes
- Virtual scrolling for lists with 100+ items
- Optimize images (WebP, proper sizing)
- Use skeleton screens instead of spinners
- Debounce search inputs (300ms)
- Throttle scroll events (100ms)

## Metrics to Track

### Speed Metrics
- Time to create task: Target <5s (currently ~15-20s)
- Time to find note: Target <3s (currently ~10-15s)
- Clicks to common action: Target 1-2 (currently 4-6)

### Engagement Metrics
- Daily task completions (expect +30%)
- Notes created per week (expect +50%)
- Keyboard shortcut usage (track power users)

### Quality Metrics
- Dark mode adoption rate
- FAB click-through rate
- Command palette usage
- "Continue" section engagement

## Conclusion

These updated guidelines prioritize **speed, information density, and context retention** over decorative elements. Every design decision should ask: "Does this help users accomplish their work faster?" If the answer is no, reconsider the design.

When in doubt:
1. **Speed > Beauty** - Fast and simple beats slow and pretty
2. **Context > Novelty** - Remember user state over adding new features
3. **Density > Whitespace** - Show more useful information per screen
4. **Consistency > Creativity** - Use brand teal everywhere, not different colors

Great design serves users first and designers second.
