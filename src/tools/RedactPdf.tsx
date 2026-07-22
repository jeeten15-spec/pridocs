import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { PDFDocument, rgb } from 'pdf-lib'
import { cn } from '../lib/utils'

export default function RedactPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [marginTop, setMarginTop] = useState(0)
  const [marginBottom, setMarginBottom] = useState(0)

  const redact = async (f: File) => {
    setBusy(true)
    try {
      const pdf = await PDFDocument.load(await f.arrayBuffer())
      const pages = pdf.getPages()

      pages.forEach(page => {
        const { width, height } = page.getSize()
        // Black bar at top
        if (marginTop > 0) {
          page.drawRectangle({
            x: 0,
            y: height - marginTop,
            width,
            height: marginTop,
            color: rgb(0, 0, 0),
          })
        }
        // Black bar at bottom
        if (marginBottom > 0) {
          page.drawRectangle({
            x: 0,
            y: 0,
            width,
            height: marginBottom,
            color: rgb(0, 0, 0),
          })
        }
      })

      const bytes = await pdf.save()
      setResult(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } catch {
      alert('Redaction failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Redact PDF</h1>
        <p className="text-slate-500">Cover sensitive header/footer areas with solid black bars.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Top bar height (points)</label>
          <input type="number" value={marginTop} onChange={e => setMarginTop(Number(e.target.value))} className="w-full p-3 rounded-xl border" min="0" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bottom bar height (points)</label>
          <input type="number" value={marginBottom} onChange={e => setMarginBottom(Number(e.target.value))} className="w-full p-3 rounded-xl border" min="0" />
        </div>
      </div>

      <label className={cn('flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white', 'border-slate-200')}>
        {busy ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <Upload className="w-8 h-8 text-slate-400" />}
        <div className="text-center text-sm">{file ? file.name : 'Drop PDF here'}</div>
        <input type="file" accept="application/pdf" className="hidden" onChange={e => {
          const f = e.target.files?.[0]
          if (f) { setFile(f); redact(f) }
        }} />
      </label>

      {result && (
        <div className="mt-8 text-center">
          <a href={result} download={file?.name.replace('.pdf', '-redacted.pdf')} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl">
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        This version covers header/footer zones. Full free-form redaction (click-and-drag boxes) is planned for a future update.
      </p>
    </div>
  )
}
