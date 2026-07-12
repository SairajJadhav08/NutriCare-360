import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { useEffect, useState } from 'react'
import React from 'react'
import HealthCard from '../components/ui/HealthCard'

export default function Profile() {
  const { user, logout } = useAuth()
  const { request } = useApi()
  const [stats, setStats]             = useState({ reminders: 0, prescriptions: 0, nutrition: 0 })

  const [showHealthCard, setShowHealthCard] = useState(false)
  const [todayCalories, setTodayCalories]   = useState(0)
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [goalInput, setGoalInput]     = useState(2000)
  const [goalSaving, setGoalSaving]   = useState(false)
  const [goalMsg, setGoalMsg]         = useState(null)

  // change password
  const [pwForm, setPwForm]           = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwSaving, setPwSaving]       = useState(false)
  const [pwMsg, setPwMsg]             = useState(null)
  const [pwError, setPwError]         = useState(null)
  const [showPw, setShowPw]           = useState({ current: false, new: false, confirm: false })

  useEffect(() => {
    request('get', '/api/dashboard-stats').then(d => setStats(d)).catch(() => {})
    request('get', '/api/settings').then(d => {
      setCalorieGoal(d.calorie_goal || 2000)
      setGoalInput(d.calorie_goal || 2000)
    }).catch(() => {})
    request('get', '/api/nutrition/history?period=today').then(d => {
      const total = (d.history || []).reduce((s, i) => s + i.calories, 0)
      setTodayCalories(total)
    }).catch(() => {})
  }, [request])

  // ── save calorie goal ─────────────────────────────────────────────
  const handleGoalSave = async (e) => {
    e.preventDefault()
    setGoalSaving(true)
    setGoalMsg(null)
    try {
      await request('put', '/api/settings', { calorie_goal: Number(goalInput) })
      setCalorieGoal(Number(goalInput))
      setGoalMsg({ type: 'success', text: 'Calorie goal updated!' })
    } catch (err) {
      setGoalMsg({ type: 'error', text: err.message || 'Failed to save goal' })
    } finally {
      setGoalSaving(false)
      setTimeout(() => setGoalMsg(null), 3000)
    }
  }

  // ── change password ───────────────────────────────────────────────
  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPwError(null)
    setPwMsg(null)
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('New passwords do not match')
      return
    }
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters')
      return
    }
    setPwSaving(true)
    try {
      await request('put', '/api/me/password', {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      })
      setPwMsg('Password changed successfully!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwError(err.message || 'Failed to change password')
    } finally {
      setPwSaving(false)
      setTimeout(() => setPwMsg(null), 3000)
    }
  }

  const togglePw = (field) => setShowPw(s => ({ ...s, [field]: !s[field] }))

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h1 className="page-title">Profile</h1>
        <p className="text-secondary">Manage your account settings.</p>
      </div>

      <div className="profile-layout">
        {/* Left — user card */}
        <div className="profile-user-card">
          <div className="profile-avatar-lg">{user?.username?.[0]?.toUpperCase()}</div>
          <h2 className="profile-username">{user?.username}</h2>
          <p className="profile-role">Member</p>

          <div className="profile-stats-row">
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.reminders}</span>
              <span className="profile-stat-label">Reminders</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.prescriptions}</span>
              <span className="profile-stat-label">Prescriptions</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{stats.nutrition}</span>
              <span className="profile-stat-label">Meals Logged</span>
            </div>
          </div>

          <div className="profile-detail-row">
            <span className="profile-detail-label">Username</span>
            <span className="profile-detail-value">{user?.username}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Daily Calorie Goal</span>
            <span className="profile-detail-value">{calorieGoal} kcal</span>
          </div>

          <button className="btn btn-outline w-100" onClick={() => setShowHealthCard(true)} style={{ marginTop: '0.75rem' }}>
            <i className="fa-solid fa-share-nodes"></i> Share Health Card
          </button>
          <button className="btn btn-danger w-100" onClick={logout} style={{ marginTop: '0.75rem' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Log Out
          </button>
        </div>

        {/* Right — settings cards */}
        <div className="profile-right">

          {/* Calorie Goal */}
          <div className="profile-section-card">
            <h3 className="profile-section-title">
              <i className="fa-solid fa-fire"></i> Daily Calorie Goal
            </h3>
            <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Set your target daily calorie intake. This shows as a progress bar on the Nutrition page.
            </p>
            <form onSubmit={handleGoalSave} className="goal-form">
              <div className="goal-input-row">
                <div className="input-with-icon">
                  <i className="fa-solid fa-fire-flame-curved"></i>
                  <input
                    type="number"
                    min="500"
                    max="10000"
                    step="50"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    placeholder="e.g. 2000"
                  />
                </div>
                <span className="goal-unit">kcal / day</span>
                <button type="submit" className="btn btn-primary btn-sm" disabled={goalSaving}>
                  {goalSaving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'Save'}
                </button>
              </div>
              {goalMsg && (
                <p className={`form-feedback ${goalMsg.type === 'success' ? 'text-success' : 'text-danger'}`}>
                  <i className={`fa-solid ${goalMsg.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i> {goalMsg.text}
                </p>
              )}
            </form>
          </div>

          {/* Change Password */}
          <div className="profile-section-card">
            <h3 className="profile-section-title">
              <i className="fa-solid fa-key"></i> Change Password
            </h3>
            <form onSubmit={handlePasswordSave} className="pw-form">
              {pwError && (
                <div className="flash-message flash-error" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> {pwError}
                </div>
              )}
              {pwMsg && (
                <div className="flash-message flash-success" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
                  <i className="fa-solid fa-circle-check"></i> {pwMsg}
                </div>
              )}

              {[
                { field: 'current_password', label: 'Current Password',  key: 'current' },
                { field: 'new_password',     label: 'New Password',      key: 'new'     },
                { field: 'confirm',          label: 'Confirm New Password', key: 'confirm' },
              ].map(({ field, label, key }) => (
                <div className="form-group" key={field}>
                  <label>{label}</label>
                  <div className="input-with-icon pw-input-wrap">
                    <i className="fa-solid fa-lock"></i>
                    <input
                      type={showPw[key] ? 'text' : 'password'}
                      required
                      value={pwForm[field]}
                      onChange={e => setPwForm(s => ({ ...s, [field]: e.target.value }))}
                      placeholder={label}
                    />
                    <button type="button" className="pw-toggle-btn" onClick={() => togglePw(key)} tabIndex={-1}>
                      <i className={`fa-solid ${showPw[key] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              ))}

              <button type="submit" className="btn btn-primary" disabled={pwSaving} style={{ marginTop: '0.5rem' }}>
                {pwSaving ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Saving…</> : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Activity Overview */}
          <div className="profile-section-card">
            <h3 className="profile-section-title">
              <i className="fa-solid fa-chart-bar"></i> Activity Overview
            </h3>
            <div className="activity-overview-grid">
              <div className="activity-overview-item">
                <div className="activity-overview-icon" style={{ background: 'rgba(225,29,72,0.1)', color: 'var(--primary)' }}>
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div>
                  <p className="activity-overview-value">{stats.reminders}</p>
                  <p className="activity-overview-label">Active Reminders</p>
                </div>
              </div>
              <div className="activity-overview-item">
                <div className="activity-overview-icon" style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--success)' }}>
                  <i className="fa-solid fa-file-medical"></i>
                </div>
                <div>
                  <p className="activity-overview-value">{stats.prescriptions}</p>
                  <p className="activity-overview-label">Prescriptions</p>
                </div>
              </div>
              <div className="activity-overview-item">
                <div className="activity-overview-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                  <i className="fa-solid fa-utensils"></i>
                </div>
                <div>
                  <p className="activity-overview-value">{stats.nutrition}</p>
                  <p className="activity-overview-label">Meals Logged</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showHealthCard && (
        <HealthCard
          username={user?.username || ''}
          stats={stats}
          calorieGoal={calorieGoal}
          totalCalories={todayCalories}
          onClose={() => setShowHealthCard(false)}
        />
      )}
    </div>
  )
}
