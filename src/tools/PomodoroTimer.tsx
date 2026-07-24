import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react'

/** Short pleasant beep via Web Audio API — no external file needed */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const now = ctx.currentTime

    // Two-tone chime
    const tones = [
      { freq: 880, start: 0, dur: 0.15 },
      { freq: 1174.7, start: 0.18, dur: 0.25 },
    ]

    for (const t of tones) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = t.freq
      gain.gain.setValueAtTime(0.0001, now + t.start)
      gain.gain.exponentialRampToValueAtTime(0.25, now + t.start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + t.start)
      osc.stop(now + t.start + t.dur + 0.05)
    }

    // Close context after chime finishes
    setTimeout(() => ctx.close().catch(() => {}), 600)
  } catch {
    // Audio not available — silent fail
  }
}

export default function PomodoroTimer() {
  const [workMin, setWorkMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [soundOn, setSoundOn] = useState(true)
  const ref = useRef<number | null>(null)
  const soundOnRef = useRef(true)

  useEffect(() => {
    soundOnRef.current = soundOn
  }, [soundOn])

  useEffect(() => {
    if (!running) return
    ref.current = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (soundOnRef.current) playBeep()
          const next = mode === 'work' ? 'break' : 'work'
          setMode(next)
          return (next === 'work' ? workMin : breakMin) * 60
        }
        return s - 1
      })
    }, 1000)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [running, mode, workMin, breakMin])

  const reset = () => {
    setRunning(false)
    setMode('work')
    setSecondsLeft(workMin * 60)
  }

  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-center">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Pomodoro Timer</h1>
      <p className="text-slate-500 mb-8">Focus sessions with breaks — stays on your device.</p>

      <div className={`inline-block px-3 py-1 rounded-full text-sm mb-4 ${mode === 'work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
        {mode === 'work' ? 'Focus' : 'Break'}
      </div>

      <div className="text-6xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100 mb-8">
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </div>

      <div className="flex justify-center gap-3 mb-6">
        <button onClick={() => setRunning(r => !r)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium">
          {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
        </button>
        <button onClick={reset} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border dark:border-slate-600">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="flex justify-center gap-4 mb-8 text-sm">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={soundOn} onChange={e => setSoundOn(e.target.checked)} />
          <Volume2 className="w-4 h-4" />
          Beep when session ends
        </label>
        <button
          type="button"
          onClick={playBeep}
          className="text-indigo-600 hover:underline"
        >
          Test sound
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left">
        <div>
          <label className="text-sm text-slate-500">Work (min)</label>
          <input type="number" min={1} max={90} value={workMin} disabled={running}
            onChange={e => { const v = Number(e.target.value) || 25; setWorkMin(v); if (mode === 'work' && !running) setSecondsLeft(v * 60) }}
            className="w-full mt-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600" />
        </div>
        <div>
          <label className="text-sm text-slate-500">Break (min)</label>
          <input type="number" min={1} max={30} value={breakMin} disabled={running}
            onChange={e => setBreakMin(Number(e.target.value) || 5)}
            className="w-full mt-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600" />
        </div>
      </div>
    </div>
  )
}
