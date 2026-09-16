import { useState } from 'react'
import { Upload, Loader2, Download } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { MAX_AUDIO_BYTES, baseName, extOf } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

type FormatId = 'mp3' | 'wav' | 'aac' | 'ogg' | 'flac' | 'opus'

const BITRATES = ['96k', '128k', '192k', '256k', '320k'] as const

function buildArgs(format: FormatId, bitrate: string): { mime: string; ext: string; args: string[] } {
  switch (format) {
    case 'mp3':
      return { mime: 'audio/mpeg', ext: '.mp3', args: ['-c:a', 'libmp3lame', '-b:a', bitrate] }
    case 'wav':
      return { mime: 'audio/wav', ext: '.wav', args: ['-c:a', 'pcm_s16le'] }
    case 'aac':
      return { mime: 'audio/mp4', ext: '.m4a', args: ['-c:a', 'aac', '-b:a', bitrate] }
    case 'ogg':
      return { mime: 'audio/ogg', ext: '.ogg', args: ['-c:a', 'libvorbis', '-b:a', bitrate] }
    case 'flac':
      return { mime: 'audio/flac', ext: '.flac', args: ['-c:a', 'flac'] }
    case 'opus':
      return { mime: 'audio/ogg', ext: '.opus', args: ['-c:a', 'libopus', '-b:a', bitrate] }
  }
}

const FORMAT_LABELS: { id: FormatId; label: string }[] = [
  { id: 'mp3', label: 'MP3' },
  { id: 'wav', label: 'WAV' },
  { id: 'aac', label: 'AAC (M4A)' },
  { id: 'ogg', label: 'OGG Vorbis' },
  { id: 'flac', label: 'FLAC' },
  { id: 'opus', label: 'Opus' },
]

interface AudioConverterProps {
  embedded?: boolean
  defaultFormat?: string
}

export default function AudioConverter({ embedded = false, defaultFormat = 'mp3' }: AudioConverterProps) {
  const initial = (FORMAT_LABELS.some((f) => f.id === defaultFormat) ? defaultFormat : 'mp3') as FormatId
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<FormatId>(initial)
  const [bitrate, setBitrate] = useState<string>('192k')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const needsBitrate = format === 'mp3' || format === 'aac' || format === 'ogg' || format === 'opus'

  const convert = async (f: File) => {
    if (f.size > MAX_AUDIO_BYTES) {
      setError('Keep files under ~100 MB.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      setStatus('Converting…')
      const inName = `input${extOf(f.name) || '.audio'}`
      const out = buildArgs(format, bitrate)
      const outName = `output${out.ext}`
      await ffmpeg.writeFile(inName, await fetchFile(f))
      const code = await ffmpeg.exec(['-i', inName, ...out.args, outName])
      if (code !== 0) throw new Error('Conversion failed. Try a different format or bitrate.')
      const data = await ffmpeg.readFile(outName)
      setResult(URL.createObjectURL(new Blob([data as BlobPart], { type: out.mime })))
      setStatus('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Conversion failed')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  const handle = (f: File | null) => {
    if (!f) return
    setFile(f)
    setResult(null)
  }

  const out = buildArgs(format, bitrate)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {!embedded && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Audio Converter</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Convert to MP3, WAV, AAC, OGG, FLAC, or Opus with bitrate presets — entirely in your browser.
          </p>
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Output format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as FormatId)} className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600">
            {FORMAT_LABELS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
        {needsBitrate && (
          <div>
            <label className="block text-sm font-medium mb-1">Bitrate</label>
            <select value={bitrate} onChange={(e) => setBitrate(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600">
              {BITRATES.map((b) => (
                <option key={b} value={b}>{b}{b === '320k' ? ' (highest)' : b === '128k' ? ' (standard)' : ''}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0] || null) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop an audio file here'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => handle(e.target.files?.[0] || null)} />
      </label>

      <button
        onClick={() => file && convert(file)}
        disabled={!file || busy}
        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50"
      >
        {busy ? 'Converting…' : `Convert to ${FORMAT_LABELS.find((f) => f.id === format)?.label || format.toUpperCase()}${needsBitrate ? ` @ ${bitrate}` : ''}`}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <audio src={result} controls className="w-full max-w-md mx-auto" />
          <a
            href={result}
            download={`${baseName(file.name)}${out.ext}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium"
          >
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">First conversion downloads the FFmpeg engine (~25 MB). Recommended max ~100 MB depending on device RAM.</p>
    </div>
  )
}
