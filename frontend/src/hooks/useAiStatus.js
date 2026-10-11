import { useEffect, useState } from 'react'
import axios from 'axios'

// Fetched once per session and shared by every AI surface
let cached = null
let inflight = null

export function useAiStatus() {
  const [status, setStatus] = useState(cached)

  useEffect(() => {
    if (cached) return
    inflight ??= axios.get('/api/ai/status')
      .then(r => (cached = r.data))
      .catch(() => (cached = { enabled: false }))
    let alive = true
    inflight.then(s => alive && setStatus(s))
    return () => { alive = false }
  }, [])

  return { enabled: !!status?.enabled, ready: !!status }
}
