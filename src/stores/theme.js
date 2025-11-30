import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { THEME_STORAGE_KEY } from '@/constants'

/**
 * Theme Store
 * Manages application theme (light/dark mode) with localStorage persistence
 *
 * @example
 * const themeStore = useThemeStore()
 * themeStore.toggleTheme()
 * themeStore.setTheme('dark')
 */
export const useThemeStore = defineStore('theme', () => {
  /**
   * Gets initial theme from localStorage or system preference
   * @returns {('light'|'dark')} Theme mode
   * @private
   */
  const getInitialTheme = () => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored) {
      return stored
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }

    return 'light'
  }

  /**
   * Current theme mode
   * @type {import('vue').Ref<'light'|'dark'>}
   */
  const currentTheme = ref(getInitialTheme())

  /**
   * Applies theme to document by updating classes and attributes
   * @param {('light'|'dark')} theme - Theme to apply
   * @private
   */
  const applyTheme = (theme) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    document.documentElement.setAttribute('data-theme', theme)
  }

  // Watch for theme changes and persist to localStorage
  watch(
    currentTheme,
    (newTheme) => {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      applyTheme(newTheme)
    },
    { immediate: true }
  )

  /**
   * Toggles between light and dark theme
   * @public
   */
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }

  /**
   * Sets theme to specific mode
   * @param {('light'|'dark')} theme - Theme mode to set
   * @public
   */
  const setTheme = (theme) => {
    currentTheme.value = theme
  }

  return {
    currentTheme,
    toggleTheme,
    setTheme
  }
})
