# DESIGN_GUIDELINES.md - Design System and UI/UX Standards

## Design Philosophy

Coordino's design philosophy centers on creating an interface that feels both professional and delightful. The application should inspire confidence through clarity and consistency while surprising users with thoughtful details that make mundane productivity tasks feel more engaging. The visual language balances structure with creativity, formality with warmth, and efficiency with beauty.

The design system respects accessibility as a first-class concern, not an afterthought. Every color choice considers contrast ratios, every interaction works with keyboard navigation, and every component provides appropriate feedback for screen readers. Beautiful design and accessible design are not competing goals but complementary ones.

## Color System

Colors in Coordino serve three primary purposes: establishing brand identity, communicating meaning through semantic colors, and creating structure through neutral tones. The color system works harmoniously across both light and dark themes, maintaining consistent meaning and appropriate contrast in each mode.

### Brand Colors

The primary brand color establishes Coordino's visual identity. This color appears in the most important interactive elements like primary buttons, active navigation items, and key calls to action. The primary color should feel modern and energetic without being overpowering, suggesting productivity and forward momentum.

```css
:root {
  /* Light theme primary */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;  /* Base primary */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
}

.dark {
  /* Dark theme adjusts brightness for appropriate contrast */
  --color-primary-50: #1e3a8a;
  --color-primary-100: #1e40af;
  --color-primary-200: #1d4ed8;
  --color-primary-300: #2563eb;
  --color-primary-400: #3b82f6;
  --color-primary-500: #60a5fa;  /* Base primary in dark mode */
  --color-primary-600: #93c5fd;
  --color-primary-700: #bfdbfe;
  --color-primary-800: #dbeafe;
  --color-primary-900: #eff6ff;
}
```

The accent color provides visual interest and can be used sparingly for highlighting special features or creating visual breaks. Think of it as the application's personality color that adds warmth and approachability to the more structured primary color.

```css
:root {
  --color-accent-400: #a78bfa;
  --color-accent-500: #8b5cf6;
  --color-accent-600: #7c3aed;
}
```

### Semantic Colors

Semantic colors communicate status and meaning consistently throughout the application. These colors should be immediately recognizable and follow common conventions that users already understand from other applications.

```css
:root {
  /* Success - confirmations, completed tasks, positive states */
  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-success-700: #15803d;
  
  /* Warning - cautionary states, approaching deadlines */
  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-500: #eab308;
  --color-warning-600: #ca8a04;
  --color-warning-700: #a16207;
  
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

### Neutral Colors

Neutral colors create the structure and hierarchy of the interface. These grays work across both light and dark themes, providing appropriate contrast and visual separation without competing with content or interactive elements.

```css
:root {
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
}

