import { ref } from 'vue'

const STORAGE_KEY = 'wollner-theme'
const isDark = ref(false)

export function initializeTheme() {
  isDark.value = window.localStorage.getItem(STORAGE_KEY) === 'dark'
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
}

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
    document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
    window.localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  }

  return { isDark, toggleTheme }
}
