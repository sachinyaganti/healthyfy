import { Outlet } from 'react-router-dom'

export default function MentalModuleShell() {
  return (
    <div className="grid domainPage mental" style={{ gap: '1rem' }}>
      <Outlet />
    </div>
  )
}
