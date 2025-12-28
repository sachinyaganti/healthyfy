import { useEffect, useMemo, useState } from 'react'
import { pickDailyItem, loadUserMentalUiState, saveUserMentalUiState } from '../mentalEnhancements.js'
import { todayIsoDate } from '../../../utils/dates.js'

const ACTIVITIES = [
  { id: 'breath-3', title: '3-minute breathing', emoji: '🧘', minutes: 3, body: 'Sit comfortably. Inhale slow, exhale slower. Keep it easy.' },
  { id: 'gratitude', title: 'Gratitude journaling', emoji: '✍️', minutes: 4, body: 'Write 3 small things that went okay today (even tiny ones).' },
  { id: 'walk', title: 'Mindful walking', emoji: '🚶', minutes: 6, body: 'Walk slowly. Notice 5 things you see, 4 you hear, 3 you feel.' },
  { id: 'detox', title: 'Digital detox reminder', emoji: '📵', minutes: 5, body: 'Put your phone away for 5 minutes. Let your mind settle.' },
]

function keyFor(dateIso) {
  return `calmActivity:${dateIso}`
}

export default function MentalTodaysCalmActivityCard({ userId }) {
  const today = todayIsoDate()

  const activity = useMemo(() => pickDailyItem(today, ACTIVITIES), [today])

  const [status, setStatus] = useState(() => {
    const saved = loadUserMentalUiState(userId, keyFor(today), { completed: false, startedAt: null })
    return saved
  })

  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!secondsLeft) return undefined
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  useEffect(() => {
    saveUserMentalUiState(userId, keyFor(today), status)
  }, [userId, today, status])

  if (!activity) return null

  const durationSeconds = Math.max(60, Number(activity.minutes || 3) * 60)

  function start() {
    if (status.completed) return
    setStatus((s) => ({ ...s, startedAt: new Date().toISOString() }))
    setSecondsLeft(durationSeconds)
  }

  function complete() {
    setStatus((s) => ({ ...s, completed: true }))
    setSecondsLeft(0)
  }

  const started = Boolean(status.startedAt)

  return (
    <div className="card mentalCalmCard" id="mental-todays-calm">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>🌿 Today’s Calm Activity</h3>
        {status.completed ? (
          <div className="mentalDonePill">✓ Completed</div>
        ) : (
          <div className="mentalTimePill">~{activity.minutes} min</div>
        )}
      </div>

      <div className="mentalCalmTitle">{activity.emoji} {activity.title}</div>
      <div className="muted" style={{ marginTop: 6 }}>{activity.body}</div>

      {secondsLeft > 0 ? (
        <div className="mentalTimerRow">
          <div className="mentalTimerBar" role="progressbar" aria-valuemin={0} aria-valuemax={durationSeconds} aria-valuenow={durationSeconds - secondsLeft}>
            <div className="mentalTimerFill" style={{ width: `${Math.round(((durationSeconds - secondsLeft) / durationSeconds) * 100)}%` }} />
          </div>
          <div className="muted">{Math.ceil(secondsLeft / 60)} min left</div>
        </div>
      ) : null}

      <div className="row" style={{ marginTop: 12 }}>
        {!status.completed ? (
          <>
            <button className="btn primary mentalPrimary" onClick={start}>
              {started ? 'Start again' : 'Start'}
            </button>
            <button className="btn" onClick={complete}>
              Mark as completed
            </button>
          </>
        ) : (
          <button className="btn" onClick={() => setStatus({ completed: false, startedAt: null })}>
            Reset
          </button>
        )}
      </div>

      <div className="mentalSubtleNote">
        Tip: keeping it short makes it easier to repeat.
      </div>
    </div>
  )
}
