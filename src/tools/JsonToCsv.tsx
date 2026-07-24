import { useState } from 'react'
import { Download } from 'lucide-react'

export default function JsonToCsv() {
  const [jsonInput, setJsonInput] = useState('')
  const [csvOutput, setCsvOutput] = useState('')

  const convert = () => {
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) {
        alert('JSON must be an array of objects')
        return
      }
      const headers = Object.keys(data[0] || {})
      let csv = headers.join(',') + '\n'
      data.forEach((row: any) => {
        csv += headers.map(h => JSON.stringify(row[h] ?? '')).join(',') + '\n'
      })
      setCsvOutput(csv)
    } catch (e) {
      alert('Invalid JSON')
    }
  }

  const download = () => {
    const blob = new Blob([csvOutput], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">JSON to CSV</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">JSON Input</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='[{"name":"John","age":30}]'
            className="w-full h-64 p-4 rounded-xl border border-slate-200 font-mono text-sm"
          />
          <button onClick={convert} className="mt-3 w-full py-2.5 rounded-xl bg-indigo-600 text-white">Convert</button>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">CSV Output</label>
          <textarea
            value={csvOutput}
            readOnly
            className="w-full h-64 p-4 rounded-xl border border-slate-200 font-mono text-sm bg-slate-50"
          />
          {csvOutput && (
            <button onClick={download} className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Open Your Document
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
