# ARCHITECTURE.md - System Architecture

## System Overview

Coordino follows a modern serverless architecture pattern where the Vue.js frontend communicates directly with Supabase backend services. There is no custom application server between them. This architecture reduces complexity, improves scalability, and leverages Supabase's built-in features for authentication, real-time data, and security.

The frontend is a single-page application built with Vue 3 that makes authenticated API calls to Supabase. Supabase handles user authentication, stores all application data in PostgreSQL, enforces security through Row Level Security policies, and provides real-time subscriptions for live data updates. Vercel hosts the static frontend assets and serves them through a global content delivery network.

## Architecture Diagram

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────────────────┐
│         Vercel CDN                  │
│  (coordino.app)                     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Vue 3 SPA                   │ │
│  │   - PrimeVue Components       │ │
│  │   - Tailwind Styles           │ │
│  │   - Pinia Stores              │ │
│  │   - Vue Router                │ │
│  └───────────────────────────────┘ │
└─────────────┬───────────────────────┘
              │
              │ Supabase JS Client
              │ (Auth + REST + Realtime)
              ▼
┌──────────────────────────────────────┐
│         Supabase Platform            │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Authentication Service        │ │
│  │  - Email/Password              │ │
│  │  - Magic Links                 │ │
│  │  - Google OAuth                │ │
│  │  - JWT Token Management        │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  PostgreSQL Database           │ │
│  │  - User Data Tables            │ │
│  │  - Row Level Security          │ │
│  │  - Foreign Key Constraints     │ │
│  │  - Indexes for Performance     │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Realtime Service              │ │
│  │  - WebSocket Connections       │ │
│  │  - Database Change Streams     │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  Edge Functions (Future)       │ │
│  │  - Reminder Notifications      │ │
│  │  - Scheduled Tasks             │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Authentication Flow

Authentication in Coordino supports three methods, each following a slightly different flow but all resulting in the same outcome: a valid session with JWT tokens stored in the browser.

**Email and Password Flow:**

When a user registers with email and password, the frontend calls Supabase's signUp method with the email and password. Supabase creates a user record in its auth.users table, hashes the password using bcrypt, and sends a confirmation email if email confirmation is required. Once confirmed, users can sign in by calling Supabase's signInWithPassword method. Supabase validates the credentials, generates JWT access and refresh tokens, and returns them to the frontend. The Supabase client automatically stores these tokens in localStorage and includes them in all subsequent API requests.

**Magic Link Flow:**

When a user requests to sign in with a magic link, the frontend calls Supabase's signInWithOtp method with their email address. Supabase generates a unique, time-limited token and emails it to the user as a clickable link. The link points back to the application with the token in the URL. When the user clicks the link, the application extracts the token from the URL and calls Supabase's verifyOtp method. Supabase validates the token, creates a session, and returns JWT tokens just like the password flow.

**Google OAuth Flow:**

When a user clicks "Sign in with Google," the frontend calls Supabase's signInWithOAuth method specifying Google as the provider. This redirects the browser to Google's authentication page. The user logs into Google and grants permission for Coordino to access basic profile information. Google redirects back to the application with an authorization code. The Supabase client automatically exchanges this code for tokens with Google, then creates or updates the user in Supabase's system, and establishes a session with JWT tokens.

All three methods result in the same end state: a logged-in user with valid tokens stored in localStorage and available through the Supabase client. The auth store in Pinia maintains the current user's information and provides methods for signing out, which clears the tokens and redirects to the login page.

## Database Schema

The database schema is designed to support all application features while maintaining strong data integrity through foreign keys and ensuring security through Row Level Security policies. Every table that stores user data includes a user_id column that references auth.users, enabling RLS policies to restrict data access.

### Core Tables

**users_extended**

While Supabase's auth.users table stores authentication information, the users_extended table stores application-specific user preferences and configuration. This separation follows Supabase best practices of not modifying the auth schema directly.

```sql
CREATE TABLE users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The id field is both the primary key and a foreign key to auth.users, creating a one-to-one relationship. When a user account is deleted from auth.users, the CASCADE ensures their extended profile is also deleted. The preferred_timezone helps with scheduling features, date_format stores their preference for displaying dates, and theme stores their light or dark mode preference.

**task_statuses**

Custom task statuses allow each user to define their own workflow states beyond the default set. This table stores both default statuses that everyone gets and user-created custom statuses.

```sql
CREATE TABLE task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

The user_id can be NULL for default statuses that belong to the system rather than any specific user. The is_default flag distinguishes between system-provided and user-created statuses. The color field stores a hex color code for visual distinction in the UI. The display_order determines how statuses appear in dropdowns and filters. The unique constraint on user_id and name prevents duplicate status names within a user's collection.

**task_categories**

Similar to statuses, categories let users organize their tasks according to their own taxonomy. Some users might categorize by project, others by context or area of responsibility.

