import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import { cn } from '../lib/utils'

export default function PdfWatermark() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.3)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [drag] = useState(false)

  const apply = async (f: File) => {
    setBusy(true)
    try {
      const pdf = await PDFDocument.load(await f.arrayBuffer())
      const font = await pdf.embedFont(StandardFonts.HelveticaBold)
      const pages = pdf.getPages()

      pages.forEach(page => {
        const { width, height } = page.getSize()
        const fontSize = Math.min(width, height) / 8
        page.drawText(text, {
          x: width / 2 - (text.length * fontSize * 0.25),
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.6, 0.6, 0.6),
          opacity,
          rotate: degrees(-45),
        })
      })

      const bytes = await pdf.save()
      setResult(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } catch (e) {
      alert('Failed to add watermark')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">PDF Watermark</h1>
        <p className="text-slate-500">Add a diagonal text watermark to every page.</p>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Watermark Text</label>
          <input value={text} onChange={e => setText(e.target.value)} className="w-full p-3 rounded-xl border" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Opacity: {Math.round(opacity * 100)}%</label>
          <input type="range" min="0.1" max="0.8" step="0.05" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full" />
        </div>
      </div>

      <label className={cn('flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white', drag ? 'border-indigo-400' : 'border-slate-200')}>
        {busy ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <Upload className="w-8 h-8 text-slate-400" />}
        <div className="text-center text-sm">{file ? file.name : 'Drop PDF here'}</div>
        <input type="file" accept="application/pdf" className="hidden" onChange={e => {
          const f = e.target.files?.[0]
          if (f) { setFile(f); apply(f) }
        }} />
      </label>

      {result && (
        <div className="mt-8 text-center">
          <a href={result} download={file?.name.replace('.pdf', '-watermarked.pdf')} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl">
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      
    </div>
  )
}
