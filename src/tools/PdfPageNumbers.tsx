import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { cn } from '../lib/utils'

export default function PdfPageNumbers() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left'>('bottom-center')

  const apply = async (f: File) => {
    setBusy(true)
    try {
      const pdf = await PDFDocument.load(await f.arrayBuffer())
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const pages = pdf.getPages()
      const total = pages.length

      pages.forEach((page, i) => {
        const { width } = page.getSize()
        const text = `${i + 1} / ${total}`
        let x = width / 2 - 20
        if (position === 'bottom-right') x = width - 60
        if (position === 'bottom-left') x = 30

        page.drawText(text, {
          x,
          y: 25,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.3),
        })
      })

      const bytes = await pdf.save()
      setResult(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } catch {
      alert('Failed to add page numbers')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">PDF Page Numbers</h1>
        <p className="text-slate-500">Add page numbers to every page of your PDF.</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Position</label>
        <select value={position} onChange={e => setPosition(e.target.value as any)} className="w-full p-3 rounded-xl border">
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-left">Bottom Left</option>
        </select>
      </div>

      <label className={cn('flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white', 'border-slate-200')}>
        {busy ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <Upload className="w-8 h-8 text-slate-400" />}
        <div className="text-center text-sm">{file ? file.name : 'Drop PDF here'}</div>
        <input type="file" accept="application/pdf" className="hidden" onChange={e => {
          const f = e.target.files?.[0]
          if (f) { setFile(f); apply(f) }
        }} />
      </label>

      {result && (
        <div className="mt-8 text-center">
          <a href={result} download={file?.name.replace('.pdf', '-numbered.pdf')} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl">
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      
    </div>
  )
}
