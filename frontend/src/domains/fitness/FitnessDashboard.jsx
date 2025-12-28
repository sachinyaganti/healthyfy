import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { loadJson, saveJson, scopedKey } from '../../utils/storage.js'
import { makeId } from '../../utils/id.js'
import { exportFinalSetupPdf } from '../../utils/pdfExport.js'
import { appendUserCollectionItem, removeUserCollectionItem } from '../../data/wellnessStorage.js'
import { loadUserCollection } from '../../data/wellnessStorage.js'
import { todayIsoDate } from '../../utils/dates.js'
import { api } from '../../services/api.js'

const DEFAULT_CATALOG = [
  {
    id: 'squat',
    name: 'Squat',
    icon: '🏋️',
    kind: 'strength',
    defaultSets: 5,
    defaultReps: 10,
    defaultKg: 20,
  },
  {
    id: 'bicep_curl',
    name: 'Bicep curl',
    icon: '💪',
    kind: 'strength',
    defaultSets: 3,
    defaultReps: 10,
    defaultKg: 10,
  },
  {
    id: 'running',
    name: 'Running',
    icon: '👟',
    kind: 'cardio',
    defaultMinutes: 10,
  },
  {
    id: 'sumo_squat',
    name: 'Sumo squat',
    icon: '🏋️',
    kind: 'strength',
    defaultSets: 5,
    defaultReps: 10,
    defaultKg: 20,
  },
  {
    id: 'chest_fly',
    name: 'Chest fly',
    icon: '🫀',
    kind: 'strength',
    defaultSets: 3,
    defaultReps: 12,
    defaultKg: 12,
  },

  // Strength (appended)
  { id: 'push_ups', name: 'Push-ups', icon: '💥', kind: 'strength', defaultSets: 3, defaultReps: 10, defaultKg: 0 },
  { id: 'lunges', name: 'Lunges', icon: '🦵', kind: 'strength', defaultSets: 4, defaultReps: 10, defaultKg: 0 },
  { id: 'shoulder_press', name: 'Shoulder Press', icon: '🏋️', kind: 'strength', defaultSets: 3, defaultReps: 10, defaultKg: 10 },
  { id: 'tricep_dips', name: 'Tricep Dips', icon: '💪', kind: 'strength', defaultSets: 3, defaultReps: 10, defaultKg: 0 },
  { id: 'deadlift', name: 'Deadlift', icon: '🏋️', kind: 'strength', defaultSets: 4, defaultReps: 6, defaultKg: 30 },
  { id: 'calf_raises', name: 'Calf Raises', icon: '🦶', kind: 'strength', defaultSets: 4, defaultReps: 12, defaultKg: 0 },

  // Cardio (appended)
  { id: 'jump_rope', name: 'Jump Rope', icon: '🪢', kind: 'cardio', defaultMinutes: 5 },
  { id: 'cycling', name: 'Cycling', icon: '🚴', kind: 'cardio', defaultMinutes: 15 },
  { id: 'high_knees', name: 'High Knees', icon: '🔥', kind: 'cardio', defaultMinutes: 2 },
  { id: 'mountain_climbers', name: 'Mountain Climbers', icon: '⛰️', kind: 'strength', defaultSets: 3, defaultReps: 12, defaultKg: 0 },
  { id: 'burpees', name: 'Burpees', icon: '⚡', kind: 'strength', defaultSets: 3, defaultReps: 8, defaultKg: 0 },

  // Flexibility / Recovery (appended)
  { id: 'stretching', name: 'Stretching', icon: '🧘', kind: 'cardio', defaultMinutes: 10 },
  { id: 'yoga_flow', name: 'Yoga Flow', icon: '🧘‍♀️', kind: 'cardio', defaultMinutes: 15 },
  { id: 'hamstring_stretch', name: 'Hamstring Stretch', icon: '🦵', kind: 'cardio', defaultMinutes: 5 },
  { id: 'child_pose', name: "Child’s Pose", icon: '🧘', kind: 'cardio', defaultMinutes: 3 },
  { id: 'foam_rolling', name: 'Foam Rolling', icon: '🧼', kind: 'cardio', defaultMinutes: 10 },
]

const DEFAULT_DAY_ACTIVITY_IDS = ['squat', 'bicep_curl', 'running', 'sumo_squat', 'chest_fly']

