import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import { useOutletContext } from 'react-router-dom'
import React from 'react'

export default function Reminders() {
  const { request, loading, error, setError } = useApi()
  const [reminders, setReminders] = useState([])
  const { globalSearch = '' } = useOutletContext() || {}
  
  // Form state
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ medicine: '', dosage: '', time: '', frequency: 'Daily' })

  const fetchReminders = async () => {
    try {
      const data = await request('get', '/api/reminders')
      setReminders(data.reminders)
    } catch (e) {} // Error handled by hook
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await request('post', '/api/reminders', form)
      setShowModal(false)
      setForm({ medicine: '', dosage: '', time: '', frequency: 'Daily' })
      fetchReminders()
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      try {
        await request('delete', `/api/reminders/${id}`)
        fetchReminders()
      } catch (e) {}
    }
  }

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="text-secondary">Keep track of your medication schedule.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-plus"></i> Add Reminder
        </button>
      </div>

      {error && <div className="flash-message flash-error">{error}</div>}

      {/* Reminders List */}
      <div className="reminders-list">
        {loading && reminders.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
        ) : reminders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><i className="fa-regular fa-bell"></i></div>
            <h3>No Reminders Yet</h3>
            <p className="text-secondary">Click the "Add Reminder" button to get started.</p>
          </div>
        ) : (
          reminders.filter(r => r.medicine.toLowerCase().includes(globalSearch.toLowerCase())).map(r => (
            <div key={r.id} className="reminder-card hover-lift">
              <div className="reminder-icon">
                <i className="fa-solid fa-pills"></i>
              </div>
              <div className="reminder-details">
                <h3 className="reminder-medicine">{r.medicine}</h3>
                <div className="reminder-meta">
                  <span className="badge badge-primary"><i className="fa-solid fa-prescription-bottle"></i> {r.dosage}</span>
                  <span className="badge badge-warning"><i className="fa-regular fa-clock"></i> {r.time}</span>
                  <span className="badge badge-success"><i className="fa-solid fa-rotate"></i> {r.frequency}</span>
                </div>
              </div>
              <div className="reminder-actions">
                <button className="icon-btn btn-danger-outline" onClick={() => handleDelete(r.id)} aria-label="Delete">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Reminder Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-up">
            <div className="modal-header">
              <h2>Add New Reminder</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Medicine Name</label>
                <input required type="text" value={form.medicine} onChange={e => setForm({...form, medicine: e.target.value})} placeholder="e.g. Lisinopril" />
              </div>
              <div className="form-group">
                <label>Dosage</label>
                <input required type="text" value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} placeholder="e.g. 10mg" />
              </div>
              <div className="form-group half-width-group">
                <div className="form-group w-50">
                  <label>Time</label>
                  <input required type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
                </div>
                <div className="form-group w-50">
                  <label>Frequency</label>
                  <select required value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                    <option>Once Daily</option>
                    <option>Twice Daily</option>
                    <option>Weekly</option>
                    <option>As Needed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
