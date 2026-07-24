import { useState } from 'react'

export default function TextDiff() {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')
  const [diff, setDiff] = useState<string[]>([])

  const compare = () => {
    const linesA = textA.split('\n')
    const linesB = textB.split('\n')
    const max = Math.max(linesA.length, linesB.length)
    const result: string[] = []
    for (let i = 0; i < max; i++) {
      const a = linesA[i] ?? ''
      const b = linesB[i] ?? ''
      if (a === b) {
        result.push(`  ${a}`)
      } else {
        if (a) result.push(`- ${a}`)
        if (b) result.push(`+ ${b}`)
      }
    }
    setDiff(result)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">Text Diff Checker</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Original Text</label>
          <textarea value={textA} onChange={e => setTextA(e.target.value)} className="w-full h-64 p-4 rounded-xl border font-mono text-sm" placeholder="Paste original text..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Modified Text</label>
          <textarea value={textB} onChange={e => setTextB(e.target.value)} className="w-full h-64 p-4 rounded-xl border font-mono text-sm" placeholder="Paste modified text..." />
        </div>
      </div>

      <button onClick={compare} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium mb-6">
        Compare
      </button>

      {diff.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 border font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
          {diff.map((line, i) => (
            <div key={i} className={line.startsWith('-') ? 'text-red-600 bg-red-50' : line.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-slate-700'}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
