import { useState } from 'react'
import { Upload, Loader2, Download, Gauge } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { AUDIO_OUTPUTS, MAX_AUDIO_BYTES, baseName, chainAtempo, extOf } from '../lib/audioToolUtils'
import type { AudioOutId } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

type SpeedMode = 'tempo' | 'both'

const PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export default function AudioSpeedChanger() {
  const [file, setFile] = useState<File | null>(null)
  const [speed, setSpeed] = useState(1.25)
  const [mode, setMode] = useState<SpeedMode>('tempo')
  const [format, setFormat] = useState<AudioOutId>('mp3')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const process = async (f: File) => {
    if (f.size > MAX_AUDIO_BYTES) {
      setError('Keep files under ~100 MB.')
      return
    }
    if (speed < 0.25 || speed > 4) {
      setError('Speed must be between 0.25× and 4×.')
      return
    }
    setFile(f)
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      const inName = `in${extOf(f.name) || '.audio'}`
      const outFmt = AUDIO_OUTPUTS.find((o) => o.id === format) || AUDIO_OUTPUTS[0]
      const outName = `speed${outFmt.ext}`
      await ffmpeg.writeFile(inName, await fetchFile(f))

      let af: string
      if (mode === 'tempo') af = chainAtempo(speed)
      else af = `asetrate=44100*${speed},${chainAtempo(speed)},aresample=44100`

      setStatus('Changing speed…')
      const code = await ffmpeg.exec(['-i', inName, '-af', af, ...outFmt.args, outName])
      if (code !== 0) throw new Error('Speed change failed. Try MP3 output or a speed closer to 1×.')
      const data = await ffmpeg.readFile(outName)
      setResult(URL.createObjectURL(new Blob([data as BlobPart], { type: outFmt.mime })))
      setStatus('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Processing failed')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Change Audio Speed</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Speed up or slow down MP3 and WAV — keep pitch (tempo) or change both. Private browser processing.
        </p>
      </div>

      <div className="mb-4 space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          {([
            ['tempo', 'Change tempo (keep pitch)'],
            ['both', 'Change speed + pitch'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', mode === id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 border')}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setSpeed(p)} className={cn('px-3 py-1 rounded-lg text-sm', speed === p ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'bg-white border')}>
              {p}×
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs">Custom speed: {speed.toFixed(2)}×</label>
          <input type="range" min={0.25} max={4} step={0.05} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full" />
        </div>
        <select value={format} onChange={(e) => setFormat(e.target.value as AudioOutId)} className="w-full p-3 rounded-xl border dark:bg-slate-800">
          {AUDIO_OUTPUTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) process(f) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Gauge className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop audio to change speed'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f) }} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <audio src={result} controls className="w-full max-w-md mx-auto" />
          <a href={result} download={`${baseName(file.name)}-${speed}x${AUDIO_OUTPUTS.find((o) => o.id === format)?.ext}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
