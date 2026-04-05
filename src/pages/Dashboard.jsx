import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import React from 'react'

export default function Dashboard() {
  const { user } = useAuth()
  const { request, loading, error } = useApi()
  const [stats, setStats] = useState({ reminders: 0, prescriptions: 0, nutrition: 0 })

  useEffect(() => {
    request('get', '/api/dashboard-stats')
      .then(data => setStats(data))
      .catch(console.error)
  }, [request])

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <div className="welcome-section">
        <h1>Welcome back, <span className="text-primary">{user?.username}</span>! 👋</h1>
        <p className="text-secondary">Here's an overview of your health status today.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner"></div></div>
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
            <p className="stat-desc">Meals tracked</p>
            <Link to="/nutrition" className="btn btn-outline btn-sm mt-3 w-100">Track Calories</Link>
          </div>

          {/* Yoga Card */}
          <div className="stat-card hover-lift">
            <div className="stat-card-header">
              <div className="stat-icon bg-info-light">
                <i className="fa-solid fa-person-praying text-info"></i>
              </div>
              <h3 className="stat-title">Yoga & Fitness</h3>
            </div>
            <div className="stat-value"><i className="fa-solid fa-fire text-warning"></i></div>
            <p className="stat-desc">Stay active and mindful</p>
            <Link to="/yoga" className="btn btn-outline btn-sm mt-3 w-100">Start Routine</Link>
          </div>
        </div>
      )}
    </div>
  )
}
