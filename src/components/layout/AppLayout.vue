<script setup>
/**
 * AppLayout Component
 *
 * Main application layout with sidebar navigation, user menu, and mobile responsive design.
 * Provides skip-to-main-content accessibility feature and focus management for mobile menu.
 *
 * @component
 * @example
 * <AppLayout>
 *   <template #header>
 *     <h1>Custom Header</h1>
 *   </template>
 *   <YourPageContent />
 * </AppLayout>
 *
 * Slots:
 * @slot header - Optional header content displayed above main content
 * @slot default - Main page content
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useSessionTimeout } from '@/composables/useSessionTimeout'
import GlobalFAB from '@/components/global/GlobalFAB.vue'
import CommandPalette from '@/components/global/CommandPalette.vue'
import SessionTimeoutWarning from '@/components/layout/SessionTimeoutWarning.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// Session timeout tracking (FR-039, FR-040, SC-011)
const {
  isWarningVisible,
  remainingTimeFormatted,
  extendSession,
  startTracking,
  stopTracking
} = useSessionTimeout()

/** @type {import('vue').Ref<boolean>} User dropdown menu visibility */
const showUserMenu = ref(false)

/** @type {import('vue').Ref<boolean>} Mobile menu visibility */
const showMobileMenu = ref(false)

/** @type {import('vue').Ref<HTMLElement|null>} Reference to mobile menu element */
const mobileMenuRef = ref(null)

/** @type {import('vue').Ref<HTMLElement|null>} Reference to mobile menu button */
const mobileMenuButtonRef = ref(null)

/** @type {import('vue').Ref<HTMLElement|null>} Element that had focus before mobile menu opened */
const lastFocusedElement = ref(null)

/**
 * Gets user's display name (first name or email username)
 * @returns {string} User's display name
 */
const getUserName = computed(() => {
  const { user } = authStore
  if (user?.user_metadata?.full_name) {
    return user.user_metadata.full_name.split(' ')[0]
  }
  if (user?.email) {
    return user.email.split('@')[0]
  }
  return 'User'
})

/**
 * Gets user's initials for avatar display
 * @returns {string} User's initials (1-2 characters)
 */
const getUserInitials = computed(() => {
  const { user } = authStore
  if (user?.user_metadata?.full_name) {
    const names = user.user_metadata.full_name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return names[0][0].toUpperCase()
  }
  if (user?.email) {
    return user.email.substring(0, 2).toUpperCase()
  }
  return 'U'
})

/**
 * Toggles user dropdown menu visibility
 * Automatically closes mobile menu if user menu is opened
 */
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
  if (showUserMenu.value) {
    showMobileMenu.value = false
  }
}

/**
 * Toggles mobile menu with proper focus management
 * - When opening: Saves current focus and moves focus to first menu item
 * - When closing: Restores focus to the button that opened it
 */
const toggleMobileMenu = () => {
  if (!showMobileMenu.value) {
    // Opening menu
    lastFocusedElement.value = document.activeElement
    showMobileMenu.value = true
    showUserMenu.value = false

    // Focus the first focusable element in menu after it opens
    setTimeout(() => {
      const firstFocusable = mobileMenuRef.value?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }, 100)
  } else {
    // Closing menu
    closeMobileMenu()
  }
}

/**
 * Closes mobile menu and restores focus to previous element
 * Part of accessibility focus management
 */
const closeMobileMenu = () => {
  showMobileMenu.value = false

  // Restore focus to the element that opened the menu
  if (lastFocusedElement.value) {
    lastFocusedElement.value.focus()
    lastFocusedElement.value = null
  }
}

/**
 * Focus trap handler for mobile menu
 * Ensures focus stays within the menu when it's open
 * Handles Tab, Shift+Tab, and Escape keys
 * @param {KeyboardEvent} event - Keyboard event
 */
