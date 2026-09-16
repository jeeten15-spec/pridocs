import { useState } from 'react'
import { Upload, Loader2, Download, Split } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import JSZip from 'jszip'
import { getFFmpeg } from '../lib/ffmpeg'
import { MAX_AUDIO_BYTES, baseName, extOf, formatTime } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

type Mode = 'silence' | 'interval'

interface Segment {
  name: string
  url: string
  bytes: number
}

export default function SplitAudio() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('silence')
  const [intervalSec, setIntervalSec] = useState(60)
  const [silenceDb, setSilenceDb] = useState(-40)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [segments, setSegments] = useState<Segment[]>([])
  const [zipUrl, setZipUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const clearResults = () => {
    segments.forEach((s) => URL.revokeObjectURL(s.url))
    if (zipUrl) URL.revokeObjectURL(zipUrl)
    setSegments([])
    setZipUrl(null)
  }

  const process = async (f: File) => {
    if (f.size > MAX_AUDIO_BYTES) {
      setError('Keep files under ~100 MB.')
      return
    }
    clearResults()
    setFile(f)
    setBusy(true)
    setError('')
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      const inName = `in${extOf(f.name) || '.audio'}`
      await ffmpeg.writeFile(inName, await fetchFile(f))

      const logs: string[] = []
      const onLog = ({ message }: { message: string }) => logs.push(message)
      ffmpeg.on('log', onLog)

      let cuts: number[] = [0]

      if (mode === 'silence') {
        setStatus('Detecting silence…')
        await ffmpeg.exec([
          '-i', inName,
          '-af', `silencedetect=noise=${silenceDb}dB:d=0.5`,
          '-f', 'null', '-',
        ])
        const silenceEnds: number[] = []
        for (const line of logs) {
          const m = line.match(/silence_end:\s*([\d.]+)/)
          if (m) silenceEnds.push(parseFloat(m[1]))
        }
        cuts = [0, ...silenceEnds]
      } else {
        setStatus('Reading duration…')
        await ffmpeg.exec(['-i', inName, '-f', 'null', '-'])
        let duration = 0
        for (const line of logs) {
          const m = line.match(/Duration:\s*(\d+):(\d+):([\d.]+)/)
          if (m) {
            duration = +m[1] * 3600 + +m[2] * 60 + +m[3]
            break
          }
        }
        if (duration <= 0) throw new Error('Could not read duration')
        const step = Math.max(5, intervalSec)
        cuts = []
        for (let t = 0; t < duration; t += step) cuts.push(t)
      }

      ffmpeg.off('log', onLog)

      // Unique sorted cuts
      cuts = [...new Set(cuts.map((c) => Math.round(c * 100) / 100))].sort((a, b) => a - b)
      if (cuts.length < 2 && mode === 'silence') {
        throw new Error('No silence found. Try a higher threshold (e.g. -30 dB) or use Fixed interval mode.')
      }

      // Get end time from last silence or duration probe again
      let endTime = cuts[cuts.length - 1]
      {
        const durLogs: string[] = []
        const onDur = ({ message }: { message: string }) => durLogs.push(message)
        ffmpeg.on('log', onDur)
        await ffmpeg.exec(['-i', inName, '-f', 'null', '-'])
        ffmpeg.off('log', onDur)
        for (const line of durLogs) {
          const m = line.match(/Duration:\s*(\d+):(\d+):([\d.]+)/)
          if (m) {
            endTime = +m[1] * 3600 + +m[2] * 60 + +m[3]
            break
          }
        }
      }

      const ranges: { start: number; len: number }[] = []
      for (let i = 0; i < cuts.length; i++) {
        const start = cuts[i]
        const next = i + 1 < cuts.length ? cuts[i + 1] : endTime
        const len = next - start
        if (len >= 0.4) ranges.push({ start, len })
      }

      if (ranges.length === 0) throw new Error('No segments to export.')
      if (ranges.length > 40) {
        throw new Error(`Found ${ranges.length} segments — too many for the browser. Try Fixed interval or a quieter silence threshold.`)
      }

      setStatus(`Exporting ${ranges.length} segments…`)
      const zip = new JSZip()
      const out: Segment[] = []
      const stem = baseName(f.name)

      for (let i = 0; i < ranges.length; i++) {
        const { start, len } = ranges[i]
        const outName = `seg${i}.mp3`
        setStatus(`Exporting segment ${i + 1}/${ranges.length} (${formatTime(start)})…`)
        const code = await ffmpeg.exec([
          '-ss', start.toFixed(3),
          '-t', len.toFixed(3),
          '-i', inName,
          '-c:a', 'libmp3lame', '-b:a', '192k',
          outName,
        ])
        if (code !== 0) continue
        const data = await ffmpeg.readFile(outName)
        const blob = new Blob([data as BlobPart], { type: 'audio/mpeg' })
        const url = URL.createObjectURL(blob)
        const name = `${stem}-part${String(i + 1).padStart(2, '0')}.mp3`
        out.push({ name, url, bytes: blob.size })
        zip.file(name, blob)
        try {
          await ffmpeg.deleteFile(outName)
        } catch {
          /* ignore */
        }
      }

      if (out.length === 0) throw new Error('Segment export failed.')
      setStatus('Building ZIP…')
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      setZipUrl(URL.createObjectURL(zipBlob))
      setSegments(out)
      setStatus('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Split failed')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Split Audio</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Split long recordings at silence or fixed intervals — download parts as MP3 or a ZIP. Private, no upload.
        </p>
      </div>

      <div className="mb-4 space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          {([
            ['silence', 'Split at silence'],
            ['interval', 'Fixed interval'],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setMode(id)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', mode === id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 border')}>
              {label}
            </button>
          ))}
        </div>
        {mode === 'silence' ? (
          <div>
            <label className="text-xs">Silence threshold: {silenceDb} dB</label>
            <input type="range" min={-60} max={-20} value={silenceDb} onChange={(e) => setSilenceDb(+e.target.value)} className="w-full" />
          </div>
        ) : (
          <div>
            <label className="text-xs">Interval (seconds)</label>
            <input type="number" min={5} max={600} value={intervalSec} onChange={(e) => setIntervalSec(+e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-800" />
          </div>
        )}
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) process(f) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Split className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop audio to split'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f) }} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {segments.length > 0 && (
        <div className="mt-8 space-y-4">
          {zipUrl && (
            <div className="text-center">
              <a href={zipUrl} download={`${baseName(file?.name || 'audio')}-split.zip`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
                <Download className="w-5 h-5" /> Download all ({segments.length} parts) as ZIP
              </a>
            </div>
          )}
          <ul className="space-y-2">
            {segments.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-white dark:bg-slate-800 text-sm">
                <span className="truncate">{s.name} · {formatBytes(s.bytes)}</span>
                <a href={s.url} download={s.name} className="text-indigo-600 hover:underline shrink-0">Download</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
