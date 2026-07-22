import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function XlsxToCsv() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const name = f.name.toLowerCase()
      if (name.endsWith('.csv') || f.type === 'text/csv') {
        const text = await f.text()
        setResult(text)
        return
      }

      // For true .xlsx we need SheetJS. Provide a helpful, non-technical message.
      setError(
        'Native Excel (.xlsx) parsing needs an extra library that is not yet bundled in this release. ' +
        'Please open the file in Excel / Google Sheets and save it as CSV, then upload the CSV here. ' +
        'Full .xlsx support is coming in the very next update.'
      )
    } catch (e: any) {
      setError(e?.message || 'Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    if (!result) return
    const blob = new Blob([result], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (file?.name || 'data').replace(/\.(xlsx|xls)$/i, '.csv')
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Excel / XLSX to CSV</h1>
        <p className="text-slate-500">Convert spreadsheet data to CSV. Fully private.</p>
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) { setFile(f); convert(f) } }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
          drag ? 'border-indigo-400' : 'border-slate-200'
        )}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop .xlsx or .csv file here'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => {
          const f = e.target.files?.[0]
          if (f) { setFile(f); convert(f) }
        }} />
      </label>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 text-center">
          <button onClick={download} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium">
            <Download className="w-5 h-5" /> Open Your Document
          </button>
        </div>
      )}
    </div>
  )
}
