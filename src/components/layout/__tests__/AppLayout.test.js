import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import AppLayout from '../AppLayout.vue'
import GlobalFAB from '@/components/global/GlobalFAB.vue'
import CommandPalette from '@/components/global/CommandPalette.vue'

// Mock vue-router
const mockPush = vi.fn()
const mockRoute = { meta: { showHeader: true } }

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => mockRoute
}))

describe('AppLayout.vue', () => {
  let wrapper
  let authStore
  let themeStore

  const createWrapper = (userMetadata = {}) =>
    mount(AppLayout, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              auth: {
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                  user_metadata: userMetadata
                }
              },
              theme: {
                currentTheme: 'light'
              }
            }
          })
        ],
        components: {
          GlobalFAB,
          CommandPalette
        },
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
            props: ['to']
          },
          Teleport: true
        }
      },
      slots: {
        default: '<div>Main Content</div>'
      }
    })

  beforeEach(() => {
    mockPush.mockClear()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Structure', () => {
    it('should render without errors', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render sidebar', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.app-sidebar').exists()).toBe(true)
    })

    it('should render main content area', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.app-main').exists()).toBe(true)
    })

    it('should render slot content', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Main Content')
    })

    it('should render GlobalFAB component', () => {
      wrapper = createWrapper()
      expect(wrapper.findComponent(GlobalFAB).exists()).toBe(true)
    })

    it('should render CommandPalette component', () => {
      wrapper = createWrapper()
      expect(wrapper.findComponent(CommandPalette).exists()).toBe(true)
    })
  })

  describe('Skip Link', () => {
    it('should render skip to main content link', () => {
      wrapper = createWrapper()
      const skipLink = wrapper.find('.skip-link')
      expect(skipLink.exists()).toBe(true)
      expect(skipLink.text()).toBe('Skip to main content')
    })

    it('should link to main content', () => {
      wrapper = createWrapper()
      const skipLink = wrapper.find('.skip-link')
      expect(skipLink.attributes('href')).toBe('#main-content')
    })
  })

  describe('Sidebar Navigation', () => {
    it('should render all navigation links', () => {
      wrapper = createWrapper()
      const links = wrapper.findAll('.sidebar-link')
      expect(links.length).toBeGreaterThanOrEqual(5)
    })

    it('should have Dashboard link', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Dashboard')
    })

    it('should have Tasks link', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Tasks')
    })

    it('should have Notes link', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Notes')
    })

    it('should have Meetings link', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Meetings')
    })

    it('should have Settings link', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Settings')
    })
  })

  describe('User Profile', () => {
    it('should display user name from full_name', () => {
      wrapper = createWrapper({ full_name: 'John Doe' })
      authStore = wrapper.vm.$pinia.state.value.auth
      const userName = wrapper.vm.getUserName
      expect(userName).toBe('John')
    })

    it('should display user name from email when no full_name', () => {
      wrapper = createWrapper()
      const userName = wrapper.vm.getUserName
      expect(userName).toBe('test')
    })

    it('should display user initials from full_name', () => {
      wrapper = createWrapper({ full_name: 'John Doe' })
      const initials = wrapper.vm.getUserInitials
      expect(initials).toBe('JD')
    })

    it('should display user initials from single name', () => {
      wrapper = createWrapper({ full_name: 'John' })
      const initials = wrapper.vm.getUserInitials
      expect(initials).toBe('J')
    })

    it('should display user initials from email when no full_name', () => {
      wrapper = createWrapper()
      const initials = wrapper.vm.getUserInitials
      expect(initials).toBe('TE')
    })

    it('should render user avatar', () => {
      wrapper = createWrapper()
      const avatar = wrapper.find('.user-avatar')
      expect(avatar.exists()).toBe(true)
    })

    it('should display user initials in avatar', () => {
      wrapper = createWrapper({ full_name: 'John Doe' })
      const avatar = wrapper.find('.user-avatar')
      expect(avatar.text()).toBe('JD')
    })
  })

  describe('User Menu', () => {
    it('should not show user menu by default', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.showUserMenu).toBe(false)
    })

    it('should toggle user menu when profile is clicked', async () => {
      wrapper = createWrapper()
      const userProfile = wrapper.find('.user-profile')

      await userProfile.trigger('click')
      expect(wrapper.vm.showUserMenu).toBe(true)

      await userProfile.trigger('click')
      expect(wrapper.vm.showUserMenu).toBe(false)
    })

    it('should show theme toggle in user menu', async () => {
      wrapper = createWrapper()
      await wrapper.vm.toggleUserMenu()
      await wrapper.vm.$nextTick()

      const dropdown = wrapper.find('.user-dropdown')
      expect(dropdown.exists()).toBe(true)
    })

    it('should show sign out button in user menu', async () => {
      wrapper = createWrapper()
      await wrapper.vm.toggleUserMenu()
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Sign Out')
    })

    it('should close user menu when mobile menu is opened', async () => {
      wrapper = createWrapper()
      wrapper.vm.showUserMenu = true

      await wrapper.vm.toggleMobileMenu()
      expect(wrapper.vm.showUserMenu).toBe(false)
    })
  })

  describe('Mobile Menu', () => {
    it('should not show mobile menu by default', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.showMobileMenu).toBe(false)
    })

    it('should render mobile menu button', () => {
      wrapper = createWrapper()
      const mobileBtn = wrapper.find('.mobile-menu-btn')
      expect(mobileBtn.exists()).toBe(true)
    })

    it('should toggle mobile menu when button is clicked', async () => {
      wrapper = createWrapper()
      const mobileBtn = wrapper.find('.mobile-menu-btn')

      await mobileBtn.trigger('click')
      expect(wrapper.vm.showMobileMenu).toBe(true)
    })

    it('should show overlay when mobile menu is open', async () => {
      wrapper = createWrapper()
      wrapper.vm.showMobileMenu = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.mobile-overlay').exists()).toBe(true)
    })

    it('should close mobile menu when overlay is clicked', async () => {
      wrapper = createWrapper()
      wrapper.vm.showMobileMenu = true
      await wrapper.vm.$nextTick()

      await wrapper.find('.mobile-overlay').trigger('click')
      expect(wrapper.vm.showMobileMenu).toBe(false)
    })

    it('should close user menu when mobile menu is opened', async () => {
      wrapper = createWrapper()
      wrapper.vm.showUserMenu = true

      await wrapper.vm.toggleMobileMenu()
      expect(wrapper.vm.showUserMenu).toBe(false)
    })
  })

  describe('Sign Out', () => {
    it('should call signOut on auth store when sign out is clicked', async () => {
      wrapper = createWrapper()
      const authStoreInstance = wrapper.vm.authStore
      const signOutSpy = vi
        .spyOn(authStoreInstance, 'signOut')
        .mockImplementation(() => Promise.resolve())

      await wrapper.vm.handleSignOut()

      expect(signOutSpy).toHaveBeenCalled()
    })

    it('should navigate to login after sign out', async () => {
      wrapper = createWrapper()
      authStore = wrapper.vm.$pinia.state.value.auth
      authStore.signOut = vi.fn()

      await wrapper.vm.handleSignOut()

      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should close user menu after sign out', async () => {
      wrapper = createWrapper()
      authStore = wrapper.vm.$pinia.state.value.auth
      authStore.signOut = vi.fn()
      wrapper.vm.showUserMenu = true

      await wrapper.vm.handleSignOut()

      expect(wrapper.vm.showUserMenu).toBe(false)
    })
  })

  describe('Theme Switching', () => {
    it('should apply dark class to sidebar when theme is dark', async () => {
      wrapper = createWrapper()
      themeStore = wrapper.vm.$pinia.state.value.theme
      themeStore.currentTheme = 'dark'
      await wrapper.vm.$nextTick()

      const sidebar = wrapper.find('.app-sidebar')
      expect(sidebar.classes()).toContain('sidebar-dark')
    })

    it('should apply dark class to main when theme is dark', async () => {
      wrapper = createWrapper()
      themeStore = wrapper.vm.$pinia.state.value.theme
      themeStore.currentTheme = 'dark'
      await wrapper.vm.$nextTick()

      const main = wrapper.find('.app-main')
      expect(main.classes()).toContain('main-dark')
    })

    it('should not apply dark class when theme is light', () => {
      wrapper = createWrapper()
      const sidebar = wrapper.find('.app-sidebar')
      expect(sidebar.classes()).not.toContain('sidebar-dark')
    })
  })

  describe('Accessibility', () => {
    it('should have main content with id', () => {
      wrapper = createWrapper()
      const main = wrapper.find('#main-content')
      expect(main.exists()).toBe(true)
    })

    it('should have main content with tabindex -1', () => {
      wrapper = createWrapper()
      const main = wrapper.find('#main-content')
      expect(main.attributes('tabindex')).toBe('-1')
    })

    it('should have mobile menu with role dialog', async () => {
      wrapper = createWrapper()
      wrapper.vm.showMobileMenu = true
      await wrapper.vm.$nextTick()

      const mobileMenu = wrapper.find('#mobile-menu')
      expect(mobileMenu.attributes('role')).toBe('dialog')
    })

    it('should have mobile menu with aria-modal', async () => {
      wrapper = createWrapper()
      wrapper.vm.showMobileMenu = true
      await wrapper.vm.$nextTick()

      const mobileMenu = wrapper.find('#mobile-menu')
      expect(mobileMenu.attributes('aria-modal')).toBe('true')
    })

    it('should have mobile menu button with aria-expanded', () => {
      wrapper = createWrapper()
      const mobileBtn = wrapper.find('.mobile-menu-btn')
      expect(mobileBtn.attributes('aria-expanded')).toBeDefined()
    })

    it('should update aria-expanded when mobile menu toggles', async () => {
      wrapper = createWrapper()
      const mobileBtn = wrapper.find('.mobile-menu-btn')

      expect(mobileBtn.attributes('aria-expanded')).toBe('false')

      await mobileBtn.trigger('click')
      expect(mobileBtn.attributes('aria-expanded')).toBe('true')
    })
  })

  describe('Logo', () => {
    it('should render logo in sidebar', () => {
      wrapper = createWrapper()
      const logo = wrapper.find('.sidebar-logo img')
      expect(logo.exists()).toBe(true)
    })

    it('should have alt text on logo', () => {
      wrapper = createWrapper()
      const logo = wrapper.find('.sidebar-logo img')
      expect(logo.attributes('alt')).toBe('Coordino')
    })
  })

  describe('Click Outside Handler', () => {
    it('should close user menu when clicking outside', async () => {
      wrapper = createWrapper()
      wrapper.vm.showUserMenu = true

      const clickEvent = new Event('click')
      Object.defineProperty(clickEvent, 'target', {
        value: document.body,
        enumerable: true
      })
      document.dispatchEvent(clickEvent)

      await wrapper.vm.$nextTick()
      expect(wrapper.vm.showUserMenu).toBe(false)
    })
  })
})
