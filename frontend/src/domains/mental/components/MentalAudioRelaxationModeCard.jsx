import { useEffect, useMemo, useRef, useState } from 'react'

function createNoiseBuffer(ctx, seconds) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  return buffer
}

function safeClose(ctx) {
  try {
    if (ctx && ctx.state !== 'closed') ctx.close()
  } catch {
    // ignore
  }
}

export default function MentalAudioRelaxationModeCard() {
  const ctxRef = useRef(null)
  const nodesRef = useRef({})

  const [mode, setMode] = useState('nature')
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.35)

  const modes = useMemo(
    () => [
      { id: 'nature', label: '🌿 Nature', hint: 'Soft filtered noise (rain-like)' },
      { id: 'white', label: '🎧 White noise', hint: 'Steady masking sound' },
      { id: 'tone', label: '🎶 Calm tones', hint: 'Gentle ambient chord' },
    ],
    [],
  )

  useEffect(() => {
    return () => {
      safeClose(ctxRef.current)
      ctxRef.current = null
      nodesRef.current = {}
    }
  }, [])

  function ensureContext() {
    if (ctxRef.current) return ctxRef.current
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctxRef.current = ctx
    return ctx
  }

  function stopAll() {
    const nodes = nodesRef.current
    for (const k of Object.keys(nodes)) {
      const n = nodes[k]
      try {
        if (n?.stop) n.stop()
      } catch {
        // ignore
      }
      try {
        if (n?.disconnect) n.disconnect()
      } catch {
        // ignore
      }
    }
    nodesRef.current = {}
  }

  function start(modeId) {
    const ctx = ensureContext()
    stopAll()

    const master = ctx.createGain()
    master.gain.value = Math.max(0, Math.min(1, volume))
    master.connect(ctx.destination)

    if (modeId === 'tone') {
      const base = ctx.createOscillator()
      const fifth = ctx.createOscillator()
      const gain = ctx.createGain()
      gain.gain.value = 0.0

      base.type = 'sine'
      fifth.type = 'sine'
      base.frequency.value = 220
      fifth.frequency.value = 330

      base.connect(gain)
      fifth.connect(gain)
      gain.connect(master)

      const now = ctx.currentTime
      gain.gain.setValueAtTime(0.0, now)
      gain.gain.linearRampToValueAtTime(0.16, now + 1.2)
      gain.gain.linearRampToValueAtTime(0.12, now + 3.5)

      base.start()
      fifth.start()

      nodesRef.current = { master, base, fifth, gain }
      return
    }

    // Noise-based modes
    const src = ctx.createBufferSource()
    src.buffer = createNoiseBuffer(ctx, 2.0)
    src.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = modeId === 'white' ? 'highpass' : 'lowpass'
    filter.frequency.value = modeId === 'white' ? 80 : 1200

    const gain = ctx.createGain()
    gain.gain.value = modeId === 'white' ? 0.55 : 0.42

    src.connect(filter)
    filter.connect(gain)
    gain.connect(master)

    src.start()

    nodesRef.current = { master, src, filter, gain }
  }

  async function onToggle() {
    const ctx = ensureContext()
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // ignore
      }
    }

    if (playing) {
      stopAll()
      setPlaying(false)
      return
    }

    start(mode)
    setPlaying(true)
  }

  function onChangeMode(nextMode) {
    setMode(nextMode)
    if (!playing) return
    start(nextMode)
  }

  useEffect(() => {
    const master = nodesRef.current.master
    if (!master) return
    try {
      master.gain.value = Math.max(0, Math.min(1, volume))
    } catch {
      // ignore
    }
  }, [volume])

  const selected = modes.find((m) => m.id === mode)

  return (
    <div className="card mentalAudioCard" id="mental-audio-mode">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>🎧 Audio relaxation mode</h3>
        <button className={playing ? 'btn primary mentalPrimary' : 'btn'} onClick={onToggle}>
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className="muted" style={{ marginBottom: 10 }}>
        Use for focus, relaxation, or sleep — simple ambient audio (no medical claims).
      </div>

      <div className="mentalModeRow">
        {modes.map((m) => (
          <button
            key={m.id}
            className={m.id === mode ? 'mentalModeBtn active' : 'mentalModeBtn'}
            onClick={() => onChangeMode(m.id)}
            type="button"
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="muted" style={{ marginTop: 8 }}>{selected?.hint}</div>

      <div className="mentalSliderRow">
        <label className="muted" style={{ minWidth: 90 }}>Volume</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Audio volume"
          className="mentalSlider"
        />
      </div>

      <div className="mentalSubtleNote">
        Audio may require a user gesture (browser autoplay rules).
      </div>
    </div>
  )
}
