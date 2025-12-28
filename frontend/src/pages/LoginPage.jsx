import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [showIntro, setShowIntro] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/app" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login({ email, password })
      const from = location.state?.from
      navigate(from ? from : '/app', { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`loginPage${showIntro ? ' introOpen' : ''}`}>
      {showIntro ? (
        <div className="loginIntro" role="dialog" aria-modal="true" aria-label="Welcome">
          <button
            type="button"
            className="loginIntroLogoButton"
            onClick={() => setShowIntro(false)}
            aria-label="Enter Healthyfy"
          >
            <img
              className="loginIntroLogo"
              src="/Healthfy%20logo%20card.png"
              alt="Healthyfy"
            />
          </button>
        </div>
      ) : null}

      <div className="container page">
        <div className="grid two">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Login</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              This is a local prototype login (no medical data). Your account is stored in your browser.
            </p>

            <form className="grid" onSubmit={onSubmit}>
              <div className="field">
                <label>Email</label>
                <input name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="field">
                <label>Password</label>
                <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {error ? <div className="error">{error}</div> : null}
              <div className="row">
                <button className="btn primary" disabled={busy}>
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
                <div className="muted">
                  New here? <Link to="/register">Create an account</Link>
                </div>
              </div>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>What you can do in Healthyfy</h3>
            <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
              <li>Track workouts, habits, meals, mood, and symptoms.</li>
              <li>See simple charts and trend-based, non-medical insights.</li>
              <li>Export a “Final Setup” PDF per wellness domain.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
