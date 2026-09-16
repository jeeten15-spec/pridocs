import { useState } from 'react'
import { Upload, Loader2, Download, Film } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { MAX_VIDEO_BYTES, baseName, extOf } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

type Mode = 'replace' | 'mix'

export default function AddAudioToVideo() {
  const [video, setVideo] = useState<File | null>(null)
  const [audio, setAudio] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('replace')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')

  const process = async () => {
    if (!video || !audio) {
      setError('Add both a video and an audio file.')
      return
    }
    if (video.size > MAX_VIDEO_BYTES) {
      setError('Keep videos under ~80 MB.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      const vName = `v${extOf(video.name) || '.mp4'}`
      const aName = `a${extOf(audio.name) || '.mp3'}`
      const outName = 'out.mp4'
      await ffmpeg.writeFile(vName, await fetchFile(video))
      await ffmpeg.writeFile(aName, await fetchFile(audio))
      setStatus(mode === 'replace' ? 'Replacing audio track…' : 'Mixing audio…')

      let code: number
      if (mode === 'replace') {
        code = await ffmpeg.exec([
          '-i', vName,
          '-i', aName,
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-c:v', 'copy',
          '-c:a', 'aac', '-b:a', '192k',
          '-shortest',
          '-movflags', '+faststart',
          outName,
        ])
      } else {
        code = await ffmpeg.exec([
          '-i', vName,
          '-i', aName,
          '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=shortest:dropout_transition=2[a]',
          '-map', '0:v:0',
          '-map', '[a]',
          '-c:v', 'copy',
          '-c:a', 'aac', '-b:a', '192k',
          '-shortest',
          '-movflags', '+faststart',
          outName,
        ])
      }
      if (code !== 0) {
        // Fallback: re-encode video if copy fails, or silent video without original audio for mix
        if (mode === 'mix') {
          setStatus('Retrying mix (re-encode)…')
          code = await ffmpeg.exec([
            '-i', vName,
            '-i', aName,
            '-filter_complex',
            '[0:a]volume=1[a0];[1:a]volume=1[a1];[a0][a1]amix=inputs=2:duration=shortest[a]',
            '-map', '0:v:0',
            '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
            '-c:a', 'aac', '-b:a', '192k',
            '-shortest',
            '-movflags', '+faststart',
            outName,
          ])
        }
        if (code !== 0) {
          // Silent video + new audio (no original audio track)
          setStatus('Attaching audio to video…')
          code = await ffmpeg.exec([
            '-i', vName,
            '-i', aName,
            '-map', '0:v:0',
            '-map', '1:a:0',
            '-c:v', 'copy',
            '-c:a', 'aac', '-b:a', '192k',
            '-shortest',
            '-movflags', '+faststart',
            outName,
          ])
        }
      }
      if (code !== 0) throw new Error('Could not combine video and audio. Try MP4 + MP3.')

      const data = await ffmpeg.readFile(outName)
      setResult(URL.createObjectURL(new Blob([data as BlobPart], { type: 'video/mp4' })))
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
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Add / Replace Audio on Video</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Replace a video&apos;s soundtrack or mix in new audio — private FFmpeg processing, no upload.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ['replace', 'Replace audio track'],
          ['mix', 'Mix with original'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMode(id)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium', mode === id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 border')}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <label className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800">
          <Film className="w-8 h-8 text-slate-400" />
          <span className="text-sm font-medium text-center">{video ? video.name : 'Choose video'}</span>
          {video && <span className="text-xs text-slate-400">{formatBytes(video.size)}</span>}
          <input type="file" accept="video/*" className="hidden" onChange={(e) => { setVideo(e.target.files?.[0] || null); setResult(null) }} />
        </label>
        <label className="flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800">
          <Upload className="w-8 h-8 text-slate-400" />
          <span className="text-sm font-medium text-center">{audio ? audio.name : 'Choose audio'}</span>
          {audio && <span className="text-xs text-slate-400">{formatBytes(audio.size)}</span>}
          <input type="file" accept="audio/*" className="hidden" onChange={(e) => { setAudio(e.target.files?.[0] || null); setResult(null) }} />
        </label>
      </div>

      <button type="button" onClick={process} disabled={!video || !audio || busy} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {busy ? status || 'Processing…' : 'Create video'}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && video && (
        <div className="mt-8 text-center space-y-3">
          <video src={result} controls className="w-full max-w-md mx-auto rounded-lg" />
          <a href={result} download={`${baseName(video.name)}-with-audio.mp4`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
