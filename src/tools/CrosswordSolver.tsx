import { useEffect, useMemo, useState } from 'react'
import { loadDictionary } from '../lib/dictionary'

export default function CrosswordSolver() {
  const [pattern, setPattern] = useState('c?t')
  const [known, setKnown] = useState('')
  const [words, setWords] = useState<string[]>([])
  const [dictLabel, setDictLabel] = useState('Loading…')

  useEffect(() => {
    loadDictionary().then(list => {
      setWords(list)
      setDictLabel(
        list.length > 20000
          ? `Dictionary · ${list.length.toLocaleString()} words`
          : `Common list · ${list.length.toLocaleString()} words`
      )
    })
  }, [])

  const results = useMemo(() => {
    const p = pattern.toLowerCase().replace(/[^a-z.?]/g, '')
    if (!p || words.length === 0) return []
    const re = new RegExp('^' + p.replace(/\?/g, '.') + '$')
    const must = known.toLowerCase().replace(/[^a-z]/g, '').split('').filter(Boolean)
    return words.filter(w => {
      if (!re.test(w)) return false
      return must.every(ch => w.includes(ch))
    }).slice(0, 200)
  }, [pattern, known, words])

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Crossword Solver</h1>
        <p className="text-slate-500">Match patterns with ? for unknown letters. Runs on your device.</p>
        <p className="text-xs text-slate-400 mt-2">{dictLabel}</p>
      </div>

      <label className="block text-sm font-medium mb-1">Pattern (use ? for blanks)</label>
      <input value={pattern} onChange={e => setPattern(e.target.value)}
        placeholder="e.g. c?t or ?a??e"
        className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600 mb-4 font-mono" />

      <label className="block text-sm font-medium mb-1">Must include letters (optional)</label>
      <input value={known} onChange={e => setKnown(e.target.value)}
        placeholder="e.g. ae"
        className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600" />

      <p className="mt-4 text-sm text-slate-500">{results.length} matches</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {results.map(w => (
          <span key={w} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border text-sm font-mono">{w}</span>
        ))}
      </div>
    </div>
  )
}
