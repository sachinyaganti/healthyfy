import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { appendUserCollectionItem, loadUserCollection, removeUserCollectionItem, saveUserCollection } from '../../data/wellnessStorage.js'
import { makeId } from '../../utils/id.js'
import { todayIsoDate } from '../../utils/dates.js'
import LineChart from '../../components/charts/LineChart.jsx'
import { chronicSupportInsights } from '../../utils/insights.js'
import { exportFinalSetupPdf } from '../../utils/pdfExport.js'
import ChronicRightSidebar from './components/ChronicRightSidebar.jsx'
import { api } from '../../services/api.js'

function buildLast7DaysSeveritySeries(symptoms) {
  const byDay = new Map()
  for (const s of symptoms) {
    const existing = byDay.get(s.date)
    const value = Number(s.severity || 0)
    if (existing == null) byDay.set(s.date, value)
    else byDay.set(s.date, Math.round((existing + value) / 2))
  }

  const labels = []
  const values = []
  const now = new Date()
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    labels.push(iso.slice(5))
    values.push(byDay.get(iso) || 0)
  }

  return { labels, values }
}

export default function ChronicDashboard() {
  const { user } = useAuth()

  const [aiCondition, setAiCondition] = useState('')
  const [aiSupport, setAiSupport] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')

  const [symptomDate, setSymptomDate] = useState(todayIsoDate())
  const [symptomName, setSymptomName] = useState('Headache')
  const [severity, setSeverity] = useState('4')
  const [symptomNotes, setSymptomNotes] = useState('')

  const [reminderLabel, setReminderLabel] = useState('Routine check-in')
  const [reminderTime, setReminderTime] = useState('09:00')
  const [reminderActive, setReminderActive] = useState(true)

  const symptoms = loadUserCollection(user.id, 'chronic:symptoms')
  const reminders = loadUserCollection(user.id, 'chronic:reminders')

  const series = useMemo(() => buildLast7DaysSeveritySeries(symptoms), [symptoms])
  const insight = useMemo(() => chronicSupportInsights({ symptoms, reminders }), [symptoms, reminders])

  async function generateAiSupport() {
    setAiBusy(true)
    setAiError('')
    try {
      const data = await api.chronicSupport({ condition: aiCondition })
      setAiSupport(data)
    } catch (e) {
      setAiError(e?.message || 'Failed to fetch lifestyle support')
    } finally {
      setAiBusy(false)
    }
  }

  function addSymptom(e) {
    e.preventDefault()
    appendUserCollectionItem(user.id, 'chronic:symptoms', {
      id: makeId('symptom'),
      date: symptomDate,
      symptom: symptomName,
      severity: Number(severity || 0),
      notes: symptomNotes.trim(),
      createdAt: new Date().toISOString(),
    })
    setSymptomNotes('')
  }

  function addReminder(e) {
    e.preventDefault()
    appendUserCollectionItem(user.id, 'chronic:reminders', {
      id: makeId('reminder'),
      label: reminderLabel,
      time: reminderTime,
      active: Boolean(reminderActive),
      completions: [],
      createdAt: new Date().toISOString(),
    })
  }

  function removeSymptom(id) {
    removeUserCollectionItem(user.id, 'chronic:symptoms', id)
  }

  function removeReminder(id) {
    removeUserCollectionItem(user.id, 'chronic:reminders', id)
  }

  function markReminderDoneToday(reminderId) {
    const today = todayIsoDate()
    const next = reminders.map((r) => {
      if (r.id !== reminderId) return r
      const completions = Array.isArray(r.completions) ? r.completions : []
      if (completions.includes(today)) return r
      return { ...r, completions: [today, ...completions] }
    })
    saveUserCollection(user.id, 'chronic:reminders', next)
  }

  function toggleReminderActive(reminderId) {
    const next = reminders.map((r) => (r.id === reminderId ? { ...r, active: !r.active } : r))
    saveUserCollection(user.id, 'chronic:reminders', next)
  }

  function exportPdf() {
    exportFinalSetupPdf({
      user,
      domainTitle: 'Chronic Support',
      generatedAtIso: new Date().toISOString(),
      sections: [
        {
          title: 'Domain summary',
          lines: [
            `Symptoms logged: ${symptoms.length}`,
            `Reminders: ${reminders.length}`,
            'Note: This is non-diagnostic support and does not provide treatment guidance.',
          ],
        },
        {
          title: 'Trends & insights (rule-based)',
          lines: insight.bullets,
        },
        {
          title: 'Recent symptoms (up to 10)',
          lines: symptoms.slice(0, 10).length
            ? symptoms.slice(0, 10).map((s) => `${s.date} — ${s.symptom} — severity ${s.severity}/10${s.notes ? ` — ${s.notes}` : ''}`)
            : ['No symptoms logged yet.'],
        },
        {
          title: 'Reminders',
          lines: reminders.length
            ? reminders.map((r) => {
                const doneToday = Array.isArray(r.completions) && r.completions.includes(todayIsoDate())
                return `${r.label} @ ${r.time} — ${r.active ? 'Active' : 'Paused'} — done today: ${doneToday ? 'Yes' : 'No'}`
              })
            : ['No reminders yet.'],
        },
      ],
    })
  }

  return (
    <div className="chronicPageLayout domainPage chronic" style={{ gap: '1rem' }}>
      <div className="card heroCard heroCard--chronic">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Chronic condition support</h2>
            <div className="muted">Non-diagnostic tracking: symptoms and routine reminders (no prescriptions or treatment advice).</div>
          </div>
          <button className="btn primary" onClick={exportPdf}>Export Final Setup as PDF</button>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>AI lifestyle support (backend)</h3>
            <div className="muted">Non-diagnostic tips and community-style support language.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" type="button" onClick={() => setAiSupport(null)} disabled={aiBusy && !aiSupport}>Clear</button>
            <button className="btn primary" type="button" onClick={generateAiSupport} disabled={aiBusy}>
              {aiBusy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="grid" style={{ gap: 10 }}>
            <div className="field">
              <label>Condition (optional)</label>
              <input value={aiCondition} onChange={(e) => setAiCondition(e.target.value)} placeholder="e.g. diabetes, migraine, asthma" />
            </div>
            {aiError ? <div className="muted" style={{ color: 'var(--c-danger)' }}>{aiError}</div> : null}
          </div>

          <div>
            {aiSupport ? (
              <>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{aiSupport.title || 'Support'}</div>
                {aiSupport.disclaimer ? <div className="muted" style={{ marginBottom: 10 }}>{aiSupport.disclaimer}</div> : null}
                {Array.isArray(aiSupport.lifestyle_tips) && aiSupport.lifestyle_tips.length ? (
                  <>
                    <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Lifestyle tips</div>
                    <ul className="muted" style={{ marginTop: 0, marginBottom: 10, paddingLeft: '1.1rem' }}>
                      {aiSupport.lifestyle_tips.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {Array.isArray(aiSupport.community_stories) && aiSupport.community_stories.length ? (
                  <>
                    <div className="muted" style={{ fontWeight: 800, marginBottom: 6 }}>Community stories</div>
                    <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {aiSupport.community_stories.slice(0, 3).map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {!aiSupport.lifestyle_tips?.length && !aiSupport.community_stories?.length ? (
                  <div className="muted">No suggestions generated yet.</div>
                ) : null}
              </>
            ) : (
              <div className="muted">Generate suggestions to see lifestyle tips here.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid chronicMain" style={{ gap: '1rem' }}>
        <div className="grid two">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Log symptoms</h3>
            <form className="grid" onSubmit={addSymptom}>
              <div className="field">
                <label>Date</label>
                <input type="date" value={symptomDate} onChange={(e) => setSymptomDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Symptom (free text)</label>
                <input value={symptomName} onChange={(e) => setSymptomName(e.target.value)} placeholder="Fatigue, headache, joint stiffness…" />
              </div>
              <div className="field">
                <label>Severity (1–10)</label>
                <input value={severity} onChange={(e) => setSeverity(e.target.value)} inputMode="numeric" />
              </div>
              <div className="field">
                <label>Notes (optional)</label>
                <textarea value={symptomNotes} onChange={(e) => setSymptomNotes(e.target.value)} placeholder="Possible triggers: sleep, food, stress…" />
              </div>
              <button className="btn primary">Add symptom</button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Routine reminders</h3>
            <form className="grid" onSubmit={addReminder}>
              <div className="field">
                <label>Label</label>
                <input value={reminderLabel} onChange={(e) => setReminderLabel(e.target.value)} />
              </div>
              <div className="grid two">
                <div className="field">
                  <label>Time</label>
                  <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
                </div>
                <div className="field">
                  <label>Status</label>
                  <select value={reminderActive ? 'active' : 'paused'} onChange={(e) => setReminderActive(e.target.value === 'active')}>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
              <button className="btn primary">Add reminder</button>
            </form>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Your reminders</div>
              {reminders.length ? (
                <div className="grid" style={{ gap: 8 }}>
                  {reminders.slice(0, 8).map((r) => {
                    const doneToday = Array.isArray(r.completions) && r.completions.includes(todayIsoDate())
                    return (
                      <div key={r.id} className="card" style={{ padding: 10 }}>
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 900 }}>{r.label}</div>
                            <div className="muted">{r.time} — {r.active ? 'Active' : 'Paused'} — done today: {doneToday ? 'Yes' : 'No'}</div>
                          </div>
                          <div className="row">
                            <button className="btn" onClick={() => markReminderDoneToday(r.id)} disabled={doneToday}>Mark done today</button>
                            <button className="btn" onClick={() => toggleReminderActive(r.id)}>{r.active ? 'Pause' : 'Activate'}</button>
                            <button className="btn" onClick={() => removeReminder(r.id)}>Remove</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="muted">No reminders yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid two">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Symptom severity (last 7 days)</h3>
            <LineChart title="" labels={series.labels} data={series.values} yLabel="Severity (1–10)" />
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

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent symptoms</h3>
          {symptoms.length ? (
            <div className="grid" style={{ gap: 8 }}>
              {symptoms.slice(0, 10).map((s) => (
                <div key={s.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="muted">{s.date} — {s.symptom} — severity {s.severity}/10{s.notes ? ` — ${s.notes}` : ''}</div>
                  <button className="btn" onClick={() => removeSymptom(s.id)}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No symptoms yet.</div>
          )}
        </div>
      </div>

      <ChronicRightSidebar userId={user.id} />
    </div>
  )
}
