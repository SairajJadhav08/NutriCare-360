import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../hooks/useApi'
import { useOutletContext } from 'react-router-dom'
import React from 'react'

const EMPTY_FORM = { medicine: '', dosage: '', time: '', frequency: 'Once Daily' }

export default function Reminders() {
  const { request, loading, error, setError } = useApi()
  const [reminders, setReminders]   = useState([])
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)  // reminder object being edited, null = add mode
  const [form, setForm]             = useState(EMPTY_FORM)
  const [takingId, setTakingId]     = useState(null)  // spinner for mark-taken
  const { globalSearch = '' }       = useOutletContext() || {}

  const fetchReminders = useCallback(async () => {
    try {
      const data = await request('get', '/api/reminders')
      setReminders(data.reminders)
    } catch (err) {
      console.error(err)
    }
  }, [request])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReminders()
  }, [fetchReminders])

  // ── open modal ────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowModal(true)
  }

  const openEdit = (r) => {
    setEditTarget(r)
    setForm({ medicine: r.medicine, dosage: r.dosage, time: r.time, frequency: r.frequency })
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditTarget(null) }

  // ── submit (add or edit) ──────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editTarget) {
        await request('put', `/api/reminders/${editTarget.id}`, form)
      } else {
        await request('post', '/api/reminders', form)
      }
      closeModal()
      fetchReminders()
    } catch (err) {
      console.error(err)
    }
  }

  // ── delete ────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return
    try {
      await request('delete', `/api/reminders/${id}`)
      fetchReminders()
    } catch (err) {
      console.error(err)
    }
  }

  // ── mark taken (toggle) ───────────────────────────────────────────
  const handleTaken = async (r) => {
    setTakingId(r.id)
    try {
      const data = await request('post', `/api/reminders/${r.id}/taken`)
      setReminders(prev => prev.map(rem =>
        rem.id === r.id ? { ...rem, taken_today: data.taken } : rem
      ))
    } catch (err) {
      console.error(err)
    }
    setTakingId(null)
  }

  const filtered = reminders.filter(r =>
    r.medicine.toLowerCase().includes(globalSearch.toLowerCase())
  )

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="text-secondary">Keep track of your medication schedule.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="fa-solid fa-plus"></i> Add Reminder
        </button>
      </div>

      {error && <div className="flash-message flash-error">{error}</div>}

      {/* Adherence summary bar */}
      {reminders.length > 0 && (() => {
        const taken = reminders.filter(r => r.taken_today).length
        const pct   = Math.round((taken / reminders.length) * 100)
        return (
          <div className="adherence-bar-wrap">
            <div className="adherence-bar-header">
              <span className="adherence-label">
                <i className="fa-solid fa-chart-simple"></i> Today's adherence
              </span>
              <span className="adherence-count">{taken}/{reminders.length} taken</span>
            </div>
            <div className="adherence-track">
              <div className="adherence-fill" style={{ width: `${pct}%` }}></div>
            </div>
            <div className="adherence-pct">{pct}%</div>
          </div>
        )
      })()}

      <div className="reminders-list">
        {loading && reminders.length === 0 ? (
          <div className="skeleton-list">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton-reminder-card">
                <div className="skeleton skeleton-circle"></div>
                <div className="skeleton-lines">
                  <div className="skeleton skeleton-line w-40"></div>
                  <div className="skeleton skeleton-line w-60"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><i className="fa-regular fa-bell"></i></div>
            <h3>No Reminders Yet</h3>
            <p className="text-secondary">Click "Add Reminder" to get started.</p>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className={`reminder-card hover-lift${r.taken_today ? ' reminder-taken' : ''}`}>
              <div className="reminder-icon">
                <i className="fa-solid fa-pills"></i>
              </div>
              <div className="reminder-details">
                <h3 className="reminder-medicine">{r.medicine}</h3>
                <div className="reminder-meta">
                  <span className="badge badge-primary"><i className="fa-solid fa-prescription-bottle"></i> {r.dosage}</span>
                  <span className="badge badge-warning"><i className="fa-regular fa-clock"></i> {r.time}</span>
                  <span className="badge badge-success"><i className="fa-solid fa-rotate"></i> {r.frequency}</span>
                  {r.taken_today && <span className="badge badge-taken"><i className="fa-solid fa-circle-check"></i> Taken</span>}
                </div>
              </div>
              <div className="reminder-actions">
                <button
                  className={`btn btn-sm ${r.taken_today ? 'btn-taken-active' : 'btn-outline'}`}
                  onClick={() => handleTaken(r)}
                  disabled={takingId === r.id}
                  title={r.taken_today ? 'Undo taken' : 'Mark as taken'}
                >
                  {takingId === r.id
                    ? <i className="fa-solid fa-circle-notch fa-spin"></i>
                    : <><i className={`fa-solid ${r.taken_today ? 'fa-rotate-left' : 'fa-check'}`}></i>
                        <span className="taken-btn-text">{r.taken_today ? 'Undo' : 'Take'}</span>
                      </>
                  }
                </button>
                <button className="icon-btn btn-edit-outline" onClick={() => openEdit(r)} aria-label="Edit">
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
                <button className="icon-btn btn-danger-outline" onClick={() => handleDelete(r.id)} aria-label="Delete">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-up">
            <div className="modal-header">
              <h2>{editTarget ? 'Edit Reminder' : 'Add New Reminder'}</h2>
              <button className="icon-btn" onClick={closeModal}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="flash-message flash-error" style={{marginBottom:'1rem'}}>{error}</div>}
              <div className="form-group">
                <label>Medicine Name</label>
                <input required type="text" value={form.medicine}
                  onChange={e => setForm({...form, medicine: e.target.value})}
                  placeholder="e.g. Lisinopril" />
              </div>
              <div className="form-group">
                <label>Dosage</label>
                <input required type="text" value={form.dosage}
                  onChange={e => setForm({...form, dosage: e.target.value})}
                  placeholder="e.g. 10mg" />
              </div>
              <div className="form-group half-width-group">
                <div className="form-group w-50">
                  <label>Time</label>
                  <input required type="time" value={form.time}
                    onChange={e => setForm({...form, time: e.target.value})} />
                </div>
                <div className="form-group w-50">
                  <label>Frequency</label>
                  <select required value={form.frequency}
                    onChange={e => setForm({...form, frequency: e.target.value})}>
                    <option>Once Daily</option>
                    <option>Twice Daily</option>
                    <option>Weekly</option>
                    <option>As Needed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editTarget ? 'Update Reminder' : 'Save Reminder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
