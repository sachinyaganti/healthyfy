import { useEffect, useMemo, useRef, useState } from 'react'
import { loadJson, saveJson, scopedKey } from '../../../utils/storage.js'
import { todayIsoDate, isWithinLastNDays } from '../../../utils/dates.js'
import {
  communityFoodHabits,
  dietaryPreferences,
  mealInspirationCards,
  NUTRITION_SUPPORT_DISCLAIMER,
} from '../data/nutritionSupportData.js'

function pickAvatarColors(seed) {
  const palette = [
    { bg: 'rgba(37, 99, 235, 0.12)', stroke: 'rgba(37, 99, 235, 0.40)' },
    { bg: 'rgba(34, 197, 94, 0.12)', stroke: 'rgba(34, 197, 94, 0.40)' },
    { bg: 'rgba(245, 158, 11, 0.12)', stroke: 'rgba(245, 158, 11, 0.42)' },
    { bg: 'rgba(15, 23, 42, 0.06)', stroke: 'rgba(15, 23, 42, 0.22)' },
  ]
  let hash = 0
  for (let i = 0; i < String(seed).length; i += 1) hash = (hash * 31 + String(seed).charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

function AiAvatar({ label, seed }) {
  const colors = pickAvatarColors(seed)
  const initial = String(label || '?').trim().slice(0, 1).toUpperCase()

  return (
    <div className="nutritionAiAvatar" aria-hidden="true" style={{ background: colors.bg, borderColor: colors.stroke }}>
      <div className="nutritionAiAvatarInner" style={{ borderColor: colors.stroke }}>
        {initial}
      </div>
    </div>
  )
}

function Chip({ active, children, onClick, title }) {
  return (
    <button type="button" className={`nutritionChip${active ? ' active' : ''}`} onClick={onClick} title={title}>
      {children}
    </button>
  )
}

function SectionTitle({ children }) {
  return <div className="nutritionSidebarTitle">{children}</div>
}

function safeParseIso(iso) {
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) ? d : null
}

function computeNudges({ meals, waterLogs }) {
  const today = todayIsoDate()
  const nudges = []

  const waterToday = (waterLogs || []).some((w) => w?.date === today && Number(w?.ml || 0) > 0)
  if (!waterToday) nudges.push({ id: 'water-today', text: "You haven’t logged water today." })

  const mealsToday = (meals || []).filter((m) => m?.date === today)
  if (mealsToday.length === 0) {
    nudges.push({ id: 'meal-today', text: 'No meals logged today yet—log one meal to keep awareness steady.' })
  } else {
    const lastUpdated = mealsToday
      .map((m) => safeParseIso(m.updatedAt || m.createdAt))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0]

    if (lastUpdated) {
      const hours = (Date.now() - lastUpdated.getTime()) / 36e5
      if (hours >= 6) nudges.push({ id: 'meal-gap', text: 'Long gap between meal logs detected—consider a small, balanced snack or hydration check-in.' })
    }
  }

  const daysWithWater = new Set(
    (waterLogs || []).filter((w) => isWithinLastNDays(w?.date, 7) && Number(w?.ml || 0) > 0).map((w) => w.date),
  )
  const daysWithMeals = new Set((meals || []).filter((m) => isWithinLastNDays(m?.date, 7)).map((m) => m.date))

  if (daysWithWater.size >= 4 && daysWithMeals.size >= 4) {
    nudges.push({ id: 'consistency', text: 'Great consistency this week—keep pairing meals with hydration moments.' })
  }

  return nudges.slice(0, 3)
}

function computeAwarenessBadges({ todayTotals, waterLoggedToday }) {
  const badges = []

  if (Number(todayTotals?.fiber || 0) > 0) badges.push('Fiber-friendly day')
  if (Number(todayTotals?.protein || 0) > 0) badges.push('Protein-inclusive meals')
  if (waterLoggedToday) badges.push('Hydration-focused day')

  return badges
}

