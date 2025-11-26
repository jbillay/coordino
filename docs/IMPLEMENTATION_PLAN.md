# IMPLEMENTATION_PLAN.md - Phased Development Plan

## Implementation Philosophy

This plan breaks down the Coordino application into five distinct phases, each delivering a complete, testable piece of functionality. At the end of each phase, the application should be fully functional for the features implemented up to that point. This approach allows for testing, validation, and course correction before investing time in subsequent phases.

Each phase builds on the previous one, adding new features without breaking existing functionality. The order is carefully chosen to establish foundational pieces first, then layer on more complex features that depend on that foundation.

## Phase 1: Foundation and Authentication

Phase 1 establishes the technical infrastructure and authentication system. By the end of this phase, users can create accounts, sign in using multiple methods, and see a themed application shell even though it doesn't contain feature functionality yet.

### Step 1.1: Project Initialization

The project comes with a basic structure that needs enhancement for our specific needs. Install the core dependencies that every part of the application will use:

```bash
npm install vue-router@4 pinia
npm install @supabase/supabase-js
npm install primevue primeicons
npm install tailwindcss@latest postcss@latest autoprefixer@latest
npx tailwindcss init -p
```

Configure Tailwind CSS by updating tailwind.config.js to scan Vue files for class names. This configuration tells Tailwind which files to analyze when building the CSS bundle:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update src/assets/styles/main.css to import Tailwind's base styles, components, and utilities. This file becomes the entry point for all application styling:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom CSS variables for theming will be added here */
```

### Step 1.2: Supabase Project Setup

Create a new Supabase project through the Supabase dashboard at supabase.com. Choose a project name (coordino-dev for development), select a database password you'll remember, and choose the region closest to your primary user base for optimal latency.

Once the project is provisioned, navigate to Project Settings > API to find your Project URL and anonymous public API key. These credentials are safe to use in frontend code because Row Level Security policies protect your data. Create a .env file in your project root to store these values:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Add .env to your .gitignore file to prevent accidentally committing credentials to version control. The VITE_ prefix makes these variables available in your Vue components through import.meta.env.

Create a composable at src/composables/useSupabase.js that provides a singleton Supabase client instance throughout your application. This prevents creating multiple client instances and ensures configuration consistency:

```javascript
import { createClient } from '@supabase/supabase-js'

let supabaseClient = null

