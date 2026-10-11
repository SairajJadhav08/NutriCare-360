import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import axios from 'axios'
import { useFlash } from '../context/FlashContext'
import { formatClock } from '../lib/format'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'

const EMPTY_FORM = { medicine: '', dosage: '', time: '08:00', frequency: 'Once Daily' }
const FREQUENCIES = ['Once Daily', 'Twice Daily', 'Weekly', 'As Needed']

export default function Reminders() {
  const { showFlash } = useFlash()
  const { globalSearch = '' } = useOutletContext() || {}
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null = closed, {} = new, reminder = edit
  const [takingId, setTakingId] = useState(null)

  const fetchReminders = useCallback(async () => {
    try {
      const r = await axios.get('/api/reminders')
      setReminders(r.data.reminders)
    } catch {
      showFlash('Could not load reminders', 'error')
    } finally {
      setLoading(false)
    }
  }, [showFlash])

  useEffect(() => { fetchReminders() }, [fetchReminders])

  async function handleDelete(r) {
    if (!confirm(`Delete the reminder for ${r.medicine}?`)) return
    try {
      await axios.delete(`/api/reminders/${r.id}`)
      setEditing(null)
      fetchReminders()
    } catch {
      showFlash('Could not delete reminder', 'error')
    }
  }

  async function handleTaken(r) {
    setTakingId(r.id)
    try {
      const res = await axios.post(`/api/reminders/${r.id}/taken`)
      setReminders(prev => prev.map(x => x.id === r.id ? { ...x, taken_today: res.data.taken } : x))
    } catch {
      showFlash('Could not update', 'error')
    } finally {
      setTakingId(null)
    }
  }

  const visible = reminders
    .filter(r => r.medicine.toLowerCase().includes(globalSearch.toLowerCase()))
    .sort((a, b) => a.time.localeCompare(b.time))
  const due = visible.filter(r => !r.taken_today)
  const done = visible.filter(r => r.taken_today)
  const takenCount = reminders.filter(r => r.taken_today).length

  return (
    <div className="stack-lg animate-in">
      <header className="page-head">
        <div>
          <h1 className="page-title">Medications</h1>
          <p className="page-sub">Your daily schedule. Tick each dose as you take it.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <i className="fa-solid fa-plus" /> Add medication
        </button>
      </header>

      {reminders.length > 0 && (
        <section className="card adherence">
          <div>
            <p className="adherence-num">{takenCount}<span> / {reminders.length}</span></p>
            <p className="muted small">doses taken today</p>
          </div>
          <div className="grow">
            <div className="bar-track" role="progressbar" aria-valuenow={takenCount} aria-valuemin={0} aria-valuemax={reminders.length} aria-label="Doses taken today">
              <div className="bar-fill fill-success" style={{ width: `${(takenCount / reminders.length) * 100}%` }} />
            </div>
          </div>
          <p className="adherence-note">
            {takenCount === reminders.length ? <><i className="fa-solid fa-circle-check" /> All done for today</> : `${reminders.length - takenCount} still to take`}
          </p>
        </section>
      )}

      {loading ? (
        <div className="card stack-sm">{[0, 1, 2].map(i => <div key={i} className="skeleton line tall" />)}</div>
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState image="/images/empty-reminders-240.webp" icon="fa-pills"
            title={globalSearch ? 'No matching medications' : 'No medications yet'}
            action={!globalSearch && <button className="btn btn-primary" onClick={() => setEditing({})}><i className="fa-solid fa-plus" /> Add your first</button>}>
            {globalSearch ? 'Try a different filter.' : 'Add a medication with its time, and it becomes a daily checklist here and on your Today page.'}
          </EmptyState>
        </div>
      ) : (
        <>
          {due.length > 0 && (
            <ScheduleGroup title="Still to take" items={due} takingId={takingId} onTake={handleTaken} onEdit={setEditing} />
          )}
          {done.length > 0 && (
            <ScheduleGroup title="Taken today" items={done} takingId={takingId} onTake={handleTaken} onEdit={setEditing} />
          )}
        </>
      )}

      {editing && (
        <ReminderForm
          initial={editing}
          onClose={() => setEditing(null)}
          onDelete={editing.id ? () => handleDelete(editing) : null}
          onSaved={(msg) => { setEditing(null); fetchReminders(); showFlash(msg, 'success') }}
        />
      )}
    </div>
  )
}

function ScheduleGroup({ title, items, takingId, onTake, onEdit }) {
  return (
    <section className="card flush">
      <h2 className="group-title">{title} <span className="muted">{items.length}</span></h2>
      <ul className="schedule">
        {items.map(r => (
          <li key={r.id} className={`schedule-row${r.taken_today ? ' is-taken' : ''}`}>
            <span className="schedule-time">{formatClock(r.time)}</span>
            <div className="grow">
              <p className="schedule-name">{r.medicine}</p>
              <p className="schedule-meta">{r.dosage} · {r.frequency}</p>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(r)} aria-label={`Edit ${r.medicine}`}>
              <i className="fa-regular fa-pen-to-square" />
            </button>
            <button
              className={`btn btn-sm ${r.taken_today ? 'btn-ghost' : 'btn-secondary'}`}
              onClick={() => onTake(r)}
              disabled={takingId === r.id}
            >
              {takingId === r.id
                ? <i className="fa-solid fa-circle-notch fa-spin" />
                : r.taken_today ? 'Undo' : <><i className="fa-solid fa-check" /> Take</>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ReminderForm({ initial, onClose, onSaved, onDelete }) {
  const isEdit = Boolean(initial.id)
  const [form, setForm] = useState(isEdit
    ? { medicine: initial.medicine, dosage: initial.dosage, time: initial.time, frequency: initial.frequency }
    : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (isEdit) await axios.put(`/api/reminders/${initial.id}`, form)
      else await axios.post('/api/reminders', form)
      onSaved(isEdit ? 'Reminder updated' : `${form.medicine} added`)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit ${initial.medicine}` : 'Add medication'}
      onClose={onClose}
      footer={
        <>
          {onDelete && <button type="button" className="btn btn-ghost danger-text mr-auto" onClick={onDelete}>Delete</button>}
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="reminder-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving' : isEdit ? 'Save changes' : 'Add medication'}
          </button>
        </>
      }
    >
      <form id="reminder-form" onSubmit={submit} className="stack-md">
        {error && <p className="callout callout-danger">{error}</p>}
        <div className="field">
          <label className="label" htmlFor="med-name">Medication</label>
          <input id="med-name" className="input" required value={form.medicine} onChange={set('medicine')} placeholder="e.g. Metformin" autoFocus />
        </div>
        <div className="field">
          <label className="label" htmlFor="med-dose">Dose</label>
          <input id="med-dose" className="input" required value={form.dosage} onChange={set('dosage')} placeholder="e.g. 500 mg, 1 tablet" />
        </div>
        <div className="field-row">
          <div className="field">
            <label className="label" htmlFor="med-time">Time</label>
            <input id="med-time" type="time" className="input" required value={form.time} onChange={set('time')} />
          </div>
          <div className="field">
            <label className="label" htmlFor="med-freq">How often</label>
            <select id="med-freq" className="input" value={form.frequency} onChange={set('frequency')}>
              {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </form>
    </Modal>
  )
}