const EXERCISE_VIDEO_URLS = {
  squat: 'https://www.youtube.com/watch?v=aclHkVaku9U',
  bicep_curl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
  running: 'https://www.youtube.com/watch?v=5j9lJYp6n9Y',
  sumo_squat: 'https://www.youtube.com/watch?v=G3wYV8b0K1Y',
  chest_fly: 'https://www.youtube.com/watch?v=eozdVDA78K0',
  push_ups: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8',
  lunges: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
}

function youtubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(String(query || ''))}`
}

function resolveExerciseVideoUrl(activity) {
  const id = activity?.id
  if (id && EXERCISE_VIDEO_URLS[id]) return EXERCISE_VIDEO_URLS[id]
  const name = String(activity?.name || '').trim()
  if (!name) return null
  return youtubeSearchUrl(`${name} exercise demo`)
}

function makeDefaultEditorState() {
  const days = Array.from({ length: 7 }, (_, i) => ({
    id: `day_${i + 1}`,
    name: `Day ${i + 1}`,
    activityIds: DEFAULT_DAY_ACTIVITY_IDS,
  }))

  return {
    days,
    catalog: DEFAULT_CATALOG,
    perDay: {},
    selectedDayId: days[0].id,
    selectedActivityId: DEFAULT_CATALOG[0].id,
  }
}

function normalizeEditorState(input) {
  const base = makeDefaultEditorState()

  // If an older saved catalog exists, keep its order and append any missing defaults
  // (so newly added activities show up without changing existing ones).
  const savedCatalog = Array.isArray(input?.catalog) ? input.catalog : []
  const catalog = savedCatalog.length
    ? [...savedCatalog, ...base.catalog.filter((a) => !savedCatalog.some((s) => s?.id === a.id))]
    : base.catalog
  const catalogIds = new Set(catalog.map((a) => a.id))

  const days = Array.from({ length: 7 }, (_, i) => {
    const id = `day_${i + 1}`
    const fromId = input?.days?.find((d) => d.id === id)
    const fallback = input?.days?.[i]
    const name = (fromId?.name || fallback?.name || `Day ${i + 1}`).trim()
    const rawIds = fromId?.activityIds ?? fallback?.activityIds
    const normalizedIds = Array.isArray(rawIds)
      ? rawIds.filter((x) => catalogIds.has(x))
      : base.days[i].activityIds

    return { id, name, activityIds: normalizedIds }
  })

  const selectedDayId = days.some((d) => d.id === input?.selectedDayId) ? input.selectedDayId : days[0].id
  const selectedActivityId = catalogIds.has(input?.selectedActivityId) ? input.selectedActivityId : catalog[0]?.id

  return {
    ...base,
    ...input,
    catalog,
    days,
    selectedDayId,
    selectedActivityId,
    perDay: input?.perDay || {},
  }
}

function ensurePerDayActivity(perDay, dayId, activity) {
  const day = perDay[dayId] || {}
  if (day[activity.id]) return perDay

  const nextDay = {
    ...day,
    [activity.id]:
      activity.kind === 'cardio'
        ? {
          id: activity.id,
          done: false,
          minutes: activity.defaultMinutes ?? 10,
          note: '',
        }
        : {
          id: activity.id,
          done: false,
          sets: activity.defaultSets ?? 3,
          reps: activity.defaultReps ?? 10,
          kg: activity.defaultKg ?? 0,
          note: '',
        },
  }

  return {
    ...perDay,
    [dayId]: nextDay,
  }
}

function clampInt(value, fallback) {
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : fallback
}

function clampNumber(value) {
  const n = Number(String(value))
  return Number.isFinite(n) ? n : null
}

function bmiCategory(bmi) {
  if (!Number.isFinite(bmi)) return 'n/a'
  if (bmi < 18.5) return 'Underweight (BMI)'
  if (bmi < 25) return 'Healthy range (BMI)'
  if (bmi < 30) return 'Overweight (BMI)'
  return 'Obesity range (BMI)'
}

function buildSuggestedPlan({ heightCm, weightKg }) {
  const h = clampNumber(heightCm)
  const w = clampNumber(weightKg)
  if (!h || !w || h <= 0 || w <= 0) {
    return {
      ready: false,
      title: 'Suggested fitness plan (non-medical)',
      summary: 'Enter your height and weight to generate a suggested plan.',
      bmi: null,
      category: 'n/a',
      bullets: [],
      schedule: [],
    }
  }

  const heightM = h / 100
  const bmi = w / (heightM * heightM)
  const category = bmiCategory(bmi)

  const baseBullets = [
    'Goal: build consistency with a sustainable weekly routine.',
    'Warm up 5–8 minutes before training; cool down 3–5 minutes after.',
    'Progress gradually: increase volume or time by ~5–10% per week.',
  ]

  let focus = []
  let schedule = []

  if (bmi < 18.5) {
    focus = [
      'Focus: strength fundamentals + gentle cardio for general fitness.',
      'If you feel unwell or uncertain, consider guidance from a qualified professional.',
    ]
    schedule = [
      'Mon: Strength A (full body, 35–45 min)',
      'Tue: Walk (20–30 min, easy pace)',
      'Wed: Strength B (full body, 35–45 min)',
      'Thu: Mobility + core (15–20 min)',
      'Fri: Walk or light cycle (20–30 min)',
      'Sat: Strength A (optional, light)',
      'Sun: Rest',
    ]
  } else if (bmi < 25) {
    focus = [
      'Focus: balanced strength + cardio + mobility.',
      'Aim: 2–3 strength sessions and 2 cardio sessions each week.',
    ]
    schedule = [
      'Mon: Strength A (upper + lower, 40–55 min)',
      'Tue: Cardio (20–30 min, moderate)',
      'Wed: Mobility + core (15–20 min)',
      'Thu: Strength B (upper + lower, 40–55 min)',
      'Fri: Cardio (20–30 min, easy/moderate)',
      'Sat: Optional fun activity (sports/walk)',
      'Sun: Rest',
    ]
  } else if (bmi < 30) {
    focus = [
      'Focus: strength + steady-state cardio to support conditioning.',
      'Aim: 2–3 strength sessions and 3 cardio sessions each week.',
    ]
    schedule = [
      'Mon: Strength A (full body, 40–50 min)',
      'Tue: Cardio (25–35 min, moderate)',
      'Wed: Walk (20–30 min, easy) + mobility',
      'Thu: Strength B (full body, 40–50 min)',
      'Fri: Cardio (25–35 min, moderate)',
      'Sat: Walk (30–45 min, easy)',
      'Sun: Rest',
    ]
  } else {
    focus = [
      'Focus: low-impact cardio + strength basics with extra recovery.',
      'Prioritize joints: walking, cycling, elliptical, swimming if available.',
    ]
    schedule = [
      'Mon: Strength basics (30–40 min, light)',
      'Tue: Low-impact cardio (20–30 min, easy/moderate)',
      'Wed: Walk + mobility (20–30 min)',
      'Thu: Strength basics (30–40 min, light)',
      'Fri: Low-impact cardio (20–30 min)',
      'Sat: Walk (25–40 min, easy)',
      'Sun: Rest',
    ]
  }

  const bullets = [...baseBullets, ...focus]

  return {
    ready: true,
    title: 'Suggested fitness plan (non-medical)',
    summary: 'This is a general wellness suggestion based on BMI only. It is not medical advice.',
    bmi,
    category,
    bullets,
    schedule,
  }
}

export default function FitnessDashboard() {
  const { user } = useAuth()

  // Re-render when localStorage-backed collections change (same-tab)
  const [, setStorageTick] = useState(0)
  useEffect(() => {
    function onStorageChange(e) {
      const key = e?.detail?.key
      if (!key) return
      if (!String(key).includes(`healthyfy:v1:${user.id}:`)) return
      setStorageTick((t) => t + 1)
    }
    window.addEventListener('healthyfy:storage', onStorageChange)
    return () => window.removeEventListener('healthyfy:storage', onStorageChange)
  }, [user.id])

  const storageKey = useMemo(() => scopedKey(user.id, 'fitness:workoutEditor'), [user.id])
  const [editor, setEditor] = useState(() => normalizeEditorState(loadJson(storageKey, makeDefaultEditorState())))

  const profileKey = useMemo(() => scopedKey(user.id, 'fitness:profile'), [user.id])
  const [profile, setProfile] = useState(() => loadJson(profileKey, { heightCm: '170', weightKg: '70' }))

  const [aiGoal, setAiGoal] = useState('general fitness')
  const [aiLevel, setAiLevel] = useState('beginner')
  const [aiPlan, setAiPlan] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')

  const [newDayName, setNewDayName] = useState('')
  const [logDate, setLogDate] = useState(todayIsoDate())

  useEffect(() => {
    // Migrate/normalize older stored editor state (e.g., < 7 days)
    setEditor((prev) => normalizeEditorState(prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    saveJson(storageKey, editor)
  }, [storageKey, editor])

  useEffect(() => {
    saveJson(profileKey, profile)
  }, [profileKey, profile])

  const selectedDay = useMemo(
    () => editor.days.find((d) => d.id === editor.selectedDayId) || editor.days[0],
    [editor.days, editor.selectedDayId],
  )

  const selectedActivity = useMemo(
    () => editor.catalog.find((a) => a.id === editor.selectedActivityId) || editor.catalog[0],
    [editor.catalog, editor.selectedActivityId],
  )

  const selectedVideoUrl = useMemo(() => {
    return resolveExerciseVideoUrl(selectedActivity)
  }, [selectedActivity])

  const perDayActivity = editor.perDay?.[selectedDay?.id]?.[selectedActivity?.id]

  const [detailsAnimKey, setDetailsAnimKey] = useState(0)
  useEffect(() => {
    setDetailsAnimKey((k) => k + 1)
  }, [editor.selectedActivityId, editor.selectedDayId])

  useEffect(() => {
    if (!selectedDay || !selectedActivity) return
    setEditor((prev) => ({
      ...prev,
      perDay: ensurePerDayActivity(prev.perDay, selectedDay.id, selectedActivity),
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay?.id, selectedActivity?.id])

  function selectDay(dayId) {
    setEditor((prev) => ({
      ...prev,
      selectedDayId: dayId,
      selectedActivityId: prev.selectedActivityId,
    }))
  }

  function selectActivity(activityId) {
    setEditor((prev) => ({
      ...prev,
      selectedActivityId: activityId,
    }))
  }

  function renameSelectedDay(nextName) {
    const name = String(nextName || '').trim()
    if (!name || !selectedDay) return
    setEditor((prev) => ({
      ...prev,
      days: prev.days.map((d) => (d.id === selectedDay.id ? { ...d, name } : d)),
    }))
  }

  function toggleActivityInSelectedDay(activityId) {
    setEditor((prev) => {
      const dayId = prev.selectedDayId
      const day = prev.days.find((d) => d.id === dayId)
      if (!day) return prev

      const included = (day.activityIds || []).includes(activityId)
      const nextActivityIds = included
        ? (day.activityIds || []).filter((x) => x !== activityId)
        : [activityId, ...(day.activityIds || [])]

      const activity = prev.catalog.find((a) => a.id === activityId)
      const nextPerDay = !included && activity
        ? ensurePerDayActivity(prev.perDay, dayId, activity)
        : prev.perDay

      const nextDays = prev.days.map((d) => (d.id === dayId ? { ...d, activityIds: nextActivityIds } : d))

      return {
        ...prev,
        days: nextDays,
        perDay: nextPerDay,
        selectedActivityId: activityId,
      }
    })
  }

  const suggestedPlan = useMemo(
    () => buildSuggestedPlan({ heightCm: profile.heightCm, weightKg: profile.weightKg }),
    [profile.heightCm, profile.weightKg],
  )

  async function generateAiPlan() {
    setAiBusy(true)
    setAiError('')
    try {
      const data = await api.fitnessPlan({ goal: aiGoal, level: aiLevel })
      setAiPlan(data)
    } catch (e) {
      setAiError(e?.message || 'Failed to generate plan')
    } finally {
      setAiBusy(false)
    }
  }

  const workouts = loadUserCollection(user.id, 'fitness:workouts')

  function exportPlanPdf() {
    exportFinalSetupPdf({
      user,
      domainTitle: 'Fitness Plan',
      generatedAtIso: new Date().toISOString(),
      sections: [
        {
          title: 'Profile (self-reported)',
          lines: [
            `Height: ${profile.heightCm || 'n/a'} cm`,
            `Weight: ${profile.weightKg || 'n/a'} kg`,
            suggestedPlan.bmi ? `BMI (approx): ${suggestedPlan.bmi.toFixed(1)} — ${suggestedPlan.category}` : 'BMI (approx): n/a',
          ],
        },
        {
          title: suggestedPlan.title,
          lines: [suggestedPlan.summary, ...suggestedPlan.bullets],
        },
        {
          title: 'Weekly schedule (example)',
          lines: suggestedPlan.schedule.length ? suggestedPlan.schedule : ['Enter profile details to generate a schedule.'],
        },
      ],
    })
  }

  function toggleDone(activityId) {
    setEditor((prev) => {
      const dayId = prev.selectedDayId
      const activity = prev.catalog.find((a) => a.id === activityId)
      if (!dayId || !activity) return prev

      const ensured = ensurePerDayActivity(prev.perDay, dayId, activity)
      const current = ensured[dayId][activityId]
      return {
        ...prev,
        perDay: {
          ...ensured,
          [dayId]: {
            ...ensured[dayId],
            [activityId]: { ...current, done: !current.done },
          },
        },
      }
    })
  }

  function updateSelectedDetails(patch) {
    setEditor((prev) => {
      const dayId = prev.selectedDayId
      const activityId = prev.selectedActivityId
      const activity = prev.catalog.find((a) => a.id === activityId)
      if (!dayId || !activityId || !activity) return prev

      const ensured = ensurePerDayActivity(prev.perDay, dayId, activity)
      const current = ensured[dayId][activityId]
      return {
        ...prev,
        perDay: {
          ...ensured,
          [dayId]: {
            ...ensured[dayId],
            [activityId]: { ...current, ...patch },
          },
        },
      }
    })
  }

  function bumpSelected(field, delta, min = 0) {
    const current = perDayActivity?.[field]
    const fallback =
      selectedActivity?.kind === 'cardio'
        ? selectedActivity?.defaultMinutes ?? 10
        : field === 'sets'
          ? selectedActivity?.defaultSets ?? 3
          : field === 'reps'
            ? selectedActivity?.defaultReps ?? 10
            : selectedActivity?.defaultKg ?? 0

    const base = Number.isFinite(Number(current)) ? Number(current) : Number(fallback)
    const next = Math.max(min, Math.round((base + delta) * 10) / 10)
    updateSelectedDetails({ [field]: next })
  }

  function addAllToWorkouts() {
    if (!selectedDay) return

    const dayActivityIds = selectedDay.activityIds || []
    if (!dayActivityIds.length) return

    for (const activityId of dayActivityIds) {
      const activity = editor.catalog.find((a) => a.id === activityId)
      if (!activity) continue

      const ensured = ensurePerDayActivity(editor.perDay, selectedDay.id, activity)
      const state = ensured?.[selectedDay.id]?.[activityId]

      // Very simple estimate for strength sessions; cardio uses its minutes.
      const minutesEstimate =
        activity.kind === 'cardio'
          ? Number(state?.minutes ?? activity.defaultMinutes ?? 10)
          : Math.max(5, Number(state?.sets ?? activity.defaultSets ?? 3) * 3)

      appendUserCollectionItem(user.id, 'fitness:workouts', {
        id: makeId('workout'),
        date: logDate,
        minutes: Number(minutesEstimate || 0),
        type: activity.name,
        intensity: 'Moderate',
        createdAt: new Date().toISOString(),
        meta: {
          source: 'workout-editor',
          dayId: selectedDay.id,
          dayName: selectedDay.name,
          activityId: activity.id,
          sets: activity.kind === 'cardio' ? undefined : state?.sets,
          reps: activity.kind === 'cardio' ? undefined : state?.reps,
          kg: activity.kind === 'cardio' ? undefined : state?.kg,
          note: state?.note || '',
        },
      })
    }
  }

  function GymClipart({ size = 160 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Gym">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.20" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="78" fill="url(#g)" />
        <g fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="10" strokeLinecap="round">
          <path d="M42 90v20" />
          <path d="M158 90v20" />
          <path d="M62 82v36" />
          <path d="M138 82v36" />
          <path d="M74 100h52" />
        </g>
        <g fill="none" stroke="currentColor" strokeOpacity="0.30" strokeWidth="6" strokeLinecap="round">
          <path d="M28 100h28" />
          <path d="M144 100h28" />
        </g>
      </svg>
    )
  }

  function deleteWorkout(id) {
    removeUserCollectionItem(user.id, 'fitness:workouts', id)
  }

  return (
    <div className="domainPage fitness">
      <div className="card heroCard heroCard--fitness" style={{ marginBottom: '1rem' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 260 }}>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Mini fitness dashboard</h2>
            <div className="muted">Enter height + weight to get a suggested plan (non-medical) and export it.</div>
          </div>
          <button className="btn primary" type="button" onClick={exportPlanPdf} disabled={!suggestedPlan.ready}>
            Export plan as PDF
          </button>
        </div>

        <div className="grid two" style={{ marginTop: '1rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div className="grid" style={{ gap: '0.75rem' }}>
              <div className="field">
                <label>Height (cm)</label>
                <input
                  inputMode="numeric"
                  value={profile.heightCm}
                  onChange={(e) => setProfile((p) => ({ ...p, heightCm: e.target.value }))}
                  placeholder="e.g. 170"
                />
              </div>
              <div className="field">
                <label>Weight (kg)</label>
                <input
                  inputMode="numeric"
                  value={profile.weightKg}
                  onChange={(e) => setProfile((p) => ({ ...p, weightKg: e.target.value }))}
                  placeholder="e.g. 70"
                />
              </div>
              <div className="muted">
                {suggestedPlan.bmi
                  ? `BMI (approx): ${suggestedPlan.bmi.toFixed(1)} — ${suggestedPlan.category}`
                  : 'BMI (approx): n/a'}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>{suggestedPlan.title}</h3>
            <div className="muted" style={{ marginBottom: '0.75rem' }}>{suggestedPlan.summary}</div>
            {suggestedPlan.ready ? (
              <>
                <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {suggestedPlan.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
                <div style={{ height: 10 }} />
                <div className="muted" style={{ fontWeight: 600 }}>Weekly schedule (example)</div>
                <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {suggestedPlan.schedule.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="muted">Fill in height and weight to generate your plan.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>AI-assisted fitness suggestions</h3>
            <div className="muted">Non-medical guidance from the backend agent. Adjust goal/level and generate.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" type="button" onClick={() => setAiPlan(null)} disabled={aiBusy && !aiPlan}>Clear</button>
            <button className="btn primary" type="button" onClick={generateAiPlan} disabled={aiBusy}>
              {aiBusy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="grid" style={{ gap: 10 }}>
            <div className="field">
              <label>Goal</label>
              <input value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} placeholder="e.g. fat loss, endurance, strength" />
            </div>
            <div className="field">
              <label>Level</label>
              <select value={aiLevel} onChange={(e) => setAiLevel(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            {aiError ? <div className="muted" style={{ color: 'var(--c-danger)' }}>{aiError}</div> : null}
          </div>

          <div>
            {aiPlan ? (
              <>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{aiPlan.title || 'Plan'}</div>
                {aiPlan.disclaimer ? <div className="muted" style={{ marginBottom: 10 }}>{aiPlan.disclaimer}</div> : null}
                {Array.isArray(aiPlan.plan) && aiPlan.plan.length ? (
                  <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {aiPlan.plan.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">No plan generated yet.</div>
                )}
                {Array.isArray(aiPlan.youtube_links) && aiPlan.youtube_links.length ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="muted" style={{ fontWeight: 700, marginBottom: 6 }}>YouTube links</div>
                    <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {aiPlan.youtube_links.slice(0, 5).map((u) => (
                        <li key={u}>
                          <a href={u} target="_blank" rel="noreferrer">{u}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="muted">Generate suggestions to see a plan here.</div>
            )}
          </div>
        </div>
      </div>

      <div className="fitnessEditor">
        <div className="fitnessEditorCol">
          <div className="fitnessEditorTitle">
            <h2 style={{ margin: 0 }}>Workout editor</h2>
          </div>

          <div className="fitnessEditorMedia" aria-hidden="true">
            <div className="fitnessEditorMediaInner">
              <div className="fitnessEditorMediaOverlay" />
              <div className="fitnessEditorClipart" style={{ color: 'var(--c-primary)' }}>
                <GymClipart />
              </div>
            </div>
          </div>

          <div className="fitnessEditorSectionHeader">
            <h3 style={{ margin: 0 }}>Days</h3>
          </div>

          <div className="grid" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
            <div className="field">
              <label>Day</label>
              <select value={selectedDay?.id || 'day_1'} onChange={(e) => selectDay(e.target.value)}>
                {editor.days.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Day name</label>
              <input
                value={selectedDay?.name || ''}
                onChange={(e) => renameSelectedDay(e.target.value)}
                placeholder="Day name"
              />
            </div>
            <div className="muted">7-day schedule • Select activities per day.</div>
          </div>
        </div>

        <div className="fitnessEditorCol">
          <div className="fitnessEditorSectionHeader">
            <h3 style={{ margin: 0 }}>Activities</h3>
          </div>

          <div className="fitnessEditorList" role="list">
            {(editor.catalog || []).map((activity) => {
              const included = Boolean((selectedDay?.activityIds || []).includes(activity.id))
              const dayActivity = editor.perDay?.[selectedDay?.id]?.[activity.id]
              const subtitle =
                activity.kind === 'cardio'
                  ? `${dayActivity?.minutes ?? activity.defaultMinutes ?? 10} min`
                  : `${dayActivity?.sets ?? activity.defaultSets ?? 3} sets`

              const isActive = activity.id === selectedActivity?.id
              const cls = `${isActive ? 'fitnessActivity active' : 'fitnessActivity'}${included ? '' : ' inactive'}`

              return (
                <div key={activity.id} role="listitem" className={cls}>
                  <button type="button" className="fitnessActivityMain" onClick={() => selectActivity(activity.id)}>
                    <div className="fitnessActivityIcon" aria-hidden="true">{activity.icon}</div>
                    <div className="fitnessActivityText">
                      <div className="fitnessActivityName">{activity.name}</div>
                      <div className="fitnessActivityMeta">{subtitle}</div>
                    </div>
                  </button>
                  <label className="fitnessActivityCheck" title="Include in this day">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleActivityInSelectedDay(activity.id)}
                      aria-label={included ? 'Included' : 'Not included'}
                    />
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        <div className="fitnessEditorCol">
          <div className="fitnessEditorTitle">
            <h2 style={{ margin: 0 }}>{selectedActivity?.name || 'Select an activity'}</h2>
          </div>

          <div key={detailsAnimKey} className="fitnessDetails">
            <div className="fitnessDetailsMedia" aria-hidden="true">
              <div className="fitnessDetailsMediaInner">
                <div className="fitnessDetailsFigure">{selectedActivity?.icon || '🏋️'}</div>

                {selectedVideoUrl ? (
                  <button
                    type="button"
                    className="iconBtn fitnessPlayBtn"
                    title="Watch exercise demo"
                    aria-label="Watch exercise demo"
                    onClick={() => window.open(selectedVideoUrl, '_blank', 'noopener,noreferrer')}
                  >
                    ▶
                  </button>
                ) : null}
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
              <div className="muted">
                Day: <span style={{ fontWeight: 800 }}>{selectedDay?.name}</span>
              </div>
              <label className="row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={Boolean(selectedDay?.activityIds?.includes(selectedActivity?.id))}
                  onChange={() => toggleActivityInSelectedDay(selectedActivity.id)}
                />
                <span className="muted" style={{ fontWeight: 700 }}>Include</span>
              </label>
            </div>

            {selectedActivity?.kind === 'cardio' ? (
              <div className="fitnessStats">
                <div className="fitnessStat">
                  <div className="fitnessStatLabel">Minutes</div>
                  <div className="fitnessStatValueRow">
                    <div className="fitnessStatValue" aria-label="Minutes">
                      {String(perDayActivity?.minutes ?? selectedActivity.defaultMinutes ?? 10)}
                    </div>
                    <div className="fitnessStepper" aria-label="Minutes controls">
                      <button type="button" className="fitnessStepBtn" onClick={() => bumpSelected('minutes', 1)} aria-label="Increase minutes">▲</button>
                      <button type="button" className="fitnessStepBtn" onClick={() => bumpSelected('minutes', -1)} aria-label="Decrease minutes">▼</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="fitnessStats">
                <div className="fitnessStat">
                  <div className="fitnessStatLabel">Sets</div>
                  <div className="fitnessStatValueRow">
                    <div className="fitnessStatValue" aria-label="Sets">
                      {String(perDayActivity?.sets ?? selectedActivity.defaultSets ?? 3)}
                    </div>
                    <div className="fitnessStepper" aria-label="Sets controls">
                      <button type="button" className="fitnessStepBtn" onClick={() => bumpSelected('sets', 1)} aria-label="Increase sets">▲</button>
                      <button type="button" className="fitnessStepBtn" onClick={() => bumpSelected('sets', -1)} aria-label="Decrease sets">▼</button>
                    </div>
                  </div>
                </div>
                <div className="fitnessStat">
                  <div className="fitnessStatLabel">Reps</div>
                  <div className="fitnessStatValueRow">
                    <div className="fitnessStatValue" aria-label="Reps">
                      {String(perDayActivity?.reps ?? selectedActivity.defaultReps ?? 10)}
                    </div>
                    <div className="fitnessStepper" aria-label="Reps controls">
                      <button type="button" className="fitnessStepBtn" onClick={() => bumpSelected('reps', 1)} aria-label="Increase reps">▲</button>
                      <button type="button" className="fitnessStepBtn" onClick={() => bumpSelected('reps', -1)} aria-label="Decrease reps">▼</button>
                    </div>
                  </div>
                </div>
                <div className="fitnessStat">
                  <div className="fitnessStatLabel">Kg</div>
                  <div className="fitnessStatValueRow">
                    <div className="fitnessStatValue" aria-label="Kg">
                      {String(perDayActivity?.kg ?? selectedActivity.defaultKg ?? 0)}
                    </div>
                    <div className="fitnessStepper" aria-label="Kg controls">
                      <button type="button" className="fitnessStepBtn" onClick={() => bumpSelected('kg', 1)} aria-label="Increase kg">▲</button>
                      <button type="button" className="fitnessStepBtn" onClick={() => bumpSelected('kg', -1)} aria-label="Decrease kg">▼</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="field" style={{ marginTop: '0.9rem' }}>
              <label>Note</label>
              <textarea
                value={String(perDayActivity?.note ?? '')}
                onChange={(e) => updateSelectedDetails({ note: e.target.value })}
                placeholder="Add note..."
              />
            </div>
          </div>
        </div>

        <div className="fitnessEditorFooter">
          <div className="row" style={{ justifyContent: 'center' }}>
            <div className="field" style={{ margin: 0, minWidth: 220 }}>
              <label>Log date</label>
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </div>
            <button
              className="btn primary"
              type="button"
              onClick={addAllToWorkouts}
              disabled={!selectedDay?.activityIds?.length}
              style={{ alignSelf: 'flex-end' }}
            >
              Add all
            </button>
          </div>
          <div className="muted" style={{ textAlign: 'center', marginTop: 8 }}>
            Adds today’s selected day activities to your workout log.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Added plans (logged workouts)</h3>
            <div className="muted">Entries added via “Add all” appear here as a description log.</div>
          </div>
          <div className="muted" style={{ fontWeight: 700 }}>Total: {workouts.length}</div>
        </div>

        {workouts.length ? (
          <div className="grid" style={{ gap: 10, marginTop: 10 }}>
            {workouts.slice(0, 12).map((w) => (
              <div key={w.id} className="card" style={{ padding: '0.85rem 0.9rem' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800 }}>
                    {w.type}
                    {w?.meta?.dayName ? <span className="muted" style={{ fontWeight: 800 }}> • {w.meta.dayName}</span> : null}
                  </div>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <div className="muted">{w.date} • {w.minutes} min</div>
                    <button className="btn" type="button" onClick={() => deleteWorkout(w.id)}>Delete</button>
                  </div>
                </div>
                {w?.meta?.source === 'workout-editor' ? (
                  <div className="muted" style={{ marginTop: 6 }}>
                    {w.meta.sets != null ? `Sets ${w.meta.sets} • ` : ''}
                    {w.meta.reps != null ? `Reps ${w.meta.reps} • ` : ''}
                    {w.meta.kg != null ? `Kg ${w.meta.kg}` : ''}
                    {w.meta.note ? ` — ${w.meta.note}` : ''}
                  </div>
                ) : (
                  <div className="muted" style={{ marginTop: 6 }}>
                    Intensity: {w.intensity}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="muted" style={{ marginTop: 10 }}>No plans/workouts added yet. Use “Add all” to log your selected day.</div>
        )}
      </div>
    </div>
  )
}