export const useSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  }
  
  return { supabase: supabaseClient }
}
```

### Step 1.3: Database Schema Creation

In the Supabase dashboard, navigate to the SQL Editor. Create a new query and execute the following SQL to create the initial database schema. This establishes all tables needed for the complete application, even though early phases won't use all of them yet:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users extended profile table
CREATE TABLE users_extended (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task statuses table
CREATE TABLE task_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Insert default statuses (user_id is NULL for defaults)
INSERT INTO task_statuses (user_id, name, color, is_default, display_order) VALUES
  (NULL, 'Open', '#3b82f6', TRUE, 1),
  (NULL, 'In Progress', '#f59e0b', TRUE, 2),
  (NULL, 'On Hold', '#6b7280', TRUE, 3),
  (NULL, 'Completed', '#10b981', TRUE, 4);

-- Task categories table
CREATE TABLE task_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  proposed_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meeting locations junction table
CREATE TABLE meeting_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(meeting_id, location_id)
);

-- Create indexes for common queries
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status_id ON tasks(status_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_at ON tasks(user_id, created_at DESC);
CREATE INDEX idx_notes_topic_id ON notes(topic_id);
CREATE INDEX idx_notes_created_at ON notes(topic_id, created_at DESC);
CREATE INDEX idx_topics_display_order ON topics(user_id, display_order);
CREATE INDEX idx_locations_user_id ON locations(user_id);

-- Enable Row Level Security
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON users_extended FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_extended FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_extended FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own and default statuses"
  ON task_statuses FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can manage own custom statuses"
  ON task_statuses FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own categories"
  ON task_categories FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own topics"
  ON topics FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own locations"
  ON locations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meetings"
  ON meetings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage meeting locations for own meetings"
  ON meeting_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_locations.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_extended_updated_at BEFORE UPDATE ON users_extended
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

After executing this SQL, verify that all tables appear in the Table Editor and that the default task statuses have been inserted.

### Step 1.4: Configure Authentication Providers

In the Supabase dashboard, navigate to Authentication > Providers. Enable the authentication methods you want to support:

**Email Authentication:** Enabled by default. Configure the email template if desired, or use the default Supabase template. For development, disable email confirmation to speed up testing, but enable it for production.

**Magic Link:** Also under Email authentication settings. Ensure "Enable email confirmations" is disabled for development ease.

**Google OAuth:** Click on Google in the providers list. You'll need to create a Google Cloud project and OAuth credentials. Follow Supabase's documentation for exact steps, but the general process is:

1. Go to Google Cloud Console
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI from Supabase
6. Copy Client ID and Client Secret to Supabase
7. Enable the provider

For initial development, email and password authentication is sufficient. You can add other providers later without changing application code since Supabase abstracts the authentication details.

### Step 1.5: Create Authentication Store

Create the auth store at src/stores/auth.js. This store manages authentication state and provides methods for signing in, signing up, and signing out:

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
  
  // Initialize by checking for existing session
  const initialize = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      user.value = session.user
      await ensureUserProfile()
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }
  
  // Ensure user has extended profile
  const ensureUserProfile = async () => {
    if (!user.value) return
    
    const { data: profile, error: profileError } = await supabase
      .from('users_extended')
      .select('*')
      .eq('id', user.value.id)
      .single()
    
    // Create profile if it doesn't exist
    if (profileError && profileError.code === 'PGRST116') {
      await supabase
        .from('users_extended')
        .insert({
          id: user.value.id,
          full_name: user.value.user_metadata?.full_name || ''
        })
    }
  }
  
  const signUp = async (email, password, fullName) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      
      if (signUpError) throw signUpError
      
      user.value = data.user
      await ensureUserProfile()
      
      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }
  
  const signIn = async (email, password) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) throw signInError
      
      user.value = data.user
      await ensureUserProfile()
      
      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }
  
  const signInWithMagicLink = async (email) => {
    loading.value = true
    error.value = null
    
    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (magicLinkError) throw magicLinkError
      
      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }
  
  const signInWithGoogle = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (oauthError) throw oauthError
      
      return { success: true }
    } catch (e) {
      error.value = e.message
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }
  
  const signOut = async () => {
    await supabase.auth.signOut()
    user.value = null
  }
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialize,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithGoogle,
    signOut
  }
})
```

This store provides all authentication functionality needed throughout the application. The initialize method checks for an existing session when the app loads and sets up a listener for authentication state changes.

### Step 1.6: Create Theme Store

Create src/stores/theme.js to manage light and dark theme preferences:

```javascript
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Initialize from localStorage or system preference
  const getInitialTheme = () => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  }
  
  const currentTheme = ref(getInitialTheme())
  
  // Apply theme to document
  const applyTheme = (theme) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    document.documentElement.setAttribute('data-theme', theme)
  }
  
  // Watch for theme changes
  watch(currentTheme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }, { immediate: true })
  
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }
  
  const setTheme = (theme) => {
    currentTheme.value = theme
  }
  
  return {
    currentTheme,
    toggleTheme,
    setTheme
  }
})
```

This store manages theme state, persists preferences to localStorage, and applies theme classes to the document root for CSS targeting.

### Step 1.7: Create Router with Auth Guards

