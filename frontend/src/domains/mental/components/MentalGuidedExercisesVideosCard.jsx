import { useEffect, useMemo, useState } from 'react'
import { loadUserMentalUiState, saveUserMentalUiState } from '../mentalEnhancements.js'

const CATEGORIES = ['Stress Relief', 'Calm', 'Focus', 'Sleep']

// CC0 sample video (placeholder visuals). You can swap these URLs later with your own short guided videos.
const CC0_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

const VIDEOS = [
  { id: 'breathing-2', title: '2-minute deep breathing', minutes: 2, category: 'Stress Relief', emoji: '🧘', src: CC0_VIDEO },
  { id: 'body-scan', title: 'Guided body scan', minutes: 6, category: 'Calm', emoji: '🌿', src: CC0_VIDEO },
  { id: 'stress-reset', title: 'Stress reset exercise', minutes: 4, category: 'Stress Relief', emoji: '🧠', src: CC0_VIDEO },
  { id: 'sleep-calm', title: 'Calm before sleep', minutes: 7, category: 'Sleep', emoji: '🌙', src: CC0_VIDEO },
  { id: 'focus-3', title: '3-minute focus reset', minutes: 3, category: 'Focus', emoji: '🎯', src: CC0_VIDEO },
]

function storageKey() {
  return 'videos'
}

export default function MentalGuidedExercisesVideosCard({ userId }) {
  const [category, setCategory] = useState('Stress Relief')

  const [progress, setProgress] = useState(() => {
    return loadUserMentalUiState(userId, storageKey(), { completed: {} })
  })

  useEffect(() => {
    saveUserMentalUiState(userId, storageKey(), progress)
  }, [userId, progress])

  const list = useMemo(
    () => VIDEOS.filter((v) => v.category === category),
    [category],
  )

  function markCompleted(id) {
    setProgress((p) => ({
      ...p,
      completed: { ...p.completed, [id]: new Date().toISOString() },
    }))
  }

  function clearCompleted(id) {
    setProgress((p) => {
      const next = { ...(p.completed || {}) }
      delete next[id]
      return { ...p, completed: next }
    })
  }

  return (
    <div className="card mentalVideosCard" id="mental-videos">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>🎥 Guided Exercises & Videos</h3>
        <div className="mentalSubPill">2–10 minutes • in-app playback</div>
      </div>

      <div className="muted" style={{ marginBottom: 10 }}>
        Pick a category, press play, and mark completed when you’re done.
      </div>

      <div className="mentalTabs" role="tablist" aria-label="Video categories">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={c === category}
            className={c === category ? 'mentalTab active' : 'mentalTab'}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid" style={{ gap: 12, marginTop: 12 }}>
        {list.map((v) => {
          const done = Boolean(progress?.completed?.[v.id])
          return (
            <div key={v.id} className={done ? 'mentalVideoTile done' : 'mentalVideoTile'}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontWeight: 700 }}>{v.emoji} {v.title}</div>
                <div className={done ? 'mentalDonePill' : 'mentalTimePill'}>
                  {done ? '✓ Completed' : `~${v.minutes} min`}
                </div>
              </div>

              <video
                className="mentalVideo"
                src={v.src}
                controls
                playsInline
                preload="metadata"
                onEnded={() => markCompleted(v.id)}
              />

              <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                <button className={done ? 'btn' : 'btn primary mentalPrimary'} onClick={() => markCompleted(v.id)}>
                  {done ? 'Mark again' : 'Mark completed'}
                </button>
                {done ? (
                  <button className="btn" onClick={() => clearCompleted(v.id)}>Clear</button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mentalSubtleNote">
        Note: sample videos use CC0 placeholder media. Swap the URLs with your own guided clips anytime.
      </div>
    </div>
  )
}
