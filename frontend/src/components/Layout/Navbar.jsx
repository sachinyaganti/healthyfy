import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import ThemeToggle from '../ThemeToggle.jsx'

function linkClass({ isActive }) {
  return `navLink${isActive ? ' active' : ''}`
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoOk, setLogoOk] = useState(true)

  async function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="navbar">
      <div className="container navbarInner">
        <div className="brand">
          {logoOk ? (
            <img
              className="brandLogo"
              src="/Healthfy logo card.png"
              alt="Healthyfy"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <div className="brandLogoFallback" aria-hidden="true">H</div>
          )}

          <div className="brandText">
            <div className="brandName">Healthyfy</div>
            <div className="muted brandTagline">Wellness & Lifestyle Support</div>
          </div>
        </div>

        <nav className="row navLinks">
          <NavLink to="/app/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/app/fitness" className={linkClass}>Fitness</NavLink>
          <NavLink to="/app/nutrition" className={linkClass}>Nutrition</NavLink>
          <NavLink to="/app/mental" className={linkClass}>Mental</NavLink>
          <NavLink to="/app/chronic" className={linkClass}>Chronic</NavLink>
        </nav>

        <div className="row account">
          <ThemeToggle />
          <div className="muted accountName">{user?.name}</div>
          <button className="btn danger" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  )
}