Create src/router/index.js with route definitions and authentication guards:

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
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false, layout: 'empty' }
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
      meta: { requiresAuth: false, layout: 'empty' }
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/views/AuthCallbackView.vue'),
      meta: { requiresAuth: false, layout: 'empty' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TasksView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('@/views/NotesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/scheduling',
      name: 'scheduling',
      component: () => import('@/views/SchedulingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if ((to.name === 'login' || to.name === 'signup') && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
```

The navigation guard redirects unauthenticated users to login and authenticated users away from auth pages. The redirect query parameter preserves the originally requested URL for redirecting after successful login.

### Step 1.8: Configure PrimeVue

Update src/main.js to configure PrimeVue, Pinia, and the router:

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import router from './router'

// PrimeVue components used globally
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Card from 'primevue/card'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'

// PrimeVue CSS
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// Tailwind CSS
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, { ripple: true })
app.use(ToastService)

// Register global components
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Password', Password)
app.component('Card', Card)
app.component('Toast', Toast)

// Initialize auth store before mounting
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()
authStore.initialize().then(() => {
  app.mount('#app')
})
```

This configuration ensures the auth store initializes and checks for an existing session before the app mounts, preventing flicker from showing the wrong initial state.

### Step 1.9: Create Authentication Views

Create LoginView.vue at src/views/LoginView.vue:

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <Toast />
    <Card class="w-full max-w-md">
      <template #title>
        <h2 class="text-2xl font-bold text-center">Welcome to Coordino</h2>
      </template>
      <template #content>
        <form @submit.prevent="handleSignIn" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium mb-2">Email</label>
            <InputText 
              id="email"
              v-model="email" 
              type="email" 
              placeholder="your@email.com"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium mb-2">Password</label>
            <Password 
              id="password"
              v-model="password" 
              placeholder="Password"
              :feedback="false"
              toggleMask
              class="w-full"
              :class="{ 'p-invalid': errors.password }"
            />
            <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
          </div>
          
          <Button 
            type="submit" 
            label="Sign In" 
            class="w-full"
            :loading="authStore.loading"
          />
        </form>
        
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div class="mt-6 space-y-3">
            <Button 
              label="Sign in with Google" 
              icon="pi pi-google"
              class="w-full p-button-outlined"
              @click="handleGoogleSignIn"
              :loading="authStore.loading"
            />
            
            <Button 
              label="Send Magic Link" 
              icon="pi pi-envelope"
              class="w-full p-button-outlined"
              @click="showMagicLink = !showMagicLink"
            />
          </div>
          
          <div v-if="showMagicLink" class="mt-4">
            <InputText 
              v-model="magicEmail" 
              type="email" 
              placeholder="your@email.com"
              class="w-full mb-2"
            />
            <Button 
              label="Send Link" 
              class="w-full"
              @click="handleMagicLink"
              :loading="authStore.loading"
            />
          </div>
        </div>
        
        <div class="mt-6 text-center">
          <router-link to="/signup" class="text-sm text-primary hover:underline">
            Don't have an account? Sign up
          </router-link>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const magicEmail = ref('')
const showMagicLink = ref(false)
const errors = ref({})

const validateForm = () => {
  errors.value = {}
  
  if (!email.value) {
    errors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.value.email = 'Email is invalid'
  }
  
  if (!password.value) {
    errors.value.password = 'Password is required'
  } else if (password.value.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSignIn = async () => {
  if (!validateForm()) return
  
  const result = await authStore.signIn(email.value, password.value)
  
  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Welcome back!',
      detail: 'You have been signed in successfully',
      life: 3000
    })
    router.push('/dashboard')
  } else {
    toast.add({
      severity: 'error',
      summary: 'Sign in failed',
      detail: result.error,
      life: 5000
    })
  }
}

const handleGoogleSignIn = async () => {
  const result = await authStore.signInWithGoogle()
  
  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: 'Sign in failed',
      detail: result.error,
      life: 5000
    })
  }
}

const handleMagicLink = async () => {
  if (!magicEmail.value) {
    toast.add({
      severity: 'warn',
      summary: 'Email required',
      detail: 'Please enter your email address',
      life: 3000
    })
    return
  }
  
  const result = await authStore.signInWithMagicLink(magicEmail.value)
  
  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Check your email',
      detail: 'We sent you a magic link to sign in',
      life: 5000
    })
    showMagicLink.value = false
    magicEmail.value = ''
  } else {
    toast.add({
      severity: 'error',
      summary: 'Failed to send magic link',
      detail: result.error,
      life: 5000
    })
  }
}
</script>
```

Create a similar SignupView.vue and AuthCallbackView.vue (which just handles OAuth redirects and then navigates to the dashboard).

### Step 1.10: Create Application Layout

Create src/App.vue with the main application structure including theme support:

```vue
<template>
  <div :class="themeStore.currentTheme">
    <router-view />
  </div>
