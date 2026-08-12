import { useState } from 'react'
import { Download, Upload, Loader2, Film } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { cn, formatBytes } from '../lib/utils'

const MAX_BYTES = 80 * 1024 * 1024

export default function VideoToGif() {
  const [file, setFile] = useState<File | null>(null)
  const [seconds, setSeconds] = useState(5)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    if (f.size > MAX_BYTES) {
      setError('Keep videos under ~80 MB for reliable browser conversion.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      setStatus('Writing video…')
      const inExt = (f.name.match(/\.[^.]+$/) || ['.mp4'])[0]
      const inName = `input${inExt}`
      await ffmpeg.writeFile(inName, await fetchFile(f))
      setStatus('Encoding GIF…')
      const t = Math.max(1, Math.min(30, seconds))
      const code = await ffmpeg.exec([
        '-i',
        inName,
        '-t',
        String(t),
        '-vf',
        'fps=10,scale=320:-1:flags=lanczos',
        '-loop',
        '0',
        'out.gif',
      ])
      if (code !== 0) throw new Error('GIF conversion failed. Try a shorter clip.')
      const data = await ffmpeg.readFile('out.gif')
      setResult(URL.createObjectURL(new Blob([data as BlobPart], { type: 'image/gif' })))
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
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Video to GIF</h1>
        <p className="text-slate-500">Convert a short video clip to GIF with FFmpeg.wasm — private, in your browser.</p>
      </div>

      <div className="mb-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
        <strong>File size:</strong> Keep videos under ~50–80 MB. Default export uses the first few seconds at 10 fps /
        320px wide for a manageable GIF.
      </div>

      <label className="block text-sm font-medium mb-1">Max duration (seconds)</label>
      <input
        type="number"
        min={1}
        max={30}
        value={seconds}
        onChange={(e) => setSeconds(Number(e.target.value) || 5)}
        className="mb-4 w-full p-3 rounded-xl border dark:bg-slate-800"
      />

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handle(e.dataTransfer.files?.[0] || null)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
          drag ? 'border-indigo-400' : 'border-slate-200'
        )}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Film className="w-10 h-10 text-slate-400" />}
        <p className="font-medium">{file ? file.name : 'Drop a video here'}</p>
        {file && <p className="text-sm text-slate-400">{formatBytes(file.size)}</p>}
        {status && <p className="text-sm text-indigo-500">{status}</p>}
        <input type="file" accept="video/*" className="hidden" onChange={(e) => handle(e.target.files?.[0] || null)} />
      </label>

      <button
        type="button"
        onClick={() => file && convert(file)}
        disabled={!file || busy}
        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        Convert to GIF
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-6 text-center space-y-3">
          <img src={result} alt="GIF preview" className="mx-auto rounded-xl border max-w-full" />
          <a href={result} download={(file?.name || 'clip').replace(/\.[^.]+$/, '') + '.gif'} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-4 h-4" /> Download GIF
          </a>
        </div>
      )}
    </div>
  )
}
