import { useState, useRef, useEffect } from 'react'
import { Send } from './Icons.jsx'

export function InputBar({ onSend, isLoading }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isLoading])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  function handleChange(e) {
    setValue(e.target.value)
    autoResize()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const text = value.trim()
    if (!text || isLoading) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const canSend = value.trim().length > 0 && !isLoading

  return (
    <div className="border-t border-gray-800 bg-gray-950 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-3 bg-gray-800/60 border border-gray-700/60 rounded-2xl px-4 py-3 focus-within:border-poliba-lightblue/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio… (Invio per inviare, Shift+Invio per andare a capo)"
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-100 placeholder-gray-500 leading-relaxed disabled:opacity-50 min-h-[24px]"
          />
          <button
            onClick={submit}
            disabled={!canSend}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
              bg-poliba-blue hover:bg-poliba-lightblue disabled:opacity-30 disabled:cursor-not-allowed
              active:scale-95"
            aria-label="Invia messaggio"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-center text-gray-600 text-xs mt-2">
          L&apos;AI può commettere errori. Verifica sempre le informazioni importanti.
        </p>
      </div>
    </div>
  )
}