.dark {
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

Backgrounds create depth and hierarchy through subtle variations in color. The application uses a layered approach where different surfaces sit at different perceived depths, helping users understand the information architecture.

```css
:root {
  --bg-base: #ffffff;           /* Main application background */
  --bg-surface: #f9fafb;        /* Cards, panels, elevated content */
  --bg-elevated: #ffffff;       /* Dialogs, dropdowns, tooltips */
  --bg-interactive: #f3f4f6;    /* Hover states on neutral elements */
}

.dark {
  --bg-base: #111827;
  --bg-surface: #1f2937;
  --bg-elevated: #374151;
  --bg-interactive: #4b5563;
}
```

The base background is the canvas on which everything sits. Surface backgrounds are for cards, panels, and grouped content that should feel distinct from the base. Elevated backgrounds are for elements that float above the rest like modals and dropdowns. Interactive backgrounds provide hover states for clickable regions.

### Text Colors

Text colors must maintain sufficient contrast against their backgrounds while creating clear hierarchy through variations in emphasis. The contrast ratios meet WCAG 2.1 Level AA standards, ensuring readability for users with various visual abilities.

```css
:root {
  --text-primary: #111827;      /* Main content, headings */
  --text-secondary: #6b7280;    /* Supporting text, descriptions */
  --text-tertiary: #9ca3af;     /* De-emphasized text, timestamps */
  --text-inverse: #ffffff;      /* Text on dark backgrounds */
  --text-link: #2563eb;         /* Links and interactive text */
}

.dark {
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  --text-inverse: #111827;
  --text-link: #60a5fa;
}
```

Primary text color is for the most important content that users need to read and understand. Secondary text provides additional context without competing for attention. Tertiary text is for the least important information that supports but doesn't drive understanding. Link text stands out as clickable and interactive while maintaining readability.

### Border Colors

Borders create separation and structure. They should be visible enough to provide definition but subtle enough not to create visual noise. Borders become lighter in dark mode since contrast relationships reverse.

```css
:root {
  --border-default: #e5e7eb;    /* Standard borders, dividers */
  --border-strong: #d1d5db;     /* Emphasized borders */
  --border-subtle: #f3f4f6;     /* Very light separation */
}

.dark {
  --border-default: #374151;
  --border-strong: #4b5563;
  --border-subtle: #27272a;
}
```

## Typography

Typography establishes hierarchy, improves readability, and contributes significantly to the overall feel of the application. Coordino uses a type scale that creates clear distinction between different levels of content while maintaining harmonious relationships.

### Font Family

The application uses system fonts that provide excellent readability, load instantly, and feel native to each platform. This approach respects user preferences while ensuring consistent rendering across devices.

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

Monospace fonts are reserved for code snippets, technical identifiers, and situations where character width consistency matters. They should never be used for body text or headings.

### Type Scale

The type scale creates visual hierarchy through size relationships. Each level serves a specific purpose in the information architecture.

```css
:root {
  --text-xs: 0.75rem;      /* 12px - Tiny labels, timestamps */
  --text-sm: 0.875rem;     /* 14px - Secondary text, captions */
  --text-base: 1rem;       /* 16px - Body text, primary content */
  --text-lg: 1.125rem;     /* 18px - Emphasized body text */
  --text-xl: 1.25rem;      /* 20px - Section headings */
  --text-2xl: 1.5rem;      /* 24px - Page titles */
  --text-3xl: 1.875rem;    /* 30px - Major headings */
  --text-4xl: 2.25rem;     /* 36px - Hero text */
}
```

Body text should generally be 16px (1rem) for comfortable reading. Smaller sizes work for supporting information but become difficult to read in longer passages. Larger sizes create emphasis and should be used sparingly to maintain their impact.

### Font Weight

Font weight creates hierarchy within the same size, allowing emphasis without changing scale. The application uses a limited set of weights to maintain consistency.

```css
:root {
  --font-normal: 400;      /* Body text, standard content */
  --font-medium: 500;      /* Emphasized text, labels */
  --font-semibold: 600;    /* Subheadings, important elements */
  --font-bold: 700;        /* Headings, strong emphasis */
}
```

Regular weight is the default for body text. Medium weight works well for labels and buttons where slight emphasis helps scannability. Semibold creates clear hierarchy for subheadings. Bold is reserved for major headings and strong emphasis.

### Line Height

Line height affects readability profoundly. Taller line heights improve readability for longer passages, while tighter line heights work better for headings and UI elements.

```css
:root {
  --leading-tight: 1.25;   /* Headings, compact UI elements */
  --leading-normal: 1.5;   /* Body text, comfortable reading */
  --leading-relaxed: 1.75; /* Long-form content, maximum readability */
}
```

Body text should use normal or relaxed line height to prevent lines from feeling cramped. Headings benefit from tighter line height since they're usually shorter and the extra space isn't needed for readability.

### Letter Spacing

Most text works best with default letter spacing, but certain situations benefit from adjustments. Headings, especially in uppercase, often need increased letter spacing for clarity.

```css
:root {
  --tracking-tight: -0.025em;   /* Large headings */
  --tracking-normal: 0;          /* Body text, most content */
  --tracking-wide: 0.025em;      /* Small caps, uppercase text */
  --tracking-wider: 0.05em;      /* Spaced capitals */
}
```

## Spacing System

Consistent spacing creates visual rhythm and helps users understand relationships between elements. Elements that relate to each other should be closer together than elements that don't. The spacing scale provides options for every situation while encouraging consistency.

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
  --space-16: 4rem;        /* 64px */
  --space-20: 5rem;        /* 80px */
  --space-24: 6rem;        /* 96px */
}
```

Smaller spacing values work for tight groupings and subtle separation. Medium values create comfortable whitespace within components. Larger values separate distinct sections and create breathing room in the layout.

### Component Spacing Patterns

**Cards and Panels:** Use space-6 (24px) for internal padding, space-4 (16px) between elements within the card, and space-8 (32px) between separate cards.

**Forms:** Use space-4 (16px) between form fields, space-2 (8px) between labels and inputs, and space-6 (24px) between form sections.

**Lists:** Use space-3 (12px) between list items for compact lists, space-4 (16px) for comfortable lists, and space-6 (24px) for spacious lists with complex items.

**Navigation:** Use space-2 (8px) between inline navigation items, space-4 (16px) for button groups, and space-6 (24px) between major navigation sections.

## Layout and Grid

The application uses a container-based layout with maximum widths that prevent content from becoming too wide on large screens. Content wider than about 75 characters becomes difficult to read, so constraining width improves the reading experience.

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem;
  }
}
```

