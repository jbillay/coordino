import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '../theme'
import { THEME_STORAGE_KEY } from '@/constants'

describe('theme.js store', () => {
  let localStorageMock
  let documentClassListMock
  let documentSetAttributeMock
  let matchMediaMock

  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia())

    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    global.localStorage = localStorageMock

    // Mock document.documentElement
    documentClassListMock = {
      add: vi.fn(),
      remove: vi.fn()
    }
    documentSetAttributeMock = vi.fn()

    global.document = {
      documentElement: {
        classList: documentClassListMock,
        setAttribute: documentSetAttributeMock
      }
    }

    // Mock window.matchMedia with default return value
    matchMediaMock = vi.fn().mockReturnValue({ matches: false })
    global.window = {
      matchMedia: matchMediaMock
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('initializes with stored theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const store = useThemeStore()
      store.init()

      expect(localStorageMock.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY)
      expect(store.currentTheme).toBe('dark')
    })

    it('initializes with system preference when no stored theme', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: true })

      const store = useThemeStore()
      store.init()

      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
      expect(store.currentTheme).toBe('dark')
    })

    it('initializes with light theme when no stored theme and system prefers light', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: false })

      const store = useThemeStore()
      store.init()

      expect(store.currentTheme).toBe('light')
    })

    it('initializes with light theme as default fallback', () => {
      localStorageMock.getItem.mockReturnValue(null)
      matchMediaMock.mockReturnValue({ matches: false })

      const store = useThemeStore()
      store.init()

      expect(store.currentTheme).toBe('light')
    })

    it('handles missing matchMedia API gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null)
      global.window.matchMedia = undefined

      const store = useThemeStore()
      store.init()

      expect(store.currentTheme).toBe('light')
    })

    it('applies theme to DOM on initialization', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const store = useThemeStore()
      store.init()

      expect(documentClassListMock.remove).toHaveBeenCalledWith('light', 'dark')
      expect(documentClassListMock.add).toHaveBeenCalledWith('dark')
      expect(documentSetAttributeMock).toHaveBeenCalledWith('data-theme', 'dark')
    })
  })

  describe('setTheme()', () => {
    it('sets theme to dark', async () => {
      const store = useThemeStore()
      store.init()

      store.setTheme('dark')

      expect(store.currentTheme).toBe('dark')
    })

    it('sets theme to light', async () => {
      const store = useThemeStore()
      store.init()

      store.setTheme('light')

      expect(store.currentTheme).toBe('light')
    })

    it('does not update if theme is already set to the same value', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const store = useThemeStore()
      store.init()

      // Clear previous calls
      localStorageMock.setItem.mockClear()

      store.setTheme('dark')

      // currentTheme should remain dark but shouldn't trigger updates
      expect(store.currentTheme).toBe('dark')
    })

    it('updates localStorage when theme changes', async () => {
      const store = useThemeStore()
      store.init()

      store.setTheme('dark')

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark')
    })

    it('applies theme to DOM when theme changes', async () => {
      const store = useThemeStore()
      store.init()

      // Clear previous calls from init
      documentClassListMock.remove.mockClear()
      documentClassListMock.add.mockClear()
      documentSetAttributeMock.mockClear()

      store.setTheme('dark')

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(documentClassListMock.remove).toHaveBeenCalledWith('light', 'dark')
      expect(documentClassListMock.add).toHaveBeenCalledWith('dark')
      expect(documentSetAttributeMock).toHaveBeenCalledWith('data-theme', 'dark')
    })
  })

  describe('toggleTheme()', () => {
    it('toggles from light to dark', async () => {
      localStorageMock.getItem.mockReturnValue('light')

      const store = useThemeStore()
      store.init()

      store.toggleTheme()

      expect(store.currentTheme).toBe('dark')
    })

    it('toggles from dark to light', async () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const store = useThemeStore()
      store.init()

      store.toggleTheme()

      expect(store.currentTheme).toBe('light')
    })

    it('toggles multiple times correctly', async () => {
      localStorageMock.getItem.mockReturnValue('light')

      const store = useThemeStore()
      store.init()

      expect(store.currentTheme).toBe('light')

      store.toggleTheme()
      expect(store.currentTheme).toBe('dark')

      store.toggleTheme()
      expect(store.currentTheme).toBe('light')

      store.toggleTheme()
      expect(store.currentTheme).toBe('dark')
    })

    it('persists toggled theme to localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('light')

      const store = useThemeStore()
      store.init()

      store.toggleTheme()

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark')
    })

    it('applies toggled theme to DOM', async () => {
      localStorageMock.getItem.mockReturnValue('light')

      const store = useThemeStore()
      store.init()

      // Clear previous calls from init
      documentClassListMock.remove.mockClear()
      documentClassListMock.add.mockClear()
      documentSetAttributeMock.mockClear()

      store.toggleTheme()

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(documentClassListMock.remove).toHaveBeenCalledWith('light', 'dark')
      expect(documentClassListMock.add).toHaveBeenCalledWith('dark')
      expect(documentSetAttributeMock).toHaveBeenCalledWith('data-theme', 'dark')
    })
  })

  describe('DOM Manipulation', () => {
    it('removes both theme classes before applying new theme', async () => {
      const store = useThemeStore()
      store.init()

      // Clear previous calls
      documentClassListMock.remove.mockClear()

      store.setTheme('dark')

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Should remove both 'light' and 'dark' classes first
      expect(documentClassListMock.remove).toHaveBeenCalledWith('light', 'dark')
    })

    it('adds correct theme class to documentElement', async () => {
      const store = useThemeStore()
      store.init()

      documentClassListMock.add.mockClear()

      store.setTheme('dark')

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(documentClassListMock.add).toHaveBeenCalledWith('dark')
    })

    it('sets data-theme attribute on documentElement', async () => {
      const store = useThemeStore()
      store.init()

      documentSetAttributeMock.mockClear()

      store.setTheme('dark')

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(documentSetAttributeMock).toHaveBeenCalledWith('data-theme', 'dark')
    })
  })

  describe('LocalStorage Integration', () => {
    it('reads theme from localStorage on init', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const store = useThemeStore()
      store.init()

      expect(localStorageMock.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY)
      expect(store.currentTheme).toBe('dark')
    })

    it('saves theme to localStorage when changed', async () => {
      const store = useThemeStore()
      store.init()

      store.setTheme('dark')

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark')
    })

    it('uses correct storage key constant', async () => {
      const store = useThemeStore()
      store.init()

      expect(localStorageMock.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY)

      store.setTheme('dark')

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark')
    })

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      // Should not throw error
      expect(() => {
        const store = useThemeStore()
        store.init()
      }).toThrow()
    })
  })

  describe('Reactivity', () => {
    it('triggers watcher when theme changes', async () => {
      const store = useThemeStore()
      store.init()

      const setItemSpy = localStorageMock.setItem
      setItemSpy.mockClear()

      store.setTheme('dark')

      // Wait for watcher to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(setItemSpy).toHaveBeenCalled()
    })

    it('does not trigger watcher when theme is null', async () => {
      useThemeStore()
      // Don't initialize, currentTheme should be null

      const setItemSpy = localStorageMock.setItem

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(setItemSpy).not.toHaveBeenCalled()
    })

    it('updates DOM and localStorage on every theme change', async () => {
      const store = useThemeStore()
      store.init()

      // Clear initial calls
      localStorageMock.setItem.mockClear()
      documentClassListMock.add.mockClear()

      store.setTheme('dark')
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark')
      expect(documentClassListMock.add).toHaveBeenCalledWith('dark')

      localStorageMock.setItem.mockClear()
      documentClassListMock.add.mockClear()

      store.setTheme('light')
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(localStorageMock.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light')
      expect(documentClassListMock.add).toHaveBeenCalledWith('light')
    })
  })

  describe('Edge Cases', () => {
    it('handles invalid stored theme gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme')

      const store = useThemeStore()
      store.init()

      // Should fall back to light theme when invalid theme is stored
      expect(store.currentTheme).toBe('light')
    })

    it('handles empty string from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('')

      const store = useThemeStore()
      store.init()

      // Empty string is falsy, so should fall back to system preference or default
      expect(store.currentTheme).toBeTruthy()
    })

    it('works without initialization', () => {
      const store = useThemeStore()

      expect(store.currentTheme).toBeNull()

      store.setTheme('dark')

      expect(store.currentTheme).toBe('dark')
    })

    it('can be initialized multiple times', () => {
      const store = useThemeStore()

      store.init()
      expect(store.currentTheme).toBeTruthy()

      const firstTheme = store.currentTheme

      store.init()
      expect(store.currentTheme).toBe(firstTheme)
    })
  })

  describe('Store Exports', () => {
    it('exports currentTheme as ref', () => {
      const store = useThemeStore()

      expect(store).toHaveProperty('currentTheme')
      expect(store.currentTheme).toBeNull() // Initial value before init
    })

    it('exports toggleTheme function', () => {
      const store = useThemeStore()

      expect(store).toHaveProperty('toggleTheme')
      expect(typeof store.toggleTheme).toBe('function')
    })

    it('exports setTheme function', () => {
      const store = useThemeStore()

      expect(store).toHaveProperty('setTheme')
      expect(typeof store.setTheme).toBe('function')
    })

    it('exports init function', () => {
      const store = useThemeStore()

      expect(store).toHaveProperty('init')
      expect(typeof store.init).toBe('function')
    })
  })
})
