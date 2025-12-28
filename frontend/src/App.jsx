import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import UnifiedDashboard from './pages/UnifiedDashboard.jsx'
import MentalModuleShell from './domains/mental/MentalModuleShell.jsx'
import MentalLanding from './domains/mental/MentalLanding.jsx'
import MentalTracking from './domains/mental/MentalTracking.jsx'
import MentalActivities from './domains/mental/MentalActivities.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ChatbotAssistant from './components/Chatbot/ChatbotAssistant.jsx'
import FloatingMarqueeNote from './components/FloatingMarqueeNote.jsx'
import DisclaimerBanner from './components/DisclaimerBanner.jsx'

import Fitness from './pages/Fitness.jsx'
import Nutrition from './pages/Nutrition.jsx'
import ChronicSupport from './pages/ChronicSupport.jsx'

function featureFromPathname(pathname) {
  if (!pathname) return 'default'
  if (pathname === '/' || pathname.startsWith('/app/dashboard')) return 'dashboard'
  if (pathname.startsWith('/app/fitness')) return 'fitness'
  if (pathname.startsWith('/app/nutrition')) return 'nutrition'
  if (pathname.startsWith('/app/mental')) return 'mental'
  if (pathname.startsWith('/app/chronic')) return 'chronic'
  if (pathname.startsWith('/app')) return 'dashboard'
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return 'auth'
  return 'default'
}

export default function App() {
  const location = useLocation()
  const feature = featureFromPathname(location.pathname)

  return (
    <div className="appRoot" data-feature={feature}>
      <FloatingMarqueeNote />
      <DisclaimerBanner />
      <ChatbotAssistant />
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UnifiedDashboard />} />
          <Route path="fitness" element={<Fitness />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="mental" element={<MentalModuleShell />}>
            <Route index element={<MentalLanding />} />
            <Route path="tracking" element={<MentalTracking />} />
            <Route path="activities" element={<MentalActivities />} />
          </Route>
          <Route path="chronic" element={<ChronicSupport />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}
