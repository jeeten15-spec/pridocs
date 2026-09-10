import { useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { cn, formatBytes } from '../lib/utils'

type TargetMode = 'light' | '1mb' | '500kb' | '200kb' | 'email'

const TARGETS: { id: TargetMode; label: string; bytes: number | null; hint: string }[] = [
  {
    id: 'light',
    label: 'Light (keep text selectable)',
    bytes: null,
    hint: 'Rewrites structure only — best when the PDF is mostly text.',
  },
  {
    id: '1mb',
    label: 'Under 1 MB',
    bytes: 1024 * 1024,
    hint: 'Great for email attachments and many upload portals.',
  },
  {
    id: '500kb',
    label: 'Under 500 KB',
    bytes: 512 * 1024,
    hint: 'Tighter for fussy forms and shared drives.',
  },
  {
    id: '200kb',
    label: 'Under 200 KB',
    bytes: 200 * 1024,
    hint: 'Aggressive — ideal for government portals with tiny limits.',
  },
  {
    id: 'email',
    label: 'Compress for email (~800 KB)',
    bytes: 800 * 1024,
    hint: 'Balanced quality for Gmail / Outlook size caps.',
  },
]

async function lightCompress(data: ArrayBuffer) {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true })
  return doc.save({ useObjectStreams: true })
}

async function rasterCompress(
  data: ArrayBuffer,
  targetBytes: number,
  onStatus: (s: string) => void
): Promise<Uint8Array> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise
  const pageCount = pdf.numPages

  let scale = Math.min(1.6, Math.max(0.7, 2.2 - pageCount * 0.08))
  let quality = 0.78
  let best: Uint8Array | null = null

  for (let attempt = 0; attempt < 8; attempt++) {
    onStatus(
      `Compressing pages (${attempt + 1}/8) · scale ${scale.toFixed(2)} · JPEG ${Math.round(quality * 100)}%…`
    )
    const out = await PDFDocument.create()

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(viewport.width))
      canvas.height = Math.max(1, Math.floor(viewport.height))
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      await page.render({ canvasContext: ctx, viewport }).promise

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
      )
      if (!blob) throw new Error('Failed to encode page')
      const jpg = new Uint8Array(await blob.arrayBuffer())
      const img = await out.embedJpg(jpg)
      const p = out.addPage([img.width, img.height])
      p.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
    }

    const bytes = await out.save({ useObjectStreams: true })
    best = bytes
    if (bytes.length <= targetBytes) return bytes

    // Missed the target — squeeze harder
    quality = Math.max(0.32, quality - 0.1)
    if (quality <= 0.4) {
      scale = Math.max(0.45, scale * 0.82)
      quality = Math.max(0.45, quality)
    }
  }

  if (!best) throw new Error('Compression failed')
  return best
}

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<TargetMode>('1mb')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [newSize, setNewSize] = useState(0)
  const [drag, setDrag] = useState(false)
  const [hitTarget, setHitTarget] = useState<boolean | null>(null)

  const process = async (f: File, targetMode: TargetMode) => {
    setBusy(true)
    setError('')
    setOutputUrl(null)
    setOriginalSize(f.size)
    setHitTarget(null)
    setStatus('Reading PDF…')
    try {
      const data = await f.arrayBuffer()
      const target = TARGETS.find((t) => t.id === targetMode)
      let bytes: Uint8Array

      if (!target?.bytes) {
        setStatus('Light rewrite…')
        bytes = await lightCompress(data)
      } else {
        bytes = await rasterCompress(data, target.bytes, setStatus)
        setHitTarget(bytes.length <= target.bytes)
      }

      setNewSize(bytes.length)
      setOutputUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
      setStatus('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Compression failed')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    setOutputUrl(null)
    process(f, mode)
  }

  const selected = TARGETS.find((t) => t.id === mode)!

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Compress PDF Under 1 MB — Free, No Signup
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Shrink PDFs for email, portals, and &quot;file too large&quot; forms. Target{' '}
          <strong>under 1 MB</strong>, <strong>200 KB</strong>, or light structure-only compression — entirely in your
          browser, no upload.
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Compression target</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as TargetMode)}
          disabled={busy}
          className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
        >
          {TARGETS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">{selected.hint}</p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handleFile(e.dataTransfer.files?.[0] || null)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white dark:bg-slate-800',
          drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
        )}
      >
        {busy ? (
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-slate-400" />
        )}
        <div className="text-center">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {file ? file.name : 'Drop a PDF here or click to browse'}
          </p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
      </label>

      <button
        type="button"
        onClick={() => file && process(file, mode)}
        disabled={!file || busy}
        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50"
      >
        {busy ? 'Compressing…' : `Compress PDF · ${selected.label}`}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {outputUrl && (
        <div className="mt-8 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-4">
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <p className="text-slate-400">Original</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{formatBytes(originalSize)}</p>
            </div>
            <div>
              <p className="text-slate-400">Compressed</p>
              <p className="font-semibold text-emerald-600">{formatBytes(newSize)}</p>
            </div>
          </div>
          {hitTarget === true && (
            <p className="text-sm text-emerald-700">Target met — ready for email / portal upload.</p>
          )}
          {hitTarget === false && (
            <p className="text-sm text-amber-700">
              Closest size we could reach on this device. Try a lower target, fewer pages, or Light mode for text PDFs.
            </p>
          )}
          <a
            href={outputUrl}
            download="compressed.pdf"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            <Download className="w-5 h-5" /> Open Your Document
          </a>
          <p className="text-xs text-slate-400">
            Target modes re-encode pages as images (SmallPDF / Adobe-style size wins). Text may no longer be
            selectable — perfect for scanned docs and portal uploads. Use Light mode to keep selectable text.
          </p>
        </div>
      )}

      <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Compress PDF under 1 MB with no signup
        </h2>
        <p>
          Looking for a <strong>SmallPDF alternative</strong> or <strong>Adobe Acrobat online</strong> stand-in that
          does not upload contracts? Pridocs compresses PDFs in the browser — handy for{' '}
          <strong>compress PDF for email</strong>, <strong>compress PDF 200kb</strong>, and{' '}
          <strong>compress scanned PDF for government portal</strong> workflows.
        </p>
      </section>
    </div>
  )
}
