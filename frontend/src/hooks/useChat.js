import { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

// Backend base URL (es. https://my-backend.up.railway.app). Vuoto = same origin.
const API_BASE = import.meta.env.VITE_API_URL || ''
const CHAT_ENDPOINT = `${API_BASE}/api/chat`

function getSessionId() {
  let sessionId = sessionStorage.getItem('chat_session_id')
  if (!sessionId) {
    sessionId = uuidv4()
    sessionStorage.setItem('chat_session_id', sessionId)
  }
  return sessionId
}

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const sessionId = useRef(getSessionId())

  const sendMessage = useCallback(async (text, file = null) => {
    if ((!text?.trim() && !file) || isLoading) return

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      attachment: file ? { name: file.name, size: file.size, type: 'pdf' } : null,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('chatInput', text.trim())
      formData.append('sessionId', sessionId.current)
      if (file) formData.append('pdf', file, file.name)

      const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || `Errore dal server: ${response.status}`)
      }

      console.log('Response data:', JSON.stringify(data))

      const content =
        data?.output ||
        data?.message ||
        data?.text ||
        (typeof data?.raw === 'string' ? data.raw : '') ||
        'Nessuna risposta dall\'orchestratore.'

      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err.message)
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: 'error',
          content: err.message,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    sessionId.current = uuidv4()
    sessionStorage.setItem('chat_session_id', sessionId.current)
  }, [])

  return { messages, isLoading, error, sendMessage, clearChat }
}
