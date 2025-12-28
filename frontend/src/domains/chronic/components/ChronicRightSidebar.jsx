import { useEffect, useMemo, useRef, useState } from 'react'
import { loadJson, saveJson, scopedKey } from '../../../utils/storage.js'
import {
  CHRONIC_SUPPORT_DISCLAIMER,
  chronicSupportGoals,
  communityStories,
  supportedChronicConditions,
} from '../data/chronicSupportData.js'

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
    <div className="chronicAiAvatar" aria-hidden="true" style={{ background: colors.bg, borderColor: colors.stroke }}>
      <div className="chronicAiAvatarInner" style={{ borderColor: colors.stroke }}>
        {initial}
      </div>
    </div>
  )
}

function Chip({ active, children, onClick, title }) {
  return (
    <button
      type="button"
      className={`chronicChip${active ? ' active' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  )
}

function SectionTitle({ children }) {
  return <div className="chronicSidebarTitle">{children}</div>
}

export default function ChronicRightSidebar({ userId }) {
  const [selectedConditionId, setSelectedConditionId] = useState('all')
  const [savedStoryIds, setSavedStoryIds] = useState([])
  const [uiNote, setUiNote] = useState('')
  const communityRef = useRef(null)

  const savedKey = useMemo(() => scopedKey(userId, 'chronic:savedStories'), [userId])

  useEffect(() => {
    const loaded = loadJson(savedKey, [])
    setSavedStoryIds(Array.isArray(loaded) ? loaded : [])
  }, [savedKey])

  const activeCondition = useMemo(() => {
    if (selectedConditionId === 'all') return null
    return supportedChronicConditions.find((c) => c.id === selectedConditionId) || null
  }, [selectedConditionId])

  const filteredStories = useMemo(() => {
    if (selectedConditionId === 'all') return communityStories
    return communityStories.filter((s) => s.conditionId === selectedConditionId)
  }, [selectedConditionId])

  const savedCountInView = useMemo(() => {
    const set = new Set(savedStoryIds)
    return filteredStories.reduce((acc, s) => acc + (set.has(s.id) ? 1 : 0), 0)
  }, [filteredStories, savedStoryIds])

  function saveVisibleStories() {
    const existing = new Set(savedStoryIds)
    for (const s of filteredStories) existing.add(s.id)
    const next = Array.from(existing)
    setSavedStoryIds(next)
    saveJson(savedKey, next)
    setUiNote(`Saved ${filteredStories.length} story${filteredStories.length === 1 ? '' : 'ies'} for later.`)
    setTimeout(() => setUiNote(''), 2400)
  }

  function viewSimilarExperiences() {
    communityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function joinDiscussionsUiOnly() {
    setUiNote('Community discussions are UI-only in this demo build.')
    setTimeout(() => setUiNote(''), 2400)
  }

  return (
    <aside className="chronicRightSidebar" aria-label="Chronic condition support sidebar">
      <div className="card">
        <SectionTitle>Chronic Disease Overview</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>
          Chronic condition support here focuses on lifestyle consistency, self-care routines, and pattern awareness. It does not provide diagnosis or treatment guidance.
        </div>
        {activeCondition ? (
          <div className="muted" style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 800, color: 'var(--c-text)' }}>{activeCondition.label}:</span> {activeCondition.overview}
          </div>
        ) : null}
        <div className="chronicSidebarDisclaimer" style={{ marginTop: 10 }}>{CHRONIC_SUPPORT_DISCLAIMER}</div>
      </div>

      <div className="card">
        <SectionTitle>Supported Chronic Conditions</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>Select a condition to personalize the sidebar and filter community stories.</div>

        <div className="chronicConditionGrid" style={{ marginTop: 10 }}>
          <Chip active={selectedConditionId === 'all'} onClick={() => setSelectedConditionId('all')} title="Show all">
            All
          </Chip>
          {supportedChronicConditions.map((c) => (
            <Chip key={c.id} active={selectedConditionId === c.id} onClick={() => setSelectedConditionId(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="card">
        <SectionTitle>Goals of Chronic Condition Support</SectionTitle>
        <div className="chronicGoalGrid" style={{ marginTop: 10 }}>
          {chronicSupportGoals.map((g) => (
            <div key={g.id} className="card" style={{ padding: 10 }}>
              <div style={{ fontWeight: 900 }}>{g.title}</div>
              <div className="muted" style={{ marginTop: 4 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" ref={communityRef} id="community-stories">
        <SectionTitle>Community & Social Support</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>
          Anonymized community stories for motivation and lifestyle ideas. No real people, no medical advice.
        </div>

        <div className="chronicSidebarMeta" style={{ marginTop: 10 }}>
          <div className="muted">Showing: <span style={{ fontWeight: 800, color: 'var(--c-text)' }}>{activeCondition?.label || 'All conditions'}</span></div>
          <div className="muted">Saved in view: <span style={{ fontWeight: 800, color: 'var(--c-text)' }}>{savedCountInView}</span></div>
        </div>

        <div className="chronicStoryList" style={{ marginTop: 10 }}>
          {filteredStories.length ? (
            filteredStories.map((s) => {
              const isSaved = savedStoryIds.includes(s.id)
              return (
                <div key={s.id} className="card chronicStoryCard" style={{ padding: 10 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="row" style={{ alignItems: 'flex-start' }}>
                      <AiAvatar label={s.anonName} seed={s.id} />
                      <div>
                        <div style={{ fontWeight: 900 }}>{s.anonName}</div>
                        <div className="muted">{s.conditionLabel} • {s.duration}</div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          Lifestyle focus: {s.focusAreas.join(' · ')}
                        </div>
                        <div className="muted" style={{ marginTop: 4 }}>
                          Status: <span className={`chronicStatus${s.status === 'Improved' ? ' improved' : ' stable'}`}>{s.status}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        const next = isSaved ? savedStoryIds.filter((id) => id !== s.id) : [s.id, ...savedStoryIds]
                        setSavedStoryIds(next)
                        saveJson(savedKey, next)
                      }}
                      title={isSaved ? 'Remove from saved' : 'Save this story'}
                    >
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  <div className="chronicQuote" style={{ marginTop: 10 }}>
                    “{s.quote}”
                  </div>
                </div>
              )
            })
          ) : (
            <div className="muted">No stories for this condition yet.</div>
          )}
        </div>

        <div className="chronicSidebarDisclaimer" style={{ marginTop: 12 }}>{CHRONIC_SUPPORT_DISCLAIMER}</div>
      </div>

      <div className="card">
        <SectionTitle>Disease Filter</SectionTitle>
        <div className="muted" style={{ marginTop: 6 }}>Filter stories in real time.</div>
        <div className="field" style={{ marginTop: 10 }}>
          <label>Condition</label>
          <select value={selectedConditionId} onChange={(e) => setSelectedConditionId(e.target.value)}>
            <option value="all">All</option>
            {supportedChronicConditions.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <SectionTitle>Social Actions</SectionTitle>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn" type="button" onClick={viewSimilarExperiences}>View Similar Experiences</button>
          <button className="btn" type="button" onClick={joinDiscussionsUiOnly}>Join Community Discussions</button>
          <button className="btn primary" type="button" onClick={saveVisibleStories}>Save Helpful Stories</button>
        </div>
        {uiNote ? <div className="muted" style={{ marginTop: 10 }}>{uiNote}</div> : null}
      </div>
    </aside>
  )
}
