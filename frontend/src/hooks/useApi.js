import { useState, useCallback } from 'react'
import axios from 'axios'

/**
 * useApi — thin wrapper around axios with loading/error state
 * Usage:
 *   const { request, loading, error } = useApi()
 *   const data = await request('get', '/api/reminders')
 */
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || ''
      const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
      const res = await axios({ method, url: fullUrl, data, ...config })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { request, loading, error, setError }
}
