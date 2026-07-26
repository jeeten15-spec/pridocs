import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function XlsxToCsv({ embedded = false }: { embedded?: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [sheetCsv, setSheetCsv] = useState<Record<string, string>>({})
  const [activeSheet, setActiveSheet] = useState('')

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setSheetNames([])
    setSheetCsv({})
    setActiveSheet('')
    try {
      const name = f.name.toLowerCase()
      const XLSX = await import('xlsx')

      let workbook
      if (name.endsWith('.csv') || f.type === 'text/csv') {
        const text = await f.text()
        workbook = XLSX.read(text, { type: 'string' })
      } else {
        const buffer = await f.arrayBuffer()
        workbook = XLSX.read(buffer, { type: 'array' })
      }

      if (!workbook.SheetNames.length) {
        throw new Error('No sheets found in this file.')
      }

      const csvBySheet: Record<string, string> = {}
      for (const sheetName of workbook.SheetNames) {
        csvBySheet[sheetName] = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
      }

      setSheetNames(workbook.SheetNames)
      setSheetCsv(csvBySheet)
      setActiveSheet(workbook.SheetNames[0])
    } catch (e: any) {
      setError(e?.message || 'Conversion failed. Please check the file is a valid .xlsx, .xls, or .csv file.')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    convert(f)
  }

  const download = (sheetName: string) => {
    const csv = sheetCsv[sheetName]
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const base = (file?.name || 'data').replace(/\.(xlsx|xls|csv)$/i, '')
    a.download = sheetNames.length > 1 ? `${base}-${sheetName}.csv` : `${base}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={embedded ? '' : 'max-w-2xl mx-auto px-4 py-10'}>
      {!embedded && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Excel / XLSX to CSV Converter</h1>
          <p className="text-slate-500">Convert real .xlsx and .xls spreadsheets to CSV. Fully private, runs entirely in your browser.</p>
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
          <p className="font-medium">{file ? file.name : 'Drop .xlsx, .xls or .csv file here'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
      </label>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          {error}
        </div>
      )}

      {sheetNames.length > 0 && (
        <div className="mt-8 space-y-4">
          {sheetNames.length > 1 && (
            <div>
              <label className="block text-sm font-medium mb-2">This workbook has {sheetNames.length} sheets — choose one to download:</label>
              <div className="flex flex-wrap gap-2">
                {sheetNames.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSheet(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm border',
                      activeSheet === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <pre className="p-4 rounded-xl bg-slate-50 border text-xs overflow-auto max-h-64 whitespace-pre-wrap">
            {(sheetCsv[activeSheet] || '').slice(0, 2000)}{(sheetCsv[activeSheet] || '').length > 2000 ? '…' : ''}
          </pre>
          <div className="text-center">
            <button onClick={() => download(activeSheet)} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium">
              <Download className="w-5 h-5" /> Open Your File
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 text-center text-sm text-slate-500">
        Your spreadsheet is parsed entirely in your browser using SheetJS. Nothing is uploaded.
      </div>
    </div>
  )
}
