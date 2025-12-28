import { useEffect, useState } from 'react'

function getTheme() {
  const t = document.documentElement.dataset.theme
  return t === 'dark' ? 'dark' : 'light'
}

function setTheme(next) {
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem('healthyfy:theme', next)
  } catch {
    // ignore
  }
}

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(() => getTheme())

  useEffect(() => {
    setThemeState(getTheme())
  }, [])

  const isDark = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="iconBtn outline themeToggleBtn"
      onClick={() => {
        setTheme(nextTheme)
        setThemeState(nextTheme)
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? '☀️' : '🌑'}
    </button>
  )
}
