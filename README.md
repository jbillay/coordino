# Coordino

A productivity application that unifies task management, note-taking, and international meeting scheduling into one seamless experience.

## 🚀 Project Status

**Phase 1: Foundation and Authentication - ✅ COMPLETE**

- ✅ Database schema with Row Level Security
- ✅ Authentication (Email/Password & Magic Links)
- ✅ Theme system (Light/Dark mode)
- ✅ Responsive layout with navigation
- ✅ Vue Router with auth guards
- ✅ Pinia state management

**Upcoming Phases:**
- Phase 2: Task Management
- Phase 3: Notes System
- Phase 4: Scheduling Assistant
- Phase 5: Configuration and Polish

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

### Implemented (Phase 1)
- ✅ User registration and authentication
- ✅ Password and magic link login
- ✅ Protected routes with auth guards
- ✅ Light/Dark theme toggle
- ✅ Responsive navigation
- ✅ User session management
- ✅ Automatic profile creation

### Coming Soon
- 📝 Task management with custom workflows (Phase 2)
- 📓 Notes organized by topics (Phase 3)
- 🌍 International meeting scheduler (Phase 4)
- ⚙️ User preferences and settings (Phase 5)

## 📁 Project Structure

```
coordino/
├── docs/                          # Comprehensive documentation
│   ├── ARCHITECTURE.md            # System architecture
│   ├── DESIGN_GUIDELINES.md       # UI/UX standards
│   ├── IMPLEMENTATION_PLAN.md     # Phase-by-phase plan
│   └── QUICK_REFERENCE.md         # Developer reference
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css           # Global styles + Tailwind
│   ├── components/
│   │   └── layout/
│   │       └── AppLayout.vue      # Main application layout
│   ├── composables/
│   │   └── useSupabase.js         # Supabase client
│   ├── router/
│   │   └── index.js               # Vue Router config
│   ├── stores/
│   │   ├── auth.js                # Authentication state
│   │   └── theme.js               # Theme state
│   ├── views/
│   │   ├── LoginView.vue          # Login page
│   │   ├── SignupView.vue         # Registration page
│   │   ├── DashboardView.vue      # Main dashboard
│   │   ├── AuthCallbackView.vue   # OAuth/Magic link handler
│   │   └── ...                    # Other views
│   ├── App.vue                    # Root component
│   └── main.js                    # Application entry
├── .env                           # Environment variables (not in git)
├── AUTH_SETUP.md                  # Auth configuration notes
└── CLAUDE.md                      # AI assistant instructions
```

## 🧪 Testing

Basic test structure is in place:

```bash
# Tests will use Vitest in later phases
# Current: Documentation of expected behavior
npm run test  # (to be configured)
```

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

- **ARCHITECTURE.md** - Detailed system architecture and data models
- **DESIGN_GUIDELINES.md** - UI/UX standards and component patterns
- **IMPLEMENTATION_PLAN.md** - Complete phase-by-phase implementation guide
- **QUICK_REFERENCE.md** - Quick developer reference and code snippets

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

This project follows a phased development approach. See `docs/IMPLEMENTATION_PLAN.md` for the complete roadmap.

## 📝 License

[Your License Here]

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
