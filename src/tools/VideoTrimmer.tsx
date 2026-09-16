import { useEffect, useState } from 'react'
import { Upload, Loader2, Download, Scissors, Film } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { MAX_VIDEO_BYTES, baseName, extOf, formatTime, getMediaDuration } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

export default function VideoTrimmer() {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (result) URL.revokeObjectURL(result)
  }, [previewUrl, result])

  const loadFile = async (f: File) => {
    setError('')
    setResult(null)
    if (f.size > MAX_VIDEO_BYTES) {
      setError('Keep videos under ~80 MB for reliable browser trimming.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    setFile(f)
    try {
      const d = await getMediaDuration(f)
      setDuration(d)
      setStart(0)
      setEnd(d)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not read video')
      setFile(null)
    }
  }

  const trimLen = Math.max(0, end - start)

  const process = async () => {
    if (!file || trimLen < 0.5) {
      setError('Select at least 0.5 seconds to keep.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      const inName = `in${extOf(file.name) || '.mp4'}`
      const outName = 'trim.mp4'
      await ffmpeg.writeFile(inName, await fetchFile(file))
      setStatus('Trimming video…')
      const code = await ffmpeg.exec([
        '-ss', start.toFixed(3),
        '-t', trimLen.toFixed(3),
        '-i', inName,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        outName,
      ])
      if (code !== 0) throw new Error('Trim failed. Try a shorter clip or re-export as MP4 first.')
      const data = await ffmpeg.readFile(outName)
      setResult(URL.createObjectURL(new Blob([data as BlobPart], { type: 'video/mp4' })))
      setStatus('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Trim failed')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Video Trimmer</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Cut MP4 and other videos online — no upload, no watermark, private in your browser.
        </p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy && !file ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Film className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop a video file'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)} · {formatTime(duration)}</p>}
        </div>
        <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
      </label>

      {previewUrl && file && duration > 0 && (
        <div className="mt-6 space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border dark:border-slate-700">
          <video src={previewUrl} controls className="w-full rounded-lg max-h-64 bg-black" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Start ({formatTime(start)})</label>
              <input type="range" min={0} max={duration} step={0.1} value={start} onChange={(e) => setStart(Math.min(+e.target.value, end - 0.1))} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-medium">End ({formatTime(end)})</label>
              <input type="range" min={0} max={duration} step={0.1} value={end} onChange={(e) => setEnd(Math.max(+e.target.value, start + 0.1))} className="w-full" />
            </div>
          </div>
          <p className="text-sm text-slate-600">Clip length: <strong>{formatTime(trimLen)}</strong></p>
          {status && <p className="text-sm text-indigo-500">{status}</p>}
          <button type="button" onClick={process} disabled={busy} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
            {busy ? 'Trimming…' : 'Trim & export MP4'}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <video src={result} controls className="w-full max-w-md mx-auto rounded-lg" />
          <a href={result} download={`${baseName(file.name)}-trimmed.mp4`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
