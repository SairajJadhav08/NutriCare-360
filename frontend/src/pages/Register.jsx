import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/layout/AuthLayout'

// ── password strength scorer ──────────────────────────────────────────
function scorePassword(pw) {
  if (!pw) return { score: 0, label: '' }
  let score = 0
  if (pw.length >= 6)  score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][score] }
}

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)
  const { register, login }     = useAuth()
  const navigate                = useNavigate()

  const strength = useMemo(() => scorePassword(password), [password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register(username, password)
      // Sign straight in rather than making people type their details twice
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free, and it takes about a minute."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} className="stack-md">
        {error && <p className="callout callout-danger" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</p>}
        <div className="field">
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="input input-lg" required minLength={3} autoComplete="username" autoFocus
            value={username} onChange={e => setUsername(e.target.value)} />
          <p className="hint">At least 3 characters.</p>
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <div className="input-action">
            <input id="password" className="input input-lg" type={showPw ? 'text' : 'password'} required minLength={6} autoComplete="new-password"
              value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
              <i className={`fa-regular ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>
          {password ? (
            <div className="strength" data-score={strength.score}>
              <div className="strength-track">{[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= strength.score ? 'on' : ''} />)}</div>
              <span className="strength-label">{strength.label}</span>
            </div>
          ) : <p className="hint">At least 6 characters. Longer is stronger.</p>}
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? <><i className="fa-solid fa-circle-notch fa-spin" /> Creating account</> : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
