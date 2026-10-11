import { useState, useEffect, useCallback } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import axios from 'axios'
import { useFlash } from '../context/FlashContext'
import { useAiStatus } from '../hooks/useAiStatus'
import { fmt, timeOf, dayLabel } from '../lib/format'
import MealAnalyzer from '../components/ai/MealAnalyzer'
import CalorieRing from '../components/charts/CalorieRing'
import MacroBars from '../components/charts/MacroBars'
import EmptyState from '../components/ui/EmptyState'

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: '7 days' },
  { key: 'all',   label: 'All' },
]

export default function Nutrition() {
  const { showFlash } = useFlash()
  const { enabled: aiEnabled, ready: aiReady } = useAiStatus()
  const { globalSearch = '' } = useOutletContext() || {}
  const [mode, setMode] = useState(null) // 'describe' | 'search'; defaults once AI status is known
  const [history, setHistory] = useState([])
  const [todayItems, setTodayItems] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [period, setPeriod] = useState('today')
  const [customDate, setCustomDate] = useState('')
  const [calorieGoal, setCalorieGoal] = useState(2000)

  const activeMode = mode || (aiReady && !aiEnabled ? 'search' : 'describe')

  useEffect(() => {
    axios.get('/api/settings').then(r => setCalorieGoal(r.data.calorie_goal || 2000)).catch(() => {})
  }, [])

  const fetchHistory = useCallback(async () => {
    const q = customDate ? `?date=${customDate}` : period === 'all' ? '' : `?period=${period}`
    try {
      const [list, today] = await Promise.all([
        axios.get(`/api/nutrition/history${q}`),
        axios.get('/api/nutrition/history?period=today'),
      ])
      setHistory(list.data.history || [])
      setTodayItems(today.data.history || [])
    } catch { /* toast below handles user-facing errors */ }
    finally { setHistoryLoading(false) }
  }, [period, customDate])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  async function logItems(items) {
    try {
      for (const it of items) {
        await axios.post('/api/nutrition/save', {
          food_name: it.name, calories: it.calories, protein: it.protein, carbs: it.carbs, fat: it.fat,
        })
      }
      showFlash(`Logged ${items.length === 1 ? items[0].name : `${items.length} items`}`, 'success')
      fetchHistory()
    } catch {
      showFlash('Could not save to your log', 'error')
    }
  }

  async function handleDelete(item) {
    if (!confirm(`Remove "${item.food_name}" from your log?`)) return
    try {
      await axios.delete(`/api/nutrition/history/${item.id}`)
      fetchHistory()
    } catch {
      showFlash('Could not delete that entry', 'error')
    }
  }

  const totals = todayItems.reduce((a, i) => ({
    calories: a.calories + i.calories, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const filtered = history.filter(i => i.food_name.toLowerCase().includes(globalSearch.toLowerCase()))
  const groups = groupByDay(filtered)

  return (
    <div className="stack-lg animate-in">
      <header className="page-head">
        <div>
          <h1 className="page-title">Nutrition</h1>
          <p className="page-sub">Log what you eat in plain words, or look foods up in the database.</p>
        </div>
      </header>

      <div className="grid-12">
        <section className="card span-8">
          <header className="card-head">
            <h2 className="card-title">Add food</h2>
            <div className="seg" role="tablist" aria-label="How to add food">
              <button role="tab" aria-selected={activeMode === 'describe'} className={activeMode === 'describe' ? 'is-on' : ''} onClick={() => setMode('describe')}>
                Describe it
              </button>
              <button role="tab" aria-selected={activeMode === 'search'} className={activeMode === 'search' ? 'is-on' : ''} onClick={() => setMode('search')}>
                Search foods
              </button>
            </div>
          </header>
          {activeMode === 'describe' ? <MealAnalyzer onLog={logItems} /> : <FoodSearch onLog={logItems} />}
        </section>

        <section className="card span-4">
          <header className="card-head">
            <div>
              <h2 className="card-title">Today</h2>
              <p className="card-sub">Goal {fmt(calorieGoal)} kcal · <Link to="/profile">change</Link></p>
            </div>
          </header>
          <div className="today-stack">
            <CalorieRing consumed={totals.calories} goal={calorieGoal} size={132} />
            <p className="today-eaten"><strong>{fmt(totals.calories)}</strong> kcal eaten</p>
            <MacroBars totals={totals} goal={calorieGoal} compact />
          </div>
        </section>
      </div>

      <section className="card">
        <header className="card-head wrap">
          <div>
            <h2 className="card-title">Food log</h2>
            <p className="card-sub">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}{globalSearch && ` matching "${globalSearch}"`}</p>
          </div>
          <div className="row gap-sm">
            <div className="seg" role="radiogroup" aria-label="Period">
              {PERIODS.map(p => (
                <button key={p.key} role="radio" aria-checked={!customDate && period === p.key}
                  className={!customDate && period === p.key ? 'is-on' : ''}
                  onClick={() => { setPeriod(p.key); setCustomDate('') }}>{p.label}</button>
              ))}
            </div>
            <input type="date" className="input input-sm" value={customDate}
              onChange={e => setCustomDate(e.target.value)} aria-label="Pick a date" />
          </div>
        </header>

        {historyLoading ? (
          <div className="stack-sm">{[0, 1, 2].map(i => <div key={i} className="skeleton line tall" />)}</div>
        ) : groups.length === 0 ? (
          <EmptyState image="/images/empty-meals-240.webp" icon="fa-bowl-food" title={globalSearch ? 'No matching entries' : 'Nothing logged for this period'}>
            {globalSearch ? 'Try a different filter.' : 'Describe a meal above and it will show up here.'}
          </EmptyState>
        ) : (
          <div className="log">
            {groups.map(([day, items]) => (
              <div key={day} className="log-day">
                <div className="log-day-head">
                  <span>{dayLabel(day)}</span>
                  <span className="muted">{fmt(items.reduce((s, i) => s + i.calories, 0))} kcal</span>
                </div>
                <table className="log-table">
                  <thead className="sr-only">
                    <tr><th>Time</th><th>Food</th><th>kcal</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="log-time">{timeOf(item.created_at)}</td>
                        <td className="log-name">{item.food_name}</td>
                        <td className="num"><strong>{fmt(item.calories)}</strong> <span className="muted">kcal</span></td>
                        <td className="num hide-sm"><span className="swatch swatch-protein" />{Math.round(item.protein)}g</td>
                        <td className="num hide-sm"><span className="swatch swatch-carbs" />{Math.round(item.carbs)}g</td>
                        <td className="num hide-sm"><span className="swatch swatch-fat" />{Math.round(item.fat)}g</td>
                        <td className="actions">
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(item)} aria-label={`Delete ${item.food_name}`}>
                            <i className="fa-regular fa-trash-can" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function groupByDay(items) {
  const map = new Map()
  for (const it of items) {
    const day = (it.created_at || '').slice(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day).push(it)
  }
  return [...map.entries()]
}

function FoodSearch({ onLog }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [added, setAdded] = useState({})

  async function search(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setAdded({})
    try {
      const r = await axios.post('/api/nutrition/search', { food: query })
      setResults(r.data.results || [])
    } catch (err) {
      setResults([])
      setError(err.response?.data?.error || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="stack-md">
      <form onSubmit={search} className="row gap-sm">
        <label className="input-icon grow">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input className="input" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search a food, e.g. banana, oat milk, paneer" aria-label="Search foods" />
        </label>
        <button className="btn btn-primary" disabled={loading || !query.trim()}>
          {loading ? <i className="fa-solid fa-circle-notch fa-spin" /> : 'Search'}
        </button>
      </form>
      <p className="muted small">Values are per 100 g, from Open Food Facts.</p>
      {error && <p className="inline-error">{error}</p>}
      {results && results.length > 0 && (
        <ul className="result-list">
          {results.map((f, i) => (
            <li key={i} className="result-row">
              <div className="grow">
                <p className="result-name">{f.name}</p>
                <p className="result-meta">
                  <strong>{fmt(f.calories)} kcal</strong> · P {f.protein}g · C {f.carbs}g · F {f.fat}g
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" disabled={added[i]}
                onClick={async () => { await onLog([f]); setAdded(a => ({ ...a, [i]: true })) }}>
                {added[i] ? <><i className="fa-solid fa-check" /> Added</> : <><i className="fa-solid fa-plus" /> Add</>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
