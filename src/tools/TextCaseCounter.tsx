import { useMemo, useState } from 'react'

export default function TextCaseCounter() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text ? text.split(/\n/).length : 0
    const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+/g) || []).length || (text.trim() ? 1 : 0) : 0
    return { chars, charsNoSpaces, words, lines, sentences }
  }, [text])

  const transform = (fn: (s: string) => string) => setText(fn(text))

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Case Converter & Character Counter</h1>
        <p className="text-slate-500 dark:text-slate-400">Convert case and count characters, words, and lines — privately in your browser.</p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={8}
        placeholder="Type or paste text here…"
        className="w-full p-4 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ['UPPERCASE', (s: string) => s.toUpperCase()],
          ['lowercase', (s: string) => s.toLowerCase()],
          ['Title Case', (s: string) => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())],
          ['Sentence case', (s: string) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, c => c.toUpperCase())],
          ['camelCase', (s: string) => s.replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) => i === 0 ? w.toLowerCase() : w.toUpperCase()).replace(/\s+/g, '')],
          ['snake_case', (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_')],
          ['kebab-case', (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-')],
        ].map(([label, fn]) => (
          <button
            key={label as string}
            onClick={() => transform(fn as (s: string) => string)}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700"
          >
            {label as string}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        {[
          ['Characters', stats.chars],
          ['No spaces', stats.charsNoSpaces],
          ['Words', stats.words],
          ['Lines', stats.lines],
          ['Sentences', stats.sentences],
        ].map(([label, val]) => (
          <div key={label as string} className="p-3 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700">
            <div className="text-2xl font-semibold text-indigo-600">{val as number}</div>
            <div className="text-xs text-slate-500 mt-1">{label as string}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