</template>

<script setup>
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<style>
/* Theme CSS variables will be defined here */
</style>
```

Create a main layout component at src/components/layout/AppLayout.vue that will be used for authenticated views:

```vue
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-8">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Coordino</h1>
            <nav class="hidden md:flex space-x-4">
              <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
              <router-link to="/tasks" class="nav-link">Tasks</router-link>
              <router-link to="/notes" class="nav-link">Notes</router-link>
              <router-link to="/scheduling" class="nav-link">Scheduling</router-link>
            </nav>
          </div>
          
          <div class="flex items-center space-x-4">
            <Button 
              :icon="themeStore.currentTheme === 'light' ? 'pi pi-moon' : 'pi pi-sun'"
              class="p-button-rounded p-button-text"
              @click="themeStore.toggleTheme"
            />
            <Button 
              icon="pi pi-cog"
              class="p-button-rounded p-button-text"
              @click="$router.push('/settings')"
            />
            <Button 
              icon="pi pi-sign-out"
              class="p-button-rounded p-button-text"
              @click="handleSignOut"
            />
          </div>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.nav-link {
  @apply px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.nav-link.router-link-active {
  @apply bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white;
}
</style>
```

### Phase 1 Completion Checklist

At the end of Phase 1, you should be able to:
- Run the development server with `npm run dev`
- Navigate to the login page
- Create a new account with email and password
- Sign in with existing credentials
- See the application layout with navigation
- Toggle between light and dark themes
- Sign out and be redirected to login
- Verify that Row Level Security prevents accessing other users' data

Test all authentication flows thoroughly before proceeding to Phase 2. Verify that the database tables exist and RLS policies are working correctly by checking the Supabase dashboard.

## Phase 2: Task Management

Phase 2 implements the complete todo list feature with custom statuses, categories, priorities, sorting, and grouping. By the end of this phase, users will have a fully functional task management system.

### Step 2.1: Create Task Store

Create src/features/tasks/store.js:

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSupabase } from '@/composables/useSupabase'
import { useAuthStore } from '@/stores/auth'

export const useTaskStore = defineStore('tasks', () => {
  const { supabase } = useSupabase()
  const authStore = useAuthStore()
  
  const tasks = ref([])
  const statuses = ref([])
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Computed properties for filtering
  const activeTasks = computed(() => 
    tasks.value.filter(task => !task.completed_at)
  )
  
  const completedTasks = computed(() => 
    tasks.value.filter(task => task.completed_at)
  )
  
  // Fetch all tasks
  const fetchTasks = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          *,
          status:task_statuses(id, name, color),
          category:task_categories(id, name, color)
        `)
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError
      
      tasks.value = data
    } catch (e) {
      error.value = e.message
      console.error('Error fetching tasks:', e)
    } finally {
      loading.value = false
    }
  }
  
  // Fetch statuses (default + user custom)
  const fetchStatuses = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('task_statuses')
        .select('*')
        .order('display_order')
      
      if (fetchError) throw fetchError
      
      statuses.value = data
    } catch (e) {
      console.error('Error fetching statuses:', e)
    }
  }
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('task_categories')
        .select('*')
        .order('display_order')
      
      if (fetchError) throw fetchError
      
      categories.value = data
    } catch (e) {
      console.error('Error fetching categories:', e)
    }
  }
  
  // Create task
  const createTask = async (taskData) => {
    try {
      const { data, error: createError } = await supabase
        .from('tasks')
        .insert({
          user_id: authStore.user.id,
          ...taskData
        })
        .select(`
          *,
          status:task_statuses(id, name, color),
          category:task_categories(id, name, color)
        `)
        .single()
      
      if (createError) throw createError
      
      tasks.value.unshift(data)
      return { success: true, data }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }
  
  // Update task
  const updateTask = async (taskId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select(`
          *,
          status:task_statuses(id, name, color),
          category:task_categories(id, name, color)
        `)
        .single()
      
      if (updateError) throw updateError
      
      const index = tasks.value.findIndex(t => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = data
      }
      
      return { success: true, data }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }
  
  // Mark task as complete
  const completeTask = async (taskId) => {
    return updateTask(taskId, { completed_at: new Date().toISOString() })
  }
  
  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      
      if (deleteError) throw deleteError
      
      tasks.value = tasks.value.filter(t => t.id !== taskId)
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }
  
  // Create custom status
  const createStatus = async (statusData) => {
    try {
      const { data, error: createError } = await supabase
        .from('task_statuses')
        .insert({
          user_id: authStore.user.id,
          ...statusData
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      statuses.value.push(data)
      return { success: true, data }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }
  
  // Create category
  const createCategory = async (categoryData) => {
    try {
      const { data, error: createError } = await supabase
        .from('task_categories')
        .insert({
          user_id: authStore.user.id,
          ...categoryData
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      categories.value.push(data)
      return { success: true, data }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }
  
  // Initialize - fetch all task-related data
  const initialize = async () => {
    await Promise.all([
      fetchTasks(),
      fetchStatuses(),
      fetchCategories()
    ])
  }
  
  return {
    tasks,
    statuses,
    categories,
    loading,
    error,
    activeTasks,
    completedTasks,
    fetchTasks,
    fetchStatuses,
    fetchCategories,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    createStatus,
    createCategory,
    initialize
  }
})
```

This store provides comprehensive task management functionality with all CRUD operations and related data fetching.

### Step 2.2: Create Task Components

Create task-related components in src/features/tasks/components/.

**TaskCard.vue** - Individual task display:

```vue
<template>
  <Card class="task-card mb-3">
    <template #content>
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3 flex-1">
          <Button 
            :icon="task.completed_at ? 'pi pi-check-square' : 'pi pi-square'"
            class="p-button-rounded p-button-text p-button-sm"
            @click="handleToggleComplete"
          />
          
          <div class="flex-1">
            <h3 class="font-medium text-gray-900 dark:text-white">
              {{ task.title }}
            </h3>
            
            <div v-if="task.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ task.description }}
            </div>
            
            <div class="flex flex-wrap gap-2 mt-2">
              <span 
                v-if="task.status"
                class="px-2 py-1 rounded text-xs font-medium"
                :style="{ 
                  backgroundColor: task.status.color + '20',
                  color: task.status.color 
                }"
              >
                {{ task.status.name }}
              </span>
              
              <span 
                v-if="task.category"
                class="px-2 py-1 rounded text-xs font-medium"
                :style="{ 
                  backgroundColor: task.category.color + '20',
                  color: task.category.color 
                }"
              >
                {{ task.category.name }}
              </span>
              
              <span 
                class="px-2 py-1 rounded text-xs font-medium"
                :class="priorityClass"
              >
                {{ task.priority }}
              </span>
              
              <span v-if="task.owner" class="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700">
                👤 {{ task.owner }}
              </span>
            </div>
            
            <div class="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="task.due_date">
                📅 Due: {{ formatDate(task.due_date) }} ({{ daysRemaining }} days)
              </span>
              <span>
                ⏱️ Open for {{ daysOpen }} days
              </span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center space-x-2">
          <Button 
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-sm"
            @click="$emit('edit', task)"
          />
          <Button 
            icon="pi pi-trash"
            class="p-button-rounded p-button-text p-button-sm p-button-danger"
            @click="$emit('delete', task)"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'
import { format, differenceInDays, parseISO } from 'date-fns'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'toggle-complete'])