const handleMobileFocusTrap = (event) => {
  if (!showMobileMenu.value || !mobileMenuRef.value) {
    return
  }

  const { key, shiftKey } = event

  // Close menu on Escape
  if (key === 'Escape') {
    event.preventDefault()
    closeMobileMenu()
    return
  }

  // Handle Tab key for focus trap
  if (key === 'Tab') {
    // Get all focusable elements within the mobile menu
    const focusableElements = mobileMenuRef.value.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) {
      return
    }

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Shift+Tab on first element: wrap to last element
    if (shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault()
      lastFocusable.focus()
    } else if (!shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault()
      firstFocusable.focus()
    }
  }
}

/**
 * Handles user sign out
 * Closes menus, signs out user, and redirects to login page
 */
const handleSignOut = async () => {
  showUserMenu.value = false
  stopTracking() // Stop session timeout tracking
  await authStore.signOut()
  router.push('/login')
}

/**
 * Handles session extension from timeout warning (FR-040)
 */
const handleExtendSession = async () => {
  await extendSession()
}

/**
 * Handles logout from session timeout warning
 */
const handleSessionLogout = async () => {
  stopTracking()
  await authStore.logout()
  router.push({ name: 'login', query: { reason: 'timeout' } })
}

/**
 * Handles clicks outside of menus to close them
 * Improves UX by allowing users to close menus by clicking away
 * @param {MouseEvent} event - Click event
 */
const handleClickOutside = (event) => {
  const { target } = event
  // Close user menu if clicking outside of sidebar-user area
  if (!target.closest('.sidebar-user')) {
    showUserMenu.value = false
  }
  // Close mobile menu if clicking outside
  if (!target.closest('.mobile-sidebar') && !target.closest('.mobile-menu-btn')) {
    showMobileMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleMobileFocusTrap)

  // Start session timeout tracking (FR-039, SC-011)
  startTracking()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleMobileFocusTrap)

  // Stop session timeout tracking
  stopTracking()
})
</script>

