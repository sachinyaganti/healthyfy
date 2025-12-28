import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { appendUserCollectionItem, loadUserCollection, removeUserCollectionItem, saveUserCollection } from '../../data/wellnessStorage.js'
import { makeId } from '../../utils/id.js'
import { todayIsoDate } from '../../utils/dates.js'
import LineChart from '../../components/charts/LineChart.jsx'
import { nutritionInsights } from '../../utils/insights.js'
import { exportFinalSetupPdf } from '../../utils/pdfExport.js'
import { loadJson, saveJson, scopedKey } from '../../utils/storage.js'
import { FOOD_COMBOS, FOOD_TAGS } from '../../data/foodCombos.js'
import NutritionRightSidebar from './components/NutritionRightSidebar.jsx'
import { api } from '../../services/api.js'

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseIsoToUtcDate(isoDate) {
  const [y, m, d] = String(isoDate || '').split('-').map((x) => Number(x))
  if (!y || !m || !d) return new Date(Date.UTC(1970, 0, 1))
  return new Date(Date.UTC(y, m - 1, d))
}

function utcDateToIso(d) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function mondayOfWeek(isoDate) {
  const d = parseIsoToUtcDate(isoDate)
  const day = d.getUTCDay() // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7 // days since Monday
  d.setUTCDate(d.getUTCDate() - diff)
  return utcDateToIso(d)
}

function addDaysIso(iso, days) {
  const d = parseIsoToUtcDate(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return utcDateToIso(d)
}

// Legacy (timezone-shifting) helpers used only to migrate older stored planner keys.
function mondayOfWeekLegacy(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7 // days since Monday
  d.setDate(d.getDate() - diff)
  return d.toISOString().slice(0, 10)
}

function mealIdFor(date, mealType) {
  return `meal:${date}:${mealType}`
}

function isWithinWeek(isoDate, weekStartIso) {
  return isoDate >= weekStartIso && isoDate <= addDaysIso(weekStartIso, 6)
}

function upsertMealInCollection(items, meal, { moveToTop }) {
  const idx = items.findIndex((x) => x.id === meal.id || (x.date === meal.date && x.mealType === meal.mealType))
  const base = items.filter((x) => x.id !== meal.id && !(x.date === meal.date && x.mealType === meal.mealType))

  if (moveToTop || idx < 0) return [meal, ...base]

  const next = [...base]
  const insertAt = Math.min(idx, next.length)
  next.splice(insertAt, 0, meal)
  return next
}

function syncPlannerFromMeals(prevPlanner, meals, weekStartIso) {
  if (!prevPlanner?.days) return prevPlanner

  const map = new Map()
  for (const m of meals || []) {
    if (!m?.date || !m?.mealType) continue
    if (!MEAL_SLOTS.includes(m.mealType)) continue
    if (!isWithinWeek(m.date, weekStartIso)) continue
    map.set(mealIdFor(m.date, m.mealType), m)
  }

  let changed = false
  const nextDays = { ...prevPlanner.days }

  for (let i = 0; i < 7; i += 1) {
    const date = addDaysIso(weekStartIso, i)
    const day = nextDays[date]
    if (!day) continue

    for (const slot of MEAL_SLOTS) {
      const cell = day[slot]
      if (!cell) continue

      const m = map.get(mealIdFor(date, slot))
      const nextName = String(m?.notes || '')
      const nextCalories = m?.calories === 0 || m?.calories ? String(m.calories) : ''
      const nextProtein = m?.protein === 0 || m?.protein ? String(m.protein) : ''
      const nextCarbs = m?.carbs === 0 || m?.carbs ? String(m.carbs) : ''
      const nextFat = m?.fat === 0 || m?.fat ? String(m.fat) : ''

      const prevName = String(cell.name || '')
      const prevCalories = String(cell.calories || '')
      const prevProtein = String(cell.protein || '')
      const prevCarbs = String(cell.carbs || '')
      const prevFat = String(cell.fat || '')

      if (
        prevName === nextName &&
        prevCalories === nextCalories &&
        prevProtein === nextProtein &&
        prevCarbs === nextCarbs &&
        prevFat === nextFat
      ) continue

      nextDays[date] = {
        ...day,
        [slot]: {
          ...cell,
          name: nextName,
          calories: nextCalories,
          protein: nextProtein,
          carbs: nextCarbs,
          fat: nextFat,
        },
      }
      changed = true
    }
  }

  if (!changed) return prevPlanner
  return { ...prevPlanner, days: nextDays }
}

function makeEmptyCell() {
  return {
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    notes: '',
  }
}

function makeDefaultPlanner(weekStartIso) {
  const days = {}
  for (let i = 0; i < 7; i += 1) {
    const date = addDaysIso(weekStartIso, i)
    days[date] = {}
    for (const slot of MEAL_SLOTS) days[date][slot] = makeEmptyCell()
  }

  return {
    weekStartIso,
    days,
  }
}

function normalizePlanner(input, weekStartIso) {
  const base = makeDefaultPlanner(weekStartIso)
  const src = input && typeof input === 'object' ? input : {}
  const srcDays = src.days && typeof src.days === 'object' ? src.days : {}

  const next = { ...base, ...src, weekStartIso, days: base.days }
  for (let i = 0; i < 7; i += 1) {
    const date = addDaysIso(weekStartIso, i)
    const fromDay = srcDays[date] || {}
    next.days[date] = {}
    for (const slot of MEAL_SLOTS) {
      const cell = fromDay[slot] || {}
      next.days[date][slot] = {
        ...makeEmptyCell(),
        ...cell,
      }
    }
  }
  return next
}

function sumNumberLike(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function dayTotals(day) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  for (const slot of MEAL_SLOTS) {
    const cell = day?.[slot]
    if (!cell) continue
    totals.calories += sumNumberLike(cell.calories)
    totals.protein += sumNumberLike(cell.protein)
    totals.carbs += sumNumberLike(cell.carbs)
    totals.fat += sumNumberLike(cell.fat)
    totals.fiber += sumNumberLike(cell.fiber)
    totals.sugar += sumNumberLike(cell.sugar)
  }
  return totals
}

function buildLast7DaysWaterSeries(waterLogs) {
  const dayMap = new Map()
  for (const w of waterLogs) {
    dayMap.set(w.date, (dayMap.get(w.date) || 0) + Number(w.ml || 0))
  }

  const labels = []
  const values = []
  const now = new Date()
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    labels.push(iso.slice(5))
    values.push(dayMap.get(iso) || 0)
  }

  return { labels, values }
}

