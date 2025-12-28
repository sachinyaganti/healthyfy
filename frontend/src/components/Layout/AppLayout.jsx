import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'

export default function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="container page">
        <Outlet />
      </main>
    </>
  )
}
