import { AlertCircle, Bot, User, FileText } from './Icons.jsx'

function formatContent(text) {
  // Split on code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const lines = part.slice(3, -3).split('\n')
      const lang = lines[0]?.trim() || ''
      const code = lines.slice(lang ? 1 : 0).join('\n')
      return (
        <pre key={i} className="bg-black/40 rounded-lg p-3 overflow-x-auto my-2 text-sm">
          {lang && <span className="text-gray-500 text-xs block mb-1">{lang}</span>}
          <code>{code}</code>
        </pre>
      )
    }
    // Inline formatting
    return (
      <span key={i}>
        {part.split('\n').map((line, j) => (
          <span key={j}>
            {line.split(/(`[^`]+`)/g).map((chunk, k) =>
              chunk.startsWith('`') && chunk.endsWith('`') ? (
                <code key={k} className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono">
                  {chunk.slice(1, -1)}
                </code>
              ) : (
                chunk
              )
            )}
            {j < part.split('\n').length - 1 && <br />}
          </span>
        ))}
      </span>
    )
  })
}

export function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  const time = message.timestamp.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isError) {
    return (
      <div className="flex items-start gap-3 animate-slide-up">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-red-400 text-sm">{message.content}</p>
          </div>
          <p className="text-gray-600 text-xs mt-1 ml-1">{time}</p>
        </div>
      </div>
    )
  }

  if (isUser) {
    return (
      <div className="flex items-start gap-3 flex-row-reverse animate-slide-up">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-poliba-blue flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col items-end">
          <div className="bg-poliba-blue rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
            {message.attachment && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-white/10">
                <FileText className="w-4 h-4 text-white/90 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-white/95 truncate">{message.attachment.name}</p>
                  <p className="text-[10px] text-white/60">
                    {(message.attachment.size / 1024 / 1024).toFixed(2)} MB · PDF
                  </p>
                </div>
              </div>
            )}
            {message.content && (
              <div className="message-content text-sm text-white leading-relaxed">
                {formatContent(message.content)}
              </div>
            )}
          </div>
          <p className="text-gray-600 text-xs mt-1 mr-1">{time}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 animate-slide-up">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-poliba-lightblue to-poliba-blue flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
          <div className="message-content text-sm text-gray-100 leading-relaxed">
            {formatContent(message.content)}
          </div>
        </div>
        <p className="text-gray-600 text-xs mt-1 ml-1">{time}</p>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-poliba-lightblue to-poliba-blue flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1 h-5">
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full block" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full block" />
          <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full block" />
        </div>
      </div>
    </div>
  )
}
