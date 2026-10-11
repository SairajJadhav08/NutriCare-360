import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import PoseImage from '../ui/PoseImage'
import { useAssistant } from '../../context/AssistantContext'

const WEIGHT_KEY = 'nc_weight_kg'

function readWeight() {
  try { return Number(localStorage.getItem(WEIGHT_KEY)) || 70 } catch { return 70 }
}

/** ACSM formula: kcal per minute = MET × 3.5 × body weight (kg) / 200 */
function kcalPerMinute(met, kg) {
  return (met * 3.5 * kg) / 200
}

/**
 * Full reference view for one pose. Details come from the backend (yoga_details.json,
 * or written by AI on first view and cached). Keyboard: ← → to move, Esc to close.
 */
export default function PoseDetail({ pose, onClose, onPrev, onNext, onSelect }) {
  const { open: openAssistant } = useAssistant()
  // Results are tagged with the slug they belong to, so switching poses needs no state reset
  const [result, setResult] = useState({ slug: null })
  const [slowFor, setSlowFor] = useState(null)
  const [weight, setWeight] = useState(readWeight)

  useEffect(() => {
    let alive = true
    const slug = pose.slug
    // A pose with no saved details is written by AI on first view; say so if it takes a moment
    const t = setTimeout(() => alive && setSlowFor(slug), 700)
    axios.get(`/api/yoga/poses/${slug}/details`)
      .then(r => alive && setResult({ slug, details: r.data.details, source: r.data.source }))
      .catch(err => alive && setResult({ slug, error: err.response?.data?.error || 'Could not load details for this pose.' }))
      .finally(() => clearTimeout(t))
    return () => { alive = false; clearTimeout(t) }
  }, [pose.slug])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && onPrev) onPrev()
      if (e.key === 'ArrowRight' && onNext) onNext()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow }
  }, [onClose, onPrev, onNext])

  function changeWeight(v) {
    setWeight(v)
    const n = Number(v)
    if (n >= 30 && n <= 250) { try { localStorage.setItem(WEIGHT_KEY, String(n)) } catch { /* ignore */ } }
  }

  const current = result.slug === pose.slug ? result : {}
  const details = current.details || null
  const source = current.source || null
  const error = current.error || null
  const slow = slowFor === pose.slug

  const kg = Number(weight) >= 30 && Number(weight) <= 250 ? Number(weight) : 70
  const perMin = details ? kcalPerMinute(details.met, kg) : 0
  const d = details

  return createPortal(
    <div className="modal-backdrop pd-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <article className="pd" role="dialog" aria-modal="true" aria-label={pose.name}>
        <div className="pd-media">
          <PoseImage key={pose.slug} name={pose.name} fallback={pose.image_url} className="pd-img"
            sizes="(max-width: 720px) 100vw, 880px" priority />
          <button className="pd-icon pd-close" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
          <div className="pd-nav">
            <button className="pd-icon" onClick={onPrev} disabled={!onPrev} aria-label="Previous pose"><i className="fa-solid fa-chevron-left" /></button>
            <button className="pd-icon" onClick={onNext} disabled={!onNext} aria-label="Next pose"><i className="fa-solid fa-chevron-right" /></button>
          </div>
        </div>

        <div className="pd-body">
          <header className="pd-head">
            <div className="pd-badges">
              <span className="badge">{pose.category}</span>
              {d && <span className={`badge level-${d.level.toLowerCase()}`}>{d.level}</span>}
            </div>
            <h2 className="pd-title">{pose.name}</h2>
            {d && (d.sanskrit || d.english) && (
              <p className="pd-names">{[d.sanskrit, d.english].filter(Boolean).join(' · ')}</p>
            )}
            <p className="pd-summary">{d?.summary || pose.description}</p>
          </header>

          {error ? (
            <p className="callout callout-danger"><i className="fa-solid fa-circle-exclamation" /> {error}</p>
          ) : !d ? (
            <div className="pd-loading" aria-busy="true">
              {slow && <p className="muted small"><i className="fa-solid fa-circle-notch fa-spin" /> Writing the details for this pose. This only happens once.</p>}
              <div className="pd-stats">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton block" style={{ height: '5.5rem' }} />)}</div>
              {[0, 1, 2, 3].map(i => <div key={i} className="skeleton line tall" />)}
            </div>
          ) : (
            <>
              <dl className="pd-stats">
                <div className="pd-stat">
                  <dt>Level</dt>
                  <dd>{d.level}</dd>
                </div>
                <div className="pd-stat">
                  <dt>Typical hold</dt>
                  <dd>{d.hold || `${d.hold_seconds} seconds`}</dd>
                </div>
                <div className="pd-stat">
                  <dt>Calories</dt>
                  <dd>≈ {Math.round(perMin * 10)} kcal <span className="pd-stat-unit">per 10 min</span></dd>
                  <label className="pd-weight">
                    at
                    <input type="number" min="30" max="250" value={weight} onChange={e => changeWeight(e.target.value)} aria-label="Your body weight in kilograms" />
                    kg
                  </label>
                </div>
                <div className="pd-stat">
                  <dt>Works</dt>
                  <dd className="pd-muscles">{d.focus_muscles.slice(0, 3).join(', ') || '—'}</dd>
                </div>
              </dl>

              <div className="pd-grid">
                <section>
                  <h3 className="pd-h">How to do it</h3>
                  <ol className="pd-steps">
                    {d.steps.map((s, i) => (
                      <li key={i}>
                        <span className="pd-step-num">{i + 1}</span>
                        <p>{s.text}</p>
                        {s.breath && <span className={`pd-breath breath-${s.breath.toLowerCase()}`}>{s.breath}</span>}
                      </li>
                    ))}
                  </ol>
                  {d.breathing && (
                    <p className="pd-note"><i className="fa-solid fa-wind" /> {d.breathing}</p>
                  )}

                  {d.common_mistakes.length > 0 && (
                    <>
                      <h3 className="pd-h">Common mistakes</h3>
                      <ul className="pd-mistakes">
                        {d.common_mistakes.map((m, i) => (
                          <li key={i}>
                            <p className="pd-mistake"><i className="fa-solid fa-xmark" /> {m.mistake}</p>
                            <p className="pd-fix"><i className="fa-solid fa-check" /> {m.fix}</p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>

                <aside className="pd-side">
                  {d.benefits.length > 0 && (
                    <div>
                      <h3 className="pd-h">Benefits</h3>
                      <ul className="pd-list">{d.benefits.map((b, i) => <li key={i}>{b}</li>)}</ul>
                    </div>
                  )}
                  {(d.easier.length > 0 || d.harder.length > 0) && (
                    <div>
                      <h3 className="pd-h">Adjust it</h3>
                      {d.easier.length > 0 && (
                        <>
                          <p className="pd-sub"><i className="fa-solid fa-arrow-down" /> Make it easier</p>
                          <ul className="pd-list">{d.easier.map((x, i) => <li key={i}>{x}</li>)}</ul>
                        </>
                      )}
                      {d.harder.length > 0 && (
                        <>
                          <p className="pd-sub"><i className="fa-solid fa-arrow-up" /> Make it harder</p>
                          <ul className="pd-list">{d.harder.map((x, i) => <li key={i}>{x}</li>)}</ul>
                        </>
                      )}
                    </div>
                  )}
                  {d.props.length > 0 && (
                    <div>
                      <h3 className="pd-h">Helpful props</h3>
                      <ul className="pd-list">{d.props.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                  )}
                  {d.avoid_if.length > 0 && (
                    <div className="pd-caution">
                      <h3 className="pd-h"><i className="fa-solid fa-triangle-exclamation" /> Skip or modify if</h3>
                      <ul className="pd-list">{d.avoid_if.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                  )}
                  {d.pairs_with.length > 0 && onSelect && (
                    <div>
                      <h3 className="pd-h">Pairs well with</h3>
                      <div className="chip-row">
                        {d.pairs_with.map(n => <button key={n} className="chip" onClick={() => onSelect(n)}>{n}</button>)}
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </div>

        <footer className="pd-foot">
          <p className="muted small">
            {source === 'library' ? 'Details written with AI and reviewed.' : 'Details written with AI and not yet reviewed.'}
            {' '}Calories are estimates. Not medical advice.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => { onClose(); openAssistant(`Tell me more about ${pose.name}. Is it a good fit for me, and how should I start?`) }}>
            <i className="fa-regular fa-comment-dots" /> Ask the assistant
          </button>
        </footer>
      </article>
    </div>,
    document.body
  )
}
