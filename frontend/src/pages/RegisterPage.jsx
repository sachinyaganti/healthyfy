import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register({ name, email, password })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err?.message || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page">
      <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Register</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Create a local-only account for this prototype.
        </p>

        <form className="grid" onSubmit={onSubmit}>
          <div className="field">
            <label>Name</label>
            <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="field">
            <label>Email</label>
            <input name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>

          {error ? <div className="error">{error}</div> : null}

          <div className="row">
            <button className="btn primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
            <div className="muted">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
