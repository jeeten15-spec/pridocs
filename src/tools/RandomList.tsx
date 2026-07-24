import { useState } from 'react'
import { Shuffle } from 'lucide-react'

export default function RandomList() {
  const [input, setInput] = useState('Alice\nBob\nCarol\nDave\nEve')
  const [count, setCount] = useState(1)
  const [result, setResult] = useState<string[]>([])

  const items = input.split(/\n/).map(s => s.trim()).filter(Boolean)

  const pick = () => {
    const pool = [...items]
    const out: string[] = []
    const n = Math.min(count, pool.length)
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      out.push(pool.splice(idx, 1)[0])
    }
    setResult(out)
  }

  const shuffle = () => {
    const pool = [...items]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setResult(pool)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Random List Generator</h1>
        <p className="text-slate-500">Shuffle or pick random items — no data leaves your browser.</p>
      </div>

      <label className="block text-sm font-medium mb-1">Items (one per line)</label>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={8}
        className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600" />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm">Pick
          <input type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value) || 1)}
            className="ml-2 w-16 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600" />
        </label>
        <button onClick={pick} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">Pick random</button>
        <button onClick={shuffle} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border dark:border-slate-600 text-sm">
          <Shuffle className="w-4 h-4" /> Shuffle all
        </button>
      </div>

      {result.length > 0 && (
        <ol className="mt-6 space-y-2 list-decimal list-inside">
          {result.map((r, i) => (
            <li key={i} className="p-3 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700">{r}</li>
          ))}
        </ol>
      )}
    </div>
  )
}
