import { useEffect, useRef, useState } from 'react'
import { MessageBubble, TypingIndicator } from './MessageBubble.jsx'
import { InputBar } from './InputBar.jsx'
import { Menu, MessageSquare, Trophy, LightBulb, Network, FileText } from './Icons.jsx'
import { useChat } from '../hooks/useChat.js'

// Le capacità reali dell'assistente. `prompt` precompila la barra di input
// (l'utente completa l'argomento e invia); descrizione = cosa sa fare.
const CAPABILITIES = [
  {
    icon: Trophy,
    title: 'Genera un quiz',
    desc: 'Domande a scelta multipla per metterti alla prova',
    prompt: 'Creami un quiz su ',
  },
  {
    icon: LightBulb,
    title: 'Crea flashcard',
    desc: 'Carte domanda-risposta per memorizzare',
    prompt: 'Genera delle flashcard su ',
  },
  {
    icon: Network,
    title: 'Mappa concettuale',
    desc: 'Visualizza i concetti collegati in un diagramma',
    prompt: 'Crea una mappa concettuale su ',
  },
  {
    icon: MessageSquare,
    title: 'Spiega un concetto',
    desc: 'Spiegazioni chiare, riassunti e aiuto col codice',
    prompt: 'Spiegami ',
  },
]

function EmptyState({ onPick }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-5 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-poliba-lightblue to-poliba-blue flex items-center justify-center shadow-lg">
        <MessageSquare className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-200 mb-1.5">Ciao! Come posso aiutarti?</h2>
        <p className="text-gray-500 text-sm max-w-md">
          Sono il tuo assistente di studio: posso rispondere a domande, spiegare concetti,
          riassumere testi e aiutarti col codice. Scegli una delle opzioni qui sotto per iniziare.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
        {CAPABILITIES.map(({ icon: Icon, title, desc, prompt }) => (
          <button
            key={title}
            onClick={() => onPick(prompt)}
            className="group flex items-start gap-3 text-left border border-gray-700/60 rounded-xl px-4 py-3
              hover:border-poliba-lightblue/40 hover:bg-gray-800/40 transition-all"
          >
            <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-800/80 group-hover:bg-poliba-blue/30
              flex items-center justify-center transition-colors">
              <Icon className="w-5 h-5 text-poliba-lightblue" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-200">{title}</span>
              <span className="block text-xs text-gray-500 leading-snug">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-gray-600">
        <FileText className="w-3.5 h-3.5" />
        Suggerimento: allega un PDF con la graffetta per ottenere riassunti, quiz e mappe dai tuoi documenti.
      </p>
    </div>
  )
}

export function ChatInterface({ sessionId, onMessageSent, onMenuClick }) {
  const { messages, isLoading, sendMessage } = useChat(sessionId, onMessageSent)
  const [prefill, setPrefill] = useState(null)
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
          <EmptyState onPick={(text) => setPrefill({ text, n: Date.now() })} />
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
      <InputBar onSend={sendMessage} isLoading={isLoading} prefill={prefill} />
    </div>
  )
}