export default function NutritionRightSidebar({ userId, meals, waterLogs, todayPlannerTotals }) {
  const [selectedPreferenceId, setSelectedPreferenceId] = useState('balanced')
  const [uiNote, setUiNote] = useState('')
  const inspirationRef = useRef(null)

  const prefKey = useMemo(() => scopedKey(userId, 'nutrition:preference'), [userId])

  useEffect(() => {
    const loaded = loadJson(prefKey, 'balanced')
    const exists = dietaryPreferences.some((p) => p.id === loaded)
    setSelectedPreferenceId(exists ? loaded : 'balanced')
  }, [prefKey])

  const activePreferenceLabel = useMemo(() => {
    return dietaryPreferences.find((p) => p.id === selectedPreferenceId)?.label || 'Balanced Diet'
  }, [selectedPreferenceId])

  const filteredInspiration = useMemo(() => {
    if (selectedPreferenceId === 'all') return mealInspirationCards
    return mealInspirationCards.filter((m) => (m.preferences || []).includes(selectedPreferenceId))
  }, [selectedPreferenceId])

  const filteredCommunity = useMemo(() => {
    if (selectedPreferenceId === 'all') return communityFoodHabits
    return communityFoodHabits.filter((c) => c.preferenceId === selectedPreferenceId)
  }, [selectedPreferenceId])

  const nudges = useMemo(() => computeNudges({ meals, waterLogs }), [meals, waterLogs])

  const waterLoggedToday = useMemo(() => {
    const today = todayIsoDate()
    return (waterLogs || []).some((w) => w?.date === today && Number(w?.ml || 0) > 0)
  }, [waterLogs])

  const awarenessBadges = useMemo(
    () => computeAwarenessBadges({ todayTotals: todayPlannerTotals, waterLoggedToday }),
    [todayPlannerTotals, waterLoggedToday],
  )

  function setPreference(nextId) {
    setSelectedPreferenceId(nextId)
    saveJson(prefKey, nextId)
  }

  function viewInspiration() {
    inspirationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function joinDiscussionsUiOnly() {
    setUiNote('Community discussions are UI-only in this demo build.')
    setTimeout(() => setUiNote(''), 2400)
  }

  return (
    <aside className="nutritionRightSidebar" aria-label="Nutrition support hub sidebar">
      <div className="card">
        <SectionTitle>Nutrition Education</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>
          Balanced nutrition focuses on meal regularity, food variety, and hydration to support daily energy and well-being.
        </div>
        <div className="nutritionSidebarDisclaimer" style={{ marginTop: 10 }}>{NUTRITION_SUPPORT_DISCLAIMER}</div>
      </div>

      <div className="card">
        <SectionTitle>Dietary Preference Filter</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>Select a preference to filter inspiration and community habits.</div>

        <div className="nutritionFilterGrid" style={{ marginTop: 10 }}>
          {dietaryPreferences.map((p) => (
            <Chip key={p.id} active={selectedPreferenceId === p.id} onClick={() => setPreference(p.id)}>
              {p.label}
            </Chip>
          ))}
        </div>

        <div className="muted" style={{ marginTop: 10 }}>
          Active: <span style={{ fontWeight: 900, color: 'var(--c-text)' }}>{activePreferenceLabel}</span>
        </div>
      </div>

      <div className="card" ref={inspirationRef}>
        <SectionTitle>Meal Inspiration Cards</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>Suggestions only (no calorie targets).</div>

        <div className="nutritionScrollList" style={{ marginTop: 10 }}>
          {filteredInspiration.map((m) => (
            <div key={m.id} className="card" style={{ padding: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 900 }}>{m.name}</div>
                  <div className="muted">{m.mealType} • Best time: {m.bestTime}</div>
                </div>
                <span className="pill">Suggestion</span>
              </div>

              <div style={{ marginTop: 8 }}>
                <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Included food groups</div>
                <div className="row" style={{ gap: 8 }}>
                  {m.foodGroups.map((g) => (
                    <span key={g} className="pill">{g}</span>
                  ))}
                </div>
              </div>

              <div className="muted" style={{ marginTop: 8 }}>
                Example: <span style={{ fontWeight: 800, color: 'var(--c-text)' }}>{m.example}</span>
              </div>
            </div>
          ))}
          {!filteredInspiration.length ? <div className="muted">No inspiration cards for this preference yet.</div> : null}
        </div>
      </div>

      <div className="card">
        <SectionTitle>Community Food Habits</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>Anonymized habits for motivation. No medical claims.</div>

        <div className="nutritionScrollList" style={{ marginTop: 10 }}>
          {filteredCommunity.map((c) => (
            <div key={c.id} className="card" style={{ padding: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <AiAvatar label={c.anonName} seed={c.id} />
                  <div>
                    <div style={{ fontWeight: 900 }}>{c.anonName}</div>
                    <div className="muted">Preference: {c.preferenceLabel}</div>
                    <div className="muted" style={{ marginTop: 4 }}>Habit: {c.habit}</div>
                    <div className="muted" style={{ marginTop: 4 }}>Benefit: {c.benefit}</div>
                  </div>
                </div>
              </div>

              <div className="nutritionQuote" style={{ marginTop: 10 }}>
                “{c.quote}”
              </div>
            </div>
          ))}
          {!filteredCommunity.length ? <div className="muted">No community cards for this preference yet.</div> : null}
        </div>

        <div className="nutritionSidebarDisclaimer" style={{ marginTop: 12 }}>{NUTRITION_SUPPORT_DISCLAIMER}</div>
      </div>

      <div className="card">
        <SectionTitle>Smart Nutrition Nudges</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>Informational reminders based on your recent logs.</div>

        <div className="grid" style={{ gap: 8, marginTop: 10 }}>
          {nudges.length ? (
            nudges.map((n) => (
              <div key={n.id} className="card" style={{ padding: 10 }}>
                <div style={{ fontWeight: 800 }}>{n.text}</div>
              </div>
            ))
          ) : (
            <div className="muted">No nudges right now—nice work keeping things updated.</div>
          )}
        </div>
      </div>

      <div className="card">
        <SectionTitle>Micronutrient Awareness (Non-Clinical)</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>Soft badges for awareness only (not scores).</div>

        <div className="row" style={{ marginTop: 10, gap: 8 }}>
          {awarenessBadges.length ? (
            awarenessBadges.map((b) => <span key={b} className="pill">{b}</span>)
          ) : (
            <span className="muted">No badges yet today.</span>
          )}
        </div>
      </div>

      <div className="card">
        <SectionTitle>Social Actions</SectionTitle>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" type="button" onClick={viewInspiration}>View Meal Inspiration</button>
          <button className="btn" type="button" onClick={joinDiscussionsUiOnly}>Join Community Discussions</button>
        </div>
        {uiNote ? <div className="muted" style={{ marginTop: 10 }}>{uiNote}</div> : null}
      </div>
    </aside>
  )
}
