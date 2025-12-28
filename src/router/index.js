/**
 * Vue Router Configuration
 *
 * Defines application routes with authentication guards and lazy-loaded components.
 * Uses history mode for clean URLs and implements navigation guards for protected routes.
 *
 * Route Meta Fields:
 * @property {boolean} requiresAuth - Whether route requires authentication (default: true)
 * @property {string} layout - Layout type ('empty' for auth pages, default uses AppLayout)
 *
 * @see {@link https://router.vuejs.org/guide/|Vue Router Guide}
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Router instance with route definitions
 * All routes except auth pages require authentication by default
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { requiresAuth: false, layout: 'empty' }
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
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
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
      component: () => import('@/views/NotesListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notes/new',
      name: 'notes-create',
      component: () => import('@/views/NoteEditorView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notes/:id/edit',
      name: 'notes-edit',
      component: () => import('@/views/NoteEditorView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/scheduling',
      component: () => import('@/views/SchedulingView.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'scheduling',
          component: () => import('@/features/scheduling/views/MeetingList.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'participants',
          name: 'scheduling-participants',
          component: () => import('@/features/scheduling/views/ParticipantManagement.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'create',
          name: 'scheduling-create',
          component: () => import('@/features/scheduling/views/CreateMeeting.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'config',
          name: 'scheduling-config',
          component: () => import('@/features/scheduling/views/CountryConfigManagement.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: ':id',
          name: 'scheduling-detail',
          component: () => import('@/features/scheduling/views/MeetingDetail.vue'),
          meta: { requiresAuth: true }
        }
      ]
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

/**
 * Global navigation guard for authentication
 *
 * Handles route protection and redirects based on authentication state:
 * - Initializes auth on first navigation
 * - Redirects unauthenticated users to login page
 * - Redirects authenticated users away from auth pages
 * - Preserves intended destination in query params
 *
 * @param {import('vue-router').RouteLocationNormalized} to - Target route
 * @param {import('vue-router').RouteLocationNormalized} from - Source route
 * @param {import('vue-router').NavigationGuardNext} next - Navigation guard callback
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth to be initialized if this is the first navigation
  if (from.name === undefined) {
    await authStore.initialize()
  }

  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login with return URL
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (
    (to.name === 'landing' ||
      to.name === 'login' ||
      to.name === 'signup' ||
      to.name === 'reset-password') &&
    authStore.isAuthenticated
  ) {
    // Redirect authenticated users away from landing and auth pages
    next({ name: 'dashboard' })
  } else {
    // Allow navigation
    next()
  }
})

export default router
