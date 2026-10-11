import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/layout/AuthLayout'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not log in. Check your details and try again.')
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see today's meals, medications and brief."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit} className="stack-md">
        {error && <p className="callout callout-danger" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</p>}
        <div className="field">
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="input input-lg" required autoComplete="username" autoFocus
            value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">Password</label>
          <div className="input-action">
            <input id="password" className="input input-lg" type={showPw ? 'text' : 'password'} required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
              <i className={`fa-regular ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? <><i className="fa-solid fa-circle-notch fa-spin" /> Logging in</> : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}
