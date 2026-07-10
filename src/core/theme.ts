import type { Theme } from '../types'

let currentTheme: Theme = (localStorage.getItem('theme') as Theme) || 'dark'
const listeners = new Set<() => void>()

export function getTheme(): Theme { return currentTheme }
export function setTheme(theme: Theme) {
  currentTheme = theme
  localStorage.setItem('theme', theme)
  applyTheme()
  listeners.forEach(fn => fn())
}
export function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark')
}
export function onThemeChange(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function applyTheme() {
  const r = document.documentElement
  if (currentTheme === 'dark') {
    r.setAttribute('data-theme', 'dark')
    r.style.colorScheme = 'dark'
  } else {
    r.setAttribute('data-theme', 'light')
    r.style.colorScheme = 'light'
  }
}

// Apply on load
applyTheme()
