import { useState } from 'react'
import { Upload, Loader2, Download } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { cn, formatBytes } from '../lib/utils'

export default function VideoToMp3() {
  const [file, setFile] = useState<File | null>(null)
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
      setStatus('Extracting audio…')
      const inExt = (f.name.match(/\.[^.]+$/) || ['.mp4'])[0]
      await ffmpeg.writeFile(`input${inExt}`, await fetchFile(f))
      const code = await ffmpeg.exec([
        '-i', `input${inExt}`,
        '-vn',
        '-c:a', 'libmp3lame',
        '-b:a', '192k',
        'output.mp3',
      ])
      if (code !== 0) throw new Error('Extraction failed')
      const data = await ffmpeg.readFile('output.mp3')
      setResult(URL.createObjectURL(new Blob([data as BlobPart], { type: 'audio/mpeg' })))
      setStatus('')
    } catch (err: any) {
      setError(err?.message || 'Failed to extract audio')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Video to MP3</h1>
        <p className="text-slate-500 dark:text-slate-400">Extract audio from any video file as MP3 — fully private, in your browser.</p>
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) { setFile(f); convert(f) } }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop a video file here'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); convert(f) } }} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 text-center space-y-3">
          <audio src={result} controls className="w-full max-w-md mx-auto" />
          <a href={result} download={(file?.name || 'audio').replace(/\.[^.]+$/, '') + '.mp3'} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
