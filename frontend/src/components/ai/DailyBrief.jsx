import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAiStatus } from '../../hooks/useAiStatus'
import { useAssistant } from '../../context/AssistantContext'
import { parseUtc, fmt } from '../../lib/format'

const TONE = {
  positive: { icon: 'fa-circle-check', label: 'Going well' },
  watch:    { icon: 'fa-circle-exclamation', label: 'Worth watching' },
  tip:      { icon: 'fa-lightbulb', label: 'Tip' },
}

/** AI-written brief of today's data. Cached server-side per day; regenerated on demand. */
export default function DailyBrief({ refreshKey }) {
  const { enabled, ready } = useAiStatus()
  const { open } = useAssistant()
  const [brief, setBrief] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) { setLoading(false); return }
    axios.get('/api/ai/insights')
      .then(r => { setBrief(r.data.brief); setGeneratedAt(r.data.generated_at) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [enabled])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const r = await axios.post('/api/ai/insights')
      setBrief(r.data.brief)
      setGeneratedAt(r.data.generated_at)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate the brief.')
    } finally {
      setGenerating(false)
    }
  }

  const updated = parseUtc(generatedAt)
  // Data changed since the brief was written (a meal or dose was logged on this screen)
  const stale = brief && refreshKey > 0

  return (
    <section className="card brief">
      <header className="card-head">
        <div>
          <h2 className="card-title">Daily brief</h2>
          <p className="card-sub">
            {updated
              ? `Written at ${updated.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} from today's logs`
              : 'A short read on today, written from your logs'}
          </p>
        </div>
        {enabled && brief && (
          <button className={`btn btn-sm ${stale ? 'btn-secondary' : 'btn-ghost'}`} onClick={generate} disabled={generating}>
            <i className={`fa-solid fa-rotate-right${generating ? ' fa-spin' : ''}`} />
            {stale ? 'Update with new data' : 'Refresh'}
          </button>
        )}
      </header>

      {!ready || loading ? (
        <BriefSkeleton />
      ) : !enabled ? (
        <div className="ai-off compact">
          <i className="fa-solid fa-plug-circle-xmark" />
          <p>AI features are off. Add <code>GROQ_API_KEY</code> to the backend to get a daily brief.</p>
        </div>
      ) : generating && !brief ? (
        <BriefSkeleton />
      ) : !brief ? (
        <div className="brief-empty">
          <p>Get three observations about today's meals and medications, plus a suggestion for your next meal.</p>
          <button className="btn btn-primary" onClick={generate} disabled={generating}>
            Write today's brief
          </button>
          {error && <p className="inline-error">{error}</p>}
        </div>
      ) : (
        <div className={`brief-body${generating ? ' is-updating' : ''}`}>
          {brief.summary && <p className="brief-summary">{brief.summary}</p>}
          <ul className="insights">
            {brief.insights.map((it, i) => (
              <li key={i} className={`insight tone-${it.tone}`}>
                <i className={`fa-solid ${TONE[it.tone]?.icon || 'fa-lightbulb'}`} aria-label={TONE[it.tone]?.label} />
                <div>
                  <p className="insight-title">{it.title}</p>
                  <p className="insight-detail">{it.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          {brief.next_meal && (
            <div className="next-meal">
              <div className="next-meal-text">
                <span className="eyebrow">Next meal idea</span>
                <p className="next-meal-name">{brief.next_meal.name}</p>
                <p className="next-meal-why">{brief.next_meal.why}</p>
              </div>
              <dl className="next-meal-macros">
                <div><dt>kcal</dt><dd>{fmt(brief.next_meal.calories)}</dd></div>
                <div><dt>Protein</dt><dd>{brief.next_meal.protein}g</dd></div>
                <div><dt>Carbs</dt><dd>{brief.next_meal.carbs}g</dd></div>
                <div><dt>Fat</dt><dd>{brief.next_meal.fat}g</dd></div>
              </dl>
            </div>
          )}
          <button className="link-btn" onClick={() => open('Tell me more about today\'s brief. What should I focus on for the rest of the day?')}>
            Ask a follow-up <i className="fa-solid fa-arrow-right" />
          </button>
          {error && <p className="inline-error">{error}</p>}
        </div>
      )}
    </section>
  )
}

function BriefSkeleton() {
  return (
    <div className="brief-body" aria-busy="true">
      <div className="skeleton line" style={{ width: '80%' }} />
      {[0, 1, 2].map(i => (
        <div key={i} className="insight">
          <div className="skeleton dot" />
          <div style={{ flex: 1 }}>
            <div className="skeleton line" style={{ width: '35%' }} />
            <div className="skeleton line" style={{ width: '90%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
