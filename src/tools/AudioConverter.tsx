import { useState } from 'react'
import { Upload, Loader2, Download } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { cn, formatBytes } from '../lib/utils'

const FORMATS = [
  { id: 'mp3', label: 'MP3', mime: 'audio/mpeg', ext: '.mp3', args: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { id: 'wav', label: 'WAV', mime: 'audio/wav', ext: '.wav', args: ['-c:a', 'pcm_s16le'] },
  { id: 'aac', label: 'AAC (M4A)', mime: 'audio/mp4', ext: '.m4a', args: ['-c:a', 'aac', '-b:a', '192k'] },
  { id: 'ogg', label: 'OGG Vorbis', mime: 'audio/ogg', ext: '.ogg', args: ['-c:a', 'libvorbis', '-b:a', '192k'] },
  { id: 'flac', label: 'FLAC', mime: 'audio/flac', ext: '.flac', args: ['-c:a', 'flac'] },
]

export default function AudioConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('mp3')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      setStatus('Converting…')

      const inExt = (f.name.match(/\.[^.]+$/) || ['.audio'])[0]
      const inName = `input${inExt}`
      const fmt = FORMATS.find(x => x.id === format) || FORMATS[0]
      const outName = `output${fmt.ext}`

      await ffmpeg.writeFile(inName, await fetchFile(f))
      const code = await ffmpeg.exec(['-i', inName, ...fmt.args, outName])
      if (code !== 0) throw new Error('Conversion failed. Try a different format.')

      const data = await ffmpeg.readFile(outName)
      const blob = new Blob([data as BlobPart], { type: fmt.mime })
      setResult(URL.createObjectURL(blob))
      setStatus('')
    } catch (err: any) {
      setError(err?.message || 'Conversion failed')
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Audio Converter</h1>
        <p className="text-slate-500 dark:text-slate-400">Convert WAV, MP3, AAC, OGG, FLAC and more — entirely in your browser.</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Output format</label>
        <select value={format} onChange={e => setFormat(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600">
          {FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0] || null) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop an audio file here'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={e => handle(e.target.files?.[0] || null)} />
      </label>

      <button
        onClick={() => file && convert(file)}
        disabled={!file || busy}
        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50"
      >
        {busy ? 'Converting…' : `Convert to ${FORMATS.find(f => f.id === format)?.label || format.toUpperCase()}`}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && file && (
        <div className="mt-8 text-center space-y-3">
          <audio src={result} controls className="w-full max-w-md mx-auto" />
          <a
            href={result}
            download={file.name.replace(/\.[^.]+$/, '') + (FORMATS.find(f => f.id === format)?.ext || '.mp3')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium"
          >
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">First conversion downloads the FFmpeg engine (~25 MB). Recommended max ~100–200 MB depending on device RAM.</p>
    </div>
  )
}
