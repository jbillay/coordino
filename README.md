# Coordino

A productivity application that unifies task management, note-taking, and international meeting scheduling into one seamless experience.

## 🚀 Project Status

**Current Phase: Phase 5 - Configuration and Polish 🚧**

### Completed Phases

**Phase 1: Foundation and Authentication - ✅ COMPLETE**
- ✅ Database schema with Row Level Security
- ✅ Authentication (Email/Password, Magic Links & Google OAuth)
- ✅ Theme system (Light/Dark mode)
- ✅ Responsive layout with navigation
- ✅ Vue Router with auth guards
- ✅ Pinia state management

**Phase 2: Task Management - ✅ COMPLETE**
- ✅ Task CRUD operations with real-time updates
- ✅ Custom statuses and categories
- ✅ Advanced filtering, sorting, and grouping
- ✅ Task statistics dashboard
- ✅ Pagination and search
- ✅ Comprehensive smoke testing (100% pass rate)

**Phase 3: Notes System - ✅ COMPLETE**
- ✅ Rich text editor with markdown support (Tiptap)
- ✅ Topic management with drag-and-drop reordering
- ✅ Full-text search with performance metrics
- ✅ Pin and archive functionality
- ✅ Autosave with debouncing
- ✅ Keyboard shortcuts and accessibility features
- ✅ Comprehensive smoke testing (100% pass rate)

**Phase 4: Scheduling Assistant - ✅ COMPLETE**
- ✅ International meeting scheduling
- ✅ Timezone-aware participant management (418 IANA timezones)
- ✅ Meeting equity score calculation
- ✅ Interactive heatmap visualization
- ✅ Custom working hours by country
- ✅ Optimal meeting time suggestions
- ✅ Comprehensive smoke testing (100% pass rate)

**Phase 5: Configuration and Polish - 🚧 IN PROGRESS**
- 🚧 Settings page implementation
- 🚧 Performance optimization
- 🚧 Accessibility compliance (WCAG 2.1 Level AA)
- 🚧 Test coverage improvement (target: 80%+)
- 🚧 Documentation and polish

## 🛠️ Tech Stack

