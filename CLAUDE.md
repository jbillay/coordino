# CLAUDE.md - Instructions for Building Coordino

## Project Overview

Coordino is a productivity application that unifies task management, note-taking, and international meeting scheduling into one seamless experience. The application helps users coordinate their work across multiple dimensions: managing tasks with custom workflows, capturing notes organized by topics, and scheduling meetings across international timezones with visual feedback about optimal meeting times.

## Core Philosophy

This application prioritizes user experience above all else. Every feature should feel intuitive, every interaction should be smooth, and the design should surprise and delight while remaining highly functional. The application respects WCAG 2.1 Level AA accessibility standards, ensuring it works well for all users regardless of their abilities or tools they use to access the web.

## Technical Stack

**Frontend Framework:**
- Vue 3 with Composition API (JavaScript, no TypeScript)
- Vite as the build tool for fast development and optimized production builds
- Vue Router for navigation between different sections of the application

**State Management:**
- Pinia for centralized state management
- Pinia persists user preferences and session data to localStorage
- Real-time data syncing with Supabase handles most data state

**UI Framework:**
- PrimeVue for component library providing buttons, forms, dialogs, and complex components
- Tailwind CSS for utility-first styling and custom design implementations
- PrimeFlex (PrimeVue's flexbox utilities) complements Tailwind for layout

**Backend Services:**
- Supabase for authentication, database, and real-time subscriptions
- Row Level Security policies ensure data isolation between users
- Supabase Edge Functions handle scheduled tasks like reminder notifications

**Hosting:**
- Vercel for frontend hosting with automatic deployments from GitHub
- Custom domain: coordino.app
- Environment variables stored in Vercel dashboard

## Authentication Strategy

The application supports multiple authentication methods to accommodate different user preferences:

**Email and Password:** Traditional authentication where users create an account with email and password. Passwords are hashed and secured by Supabase, never stored in plain text.

**Magic Links:** Passwordless authentication where users receive a secure link via email. Clicking the link logs them in automatically. This reduces friction and eliminates password management concerns.

**Google OAuth:** Social authentication using Google accounts. Many professionals already have Google accounts, making this the fastest onboarding path.

All authentication flows redirect to the main application dashboard after successful login. Session management uses Supabase's built-in JWT tokens with automatic refresh.

## Data Architecture Principles

**User Data Isolation:** Every data table includes a user_id column with Row Level Security policies ensuring users can only access their own data. Even if someone discovered another user's ID, the database itself prevents unauthorized access.

**Timestamps for Everything:** All entities include created_at and updated_at timestamps. This metadata helps users understand their work history and enables features like "sort by recently modified."

**Soft Deletes Where Appropriate:** Tasks and notes should support soft deletion (marking as deleted rather than physically removing) so users can recover accidentally deleted items. Implement an "archive" or "trash" concept rather than immediate permanent deletion.

**Extensibility Through User Configuration:** Custom statuses and categories are stored as separate tables that users can modify. This gives maximum flexibility while maintaining referential integrity.

## Application Structure

The application follows a feature-based organization where each major feature (tasks, notes, scheduling) has its own directory containing components, stores, and utilities specific to that feature. Shared components and utilities live in dedicated directories at the root level.

```
src/
├── main.js                 # Application entry point
├── App.vue                 # Root component with theme provider
├── router/                 # Vue Router configuration
│   └── index.js           # Route definitions and navigation guards
├── stores/                 # Pinia stores
│   ├── auth.js            # Authentication state and methods
│   ├── theme.js           # Theme preferences (light/dark)
│   └── config.js          # User configuration and preferences
├── features/              # Feature-based organization
│   ├── tasks/             # Todo list feature
│   │   ├── components/    # Task-specific components
│   │   ├── store.js       # Task state management
│   │   └── utils.js       # Task-specific utilities
│   ├── notes/             # Notes feature
│   │   ├── components/
│   │   ├── store.js
│   │   └── utils.js
│   └── scheduling/        # Meeting scheduling feature
│       ├── components/
│       ├── store.js
│       └── utils.js
├── components/            # Shared components
│   ├── layout/            # Layout components (header, sidebar, etc)
│   ├── common/            # Reusable UI components
│   └── forms/             # Form components
├── composables/           # Vue composables for shared logic
│   ├── useSupabase.js     # Supabase client and helpers
│   ├── useTheme.js        # Theme switching logic
│   └── useAuth.js         # Authentication helpers
├── utils/                 # Utility functions
│   ├── date.js            # Date formatting and calculations
│   ├── timezone.js        # Timezone conversion utilities
│   └── export.js          # CSV export functionality
└── assets/                # Static assets
    └── styles/            # Global styles
        ├── main.css       # Tailwind imports and global styles
        └── themes/        # Theme-specific CSS variables
```

## Design System

The design system balances creativity with usability, creating an experience that feels fresh without sacrificing functionality. The visual language should feel modern and professional while maintaining personality.

**Color Philosophy:** Use color purposefully to communicate meaning and guide attention. Primary colors establish brand identity, semantic colors (success, warning, error) communicate status, and neutral colors provide structure without competing for attention.

**Spacing and Rhythm:** Consistent spacing creates visual harmony. Use Tailwind's spacing scale religiously. Elements that relate to each other should be closer together than elements that don't. White space is not wasted space—it gives users room to breathe and focus.

**Typography:** Text should be effortlessly readable. Use appropriate font sizes for hierarchy, ensure sufficient contrast for accessibility, and maintain comfortable line lengths (45-75 characters is optimal for body text). Headings establish structure, body text communicates content, and labels guide interaction.

**Animation and Motion:** Subtle animations provide feedback and guide attention. Transitions between states should feel natural, never jarring. A button changing color on hover, a panel sliding into view, or a success message fading in—these small touches make the application feel alive and responsive. However, respect prefers-reduced-motion media queries for users who experience motion sensitivity.

**Component Consistency:** Similar actions should look similar. If a delete button is red with an icon in one place, it should look the same everywhere else. This consistency reduces cognitive load because users learn patterns once and apply them throughout the application.

## Phase-Based Implementation

The application is built in distinct phases, each delivering a complete, usable piece of functionality. This approach allows for testing and validation at each stage before moving forward.

**Phase 1: Foundation and Authentication** establishes the technical infrastructure. Set up the Vue 3 project with all dependencies, configure Supabase connection, implement authentication flows, create the basic layout structure, and establish the theme system. By the end of Phase 1, users can sign up, log in, and see a themed interface even if it doesn't do much yet.

**Phase 2: Task Management** implements the todo list feature with all its complexity. Create the database schema for tasks, statuses, categories, and priorities. Build the task list interface with comprehensive sorting and grouping options. Implement task creation, editing, and completion workflows. By the end of Phase 2, users have a fully functional task management system.

**Phase 3: Notes System** adds the notes feature. Create topics and notes tables with proper relationships. Build the topic management interface and note editor. Implement search and organization features. By the end of Phase 3, users can capture and organize notes alongside their tasks.

**Phase 4: Scheduling Assistant** introduces the international meeting scheduling feature. Create location management with timezone data. Build the meeting time proposal interface with color-coded time slots. Implement timezone conversion calculations. By the end of Phase 4, users can confidently schedule international meetings.

**Phase 5: Configuration and Polish** completes the application with configuration pages, CSV export, performance optimization, and thorough accessibility testing. This phase transforms a functional application into a polished product.

## Development Best Practices

**Component Design:** Components should be focused and composable. A component should do one thing well. If a component grows beyond 300 lines, consider breaking it into smaller pieces. Use props for data down, emit events for actions up. Avoid direct parent-child coupling when possible.

**State Management:** Use Pinia stores for cross-component state. Local component state (ref/reactive) is fine for UI-only concerns like whether a modal is open. Derived state should be computed properties, never duplicated data.

**API Integration:** All Supabase interactions should go through the useSupabase composable or feature-specific stores. This centralization makes it easier to add caching, error handling, or logging later. Handle loading and error states explicitly—users should always know what's happening.

**Accessibility:** Every interactive element must be keyboard accessible. Focus indicators should be visible and clear. Form inputs need associated labels. Use semantic HTML elements. Test with keyboard navigation and screen readers.

**Performance:** Lazy load routes that aren't immediately needed. Optimize images and assets. Use virtual scrolling for long lists. Avoid unnecessary re-renders by being thoughtful about reactive dependencies.

**Error Handling:** Errors will happen. Network requests fail, users lose internet connections, databases have issues. Handle errors gracefully with clear user-facing messages. Never show raw error messages or stack traces to users. Log errors for debugging but display friendly explanations and recovery options.

## Security Considerations

**Row Level Security:** Every table must have RLS policies enabled. Never rely solely on frontend checks for security. The database is the ultimate security boundary.

**Input Validation:** Sanitize and validate all user inputs both client-side (for UX) and server-side (for security). Never trust client-submitted data.

**Authentication Tokens:** Store Supabase session tokens securely. Never expose them in URLs or logs. Use Supabase's built-in session management rather than rolling your own.

**Environment Variables:** API keys and sensitive configuration belong in environment variables, never committed to the repository. Vercel's environment variable system keeps these secure.

## Testing Strategy

While comprehensive testing comes later, build with testability in mind from the start. Write pure functions when possible—they're easiest to test. Keep business logic separate from Vue components. Document complex calculations and edge cases. Manual testing should cover happy paths and error scenarios in each phase before moving to the next.

## Deployment Process

**Development Environment:** Run locally with Vite's dev server connected to Supabase development project. Hot module reloading provides instant feedback during development.

**Production Deployment:** Push to main branch on GitHub triggers automatic Vercel deployment. Vercel builds the application, runs any configured checks, and deploys to coordino.app. Environment variables configured in Vercel dashboard provide production Supabase credentials.

**Database Migrations:** Supabase schema changes should be tracked as SQL migrations. Test migrations on development instance before applying to production. Always have a rollback plan.

## Documentation Philosophy

Code should be self-documenting through clear naming and structure, but complex logic deserves comments explaining the "why" not just the "what." Each store should have a comment block explaining its purpose and key methods. Utility functions should document parameters and return values. Components should explain their purpose and key props.

## When in Doubt

If you encounter a decision point not covered in this documentation, prefer simplicity over complexity, clarity over cleverness, and user experience over technical elegance. Build for the user first, optimize for developers second. When multiple approaches seem equally valid, choose the one that's easier to understand and maintain.

The goal is not to write perfect code on the first try, but to build a solid foundation that can evolve as requirements become clearer through actual use.