Grid layouts should use Tailwind's grid utilities or CSS Grid for complex layouts. Flexbox works better for simpler layouts and component arrangements. The choice between grid and flexbox depends on whether you need two-dimensional control (grid) or one-dimensional alignment (flexbox).

### Responsive Breakpoints

The application adapts to different screen sizes using Tailwind's default breakpoints. Design mobile-first, then add enhancements for larger screens.

```
sm: 640px   /* Small tablets portrait */
md: 768px   /* Tablets and small laptops */
lg: 1024px  /* Desktops and laptops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Very large screens */
```

On mobile, focus on vertical stacking and full-width components. On tablets, introduce two-column layouts for appropriate content. On desktop, utilize three or more columns where it makes sense, but never fill the entire width with text.

## Component Patterns

### Buttons

Buttons communicate available actions and their importance through visual hierarchy. Primary buttons demand attention and represent the main action in any context. Secondary buttons provide alternatives. Tertiary buttons offer low-priority options without visual weight.

```vue
<!-- Primary Button - Main action -->
<Button label="Create Task" icon="pi pi-plus" />

<!-- Secondary Button - Alternative action -->
<Button label="Cancel" icon="pi pi-times" class="p-button-secondary" />

<!-- Tertiary Button - Low priority action -->
<Button label="Options" icon="pi pi-cog" class="p-button-text" />

<!-- Danger Button - Destructive action -->
<Button label="Delete" icon="pi pi-trash" class="p-button-danger" />
```

Button sizing should match the importance and touch target requirements. Default size works for most situations. Small buttons work in compact interfaces but should still meet minimum touch target size of 44x44px on mobile. Large buttons work for primary actions on mobile or landing pages.

### Forms and Inputs

Form inputs should feel inviting and forgiving. Labels must always be present and visible, never relying solely on placeholder text which disappears on focus. Validation messages should appear inline, close to the relevant field, in clear language that helps users fix problems.

```vue
<div class="form-field">
  <label for="task-title" class="form-label">
    Task Title
    <span class="text-error-500">*</span>
  </label>
  <InputText 
    id="task-title"
    v-model="title"
    placeholder="Enter task title"
    :class="{ 'p-invalid': errors.title }"
  />
  <small v-if="errors.title" class="text-error-500">
    {{ errors.title }}
  </small>
  <small v-else class="text-secondary">
    A clear title helps you quickly identify tasks
  </small>
</div>
```

Field labels should use medium font weight and 14px size. Required fields should be marked with an asterisk and explained at the top of the form. Help text appears below inputs in secondary text color, providing guidance without cluttering the interface. Error messages replace help text and use error color to draw attention.

### Cards

Cards group related content and actions into containers that feel distinct from the background. They create visual hierarchy through elevation and help organize dense interfaces into scannable sections.

