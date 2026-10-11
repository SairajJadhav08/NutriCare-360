import { useState } from 'react'
import axios from 'axios'
import { useAiStatus } from '../../hooks/useAiStatus'
import { fmt } from '../../lib/format'

const EXAMPLES = [
  'Two scrambled eggs, toast with butter, black coffee',
  'Chicken burrito bowl with rice, beans and guacamole',
  'Greek yogurt with granola and a banana',
]

/** Free-text meal → itemized macros. The user picks which items to log. */
export default function MealAnalyzer({ onLog }) {
  const { enabled, ready } = useAiStatus()
  const [meal, setMeal] = useState('')
  const [result, setResult] = useState(null)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [logging, setLogging] = useState(false)
  const [error, setError] = useState(null)

  async function analyze(e) {
    e?.preventDefault()
    if (!meal.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await axios.post('/api/nutrition/analyze', { meal })
      setResult(r.data)
      setSelected(r.data.items.map(() => true))
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function logSelected() {
    const items = result.items.filter((_, i) => selected[i])
    if (!items.length) return
    setLogging(true)
    try {
      await onLog(items)
      setResult(null)
      setMeal('')
    } finally {
      setLogging(false)
    }
  }

  if (ready && !enabled) {
    return (
      <div className="ai-off compact">
        <i className="fa-solid fa-plug-circle-xmark" />
        <p>Describing meals needs AI, which is off on this server. Use <strong>Search foods</strong> instead, or add <code>GROQ_API_KEY</code> to the backend.</p>
      </div>
    )
  }

  const picked = result ? result.items.filter((_, i) => selected[i]) : []
  const sum = k => picked.reduce((s, it) => s + it[k], 0)

  return (
    <div className="analyzer">
      <form onSubmit={analyze} className="analyzer-form">
        <label htmlFor="meal-input" className="sr-only">Describe what you ate</label>
        <textarea
          id="meal-input"
          rows={2}
          className="input"
          value={meal}
          onChange={e => setMeal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) analyze(e) }}
          placeholder="What did you eat? Include amounts if you know them."
          maxLength={500}
        />
        <div className="analyzer-row">
          <div className="example-chips" aria-label="Examples">
            {EXAMPLES.map(ex => (
              <button type="button" key={ex} className="chip" onClick={() => setMeal(ex)}>{ex}</button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !meal.trim()}>
            {loading ? <><i className="fa-solid fa-circle-notch fa-spin" /> Estimating</> : 'Estimate'}
          </button>
        </div>
      </form>

      {error && <p className="inline-error"><i className="fa-solid fa-circle-exclamation" /> {error}</p>}

      {loading && (
        <div className="analyzer-result" aria-busy="true">
          {[0, 1, 2].map(i => <div key={i} className="skeleton line tall" />)}
        </div>
      )}

      {result && (
        <div className="analyzer-result animate-in">
          <table className="items-table">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Include</span></th>
                <th scope="col">Item</th>
                <th scope="col" className="num">kcal</th>
                <th scope="col" className="num">Protein</th>
                <th scope="col" className="num">Carbs</th>
                <th scope="col" className="num">Fat</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((it, i) => (
                <tr key={i} className={selected[i] ? '' : 'is-off'}>
                  <td>
                    <input type="checkbox" checked={selected[i]} aria-label={`Include ${it.name}`}
                      onChange={() => setSelected(s => s.map((v, j) => j === i ? !v : v))} />
                  </td>
                  <td>{it.name}</td>
                  <td className="num">{fmt(it.calories)}</td>
                  <td className="num">{it.protein}g</td>
                  <td className="num">{it.carbs}g</td>
                  <td className="num">{it.fat}g</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <th scope="row">Selected total</th>
                <td className="num">{fmt(sum('calories'))}</td>
                <td className="num">{sum('protein')}g</td>
                <td className="num">{sum('carbs')}g</td>
                <td className="num">{sum('fat')}g</td>
              </tr>
            </tfoot>
          </table>

          {(result.assumptions || result.tip) && (
            <div className="analyzer-notes">
              {result.assumptions && <p><span className="eyebrow">Assumed</span>{result.assumptions}</p>}
              {result.tip && <p><span className="eyebrow">Tip</span>{result.tip}</p>}
            </div>
          )}

          <div className="analyzer-actions">
            <span className="muted small">Estimates. Edit the description and re-run if a portion looks off.</span>
            <div className="row gap-sm">
              <button className="btn btn-ghost" onClick={() => setResult(null)}>Discard</button>
              <button className="btn btn-primary" onClick={logSelected} disabled={!picked.length || logging}>
                {logging ? 'Logging' : `Log ${picked.length} item${picked.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
