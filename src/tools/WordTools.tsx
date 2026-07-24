import { useEffect, useMemo, useState } from 'react'
import { loadDictionary } from '../lib/dictionary'

type Tab = 'unscramble' | 'starts' | 'anagram' | 'rhyme'

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

function sortLetters(s: string) {
  return normalize(s).split('').sort().join('')
}

/** Letter multiset counts */
function counts(s: string): Record<string, number> {
  const c: Record<string, number> = {}
  for (const ch of normalize(s)) c[ch] = (c[ch] || 0) + 1
  return c
}

/** Can `word` be formed using only letters from `pool` (each letter at most as often)? */
function canForm(word: string, pool: Record<string, number>): boolean {
  const need = counts(word)
  for (const ch of Object.keys(need)) {
    if ((pool[ch] || 0) < need[ch]) return false
  }
  return true
}

export default function WordTools() {
  const [tab, setTab] = useState<Tab>('unscramble')
  const [query, setQuery] = useState('')
  const [words, setWords] = useState<string[]>([])
  const [dictLabel, setDictLabel] = useState('Loading dictionary…')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    setBusy(true)
    loadDictionary().then(list => {
      setWords(list)
      setDictLabel(
        list.length > 20000
          ? `Dictionary loaded · ${list.length.toLocaleString()} words`
          : `Common-word list · ${list.length.toLocaleString()} words (deploy public/dictionary.txt for the full dictionary)`
      )
      setBusy(false)
    })
  }, [])

  type Result = { word: string; tag?: string }

  const results = useMemo((): Result[] => {
    const q = normalize(query)
    if (!q || words.length === 0) return []

    if (tab === 'unscramble') {
      const key = sortLetters(q)
      return words
        .filter(w => sortLetters(w) === key)
        .slice(0, 200)
        .map(word => ({ word }))
    }

    if (tab === 'anagram') {
      const key = sortLetters(q)
      const pool = counts(q)
      const exact: string[] = []
      const partial: string[] = []
      for (const w of words) {
        if (w.length > q.length) continue
        if (sortLetters(w) === key) {
          if (w !== q) exact.push(w)
        } else if (w.length >= 3 && canForm(w, pool)) {
          partial.push(w)
        }
      }
      partial.sort((a, b) => b.length - a.length || a.localeCompare(b))
      const out: Result[] = [
        ...exact.map(word => ({ word, tag: 'exact' })),
        ...partial.slice(0, 150).map(word => ({ word, tag: 'from letters' })),
      ]
      return out.slice(0, 200)
    }

    if (tab === 'starts') {
      return words.filter(w => w.startsWith(q)).slice(0, 200).map(word => ({ word }))
    }

    if (tab === 'rhyme') {
      const end3 = q.length >= 3 ? q.slice(-3) : ''
      const end2 = q.length >= 2 ? q.slice(-2) : q
      const primary = words.filter(w => w !== q && end3 && w.endsWith(end3))
      const secondary = words.filter(w => w !== q && w.endsWith(end2) && !primary.includes(w))
      return [...primary, ...secondary].slice(0, 200).map(word => ({ word }))
    }

    return []
  }, [tab, query, words])

  const labels: Record<Tab, string> = {
    unscramble: 'Word Unscrambler',
    starts: 'Words that start with…',
    anagram: 'Anagram Solver',
    rhyme: 'Rhyme Finder',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Word Tools</h1>
        <p className="text-slate-500 dark:text-slate-400">Unscramble, anagrams, prefixes and rhymes — all on your device.</p>
        <p className="text-xs text-slate-400 mt-2">{dictLabel}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(labels) as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            {labels[t]}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={
          tab === 'starts' ? 'Prefix (e.g. pre)'
            : tab === 'rhyme' ? 'Word to rhyme (e.g. cat)'
            : tab === 'anagram' ? 'Word or letters (e.g. listen)'
            : 'Scrambled letters (e.g. etuc)'
        }
        className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
        disabled={busy}
      />

      <p className="mt-3 text-sm text-slate-500">
        {busy ? 'Loading dictionary…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {results.map(({ word, tag }) => (
          <span
            key={word + (tag || '')}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700 text-sm"
            title={tag}
          >
            {word}
            {tag === 'exact' && <span className="ml-1 text-[10px] text-indigo-500">exact</span>}
          </span>
        ))}
        {!busy && query && results.length === 0 && (
          <p className="text-sm text-slate-500">No matches. Try different letters, or deploy the full dictionary (see note below).</p>
        )}
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        Dictionary loads once from this site and can be cached in your browser. Nothing is uploaded.
      </p>
    </div>
  )
}