```vue
<Card class="task-card">
  <template #header>
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold">Task Title</h3>
      <span class="text-sm text-secondary">2 days ago</span>
    </div>
  </template>
  <template #content>
    <p class="text-secondary">Task description and details</p>
  </template>
  <template #footer>
    <div class="flex justify-end gap-2">
      <Button label="Edit" class="p-button-text" />
      <Button label="Complete" />
    </div>
  </template>
</Card>
```

Cards should have subtle shadows in light mode and slightly lighter backgrounds in dark mode to create depth. Avoid excessive shadows that create a "floating" effect. Cards can have optional headers and footers for grouping related actions or metadata.

### Dialogs and Modals

Dialogs interrupt the user's flow to gather information or confirm actions. They should be used sparingly and always have a clear purpose. The backdrop should dim the background content, focusing attention on the dialog.

```vue
<Dialog 
  :visible="showDialog" 
  :modal="true"
  :closable="true"
  :style="{ width: '500px' }"
  @update:visible="showDialog = $event"
>
  <template #header>
    <h3>Dialog Title</h3>
  </template>
  
  <p>Dialog content</p>
  
  <template #footer>
    <Button label="Cancel" class="p-button-text" @click="showDialog = false" />
    <Button label="Confirm" @click="handleConfirm" />
  </template>
</Dialog>
```

Dialogs should always provide a clear way to dismiss them, either through a close button, cancel action, or clicking the backdrop. The primary action should be visually emphasized. Destructive actions should require explicit confirmation and use danger styling.

### Tags and Badges

Tags label and categorize content. They use color purposefully to communicate meaning quickly. Custom colors from user-defined categories or statuses should have sufficient contrast against their background.

```vue
<span 
  class="px-3 py-1 rounded-full text-sm font-medium"
  :style="{ 
    backgroundColor: category.color + '20',
    color: category.color 
  }"
>
  {{ category.name }}
</span>
```

The color value with '20' appended creates a 20% opacity background, ensuring the tag has enough contrast against the page background while using the full-strength color for text. This technique works for both light and dark themes.

## Animation and Motion

Animation should feel natural and purposeful, never gratuitous. Animations provide feedback, guide attention, and smooth transitions between states. All animations respect the prefers-reduced-motion media query for users who experience motion sickness or distraction.

### Transition Timing

Different types of transitions need different durations and easing functions. Quick transitions feel snappy and responsive. Longer transitions smooth over more dramatic changes. Easing creates natural-feeling motion.

```css
:root {
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms;
  
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
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

Use fast transitions for hover states and small changes. Base duration works for most transitions like fading in content or sliding panels. Slow transitions work for complex animations or dramatic state changes.

### Common Animation Patterns

**Fade In:** New content appears smoothly rather than popping into existence.

```css
.fade-enter-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.fade-enter-from {
  opacity: 0;
}
```

**Slide In:** Panels and drawers slide from off-screen, creating a sense of spatial relationship.

```css
.slide-enter-active {
  transition: transform var(--duration-base) var(--ease-out);
}

.slide-enter-from {
  transform: translateX(-100%);
}
```

**Scale:** Elements grow into view, useful for modals and tooltips.

```css
.scale-enter-active {
  transition: all var(--duration-base) var(--ease-out);
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
```

## Accessibility

Accessibility is not optional. Every component, every interaction, every piece of information must be accessible to users of all abilities. This section outlines the standards that must be met.

### Color Contrast

All text must meet WCAG 2.1 Level AA contrast requirements. Normal text needs a contrast ratio of at least 4.5:1 against its background. Large text (18px bold or 24px regular) needs 3:1. Interactive elements need 3:1 contrast against adjacent colors.

Use contrast checking tools during development to verify all color combinations meet these requirements. Never rely solely on color to communicate information. Always pair color with text, icons, or other visual indicators.

### Keyboard Navigation

Every interactive element must be accessible via keyboard. Focus indicators must be clearly visible. The tab order must follow a logical sequence. Users should be able to complete all tasks using only the keyboard.

```css
/* Custom focus styles that meet contrast requirements */
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip to main content link for keyboard users */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--bg-elevated);
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

### Screen Reader Support

Use semantic HTML elements that communicate meaning to assistive technologies. Buttons should be button elements, not divs with click handlers. Links should be anchor elements. Form inputs need associated labels.

