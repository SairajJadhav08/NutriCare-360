import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { greeting, longDate, formatClock, fmt } from '../lib/format'
import CalorieRing from '../components/charts/CalorieRing'
import MacroBars from '../components/charts/MacroBars'
import WeekBars from '../components/charts/WeekBars'
import DailyBrief from '../components/ai/DailyBrief'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [takingId, setTakingId] = useState(null)
  const [changes, setChanges] = useState(0) // bumps when data changes here, so the brief can offer an update

  const load = useCallback(() => {
    return axios.get('/api/dashboard-stats')
      .then(r => setStats(r.data))
      .catch(() => setError('Could not load your data. Is the backend running?'))
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleTaken(med) {
    setTakingId(med.id)
    try {
      const r = await axios.post(`/api/reminders/${med.id}/taken`)
      setStats(s => ({
        ...s,
        meds_today: s.meds_today.map(m => m.id === med.id ? { ...m, taken_today: r.data.taken } : m),
      }))
      setChanges(c => c + 1)
    } finally {
      setTakingId(null)
    }
  }

  const name = user?.username
  return (
    <div className="stack-lg animate-in">
      <header className="page-head">
        <div>
          <p className="eyebrow">{longDate()}</p>
          <h1 className="page-title">{greeting()}, {name}</h1>
        </div>
        <div className="row gap-sm">
          <Link to="/reminders" className="btn btn-secondary">
            <i className="fa-solid fa-pills" /> Medications
          </Link>
          <Link to="/nutrition" className="btn btn-primary">
            <i className="fa-solid fa-plus" /> Log a meal
          </Link>
        </div>
      </header>

      {error && <p className="callout callout-danger"><i className="fa-solid fa-circle-exclamation" /> {error}</p>}

      <div className="grid-12">
        <TodayCard stats={stats} />
        <MedsCard stats={stats} takingId={takingId} onToggle={toggleTaken} />
      </div>

      <div className="grid-12">
        <div className="span-7"><DailyBrief refreshKey={changes} /></div>
        <WeekCard stats={stats} />
      </div>

      <div className="tiles">
        <Link to="/prescriptions" className="tile">
          <i className="fa-solid fa-file-medical" />
          <div>
            <p className="tile-title">Prescriptions</p>
            <p className="tile-sub">{stats ? `${stats.prescriptions} stored` : '—'}</p>
          </div>
          <i className="fa-solid fa-chevron-right tile-go" />
        </Link>
        <Link to="/yoga" className="tile">
          <i className="fa-solid fa-spa" />
          <div>
            <p className="tile-title">Yoga</p>
            <p className="tile-sub">Build a timed routine</p>
          </div>
          <i className="fa-solid fa-chevron-right tile-go" />
        </Link>
        <Link to="/profile" className="tile">
          <i className="fa-solid fa-id-card" />
          <div>
            <p className="tile-title">Health card</p>
            <p className="tile-sub">Share a summary image</p>
          </div>
          <i className="fa-solid fa-chevron-right tile-go" />
        </Link>
      </div>
    </div>
  )
}

function TodayCard({ stats }) {
  return (
    <section className="card span-7">
      <header className="card-head">
        <div>
          <h2 className="card-title">Today's intake</h2>
          <p className="card-sub">
            {stats ? `${fmt(stats.today.calories)} of ${fmt(stats.calorie_goal)} kcal · ${stats.today.entries} item${stats.today.entries === 1 ? '' : 's'} logged` : 'Loading'}
          </p>
        </div>
        <Link to="/nutrition" className="link-btn">Food log <i className="fa-solid fa-arrow-right" /></Link>
      </header>
      {!stats ? (
        <div className="today-grid"><div className="skeleton circle" style={{ width: '9.25rem', height: '9.25rem' }} /><div className="stack-sm">{[0, 1, 2].map(i => <div key={i} className="skeleton line tall" />)}</div></div>
      ) : (
        <div className="today-grid">
          <CalorieRing consumed={stats.today.calories} goal={stats.calorie_goal} />
          <div className="stack-md">
            <MacroBars totals={stats.today} goal={stats.calorie_goal} />
            {stats.today.items.length > 0 ? (
              <p className="today-items">
                <span className="muted">Logged: </span>
                {stats.today.items.slice(0, 4).join(', ')}
                {stats.today.items.length > 4 && ` and ${stats.today.items.length - 4} more`}
              </p>
            ) : (
              <p className="today-items muted">Nothing logged yet today.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function MedsCard({ stats, takingId, onToggle }) {
  const meds = stats?.meds_today || []
  const taken = meds.filter(m => m.taken_today).length
  return (
    <section className="card span-5">
      <header className="card-head">
        <div>
          <h2 className="card-title">Medications</h2>
          <p className="card-sub">{stats ? (meds.length ? `${taken} of ${meds.length} taken today` : 'No reminders set') : 'Loading'}</p>
        </div>
        <Link to="/reminders" className="link-btn">Manage <i className="fa-solid fa-arrow-right" /></Link>
      </header>
      {stats && meds.length > 0 && (
        <div className="bar-track thin" role="progressbar" aria-valuenow={taken} aria-valuemin={0} aria-valuemax={meds.length} aria-label="Doses taken today">
          <div className="bar-fill fill-success" style={{ width: `${(taken / meds.length) * 100}%` }} />
        </div>
      )}
      {!stats ? (
        <div className="stack-sm">{[0, 1, 2].map(i => <div key={i} className="skeleton line tall" />)}</div>
      ) : meds.length === 0 ? (
        <div className="inline-empty">
          <p className="muted">Add your medications to get a daily checklist here.</p>
          <Link to="/reminders" className="btn btn-secondary btn-sm"><i className="fa-solid fa-plus" /> Add a reminder</Link>
        </div>
      ) : (
        <ul className="med-list">
          {meds.slice(0, 5).map(m => (
            <li key={m.id} className={`med-row${m.taken_today ? ' is-taken' : ''}`}>
              <span className="med-time">{formatClock(m.time)}</span>
              <div className="med-text">
                <p className="med-name">{m.medicine}</p>
                <p className="med-dose">{m.dosage} · {m.frequency}</p>
              </div>
              <button
                className={`check-btn${m.taken_today ? ' is-on' : ''}`}
                onClick={() => onToggle(m)}
                disabled={takingId === m.id}
                aria-pressed={m.taken_today}
                aria-label={m.taken_today ? `Undo ${m.medicine} taken` : `Mark ${m.medicine} as taken`}
              >
                <i className={`fa-solid ${takingId === m.id ? 'fa-circle-notch fa-spin' : 'fa-check'}`} />
              </button>
            </li>
          ))}
          {meds.length > 5 && <li className="muted small">and {meds.length - 5} more on the Medications page</li>}
        </ul>
      )}
    </section>
  )
}

function WeekCard({ stats }) {
  const logged = stats ? stats.week.filter(d => d.calories > 0) : []
  const avg = logged.length ? Math.round(logged.reduce((s, d) => s + d.calories, 0) / logged.length) : 0
  const onTarget = stats ? logged.filter(d => Math.abs(d.calories - stats.calorie_goal) <= stats.calorie_goal * 0.1).length : 0
  return (
    <section className="card span-5">
      <header className="card-head">
        <div>
          <h2 className="card-title">Last 7 days</h2>
          <p className="card-sub">Calories per day</p>
        </div>
      </header>
      {!stats ? (
        <div className="skeleton block" style={{ height: '10rem' }} />
      ) : (
        <>
          <WeekBars days={stats.week} goal={stats.calorie_goal} />
          <dl className="kv-row">
            <div><dt>Daily average</dt><dd>{logged.length ? `${fmt(avg)} kcal` : '—'}</dd></div>
            <div><dt>Days logged</dt><dd>{logged.length} / 7</dd></div>
            <div><dt>Within 10% of goal</dt><dd>{onTarget}</dd></div>
          </dl>
        </>
      )}
    </section>
  )
}
