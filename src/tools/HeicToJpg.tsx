import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

interface HeicToJpgProps {
  /** When true, hides the tool's own H1/intro — used when embedded inside a landing page that already has its own H1. */
  embedded?: boolean
}

export default function HeicToJpg({ embedded = false }: HeicToJpgProps) {
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setResults([])
    try {
      // Dynamic import to keep this out of the main bundle until someone actually uses it.
      const heic2any = (await import('heic2any')).default
      const output = await heic2any({ blob: f, toType: 'image/jpeg', quality: 0.9 })
      const blobs = Array.isArray(output) ? output : [output]
      setResults(blobs.map((b) => URL.createObjectURL(b as Blob)))
    } catch (err: any) {
      console.error(err)
      setError('Could not convert this file. Make sure it is a valid HEIC/HEIF photo (some very new iPhone formats or already-converted files may not be supported).')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    if (!f.name.match(/\.(heic|heif)$/i) && !f.type.match(/hei[cf]/i)) {
      setError('Please select a .heic or .heif file')
      return
    }
    setFile(f)
    convert(f)
  }

  return (
    <div className={embedded ? '' : 'max-w-2xl mx-auto px-4 py-10'}>
      {!embedded && (
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Free HEIC to JPG Converter (100% Private)</h1>
          <p className="text-slate-500 max-w-xl mx-auto">Convert iPhone HEIC photos to universally-compatible JPG images, processed entirely in your browser.</p>
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
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium text-slate-700">{file ? file.name : 'Drop a HEIC file here or click to browse'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {busy && <p className="text-xs text-slate-400 mt-1">Converting… this can take a few seconds for large photos</p>}
        </div>
        <input type="file" accept=".heic,.heif,image/heic,image/heif" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {results.length > 0 && (
        <div className="mt-8">
          <div className={cn('grid gap-4', results.length > 1 ? 'sm:grid-cols-2' : '')}>
            {results.map((src, i) => (
              <div key={i} className="text-center">
                <img src={src} alt={`Converted JPG ${i + 1}`} className="max-h-96 mx-auto rounded-xl border border-slate-200 shadow-sm mb-4" />
                <a
                  href={src}
                  download={file ? file.name.replace(/\.(heic|heif)$/i, results.length > 1 ? `-${i + 1}.jpg` : '.jpg') : `converted-${i + 1}.jpg`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  <Download className="w-5 h-5" /> Download JPG
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 text-center text-sm text-slate-500">
        Your photo is decoded and converted entirely in your browser. Nothing is uploaded.
      </div>
    </div>
  )
}
