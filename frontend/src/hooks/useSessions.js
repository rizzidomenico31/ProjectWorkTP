import { useState, useCallback, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || ''

export function useSessions() {
  const [sessions, setSessions] = useState([])

  const loadSessions = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/sessions`)
      const data = await r.json()
      setSessions(data.sessions || [])
    } catch {
      // Backend might not support sessions yet
    }
  }, [])

  const deleteSession = useCallback(async (sessionId) => {
    try {
      await fetch(`${API_BASE}/api/sessions/${sessionId}`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
    } catch {
      // Ignore
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return { sessions, loadSessions, deleteSession }
}
