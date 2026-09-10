import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

type SizePreset = 'none' | '20kb' | '50kb' | '100kb' | '200kb'

const PRESETS: { id: SizePreset; label: string; bytes: number | null }[] = [
  { id: 'none', label: 'Quality only (no size cap)', bytes: null },
  { id: '20kb', label: 'Under 20 KB', bytes: 20 * 1024 },
  { id: '50kb', label: 'Under 50 KB', bytes: 50 * 1024 },
  { id: '100kb', label: 'Under 100 KB', bytes: 100 * 1024 },
  { id: '200kb', label: 'Under 200 KB', bytes: 200 * 1024 },
]

async function encodeJpeg(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  )
  if (!blob) throw new Error('Encode failed')
  return blob
}

export default function ImageResize() {
  const [file, setFile] = useState<File | null>(null)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [keepRatio, setKeepRatio] = useState(true)
  const [preset, setPreset] = useState<SizePreset>('50kb')
  const [quality, setQuality] = useState(0.85)
  const [result, setResult] = useState<string | null>(null)
  const [resultBytes, setResultBytes] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 })
  const [hitTarget, setHitTarget] = useState<boolean | null>(null)

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setResult(null)
    setHitTarget(null)
    try {
      const bitmap = await createImageBitmap(f)
      const natW = bitmap.width
      const natH = bitmap.height
      setOriginalSize({ w: natW, h: natH })

      let targetW = width > 0 ? width : natW
      let targetH = height > 0 ? height : natH
      if (keepRatio) {
        const ratio = natH / natW
        targetH = Math.round(targetW * ratio)
        setHeight(targetH)
      }

      const targetBytes = PRESETS.find((p) => p.id === preset)?.bytes ?? null
      let blob: Blob
      let q = quality
      let w = targetW
      let h = targetH

      if (!targetBytes) {
        blob = await encodeJpeg(bitmap, w, h, q)
        setHitTarget(null)
      } else {
        blob = await encodeJpeg(bitmap, w, h, q)
        for (let i = 0; i < 14 && blob.size > targetBytes; i++) {
          if (q > 0.35) {
            q = Math.max(0.28, q - 0.08)
          } else {
            w = Math.max(120, Math.round(w * 0.85))
            h = Math.max(120, Math.round(h * 0.85))
            q = 0.72
          }
          blob = await encodeJpeg(bitmap, w, h, q)
        }
        setHitTarget(blob.size <= targetBytes)
        setWidth(w)
        setHeight(h)
        setQuality(Number(q.toFixed(2)))
      }

      bitmap.close()
      setResultBytes(blob.size)
      setResult(URL.createObjectURL(blob))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Resize failed. Please try a different image.')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    setFile(f)
    convert(f)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Image Compressor Online — Resize to 50 KB / 20 KB
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Compress JPG for web forms and portals. Hit <strong>50 KB</strong>, <strong>20 KB</strong>, or custom pixel
          sizes — privately, in your browser.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Target size (pixels)</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
                placeholder="Width"
                min={1}
              />
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
                placeholder="Height"
                min={1}
                disabled={keepRatio}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} />
            Keep aspect ratio
          </label>
          <div>
            <label className="block text-sm font-medium mb-1">File size target</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as SizePreset)}
              className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {preset === 'none' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                JPEG quality ({Math.round(quality * 100)}%)
              </label>
              <input
                type="range"
                min={0.4}
                max={0.95}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          {originalSize.w > 0 && (
            <p className="text-xs text-slate-500">
              Original: {originalSize.w} × {originalSize.h} px
            </p>
          )}
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
            'flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 dark:border-slate-600'
          )}
        >
          {busy ? (
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400" />
          )}
          <div className="text-center text-sm">
            {file ? file.name : 'Drop image here or click to browse'}
            {file && <p className="text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => file && convert(file)}
        disabled={!file || busy}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50 font-medium"
      >
        {busy ? 'Processing…' : 'Resize & Compress'}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 text-center">
          <img
            src={result}
            alt="Resized"
            className="max-h-96 mx-auto rounded-xl border border-slate-200 shadow-sm mb-4"
          />
          <p className="text-sm text-slate-500 mb-2">
            Output: {formatBytes(resultBytes)}
            {hitTarget === true ? ' · target met' : hitTarget === false ? ' · closest achievable' : ''}
          </p>
          <a
            href={result}
            download={file?.name.replace(/\.[^.]+$/, '') + '-compressed.jpg' || 'compressed.jpg'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
          >
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">
        Need <strong>compress jpg for web</strong> or <strong>resize image to 50kb</strong> for a form? Processing stays
        on your device — no upload required.
      </p>
    </div>
  )
}
