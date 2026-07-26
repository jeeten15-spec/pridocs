import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function CsvToXlsx({ embedded = false }: { embedded?: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const text = await f.text()
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(text, { type: 'string' })
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      setResult(URL.createObjectURL(blob))
    } catch (e: any) {
      setError(e?.message || 'Conversion failed. Please check the file is a valid CSV.')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    convert(f)
  }

  return (
    <div className={embedded ? '' : 'max-w-2xl mx-auto px-4 py-10'}>
      {!embedded && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">CSV to Excel (XLSX) Converter</h1>
          <p className="text-slate-500">Convert CSV files into a real, native .xlsx spreadsheet. Fully private.</p>
        </div>
      )}

      <label
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
          drag ? 'border-indigo-400' : 'border-slate-200'
        )}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop a CSV file here'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 text-center">
          <a href={result} download={(file?.name || 'data').replace(/\.csv$/i, '.xlsx')} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">
        Generates a real, native .xlsx workbook (using SheetJS) that opens in Excel, Google Sheets and LibreOffice — no legacy XML tricks.
      </p>
    </div>
  )
}
