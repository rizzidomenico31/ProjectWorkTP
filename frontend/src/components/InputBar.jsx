import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, FileText, X } from './Icons.jsx'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

export function InputBar({ onSend, isLoading }) {
  const [value, setValue] = useState('')
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

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

  function handleFileChange(e) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFileError(null)
    if (selected.type !== 'application/pdf') {
      setFileError('Solo file PDF sono supportati')
      e.target.value = ''
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('Il file supera i 20 MB')
      e.target.value = ''
      return
    }
    setFile(selected)
  }

  function removeFile() {
    setFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function submit() {
    const text = value.trim()
    if ((!text && !file) || isLoading) return
    onSend(text || (file ? `[Analizza il file: ${file.name}]` : ''), file)
    setValue('')
    removeFile()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const canSend = (value.trim().length > 0 || file) && !isLoading

  return (
    <div className="border-t border-gray-800 bg-gray-950 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        {fileError && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {fileError}
          </div>
        )}

        {file && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/60 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-poliba-blue/30 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-poliba-lightblue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
              </p>
            </div>
            <button
              onClick={removeFile}
              className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-gray-700/60 flex items-center justify-center text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Rimuovi allegato"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-gray-800/60 border border-gray-700/60 rounded-2xl px-3 py-2 focus-within:border-poliba-lightblue/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !!file}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all
              text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Allega PDF"
            title="Allega un PDF"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              file
                ? 'Aggiungi una domanda sul PDF (opzionale)…'
                : 'Scrivi un messaggio o allega un PDF…'
            }
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-100 placeholder-gray-500 leading-relaxed disabled:opacity-50 min-h-[24px] py-2"
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
