import { useEffect, useState } from 'react'
import { GLOBAL_DISCLAIMER } from '../constants/disclaimer.js'

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

export default function DisclaimerBanner() {
  const [theme, setThemeState] = useState(() => getTheme())

  useEffect(() => {
    setThemeState(getTheme())
  }, [])

  const isDark = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'

  return (
    <div className="disclaimerBanner">
      <div className="container disclaimerBannerInner">
        <span className="disclaimerText">{GLOBAL_DISCLAIMER}</span>

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
      </div>
    </div>
  )
}
