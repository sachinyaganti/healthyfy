import { useMemo } from 'react'
import { buildRuleBasedSuggestions, scrollToId } from '../mentalEnhancements.js'

export default function MentalPersonalizedSuggestionsCard({ moodLogs, journalEntries }) {
  const data = useMemo(
    () => buildRuleBasedSuggestions({ moodLogs, journalEntries }),
    [moodLogs, journalEntries],
  )

  return (
    <div className="card mentalSuggestionsCard" id="mental-suggestions">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3 style={{ marginTop: 0, marginBottom: 6 }}>🧠 Personalized wellness suggestions</h3>
        <div className="mentalStatsPill">
          Avg 7d: mood {data.stats.avgMood}/10 • stress {data.stats.avgStress}/10
        </div>
      </div>

      <div className="muted" style={{ marginBottom: 10 }}>
        Rule-based nudges from your recent logs (non-clinical).
      </div>

      <div className="grid" style={{ gap: 10 }}>
        {data.suggestions.map((s) => (
          <div key={s.id} className="mentalSuggestion">
            <div style={{ fontWeight: 700 }}>{s.title}</div>
            <div className="muted" style={{ marginTop: 6 }}>{s.body}</div>
            {s.action ? (
              <div style={{ marginTop: 10 }}>
                <button className="btn" onClick={() => scrollToId(s.action.targetId)}>
                  {s.action.label}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mentalSubtleNote">
        These suggestions are for everyday support, not medical guidance.
      </div>
    </div>
  )
}