export default function NutritionDashboard() {
  const { user } = useAuth()

  const [, bump] = useState(0)

  const [mealDate, setMealDate] = useState(todayIsoDate())
  const [mealType, setMealType] = useState('Lunch')
  const [calories, setCalories] = useState('500')
  const [notes, setNotes] = useState('')

  // Food combo picker (top menu)
  const [comboOpen, setComboOpen] = useState(false)
  const [comboApplyDate, setComboApplyDate] = useState(todayIsoDate())
  const [comboApplyMealType, setComboApplyMealType] = useState('Lunch')
  const [comboQuery, setComboQuery] = useState('')
  const [comboFilterMealType, setComboFilterMealType] = useState('All')
  const [comboFilterTag, setComboFilterTag] = useState('All')
  const [comboMaxCalories, setComboMaxCalories] = useState('')
  const [comboMinProtein, setComboMinProtein] = useState('')

  const [waterDate, setWaterDate] = useState(todayIsoDate())
  const [waterMl, setWaterMl] = useState('250')

  const [aiPreference, setAiPreference] = useState('balanced')
  const [aiAllergies, setAiAllergies] = useState('')
  const [aiPlan, setAiPlan] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')

  const meals = loadUserCollection(user.id, 'nutrition:meals')
  const waterLogs = loadUserCollection(user.id, 'nutrition:water')

  // Weekly diet planner
  const weekStartIso = useMemo(() => mondayOfWeek(todayIsoDate()), [])
  const legacyWeekStartIso = useMemo(() => mondayOfWeekLegacy(todayIsoDate()), [])
  const plannerKey = useMemo(() => scopedKey(user.id, `nutrition:planner:${weekStartIso}`), [user.id, weekStartIso])
  const legacyPlannerKey = useMemo(() => scopedKey(user.id, `nutrition:planner:${legacyWeekStartIso}`), [user.id, legacyWeekStartIso])
  const [planner, setPlanner] = useState(() => {
    const raw = loadJson(plannerKey, null) ?? loadJson(legacyPlannerKey, null)
    return normalizePlanner(raw, weekStartIso)
  })

  useEffect(() => {
    function onStorage(e) {
      const key = e?.detail?.key
      if (!key) return
      if (!key.startsWith(`healthyfy:v1:${user.id}:nutrition:`)) return
      bump((x) => x + 1)
    }
    window.addEventListener('healthyfy:storage', onStorage)
    return () => window.removeEventListener('healthyfy:storage', onStorage)
  }, [user.id])

  useEffect(() => {
    setPlanner((prev) => normalizePlanner(prev, weekStartIso))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Bootstrap (once per user+week): if the planner already contains entries,
    // ensure they exist in the meals collection so Recent meals + Unified dashboard stay in sync.
    const items = loadUserCollection(user.id, 'nutrition:meals')
    let next = items
    let changed = false

    for (let i = 0; i < 7; i += 1) {
      const date = addDaysIso(weekStartIso, i)
      for (const slot of MEAL_SLOTS) {
        const cell = planner.days?.[date]?.[slot]
        if (!cell) continue

        const name = String(cell.name || '').trim()
        const calRaw = String(cell.calories || '').trim()
        const cal = Number(calRaw)
        const hasAny = !!name || (!!calRaw && Number.isFinite(cal) && cal > 0)
        if (!hasAny) continue

        const id = mealIdFor(date, slot)
        const exists = items.some((m) => m.id === id || (m.date === date && m.mealType === slot))
        if (exists) continue

        const meal = {
          id,
          date,
          mealType: slot,
          calories: Number.isFinite(cal) ? cal : 0,
          notes: name,
          source: 'weekly-planner',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        next = upsertMealInCollection(next, meal, { moveToTop: false })
        changed = true
      }
    }

    if (changed) saveUserCollection(user.id, 'nutrition:meals', next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, weekStartIso])

  useEffect(() => {
    // Two-way sync: meals are the canonical list shown below.
    // Keep planner aligned to whatever exists in the meals collection.
    setPlanner((prev) => syncPlannerFromMeals(prev, meals, weekStartIso))
  }, [meals, weekStartIso])

  useEffect(() => {
    saveJson(plannerKey, planner)
  }, [plannerKey, planner])

  const series = useMemo(() => buildLast7DaysWaterSeries(waterLogs), [waterLogs])
  const insight = useMemo(() => nutritionInsights({ meals, waterLogs }), [meals, waterLogs])

  async function generateAiMealPlan() {
    setAiBusy(true)
    setAiError('')
    try {
      const data = await api.nutritionPlan({ preference: aiPreference, allergies: aiAllergies })
      setAiPlan(data)
    } catch (e) {
      setAiError(e?.message || 'Failed to generate meal plan')
    } finally {
      setAiBusy(false)
    }
  }

  const todayPlannerTotals = useMemo(() => {
    const d = planner.days?.[todayIsoDate()]
    return dayTotals(d)
  }, [planner])

  const filteredCombos = useMemo(() => {
    const q = comboQuery.trim().toLowerCase()
    const maxCal = Number(comboMaxCalories)
    const minProt = Number(comboMinProtein)

    return FOOD_COMBOS.filter((c) => {
      if (comboFilterMealType !== 'All' && c.mealType !== comboFilterMealType) return false
      if (comboFilterTag !== 'All' && !(c.tags || []).includes(comboFilterTag)) return false
      if (q && !String(c.name).toLowerCase().includes(q)) return false
      if (comboMaxCalories.trim() && Number.isFinite(maxCal) && c.calories > maxCal) return false
      if (comboMinProtein.trim() && Number.isFinite(minProt) && c.protein < minProt) return false
      return true
    })
  }, [comboQuery, comboFilterMealType, comboFilterTag, comboMaxCalories, comboMinProtein])

  function upsertMeal({ date, mealType: mt, calories: cal, notes: nt, protein, carbs, fat, source }) {
    const items = loadUserCollection(user.id, 'nutrition:meals')
    const id = mealIdFor(date, mt)
    const existing = items.find((m) => m.id === id || (m.date === date && m.mealType === mt))
    const meal = {
      id,
      date,
      mealType: mt,
      calories: Number(cal || 0),
      protein: Number(protein || 0),
      carbs: Number(carbs || 0),
      fat: Number(fat || 0),
      notes: String(nt || '').trim(),
      source: existing?.source || source,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const next = upsertMealInCollection(items, meal, { moveToTop: source === 'meal-form' || source === 'combo-picker' })
    saveUserCollection(user.id, 'nutrition:meals', next)

    if (MEAL_SLOTS.includes(mt) && isWithinWeek(date, weekStartIso)) {
      setPlanner((p) => ({
        ...p,
        days: {
          ...p.days,
          [date]: {
            ...p.days[date],
            [mt]: {
              ...p.days[date][mt],
              name: meal.notes,
              calories: String(meal.calories || ''),
              protein: String(meal.protein || ''),
              carbs: String(meal.carbs || ''),
              fat: String(meal.fat || ''),
            },
          },
        },
      }))
    }
  }

  function addMeal(e) {
    e.preventDefault()
    upsertMeal({
      date: mealDate,
      mealType,
      calories,
      notes,
      protein: 0,
      carbs: 0,
      fat: 0,
      source: 'meal-form',
    })
    setNotes('')
  }

  function addWater(e) {
    e.preventDefault()
    appendUserCollectionItem(user.id, 'nutrition:water', {
      id: makeId('water'),
      date: waterDate,
      ml: Number(waterMl || 0),
      createdAt: new Date().toISOString(),
    })
  }

  function removeMeal(id) {
    const m = meals.find((x) => x.id === id)
    if (m?.date && m?.mealType) {
      const items = loadUserCollection(user.id, 'nutrition:meals')
      const stableId = mealIdFor(m.date, m.mealType)
      const next = items.filter((x) => x.id !== id && x.id !== stableId && !(x.date === m.date && x.mealType === m.mealType))
      saveUserCollection(user.id, 'nutrition:meals', next)

      if (MEAL_SLOTS.includes(m.mealType) && isWithinWeek(m.date, weekStartIso)) {
        setPlanner((p) => ({
          ...p,
          days: {
            ...p.days,
            [m.date]: {
              ...p.days[m.date],
              [m.mealType]: {
                ...p.days[m.date][m.mealType],
                name: '',
                calories: '',
              },
            },
          },
        }))
      }
      return
    }
    removeUserCollectionItem(user.id, 'nutrition:meals', id)
  }

  function removeWater(id) {
    removeUserCollectionItem(user.id, 'nutrition:water', id)
  }

  function syncMealFromPlannerCell(date, slot, nextCell) {
    if (!MEAL_SLOTS.includes(slot)) return
    if (!isWithinWeek(date, weekStartIso)) return

    const name = String(nextCell?.name || '').trim()
    const calRaw = String(nextCell?.calories || '').trim()
    const cal = Number(calRaw)
    const proteinRaw = String(nextCell?.protein || '').trim()
    const carbsRaw = String(nextCell?.carbs || '').trim()
    const fatRaw = String(nextCell?.fat || '').trim()
    const protein = Number(proteinRaw)
    const carbs = Number(carbsRaw)
    const fat = Number(fatRaw)
    const hasAny = !!name || (!!calRaw && Number.isFinite(cal) && cal > 0)

    const items = loadUserCollection(user.id, 'nutrition:meals')
    const id = mealIdFor(date, slot)
    const existing = items.find((m) => m.id === id || (m.date === date && m.mealType === slot))

    if (!hasAny) {
      if (!existing) return
      const next = items.filter((m) => m.id !== existing.id && !(m.date === date && m.mealType === slot))
      saveUserCollection(user.id, 'nutrition:meals', next)
      return
    }

    const meal = {
      id,
      date,
      mealType: slot,
      calories: Number.isFinite(cal) ? cal : 0,
      protein: Number.isFinite(protein) ? protein : 0,
      carbs: Number.isFinite(carbs) ? carbs : 0,
      fat: Number.isFinite(fat) ? fat : 0,
      notes: name,
      source: existing?.source || 'weekly-planner',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const next = upsertMealInCollection(items, meal, { moveToTop: false })
    saveUserCollection(user.id, 'nutrition:meals', next)
  }

  function exportPdf() {
    const plannerSectionLines = []
    for (let i = 0; i < 7; i += 1) {
      const date = addDaysIso(weekStartIso, i)
      const d = planner.days?.[date]
      const totals = dayTotals(d)
      plannerSectionLines.push(`${DOW[i]} ${date} — Calories ${Math.round(totals.calories)} | P ${Math.round(totals.protein)}g | C ${Math.round(totals.carbs)}g | F ${Math.round(totals.fat)}g`)
      for (const slot of MEAL_SLOTS) {
        const cell = d?.[slot]
        const name = (cell?.name || '').trim()
        if (!name) continue
        const cal = cell?.calories ? ` — ${cell.calories} cal` : ''
        const macros =
          cell?.protein || cell?.carbs || cell?.fat
            ? ` (P${cell.protein || 0}/C${cell.carbs || 0}/F${cell.fat || 0})`
            : ''
        plannerSectionLines.push(`- ${slot}: ${name}${cal}${macros}`)
      }
      plannerSectionLines.push('')
    }

    exportFinalSetupPdf({
      user,
      domainTitle: 'Nutrition',
      generatedAtIso: new Date().toISOString(),
      sections: [
        {
          title: 'Domain summary',
          lines: [
            `Meals logged: ${meals.length}`,
            `Water logs: ${waterLogs.length}`,
            'Note: Calorie tracking here is for awareness only and is not medical advice.',
          ],
        },
        {
          title: 'Trends & insights (rule-based)',
          lines: insight.bullets,
        },
        {
          title: `Weekly diet planner (${weekStartIso} to ${addDaysIso(weekStartIso, 6)})`,
          lines: plannerSectionLines.length ? plannerSectionLines : ['No planner entries yet.'],
        },
        {
          title: 'Recent meals (up to 10)',
          lines: meals.slice(0, 10).length
            ? meals.slice(0, 10).map((m) => `${m.date} — ${m.mealType} — ${m.calories} cal${m.notes ? ` — ${m.notes}` : ''}`)
            : ['No meals logged yet.'],
        },
        {
          title: 'Recent water logs (up to 10)',
          lines: waterLogs.slice(0, 10).length
            ? waterLogs.slice(0, 10).map((w) => `${w.date} — ${w.ml} ml`)
            : ['No water logs yet.'],
        },
      ],
    })
  }

  return (
    <div className="nutritionPageLayout domainPage nutrition" style={{ gap: '1rem' }}>
      <div className="card heroCard heroCard--nutrition">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Nutrition planning & dietary guidance</h2>
            <div className="muted">Non-medical planning support: meal awareness and hydration habits.</div>
          </div>
          <button className="btn primary" onClick={exportPdf}>Export Final Setup as PDF</button>
        </div>
      </div>

      <div className="grid nutritionMain" style={{ gap: '1rem' }}>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 6 }}>AI meal plan suggestions</h3>
              <div className="muted">Non-medical meal ideas generated by the backend agent.</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn" type="button" onClick={() => setAiPlan(null)} disabled={aiBusy && !aiPlan}>Clear</button>
              <button className="btn primary" type="button" onClick={generateAiMealPlan} disabled={aiBusy}>
                {aiBusy ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>

          <div className="grid two" style={{ marginTop: 12 }}>
            <div className="grid" style={{ gap: 10 }}>
              <div className="field">
                <label>Preference</label>
                <input value={aiPreference} onChange={(e) => setAiPreference(e.target.value)} placeholder="e.g. balanced, high-protein, vegetarian" />
              </div>
              <div className="field">
                <label>Allergies / avoid</label>
                <input value={aiAllergies} onChange={(e) => setAiAllergies(e.target.value)} placeholder="e.g. peanuts, lactose" />
              </div>
              {aiError ? <div className="muted" style={{ color: 'var(--c-danger)' }}>{aiError}</div> : null}
            </div>

            <div>
              {aiPlan ? (
                <>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>{aiPlan.title || 'Meal plan'}</div>
                  {aiPlan.disclaimer ? <div className="muted" style={{ marginBottom: 10 }}>{aiPlan.disclaimer}</div> : null}
                  {Array.isArray(aiPlan.meal_plan) && aiPlan.meal_plan.length ? (
                    <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {aiPlan.meal_plan.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="muted">No meal plan generated yet.</div>
                  )}
                  {Array.isArray(aiPlan.tips) && aiPlan.tips.length ? (
                    <div style={{ marginTop: 12 }}>
                      <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Tips</div>
                      <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                        {aiPlan.tips.slice(0, 5).map((t, idx) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="muted">Generate suggestions to see meal ideas here.</div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Weekly diet planner</h3>
            <div className="muted">Plan meals for the week (Mon–Sun). Totals are calculated from the planner inputs.</div>
          </div>
          <div className="muted" style={{ fontWeight: 800 }}>
            Week: {weekStartIso} → {addDaysIso(weekStartIso, 6)}
          </div>
        </div>

        <div className="plannerWrap" style={{ marginTop: 12 }}>
          <div className="plannerGrid">
            <div className="plannerCell plannerCorner" />
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDaysIso(weekStartIso, i)
              const totals = dayTotals(planner.days?.[date])
              return (
                <div key={date} className="plannerCell plannerHeader">
                  <div className="plannerHeaderTop">
                    <div style={{ fontWeight: 900 }}>{DOW[i]}</div>
                    <div className="muted" style={{ fontWeight: 700 }}>{date.slice(5)}</div>
                  </div>
                  <div className="plannerMetrics">
                    <div><span className="plannerDot" /> Calories <span className="muted">{Math.round(totals.calories)}</span></div>
                    <div><span className="plannerDot" /> Protein <span className="muted">{Math.round(totals.protein)}g</span></div>
                    <div><span className="plannerDot" /> Carbs <span className="muted">{Math.round(totals.carbs)}g</span></div>
                    <div><span className="plannerDot" /> Fat <span className="muted">{Math.round(totals.fat)}g</span></div>
                    <div><span className="plannerDot" /> Fiber <span className="muted">{Math.round(totals.fiber)}g</span></div>
                    <div><span className="plannerDot" /> Sugar <span className="muted">{Math.round(totals.sugar)}g</span></div>
                  </div>
                </div>
              )
            })}

            {MEAL_SLOTS.map((slot) => (
              <>
                <div key={`${slot}:label`} className="plannerCell plannerRowLabel">
                  <div className="plannerRowLabelText">{slot}</div>
                </div>
                {Array.from({ length: 7 }, (_, i) => {
                  const date = addDaysIso(weekStartIso, i)
                  const cell = planner.days?.[date]?.[slot] || makeEmptyCell()
                  return (
                    <div key={`${date}:${slot}`} className="plannerCell plannerSlot">
                      <input
                        className="plannerInput"
                        value={cell.name}
                        onChange={(e) => {
                          const value = e.target.value
                          setPlanner((p) => ({
                            ...p,
                            days: {
                              ...p.days,
                              [date]: {
                                ...p.days[date],
                                [slot]: { ...p.days[date][slot], name: value },
                              },
                            },
                          }))
                          syncMealFromPlannerCell(date, slot, { ...cell, name: value })
                        }}
                        placeholder="Meal name"
                      />
                      <div className="plannerMiniRow">
                        <input
                          className="plannerMini"
                          inputMode="numeric"
                          value={cell.calories}
                          onChange={(e) => {
                            const value = e.target.value
                            setPlanner((p) => ({
                              ...p,
                              days: {
                                ...p.days,
                                [date]: {
                                  ...p.days[date],
                                  [slot]: { ...p.days[date][slot], calories: value },
                                },
                              },
                            }))
                            syncMealFromPlannerCell(date, slot, { ...cell, calories: value })
                          }}
                          placeholder="cal"
                          aria-label={`${slot} calories`}
                        />
                        <input
                          className="plannerMini"
                          inputMode="numeric"
                          value={cell.protein}
                          onChange={(e) => setPlanner((p) => ({
                            ...p,
                            days: {
                              ...p.days,
                              [date]: {
                                ...p.days[date],
                                [slot]: { ...p.days[date][slot], protein: e.target.value },
                              },
                            },
                          }))}
                          placeholder="P"
                          aria-label={`${slot} protein grams`}
                          onBlur={(e) => syncMealFromPlannerCell(date, slot, { ...cell, protein: e.target.value })}
                        />
                        <input
                          className="plannerMini"
                          inputMode="numeric"
                          value={cell.carbs}
                          onChange={(e) => setPlanner((p) => ({
                            ...p,
                            days: {
                              ...p.days,
                              [date]: {
                                ...p.days[date],
                                [slot]: { ...p.days[date][slot], carbs: e.target.value },
                              },
                            },
                          }))}
                          placeholder="C"
                          aria-label={`${slot} carbs grams`}
                          onBlur={(e) => syncMealFromPlannerCell(date, slot, { ...cell, carbs: e.target.value })}
                        />
                        <input
                          className="plannerMini"
                          inputMode="numeric"
                          value={cell.fat}
                          onChange={(e) => setPlanner((p) => ({
                            ...p,
                            days: {
                              ...p.days,
                              [date]: {
                                ...p.days[date],
                                [slot]: { ...p.days[date][slot], fat: e.target.value },
                              },
                            },
                          }))}
                          placeholder="F"
                          aria-label={`${slot} fat grams`}
                          onBlur={(e) => syncMealFromPlannerCell(date, slot, { ...cell, fat: e.target.value })}
                        />
                      </div>
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {comboOpen ? (
        <div className="dialogOverlay" role="dialog" aria-modal="true" aria-label="Food combos">
          <div className="dialogPanel">
            <div className="dialogHeader">
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>Food combos</div>
                <div className="muted">Filter and select a meal combo. It will update the weekly planner and meal logs.</div>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setComboOpen(false)}>Close</button>
              </div>
            </div>

            <div className="dialogBody">
              <div className="grid" style={{ gap: '0.75rem' }}>
                <div className="grid two" style={{ gap: '0.75rem' }}>
                  <div className="field">
                    <label>Apply to date</label>
                    <input type="date" value={comboApplyDate} onChange={(e) => setComboApplyDate(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Apply to meal</label>
                    <select value={comboApplyMealType} onChange={(e) => setComboApplyMealType(e.target.value)}>
                      {MEAL_SLOTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid three" style={{ gap: '0.75rem' }}>
                  <div className="field">
                    <label>Search</label>
                    <input value={comboQuery} onChange={(e) => setComboQuery(e.target.value)} placeholder="e.g., paneer, oats, chicken" />
                  </div>
                  <div className="field">
                    <label>Meal type</label>
                    <select value={comboFilterMealType} onChange={(e) => setComboFilterMealType(e.target.value)}>
                      <option>All</option>
                      {MEAL_SLOTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Tag</label>
                    <select value={comboFilterTag} onChange={(e) => setComboFilterTag(e.target.value)}>
                      <option value="All">All</option>
                      {FOOD_TAGS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid two" style={{ gap: '0.75rem' }}>
                  <div className="field">
                    <label>Max calories</label>
                    <input value={comboMaxCalories} onChange={(e) => setComboMaxCalories(e.target.value)} inputMode="numeric" placeholder="e.g., 500" />
                  </div>
                  <div className="field">
                    <label>Min protein (g)</label>
                    <input value={comboMinProtein} onChange={(e) => setComboMinProtein(e.target.value)} inputMode="numeric" placeholder="e.g., 20" />
                  </div>
                </div>

                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="muted">{filteredCombos.length} items</div>
                  <button className="btn" onClick={() => {
                    setComboQuery('')
                    setComboFilterMealType('All')
                    setComboFilterTag('All')
                    setComboMaxCalories('')
                    setComboMinProtein('')
                  }}>Reset filters</button>
                </div>

                <div className="comboList">
                  {filteredCombos.map((c) => (
                    <div key={c.id} className="comboRow">
                      <div>
                        <div style={{ fontWeight: 800 }}>{c.name}</div>
                        <div className="comboMeta">
                          <span className="pill">{c.mealType}</span>
                          <span className="pill">{c.calories} cal</span>
                          <span className="pill">P {c.protein}g</span>
                          <span className="pill">C {c.carbs}g</span>
                          <span className="pill">F {c.fat}g</span>
                        </div>
                      </div>
                      <button
                        className="btn primary"
                        onClick={() => {
                          // Reflect into the meal form inputs too
                          setMealDate(comboApplyDate)
                          setMealType(comboApplyMealType)
                          setCalories(String(c.calories))
                          setNotes(c.name)

                          upsertMeal({
                            date: comboApplyDate,
                            mealType: comboApplyMealType,
                            calories: c.calories,
                            protein: c.protein,
                            carbs: c.carbs,
                            fat: c.fat,
                            notes: c.name,
                            source: 'combo-picker',
                          })
                          setComboOpen(false)
                        }}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid two">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Log a meal</h3>
          <form className="grid" onSubmit={addMeal}>
            <div className="field">
              <label>Date</label>
              <input type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} />
            </div>

            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800 }}>Meal Bundles</div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setComboApplyDate(mealDate)
                  setComboApplyMealType(mealType)
                  setComboOpen(true)
                }}
              >
                Food combos
              </button>
            </div>

            <div className="grid two">
              <div className="field">
                <label>Meal</label>
                <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Snack</option>
                </select>
              </div>
              <div className="field">
                <label>Calories (optional)</label>
                <input value={calories} onChange={(e) => setCalories(e.target.value)} inputMode="numeric" />
              </div>
            </div>
            <div className="field">
              <label>Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Protein-focused, veggies, mindful eating…" />
            </div>
            <button className="btn primary">Add meal</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Log water</h3>
          <form className="grid" onSubmit={addWater}>
            <div className="field">
              <label>Date</label>
              <input type="date" value={waterDate} onChange={(e) => setWaterDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Amount (ml)</label>
              <input value={waterMl} onChange={(e) => setWaterMl(e.target.value)} inputMode="numeric" />
            </div>
            <button className="btn primary">Add water log</button>
          </form>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Hydration (ml, last 7 days)</h3>
          <LineChart title="" labels={series.labels} data={series.values} yLabel="ml" />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{insight.title}</h3>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {insight.bullets.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent meals</h3>
          {meals.length ? (
            <div className="grid" style={{ gap: 8 }}>
              {meals.slice(0, 8).map((m) => (
                <div key={m.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="muted">
                    {m.date} — {m.mealType} — {m.calories} cal
                    {typeof m.protein === 'number' || typeof m.carbs === 'number' || typeof m.fat === 'number'
                      ? ` — P${m.protein || 0} C${m.carbs || 0} F${m.fat || 0}`
                      : ''}
                    {m.notes ? ` — ${m.notes}` : ''}
                  </div>
                  <button className="btn" onClick={() => removeMeal(m.id)}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No meals yet.</div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent water logs</h3>
          {waterLogs.length ? (
            <div className="grid" style={{ gap: 8 }}>
              {waterLogs.slice(0, 8).map((w) => (
                <div key={w.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="muted">{w.date} — {w.ml} ml</div>
                  <button className="btn" onClick={() => removeWater(w.id)}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No water logs yet.</div>
          )}
        </div>
      </div>

      </div>

      <NutritionRightSidebar
        userId={user.id}
        meals={meals}
        waterLogs={waterLogs}
        todayPlannerTotals={todayPlannerTotals}
      />
    </div>
  )
}
