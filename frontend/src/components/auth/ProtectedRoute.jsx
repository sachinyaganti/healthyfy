import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="container page">
        <div className="card">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