Provide ARIA labels for icon-only buttons. Use ARIA live regions for dynamic content updates. Mark decorative images with alt="" to prevent screen readers from announcing them.

```vue
<!-- Good: Semantic button with accessible label -->
<button aria-label="Delete task" @click="deleteTask">
  <i class="pi pi-trash"></i>
</button>

<!-- Good: Proper form labels -->
<label for="task-title">Task Title</label>
<input id="task-title" v-model="title" />

<!-- Good: ARIA live region for notifications -->
<div role="status" aria-live="polite" aria-atomic="true">
  Task created successfully
</div>
```

### Focus Management

When opening dialogs, move focus to the first focusable element. When closing dialogs, return focus to the element that triggered them. Trap focus within modal dialogs so keyboard users don't accidentally focus elements behind the modal.

### Touch Targets

All interactive elements must be at least 44x44 pixels to meet touch target size requirements. On mobile devices, increase spacing between touch targets to prevent accidental activation.

## Dark Mode

Dark mode is not just inverting colors. It requires thoughtful adjustments to maintain readability, reduce eye strain, and preserve the visual hierarchy established in light mode.

### Dark Mode Colors

Dark mode uses lighter text on darker backgrounds, but pure white on pure black creates too much contrast and causes eye strain. Use off-white text on dark gray backgrounds instead.

Elevation in dark mode is communicated through lighter backgrounds, not shadows. Elements that float above others should be lighter than the base background. This reverses the light mode pattern where elevated elements are darker.

### Testing Dark Mode

Test dark mode throughout development, not as an afterthought. Verify that custom colors (like user-defined category colors) maintain sufficient contrast in both themes. Ensure images and icons work well against both light and dark backgrounds.

Consider providing different assets for light and dark modes when necessary. Logos and illustrations often need adjustment to work well in both contexts.

## Implementation with PrimeVue and Tailwind

PrimeVue provides robust components with built-in accessibility and functionality. Tailwind provides the styling utilities to customize these components to match Coordino's design system. The combination allows rapid development while maintaining design consistency.

### Customizing PrimeVue Themes

PrimeVue components can be styled using CSS variables that override the default theme. Create a custom theme file that applies Coordino's colors and spacing to PrimeVue components.

```css
/* Override PrimeVue theme variables */
:root {
  --primary-color: #3b82f6;
  --primary-color-text: #ffffff;
  --surface-0: #ffffff;
  --surface-50: #f9fafb;
  --surface-100: #f3f4f6;
  --surface-200: #e5e7eb;
  --text-color: #111827;
  --text-color-secondary: #6b7280;
}
```

### Combining PrimeVue and Tailwind

Use PrimeVue for interactive components like dropdowns, calendars, and dialogs. Use Tailwind for layout, spacing, and custom styling. Avoid fighting PrimeVue's built-in styles. Instead, work with them by adding Tailwind utilities for spacing and layout while respecting PrimeVue's component structure.

```vue
<!-- Good: PrimeVue component with Tailwind utilities -->
<Button 
  label="Create Task" 
  icon="pi pi-plus"
  class="w-full sm:w-auto"
/>

<!-- Good: Custom styled PrimeVue component -->
<Card class="shadow-sm hover:shadow-md transition-shadow">
  <template #content>
    <div class="space-y-4">
      <!-- Content using Tailwind spacing -->
    </div>
  </template>
</Card>
```

## Performance Considerations

Beautiful design means nothing if it's slow. Optimize images, lazy-load routes, and use virtual scrolling for long lists. Every animation should run at 60fps. Large operations should show loading states immediately, never leaving users wondering if their action registered.

Test performance on slower devices and slower connections. The application should feel fast even in less-than-ideal conditions. Progressive enhancement ensures core functionality works even if JavaScript fails to load or execute.

## Conclusion

These guidelines provide a foundation for creating consistent, accessible, delightful interfaces in Coordino. When faced with decisions not covered here, prioritize user needs over aesthetic preferences, accessibility over novelty, and clarity over cleverness. Great design serves users first and designers second.
