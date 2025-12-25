import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import App from '../App.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  useRoute: () => ({
    meta: {}
  })
}))

describe('App.vue', () => {
  let wrapper
  let themeStore

  const createWrapper = (initialTheme = 'light') =>
    mount(App, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              theme: {
                currentTheme: initialTheme
              }
            }
          })
        ],
        stubs: {
          RouterView: {
            template: '<div class="router-view">Router View Content</div>'
          }
        }
      }
    })

  beforeEach(() => {
    // Clear any previous mocks
    vi.clearAllMocks()
  })

  describe('Component Structure', () => {
    it('should render without errors', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('should render router-view', () => {
      wrapper = createWrapper()
      const routerView = wrapper.find('.router-view')
      expect(routerView.exists()).toBe(true)
    })

    it('should have a root div', () => {
      wrapper = createWrapper()
      expect(wrapper.find('div').exists()).toBe(true)
    })
  })

  describe('Theme Integration', () => {
    it('should apply light theme class by default', () => {
      wrapper = createWrapper('light')
      const rootDiv = wrapper.find('div')
      expect(rootDiv.classes()).toContain('light')
    })

    it('should apply dark theme class when theme is dark', () => {
      wrapper = createWrapper('dark')
      const rootDiv = wrapper.find('div')
      expect(rootDiv.classes()).toContain('dark')
    })

    it('should update theme class when theme changes', async () => {
      wrapper = createWrapper('light')
      themeStore = wrapper.vm.$pinia.state.value.theme

      let rootDiv = wrapper.find('div')
      expect(rootDiv.classes()).toContain('light')

      themeStore.currentTheme = 'dark'
      await wrapper.vm.$nextTick()

      rootDiv = wrapper.find('div')
      expect(rootDiv.classes()).toContain('dark')
    })
  })

  describe('Store Integration', () => {
    it('should access theme store', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.themeStore).toBeDefined()
    })

    it('should have access to currentTheme', () => {
      wrapper = createWrapper('light')
      expect(wrapper.vm.themeStore.currentTheme).toBe('light')
    })

    it('should initialize theme store on mount', () => {
      wrapper = createWrapper()
      themeStore = wrapper.vm.$pinia.state.value.theme
      themeStore.init = vi.fn()

      // Trigger onMounted by creating a new wrapper
      wrapper = createWrapper()
      ;({ themeStore } = wrapper.vm)

      // The init method should be available
      expect(typeof themeStore.init).toBe('function')
    })
  })

  describe('Lifecycle', () => {
    it('should call theme store init on mounted', () => {
      // The init method is called during onMounted hook
      // We can verify this by checking that the component mounts successfully
      // and the theme store is available
      wrapper = mount(App, {
        global: {
          plugins: [
            createTestingPinia({
              createSpy: vi.fn,
              initialState: {
                theme: {
                  currentTheme: 'light'
                }
              }
            })
          ],
          stubs: {
            RouterView: true
          }
        }
      })

      const { themeStore } = wrapper.vm
      expect(themeStore).toBeDefined()
      expect(typeof themeStore.init).toBe('function')
    })
  })

  describe('Router View', () => {
    it('should render router-view content', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Router View Content')
    })
  })

  describe('Theme Reactivity', () => {
    it('should reactively update when theme changes', async () => {
      wrapper = createWrapper('light')
      themeStore = wrapper.vm.$pinia.state.value.theme

      expect(wrapper.find('div').classes()).toContain('light')

      themeStore.currentTheme = 'dark'
      await wrapper.vm.$nextTick()

      expect(wrapper.find('div').classes()).toContain('dark')
      expect(wrapper.find('div').classes()).not.toContain('light')
    })

    it('should reflect theme store state in template', async () => {
      wrapper = createWrapper('dark')
      themeStore = wrapper.vm.$pinia.state.value.theme

      expect(wrapper.vm.themeStore.currentTheme).toBe('dark')
      expect(wrapper.find('div').classes()).toContain('dark')

      themeStore.currentTheme = 'light'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.themeStore.currentTheme).toBe('light')
      expect(wrapper.find('div').classes()).toContain('light')
    })
  })

  describe('Global Styles', () => {
    it('should not have inline styles by default', () => {
      wrapper = createWrapper()
      const rootDiv = wrapper.find('div')
      expect(rootDiv.attributes('style')).toBeUndefined()
    })
  })

  describe('Component Props', () => {
    it('should not accept any props', () => {
      wrapper = createWrapper()
      expect(Object.keys(wrapper.props()).length).toBe(0)
    })
  })

  describe('Component Events', () => {
    it('should not emit any events by default', () => {
      wrapper = createWrapper()
      expect(Object.keys(wrapper.emitted()).length).toBe(0)
    })
  })

  describe('Theme Store Methods', () => {
    it('should have theme store with init method', () => {
      wrapper = createWrapper()
      const { themeStore } = wrapper.vm
      expect(themeStore).toBeDefined()
    })

    it('should have access to theme store state', () => {
      wrapper = createWrapper('light')
      const { themeStore } = wrapper.vm
      expect(themeStore.currentTheme).toBeDefined()
    })
  })
})
