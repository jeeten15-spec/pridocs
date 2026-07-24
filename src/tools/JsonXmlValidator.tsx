import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

type Mode = 'json' | 'xml'

export default function JsonXmlValidator() {
  const [mode, setMode] = useState<Mode>('json')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string; formatted?: string } | null>(null)

  const validate = () => {
    if (!input.trim()) {
      setResult({ ok: false, message: 'Please paste some content.' })
      return
    }
    if (mode === 'json') {
      try {
        const parsed = JSON.parse(input)
        setResult({
          ok: true,
          message: 'Valid JSON',
          formatted: JSON.stringify(parsed, null, 2),
        })
      } catch (e: any) {
        setResult({ ok: false, message: e?.message || 'Invalid JSON' })
      }
    } else {
      try {
        const doc = new DOMParser().parseFromString(input, 'application/xml')
        const err = doc.querySelector('parsererror')
        if (err) {
          setResult({ ok: false, message: err.textContent?.trim() || 'Invalid XML' })
        } else {
          const serializer = new XMLSerializer()
          setResult({
            ok: true,
            message: 'Valid XML',
            formatted: serializer.serializeToString(doc),
          })
        }
      } catch (e: any) {
        setResult({ ok: false, message: e?.message || 'Invalid XML' })
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">JSON & XML Validator</h1>
        <p className="text-slate-500 dark:text-slate-400">Validate and format JSON or XML entirely in your browser.</p>
      </div>

      <div className="flex gap-2 mb-4">
        {(['json', 'xml'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={12}
        placeholder={mode === 'json' ? '{ "hello": "world" }' : '<?xml version="1.0"?><root></root>'}
        className="w-full p-4 rounded-xl border dark:bg-slate-800 dark:border-slate-600 font-mono text-sm"
      />

      <button onClick={validate} className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium">
        Validate & Format
      </button>

      {result && (
        <div className={`mt-6 p-4 rounded-xl border ${result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex items-center gap-2 font-medium mb-2">
            {result.ok ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {result.message}
          </div>
          {result.formatted && (
            <pre className="mt-3 p-3 rounded-lg bg-white/80 dark:bg-slate-900 text-xs overflow-auto max-h-64 whitespace-pre-wrap">{result.formatted}</pre>
          )}
        </div>
      )}
    </div>
  )
}
