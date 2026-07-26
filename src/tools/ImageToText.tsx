import { useState } from 'react'
import { ScanText, Download, Loader2, Upload, Copy, Check } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

interface ImageToTextProps {
  embedded?: boolean
}

export default function ImageToText({ embedded = false }: ImageToTextProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [text, setText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [drag, setDrag] = useState(false)

  const runOcr = async (f: File) => {
    setBusy(true)
    setError('')
    setText(null)
    setProgress('Loading OCR engine…')
    try {
      const Tesseract = await import('tesseract.js')
      const {
        data: { text: recognized },
      } = await Tesseract.recognize(f, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(`Recognizing text… ${Math.round((m.progress || 0) * 100)}%`)
          } else if (m.status) {
            setProgress(m.status)
          }
        },
      })
      setText(recognized.trim())
      setProgress('Done')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Text extraction failed')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    runOcr(f)
  }

  const download = () => {
    if (!text || !file) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name.replace(/\.[^.]+$/, '') + '-text.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyText = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore — user can select the text manually
    }
  }

  return (
    <div className={embedded ? '' : 'max-w-3xl mx-auto px-4 py-10'}>
      {!embedded && (
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Image to Text Converter (Free OCR, No Upload)</h1>
          <p className="text-slate-500 max-w-xl mx-auto">Extract text from photos, screenshots and scanned documents — processed entirely on your device.</p>
        </div>
      )}

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
          drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="max-h-40 rounded-lg object-contain" />
        ) : busy ? (
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-slate-400" />
        )}
        <div className="text-center">
          <p className="font-medium text-slate-700">{file ? file.name : 'Drop a photo or screenshot here or click to browse'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {busy && <p className="text-sm text-indigo-600 mt-2">{progress}</p>}
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {text !== null && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-slate-800 flex items-center gap-2">
              <ScanText className="w-4 h-4" /> Extracted Text
            </h2>
            <div className="flex gap-2">
              <button onClick={copyText} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-medium text-slate-700">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">
                <Download className="w-4 h-4" /> Open Your File
              </button>
            </div>
          </div>
          {text.length === 0 ? (
            <p className="text-sm text-slate-500 p-5 rounded-2xl bg-white border border-slate-200">No text was detected in this image. Try a clearer or higher-resolution photo.</p>
          ) : (
            <pre className="p-5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-700 overflow-auto max-h-96 whitespace-pre-wrap">{text}</pre>
          )}
        </div>
      )}

      {!embedded && (
        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>
              This tool uses <strong>Tesseract.js</strong>, a WebAssembly port of the open-source Tesseract OCR
              engine, to recognize text directly in your browser.
            </p>
            <p>Your image is never uploaded anywhere — recognition happens locally, on your own device.</p>
          </div>
        </section>
      )}
    </div>
  )
}
