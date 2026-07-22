import { useState } from 'react'
import { Files, Download, Loader2, Upload, Trash2, GripVertical } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { cn, formatBytes } from '../lib/utils'

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const pdfs = Array.from(newFiles).filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    setFiles((prev) => [...prev, ...pdfs])
    setOutputUrl(null)
    setError('')
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setOutputUrl(null)
  }

  const merge = async () => {
    if (files.length < 2) {
      setError('Please add at least two PDF files')
      return
    }
    setBusy(true)
    setError('')
    setOutputUrl(null)
    try {
      const merged = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const doc = await PDFDocument.load(bytes)
        const pages = await merged.copyPages(doc, doc.getPageIndices())
        pages.forEach((page) => merged.addPage(page))
      }
      const pdfBytes = await merged.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      setOutputUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err?.message || 'Merge failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Combine and Split PDF Files Online Locally</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Safely merge multiple PDF files into one. Drag, drop, and reorder pages. Processing happens entirely inside your browser via WebAssembly.</p>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            addFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <Upload className="w-10 h-10 text-slate-400" />
          <div className="text-center">
            <p className="font-medium text-slate-700">Drop PDF files here or click to browse</p>
            <p className="text-sm text-slate-400 mt-1">You can select multiple files</p>
          </div>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200"
              >
                <GripVertical className="w-4 h-4 text-slate-300" />
                <Files className="w-4 h-4 text-indigo-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                </div>
                <button onClick={() => removeFile(i)} className="p-1.5 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={merge}
            disabled={busy || files.length < 2}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Files className="w-5 h-5" />}
            {busy ? 'Merging…' : 'Merge PDFs'}
          </button>
          {outputUrl && (
            <a
              href={outputUrl}
              download="merged.pdf"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              <Download className="w-5 h-5" /> Open Your Document
            </a>
          )}
        </div>

        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>
              Powered by <strong>pdf-lib</strong>, a pure JavaScript library that can create and modify PDF
              documents entirely in the browser. No server is involved.
            </p>
            <p>
              Your PDFs are read into memory, pages are copied into a new document, and the result is generated
              locally. Nothing is ever uploaded.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