<template>
  <div class="app-container" style="background-color: var(--bg-base)">
    <!-- Skip to main content link for keyboard users -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Left Sidebar -->
    <aside class="app-sidebar" :class="{ 'sidebar-dark': themeStore.currentTheme === 'dark' }">
      <!-- Logo -->
      <div class="sidebar-logo">
        <img src="/coordino-logo.png" alt="Coordino" class="h-6 w-auto dark:invert" />
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="sidebar-link">
          <i class="pi pi-th-large"></i>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/tasks" class="sidebar-link">
          <i class="pi pi-check-circle"></i>
          <span>Tasks</span>
        </router-link>
        <router-link to="/notes" class="sidebar-link">
          <i class="pi pi-file"></i>
          <span>Notes</span>
        </router-link>
        <router-link to="/scheduling" class="sidebar-link">
          <i class="pi pi-users"></i>
          <span>Meetings</span>
        </router-link>
        <router-link to="/settings" class="sidebar-link">
          <i class="pi pi-cog"></i>
          <span>Settings</span>
        </router-link>
      </nav>

      <!-- User Profile at Bottom -->
      <div class="sidebar-user">
        <div class="user-profile" @click="toggleUserMenu">
          <div class="user-avatar">
            <span>{{ getUserInitials }}</span>
          </div>
          <div class="user-info">
            <div class="user-name">{{ getUserName }}</div>
            <div class="user-action">View Profile</div>
          </div>
        </div>

        <!-- User Dropdown Menu -->
        <transition name="menu-slide">
          <div v-if="showUserMenu" class="user-dropdown">
            <button class="dropdown-link" @click="themeStore.toggleTheme">
              <i :class="themeStore.currentTheme === 'light' ? 'pi pi-moon' : 'pi pi-sun'"></i>
              <span>{{ themeStore.currentTheme === 'light' ? 'Dark Mode' : 'Light Mode' }}</span>
            </button>
            <button class="dropdown-link danger" @click="handleSignOut">
              <i class="pi pi-sign-out"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </transition>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="app-main" :class="{ 'main-dark': themeStore.currentTheme === 'dark' }">
      <!-- Optional Top Header for Actions -->
      <header v-if="route.meta.showHeader !== false" class="main-header">
        <slot name="header">
          <!-- Default header content can go here -->
        </slot>
      </header>

      <!-- Page Content -->
      <main id="main-content" class="main-content" tabindex="-1">
        <slot />
      </main>
    </div>

    <!-- Mobile Menu Overlay -->
    <div v-if="showMobileMenu" class="mobile-overlay" @click="closeMobileMenu"></div>

    <!-- Mobile Sidebar -->
    <transition name="mobile-slide">
      <aside
        v-if="showMobileMenu"
        id="mobile-menu"
        ref="mobileMenuRef"
        class="mobile-sidebar"
        :class="{ 'sidebar-dark': themeStore.currentTheme === 'dark' }"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <!-- Logo -->
        <div class="sidebar-logo">
          <img src="/coordino-logo.png" alt="Coordino" class="h-6 w-auto dark:invert" />
          <button class="close-btn" aria-label="Close navigation menu" @click="closeMobileMenu">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <router-link to="/dashboard" class="sidebar-link" @click="closeMobileMenu">
            <i class="pi pi-th-large"></i>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/tasks" class="sidebar-link" @click="closeMobileMenu">
            <i class="pi pi-check-circle"></i>
            <span>Tasks</span>
          </router-link>
          <router-link to="/notes" class="sidebar-link" @click="closeMobileMenu">
            <i class="pi pi-file"></i>
            <span>Notes</span>
          </router-link>
          <router-link to="/scheduling" class="sidebar-link" @click="closeMobileMenu">
            <i class="pi pi-users"></i>
            <span>Meetings</span>
          </router-link>
          <router-link to="/settings" class="sidebar-link" @click="closeMobileMenu">
            <i class="pi pi-cog"></i>
            <span>Settings</span>
          </router-link>
        </nav>

        <!-- User Profile -->
        <div class="sidebar-user">
          <div class="user-profile">
            <div class="user-avatar">
              <span>{{ getUserInitials }}</span>
            </div>
            <div class="user-info">
              <div class="user-name">{{ getUserName }}</div>
              <div class="user-action">{{ authStore.user?.email }}</div>
            </div>
          </div>
          <button class="dropdown-link" @click="themeStore.toggleTheme">
            <i :class="themeStore.currentTheme === 'light' ? 'pi pi-moon' : 'pi pi-sun'"></i>
            <span>{{ themeStore.currentTheme === 'light' ? 'Dark Mode' : 'Light Mode' }}</span>
          </button>
          <button class="dropdown-link danger" @click="handleSignOut">
            <i class="pi pi-sign-out"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </transition>

    <!-- Mobile Menu Button -->
    <button
      ref="mobileMenuButtonRef"
      class="mobile-menu-btn"
      :aria-label="showMobileMenu ? 'Close menu' : 'Open menu'"
      :aria-expanded="showMobileMenu"
      aria-controls="mobile-menu"
      @click="toggleMobileMenu"
    >
      <i :class="showMobileMenu ? 'pi pi-times' : 'pi pi-bars'" aria-hidden="true"></i>
    </button>

    <!-- Command Palette (⌘K / Ctrl+K) -->
    <CommandPalette />

    <!-- Global FAB for quick actions -->
    <GlobalFAB />

    <!-- Session Timeout Warning (FR-039, FR-040, SC-011) -->
    <SessionTimeoutWarning
      v-model:visible="isWarningVisible"
      :remaining-time="remainingTimeFormatted"
      @extend="handleExtendSession"
      @logout="handleSessionLogout"
    />
  </div>
</template>

<style scoped>
@reference "tailwindcss";

/* ============================================
   SKIP LINK - Accessibility
   ============================================ */

