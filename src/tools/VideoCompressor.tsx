import { useState } from 'react'
import { Upload, Loader2, Download, Minimize2 } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { MAX_VIDEO_BYTES, baseName, extOf } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

const PRESETS = [
  { id: 'light', label: 'Light (720p, smaller file)', crf: 26, scale: 1280 },
  { id: 'medium', label: 'Medium (480p, email-friendly)', crf: 28, scale: 854 },
  { id: 'heavy', label: 'Heavy (360p, smallest)', crf: 30, scale: 640 },
] as const

export default function VideoCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['id']>('medium')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [outBytes, setOutBytes] = useState(0)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const process = async (f: File) => {
    if (f.size > MAX_VIDEO_BYTES) {
      setError('Keep videos under ~80 MB for reliable browser compression.')
      return
    }
    setFile(f)
    setBusy(true)
    setError('')
    setResult(null)
    const p = PRESETS.find((x) => x.id === preset) || PRESETS[1]
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      const inName = `in${extOf(f.name) || '.mp4'}`
      const outName = 'compressed.mp4'
      await ffmpeg.writeFile(inName, await fetchFile(f))
      setStatus('Compressing video…')
      const code = await ffmpeg.exec([
        '-i', inName,
        '-vf', `scale='min(${p.scale},iw)':-2`,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', String(p.crf),
        '-c:a', 'aac', '-b:a', '96k',
        '-movflags', '+faststart',
        outName,
      ])
      if (code !== 0) throw new Error('Compression failed. Try Light preset or a shorter video.')
      const data = await ffmpeg.readFile(outName)
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' })
      setOutBytes(blob.size)
      setResult(URL.createObjectURL(blob))
      setStatus('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Compression failed')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Video Compressor</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Shrink MP4 for email and WhatsApp — compress video privately in your browser, no upload.
        </p>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium">Compression level</label>
        <select value={preset} onChange={(e) => setPreset(e.target.value as typeof preset)} className="w-full p-3 rounded-xl border dark:bg-slate-800 mt-1">
          {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) process(f) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Minimize2 className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop a video to compress'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">Original: {formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f) }} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <video src={result} controls className="w-full max-w-md mx-auto rounded-lg" />
          <p className="text-sm text-slate-500">
            {formatBytes(file.size)} → <strong>{formatBytes(outBytes)}</strong>
            {outBytes < file.size && (
              <span className="text-emerald-600"> ({Math.round((1 - outBytes / file.size) * 100)}% smaller)</span>
            )}
          </p>
          <a href={result} download={`${baseName(file.name)}-compressed.mp4`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
