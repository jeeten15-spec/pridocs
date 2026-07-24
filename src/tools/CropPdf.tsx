import { useState } from 'react'
import { Crop, Download, Upload, Loader2 } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { cn } from '../lib/utils'

export default function CropPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [left, setLeft] = useState(0)
  const [top, setTop] = useState(0)
  const [right, setRight] = useState(0)
  const [bottom, setBottom] = useState(0)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [drag] = useState(false)

  const crop = async (f: File) => {
    setBusy(true)
    try {
      const arrayBuffer = await f.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = pdf.getPages()

      pages.forEach(page => {
        const { width, height } = page.getSize()
        page.setCropBox(
          left,
          bottom,
          width - left - right,
          height - top - bottom
        )
      })

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      setResult(URL.createObjectURL(blob))
    } catch (err) {
      alert('Crop failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    setResult(null)
  }

  const download = () => {
    if (!result || !file) return
    const a = document.createElement('a')
    a.href = result
    a.download = file.name.replace('.pdf', '-cropped.pdf')
    a.click()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Crop PDF</h1>
        <p className="text-slate-500">Crop margins from all pages locally.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Crop Margins (points)</label>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={left} onChange={e => setLeft(Number(e.target.value))} placeholder="Left" className="p-3 rounded-xl border" />
            <input type="number" value={top} onChange={e => setTop(Number(e.target.value))} placeholder="Top" className="p-3 rounded-xl border" />
            <input type="number" value={right} onChange={e => setRight(Number(e.target.value))} placeholder="Right" className="p-3 rounded-xl border" />
            <input type="number" value={bottom} onChange={e => setBottom(Number(e.target.value))} placeholder="Bottom" className="p-3 rounded-xl border" />
          </div>
        </div>

        <label className={cn(
          'flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
          drag ? 'border-indigo-400' : 'border-slate-200'
        )}>
          <Upload className="w-8 h-8 text-slate-400" />
          <div className="text-center text-sm">{file ? file.name : 'Drop PDF here'}</div>
          <input type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      <button
        onClick={() => file && crop(file)}
        disabled={!file || busy}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crop className="w-5 h-5" />}
        {busy ? 'Cropping...' : 'Apply Crop to All Pages'}
      </button>

      {result && (
        <div className="mt-8 text-center">
          <button onClick={download} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl">
            <Download className="w-5 h-5" /> Open Your Document
          </button>
        </div>
      )}
    </div>
  )
}
