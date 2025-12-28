import { useMemo } from 'react'
import { computeCheckinStreak, scrollToId } from '../mentalEnhancements.js'

function messageFor(streak) {
  if (streak.current >= 14) return 'Two-week streak — steady and consistent.'
  if (streak.current >= 7) return 'One-week streak — great rhythm.'
  if (streak.current >= 3) return 'Nice streak — keep it gentle and doable.'
  if (streak.todayCheckedIn) return 'Checked in today — good job showing up.'
  return 'A tiny check-in today can help you stay aware.'
}

export default function MentalStreaksCard({ moodLogs, journalEntries }) {
  const streak = useMemo(
    () => computeCheckinStreak({ moodLogs, journalEntries }),
    [moodLogs, journalEntries],
  )

  return (
    <div className="card mentalStreaksCard">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>🌿 Gentle motivation & streaks</h3>
        <div className="mentalStreakPill">{streak.current} day streak</div>
      </div>

      <div className="muted" style={{ marginBottom: 10 }}>{messageFor(streak)}</div>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="muted">Best (last ~120 days): {streak.best} days</div>
        <button className="btn" onClick={() => scrollToId('mental-log-mood')}>
          Quick check-in
        </button>
      </div>

      <div className="mentalStreakHint">
        {streak.todayCheckedIn ? 'Today is counted.' : 'Log a mood or journal entry to count today.'}
      </div>
    </div>
  )
}
