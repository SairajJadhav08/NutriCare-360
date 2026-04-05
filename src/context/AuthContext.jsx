import { createContext, useContext, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Restore session synchronously so axios header is set before any component mounts
function initUser() {
  const token    = localStorage.getItem('nc_token')
  const username = localStorage.getItem('nc_user')
  if (token && username) {
    // Validate token is the new string-identity format (not old dict-identity)
    // Old tokens had a sub claim like '{"id":1,"username":"..."}' — detect and clear them
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (typeof payload.sub === 'object' || (typeof payload.sub === 'string' && payload.sub.startsWith('{'))) {
        // Old dict-identity token — clear it so user re-logs in
        localStorage.removeItem('nc_token')
        localStorage.removeItem('nc_user')
        return null
      }
    } catch {
      localStorage.removeItem('nc_token')
      localStorage.removeItem('nc_user')
      return null
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    return { username, token }
  }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(initUser)
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    const res = await axios.post('/api/login', { username, password })
    const { access_token } = res.data
    localStorage.setItem('nc_token', access_token)
    localStorage.setItem('nc_user', res.data.username)
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setUser({ username: res.data.username, token: access_token })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('nc_token')
    localStorage.removeItem('nc_user')
    delete axios.defaults.headers.common['Authorization']
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