.skip-link {
  @apply absolute top-0 left-0 z-[100]
         px-4 py-2
         bg-blue-600 text-white
         transform -translate-y-full
         transition-transform duration-200
         font-medium rounded-br-lg
         focus:translate-y-0
         outline-none
         focus:ring-2 focus:ring-blue-300;
}

.skip-link:not(:focus) {
  @apply sr-only;
}

/* ============================================
   APP CONTAINER - Sidebar Layout
   ============================================ */

.app-container {
  @apply min-h-screen flex;
}

/* ============================================
   SIDEBAR - Left Navigation
   ============================================ */

.app-sidebar {
  @apply fixed left-0 top-0 bottom-0
         w-60
         bg-white
         border-r border-gray-200
         flex flex-col
         hidden lg:flex
         transition-colors duration-200;
}

.app-sidebar.sidebar-dark {
  @apply bg-gray-900 border-gray-800;
}

.app-sidebar.sidebar-dark .sidebar-logo {
  @apply border-gray-800;
}

.app-sidebar.sidebar-dark .sidebar-link {
  @apply text-gray-300 hover:bg-gray-800;
}

.app-sidebar.sidebar-dark .sidebar-link i {
  @apply text-gray-400;
}

.app-sidebar.sidebar-dark .sidebar-link:hover i {
  @apply text-gray-200;
}

.app-sidebar.sidebar-dark .sidebar-link.router-link-active {
  @apply bg-blue-950/30 text-blue-400;
}

.app-sidebar.sidebar-dark .sidebar-link.router-link-active i {
  @apply text-blue-400;
}

.app-sidebar.sidebar-dark .user-name {
  @apply text-white;
}

.app-sidebar.sidebar-dark .user-action {
  @apply text-gray-400;
}

.app-sidebar.sidebar-dark .user-profile:hover {
  @apply bg-gray-800;
}

.app-sidebar.sidebar-dark .user-dropdown {
  @apply bg-gray-900 border-gray-800;
}

.app-sidebar.sidebar-dark .dropdown-link {
  @apply text-gray-100 hover:bg-gray-800;
}

.app-sidebar.sidebar-dark .dropdown-link i {
  @apply text-gray-400;
}

.app-sidebar.sidebar-dark .dropdown-link:hover {
  @apply text-white;
}

.app-sidebar.sidebar-dark .dropdown-link:hover i {
  @apply text-white;
}

.app-sidebar.sidebar-dark .dropdown-link.danger {
  @apply text-red-400 hover:bg-red-950/30 hover:text-red-300;
}

.app-sidebar.sidebar-dark .dropdown-link.danger i {
  @apply text-red-400;
}

.app-sidebar.sidebar-dark .dropdown-link.danger:hover i {
  @apply text-red-300;
}

.sidebar-logo {
  @apply p-6 border-b border-gray-200 dark:border-gray-800;
}

.sidebar-nav {
  @apply flex-1 px-3 py-4 space-y-1 overflow-y-auto;
}

.sidebar-link {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-lg
         text-sm font-medium
         text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-gray-800
         transition-all duration-150
         no-underline;
}

.sidebar-link i {
  @apply text-base text-gray-600 dark:text-gray-400;
}

.sidebar-link:hover i {
  @apply text-gray-900 dark:text-gray-200;
}

.sidebar-link.router-link-active {
  @apply bg-blue-50 dark:bg-blue-950/30
         text-blue-600 dark:text-blue-400;
}

.sidebar-link.router-link-active i {
  @apply text-blue-600 dark:text-blue-400;
}

/* ============================================
   SIDEBAR USER PROFILE
   ============================================ */

.sidebar-user {
  @apply relative p-3 border-t border-gray-200 dark:border-gray-800
         mt-auto;
}

.user-profile {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg
         hover:bg-gray-50 dark:hover:bg-gray-800
         cursor-pointer
         transition-all duration-150;
}

.user-avatar {
  @apply w-9 h-9 rounded-full
         bg-gradient-to-br from-orange-400 to-pink-500
         flex items-center justify-center
         text-white font-semibold text-sm
         flex-shrink-0;
}

