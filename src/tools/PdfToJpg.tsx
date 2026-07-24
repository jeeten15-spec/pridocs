import { useState } from 'react'
import { Image, Download, Loader2, Upload } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setImages([])
    try {
      // Dynamic import to keep initial bundle smaller
      const pdfjs = await import('pdfjs-dist')
      // Use CDN worker for simplicity
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

      const data = new Uint8Array(await f.arrayBuffer())
      const pdf = await pdfjs.getDocument({ data }).promise
      const urls: string[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport }).promise
        urls.push(canvas.toDataURL('image/jpeg', 0.92))
      }
      setImages(urls)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Conversion failed')
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
    <>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Free Online PDF to JPG Converter (100% Private)</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Need to convert PDF pages to high-quality JPG images without risking your data? Our private PDF converter processes everything directly in your browser. Perfect for sensitive documents, receipts, or portfolios.</p>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            handleFile(e.dataTransfer.files?.[0] || null)
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
          <div className="text-center">
            <p className="font-medium text-slate-700">
              {file ? file.name : 'Drop a PDF here or click to browse'}
            </p>
            {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          </div>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </label>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {images.length > 0 && (
          <div className="mt-10 space-y-6">
            <h2 className="font-medium text-slate-800 flex items-center gap-2">
              <Image className="w-4 h-4" /> {images.length} page{images.length > 1 ? 's' : ''} converted
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {images.map((src, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <img src={src} alt={`Page ${i + 1}`} className="w-full" />
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Page {i + 1}</span>
                    <a
                      href={src}
                      download={`page-${i + 1}.jpg`}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <Download className="w-3.5 h-3.5" /> Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>
              Uses <strong>PDF.js</strong> (by Mozilla) to render each page onto a canvas at high resolution,
              then exports as JPG. Everything happens locally in your browser.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
