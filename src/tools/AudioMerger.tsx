import { useCallback, useEffect, useState } from 'react'
import { Upload, Loader2, Download, ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { cn, formatBytes } from '../lib/utils'

const ACCEPT =
  'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.wma,.aiff,.aif,.opus,.webm'

const OUTPUTS = [
  { id: 'mp3', label: 'MP3', mime: 'audio/mpeg', ext: '.mp3', args: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { id: 'wav', label: 'WAV', mime: 'audio/wav', ext: '.wav', args: ['-c:a', 'pcm_s16le'] },
  { id: 'm4a', label: 'AAC (M4A)', mime: 'audio/mp4', ext: '.m4a', args: ['-c:a', 'aac', '-b:a', '192k'] },
] as const

type OutId = (typeof OUTPUTS)[number]['id']

interface Track {
  id: string
  file: File
}

function extOf(name: string) {
  const m = name.match(/\.[^.]+$/)
  return m ? m[0].toLowerCase() : '.audio'
}

function buildAudioFilter(trackCount: number, crossfadeSec: number) {
  const parts: string[] = []
  for (let i = 0; i < trackCount; i++) {
    parts.push(
      `[${i}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${i}]`
    )
  }

  if (crossfadeSec <= 0) {
    const inputs = Array.from({ length: trackCount }, (_, i) => `[a${i}]`).join('')
    parts.push(`${inputs}concat=n=${trackCount}:v=0:a=1[aout]`)
    return parts.join(';')
  }

  let prev = 'a0'
  for (let i = 1; i < trackCount; i++) {
    const out = i === trackCount - 1 ? 'aout' : `af${i}`
    parts.push(`[${prev}][a${i}]acrossfade=d=${crossfadeSec}:c1=tri:c2=tri[${out}]`)
    prev = out
  }
  return parts.join(';')
}

export default function AudioMerger() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [crossfadeOn, setCrossfadeOn] = useState(true)
  const [crossfadeSec, setCrossfadeSec] = useState(3)
  const [format, setFormat] = useState<OutId>('mp3')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result)
    }
  }, [result])

  const addFiles = useCallback((list: FileList | File[] | null) => {
    if (!list || list.length === 0) return
    const next: Track[] = Array.from(list).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
    }))
    setTracks((prev) => [...prev, ...next])
    setResult(null)
    setError('')
  }, [])

  const move = (index: number, dir: -1 | 1) => {
    setTracks((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const copy = [...prev]
      ;[copy[index], copy[j]] = [copy[j], copy[index]]
      return copy
    })
    setResult(null)
  }

  const remove = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id))
    setResult(null)
  }

  const merge = async () => {
    if (tracks.length < 2) {
      setError('Add at least two audio files to merge.')
      return
    }

    const fade = crossfadeOn ? Math.max(0, Math.min(12, crossfadeSec)) : 0
    setBusy(true)
    setError('')
    setResult(null)

    const written: string[] = []
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      setStatus('Writing tracks into FFmpeg…')

      for (let i = 0; i < tracks.length; i++) {
        const name = `in${i}${extOf(tracks[i].file.name)}`
        await ffmpeg.writeFile(name, await fetchFile(tracks[i].file))
        written.push(name)
      }

      const outFmt = OUTPUTS.find((o) => o.id === format) || OUTPUTS[0]
      const outName = `merged${outFmt.ext}`
      const filter = buildAudioFilter(tracks.length, fade)

      setStatus(fade > 0 ? `Merging with ${fade}s crossfade…` : 'Concatenating tracks…')

      const args: string[] = []
      for (const name of written) {
        args.push('-i', name)
      }
      args.push('-filter_complex', filter, '-map', '[aout]', ...outFmt.args, outName)

      const code = await ffmpeg.exec(args)
      if (code !== 0) {
        throw new Error(
          fade > 0
            ? 'Merge failed. Try a shorter crossfade, or turn crossfade off. Each track must be longer than the fade.'
            : 'Merge failed. Try converting tracks to MP3/WAV first, or use fewer files.'
        )
      }

      const data = await ffmpeg.readFile(outName)
      const blob = new Blob([data as BlobPart], { type: outFmt.mime })
      setResult(URL.createObjectURL(blob))
      setStatus('')

      try {
        await ffmpeg.deleteFile(outName)
      } catch {
        /* ignore */
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Merge failed'
      setError(msg)
      setStatus('')
    } finally {
      try {
        const ffmpeg = await getFFmpeg()
        for (const name of written) {
          try {
            await ffmpeg.deleteFile(name)
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
      setBusy(false)
    }
  }

  const outLabel = OUTPUTS.find((o) => o.id === format)?.label || 'MP3'
  const outExt = OUTPUTS.find((o) => o.id === format)?.ext || '.mp3'
  const totalBytes = tracks.reduce((n, t) => n + t.file.size, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Merge Audio / Join MP3 Files
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Combine two or more MP3, WAV, M4A, OGG, or FLAC tracks into one file — with optional crossfade between songs.
          Runs entirely in your browser.
        </p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800',
          drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600'
        )}
      >
        {busy ? (
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-slate-400" />
        )}
        <div className="text-center">
          <p className="font-medium text-slate-800 dark:text-slate-100">Drop audio files here</p>
          <p className="text-sm text-slate-400 mt-1">MP3, WAV, M4A, AAC, OGG, FLAC, and more</p>
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {tracks.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {tracks.length} track{tracks.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}
            </span>
            <label className="inline-flex items-center gap-1.5 text-indigo-600 cursor-pointer font-medium">
              <Plus className="w-4 h-4" />
              Add more
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
          </div>

          <ul className="space-y-2">
            {tracks.map((t, i) => (
              <li
                key={t.id}
                className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-semibold flex items-center justify-center text-slate-600 dark:text-slate-200">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-100">{t.file.name}</p>
                  <p className="text-xs text-slate-400">{formatBytes(t.file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || busy}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === tracks.length - 1 || busy}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  disabled={busy}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-30"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={crossfadeOn}
            onChange={(e) => setCrossfadeOn(e.target.checked)}
            className="mt-1"
            disabled={busy}
          />
          <span>
            <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">
              Crossfade between songs
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Overlap the end of one track with the start of the next for a smooth DJ-style transition.
            </span>
          </span>
        </label>

        {crossfadeOn && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-300">Crossfade length</span>
              <span className="font-medium text-slate-800 dark:text-slate-100">{crossfadeSec.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={12}
              step={0.5}
              value={crossfadeSec}
              onChange={(e) => setCrossfadeSec(Number(e.target.value))}
              disabled={busy}
              className="w-full"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Each track should be longer than the fade. If merge fails, shorten the fade or turn it off.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Output format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as OutId)}
            disabled={busy}
            className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
          >
            {OUTPUTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={merge}
        disabled={tracks.length < 2 || busy}
        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50"
      >
        {busy
          ? 'Merging…'
          : `Merge ${tracks.length || 0} tracks → ${outLabel}${crossfadeOn ? ` (${crossfadeSec}s fade)` : ''}`}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 text-center space-y-3">
          <audio src={result} controls className="w-full max-w-md mx-auto" />
          <a
            href={result}
            download={`pridocs-merged${outExt}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium"
          >
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}

      <section className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Private MP3 joiner with crossfade
        </h2>
        <p>
          Use this tool to <strong>merge MP3 files</strong>, join a playlist into one continuous track, or stitch podcast
          segments together. Files never leave your device — processing uses FFmpeg.wasm in the browser.
        </p>
        <p>
          Enable <strong>crossfade</strong> when you want a smooth blend between songs (typical DJ / mixtape feel). Leave
          it off for a hard cut / simple concatenate. Also try our{' '}
          <a href="/tools/audio-converter" className="text-indigo-600 hover:underline">
            Audio Converter
          </a>{' '}
          and{' '}
          <a href="/tools/audio-trimmer" className="text-indigo-600 hover:underline">
            Audio Trimmer
          </a>
          .
        </p>
      </section>

      <p className="mt-6 text-center text-xs text-slate-500">
        First run downloads the FFmpeg engine (~25 MB). Keep total audio size reasonable for your device RAM (often under
        100–200 MB).
      </p>
    </div>
  )
}