.user-info {
  @apply flex-1 min-w-0;
}

.user-name {
  @apply text-sm font-medium text-gray-900 dark:text-white truncate;
}

.user-action {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.user-dropdown {
  @apply absolute bottom-full left-3 right-3 mb-3
         bg-white dark:bg-gray-900
         border border-gray-200 dark:border-gray-800
         rounded-xl shadow-2xl
         py-2
         overflow-hidden
         z-50;
}

.dropdown-link {
  @apply w-full flex items-center gap-3 px-4 py-3
         text-sm font-medium
         text-gray-900 dark:text-gray-100
         hover:bg-gray-50 dark:hover:bg-gray-800
         active:bg-gray-100 dark:active:bg-gray-700
         transition-all duration-150
         cursor-pointer
         border-0 bg-transparent;
}

.dropdown-link i {
  @apply text-lg text-gray-600 dark:text-gray-400;
}

.dropdown-link:hover {
  @apply text-gray-900 dark:text-white;
}

.dropdown-link:hover i {
  @apply text-gray-900 dark:text-white;
}

.dropdown-link.danger {
  @apply text-red-600 dark:text-red-400
         hover:bg-red-50 dark:hover:bg-red-950/30
         hover:text-red-700 dark:hover:text-red-300;
}

.dropdown-link.danger i {
  @apply text-red-600 dark:text-red-400;
}

.dropdown-link.danger:hover i {
  @apply text-red-700 dark:text-red-300;
}

/* ============================================
   MAIN CONTENT AREA
   ============================================ */

.app-main {
  @apply flex-1 flex flex-col
         lg:ml-60
         bg-white
         transition-colors duration-200;
}

.app-main.main-dark {
  @apply bg-gray-900;
}

.main-header {
  @apply border-b border-gray-200
         bg-white;
}

.app-main.main-dark .main-header {
  @apply border-gray-800 bg-gray-900;
}

.main-content {
  @apply flex-1 p-6 lg:p-8
         bg-white;
}

.app-main.main-dark .main-content {
  @apply bg-gray-900;
}

/* ============================================
   MOBILE MENU
   ============================================ */

.mobile-menu-btn {
  @apply lg:hidden fixed bottom-6 right-6
         w-14 h-14 rounded-full
         bg-blue-600 text-white
         shadow-lg hover:shadow-xl
         hover:bg-blue-700
         transition-all duration-200
         flex items-center justify-center
         z-50;
}

.mobile-menu-btn i {
  @apply text-xl;
}

.mobile-overlay {
  @apply lg:hidden fixed inset-0 bg-black/50 z-40
         backdrop-blur-sm;
}

.mobile-sidebar {
  @apply lg:hidden fixed left-0 top-0 bottom-0
         w-72 bg-white
         shadow-2xl z-50
         flex flex-col
         transition-colors duration-200;
}

.mobile-sidebar.sidebar-dark {
  @apply bg-gray-900;
}

.mobile-sidebar .sidebar-logo {
  @apply flex items-center justify-between;
}

.close-btn {
  @apply w-11 h-11 rounded-lg
         flex items-center justify-center
         text-gray-600 dark:text-gray-400
         hover:bg-gray-100 dark:hover:bg-gray-800
         hover:text-gray-900 dark:hover:text-gray-200
         transition-all duration-150;
}

/* ============================================
   ANIMATIONS
   ============================================ */

.menu-slide-enter-active,
.menu-slide-leave-active {
  @apply transition-all duration-200 ease-out;
}

.menu-slide-enter-from,
.menu-slide-leave-to {
  @apply opacity-0 translate-y-2;
}

.mobile-slide-enter-active,
.mobile-slide-leave-active {
  @apply transition-transform duration-300 ease-out;
}

.mobile-slide-enter-from,
.mobile-slide-leave-to {
  @apply -translate-x-full;
}
</style>
