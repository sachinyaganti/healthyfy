import { loadJson, saveJson, scopedKey } from '../../utils/storage.js'
import { todayIsoDate } from '../../utils/dates.js'

export function clamp01(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

export function clamp(n, lo, hi) {
  const x = Number(n)
  if (!Number.isFinite(x)) return lo
  return Math.max(lo, Math.min(hi, x))
}

export function hashStringToInt(input) {
  const s = String(input ?? '')
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pickDailyItem(dateIso, items) {
  const arr = Array.isArray(items) ? items : []
  if (!arr.length) return null
  const idx = hashStringToInt(String(dateIso || todayIsoDate())) % arr.length
  return arr[idx]
}

export function loadUserMentalUiState(userId, key, fallback) {
  return loadJson(scopedKey(userId, `mental:ui:${key}`), fallback)
}

export function saveUserMentalUiState(userId, key, value) {
  saveJson(scopedKey(userId, `mental:ui:${key}`), value)
}

export function uniqueDatesFromEntries(entries) {
  const set = new Set()
  for (const e of entries || []) {
    const date = e?.date
    if (date) set.add(date)
  }
  return set
}

export function computeCheckinStreak({ moodLogs, journalEntries, todayIso }) {
  const today = todayIso || todayIsoDate()

  const dates = new Set([
    ...uniqueDatesFromEntries(moodLogs),
    ...uniqueDatesFromEntries(journalEntries),
  ])

  function isoMinusDays(iso, days) {
    const d = new Date(`${iso}T00:00:00`)
    d.setDate(d.getDate() - days)
    return d.toISOString().slice(0, 10)
  }

  let current = 0
  for (let i = 0; i < 3650; i += 1) {
    const iso = isoMinusDays(today, i)
    if (!dates.has(iso)) break
    current += 1
  }

  // Best streak: scan back ~90 days for performance/simplicity
  const windowDays = 120
  let best = 0
  let run = 0
  for (let i = windowDays; i >= 0; i -= 1) {
    const iso = isoMinusDays(today, i)
    if (dates.has(iso)) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 0
    }
  }

  return {
    todayCheckedIn: dates.has(today),
    current,
    best,
  }
}

export function buildRuleBasedSuggestions({ moodLogs, journalEntries }) {
  const logs = Array.isArray(moodLogs) ? moodLogs : []

  const last = logs[0]
  const lastMood = Number(last?.mood || 0)
  const lastStress = Number(last?.stress || 0)

  const last7 = logs.slice(0, 7)
  const avgMood = last7.length ? last7.reduce((a, x) => a + Number(x?.mood || 0), 0) / last7.length : 0
  const avgStress = last7.length ? last7.reduce((a, x) => a + Number(x?.stress || 0), 0) / last7.length : 0

  // Trend: compare first half vs second half (simple, stable)
  const first = last7.slice(4) // older entries (because newest first)
  const second = last7.slice(0, 3) // newest entries
  const avg = (arr, key) => (arr.length ? arr.reduce((a, x) => a + Number(x?.[key] || 0), 0) / arr.length : 0)
  const stressTrend = avg(second, 'stress') - avg(first, 'stress')
  const moodTrend = avg(second, 'mood') - avg(first, 'mood')

  const hasJournal = (journalEntries || []).length > 0

  const suggestions = []

  if (avgStress >= 7 || lastStress >= 8 || stressTrend >= 1) {
    suggestions.push({
      id: 'high-stress',
      title: 'You’ve logged higher stress recently',
      body: 'Try a short calming reset: a 2–3 minute breathing session or a quick grounding exercise.',
      action: { label: 'Try Calm Me Now', targetId: 'mental-calm-now' },
    })
  }

  if (avgMood > 0 && avgMood <= 4) {
    suggestions.push({
      id: 'low-mood',
      title: 'Your mood average looks a bit lower this week',
      body: 'A small, gentle routine can help: light movement, sunlight, or a short “what helped today?” note.',
      action: { label: 'Open Quick Journal', targetId: 'mental-quick-journal' },
    })
  }

  if (moodTrend >= 1) {
    suggestions.push({
      id: 'mood-up',
      title: 'Nice trend: mood is improving',
      body: 'Consider repeating what worked—sleep routine, breaks, movement, or hydration—and log it as a reminder.',
      action: { label: 'Log a Note', targetId: 'mental-log-mood' },
    })
  }

  if (avgStress > 0 && avgStress <= 5 && (avgMood >= 6 || lastMood >= 7)) {
    suggestions.push({
      id: 'steady',
      title: 'You look fairly steady this week',
      body: 'Keep it simple: a 2-minute focus track or a quick mindful walk can maintain your momentum.',
      action: { label: 'Open Audio Mode', targetId: 'mental-audio-mode' },
    })
  }

  if (!hasJournal) {
    suggestions.push({
      id: 'journal-start',
      title: 'Try a tiny journal habit',
      body: 'One sentence is enough. Prompt: “What drained me today? What helped me today?”',
      action: { label: 'Start Journaling', targetId: 'mental-quick-journal' },
    })
  }

  if (!suggestions.length) {
    suggestions.push({
      id: 'default',
      title: 'A simple reset for today',
      body: 'Pick one: 3-minute breathing, a short stretch, or 10 minutes without screens.',
      action: { label: 'Today’s Calm Activity', targetId: 'mental-todays-calm' },
    })
  }

  return {
    stats: {
      lastMood: clamp(lastMood, 0, 10),
      lastStress: clamp(lastStress, 0, 10),
      avgMood: Math.round(avgMood * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      moodTrend: Math.round(moodTrend * 10) / 10,
      stressTrend: Math.round(stressTrend * 10) / 10,
    },
    suggestions,
  }
}

export function scrollToId(targetId) {
  if (!targetId) return
  const el = document.getElementById(targetId)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
