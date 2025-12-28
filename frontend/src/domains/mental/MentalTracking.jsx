import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { appendUserCollectionItem, loadUserCollection, removeUserCollectionItem } from '../../data/wellnessStorage.js'
import { makeId } from '../../utils/id.js'
import { todayIsoDate } from '../../utils/dates.js'
import LineChart from '../../components/charts/LineChart.jsx'
import { mentalInsights } from '../../utils/insights.js'
import { exportFinalSetupPdf } from '../../utils/pdfExport.js'
import { buildRuleBasedSuggestions } from './mentalEnhancements.js'
import { api } from '../../services/api.js'

const DISCLAIMER_LINES = [
  'Healthyfy supports mental wellness and stress management.',
  'It does not diagnose, treat, or replace professional mental health care.',
]

function buildLast7DaysMoodSeries(moodLogs) {
  const byDay = new Map()
  for (const m of moodLogs) {
    byDay.set(m.date, Number(m.mood || 0))
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

export default function MentalTracking() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [aiMinutes, setAiMinutes] = useState('2')
  const [aiBreathing, setAiBreathing] = useState(null)
  const [aiJournal, setAiJournal] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')

  const [moodDate, setMoodDate] = useState(todayIsoDate())
  const [mood, setMood] = useState('6')
  const [stress, setStress] = useState('5')
  const [moodNotes, setMoodNotes] = useState('')

  const [journalDate, setJournalDate] = useState(todayIsoDate())
  const [journalText, setJournalText] = useState('')

  const moodLogs = loadUserCollection(user.id, 'mental:mood')
  const journalEntries = loadUserCollection(user.id, 'mental:journals')

  const series = useMemo(() => buildLast7DaysMoodSeries(moodLogs), [moodLogs])
  const insight = useMemo(() => mentalInsights({ moodLogs, journalEntries }), [moodLogs, journalEntries])
  const suggestions = useMemo(() => buildRuleBasedSuggestions({ moodLogs, journalEntries }), [moodLogs, journalEntries])

  async function fetchBreathing() {
    setAiBusy(true)
    setAiError('')
    try {
      const minutes = Number.parseInt(String(aiMinutes || '2'), 10)
      const data = await api.breathing({ minutes: Number.isFinite(minutes) ? minutes : 2 })
      setAiBreathing(data)
    } catch (e) {
      setAiError(e?.message || 'Failed to fetch breathing exercise')
    } finally {
      setAiBusy(false)
    }
  }

  async function fetchJournalPrompt() {
    setAiBusy(true)
    setAiError('')
    try {
      const data = await api.journalPrompt()
      setAiJournal(data)
    } catch (e) {
      setAiError(e?.message || 'Failed to fetch journal prompt')
    } finally {
      setAiBusy(false)
    }
  }

  function addMood(e) {
    e.preventDefault()
    appendUserCollectionItem(user.id, 'mental:mood', {
      id: makeId('mood'),
      date: moodDate,
      mood: Number(mood || 0),
      stress: Number(stress || 0),
      notes: moodNotes.trim(),
      createdAt: new Date().toISOString(),
    })
    setMoodNotes('')
  }

  function addJournal(e) {
    e.preventDefault()
    const text = journalText.trim()
    if (!text) return
    appendUserCollectionItem(user.id, 'mental:journals', {
      id: makeId('journal'),
      date: journalDate,
      text,
      createdAt: new Date().toISOString(),
    })
    setJournalText('')
  }

  function removeMood(id) {
    removeUserCollectionItem(user.id, 'mental:mood', id)
  }

  function removeJournal(id) {
    removeUserCollectionItem(user.id, 'mental:journals', id)
  }

  function exportPdf() {
    exportFinalSetupPdf({
      user,
      domainTitle: 'Mental Wellness',
      generatedAtIso: new Date().toISOString(),
      sections: [
        {
          title: 'Domain summary',
          lines: [
            `Mood logs: ${moodLogs.length}`,
            `Journal entries: ${journalEntries.length}`,
            'Note: This section is non-clinical and does not provide therapy or diagnosis.',
          ],
        },
        {
          title: 'Trends & insights (rule-based)',
          lines: insight.bullets,
        },
        {
          title: 'Recent mood logs (up to 10)',
          lines: moodLogs.slice(0, 10).length
            ? moodLogs.slice(0, 10).map((m) => `${m.date} — mood ${m.mood}/10 — stress ${m.stress}/10${m.notes ? ` — ${m.notes}` : ''}`)
            : ['No mood logs yet.'],
        },
        {
          title: 'Recent journal entries (up to 5)',
          lines: journalEntries.slice(0, 5).length
            ? journalEntries.slice(0, 5).map((j) => `${j.date} — ${j.text}`)
            : ['No journal entries yet.'],
        },
      ],
    })
  }

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <div className="card heroCard heroCard--mental">
        <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>Self mental wellness tracking</h2>
            <div className="muted">Mood & stress logs, journaling, and non-clinical insights.</div>
          </div>
          <div className="row">
            <button className="btn" onClick={() => navigate('/app/mental')}>Back</button>
            <button className="btn primary" onClick={exportPdf}>Export Final Setup as PDF</button>
          </div>
        </div>
        <div className="muted" style={{ marginTop: 10, fontWeight: 700 }}>
          {DISCLAIMER_LINES[0]}<br />{DISCLAIMER_LINES[1]}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 6 }}>AI calm tools (backend)</h3>
            <div className="muted">Non-clinical breathing guidance and journaling prompts.</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={() => { setAiBreathing(null); setAiJournal(null); setAiError('') }} disabled={aiBusy}>Clear</button>
          </div>
        </div>

        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="card" style={{ padding: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 900, marginBottom: 4 }}>Breathing exercise</div>
                <div className="muted">Pick minutes and generate a short sequence.</div>
              </div>
              <button className="btn primary" onClick={fetchBreathing} disabled={aiBusy}>
                {aiBusy ? 'Loading…' : 'Generate'}
              </button>
            </div>
            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <div className="field" style={{ margin: 0, flex: 1 }}>
                <label>Minutes</label>
                <input inputMode="numeric" value={aiMinutes} onChange={(e) => setAiMinutes(e.target.value)} />
              </div>
            </div>
            {aiBreathing?.disclaimer ? <div className="muted" style={{ marginTop: 10 }}>{aiBreathing.disclaimer}</div> : null}
            {Array.isArray(aiBreathing?.actions) && aiBreathing.actions.length ? (
              <ul className="muted" style={{ marginTop: 10, marginBottom: 0, paddingLeft: '1.1rem' }}>
                {aiBreathing.actions.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            ) : (
              <div className="muted" style={{ marginTop: 10 }}>No breathing exercise loaded yet.</div>
            )}
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 900, marginBottom: 4 }}>Journal prompt</div>
                <div className="muted">Get a short prompt you can paste into your journal.</div>
              </div>
              <button className="btn primary" onClick={fetchJournalPrompt} disabled={aiBusy}>
                {aiBusy ? 'Loading…' : 'Generate'}
              </button>
            </div>
            {aiJournal?.disclaimer ? <div className="muted" style={{ marginTop: 10 }}>{aiJournal.disclaimer}</div> : null}
            {Array.isArray(aiJournal?.actions) && aiJournal.actions.length ? (
              <ul className="muted" style={{ marginTop: 10, marginBottom: 0, paddingLeft: '1.1rem' }}>
                {aiJournal.actions.map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            ) : (
              <div className="muted" style={{ marginTop: 10 }}>No journal prompt loaded yet.</div>
            )}
          </div>
        </div>

        {aiError ? <div className="muted" style={{ marginTop: 10, color: 'var(--c-danger)' }}>{aiError}</div> : null}
      </div>

      <div className="grid two">
        <div className="card" id="mental-log-mood">
          <h3 style={{ marginTop: 0 }}>Log mood & stress</h3>
          <form className="grid" onSubmit={addMood}>
            <div className="field">
              <label>Date</label>
              <input type="date" value={moodDate} onChange={(e) => setMoodDate(e.target.value)} />
            </div>
            <div className="grid two">
              <div className="field">
                <label>Mood (1–10)</label>
                <input value={mood} onChange={(e) => setMood(e.target.value)} inputMode="numeric" />
              </div>
              <div className="field">
                <label>Stress (1–10)</label>
                <input value={stress} onChange={(e) => setStress(e.target.value)} inputMode="numeric" />
              </div>
            </div>
            <div className="field">
              <label>Notes (optional)</label>
              <textarea value={moodNotes} onChange={(e) => setMoodNotes(e.target.value)} placeholder="What influenced today? Sleep, work, exercise…" />
            </div>
            <button className="btn primary">Add mood log</button>
          </form>
        </div>

        <div className="card" id="mental-quick-journal">
          <h3 style={{ marginTop: 0 }}>Quick journal</h3>
          <div className="muted" style={{ marginBottom: 10 }}>
            Prompt idea: “What drained me today? What helped me today?”
          </div>
          <form className="grid" onSubmit={addJournal}>
            <div className="field">
              <label>Date</label>
              <input type="date" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Entry</label>
              <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="Write a few lines…" />
            </div>
            <button className="btn primary" disabled={!journalText.trim()}>Add journal entry</button>
          </form>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Mood (last 7 days)</h3>
          <LineChart title="" labels={series.labels} data={series.values} yLabel="Mood (1–10)" />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{insight.title}</h3>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {insight.bullets.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Rule-based suggestions</div>
            <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {suggestions.suggestions.slice(0, 2).map((s) => (
                <li key={s.id}>{s.body}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent mood logs</h3>
          {moodLogs.length ? (
            <div className="grid" style={{ gap: 8 }}>
              {moodLogs.slice(0, 8).map((m) => (
                <div key={m.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="muted">{m.date} — mood {m.mood}/10 — stress {m.stress}/10{m.notes ? ` — ${m.notes}` : ''}</div>
                  <button className="btn" onClick={() => removeMood(m.id)}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No mood logs yet.</div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent journal entries</h3>
          {journalEntries.length ? (
            <div className="grid" style={{ gap: 8 }}>
              {journalEntries.slice(0, 6).map((j) => (
                <div key={j.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="muted">{j.date} — {j.text}</div>
                  <button className="btn" onClick={() => removeJournal(j.id)}>Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No journal entries yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
