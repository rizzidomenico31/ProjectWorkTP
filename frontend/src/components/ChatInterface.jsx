import { useEffect, useRef } from 'react'
import { MessageBubble, TypingIndicator } from './MessageBubble.jsx'
import { InputBar } from './InputBar.jsx'
import { Menu, MessageSquare } from './Icons.jsx'
import { useChat } from '../hooks/useChat.js'
import MermaidDiagram from "./MermaidDiagram.jsx";

const SUGGESTIONS = [
  'Come posso iniziare?',
  'Spiegami questo concetto…',
  'Aiutami con il codice',
  'Riassumi questo testo',
]

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-poliba-lightblue to-poliba-blue flex items-center justify-center shadow-lg">
        <MessageSquare className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-200 mb-1">Ciao! Come posso aiutarti?</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Scrivi un messaggio per iniziare la conversazione con l&apos;assistente AI.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="text-left text-sm text-gray-400 border border-gray-700/60 rounded-xl px-4 py-3
              hover:border-poliba-lightblue/40 hover:text-gray-300 hover:bg-gray-800/40 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ChatInterface({ sessionId, onMessageSent, onMenuClick }) {
  const { messages, isLoading, sendMessage } = useChat(sessionId, onMessageSent)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-col h-full">
      {/* Slim header — logo lives in the sidebar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        {/* Hamburger (mobile) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800"
          aria-label="Apri menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title (visible on mobile, hidden on desktop where sidebar is always shown) */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">AI Assistant</span>
          <span className="text-xs text-gray-600">· Teleperformance</span>
        </div>

        {/* Status (always visible) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg) =>
                <MessageBubble key={msg.id} message={msg} />
            )}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <InputBar onSend={sendMessage} isLoading={isLoading} />
    </div>
  )
}