- **Frontend:** Vue 3 (Composition API), Vite
- **UI Framework:** PrimeVue + Tailwind CSS
- **State Management:** Pinia
- **Backend:** Supabase (Auth, Database, Realtime)
- **Routing:** Vue Router
- **Styling:** Tailwind CSS + PrimeVue themes

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd coordino
npm install
```

### 2. Environment Setup

The `.env` file should already be configured with your Supabase credentials. If not, create it:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

The database schema has been created via Supabase migrations. To verify:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Table Editor
3. You should see tables: `users_extended`, `tasks`, `task_statuses`, `task_categories`, `topics`, `notes`, `locations`, `meetings`, `meeting_locations`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔐 Authentication

The application supports multiple authentication methods:

### Email and Password
- Navigate to `/signup` to create an account
- Use `/login` to sign in with existing credentials

### Magic Links (Passwordless)
- On the login page, click "Send Magic Link"
- Enter your email address
- Check your email and click the link to sign in

### Testing Authentication

For development testing, you may want to:
1. Disable email confirmation in Supabase Dashboard: Authentication > Providers > Email > "Enable email confirmations" (toggle off)
2. This allows immediate sign-in without email verification

## 🎨 Features

### Implemented Features

**Authentication & Core** (Phase 1)
- ✅ Multiple authentication methods (Email/Password, Magic Links, Google OAuth)
- ✅ Protected routes with auth guards
- ✅ Light/Dark theme toggle with persistence
- ✅ Responsive navigation (Mobile, Tablet, Desktop)
- ✅ User session management
- ✅ Row Level Security for data isolation

**Task Management** (Phase 2)
- ✅ Create, read, update, delete tasks
- ✅ Custom statuses and categories with color coding
- ✅ Advanced filtering (by status, priority, category, date range)
- ✅ Multiple sorting options (date, priority, title)
- ✅ Grouping by status, priority, or category
- ✅ Real-time task updates across sessions
- ✅ Task statistics dashboard (active, completed, overdue, completion rate)
- ✅ Pagination for large task lists
- ✅ Full-text search

**Notes System** (Phase 3)
- ✅ Rich text editor with markdown support (Tiptap)
- ✅ Topic management with drag-and-drop reordering
- ✅ Full-text search with performance metrics
- ✅ Pin important notes for quick access
- ✅ Archive/restore functionality
- ✅ Autosave with 3-second debouncing
- ✅ Keyboard shortcuts (Ctrl+K command palette, Ctrl+B bold, etc.)
- ✅ Real-time note updates
- ✅ Word and character count
- ✅ Note preview with timestamps

**Scheduling Assistant** (Phase 4)
- ✅ International meeting scheduling
- ✅ 418 IANA timezone support with search
- ✅ Participant management with timezone awareness
- ✅ Meeting equity score (0-100) based on participant working hours
- ✅ Interactive 24-hour heatmap visualization
- ✅ Color-coded time slots (optimal, acceptable, poor, critical)
- ✅ Optimal meeting time suggestions (top 3)
- ✅ Custom working hours by country
- ✅ Non-working day detection
- ✅ Real-time equity score updates

**Global Features**
- ✅ Command Palette (Ctrl+K) for quick navigation and actions
- ✅ Floating Action Button (FAB) for quick creates
- ✅ Toast notifications for user feedback
- ✅ Accessible confirmation dialogs
- ✅ Keyboard navigation throughout
- ✅ Skip to main content for accessibility
- ✅ Focus indicators for keyboard users

### In Progress (Phase 5)

- 🚧 **Settings Page:** User preferences, notification settings, data export
- 🚧 **Performance:** Virtual scrolling, code splitting, bundle optimization
- 🚧 **Accessibility:** WCAG 2.1 Level AA compliance, screen reader testing
- 🚧 **Testing:** Increase coverage to 80%+, automated E2E tests
- 🚧 **Documentation:** JSDoc comments, API docs, keyboard shortcuts guide

## 🛠️ Developer Tools & Configuration

This project includes several configuration files to ensure consistency and quality:

- **`.editorconfig`** - Cross-editor coding style enforcement
- **`.nvmrc`** - Specifies Node.js version (22.12.0)
- **`.npmrc`** - NPM configuration for consistent dependency management
- **`.prettierrc`** - Code formatting rules
- **`.prettierignore`** - Files to exclude from formatting
- **`eslint.config.js`** - Linting rules and configuration
- **`.vscode/settings.json`** - VS Code workspace settings
- **`.vscode/extensions.json`** - Recommended VS Code extensions
- **`.github/dependabot.yml`** - Automated dependency updates
- **`.github/workflows/`** - CI/CD pipelines for testing, security, and deployment

## 📁 Project Structure

```
coordino/
├── docs/                          # Comprehensive documentation
│   ├── ARCHITECTURE.md            # System architecture and data models
│   ├── IMPLEMENTATION_PLAN.md     # Phase-by-phase implementation guide
│   ├── QUICK_REFERENCE.md         # Developer quick reference
│   ├── TODO.md                    # Centralized project TODO list
│   ├── TASK.md                    # Code review task list
│   └── SMOKE_TEST_RESULTS.md      # Comprehensive smoke test results
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css           # Global styles + Tailwind
│   ├── components/
│   │   ├── common/                # Reusable components
│   │   ├── dashboard/             # Dashboard-specific components
│   │   ├── forms/                 # Form components
│   │   ├── global/                # Global components (CommandPalette, etc.)
│   │   └── layout/
│   │       └── AppLayout.vue      # Main application layout
│   ├── composables/
│   │   ├── useSupabase.js         # Supabase client
│   │   ├── useAuth.js             # Authentication helpers
│   │   └── useTheme.js            # Theme switching logic
│   ├── features/                  # Feature-based organization
│   │   ├── tasks/                 # Task management feature
│   │   │   ├── components/        # Task-specific components
│   │   │   ├── store.js           # Task state management
│   │   │   └── utils.js           # Task utilities
│   │   ├── notes/                 # Notes feature
│   │   │   ├── components/        # Note components
│   │   │   ├── composables/       # Note composables
│   │   │   ├── store.js           # Notes state
│   │   │   └── utils.js           # Note utilities
│   │   └── scheduling/            # Scheduling feature
│   │       ├── components/        # Scheduling components
│   │       ├── store.js           # Scheduling state
│   │       ├── utils.js           # Scheduling utilities
│   │       └── views/             # Scheduling views
│   ├── router/
│   │   └── index.js               # Vue Router config with auth guards
│   ├── stores/
│   │   ├── auth.js                # Authentication state
│   │   ├── theme.js               # Theme state
│   │   └── config.js              # User configuration
│   ├── utils/                     # Shared utilities
│   │   ├── date.js                # Date formatting
│   │   ├── timezone.js            # Timezone utilities
│   │   ├── export.js              # CSV export
│   │   └── validation.js          # Input validation
│   ├── views/
│   │   ├── LoginView.vue          # Login page
│   │   ├── SignupView.vue         # Registration page
│   │   ├── DashboardView.vue      # Main dashboard
│   │   ├── TasksView.vue          # Tasks management
│   │   ├── NotesView.vue          # Notes editor
│   │   ├── AuthCallbackView.vue   # OAuth/Magic link handler
│   │   └── SettingsView.vue       # Settings (Phase 5)
│   ├── App.vue                    # Root component
│   └── main.js                    # Application entry
├── tests/                         # Test files
│   ├── unit/                      # Unit tests
│   └── e2e/                       # End-to-end tests
├── .env                           # Environment variables (not in git)
├── .env.example                   # Environment template
├── .husky/                        # Git hooks (pre-commit)
├── CLAUDE.md                      # AI assistant instructions
└── README.md                      # This file
```

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (when implemented)
npm run test:e2e

# Run linter
npm run lint
```

