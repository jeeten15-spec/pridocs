import { useCallback, useEffect, useMemo, useState } from 'react'
import { Delete, CornerDownLeft, HelpCircle, X, Flame, Share2, Check } from 'lucide-react'
import { WORD_DAILY_LIST } from '../data/wordDailyList'
import { cn } from '../lib/utils'

const WORD_LENGTH = 5
const MAX_GUESSES = 6
const STORAGE_KEY = 'pridocs_word_daily_v1'
const SEEN_HELP_KEY = 'pridocs_word_daily_seen_help'
const LAUNCH_DAY_NUMBER = getLocalDayNumber(new Date(2026, 6, 26)) // Jul 26 2026 = puzzle #1

type LetterStatus = 'correct' | 'present' | 'absent'
type GameStatus = 'playing' | 'won' | 'lost'

interface Stats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
  lastWinDayNumber: number | null
  lastPlayedDayNumber: number | null
  guessDistribution: number[]
  todayDayNumber: number | null
  todayGuesses: string[]
  todayStatus: GameStatus
}

function defaultStats(): Stats {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastWinDayNumber: null,
    lastPlayedDayNumber: null,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    todayDayNumber: null,
    todayGuesses: [],
    todayStatus: 'playing',
  }
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultStats()
    return { ...defaultStats(), ...JSON.parse(raw) }
  } catch {
    return defaultStats()
  }
}

function saveStats(stats: Stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch {
    // localStorage unavailable (private browsing etc.) — game still works, just won't persist.
  }
}

function getLocalDayNumber(d: Date): number {
  const utcMidnight = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor(utcMidnight / 86400000)
}

function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const result: LetterStatus[] = new Array(WORD_LENGTH).fill('absent')
  const answerLetters = answer.split('')
  const guessLetters = guess.split('')
  const used = new Array(WORD_LENGTH).fill(false)

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = 'correct'
      used[i] = true
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue
    const idx = answerLetters.findIndex((l, j) => l === guessLetters[i] && !used[j])
    if (idx !== -1) {
      result[i] = 'present'
      used[idx] = true
    }
  }
  return result
}

function msUntilNextLocalMidnight(): number {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return next.getTime() - now.getTime()
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const KEY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back'],
]

const tileColor: Record<LetterStatus, string> = {
  correct: 'bg-emerald-500 border-emerald-500 text-white',
  present: 'bg-amber-400 border-amber-400 text-white',
  absent: 'bg-slate-400 border-slate-400 text-white dark:bg-slate-600 dark:border-slate-600',
}

const keyColor: Record<LetterStatus | 'unused', string> = {
  correct: 'bg-emerald-500 text-white',
  present: 'bg-amber-400 text-white',
  absent: 'bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  unused: 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100',
}

interface WordDailyProps {
  embedded?: boolean
}

