import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, X, Flame, Share2, Check, Shuffle, Delete, Lightbulb } from 'lucide-react'
import { getPuzzleForDay, scrambleWord } from '../data/dailyScramblePuzzles'
import { cn } from '../lib/utils'

const MAX_TRIES = 5
const STORAGE_KEY = 'pridocs_daily_scramble_v1'
const SEEN_HELP_KEY = 'pridocs_daily_scramble_seen_help'
const LAUNCH_DAY_NUMBER = getLocalDayNumber(new Date(2026, 7, 22)) // Aug 22 2026 = puzzle #1

type GameStatus = 'playing' | 'won' | 'lost'

interface Stats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
  lastWinDayNumber: number | null
  todayDayNumber: number | null
  todayTries: number
  todayStatus: GameStatus
  todayBuilt: string
}

function defaultStats(): Stats {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastWinDayNumber: null,
    todayDayNumber: null,
    todayTries: 0,
    todayStatus: 'playing',
    todayBuilt: '',
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
    /* private browsing */
  }
}

function getLocalDayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
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

interface PoolTile {
  id: number
  ch: string
  used: boolean
}

export default function DailyScramble() {
  const today = useMemo(() => new Date(), [])
  const dayNumber = useMemo(() => getLocalDayNumber(today), [today])
  const puzzleNumber = Math.max(1, dayNumber - LAUNCH_DAY_NUMBER + 1)
  const puzzle = useMemo(() => getPuzzleForDay(dayNumber), [dayNumber])
  const answer = puzzle.word.toLowerCase()
  const wordLen = answer.length

  const [stats, setStats] = useState<Stats>(defaultStats)
  const [pool, setPool] = useState<PoolTile[]>([])
  const [builtIds, setBuiltIds] = useState<number[]>([])
  const [tries, setTries] = useState(0)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [message, setMessage] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState('')

  const resetPool = useCallback(() => {
    const scrambled = scrambleWord(answer, dayNumber)
    setPool(scrambled.map((ch, i) => ({ id: i, ch, used: false })))
    setBuiltIds([])
  }, [answer, dayNumber])

  useEffect(() => {
    const loaded = loadStats()
    setStats(loaded)
    if (loaded.todayDayNumber === dayNumber) {
      setTries(loaded.todayTries)
      setStatus(loaded.todayStatus)
      if (loaded.todayStatus !== 'playing') {
        // Show the solved word in order (pool ids match answer indices).
        setPool(answer.split('').map((ch, i) => ({ id: i, ch, used: true })))
        setBuiltIds(answer.split('').map((_, i) => i))
        setShowHint(true)
      } else {
        resetPool()
        if (loaded.todayTries >= 2) setShowHint(true)
      }
    } else {
      resetPool()
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
    setTimeout(() => setMessage(''), 1800)
  }, [])

  const builtWord = useMemo(
    () => builtIds.map((id) => pool.find((t) => t.id === id)?.ch || '').join(''),
    [builtIds, pool]
  )

  const pickFromPool = (id: number) => {
    if (status !== 'playing') return
    const tile = pool.find((t) => t.id === id)
    if (!tile || tile.used) return
    if (builtIds.length >= wordLen) return
    setPool((p) => p.map((t) => (t.id === id ? { ...t, used: true } : t)))
    setBuiltIds((b) => [...b, id])
  }

  const removeFromBuilt = (index: number) => {
    if (status !== 'playing') return
    const id = builtIds[index]
    if (id === undefined) return
    setBuiltIds((b) => b.filter((_, i) => i !== index))
    setPool((p) => p.map((t) => (t.id === id ? { ...t, used: false } : t)))
  }

  const clearBuilt = () => {
    if (status !== 'playing') return
    setBuiltIds([])
    setPool((p) => p.map((t) => ({ ...t, used: false })))
  }

  const finalize = useCallback(
    (won: boolean, nextTries: number) => {
      setStats((prev) => {
        const next: Stats = { ...prev }
        next.played += 1
        if (won) {
          next.won += 1
          next.currentStreak = prev.lastWinDayNumber === dayNumber - 1 ? prev.currentStreak + 1 : 1
          next.maxStreak = Math.max(next.maxStreak, next.currentStreak)
          next.lastWinDayNumber = dayNumber
        } else {
          next.currentStreak = 0
        }
        next.todayDayNumber = dayNumber
        next.todayTries = nextTries
        next.todayStatus = won ? 'won' : 'lost'
        next.todayBuilt = answer
        saveStats(next)
        return next
      })
      setTimeout(() => setShowStats(true), won ? 900 : 600)
    },
    [dayNumber, answer]
  )

  const submit = useCallback(() => {
    if (status !== 'playing') return
    if (builtIds.length < wordLen) {
      flashMessage('Use every letter')
      return
    }
    if (builtWord === answer) {
      setStatus('won')
      finalize(true, tries + 1)
      return
    }
    const nextTries = tries + 1
    setTries(nextTries)
    if (nextTries >= 2) setShowHint(true)
    if (nextTries >= MAX_TRIES) {
      setStatus('lost')
      finalize(false, nextTries)
      flashMessage(`The word was ${answer.toUpperCase()}`)
    } else {
      flashMessage('Not quite — try again')
      setStats((prev) => {
        const next = {
          ...prev,
          todayDayNumber: dayNumber,
          todayTries: nextTries,
          todayStatus: 'playing' as GameStatus,
          todayBuilt: builtWord,
        }
        saveStats(next)
        return next
      })
      clearBuilt()
    }
  }, [status, builtIds, wordLen, builtWord, answer, tries, finalize, flashMessage, dayNumber])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (status !== 'playing') return
      if (e.key === 'Enter') {
        e.preventDefault()
        submit()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        if (builtIds.length) removeFromBuilt(builtIds.length - 1)
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        const ch = e.key.toLowerCase()
        const tile = pool.find((t) => !t.used && t.ch === ch)
        if (tile) pickFromPool(tile.id)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const shareText = useMemo(() => {
    const score = status === 'won' ? `${tries}/${MAX_TRIES}` : `X/${MAX_TRIES}`
    return [
      `Pridocs Daily Scramble #${puzzleNumber} (${puzzle.theme}) ${score}`,
      status === 'won' ? '🧩 Unscrambled!' : '🧩 Almost — see you tomorrow',
      '',
      'https://pridocs.org/tools/daily-scramble',
    ].join('\n')
  }, [puzzleNumber, puzzle.theme, status, tries])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      flashMessage('Could not copy')
    }
  }

  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Daily Scramble — Free Themed Word Scramble Game
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          A new <strong>word scramble</strong> every day with a fresh theme. Unscramble the letters, keep your streak,
          and share your result — free, private, no account.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Flame
            className={cn(
              'w-4 h-4',
              stats.currentStreak > 0 ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600'
            )}
          />
          {stats.currentStreak} day streak
        </div>
        <span className="text-xs text-slate-400">Puzzle #{puzzleNumber}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowStats(true)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Stats
          </button>
          <button type="button" onClick={() => setShowHelp(true)} aria-label="How to play">
            <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        </div>
      </div>

      <div className="mb-5 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-center">
        <p className="text-xs uppercase tracking-wide text-indigo-500 font-semibold mb-0.5">Today&apos;s theme</p>
        <p className="text-lg font-semibold text-indigo-800 dark:text-indigo-200">{puzzle.theme}</p>
        {showHint && status === 'playing' && (
          <p className="mt-2 text-sm text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1.5 justify-center">
            <Lightbulb className="w-4 h-4" />
            Hint: {puzzle.hint}
          </p>
        )}
      </div>

      {/* Answer slots */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-4 min-h-[3rem]">
        {Array.from({ length: wordLen }).map((_, i) => {
          const id = builtIds[i]
          const ch = id !== undefined ? pool.find((t) => t.id === id)?.ch : ''
          return (
            <button
              key={i}
              type="button"
              onClick={() => removeFromBuilt(i)}
              disabled={status !== 'playing' || !ch}
              className={cn(
                'w-10 h-12 sm:w-11 sm:h-14 rounded-lg border-2 text-xl font-bold uppercase flex items-center justify-center transition-colors',
                ch
                  ? 'border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  : 'border-dashed border-slate-300 dark:border-slate-600 text-transparent'
              )}
            >
              {ch || '·'}
            </button>
          )
        })}
      </div>

      {/* Scramble pool */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {pool.map((tile) => (
          <button
            key={tile.id}
            type="button"
            onClick={() => pickFromPool(tile.id)}
            disabled={status !== 'playing' || tile.used}
            className={cn(
              'w-10 h-12 sm:w-11 sm:h-14 rounded-lg text-xl font-bold uppercase transition-all',
              tile.used
                ? 'opacity-20 bg-slate-200 dark:bg-slate-700'
                : 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 hover:scale-105'
            )}
          >
            {tile.ch}
          </button>
        ))}
      </div>

      {message && (
        <div className="text-center mb-3">
          <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium">
            {message}
          </span>
        </div>
      )}

      {status === 'playing' && (
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          <button
            type="button"
            onClick={clearBuilt}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Delete className="w-4 h-4" /> Clear
          </button>
          <button
            type="button"
            onClick={resetPool}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Shuffle className="w-4 h-4" /> Reshuffle view
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
          >
            Check ({tries}/{MAX_TRIES})
          </button>
        </div>
      )}

      {status !== 'playing' && (
        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-center">
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {status === 'won' ? 'Unscrambled! 🎉' : `The word was ${answer.toUpperCase()}`}
          </p>
          <p className="text-sm text-slate-500 mb-1">
            Theme: {puzzle.theme} · {puzzle.hint}
          </p>
          <p className="text-xs text-slate-400 mb-3">Next scramble in {countdown}</p>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share result'}
          </button>
        </div>
      )}

      {/* SEO body — Bing Webmaster: avoid thin pages; target high-impression word keywords */}
      <section className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700 prose prose-slate dark:prose-invert max-w-none text-sm">
        <h2 className="text-xl font-semibold !mb-3">Free word scramble game — unscramble letters every day</h2>
        <p>
          Looking for a clean <strong>word scramble</strong> or <strong>word scrambler</strong> game online? Pridocs
          Daily Scramble is a private, ad-free <strong>word scramble solver</strong>-style puzzle: each day you get
          jumbled letters under a theme and rearrange them into a real English word. No signup, no trackers, and your
          streak stays in this browser only.
        </p>
        <p>
          People searching to <strong>unscramble words</strong>, <strong>unscramble letters</strong>, or ask{' '}
          <strong>what words can I make with these letters</strong> often land on noisy <strong>scrabble cheat</strong>{' '}
          and <strong>scrabble word finder</strong> sites. Daily Scramble is different — it is a habit-forming daily
          puzzle, not a full <strong>scrabble dictionary</strong> dump. Prefer an unlimited{' '}
          <strong>word unscrambler free</strong> tool? Use our{' '}
          <Link to="/tools/word-tools">Word Tools</Link> hub to <strong>unscramble</strong>, run a{' '}
          <strong>wordfinder</strong>, or act as a private <strong>word solver</strong> and <strong>word descrambler</strong>.
        </p>
        <h3 className="text-lg font-semibold !mt-6 !mb-2">How Daily Scramble works</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tap scrambled tiles to build the word (or type letters on a keyboard).</li>
          <li>You get {MAX_TRIES} tries; a theme hint unlocks after two misses.</li>
          <li>One puzzle per day — same answer for everyone on your calendar day.</li>
          <li>Share a text result with friends without an account wall.</li>
        </ul>
        <h3 className="text-lg font-semibold !mt-6 !mb-2">More private word games &amp; tools</h3>
        <p>
          Play <Link to="/tools/word-daily">Word Daily</Link> (five-letter guess game), open the{' '}
          <Link to="/tools/word-tools">word unscrambler</Link> to <strong>unscramble letters to make words</strong>, or
          use the <Link to="/tools/crossword-solver">Crossword Solver</Link>. Every tool is free, browser-only, and built
          for players who want a <strong>word unscramble</strong> experience without ads.
        </p>
      </section>

      {showHelp && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">How to play</h2>
              <button type="button" onClick={() => setShowHelp(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Unscramble today&apos;s letters into a real word that fits the theme. Tap tiles (or type) to fill the
              slots, then press Check. You have {MAX_TRIES} tries; a hint appears after two wrong attempts.
            </p>
            <p className="text-xs text-slate-400">
              Stats and streaks are stored only on this device. Nothing is uploaded.
            </p>
          </div>
        </div>
      )}

      {showStats && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowStats(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Statistics</h2>
              <button type="button" onClick={() => setShowStats(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center mb-5">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.played}</div>
                <div className="text-[10px] text-slate-500 uppercase">Played</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{winPct}</div>
                <div className="text-[10px] text-slate-500 uppercase">Win %</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.currentStreak}</div>
                <div className="text-[10px] text-slate-500 uppercase">Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.maxStreak}</div>
                <div className="text-[10px] text-slate-500 uppercase">Max</div>
              </div>
            </div>
            {status !== 'playing' && (
              <>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Share result'}
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">Next scramble in {countdown}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
