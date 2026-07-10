import { useState, useEffect, useCallback } from 'react'
import { getTheme, toggleTheme, onThemeChange } from '../core/theme'
import { getLocale, setLocale, onLocaleChange, t, getDirection } from '../i18n'
import type { Theme, Locale } from '../types'

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState(getTheme)
  useEffect(() => onThemeChange(() => setTheme(getTheme)), [])
  return [theme, toggleTheme]
}

export function useLocale(): [Locale, (l: Locale) => void, () => void] {
  const [locale, setLoc] = useState(getLocale)
  const change = useCallback((l: Locale) => { setLocale(l); setLoc(l) }, [])
  useEffect(() => onLocaleChange(() => setLoc(getLocale())), [])
  return [locale, change, getDirection]
}

export function useT() {
  const [, forceUpdate] = useState(0)
  useEffect(() => onLocaleChange(() => forceUpdate(n => n + 1)), [])
  return t
}

export function useKeyPress(key: string, handler: () => void) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === key) handler() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [key, handler])
}