export default function WordDaily({ embedded = false }: WordDailyProps) {
  const today = useMemo(() => new Date(), [])
  const dayNumber = useMemo(() => getLocalDayNumber(today), [today])
  const puzzleNumber = Math.max(1, dayNumber - LAUNCH_DAY_NUMBER + 1)
  const answer = useMemo(
    () => WORD_DAILY_LIST[((dayNumber % WORD_DAILY_LIST.length) + WORD_DAILY_LIST.length) % WORD_DAILY_LIST.length],
    [dayNumber]
  )

  const [stats, setStats] = useState<Stats>(defaultStats)
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [status, setStatus] = useState<GameStatus>('playing')
  const [message, setMessage] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState('')

  // Load today's saved progress (if any) on mount.
  useEffect(() => {
    const loaded = loadStats()
    setStats(loaded)
    if (loaded.todayDayNumber === dayNumber) {
      setGuesses(loaded.todayGuesses)
      setStatus(loaded.todayStatus)
    }
    if (!localStorage.getItem(SEEN_HELP_KEY)) {
      setShowHelp(true)
      localStorage.setItem(SEEN_HELP_KEY, '1')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status === 'playing') return
    const tick = () => setCountdown(formatCountdown(msUntilNextLocalMidnight()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status])

  const flashMessage = useCallback((msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 1600)
  }, [])

  const finalizeGame = useCallback(
    (finalGuesses: string[], won: boolean) => {
      setStats((prev) => {
        const next: Stats = { ...prev }
        next.played += 1
        if (won) {
          next.won += 1
          next.guessDistribution = [...prev.guessDistribution]
          next.guessDistribution[finalGuesses.length - 1] += 1
          next.currentStreak = prev.lastWinDayNumber === dayNumber - 1 ? prev.currentStreak + 1 : 1
          next.maxStreak = Math.max(next.maxStreak, next.currentStreak)
          next.lastWinDayNumber = dayNumber
        } else {
          next.currentStreak = 0
        }
        next.lastPlayedDayNumber = dayNumber
        next.todayDayNumber = dayNumber
        next.todayGuesses = finalGuesses
        next.todayStatus = won ? 'won' : 'lost'
        saveStats(next)
        return next
      })
      setTimeout(() => setShowStats(true), won ? 1200 : 800)
    },
    [dayNumber]
  )

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return
    if (currentGuess.length < WORD_LENGTH) {
      flashMessage('Not enough letters')
      return
    }
    if (!WORD_DAILY_LIST.includes(currentGuess)) {
      flashMessage('Not in word list')
      return
    }
    const nextGuesses = [...guesses, currentGuess]
    setGuesses(nextGuesses)
    setCurrentGuess('')

    if (currentGuess === answer) {
      setStatus('won')
      finalizeGame(nextGuesses, true)
    } else if (nextGuesses.length >= MAX_GUESSES) {
      setStatus('lost')
      finalizeGame(nextGuesses, false)
    } else {
      // Persist in-progress state so a refresh mid-game doesn't lose it.
      setStats((prev) => {
        const next = { ...prev, todayDayNumber: dayNumber, todayGuesses: nextGuesses, todayStatus: 'playing' as GameStatus }
        saveStats(next)
        return next
      })
    }
  }, [status, currentGuess, guesses, answer, dayNumber, finalizeGame, flashMessage])

  const handleKey = useCallback(
    (key: string) => {
      if (status !== 'playing') return
      if (key === 'enter') {
        submitGuess()
      } else if (key === 'back') {
        setCurrentGuess((g) => g.slice(0, -1))
      } else if (/^[a-z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((g) => g + key)
      }
    },
    [status, currentGuess, submitGuess]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (e.key === 'Enter') handleKey('enter')
      else if (e.key === 'Backspace') handleKey('back')
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toLowerCase())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  const keyStatuses = useMemo(() => {
    const map: Record<string, LetterStatus> = {}
    const priority: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 }
    for (const g of guesses) {
      const statuses = evaluateGuess(g, answer)
      g.split('').forEach((ch, i) => {
        const s = statuses[i]
        if (!map[ch] || priority[s] > priority[map[ch]]) map[ch] = s
      })
    }
    return map
  }, [guesses, answer])

  const shareText = useMemo(() => {
    const lines = guesses.map((g) =>
      evaluateGuess(g, answer)
        .map((s) => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛'))
        .join('')
    )
    const header = `Pridocs Word Daily #${puzzleNumber} ${status === 'won' ? guesses.length : 'X'}/${MAX_GUESSES}`
    return [header, '', ...lines, '', 'https://pridocs.org/tools/word-daily'].join('\n')
  }, [guesses, answer, puzzleNumber, status])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      flashMessage('Could not copy — select the text manually')
    }
  }

  const rows: Array<{ letters: string; statuses: (LetterStatus | null)[] }> = []
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      rows.push({ letters: guesses[i], statuses: evaluateGuess(guesses[i], answer) })
    } else if (i === guesses.length) {
      rows.push({ letters: currentGuess, statuses: new Array(WORD_LENGTH).fill(null) })
    } else {
      rows.push({ letters: '', statuses: new Array(WORD_LENGTH).fill(null) })
    }
  }

  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0

  return (
    <div className={embedded ? '' : 'max-w-md mx-auto px-4 py-8'}>
      {!embedded && (
        <div className="text-center mb-4">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Word Daily</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">A new 5-letter word every day. Free, private, no account — your streak lives only in this browser.</p>
          <p className="mt-2 text-xs text-slate-400">
            Come back tomorrow for a new daily word puzzle. Tip: pin this tab in your browser or bookmark pridocs.org
            so Word Daily is always one click away.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Flame className={cn('w-4 h-4', stats.currentStreak > 0 ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600')} />
          {stats.currentStreak} day streak
        </div>
        <span className="text-xs text-slate-400">Puzzle #{puzzleNumber}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowStats(true)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Stats
          </button>
          <button onClick={() => setShowHelp(true)} aria-label="How to play">
            <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="grid gap-1.5 mb-5">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: WORD_LENGTH }).map((_, ci) => {
              const letter = row.letters[ci] || ''
              const s = row.statuses[ci]
              return (
                <div
                  key={ci}
                  className={cn(
                    'aspect-square flex items-center justify-center text-2xl font-bold uppercase rounded-md border-2 transition-colors',
                    s ? tileColor[s] : letter ? 'border-slate-400 dark:border-slate-500 text-slate-900 dark:text-slate-100' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                  )}
                >
                  {letter}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {message && (
        <div className="text-center mb-3">
          <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium">{message}</span>
        </div>
      )}

      {status !== 'playing' && (
        <div className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-center">
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {status === 'won' ? 'Nice one! 🎉' : `The word was ${answer.toUpperCase()}`}
          </p>
          <p className="text-xs text-slate-500 mb-3">Next puzzle in {countdown}</p>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share result'}
          </button>
        </div>
      )}

      {/* Keyboard */}
      <div className="space-y-1.5">
        {KEY_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1.5">
            {row.map((key) => {
              const isSpecial = key === 'enter' || key === 'back'
              const s = !isSpecial ? keyStatuses[key] : undefined
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  disabled={status !== 'playing'}
                  className={cn(
                    'h-11 rounded-md text-xs font-semibold uppercase flex items-center justify-center transition-colors disabled:opacity-50',
                    isSpecial ? 'px-3' : 'w-8',
                    s ? keyColor[s] : keyColor.unused
                  )}
                >
                  {key === 'back' ? <Delete className="w-4 h-4" /> : key === 'enter' ? <CornerDownLeft className="w-4 h-4" /> : key}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">How to play</h2>
              <button onClick={() => setShowHelp(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Guess the 5-letter word in 6 tries. After each guess, tile colors show how close you were.</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-emerald-500" /> Letter is correct and in the right spot</div>
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-amber-400" /> Letter is in the word, wrong spot</div>
              <div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-slate-400" /> Letter isn't in the word</div>
            </div>
            <p className="text-xs text-slate-400 mt-4">One new word every day. Your streak and stats are stored only in this browser — nothing is sent anywhere.</p>
          </div>
        </div>
      )}

      {/* Stats modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowStats(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Statistics</h2>
              <button onClick={() => setShowStats(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center mb-5">
              <div><div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.played}</div><div className="text-[10px] text-slate-500 uppercase">Played</div></div>
              <div><div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{winPct}</div><div className="text-[10px] text-slate-500 uppercase">Win %</div></div>
              <div><div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.currentStreak}</div><div className="text-[10px] text-slate-500 uppercase">Streak</div></div>
              <div><div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.maxStreak}</div><div className="text-[10px] text-slate-500 uppercase">Max streak</div></div>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-2">Guess distribution</p>
            <div className="space-y-1">
              {stats.guessDistribution.map((count, i) => {
                const max = Math.max(...stats.guessDistribution, 1)
                const isCurrentRow = status === 'won' && guesses.length === i + 1
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2 text-slate-500">{i + 1}</span>
                    <div className={cn('h-5 rounded flex items-center justify-end px-1.5 text-white font-medium', isCurrentRow ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600')} style={{ width: `${Math.max((count / max) * 100, count > 0 ? 8 : 4)}%` }}>
                      {count > 0 && count}
                    </div>
                  </div>
                )
              })}
            </div>
            {status !== 'playing' && (
              <button
                onClick={handleShare}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Share result'}
              </button>
            )}
            {status !== 'playing' && <p className="text-center text-xs text-slate-400 mt-3">Next puzzle in {countdown}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
