import { useState } from 'react'
import { Download, Upload, Loader2, Shield } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function ExifRemover() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [outSize, setOutSize] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg')

  const process = async (f: File) => {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const bitmap = await createImageBitmap(f)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Could not encode image'))),
          format,
          format === 'image/jpeg' ? 0.92 : undefined
        )
      })
      setOutSize(blob.size)
      setResult(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err?.message || 'Could not strip metadata from this image.')
    } finally {
      setBusy(false)
    }
  }

  const handle = (f: File | null) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    process(f)
  }

  const ext = format === 'image/png' ? '.png' : '.jpg'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">EXIF / Metadata Remover</h1>
        <p className="text-slate-500">Strip GPS, camera, and other metadata by re-encoding the image in your browser.</p>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex gap-2">
        <Shield className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" />
        <span>
          Re-drawing the photo onto a canvas and exporting a new file removes EXIF/XMP. Your original never uploads.
        </span>
      </div>

      <label className="block text-sm font-medium mb-1">Output format</label>
      <select
        value={format}
        onChange={(e) => {
          const v = e.target.value as 'image/jpeg' | 'image/png'
          setFormat(v)
          if (file) process(file)
        }}
        className="mb-4 w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
      >
        <option value="image/jpeg">JPEG (smaller)</option>
        <option value="image/png">PNG (lossless pixels, no EXIF)</option>
      </select>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handle(e.dataTransfer.files?.[0] || null)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800',
          drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600'
        )}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <p className="font-medium">{file ? file.name : 'Drop a photo here'}</p>
        {file && <p className="text-sm text-slate-400">Original {formatBytes(file.size)}</p>}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0] || null)} />
      </label>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {(preview || result) && (
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {preview && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Original preview</p>
              <img src={preview} alt="Original" className="rounded-xl border max-h-64 w-full object-contain bg-slate-50" />
            </div>
          )}
          {result && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Cleaned ({formatBytes(outSize)})</p>
              <img src={result} alt="Cleaned" className="rounded-xl border max-h-64 w-full object-contain bg-slate-50" />
              <a
                href={result}
                download={(file?.name || 'photo').replace(/\.[^.]+$/, '') + '-no-exif' + ext}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium"
              >
                <Download className="w-4 h-4" /> Download cleaned image
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
