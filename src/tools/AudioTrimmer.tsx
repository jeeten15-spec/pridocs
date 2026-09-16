import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Loader2, Download, Scissors } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import {
  AUDIO_OUTPUTS,
  MAX_AUDIO_BYTES,
  baseName,
  buildWaveformPeaks,
  extOf,
  formatTime,
  getMediaDuration,
} from '../lib/audioToolUtils'
import type { AudioOutId } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

export default function AudioTrimmer() {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [fadeIn, setFadeIn] = useState(0)
  const [fadeOut, setFadeOut] = useState(0)
  const [format, setFormat] = useState<AudioOutId>('mp3')
  const [peaks, setPeaks] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => () => { if (result) URL.revokeObjectURL(result) }, [result])

  const drawWaveform = useCallback((data: number[], selStart: number, selEnd: number, total: number) => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(0, 0, w, h)
    const barW = w / data.length
    const startX = total > 0 ? (selStart / total) * w : 0
    const endX = total > 0 ? (selEnd / total) * w : w
    data.forEach((p, i) => {
      const x = i * barW
      const bh = Math.max(2, p * (h - 8))
      const y = (h - bh) / 2
      const inSel = x + barW / 2 >= startX && x + barW / 2 <= endX
      ctx.fillStyle = inSel ? '#4f46e5' : '#94a3b8'
      ctx.fillRect(x + 1, y, Math.max(1, barW - 2), bh)
    })
    ctx.fillStyle = 'rgba(79, 70, 229, 0.12)'
    ctx.fillRect(startX, 0, Math.max(0, endX - startX), h)
  }, [])

  useEffect(() => {
    drawWaveform(peaks, start, end, duration)
  }, [peaks, start, end, duration, drawWaveform])

  const loadFile = async (f: File) => {
    setError('')
    setResult(null)
    if (f.size > MAX_AUDIO_BYTES) {
      setError('Keep files under ~100 MB for reliable browser trimming.')
      return
    }
    setFile(f)
    setBusy(true)
    setStatus('Analyzing audio…')
    try {
      const d = await getMediaDuration(f)
      const wf = await buildWaveformPeaks(f)
      setDuration(d)
      setStart(0)
      setEnd(d)
      setPeaks(wf)
      setFadeIn(0)
      setFadeOut(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load audio')
      setFile(null)
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  const trimLen = Math.max(0, end - start)

  const process = async () => {
    if (!file || trimLen < 0.1) {
      setError('Select at least 0.1 seconds to keep.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      const inName = `in${extOf(file.name) || '.audio'}`
      const outFmt = AUDIO_OUTPUTS.find((o) => o.id === format) || AUDIO_OUTPUTS[0]
      const outName = `trim${outFmt.ext}`
      await ffmpeg.writeFile(inName, await fetchFile(file))

      const fi = Math.min(fadeIn, trimLen / 2)
      const fo = Math.min(fadeOut, trimLen / 2)
      const filters: string[] = []
      if (fi > 0) filters.push(`afade=t=in:st=0:d=${fi}`)
      if (fo > 0) filters.push(`afade=t=out:st=${Math.max(0, trimLen - fo)}:d=${fo}`)

      const args = ['-ss', start.toFixed(3), '-t', trimLen.toFixed(3), '-i', inName]
      if (filters.length) args.push('-af', filters.join(','))
      args.push(...outFmt.args, outName)

      setStatus('Trimming…')
      const code = await ffmpeg.exec(args)
      if (code !== 0) throw new Error('Trim failed. Try MP3 output or a shorter clip.')

      const data = await ffmpeg.readFile(outName)
      setResult(URL.createObjectURL(new Blob([data as BlobPart], { type: outFmt.mime })))
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
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Audio Trimmer</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Cut MP3, WAV, and other audio with optional fade in/out — private, in your browser.
        </p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f) }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800',
          drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600'
        )}
      >
        {busy && !file ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop an audio file'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)} · {formatTime(duration)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
      </label>

      {file && duration > 0 && (
        <div className="mt-6 space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <canvas ref={canvasRef} width={560} height={80} className="w-full rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600">Start ({formatTime(start)})</label>
              <input type="range" min={0} max={duration} step={0.05} value={start} onChange={(e) => {
                const v = Math.min(+e.target.value, end - 0.05)
                setStart(Math.max(0, v))
              }} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">End ({formatTime(end)})</label>
              <input type="range" min={0} max={duration} step={0.05} value={end} onChange={(e) => {
                const v = Math.max(+e.target.value, start + 0.05)
                setEnd(Math.min(duration, v))
              }} className="w-full" />
            </div>
          </div>
          <p className="text-sm text-slate-600">Selection: <strong>{formatTime(trimLen)}</strong></p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Fade in (sec)</label>
              <input type="number" min={0} max={30} step={0.5} value={fadeIn} onChange={(e) => setFadeIn(+e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800" />
            </div>
            <div>
              <label className="text-xs font-medium">Fade out (sec)</label>
              <input type="number" min={0} max={30} step={0.5} value={fadeOut} onChange={(e) => setFadeOut(+e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Output format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as AudioOutId)} className="w-full p-2 rounded-lg border dark:bg-slate-800">
              {AUDIO_OUTPUTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
          <button type="button" onClick={process} disabled={busy} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
            {busy ? 'Processing…' : 'Trim & download'}
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <audio src={result} controls className="w-full max-w-md mx-auto" />
          <a href={result} download={`${baseName(file.name)}-trimmed${AUDIO_OUTPUTS.find((o) => o.id === format)?.ext}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
