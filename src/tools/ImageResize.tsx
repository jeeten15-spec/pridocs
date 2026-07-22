import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function ImageResize() {
  const [file, setFile] = useState<File | null>(null)
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [keepRatio, setKeepRatio] = useState(true)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [originalSize, setOriginalSize] = useState({ w: 0, h: 0 })

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const bitmap = await createImageBitmap(f)
      setOriginalSize({ w: bitmap.width, h: bitmap.height })

      let targetW = width
      let targetH = height
      if (keepRatio && originalSize.w === 0) {
        // first load – set defaults from image
        targetW = bitmap.width
        targetH = bitmap.height
        setWidth(bitmap.width)
        setHeight(bitmap.height)
      } else if (keepRatio && width > 0) {
        const ratio = bitmap.height / bitmap.width
        targetH = Math.round(width * ratio)
        setHeight(targetH)
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetW || bitmap.width
      canvas.height = targetH || bitmap.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setResult(dataUrl)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Resize failed. Please try a different image.')
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
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Image Resize & Compress</h1>
        <p className="text-slate-500">Resize and compress images locally in your browser.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Target Size (pixels)</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={width}
                onChange={e => setWidth(Number(e.target.value))}
                className="w-full p-3 rounded-xl border"
                placeholder="Width"
                min="1"
              />
              <input
                type="number"
                value={height}
                onChange={e => setHeight(Number(e.target.value))}
                className="w-full p-3 rounded-xl border"
                placeholder="Height"
                min="1"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={keepRatio} onChange={e => setKeepRatio(e.target.checked)} />
            Keep aspect ratio
          </label>
          {originalSize.w > 0 && (
            <p className="text-xs text-slate-500">Original: {originalSize.w} × {originalSize.h} px</p>
          )}
        </div>

        <label
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200'
          )}
        >
          {busy ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /> : <Upload className="w-8 h-8 text-slate-400" />}
          <div className="text-center text-sm">
            {file ? file.name : 'Drop image here or click to browse'}
            {file && <p className="text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
        </label>
      </div>

      <button
        onClick={() => file && convert(file)}
        disabled={!file || busy}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50 font-medium"
      >
        {busy ? 'Processing…' : 'Resize & Compress'}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 text-center">
          <img src={result} alt="Resized" className="max-h-96 mx-auto rounded-xl border border-slate-200 shadow-sm mb-4" />
          <a
            href={result}
            download={file?.name.replace(/\.[^.]+$/, '') + '-resized.jpg' || 'resized.jpg'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium"
          >
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}
    </div>
  )
}
