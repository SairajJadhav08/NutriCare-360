import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useFlash } from '../context/FlashContext'
import { fmt, macroTargets } from '../lib/format'
import HealthCard from '../components/ui/HealthCard'

const PRESETS = [1600, 1800, 2000, 2200, 2500]

export default function Profile() {
  const { user, logout } = useAuth()
  const { showFlash } = useFlash()
  const [stats, setStats] = useState(null)
  const [goal, setGoal] = useState(2000)
  const [goalInput, setGoalInput] = useState('2000')
  const [goalSaving, setGoalSaving] = useState(false)
  const [showCard, setShowCard] = useState(false)

  useEffect(() => {
    axios.get('/api/dashboard-stats').then(r => {
      setStats(r.data)
      setGoal(r.data.calorie_goal)
      setGoalInput(String(r.data.calorie_goal))
    }).catch(() => {})
  }, [])

  const goalNum = Number(goalInput)
  const goalValid = goalNum >= 500 && goalNum <= 10000
  const targets = macroTargets(goalValid ? goalNum : goal)

  async function saveGoal(e) {
    e.preventDefault()
    if (!goalValid) return
    setGoalSaving(true)
    try {
      await axios.put('/api/settings', { calorie_goal: goalNum })
      setGoal(goalNum)
      showFlash('Daily goal saved', 'success')
    } catch (err) {
      showFlash(err.response?.data?.error || 'Could not save goal', 'error')
    } finally {
      setGoalSaving(false)
    }
  }

  return (
    <div className="stack-lg animate-in">
      <header className="page-head">
        <div>
          <h1 className="page-title">Profile & goals</h1>
          <p className="page-sub">Your daily targets, account and shareable summary.</p>
        </div>
      </header>

      <div className="profile-grid">
        <aside className="card account">
          <span className="avatar avatar-lg">{user?.username?.[0]?.toUpperCase()}</span>
          <h2 className="account-name">{user?.username}</h2>
          <dl className="kv-list">
            <div><dt>Daily goal</dt><dd>{fmt(goal)} kcal</dd></div>
            <div><dt>Medications</dt><dd>{stats?.reminders ?? '—'}</dd></div>
            <div><dt>Prescriptions</dt><dd>{stats?.prescriptions ?? '—'}</dd></div>
            <div><dt>Meals logged</dt><dd>{stats ? fmt(stats.nutrition) : '—'}</dd></div>
            <div><dt>Active days this week</dt><dd>{stats ? `${stats.yoga_streak} / 7` : '—'}</dd></div>
          </dl>
          <button className="btn btn-ghost danger-text" onClick={logout}>
            <i className="fa-solid fa-arrow-right-from-bracket" /> Log out
          </button>
        </aside>

        <div className="stack-lg">
          <section className="card">
            <header className="card-head">
              <div>
                <h2 className="card-title">Daily calorie goal</h2>
                <p className="card-sub">Used for the ring, macro targets and the AI daily brief.</p>
              </div>
            </header>
            <form onSubmit={saveGoal} className="stack-md">
              <div className="chip-row">
                {PRESETS.map(p => (
                  <button type="button" key={p} className={`chip${goalNum === p ? ' is-on' : ''}`} onClick={() => setGoalInput(String(p))}>
                    {fmt(p)}
                  </button>
                ))}
              </div>
              <div className="row gap-sm">
                <label className="input-suffix">
                  <input className="input" type="number" min="500" max="10000" step="50" value={goalInput}
                    onChange={e => setGoalInput(e.target.value)} aria-label="Daily calorie goal" aria-invalid={!goalValid} />
                  <span>kcal / day</span>
                </label>
                <button className="btn btn-primary" disabled={goalSaving || !goalValid || goalNum === goal}>
                  {goalSaving ? 'Saving' : 'Save goal'}
                </button>
              </div>
              {!goalValid && <p className="inline-error">Enter a value between 500 and 10,000.</p>}
              <dl className="kv-row">
                <div><dt><span className="swatch swatch-protein" />Protein</dt><dd>{targets.protein} g</dd></div>
                <div><dt><span className="swatch swatch-carbs" />Carbs</dt><dd>{targets.carbs} g</dd></div>
                <div><dt><span className="swatch swatch-fat" />Fat</dt><dd>{targets.fat} g</dd></div>
              </dl>
              <p className="muted small">Suggested split: 20% protein, 50% carbs, 30% fat. Talk to a dietitian for targets specific to you.</p>
            </form>
          </section>

          <section className="card row-card">
            <div className="grow">
              <h2 className="card-title">Health card</h2>
              <p className="card-sub">A one-image summary of your week to save or share with a coach or family member.</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowCard(true)} disabled={!stats}>
              <i className="fa-regular fa-image" /> Create card
            </button>
          </section>

          <PasswordCard />
        </div>
      </div>

      {showCard && stats && (
        <HealthCard
          username={user?.username || ''}
          stats={stats}
          calorieGoal={goal}
          totalCalories={stats.today.calories}
          onClose={() => setShowCard(false)}
        />
      )}
    </div>
  )
}

function PasswordCard() {
  const { showFlash } = useFlash()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (form.new_password !== form.confirm) return setError('New passwords do not match')
    if (form.new_password.length < 6) return setError('New password must be at least 6 characters')
    setSaving(true)
    try {
      await axios.put('/api/me/password', { current_password: form.current_password, new_password: form.new_password })
      setForm({ current_password: '', new_password: '', confirm: '' })
      showFlash('Password changed', 'success')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  const type = show ? 'text' : 'password'
  return (
    <section className="card">
      <header className="card-head">
        <h2 className="card-title">Password</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShow(s => !s)}>
          <i className={`fa-regular ${show ? 'fa-eye-slash' : 'fa-eye'}`} /> {show ? 'Hide' : 'Show'}
        </button>
      </header>
      <form onSubmit={submit} className="stack-md">
        {error && <p className="callout callout-danger">{error}</p>}
        <div className="field">
          <label className="label" htmlFor="pw-cur">Current password</label>
          <input id="pw-cur" className="input" type={type} required autoComplete="current-password" value={form.current_password} onChange={set('current_password')} />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="pw-new">New password</label>
            <input id="pw-new" className="input" type={type} required minLength={6} autoComplete="new-password" value={form.new_password} onChange={set('new_password')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="pw-conf">Confirm new password</label>
            <input id="pw-conf" className="input" type={type} required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
          </div>
        </div>
        <div><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving' : 'Update password'}</button></div>
      </form>
    </section>
  )
}