const priorityClass = computed(() => {
  const classes = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return classes[props.task.priority]
})

const daysRemaining = computed(() => {
  if (!props.task.due_date) return null
  const days = differenceInDays(parseISO(props.task.due_date), new Date())
  return days >= 0 ? days : `${Math.abs(days)} overdue`
})

const daysOpen = computed(() => {
  return differenceInDays(new Date(), parseISO(props.task.created_at))
})

const formatDate = (date) => {
  return format(parseISO(date), 'MMM d, yyyy')
}

const handleToggleComplete = () => {
  emit('toggle-complete', props.task)
}
</script>
```

**TaskDialog.vue** - Create/edit task dialog:

```vue
<template>
  <Dialog 
    :visible="visible" 
    :modal="true"
    :closable="true"
    :style="{ width: '600px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #header>
      <h3>{{ isEdit ? 'Edit Task' : 'Create New Task' }}</h3>
    </template>
    
    <div class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium mb-2">Title *</label>
        <InputText 
          id="title"
          v-model="formData.title" 
          class="w-full"
          placeholder="Enter task title"
        />
      </div>
      
      <div>
        <label for="description" class="block text-sm font-medium mb-2">Description</label>
        <Textarea 
          id="description"
          v-model="formData.description" 
          rows="3"
          class="w-full"
          placeholder="Add task details"
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="status" class="block text-sm font-medium mb-2">Status *</label>
          <Dropdown 
            id="status"
            v-model="formData.status_id" 
            :options="taskStore.statuses"
            optionLabel="name"
            optionValue="id"
            placeholder="Select status"
            class="w-full"
          />
        </div>
        
        <div>
          <label for="priority" class="block text-sm font-medium mb-2">Priority</label>
          <Dropdown 
            id="priority"
            v-model="formData.priority" 
            :options="priorityOptions"
            placeholder="Select priority"
            class="w-full"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="category" class="block text-sm font-medium mb-2">Category</label>
          <Dropdown 
            id="category"
            v-model="formData.category_id" 
            :options="taskStore.categories"
            optionLabel="name"
            optionValue="id"
            placeholder="Select category"
            class="w-full"
          />
        </div>
        
        <div>
          <label for="due_date" class="block text-sm font-medium mb-2">Due Date</label>
          <Calendar 
            id="due_date"
            v-model="formData.due_date" 
            dateFormat="mm/dd/yy"
            placeholder="Select date"
            class="w-full"
          />
        </div>
      </div>
      
      <div>
        <label for="owner" class="block text-sm font-medium mb-2">Owner</label>
        <InputText 
          id="owner"
          v-model="formData.owner" 
          class="w-full"
          placeholder="Assign to person or team"
        />
      </div>
    </div>
    
    <template #footer>
      <Button 
        label="Cancel" 
        icon="pi pi-times" 
        class="p-button-text"
        @click="$emit('update:visible', false)"
      />
      <Button 
        :label="isEdit ? 'Update' : 'Create'" 
        icon="pi pi-check"
        :loading="loading"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useTaskStore } from '../store'

