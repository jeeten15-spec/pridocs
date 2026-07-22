import { useState } from 'react'
import { RotateCw, Download, Loader2, Upload } from 'lucide-react'
import { PDFDocument, degrees } from 'pdf-lib'
import { cn, formatBytes } from '../lib/utils'

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null)
  const [angle, setAngle] = useState(90)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const process = async (f: File) => {
    setBusy(true)
    setError('')
    setOutputUrl(null)
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer())
      const pages = doc.getPages()
      pages.forEach((page) => {
        const current = page.getRotation().angle
        page.setRotation(degrees(current + angle))
      })
      const bytes = await doc.save()
      setOutputUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } catch (err: any) {
      setError(err?.message || 'Rotation failed')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    setOutputUrl(null)
  }

  return (
    <>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Rotate PDF Pages Online - Free Page Rotator</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Rotate pages in a PDF document left or right. Instant browser-side layout adjustment with zero file uploads and total privacy.</p>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <Upload className="w-10 h-10 text-slate-400" />
          <div className="text-center">
            <p className="font-medium text-slate-700">{file ? file.name : 'Drop a PDF here or click to browse'}</p>
            {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          </div>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </label>

        {file && (
          <div className="mt-6 p-5 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-slate-700">Rotate by</label>
            <select value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value={90}>90° clockwise</option>
              <option value={180}>180°</option>
              <option value={270}>270° (90° counter-clockwise)</option>
            </select>
            <button
              onClick={() => process(file)}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
              Rotate
            </button>
          </div>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {outputUrl && (
          <div className="mt-6 text-center">
            <a href={outputUrl} download="rotated.pdf" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              <Download className="w-5 h-5" /> Open Your Document
            </a>
          </div>
        )}

        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>Uses <strong>pdf-lib</strong> to update the rotation metadata of every page. No quality loss occurs because the page content itself is not re-encoded.</p>
          </div>
        </section>
      </div>
    </>
  )
}
