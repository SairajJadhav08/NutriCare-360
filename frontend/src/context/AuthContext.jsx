import { createContext, useContext, useState, useEffect, useRef } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// ── Restore session synchronously ────────────────────────────────────
function initUser() {
  const token        = localStorage.getItem('nc_token')
  const refreshToken = localStorage.getItem('nc_refresh')
  const username     = localStorage.getItem('nc_user')
  if (token && username) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      // Reject old dict-identity tokens
      if (typeof payload.sub === 'object' || (typeof payload.sub === 'string' && payload.sub.startsWith('{'))) {
        localStorage.clear()
        return null
      }
    } catch {
      localStorage.clear()
      return null
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    return { username, token, refreshToken }
  }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(initUser)
  const loading               = false
  const interceptorRef        = useRef(null)

  function _clearSession() {
    localStorage.removeItem('nc_token')
    localStorage.removeItem('nc_refresh')
    localStorage.removeItem('nc_user')
    delete axios.defaults.headers.common['Authorization']
  }

  // ── axios response interceptor — silent token refresh on 401 ─────
  useEffect(() => {
    interceptorRef.current = axios.interceptors.response.use(
      res => res,
      async (err) => {
        const original = err.config
        // Only retry once; skip if it's the login/register/refresh endpoint itself
        if (
          err.response?.status === 401 &&
          !original._retry &&
          !original.url?.includes('/api/login') &&
          !original.url?.includes('/api/register') &&
          !original.url?.includes('/api/refresh')
        ) {
          original._retry = true
          const storedRefresh = localStorage.getItem('nc_refresh')
          if (storedRefresh) {
            try {
              const res = await axios.post('/api/refresh', {}, {
                headers: { Authorization: `Bearer ${storedRefresh}` }
              })
              const newToken = res.data.access_token
              localStorage.setItem('nc_token', newToken)
              axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
              original.headers['Authorization'] = `Bearer ${newToken}`
              setUser(prev => prev ? { ...prev, token: newToken } : null)
              return axios(original)
            } catch {
              // Refresh failed — log user out
              _clearSession()
              setUser(null)
            }
          } else {
            _clearSession()
            setUser(null)
          }
        }
        return Promise.reject(err)
      }
    )
    return () => {
      if (interceptorRef.current !== null) {
        axios.interceptors.response.eject(interceptorRef.current)
      }
    }
  }, [])

  const login = async (username, password) => {
    const res = await axios.post('/api/login', { username, password })
    const { access_token, refresh_token } = res.data
    localStorage.setItem('nc_token',   access_token)
    localStorage.setItem('nc_refresh', refresh_token)
    localStorage.setItem('nc_user',    res.data.username)
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setUser({ username: res.data.username, token: access_token, refreshToken: refresh_token })
    return res.data
  }

  const logout = () => {
    _clearSession()
    setUser(null)
  }

  const register = async (username, password) => {
    const res = await axios.post('/api/register', { username, password })
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
