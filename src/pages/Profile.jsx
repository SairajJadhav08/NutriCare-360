import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { useEffect, useState } from 'react'
import React from 'react'

export default function Profile() {
  const { user, logout } = useAuth()
  const { request } = useApi()
  const [stats, setStats] = useState({ reminders: 0, prescriptions: 0, nutrition: 0 })

  useEffect(() => {
    request('get', '/api/dashboard-stats')
      .then(data => setStats(data))
      .catch(() => {})
  }, [request])

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h1 className="page-title">Profile</h1>
        <p className="text-secondary">Manage your account settings.</p>
      </div>

      <div className="profile-layout">
        {/* Left — user card */}
        <div className="profile-user-card">
          <div className="profile-avatar-lg">
            {user?.username?.[0]?.toUpperCase()}
          </div>
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
            <span className="profile-detail-label">Role</span>
            <span className="profile-detail-value">Member</span>
          </div>

          <button className="btn btn-danger w-100" onClick={logout} style={{ marginTop: '1.5rem' }}>
            <i className="fa-solid fa-right-from-bracket"></i> Log Out
          </button>
        </div>

        {/* Right — security & settings */}
        <div className="profile-right">
          <div className="profile-section-card">
            <h3 className="profile-section-title">
              <i className="fa-solid fa-shield-halved"></i> Account Security
            </h3>
            <p className="text-secondary" style={{ marginBottom: '1rem' }}>
              To update your password or email, please contact support.
            </p>
            <div className="security-status-card">
              <div className="security-status-icon">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <p className="security-status-title">Security Status: Good</p>
                <p className="text-secondary text-sm">Your account is secured with standard encryption.</p>
              </div>
            </div>
          </div>

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
    </div>
  )
}
