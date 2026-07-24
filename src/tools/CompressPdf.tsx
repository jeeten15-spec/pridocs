import { useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { cn, formatBytes } from '../lib/utils'

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [newSize, setNewSize] = useState(0)
  const [drag, setDrag] = useState(false)

  const process = async (f: File) => {
    setBusy(true)
    setError('')
    setOutputUrl(null)
    setOriginalSize(f.size)
    try {
      // Basic re-save. Real compression of images inside PDFs is limited in pure browser.
      // We still remove unused objects and can apply object streams.
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true })
      const bytes = await doc.save({ useObjectStreams: true })
      setNewSize(bytes.length)
      setOutputUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } catch (err: any) {
      setError(err?.message || 'Compression failed')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    setOutputUrl(null)
    process(f)
  }

  return (
    <>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Compress PDF Size Online - Reduce PDF MB Safely</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Reduce PDF file size while keeping excellent visual quality. Compress your documents safely inside your web browser without uploading files to remote servers.</p>
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
            <p className="font-medium text-slate-700">{file ? file.name : 'Drop a PDF here or click to browse'}</p>
            {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          </div>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </label>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {outputUrl && (
          <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <p className="text-slate-400">Original</p>
                <p className="font-semibold text-slate-800">{formatBytes(originalSize)}</p>
              </div>
              <div>
                <p className="text-slate-400">Compressed</p>
                <p className="font-semibold text-emerald-600">{formatBytes(newSize)}</p>
              </div>
            </div>
            <a href={outputUrl} download="compressed.pdf" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              <Download className="w-5 h-5" /> Open Your Document
            </a>
            <p className="text-xs text-slate-400">
              Note: Best results are on PDFs with structural redundancy. Heavy image compression requires Phase 2.
            </p>
          </div>
        )}

        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>
              Uses <strong>pdf-lib</strong> to rewrite the PDF with object streams enabled, removing some unused data.
              For maximum compression of image-heavy PDFs we will offer a High Fidelity mode in Phase 2.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
