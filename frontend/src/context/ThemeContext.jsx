import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

function initialTheme() {
  try {
    const saved = localStorage.getItem('nc_theme')
    if (saved) return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', theme === 'dark')
    try { localStorage.setItem('nc_theme', theme) } catch { /* private mode */ }
  }, [theme])

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