```sql
CREATE TABLE task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

Unlike statuses, categories don't have a is_default flag because categories are inherently personal. Every user starts with an empty category list and creates the categories that make sense for their work. The structure otherwise mirrors task_statuses for consistency.

**tasks**

The tasks table is the heart of the todo list feature, storing all task information including text, metadata, and relationships to statuses and categories.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status_id UUID NOT NULL REFERENCES task_statuses(id),
  category_id UUID REFERENCES task_categories(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  owner TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The title is required while description is optional for quick task entry. The status_id is required because every task must have a status, while category_id is optional since not all tasks need categorization. The ON DELETE SET NULL for category means if a user deletes a category, tasks in that category aren't deleted, they just lose their category assignment. Priority is an enum with four levels stored directly in the tasks table rather than as a separate reference table since these values are unlikely to be customized. The owner field is plain text allowing flexibility to assign tasks to teams or external people without creating user accounts for them. The completed_at timestamp records exactly when a task was marked complete, which is useful for productivity analytics later.

**topics**

Topics provide the organizational structure for the notes feature. Each topic is essentially a folder or notebook that contains related notes.

```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

The name must be unique per user to avoid confusion. The optional description lets users document what kinds of notes belong in each topic. The color helps with visual organization when displaying multiple topics. The display_order allows users to arrange topics in their preferred sequence.

**notes**

Notes store the actual content within topics. Each note belongs to exactly one topic and contains timestamped text content.

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The CASCADE on topic_id means when a user deletes a topic, all notes in that topic are also deleted. This makes sense because notes without a topic have no context and shouldn't exist independently. Both title and content are required because a note without content or title isn't useful. The timestamps allow sorting notes by creation or modification date within a topic.

**locations**

The scheduling assistant needs to know about different locations with their timezones and working hours. This table stores location configurations that users can reuse when scheduling meetings.

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  work_hours_start TIME NOT NULL DEFAULT '09:00:00',
  work_hours_end TIME NOT NULL DEFAULT '17:00:00',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

The name is a user-friendly label like "London Office" or "Tokyo Team." The timezone stores the IANA timezone identifier like "Europe/London" or "Asia/Tokyo" which the frontend uses for accurate conversions. The work_hours_start and work_hours_end define what constitutes working hours in that location for the color-coded scheduling visualization. The is_favorite flag lets users mark frequently-used locations for quick access.

**meetings**

When users create a meeting proposal, this table stores the meeting details and which locations to consider when displaying time zone information.

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  proposed_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The proposed_time stores the meeting time in UTC, which the frontend converts to each location's timezone for display. The duration_minutes helps calculate the end time when checking if the meeting fits within working hours.

**meeting_locations**

This junction table creates a many-to-many relationship between meetings and locations, allowing one meeting to be evaluated across multiple locations.

```sql
CREATE TABLE meeting_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(meeting_id, location_id)
);
```

The CASCADE ensures when a meeting is deleted, its location associations are also removed, and when a location is deleted, it's removed from all meeting associations. The unique constraint prevents accidentally adding the same location to a meeting twice.

### Indexes for Performance

While PostgreSQL automatically creates indexes on primary keys and unique constraints, additional indexes improve query performance for common access patterns.

```sql
-- Tasks frequently queried by user and filtered by various fields
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status_id ON tasks(status_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_at ON tasks(user_id, created_at DESC);

-- Notes looked up by topic and sorted by creation date
CREATE INDEX idx_notes_topic_id ON notes(topic_id);
CREATE INDEX idx_notes_created_at ON notes(topic_id, created_at DESC);

-- Topics and locations ordered for display
CREATE INDEX idx_topics_display_order ON topics(user_id, display_order);
CREATE INDEX idx_locations_user_id ON locations(user_id);
```

These indexes support common queries without over-indexing, which would slow down write operations. The partial indexes on category_id and due_date only index rows where those values are not NULL, saving space since many tasks won't have categories or due dates.

### Row Level Security Policies

Every user-data table has RLS enabled and policies that restrict access to the authenticated user's own data. These policies are the primary security mechanism ensuring data isolation.

```sql
-- Enable RLS on all tables
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_locations ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own extended profile
CREATE POLICY "Users can view own profile"
  ON users_extended FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_extended FOR UPDATE
  USING (auth.uid() = id);

-- Task statuses: users see default statuses plus their own custom ones
CREATE POLICY "Users can view own and default statuses"
  ON task_statuses FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own custom statuses"
  ON task_statuses FOR ALL
  USING (auth.uid() = user_id);

-- Categories: users manage only their own
CREATE POLICY "Users can manage own categories"
  ON task_categories FOR ALL
  USING (auth.uid() = user_id);

-- Tasks: full CRUD access to own tasks only
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);

-- Topics: full access to own topics
CREATE POLICY "Users can manage own topics"
  ON topics FOR ALL
  USING (auth.uid() = user_id);

-- Notes: full access to own notes
CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id);

-- Locations: full access to own locations
CREATE POLICY "Users can manage own locations"
  ON locations FOR ALL
  USING (auth.uid() = user_id);

-- Meetings: full access to own meetings
CREATE POLICY "Users can manage own meetings"
  ON meetings FOR ALL
  USING (auth.uid() = user_id);

-- Meeting locations: access through meeting ownership
CREATE POLICY "Users can manage meeting locations for own meetings"
  ON meeting_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_locations.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );
```

