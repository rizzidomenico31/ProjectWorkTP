import { useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''

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

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N_WEBHOOK_URL non configurato. Imposta la variabile VITE_N8N_WEBHOOK_URL.')
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: text.trim(),
          sessionId: sessionId.current,
        }),
      })

      if (!response.ok) {
        throw new Error(`Errore dal server: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // n8n can return { output: "..." } or [{ output: "..." }] or { message: "..." }
      const content =
        (Array.isArray(data) ? data[0]?.output : data?.output) ||
        data?.message ||
        data?.text ||
        data?.response ||
        JSON.stringify(data)

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
