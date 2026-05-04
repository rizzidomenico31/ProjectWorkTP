import { useEffect, useRef } from 'react'
import { MessageBubble, TypingIndicator } from './MessageBubble.jsx'
import { InputBar } from './InputBar.jsx'
import { Trash, MessageSquare } from './Icons.jsx'
import { useChat } from '../hooks/useChat.js'

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

const SUGGESTIONS = [
  'Come posso iniziare?',
  'Spiegami questo concetto…',
  'Aiutami con il codice',
  'Riassumi questo testo',
]

export function ChatInterface() {
  const { messages, isLoading, sendMessage, clearChat } = useChat()
  const bottomRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src="/poliba-logo.png"
            alt="Politecnico di Bari"
            className="h-9 w-auto object-contain bg-white rounded-md p-1"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <div className="hidden sm:block w-px h-8 bg-gray-700" />
          <div>
            <h1 className="text-sm font-semibold text-gray-100 leading-tight">AI Assistant</h1>
            <p className="text-xs text-gray-500 leading-tight">Project Work · Teleperformance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5
                rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
              aria-label="Nuova chat"
            >
              <Trash className="w-3.5 h-3.5" />
              Nuova chat
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
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
