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
  const currentTheme = ref(null)

  function getInitialTheme() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored) {
      return stored
    }
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  function applyTheme(theme) {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    document.documentElement.setAttribute('data-theme', theme)
  }

  function setTheme(theme) {
    if (currentTheme.value !== theme) {
      currentTheme.value = theme
    }
  }

  function toggleTheme() {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  function init() {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)

    watch(currentTheme, (newTheme) => {
      if (newTheme) {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme)
        applyTheme(newTheme)
      }
    })
  }

  return {
    currentTheme,
    toggleTheme,
    setTheme,
    init
  }
})
