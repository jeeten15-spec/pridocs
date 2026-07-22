import { useState } from 'react'
import { ScanText, Download, Loader2, Upload } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function PdfOcr() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [text, setText] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const runOcr = async (f: File) => {
    setBusy(true)
    setError('')
    setText(null)
    setProgress('Loading libraries…')
    try {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

      const Tesseract = await import('tesseract.js')

      setProgress('Reading PDF…')
      const data = new Uint8Array(await f.arrayBuffer())
      const pdf = await pdfjs.getDocument({ data }).promise
      const allText: string[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`OCR page ${i} of ${pdf.numPages}…`)
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport }).promise

        const { data: { text: pageText } } = await Tesseract.recognize(canvas, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(`OCR page ${i}/${pdf.numPages} – ${Math.round((m.progress || 0) * 100)}%`)
            }
          },
        })
        allText.push(`--- Page ${i} ---\n${pageText}`)
      }

      setText(allText.join('\n\n'))
      setProgress('Done')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'OCR failed')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    runOcr(f)
  }

  const download = () => {
    if (!text || !file) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name.replace(/\.pdf$/i, '-ocr.txt')
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Private Free PDF OCR Tool (Searchable PDF)</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Turn scanned PDFs into fully searchable, selectable documents using high-accuracy Optical Character Recognition that runs 100% locally on your machine.</p>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
          <div className="text-center">
            <p className="font-medium text-slate-700">{file ? file.name : 'Drop a scanned PDF here or click to browse'}</p>
            {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
            {busy && <p className="text-sm text-indigo-600 mt-2">{progress}</p>}
          </div>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </label>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {text && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-slate-800 flex items-center gap-2">
                <ScanText className="w-4 h-4" /> Extracted Text
              </h2>
              <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">
                <Download className="w-4 h-4" /> Open Text
              </button>
            </div>
            <pre className="p-5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-700 overflow-auto max-h-96 whitespace-pre-wrap">{text}</pre>
          </div>
        )}

        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>
              Each page is rendered to an image using <strong>PDF.js</strong>, then recognized by{' '}
              <strong>Tesseract.js</strong> (WebAssembly port of the famous Tesseract OCR engine).
            </p>
            <p>
              Recognition happens completely offline in your browser. No page is ever sent to a server.
              Accuracy is excellent for clear scans in English.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
