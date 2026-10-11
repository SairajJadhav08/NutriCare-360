import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { useAiStatus } from '../../hooks/useAiStatus'
import PoseImage from '../ui/PoseImage'

const GOALS = ['Lower back relief', 'Unwind before sleep', 'Morning energy', 'Hip and hamstring flexibility', 'Build core strength']
const LENGTHS = [10, 15, 20, 30]
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

/** AI picks and times poses from the library for a goal; the player walks through them. */
export default function RoutineBuilder() {
  const { enabled, ready } = useAiStatus()
  const [goal, setGoal] = useState(GOALS[0])
  const [custom, setCustom] = useState('')
  const [minutes, setMinutes] = useState(15)
  const [level, setLevel] = useState('Beginner')
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [playing, setPlaying] = useState(false)

  async function build(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const r = await axios.post('/api/ai/yoga-routine', { goal: custom.trim() || goal, minutes, level })
      setRoutine(r.data.routine)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not build a routine.')
    } finally {
      setLoading(false)
    }
  }

  if (ready && !enabled) return null

  return (
    <section className="card builder">
      <div className="builder-grid">
        <form className="builder-form" onSubmit={build}>
          <header>
            <h2 className="card-title">Build a routine</h2>
            <p className="card-sub">Pick a goal and a length. Poses come from the library below, in a safe order, timed to fit.</p>
          </header>

          <fieldset className="field">
            <legend className="label">Goal</legend>
            <div className="chip-row">
              {GOALS.map(g => (
                <button type="button" key={g} className={`chip${!custom && goal === g ? ' is-on' : ''}`}
                  onClick={() => { setGoal(g); setCustom('') }} aria-pressed={!custom && goal === g}>{g}</button>
              ))}
            </div>
            <input className="input" value={custom} onChange={e => setCustom(e.target.value)}
              placeholder="Or describe your own, e.g. stiff neck from desk work" maxLength={200} aria-label="Custom goal" />
          </fieldset>

          <div className="builder-row">
            <fieldset className="field">
              <legend className="label">Length</legend>
              <div className="seg" role="radiogroup">
                {LENGTHS.map(m => (
                  <button type="button" role="radio" aria-checked={minutes === m} key={m}
                    className={minutes === m ? 'is-on' : ''} onClick={() => setMinutes(m)}>{m} min</button>
                ))}
              </div>
            </fieldset>
            <fieldset className="field">
              <legend className="label">Level</legend>
              <div className="seg" role="radiogroup">
                {LEVELS.map(l => (
                  <button type="button" role="radio" aria-checked={level === l} key={l}
                    className={level === l ? 'is-on' : ''} onClick={() => setLevel(l)}>{l}</button>
                ))}
              </div>
            </fieldset>
          </div>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Building</> : routine ? 'Build another' : 'Build routine'}
          </button>
          {error && <p className="inline-error">{error}</p>}
        </form>

        <div className="builder-result">
          {loading ? (
            <div aria-busy="true">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton line tall" />)}</div>
          ) : routine ? (
            <div className="animate-in">
              <div className="routine-head">
                <div>
                  <h3 className="routine-title">{routine.title}</h3>
                  <p className="muted small">{routine.total_minutes} min · {routine.level} · {routine.steps.length} poses</p>
                </div>
                <button className="btn btn-secondary" onClick={() => setPlaying(true)}>
                  <i className="fa-solid fa-play" /> Start
                </button>
              </div>
              {routine.summary && <p className="routine-summary">{routine.summary}</p>}
              {routine.caution && (
                <p className="callout callout-warning"><i className="fa-solid fa-triangle-exclamation" /> {routine.caution}</p>
              )}
              <ol className="timeline">
                {routine.steps.map((s, i) => (
                  <li key={i} className="timeline-step">
                    <PoseImage name={s.name} fallback={s.image_url} className="timeline-thumb" sizes="52px" />
                    <div className="timeline-text">
                      <p className="timeline-name">{s.name}</p>
                      <p className="timeline-cue">{s.cue}</p>
                    </div>
                    <span className="timeline-min">{s.minutes} min</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="builder-placeholder">
              <i className="fa-solid fa-person-walking" />
              <p>Your routine will appear here, with a timer to follow along.</p>
            </div>
          )}
        </div>
      </div>

      {playing && routine && <RoutinePlayer routine={routine} onClose={() => setPlaying(false)} />}
    </section>
  )
}

function RoutinePlayer({ routine, onClose }) {
  const [idx, setIdx] = useState(0)
  const [left, setLeft] = useState(routine.steps[0].minutes * 60)
  const [paused, setPaused] = useState(false)
  const step = routine.steps[idx]
  const done = idx >= routine.steps.length

  useEffect(() => {
    if (paused || done) return
    const t = setInterval(() => setLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [paused, done, idx])

  useEffect(() => {
    if (left <= 0 && !done) go(idx + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function go(i) {
    setIdx(i)
    if (i < routine.steps.length) setLeft(routine.steps[i].minutes * 60)
  }

  const total = step ? step.minutes * 60 : 1
  const mm = String(Math.floor(Math.max(0, left) / 60)).padStart(1, '0')
  const ss = String(Math.max(0, left) % 60).padStart(2, '0')

  return createPortal(
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Routine player">
      <div className="modal player">
        <header className="modal-head">
          <div>
            <h2 className="modal-title">{routine.title}</h2>
            <p className="muted small">{done ? 'Finished' : `Pose ${idx + 1} of ${routine.steps.length}`}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close player"><i className="fa-solid fa-xmark" /></button>
        </header>
        {done ? (
          <div className="player-done">
            <i className="fa-solid fa-circle-check" />
            <h3>Routine complete</h3>
            <p className="muted">{routine.total_minutes} minutes, {routine.steps.length} poses.</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <PoseImage name={step.name} fallback={step.image_url} className="player-img" sizes="(max-width: 560px) 100vw, 520px" priority />
            <div className="player-body">
              <p className="player-name">{step.name}</p>
              <p className="player-cue">{step.cue}</p>
              <div className="player-clock" aria-live="polite">{mm}:{ss}</div>
              <div className="bar-track"><div className="bar-fill fill-primary" style={{ width: `${(1 - left / total) * 100}%` }} /></div>
              <div className="player-controls">
                <button className="btn btn-ghost btn-icon" onClick={() => go(Math.max(0, idx - 1))} disabled={idx === 0} aria-label="Previous pose">
                  <i className="fa-solid fa-backward-step" />
                </button>
                <button className="btn btn-primary btn-round" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume' : 'Pause'}>
                  <i className={`fa-solid ${paused ? 'fa-play' : 'fa-pause'}`} />
                </button>
                <button className="btn btn-ghost btn-icon" onClick={() => go(idx + 1)} aria-label="Next pose">
                  <i className="fa-solid fa-forward-step" />
                </button>
              </div>
              {routine.steps[idx + 1] && (
                <p className="muted small">Next: {routine.steps[idx + 1].name}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

