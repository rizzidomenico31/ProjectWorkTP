import { useState } from 'react'
import { Plus, Trash, MessageSquare, X, Clock } from './Icons.jsx'

function formatRelativeDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 6)

  if (date >= startOfToday) return 'Oggi'
  if (date >= startOfYesterday) return 'Ieri'
  if (date >= startOfWeek) return 'Ultimi 7 giorni'
  return 'Più vecchi'
}

function groupSessions(sessions) {
  const order = ['Oggi', 'Ieri', 'Ultimi 7 giorni', 'Più vecchi']
  const map = {}
  for (const s of sessions) {
    const label = formatRelativeDate(s.updatedAt)
    if (!map[label]) map[label] = []
    map[label].push(s)
  }
  return order.filter((l) => map[l]).map((l) => ({ label: l, items: map[l] }))
}

function SessionItem({ session, isActive, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all mb-0.5
        ${isActive
          ? 'bg-poliba-blue/30 border border-poliba-lightblue/30 text-gray-100'
          : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
        }`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-poliba-lightblue' : 'text-gray-600 group-hover:text-gray-400'}`} />
      <span className="flex-1 text-sm truncate leading-tight">{session.title}</span>
      {(hovered || isActive) && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="flex-shrink-0 p-0.5 text-gray-600 hover:text-red-400 transition-colors rounded"
          title="Elimina conversazione"
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function Sidebar({ sessions, currentSessionId, onNewChat, onSelectSession, onDeleteSession, isOpen, onClose }) {
  const grouped = groupSessions(sessions)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col
          bg-gray-900 border-r border-gray-800/80
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo section */}
        <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-gray-800/80">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-white rounded-lg p-2 shadow-md">
              <img
                src="/poliba-logo.png"
                alt="Politecnico di Bari"
                className="h-10 w-auto object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-100 leading-tight">AI Assistant</h1>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">Project Work · Teleperformance</p>
          </div>
          {/* Online indicator */}
          <div className="flex items-center gap-1.5 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>

        {/* New Chat button */}
        <div className="flex-shrink-0 p-3">
          <button
            onClick={() => { onNewChat(); onClose?.() }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-poliba-blue hover:bg-poliba-lightblue text-white text-sm font-medium
              transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuova chat
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
              <Clock className="w-7 h-7 text-gray-700" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Le conversazioni appariranno qui dopo il primo messaggio.
              </p>
            </div>
          ) : (
            grouped.map(({ label, items }) => (
              <div key={label} className="mb-2">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider px-3 py-2 select-none">
                  {label}
                </p>
                {items.map((session) => (
                  <SessionItem
                    key={session.sessionId}
                    session={session}
                    isActive={session.sessionId === currentSessionId}
                    onSelect={() => { onSelectSession(session.sessionId); onClose?.() }}
                    onDelete={() => onDeleteSession(session.sessionId)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
