import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import React from 'react'

function SkeletonStatCard() {
  return (
    <div className="stat-card hover-lift">
      <div className="stat-card-header">
        <div className="skeleton skeleton-circle-lg"></div>
        <div className="skeleton skeleton-line w-40" style={{height:'1rem'}}></div>
      </div>
      <div className="skeleton skeleton-line w-20" style={{height:'2.5rem', marginTop:'0.5rem'}}></div>
      <div className="skeleton skeleton-line w-60" style={{height:'0.8rem', marginTop:'0.5rem'}}></div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { request, loading } = useApi()
  const [stats, setStats] = useState({ reminders: 0, prescriptions: 0, nutrition: 0, yoga_streak: 0, last_active: null })

  useEffect(() => {
    request('get', '/api/dashboard-stats')
      .then(data => setStats(data))
      .catch(console.error)
  }, [request])

  const formatLastActive = (dateStr) => {
    if (!dateStr) return 'No activity yet'
    const d    = new Date(dateStr)
    const now  = new Date()
    const diff = Math.floor((now - d) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    return `${diff} days ago`
  }

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <div className="welcome-section">
        <h1>Welcome back, <span className="text-primary">{user?.username}</span>! 👋</h1>
        <p className="text-secondary">Here's an overview of your health status today.</p>
      </div>

      {loading ? (
        <div className="dashboard-grid">
          {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Reminders Card */}
          <div className="stat-card hover-lift">
            <div className="stat-card-header">
              <div className="stat-icon bg-primary-light">
                <i className="fa-solid fa-bell text-primary"></i>
              </div>
              <h3 className="stat-title">Active Reminders</h3>
            </div>
            <div className="stat-value">{stats.reminders}</div>
            <p className="stat-desc">Medications scheduled</p>
            <Link to="/reminders" className="btn btn-outline btn-sm mt-3 w-100">Manage Reminders</Link>
          </div>

          {/* Prescriptions Card */}
          <div className="stat-card hover-lift">
            <div className="stat-card-header">
              <div className="stat-icon bg-success-light">
                <i className="fa-solid fa-file-medical text-success"></i>
              </div>
              <h3 className="stat-title">Prescriptions</h3>
            </div>
            <div className="stat-value">{stats.prescriptions}</div>
            <p className="stat-desc">Documents uploaded</p>
            <Link to="/prescriptions" className="btn btn-outline btn-sm mt-3 w-100">View Prescriptions</Link>
          </div>

          {/* Nutrition Card */}
          <div className="stat-card hover-lift">
            <div className="stat-card-header">
              <div className="stat-icon bg-warning-light">
                <i className="fa-solid fa-apple-whole text-warning"></i>
              </div>
              <h3 className="stat-title">Nutrition Log</h3>
            </div>
            <div className="stat-value">{stats.nutrition}</div>
            <p className="stat-desc">Meals tracked total</p>
            <Link to="/nutrition" className="btn btn-outline btn-sm mt-3 w-100">Track Calories</Link>
          </div>

          {/* Yoga / Activity Card — now with real streak data */}
          <div className="stat-card hover-lift">
            <div className="stat-card-header">
              <div className="stat-icon bg-info-light">
                <i className="fa-solid fa-person-praying text-info"></i>
              </div>
              <h3 className="stat-title">Weekly Activity</h3>
            </div>
            <div className="stat-value" style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <span>{stats.yoga_streak}</span>
              <span style={{fontSize:'1rem', fontWeight:400, color:'var(--text-secondary)'}}>/ 7 days</span>
            </div>
            <p className="stat-desc">
              <i className="fa-solid fa-clock-rotate-left" style={{marginRight:'0.25rem', opacity:0.6}}></i>
              Last active: {formatLastActive(stats.last_active)}
            </p>
            <Link to="/yoga" className="btn btn-outline btn-sm mt-3 w-100">Start Routine</Link>
          </div>
        </div>
      )}
    </div>
  )
}
