import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import React from 'react'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const { register } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await register(username, password)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="auth-page">
      {/* Navbar */}
      <nav className="auth-nav">
        <Link to="/" className="logo">
          <i className="fa-solid fa-heart-pulse"></i>
          <span>NutriCare-360</span>
        </Link>
        <button onClick={toggle} className="icon-btn theme-toggle" aria-label="Toggle theme">
          <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
        </button>
      </nav>

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join NutriCare-360 to start managing your health</p>
        </div>

        {error && (
          <div className="flash-message flash-error">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <i className="fa-solid fa-user"></i>
              <input
                type="text"
                id="username"
                required
                minLength={3}
                placeholder="Choose a username (min 3 chars)"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                id="password"
                required
                minLength={6}
                placeholder="Create a password (min 6 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100" style={{ marginTop: '0.5rem' }}>
            Sign Up
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log in</Link></p>
        </div>
      </div>
    </div>
  )
}