### Current Test Coverage
- **Unit Tests:** ~30% coverage (target: 80%+)
- **Smoke Tests:** 100% pass rate (see `docs/SMOKE_TEST_RESULTS.md`)
- **E2E Tests:** In progress (Phase 5)

### Test Results Summary
- ✅ All core features tested and working
- ✅ Tasks module: 100% functional
- ✅ Notes module: 100% functional
- ✅ Scheduling module: 100% functional
- ✅ Performance: LCP 1,629ms (Good), CLS 0.00 (Excellent)

## 🔒 Security Features

- Row Level Security (RLS) on all database tables
- JWT-based authentication
- Secure password hashing (handled by Supabase)
- Protected routes with navigation guards
- User data isolation at database level

## 🎨 Theming

Toggle between light and dark themes using the moon/sun icon in the header. Theme preference is:
- Saved to localStorage
- Applied instantly across the app
- Respects system preferences on first visit

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed system architecture and data models
- **[IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** - Complete phase-by-phase implementation guide
- **[QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Quick developer reference and code snippets
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment setup guide for Vercel and CI/CD
- **[TODO.md](docs/TODO.md)** - Centralized project TODO list with priorities
- **[TASK.md](docs/TASK.md)** - Code review task list and technical debt tracking
- **[SMOKE_TEST_RESULTS.md](docs/SMOKE_TEST_RESULTS.md)** - Comprehensive smoke test results
- **[CLAUDE.md](CLAUDE.md)** - AI assistant instructions for building Coordino

## 🚀 Deployment

### Production Build

```bash
npm run build
```

The build output will be in the `dist/` directory, ready to deploy to Vercel or any static hosting service.

### Recommended: Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Coding standards
- Commit guidelines
- Pull request process
- Testing requirements

For the complete development roadmap, see [Implementation Plan](docs/IMPLEMENTATION_PLAN.md).

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Authentication Issues
- Ensure Supabase credentials are correct in `.env`
- Check that RLS policies are enabled in Supabase dashboard
- Verify email templates are configured for magic links

### Build Issues
- Clear `node_modules` and `package-lock.json`, then `npm install`
- Ensure Node.js version is 18+
- Check for TypeScript errors in console

### Database Issues
- Verify all migrations ran successfully in Supabase
- Check Table Editor for proper schema
- Ensure RLS is enabled on all tables

## 📧 Support

For issues and questions:
1. Check the documentation in `/docs`
2. Review Supabase logs in the dashboard
3. Check browser console for errors

---

**Built with ❤️ using Vue 3, Supabase, and modern web technologies**
