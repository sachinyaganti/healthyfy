import { useEffect, useMemo, useState } from 'react'

const PROMPTS = [
  'Breathe slow. Shoulders down. Jaw relaxed.',
  'Name 5 things you can see.',
  'Name 4 things you can feel (chair, feet, hands).',
  'Name 3 things you can hear.',
  'Name 2 things you can smell.',
  'Name 1 kind thing you can do next.',
]

export default function MentalCalmMeNowCard() {
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const prompt = useMemo(() => {
    if (!running) return PROMPTS[0]
    const elapsed = 60 - secondsLeft
    const idx = Math.min(PROMPTS.length - 1, Math.floor(elapsed / 10))
    return PROMPTS[idx]
  }, [running, secondsLeft])

  useEffect(() => {
    if (!running) return undefined
    if (secondsLeft <= 0) {
      setRunning(false)
      return undefined
    }
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [running, secondsLeft])

  function start() {
    setRunning(true)
    setSecondsLeft(60)
  }

  function stop() {
    setRunning(false)
    setSecondsLeft(0)
  }

  return (
    <div className="card mentalCalmNowCard" id="mental-calm-now">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>🧘 Emergency Calm Button</h3>
        {running ? <div className="mentalTimePill">{secondsLeft}s</div> : null}
      </div>

      <div className="muted" style={{ marginBottom: 10 }}>
        A quick 60-second breathing + grounding reset. Non-medical.
      </div>

      <div className="mentalCalmNowInner">
        <div className={running ? 'mentalBreathOrb running' : 'mentalBreathOrb'} aria-hidden="true" />
        <div className="mentalCalmNowPrompt">
          <div style={{ fontWeight: 700 }}>Calm Me Now</div>
          <div className="muted" style={{ marginTop: 6 }}>{prompt}</div>
          <div className="mentalBreathGuide">
            {running ? 'Inhale… Exhale… (repeat)' : 'Tap to start a gentle breathing rhythm.'}
          </div>
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        {!running ? (
          <button className="btn primary mentalPrimary" onClick={start}>Calm Me Now</button>
        ) : (
          <button className="btn" onClick={stop}>Stop</button>
        )}
      </div>

      <div className="mentalSubtleNote">
        If you feel unsafe, consider reaching out to someone you trust.
      </div>
    </div>
  )
}
