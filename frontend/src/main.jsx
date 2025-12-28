import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

function applyInitialTheme() {
  try {
    const saved = localStorage.getItem('healthyfy:theme')
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.dataset.theme = saved
      return
    }
  } catch {
    // ignore
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
}

applyInitialTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
