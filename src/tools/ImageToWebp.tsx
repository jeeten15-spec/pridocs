import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function ImageToWebp() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [quality, setQuality] = useState(0.85)
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
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
      const webpUrl = canvas.toDataURL('image/webp', quality)
      setResult(webpUrl)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Conversion failed. Browser may not support WebP encoding.')
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
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">Image to WebP Converter Online - Modern Web Formats</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Convert standard images to modern WebP compression formats. Optimize website speeds through local conversions with zero privacy trade-offs.</p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200">
        <label className="block text-sm font-medium mb-2">Quality: {Math.round(quality * 100)}%</label>
        <input
          type="range"
          min="0.5"
          max="1"
          step="0.05"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="w-full"
        />
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
          <p className="font-medium text-slate-700">{file ? file.name : 'Drop an image here or click to browse'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 text-center">
          <div className="mb-4">
            <img src={result} alt="Converted WebP" className="max-h-96 mx-auto rounded-xl border border-slate-200 shadow-sm" />
          </div>
          <a
            href={result}
            download={file?.name.replace(/\.[^.]+$/, '.webp') || 'converted.webp'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      <div className="mt-10 text-center text-sm text-slate-500">
        Your image is processed entirely in your browser. Nothing is uploaded.
      </div>
    </div>
  )
}
