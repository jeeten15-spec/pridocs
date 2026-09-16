import { useState } from 'react'
import { Upload, Loader2, Download, VolumeX } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { AUDIO_OUTPUTS, MAX_AUDIO_BYTES, baseName, extOf } from '../lib/audioToolUtils'
import type { AudioOutId } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

const PRESETS = [
  { id: 'light', label: 'Light', threshold: -45, minSilence: 0.35 },
  { id: 'normal', label: 'Normal', threshold: -40, minSilence: 0.5 },
  { id: 'aggressive', label: 'Aggressive', threshold: -35, minSilence: 0.25 },
] as const

export default function RemoveSilence() {
  const [file, setFile] = useState<File | null>(null)
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['id']>('normal')
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
    setFile(f)
    setBusy(true)
    setError('')
    setResult(null)
    const p = PRESETS.find((x) => x.id === preset) || PRESETS[1]
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      const inName = `in${extOf(f.name) || '.audio'}`
      const outFmt = AUDIO_OUTPUTS.find((o) => o.id === format) || AUDIO_OUTPUTS[0]
      const outName = `nosilence${outFmt.ext}`
      await ffmpeg.writeFile(inName, await fetchFile(f))
      setStatus('Removing silence…')
      const af = [
        `silenceremove=stop_periods=-1:stop_duration=${p.minSilence}:stop_threshold=${p.threshold}dB:detection=peak`,
        'areverse',
        `silenceremove=stop_periods=-1:stop_duration=${p.minSilence}:stop_threshold=${p.threshold}dB:detection=peak`,
        'areverse',
      ].join(',')
      const code = await ffmpeg.exec(['-i', inName, '-af', af, ...outFmt.args, outName])
      if (code !== 0) throw new Error('Could not remove silence. Try Normal preset or MP3 output.')
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
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Remove Silence from Audio</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Cut dead air from podcasts, voice notes, and recordings — locally, no upload.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Strength</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value as typeof preset)} className="w-full p-3 rounded-xl border dark:bg-slate-800">
            {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Output</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as AudioOutId)} className="w-full p-3 rounded-xl border dark:bg-slate-800">
            {AUDIO_OUTPUTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) process(f) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <VolumeX className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop audio to strip silence'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f) }} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <audio src={result} controls className="w-full max-w-md mx-auto" />
          <a href={result} download={`${baseName(file.name)}-no-silence${AUDIO_OUTPUTS.find((o) => o.id === format)?.ext}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