These policies use auth.uid() which returns the currently authenticated user's ID from their JWT token. The database evaluates these policies on every query, making them impossible to bypass even if the frontend code has bugs or is compromised.

## Frontend Architecture

The Vue 3 frontend is organized around features, with each major feature containing its own components, store, and utilities. This organization keeps related code together and makes it easier to understand and modify specific features without affecting others.

### Router Configuration

Vue Router handles navigation between different views in the application. Routes are lazy-loaded to improve initial page load performance.

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notes',
      component: () => import('@/views/NotesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/scheduling',
      component: () => import('@/views/SchedulingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
```

The navigation guard checks authentication status before allowing access to protected routes. If an unauthenticated user tries to access a protected route, they're redirected to login. If an authenticated user visits the login page, they're redirected to the dashboard.

### State Management with Pinia

Each feature has its own Pinia store managing the state and operations for that feature. Stores interact with Supabase through the useSupabase composable.

**Auth Store Example:**

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'

export const useAuthStore = defineStore('auth', () => {
  const { supabase } = useSupabase()
  
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  const isAuthenticated = computed(() => !!user.value)
  
  async function signIn(email, password) {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) throw signInError
      
      user.value = data.user
      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }
  
  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    signIn,
    signOut
  }
})
```

This pattern of using the Composition API with Pinia creates clear, testable stores that handle both state and operations. Other stores follow similar patterns for their respective features.

## Real-time Updates

Supabase provides real-time subscriptions that push database changes to connected clients instantly. This feature is particularly useful for tasks and notes where users might have the application open in multiple tabs or devices.

The implementation subscribes to changes on relevant tables and updates the local Pinia store when changes occur:

```javascript
// In a Pinia store
const setupRealtimeSubscription = () => {
  const channel = supabase
    .channel('tasks_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.value.id}`
      },
      (payload) => {
        // Handle INSERT, UPDATE, DELETE events
        handleRealtimeChange(payload)
      }
    )
    .subscribe()
    
  return channel
}
```

The subscription filters changes to only those belonging to the current user, ensuring efficient use of bandwidth and processing. When the component unmounts, the subscription should be unsubscribed to prevent memory leaks.

## Error Handling Strategy

Errors occur at multiple layers—network requests fail, database operations encounter constraints, user inputs violate validation rules. The application handles errors gracefully at each layer.

**Network and API Errors:** When Supabase requests fail, stores catch the errors and set error state that components can display. Generic errors show user-friendly messages like "Something went wrong. Please try again." Specific known errors like authentication failures show more targeted messages like "Invalid email or password."

**Validation Errors:** Client-side validation prevents invalid data from reaching the server, providing immediate feedback. Form components use PrimeVue's validation features to show inline error messages. Server-side validation through database constraints provides a safety net if client validation is bypassed.

**Global Error Handling:** Unexpected errors are caught by Vue's error handler and logged for debugging while showing a generic error message to users. In production, these errors would be sent to an error tracking service for investigation.

## Performance Optimization

Performance optimization happens at multiple levels to ensure the application feels fast and responsive.

**Initial Load:** Code splitting through lazy-loaded routes means users only download the JavaScript needed for the current page. PrimeVue components are tree-shakeable, so only imported components are included in the bundle. Images and assets are optimized and properly sized.

**Runtime Performance:** Virtual scrolling for long task lists and note collections ensures smooth performance even with hundreds of items. Computed properties cache derived state to avoid unnecessary recalculations. Debounced search inputs prevent excessive API calls while users type.

**Data Loading:** Pagination limits the amount of data fetched at once. Intelligent prefetching loads likely-needed data before users navigate to it. Local caching through Pinia stores reduces redundant API calls.

## Deployment Configuration

The application deploys to Vercel with minimal configuration. A vercel.json file in the project root configures build settings and routing.

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The rewrite rule ensures all routes are handled by Vue Router for proper single-page application behavior. Environment variables configured in Vercel's dashboard provide the Supabase URL and anonymous key needed for frontend API calls.

## Security Measures

Security is layered throughout the application architecture. Row Level Security policies in the database ensure data isolation even if application code has bugs. JWT tokens authenticate API requests. HTTPS encrypts all traffic between client and server. Supabase's built-in SQL injection prevention protects against database attacks. Rate limiting on authentication endpoints prevents brute force attacks. Regular dependency updates patch security vulnerabilities in third-party packages.

The combination of these measures creates a robust security posture where no single layer's failure compromises the entire system.
