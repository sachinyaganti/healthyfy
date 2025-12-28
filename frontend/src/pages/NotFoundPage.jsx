import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="container page">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Page not found</h2>
        <p className="muted">The page you requested does not exist.</p>
        <Link className="btn" to="/app/dashboard">Go to dashboard</Link>
      </div>
    </div>
  )
}