const props = defineProps({
  visible: Boolean,
  task: Object
})

const emit = defineEmits(['update:visible', 'saved'])

const taskStore = useTaskStore()
const loading = ref(false)

const priorityOptions = ['low', 'medium', 'high', 'urgent']

const formData = ref({
  title: '',
  description: '',
  status_id: null,
  category_id: null,
  priority: 'medium',
  owner: '',
  due_date: null
})

const isEdit = computed(() => !!props.task)

watch(() => props.task, (newTask) => {
  if (newTask) {
    formData.value = {
      title: newTask.title,
      description: newTask.description,
      status_id: newTask.status_id,
      category_id: newTask.category_id,
      priority: newTask.priority,
      owner: newTask.owner,
      due_date: newTask.due_date ? new Date(newTask.due_date) : null
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    status_id: taskStore.statuses.find(s => s.name === 'Open')?.id || null,
    category_id: null,
    priority: 'medium',
    owner: '',
    due_date: null
  }
}

const handleSubmit = async () => {
  if (!formData.value.title || !formData.value.status_id) return
  
  loading.value = true
  
  const taskData = {
    ...formData.value,
    due_date: formData.value.due_date ? format(formData.value.due_date, 'yyyy-MM-dd') : null
  }
  
  let result
  if (isEdit.value) {
    result = await taskStore.updateTask(props.task.id, taskData)
  } else {
    result = await taskStore.createTask(taskData)
  }
  
  loading.value = false
  
  if (result.success) {
    emit('saved')
    emit('update:visible', false)
  }
}
</script>
```

Create similar components for TaskList.vue, TaskFilters.vue, and TaskGrouping.vue.

### Step 2.3: Create Tasks View

Create src/views/TasksView.vue:

```vue
<template>
  <AppLayout>
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <Button 
          label="New Task" 
          icon="pi pi-plus"
          @click="showTaskDialog = true"
        />
      </div>
      
      <TaskFilters 
        v-model:status-filter="statusFilter"
        v-model:category-filter="categoryFilter"
        v-model:priority-filter="priorityFilter"
        v-model:sort-by="sortBy"
        v-model:group-by="groupBy"
      />
      
      <TaskList 
        :tasks="filteredAndSortedTasks"
        :group-by="groupBy"
        @edit="handleEditTask"
        @delete="handleDeleteTask"
        @toggle-complete="handleToggleComplete"
      />
      
      <TaskDialog 
        v-model:visible="showTaskDialog"
        :task="selectedTask"
        @saved="handleTaskSaved"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import TaskFilters from '@/features/tasks/components/TaskFilters.vue'
import TaskList from '@/features/tasks/components/TaskList.vue'
import TaskDialog from '@/features/tasks/components/TaskDialog.vue'
import { useTaskStore } from '@/features/tasks/store'

const taskStore = useTaskStore()

const showTaskDialog = ref(false)
const selectedTask = ref(null)
const statusFilter = ref(null)
const categoryFilter = ref(null)
const priorityFilter = ref(null)
const sortBy = ref('created_at')
const groupBy = ref(null)

const filteredAndSortedTasks = computed(() => {
  let filtered = taskStore.activeTasks
  
  if (statusFilter.value) {
    filtered = filtered.filter(t => t.status_id === statusFilter.value)
  }
  
  if (categoryFilter.value) {
    filtered = filtered.filter(t => t.category_id === categoryFilter.value)
  }
  
  if (priorityFilter.value) {
    filtered = filtered.filter(t => t.priority === priorityFilter.value)
  }
  
  // Sorting logic based on sortBy value
  // Grouping logic handled in TaskList component
  
  return filtered
})

const handleEditTask = (task) => {
  selectedTask.value = task
  showTaskDialog.value = true
}

const handleDeleteTask = async (task) => {
  if (confirm('Are you sure you want to delete this task?')) {
    await taskStore.deleteTask(task.id)
  }
}

const handleToggleComplete = async (task) => {
  if (task.completed_at) {
    await taskStore.updateTask(task.id, { completed_at: null })
  } else {
    await taskStore.completeTask(task.id)
  }
}

const handleTaskSaved = () => {
  selectedTask.value = null
}

onMounted(() => {
  taskStore.initialize()
})
</script>
```

### Phase 2 Completion Checklist

At the end of Phase 2, verify that you can:
- Create new tasks with all fields
- Edit existing tasks
- Mark tasks as complete (they disappear immediately)
- Delete tasks
- Filter tasks by status, category, and priority
- Sort tasks by different criteria
- Group tasks by status, category, or priority
- Create custom statuses and categories
- See task aging calculations (days remaining, days open)
- See visual indicators for priority levels

Test thoroughly with various task configurations before moving to Phase 3.

## Phases 3-5 Summary

Due to length constraints, here's a high-level overview of the remaining phases:

**Phase 3: Notes System** implements topics and notes with CRUD operations, search functionality, timestamp display, and topic organization features.

**Phase 4: Scheduling Assistant** creates location management with timezone support, meeting time proposal interface, color-coded time slot visualization based on working hours, and timezone conversion calculations.

**Phase 5: Configuration and Polish** adds user preferences page, date format configuration, CSV export for tasks and notes, performance optimization with virtual scrolling, comprehensive accessibility testing, and final UX refinements.

Each phase follows the same pattern: create stores for state management, build components for UI, create views that compose components, and thoroughly test before proceeding.
