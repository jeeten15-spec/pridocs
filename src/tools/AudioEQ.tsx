import { useState } from 'react'
import { Upload, Loader2, Download, SlidersHorizontal } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { AUDIO_OUTPUTS, MAX_AUDIO_BYTES, baseName, extOf } from '../lib/audioToolUtils'
import type { AudioOutId } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

export default function AudioEQ() {
  const [file, setFile] = useState<File | null>(null)
  const [bass, setBass] = useState(0)
  const [mid, setMid] = useState(0)
  const [treble, setTreble] = useState(0)
  const [highpass, setHighpass] = useState(0)
  const [lowpass, setLowpass] = useState(0)
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
    try {
      const filters: string[] = []
      if (highpass > 0) filters.push(`highpass=f=${highpass}`)
      if (lowpass > 0) filters.push(`lowpass=f=${lowpass}`)
      if (bass !== 0) filters.push(`equalizer=f=100:width_type=o:width=2:g=${bass}`)
      if (mid !== 0) filters.push(`equalizer=f=1000:width_type=o:width=1.5:g=${mid}`)
      if (treble !== 0) filters.push(`equalizer=f=8000:width_type=o:width=2:g=${treble}`)
      if (filters.length === 0) throw new Error('Adjust at least one EQ control before processing.')

      const ffmpeg = await getFFmpeg(setStatus)
      const inName = `in${extOf(f.name) || '.audio'}`
      const outFmt = AUDIO_OUTPUTS.find((o) => o.id === format) || AUDIO_OUTPUTS[0]
      const outName = `eq${outFmt.ext}`
      await ffmpeg.writeFile(inName, await fetchFile(f))
      setStatus('Applying EQ…')
      const code = await ffmpeg.exec(['-i', inName, '-af', filters.join(','), ...outFmt.args, outName])
      if (code !== 0) throw new Error('EQ failed. Try milder settings or MP3 output.')
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
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Audio EQ</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Bass, mid, treble plus optional high-pass / low-pass filters — simple EQ for voice and music, no upload.
        </p>
      </div>

      <div className="mb-4 space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border dark:border-slate-700">
        {([
          ['Bass (100 Hz)', bass, setBass, -12, 12],
          ['Mid (1 kHz)', mid, setMid, -12, 12],
          ['Treble (8 kHz)', treble, setTreble, -12, 12],
        ] as const).map(([label, val, set, min, max]) => (
          <div key={label}>
            <label className="text-xs font-medium">{label}: {val > 0 ? '+' : ''}{val} dB</label>
            <input type="range" min={min} max={max} step={1} value={val} onChange={(e) => set(+e.target.value)} className="w-full" />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium">High-pass (cut rumble): {highpass > 0 ? `${highpass} Hz` : 'off'}</label>
          <input type="range" min={0} max={300} step={10} value={highpass} onChange={(e) => setHighpass(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-xs font-medium">Low-pass (cut hiss): {lowpass > 0 ? `${lowpass} Hz` : 'off'}</label>
          <input type="range" min={0} max={16000} step={500} value={lowpass} onChange={(e) => setLowpass(+e.target.value)} className="w-full" />
          <p className="text-[11px] text-slate-500 mt-1">0 = off. Typical voice low-pass: 8000–12000 Hz.</p>
        </div>
        <select value={format} onChange={(e) => setFormat(e.target.value as AudioOutId)} className="w-full p-3 rounded-xl border dark:bg-slate-800">
          {AUDIO_OUTPUTS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) process(f) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <SlidersHorizontal className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop audio to EQ'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f) }} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <audio src={result} controls className="w-full max-w-md mx-auto" />
          <a href={result} download={`${baseName(file.name)}-eq${AUDIO_OUTPUTS.find((o) => o.id === format)?.ext}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
