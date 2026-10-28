import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'soolect_admin_theme'
const Ctx = createContext({ theme: 'light', toggle: () => {} })
export const useTheme = () => useContext(Ctx)

const initial = () => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch { return 'light' }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initial)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(KEY, theme) } catch { /* private mode */ }
  }, [theme])
  return <Ctx.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }}>{children}</Ctx.Provider>
}

export function ThemeToggle({ full, className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return full
    ? <button className={`btn ghost sm ${className}`} onClick={toggle}>{dark ? '☀ Light mode' : '☾ Dark mode'}</button>
    : <button className={`icon-btn ${className}`} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'} onClick={toggle}>{dark ? '☀' : '☾'}</button>
}
