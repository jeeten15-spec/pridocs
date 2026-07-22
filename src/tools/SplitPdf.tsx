import { useState } from 'react'
import { Scissors, Download, Loader2, Upload } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { cn, formatBytes } from '../lib/utils'

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [range, setRange] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const loadFile = async (f: File) => {
    setFile(f)
    setOutputUrl(null)
    setError('')
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer())
      setPageCount(doc.getPageCount())
      setRange(`1-${doc.getPageCount()}`)
    } catch {
      setError('Could not read PDF')
    }
  }

  const split = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    setOutputUrl(null)
    try {
      const src = await PDFDocument.load(await file.arrayBuffer())
      const out = await PDFDocument.create()

      // Parse simple ranges like "1-3,5,7-9"
      const pages: number[] = []
      range.split(',').forEach((part) => {
        const p = part.trim()
        if (p.includes('-')) {
          const [a, b] = p.split('-').map(Number)
          for (let i = a; i <= b; i++) pages.push(i - 1)
        } else {
          pages.push(Number(p) - 1)
        }
      })

      const valid = pages.filter((i) => i >= 0 && i < src.getPageCount())
      if (valid.length === 0) throw new Error('No valid pages selected')

      const copied = await out.copyPages(src, valid)
      copied.forEach((p) => out.addPage(p))

      const bytes = await out.save()
      setOutputUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } catch (err: any) {
      setError(err?.message || 'Split failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Split PDF Files Online Locally</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Extract specific pages from a PDF safely. Your documents are never exposed to remote servers.</p>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f) }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <Upload className="w-10 h-10 text-slate-400" />
          <div className="text-center">
            <p className="font-medium text-slate-700">{file ? file.name : 'Drop a PDF here or click to browse'}</p>
            {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)} · {pageCount} pages</p>}
          </div>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
        </label>

        {file && pageCount > 0 && (
          <div className="mt-6 p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Pages to extract</label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-10"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Use commas and ranges. Example: 1-3,5,7-9</p>
            </div>
            <button
              onClick={split}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              Extract Pages
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {outputUrl && (
          <div className="mt-6 text-center">
            <a href={outputUrl} download="extracted.pdf" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              <Download className="w-5 h-5" /> Open Your Document
            </a>
          </div>
        )}

        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>Uses <strong>pdf-lib</strong> to copy only the pages you select into a new PDF document. The original file stays on your device.</p>
          </div>
        </section>
      </div>
    </>
  )
}
