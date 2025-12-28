import { useAuth } from '../../auth/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import MentalTodaysCalmActivityCard from './components/MentalTodaysCalmActivityCard.jsx'
import MentalCalmMeNowCard from './components/MentalCalmMeNowCard.jsx'
import MentalGuidedExercisesVideosCard from './components/MentalGuidedExercisesVideosCard.jsx'
import MentalAudioRelaxationModeCard from './components/MentalAudioRelaxationModeCard.jsx'
import MentalStreaksCard from './components/MentalStreaksCard.jsx'
import { loadUserCollection } from '../../data/wellnessStorage.js'

const DISCLAIMER_LINES = [
  'Healthyfy supports mental wellness and stress management.',
  'It does not diagnose, treat, or replace professional mental health care.',
]

export default function MentalActivities() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Streaks are optional gentle motivation; they reuse existing tracking collections.
  const moodLogs = loadUserCollection(user.id, 'mental:mood')
  const journalEntries = loadUserCollection(user.id, 'mental:journals')

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="card heroCard heroCard--mental">
        <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Stress relief & wellness activities</h2>
            <div className="muted">Guided exercises, audio relaxation, and calm tools (non-medical).</div>
          </div>
          <button className="btn" onClick={() => navigate('/app/mental')}>Back</button>
        </div>
        <div className="muted" style={{ marginTop: 10, fontWeight: 700 }}>
          {DISCLAIMER_LINES[0]}<br />{DISCLAIMER_LINES[1]}
        </div>
      </div>

      <div className="grid two">
        <MentalTodaysCalmActivityCard userId={user.id} />
        <MentalCalmMeNowCard />
      </div>

      <div className="grid two">
        <MentalGuidedExercisesVideosCard userId={user.id} />
        <MentalAudioRelaxationModeCard />
      </div>

      <MentalStreaksCard moodLogs={moodLogs} journalEntries={journalEntries} />
    </div>
  )
}
