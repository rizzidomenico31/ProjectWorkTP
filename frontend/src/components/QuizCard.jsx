import { useState } from 'react'
import { Trophy, RotateCcw, CheckCircle, XCircle, LightBulb, ChevronRight } from './Icons.jsx'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

function scoreMessage(pct) {
  if (pct === 100) return 'Perfetto! Hai risposto correttamente a tutto.'
  if (pct >= 80) return 'Ottimo! Quasi tutto corretto.'
  if (pct >= 60) return 'Buono! Qualcosa da ripassare.'
  if (pct >= 40) return 'Sufficiente. Ti conviene rivedere l\'argomento.'
  return 'È necessario ripassare. Non mollare!'
}

function ScoreScreen({ score, total, title, onRestart }) {
  const pct = Math.round((score / total) * 100)
  const color = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-poliba-gold' : 'text-red-400'
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-poliba-gold' : 'bg-red-500'

  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4">
      <div className="w-20 h-20 rounded-full bg-poliba-gold/15 flex items-center justify-center">
        <Trophy className="w-10 h-10 text-poliba-gold" />
      </div>

      <div className="text-center">
        <p className="text-gray-400 text-sm mb-1">{title}</p>
        <p className={`text-5xl font-bold ${color}`}>{score}<span className="text-2xl text-gray-500">/{total}</span></p>
        <p className="text-gray-300 text-sm mt-2">{scoreMessage(pct)}</p>
      </div>

      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Punteggio</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <button
        onClick={onRestart}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Ricomincia
      </button>
    </div>
  )
}

export function QuizCard({ content }) {
  const quiz = (() => {
    try {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content
      // content può essere l'array direttamente o { title, questions }
      if (Array.isArray(parsed)) return { title: 'Quiz', questions: parsed }
      return parsed
    } catch {
      return null
    }
  })()

  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)

  if (!quiz?.questions?.length) return null

  const { title, questions } = quiz

  if (done) {
    const score = questions.filter((q, i) => answers[i] === q.correctIndex).length
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-700/60">
        <div className="bg-gradient-to-r from-poliba-blue to-poliba-lightblue px-4 py-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-poliba-gold flex-shrink-0" />
          <span className="text-white font-semibold text-sm truncate">{title}</span>
        </div>
        <div className="bg-gray-900/60">
          <ScoreScreen
            score={score}
            total={questions.length}
            title={title}
            onRestart={() => { setCurrent(0); setAnswers({}); setDone(false) }}
          />
        </div>
      </div>
    )
  }

  const q = questions[current]
  const answered = answers[current] !== undefined
  const selected = answers[current]
  const isLast = current === questions.length - 1
  const progressPct = Math.round((current / questions.length) * 100)

  const handleSelect = (optIdx) => {
    if (answered) return
    setAnswers(prev => ({ ...prev, [current]: optIdx }))
  }

  const handleNext = () => {
    if (isLast) setDone(true)
    else setCurrent(c => c + 1)
  }

  const getOptionStyle = (optIdx) => {
    if (!answered) {
      return 'bg-gray-800/70 border-gray-600/50 text-gray-200 hover:border-poliba-lightblue hover:bg-poliba-lightblue/10 cursor-pointer'
    }
    if (optIdx === q.correctIndex) {
      return 'bg-green-500/15 border-green-500/60 text-green-300 cursor-default'
    }
    if (optIdx === selected) {
      return 'bg-red-500/15 border-red-500/60 text-red-300 cursor-default'
    }
    return 'bg-gray-800/40 border-gray-700/30 text-gray-500 cursor-default'
  }

  const getLetterStyle = (optIdx) => {
    if (!answered) return 'bg-gray-700 text-gray-300'
    if (optIdx === q.correctIndex) return 'bg-green-500/30 text-green-300'
    if (optIdx === selected) return 'bg-red-500/30 text-red-300'
    return 'bg-gray-700/50 text-gray-600'
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-700/60 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-poliba-blue to-poliba-lightblue px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy className="w-4 h-4 text-poliba-gold flex-shrink-0" />
          <span className="text-white font-semibold text-sm truncate">{title}</span>
        </div>
        <span className="text-white/60 text-xs flex-shrink-0">{questions.length} domande</span>
      </div>

      {/* Progress */}
      <div className="bg-gray-900/80 px-4 pt-3 pb-2">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5">
          <span>Domanda {current + 1} di {questions.length}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-poliba-lightblue to-poliba-gold rounded-full transition-all duration-500"
            style={{ width: `${progressPct === 0 ? 4 : progressPct}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-900/80 px-4 pb-3 pt-2">
        <p className="text-gray-100 text-sm font-medium leading-relaxed">{q.text}</p>
      </div>

      {/* Options */}
      <div className="bg-gray-900/60 px-4 pb-3 flex flex-col gap-2">
        {q.options.map((opt, optIdx) => (
          <button
            key={optIdx}
            onClick={() => handleSelect(optIdx)}
            disabled={answered}
            aria-pressed={selected === optIdx}
            aria-label={`Opzione ${LETTERS[optIdx]}: ${opt}`}
            className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-200 text-sm ${getOptionStyle(optIdx)}`}
          >
            <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${getLetterStyle(optIdx)}`}>
              {LETTERS[optIdx]}
            </span>
            <span className="flex-1 leading-snug">{opt}</span>
            {answered && optIdx === q.correctIndex && (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" aria-hidden="true" />
            )}
            {answered && optIdx === selected && optIdx !== q.correctIndex && (
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      {/* Explanation + Next */}
      {answered && (
        <div className="bg-gray-900/60 px-4 pb-4 flex flex-col gap-3 animate-fade-in">
          {q.explanation && (
            <div className="flex items-start gap-2 bg-poliba-blue/15 border border-poliba-lightblue/20 rounded-xl px-3 py-2.5">
              <LightBulb className="w-4 h-4 text-poliba-gold flex-shrink-0 mt-0.5" />
              <p className="text-gray-300 text-xs leading-relaxed">{q.explanation}</p>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-poliba-blue hover:bg-poliba-lightblue text-white text-sm font-medium transition-colors"
            >
              {isLast ? 'Vedi risultato' : 'Prossima'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
