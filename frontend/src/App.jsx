import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ChatInterface } from './components/ChatInterface.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { useSessions } from './hooks/useSessions.js'

function getInitialSessionId() {
  let id = sessionStorage.getItem('chat_session_id')
  if (!id) {
    id = uuidv4()
    sessionStorage.setItem('chat_session_id', id)
  }
  return id
}

export default function App() {
  const [currentSessionId, setCurrentSessionId] = useState(getInitialSessionId)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { sessions, loadSessions, deleteSession } = useSessions()

  const handleNewChat = useCallback(() => {
    const id = uuidv4()
    sessionStorage.setItem('chat_session_id', id)
    setCurrentSessionId(id)
    setSidebarOpen(false)
  }, [])

  const handleSelectSession = useCallback((sessionId) => {
    sessionStorage.setItem('chat_session_id', sessionId)
    setCurrentSessionId(sessionId)
    setSidebarOpen(false)
  }, [])

  const handleDeleteSession = useCallback(
    async (sessionId) => {
      await deleteSession(sessionId)
      if (sessionId === currentSessionId) handleNewChat()
    },
    [deleteSession, currentSessionId, handleNewChat],
  )

  return (
    <div className="h-screen flex overflow-hidden bg-gray-950">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <ChatInterface
          sessionId={currentSessionId}
          onMessageSent={loadSessions}
          onMenuClick={() => setSidebarOpen(true)}
        />
      </main>
    </div>
  )
}
