import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { loadUserCollection } from '../data/wellnessStorage.js'
import { fitnessInsights, nutritionInsights, mentalInsights, chronicSupportInsights } from '../utils/insights.js'
import { api } from '../services/api.js'

function DomainCard({ title, description, to, kpis, insightTitle, bullets, className }) {
  return (
    <div className={`card domainCard${className ? ` ${className}` : ''}`}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 6 }}>{title}</h3>
          <div className="muted" style={{ marginBottom: 10 }}>{description}</div>
        </div>
        <Link className="btn" to={to}>Open</Link>
      </div>

      <div className="grid three" style={{ marginTop: 10 }}>
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>{insightTitle}</div>
        <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {bullets.slice(0, 3).map((b, idx) => (
            <li key={idx}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function UnifiedDashboard() {
  const { user } = useAuth()

  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiResult, setAiResult] = useState(null)

  const [aiFitnessGoal, setAiFitnessGoal] = useState('general fitness')
  const [aiFitnessLevel, setAiFitnessLevel] = useState('beginner')
  const [aiNutritionPreference, setAiNutritionPreference] = useState('balanced')
  const [aiNutritionAllergies, setAiNutritionAllergies] = useState('')
  const [aiBreathingMinutes, setAiBreathingMinutes] = useState('2')
  const [aiChronicCondition, setAiChronicCondition] = useState('')

  const [mlBusy, setMlBusy] = useState(false)
  const [mlError, setMlError] = useState('')
  const [mlResult, setMlResult] = useState(null)

  const [coachGoal, setCoachGoal] = useState('')
  const [coachHorizon, setCoachHorizon] = useState('7')
  const [coachPlan, setCoachPlan] = useState(null)
  const [coachBusy, setCoachBusy] = useState(false)
  const [coachError, setCoachError] = useState('')
  const [coachAdherence, setCoachAdherence] = useState('0.6')
  const [coachNotes, setCoachNotes] = useState('')

  function seriesLastNDays(map, days = 7) {
    const labels = []
    const values = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      labels.push(iso)
      values.push(Number(map.get(iso) || 0))
    }
    return { labels, values }
  }

  async function runMl(which) {
    setMlBusy(true)
    setMlError('')
    try {
      if (which === 'water') {
        const byDay = new Map()
        for (const w of waterLogs || []) byDay.set(w.date, (byDay.get(w.date) || 0) + Number(w.ml || 0))
        const s = seriesLastNDays(byDay, 7)
        const data = await api.mlForecast({ series: s.values, horizon: 7 })
        setMlResult({ which, labels: s.labels, series: s.values, data })
        return
      }

      if (which === 'mood') {
        const byDay = new Map()
        for (const m of moodLogs || []) byDay.set(m.date, Number(m.mood || 0))
        const s = seriesLastNDays(byDay, 7)
        const data = await api.mlForecast({ series: s.values, horizon: 7 })
        setMlResult({ which, labels: s.labels, series: s.values, data })
        return
      }

      if (which === 'severity') {
        const byDay = new Map()
        for (const s0 of symptoms || []) {
          const existing = byDay.get(s0.date)
          const value = Number(s0.severity || 0)
          byDay.set(s0.date, existing == null ? value : Math.round((existing + value) / 2))
        }
        const s = seriesLastNDays(byDay, 7)
        const data = await api.mlForecast({ series: s.values, horizon: 7 })
        setMlResult({ which, labels: s.labels, series: s.values, data })
        return
      }

      setMlError('Unknown ML action')
    } catch (e) {
      setMlError(e?.message || 'ML request failed')
    } finally {
      setMlBusy(false)
    }
  }

  async function createCoachPlan() {
    setCoachBusy(true)
    setCoachError('')
    try {
      const horizon_days = Number.parseInt(String(coachHorizon || '7'), 10)
      const data = await api.coachGoal({
        user_id: user?.id || 'demo',
        goal: coachGoal,
        horizon_days: Number.isFinite(horizon_days) ? horizon_days : 7,
        context: { app: 'Healthyfy', source: 'unified-dashboard' },
      })
      setCoachPlan(data)
    } catch (e) {
      setCoachError(e?.message || 'Failed to create goal plan')
    } finally {
      setCoachBusy(false)
    }
  }

  async function submitCoachCheckin() {
    if (!coachPlan?.plan_id) return
    setCoachBusy(true)
    setCoachError('')
    try {
      const adherence = Number(String(coachAdherence))
      const data = await api.coachCheckin({
        plan_id: coachPlan.plan_id,
        adherence: Number.isFinite(adherence) ? adherence : 0.5,
        metrics: {},
        notes: coachNotes,
      })
      setCoachPlan((prev) => ({ ...prev, ...data }))
      setCoachNotes('')
    } catch (e) {
      setCoachError(e?.message || 'Failed to submit check-in')
    } finally {
      setCoachBusy(false)
    }
  }

  async function runAi(which) {
    setAiBusy(true)
    setAiError('')
    try {
      if (which === 'fitness') {
        const data = await api.fitnessPlan({ goal: aiFitnessGoal, level: aiFitnessLevel })
        setAiResult({ which, data })
        return
      }
      if (which === 'nutrition') {
        const data = await api.nutritionPlan({ preference: aiNutritionPreference, allergies: aiNutritionAllergies })
        setAiResult({ which, data })
        return
      }
      if (which === 'breathing') {
        const minutes = Number.parseInt(String(aiBreathingMinutes || '2'), 10)
        const data = await api.breathing({ minutes: Number.isFinite(minutes) ? minutes : 2 })
        setAiResult({ which, data })
        return
      }
      if (which === 'journal') {
        const data = await api.journalPrompt()
        setAiResult({ which, data })
        return
      }
      if (which === 'chronic') {
        const data = await api.chronicSupport({ condition: aiChronicCondition })
        setAiResult({ which, data })
        return
      }

      setAiError('Unknown AI action')
    } catch (e) {
      setAiError(e?.message || 'AI request failed')
    } finally {
      setAiBusy(false)
    }
  }

  // Re-render when localStorage-backed collections change (same-tab)
  const [, setStorageTick] = useState(0)
  useEffect(() => {
    function onStorageChange(e) {
      if (!e?.detail?.key) return
      if (!String(e.detail.key).includes(`healthyfy:v1:${user.id}:`)) return
      setStorageTick((t) => t + 1)
    }
    window.addEventListener('healthyfy:storage', onStorageChange)
    return () => window.removeEventListener('healthyfy:storage', onStorageChange)
  }, [user.id])

  const workouts = loadUserCollection(user.id, 'fitness:workouts')
  const habits = loadUserCollection(user.id, 'fitness:habits')
  const meals = loadUserCollection(user.id, 'nutrition:meals')
  const waterLogs = loadUserCollection(user.id, 'nutrition:water')
  const moodLogs = loadUserCollection(user.id, 'mental:mood')
  const journalEntries = loadUserCollection(user.id, 'mental:journals')
  const symptoms = loadUserCollection(user.id, 'chronic:symptoms')
  const reminders = loadUserCollection(user.id, 'chronic:reminders')

  const fit = fitnessInsights({ workouts, habits })
  const nut = nutritionInsights({ meals, waterLogs })
  const men = mentalInsights({ moodLogs, journalEntries })
  const chr = chronicSupportInsights({ symptoms, reminders })

  return (
    <div className="grid dashboardPage" style={{ gap: '1rem' }}>
      <div className="card heroCard heroCard--dashboard">
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Your unified dashboard</h2>
        <div className="muted">
          Track wellness across fitness, nutrition, mental wellness, and chronic support. Insights are rule-based and non-medical.
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>AI quick suggestions</h3>
            <div className="muted">Calls the backend agent endpoints for non-medical guidance.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={() => { setAiResult(null); setAiError('') }} disabled={aiBusy && !aiResult}>Clear</button>
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="grid" style={{ gap: 12 }}>
            <div className="card" style={{ padding: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 4 }}>Fitness plan</div>
                  <div className="muted">Goal + level → plan bullets + links.</div>
                </div>
                <button className="btn primary" onClick={() => runAi('fitness')} disabled={aiBusy}>
                  {aiBusy && aiResult?.which === 'fitness' ? 'Loading…' : 'Generate'}
                </button>
              </div>
              <div className="grid two" style={{ marginTop: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Goal</label>
                  <input value={aiFitnessGoal} onChange={(e) => setAiFitnessGoal(e.target.value)} placeholder="e.g. endurance" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Level</label>
                  <select value={aiFitnessLevel} onChange={(e) => setAiFitnessLevel(e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 4 }}>Nutrition ideas</div>
                  <div className="muted">Preference + allergies → meal ideas + tips.</div>
                </div>
                <button className="btn primary" onClick={() => runAi('nutrition')} disabled={aiBusy}>
                  {aiBusy && aiResult?.which === 'nutrition' ? 'Loading…' : 'Generate'}
                </button>
              </div>
              <div className="grid" style={{ gap: 10, marginTop: 10 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Preference</label>
                  <input value={aiNutritionPreference} onChange={(e) => setAiNutritionPreference(e.target.value)} placeholder="e.g. balanced" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Allergies / avoid</label>
                  <input value={aiNutritionAllergies} onChange={(e) => setAiNutritionAllergies(e.target.value)} placeholder="e.g. peanuts" />
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 4 }}>Mental calm tools</div>
                  <div className="muted">Breathing + a journal prompt.</div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn" onClick={() => runAi('journal')} disabled={aiBusy}>Prompt</button>
                  <button className="btn primary" onClick={() => runAi('breathing')} disabled={aiBusy}>Breathing</button>
                </div>
              </div>
              <div className="field" style={{ margin: 0, marginTop: 10 }}>
                <label>Breathing minutes</label>
                <input inputMode="numeric" value={aiBreathingMinutes} onChange={(e) => setAiBreathingMinutes(e.target.value)} />
              </div>
            </div>

            <div className="card" style={{ padding: 12 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 900, marginBottom: 4 }}>Chronic support</div>
                  <div className="muted">Lifestyle tips (non-diagnostic).</div>
                </div>
                <button className="btn primary" onClick={() => runAi('chronic')} disabled={aiBusy}>
                  {aiBusy && aiResult?.which === 'chronic' ? 'Loading…' : 'Generate'}
                </button>
              </div>
              <div className="field" style={{ margin: 0, marginTop: 10 }}>
                <label>Condition (optional)</label>
                <input value={aiChronicCondition} onChange={(e) => setAiChronicCondition(e.target.value)} placeholder="e.g. migraine" />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Latest AI output</div>
            {aiError ? <div className="muted" style={{ color: 'var(--c-danger)', marginBottom: 10 }}>{aiError}</div> : null}
            {aiResult?.data?.disclaimer ? <div className="muted" style={{ marginBottom: 10 }}>{aiResult.data.disclaimer}</div> : null}

            {aiResult ? (
              <>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>{aiResult.data.title || 'Result'}</div>
                {Array.isArray(aiResult.data.plan) && aiResult.data.plan.length ? (
                  <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {aiResult.data.plan.slice(0, 6).map((x, idx) => <li key={idx}>{x}</li>)}
                  </ul>
                ) : null}
                {Array.isArray(aiResult.data.meal_plan) && aiResult.data.meal_plan.length ? (
                  <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {aiResult.data.meal_plan.slice(0, 6).map((x, idx) => <li key={idx}>{x}</li>)}
                  </ul>
                ) : null}
                {Array.isArray(aiResult.data.tips) && aiResult.data.tips.length ? (
                  <div style={{ marginTop: 10 }}>
                    <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Tips</div>
                    <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {aiResult.data.tips.slice(0, 6).map((x, idx) => <li key={idx}>{x}</li>)}
                    </ul>
                  </div>
                ) : null}
                {Array.isArray(aiResult.data.actions) && aiResult.data.actions.length ? (
                  <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {aiResult.data.actions.slice(0, 8).map((x, idx) => <li key={idx}>{x}</li>)}
                  </ul>
                ) : null}
                {Array.isArray(aiResult.data.lifestyle_tips) && aiResult.data.lifestyle_tips.length ? (
                  <div style={{ marginTop: 10 }}>
                    <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Lifestyle tips</div>
                    <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {aiResult.data.lifestyle_tips.slice(0, 6).map((x, idx) => <li key={idx}>{x}</li>)}
                    </ul>
                  </div>
                ) : null}
                {Array.isArray(aiResult.data.community_stories) && aiResult.data.community_stories.length ? (
                  <div style={{ marginTop: 10 }}>
                    <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Community stories</div>
                    <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {aiResult.data.community_stories.slice(0, 3).map((x, idx) => <li key={idx}>{x}</li>)}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="muted">Click any Generate button to fetch an AI result.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>Goal Coach (agent loop)</h3>
            <div className="muted">Creates a plan, then adapts it based on your check-ins.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={() => { setCoachPlan(null); setCoachError('') }} disabled={coachBusy && !coachPlan}>Clear</button>
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="grid" style={{ gap: 10 }}>
            <div className="field">
              <label>Goal</label>
              <input value={coachGoal} onChange={(e) => setCoachGoal(e.target.value)} placeholder="e.g. reduce stress, build running habit, improve hydration" />
            </div>
            <div className="field">
              <label>Horizon (days)</label>
              <input inputMode="numeric" value={coachHorizon} onChange={(e) => setCoachHorizon(e.target.value)} />
            </div>
            <button className="btn primary" onClick={createCoachPlan} disabled={coachBusy || !coachGoal.trim()}>
              {coachBusy ? 'Working…' : 'Create plan'}
            </button>
            {coachError ? <div className="muted" style={{ color: 'var(--c-danger)' }}>{coachError}</div> : null}
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Coach state</div>
            {coachPlan?.disclaimer ? <div className="muted" style={{ marginBottom: 10 }}>{coachPlan.disclaimer}</div> : null}
            {coachPlan ? (
              <>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{coachPlan.title || 'Plan'}</div>
                {Array.isArray(coachPlan.plan_steps) && coachPlan.plan_steps.length ? (
                  <ul className="muted" style={{ marginTop: 0, marginBottom: 10, paddingLeft: '1.1rem' }}>
                    {coachPlan.plan_steps.slice(0, 6).map((x, idx) => <li key={idx}>{x}</li>)}
                  </ul>
                ) : null}

                <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Next actions</div>
                {Array.isArray(coachPlan.next_actions) && coachPlan.next_actions.length ? (
                  <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {coachPlan.next_actions.slice(0, 4).map((x, idx) => <li key={idx}>{x}</li>)}
                  </ul>
                ) : (
                  <div className="muted">No actions yet.</div>
                )}

                <div style={{ height: 12 }} />
                <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Check-in (adapt plan)</div>
                <div className="grid" style={{ gap: 10 }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Adherence (0–1)</label>
                    <input inputMode="decimal" value={coachAdherence} onChange={(e) => setCoachAdherence(e.target.value)} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Notes</label>
                    <textarea value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)} placeholder="What worked? What got in the way?" />
                  </div>
                  <button className="btn" onClick={submitCoachCheckin} disabled={coachBusy}>
                    {coachBusy ? 'Submitting…' : 'Submit check-in'}
                  </button>
                </div>
              </>
            ) : (
              <div className="muted">Create a goal plan to start the agent loop.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>ML trend forecasts</h3>
            <div className="muted">Simple linear regression over your last 7 days (non-medical).</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={() => { setMlResult(null); setMlError('') }} disabled={mlBusy && !mlResult}>Clear</button>
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="btn primary" onClick={() => runMl('water')} disabled={mlBusy}>Forecast water (7d)</button>
            <button className="btn primary" onClick={() => runMl('mood')} disabled={mlBusy}>Forecast mood (7d)</button>
            <button className="btn primary" onClick={() => runMl('severity')} disabled={mlBusy}>Forecast severity (7d)</button>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Latest ML output</div>
            {mlError ? <div className="muted" style={{ color: 'var(--c-danger)', marginBottom: 10 }}>{mlError}</div> : null}
            {mlResult?.data?.disclaimer ? <div className="muted" style={{ marginBottom: 10 }}>{mlResult.data.disclaimer}</div> : null}

            {mlResult ? (
              <>
                <div className="muted" style={{ marginBottom: 8 }}>
                  Model: {mlResult.data.model} — r² {Number(mlResult.data.r2 || 0).toFixed(2)} — slope {Number(mlResult.data.slope || 0).toFixed(2)}
                </div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Forecast (next 7 points)</div>
                <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {(mlResult.data.forecast || []).slice(0, 7).map((v, idx) => (
                    <li key={idx}>{Number(v).toFixed(2)}</li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="muted">Click a Forecast button to run the ML model.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid two">
        <DomainCard
          title="Personal Fitness Coaching & Habit Formation"
          description="Workouts, habits, and consistency." 
          to="/app/fitness"
          className="domainCard--fitness"
          kpis={[
            { label: 'Workouts logged', value: workouts.length },
            { label: 'Habit check-ins', value: habits.length },
            { label: 'Last insight', value: fit.stats.workoutsLast7Days },
          ]}
          insightTitle={fit.title}
          bullets={fit.bullets}
        />

        <DomainCard
          title="Nutrition Planning & Dietary Guidance"
          description="Meal logging and hydration tracking." 
          to="/app/nutrition"
          className="domainCard--nutrition"
          kpis={[
            { label: 'Meals logged', value: meals.length },
            { label: 'Water logs', value: waterLogs.length },
            { label: '7-day meals', value: nut.stats.mealsLast7Days },
          ]}
          insightTitle={nut.title}
          bullets={nut.bullets}
        />

        <DomainCard
          title="Mental Health & Stress Management"
          description="Mood, stress, and journaling (non-clinical)." 
          to="/app/mental"
          className="domainCard--mental"
          kpis={[
            { label: 'Mood logs', value: moodLogs.length },
            { label: 'Journal entries', value: journalEntries.length },
            { label: 'Avg mood (7d)', value: men.stats.avgMood.toFixed(1) },
          ]}
          insightTitle={men.title}
          bullets={men.bullets}
        />

        <DomainCard
          title="Chronic Condition Support"
          description="Symptom tracking and routine reminders (non-diagnostic)." 
          to="/app/chronic"
          className="domainCard--chronic"
          kpis={[
            { label: 'Symptoms logged', value: symptoms.length },
            { label: 'Active reminders', value: chr.stats.activeReminders },
            { label: 'Avg severity (7d)', value: chr.stats.avgSeverity.toFixed(1) },
          ]}
          insightTitle={chr.title}
          bullets={chr.bullets}
        />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quick start</h3>
        <ol className="muted" style={{ margin: 0, paddingLeft: '1.25rem' }}>
          <li>Open a domain dashboard.</li>
          <li>Add a few entries (today + previous days) to see charts.</li>
          <li>Use “Export Final Setup as PDF” to produce a local PDF.</li>
        </ol>
      </div>
    </div>
  )
}
