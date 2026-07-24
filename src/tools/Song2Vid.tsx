import { useState, useRef, useCallback } from 'react'
import { Film, Music, Image as ImageIcon, Upload, Loader2, Download, X, GripVertical, Play, Shield } from 'lucide-react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { cn, formatBytes } from '../lib/utils'

interface MediaItem {
  id: string
  file: File
  url: string
  type: 'image' | 'video' | 'gif'
}

export default function Song2Vid() {
  const [audio, setAudio] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [items, setItems] = useState<MediaItem[]>([])
  const [busy, setBusy] = useState(false)
  const [loadingEngine, setLoadingEngine] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [dragOver, setDragOver] = useState<'audio' | 'media' | null>(null)

  const [loopVisuals, setLoopVisuals] = useState(true)
  const [loopAudio, setLoopAudio] = useState(false)
  const [fadeIn, setFadeIn] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [clipAudioStart, setClipAudioStart] = useState(0)
  const [clipAudioEnd, setClipAudioEnd] = useState(0)
  const [secondsPerImage, setSecondsPerImage] = useState(5)

  const ffmpegRef = useRef<FFmpeg | null>(null)
  const engineLoaded = useRef(false)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const logLines = useRef<string[]>([])

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && engineLoaded.current) return ffmpegRef.current

    setLoadingEngine(true)
    setStatus('Loading FFmpeg engine (first time only)…')
    setError('')
    logLines.current = []

    try {
      const ffmpeg = new FFmpeg()

      ffmpeg.on('log', ({ message }) => {
        logLines.current.push(message)
        // Keep last 30 lines for debugging
        if (logLines.current.length > 30) logLines.current.shift()
      })

      ffmpeg.on('progress', ({ progress: p }) => {
        if (p > 0 && p <= 1) setProgress(Math.min(99, Math.round(p * 100)))
      })

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      setStatus('Downloading FFmpeg core…')
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
      setStatus('Downloading FFmpeg WASM…')
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      setStatus('Initializing engine…')
      await ffmpeg.load({ coreURL, wasmURL })

      ffmpegRef.current = ffmpeg
      engineLoaded.current = true
      setStatus('')
      return ffmpeg
    } catch (err: any) {
      setError('Failed to load FFmpeg. Check your internet connection and try again.')
      throw err
    } finally {
      setLoadingEngine(false)
    }
  }, [])

  const handleAudio = (file: File | null) => {
    if (!file) return
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudio(file)
    setAudioUrl(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  const detectType = (f: File): MediaItem['type'] => {
    if (f.type === 'image/gif' || f.name.toLowerCase().endsWith('.gif')) return 'gif'
    if (f.type.startsWith('video/')) return 'video'
    return 'image'
  }

  const handleMedia = (files: FileList | File[]) => {
    const list = Array.from(files)
    const newItems: MediaItem[] = list
      .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
      .map(f => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        url: URL.createObjectURL(f),
        type: detectType(f),
      }))
    setItems(prev => [...prev, ...newItems])
    setResult(null)
    setError('')
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter(i => i.id !== id)
    })
  }

  const onDragStart = (i: number) => { dragItem.current = i }
  const onDragEnter = (i: number) => { dragOverItem.current = i }
  const onDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const copy = [...items]
    const [dragged] = copy.splice(dragItem.current, 1)
    copy.splice(dragOverItem.current, 0, dragged)
    setItems(copy)
    dragItem.current = null
    dragOverItem.current = null
  }

  const run = async (ffmpeg: FFmpeg, args: string[]) => {
    logLines.current = []
    const code = await ffmpeg.exec(args)
    if (code !== 0) {
      const tail = logLines.current.slice(-8).join('\n')
      throw new Error(`FFmpeg failed (code ${code}).\n${tail || 'No log output'}`)
    }
  }

  const encode = async () => {
    if (!audio) { setError('Please add an audio file first'); return }
    if (items.length === 0) { setError('Please add at least one image or clip'); return }

    setBusy(true)
    setError('')
    setResult(null)
    setProgress(0)
    setLogs([])

    try {
      const ffmpeg = await loadFFmpeg()
      setStatus('Preparing files…')

      // Clean FS
      try {
        for (const f of await ffmpeg.listDir('/')) {
          if (!f.isDir) { try { await ffmpeg.deleteFile(f.name) } catch { /* */ } }
        }
      } catch { /* */ }

      const audioExt = (audio.name.match(/\.[^.]+$/) || ['.mp3'])[0].toLowerCase()
      const audioName = `audio${audioExt}`
      await ffmpeg.writeFile(audioName, await fetchFile(audio))

      const mediaNames: string[] = []
      for (let i = 0; i < items.length; i++) {
        const ext = items[i].file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() || '.jpg'
        const name = `m${i}${ext}`
        await ffmpeg.writeFile(name, await fetchFile(items[i].file))
        mediaNames.push(name)
      }

      const dur = Math.max(1, secondsPerImage)
      const clipNames: string[] = []

      // Create a short video clip from each media item
      for (let i = 0; i < mediaNames.length; i++) {
        setStatus(`Processing media ${i + 1} of ${mediaNames.length}…`)
        const out = `c${i}.mp4`
        const input = mediaNames[i]
        const t = items[i].type

        if (t === 'image') {
          // Static image → video
          await run(ffmpeg, [
            '-loop', '1',
            '-i', input,
            '-t', String(dur),
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=25',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-tune', 'stillimage',
            '-pix_fmt', 'yuv420p',
            '-an',
            out,
          ])
        } else if (t === 'gif') {
          // Animated GIF → video (play once or loop within duration)
          await run(ffmpeg, [
            '-ignore_loop', '0',
            '-i', input,
            '-t', String(dur),
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=25',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-pix_fmt', 'yuv420p',
            '-an',
            out,
          ])
        } else {
          // Video clip
          await run(ffmpeg, [
            '-i', input,
            '-t', String(dur),
            '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=25',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-pix_fmt', 'yuv420p',
            '-an',
            out,
          ])
        }
        clipNames.push(out)
        setProgress(Math.round(((i + 1) / mediaNames.length) * 50))
      }

      // Concat
      setStatus('Combining clips…')
      const listContent = clipNames.map(n => `file '${n}'`).join('\n')
      await ffmpeg.writeFile('list.txt', listContent)
      await run(ffmpeg, [
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        'slideshow.mp4',
      ])
      setProgress(60)

      // Measure audio duration in the browser (reliable)
      setStatus('Reading audio duration…')
      let audioDuration = 0
      try {
        audioDuration = await new Promise<number>((resolve, reject) => {
          const el = new Audio()
          el.preload = 'metadata'
          el.onloadedmetadata = () => {
            resolve(el.duration || 0)
            el.src = ''
          }
          el.onerror = () => reject(new Error('Could not read audio metadata'))
          el.src = audioUrl || URL.createObjectURL(audio)
        })
      } catch {
        audioDuration = 0
      }

      // Apply optional clip range to duration
      let startSec = Math.max(0, clipAudioStart)
      let endSec = clipAudioEnd > startSec ? clipAudioEnd : audioDuration
      if (endSec <= 0 || !isFinite(endSec)) endSec = audioDuration
      let useDuration = endSec - startSec
      if (!useDuration || useDuration <= 0 || !isFinite(useDuration)) {
        useDuration = audioDuration > 0 ? audioDuration : 30
      }

      // Prepare audio: trim + re-encode to AAC (audio only)
      setStatus(`Encoding audio (${useDuration.toFixed(1)}s)…`)
      const aFilters: string[] = []
      if (fadeIn) aFilters.push('afade=t=in:st=0:d=1.5')
      // Fade out must start near the END, not at 0
      if (fadeOut && useDuration > 2) {
        const fadeStart = Math.max(0, useDuration - 1.5)
        aFilters.push(`afade=t=out:st=${fadeStart.toFixed(2)}:d=1.5`)
      }

      const audioEncArgs = ['-i', audioName]
      if (startSec > 0) audioEncArgs.push('-ss', String(startSec))
      audioEncArgs.push('-t', String(useDuration))
      audioEncArgs.push('-vn')
      if (aFilters.length) audioEncArgs.push('-af', aFilters.join(','))
      audioEncArgs.push(
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '44100',
        '-ac', '2',
        'audio_final.mp4',
      )
      await run(ffmpeg, audioEncArgs)
      setProgress(75)

      // Final mux – loop video to cover full audio length; use explicit -t
      setStatus('Muxing video + audio…')
      const muxArgs = [
        '-stream_loop', loopVisuals ? '-1' : '0',
        '-i', 'slideshow.mp4',
        '-i', 'audio_final.mp4',
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-t', String(useDuration), // force full audio length
        '-f', 'mp4',
        '-movflags', '+faststart',
        'output.mp4',
      ]
      // If user wants audio looped instead (rare), ignore -t from audio and loop audio
      if (loopAudio && !loopVisuals) {
        muxArgs.length = 0
        muxArgs.push(
          '-i', 'slideshow.mp4',
          '-stream_loop', '-1',
          '-i', 'audio_final.mp4',
          '-map', '0:v:0',
          '-map', '1:a:0',
          '-c:v', 'copy',
          '-c:a', 'copy',
          '-shortest',
          '-f', 'mp4',
          '-movflags', '+faststart',
          'output.mp4',
        )
      }
      await run(ffmpeg, muxArgs)
      setProgress(95)

      const data = await ffmpeg.readFile('output.mp4')
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' })
      setResult(URL.createObjectURL(blob))
      setProgress(100)
      setStatus('Done!')
    } catch (err: any) {
      console.error(err)
      const msg = err?.message || 'Encoding failed'
      setError(msg)
      setLogs([...logLines.current.slice(-12)])
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
          <Film className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Audio to Video (Song2Vid)</h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          Turn any audio into a video with images, GIFs or clips. Loop, trim, and fade — all on your device.
        </p>
      </div>

      {/* Audio */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">1. Audio file</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver('audio') }}
          onDragLeave={() => setDragOver(null)}
          onDrop={e => { e.preventDefault(); setDragOver(null); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('audio/')) handleAudio(f) }}
          className={cn('flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer bg-white', dragOver === 'audio' ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200')}
        >
          {audio ? (
            <div className="text-center w-full">
              <Music className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="font-medium">{audio.name}</p>
              <p className="text-sm text-slate-400">{formatBytes(audio.size)}</p>
              {audioUrl && <audio src={audioUrl} controls className="mt-3 max-w-full" />}
              <button type="button" onClick={() => { setAudio(null); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(null) }} className="mt-2 text-xs text-red-500 hover:underline">Remove</button>
            </div>
          ) : (
            <label className="cursor-pointer text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Drop audio here or click to browse</p>
              <input type="file" accept="audio/*" className="hidden" onChange={e => handleAudio(e.target.files?.[0] || null)} />
            </label>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">2. Images, GIFs or short clips (drag to reorder)</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver('media') }}
          onDragLeave={() => setDragOver(null)}
          onDrop={e => { e.preventDefault(); setDragOver(null); if (e.dataTransfer.files?.length) handleMedia(e.dataTransfer.files) }}
          className={cn('p-6 rounded-2xl border-2 border-dashed bg-white', dragOver === 'media' ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200')}
        >
          {items.length === 0 ? (
            <label className="flex flex-col items-center cursor-pointer py-4">
              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">Drop images / GIFs / clips here</p>
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => e.target.files && handleMedia(e.target.files)} />
            </label>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} draggable onDragStart={() => onDragStart(index)} onDragEnter={() => onDragEnter(index)} onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                  className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 cursor-grab">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  {item.type === 'video'
                    ? <video src={item.url} className="w-12 h-12 object-cover rounded-lg" muted />
                    : <img src={item.url} alt="" className="w-12 h-12 object-cover rounded-lg" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(item.file.size)} · {item.type}</p>
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)} className="p-1 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <label className="flex items-center justify-center gap-2 py-3 text-sm text-indigo-600 cursor-pointer hover:underline">
                <Upload className="w-4 h-4" /> Add more
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => e.target.files && handleMedia(e.target.files)} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="mb-6 p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">3. Options</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={loopVisuals} onChange={e => setLoopVisuals(e.target.checked)} /> Loop visuals to match audio</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={loopAudio} onChange={e => setLoopAudio(e.target.checked)} /> Loop audio to match visuals</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={fadeIn} onChange={e => setFadeIn(e.target.checked)} /> Fade in audio</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={fadeOut} onChange={e => setFadeOut(e.target.checked)} /> Fade out audio</label>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block text-slate-600 mb-1">Seconds per image/clip</label>
            <input type="number" min={1} max={60} value={secondsPerImage} onChange={e => setSecondsPerImage(Number(e.target.value) || 5)} className="w-full p-2 rounded-lg border" />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Clip audio start (sec)</label>
            <input type="number" min={0} step={0.5} value={clipAudioStart} onChange={e => setClipAudioStart(Number(e.target.value) || 0)} className="w-full p-2 rounded-lg border" />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">Clip audio end (0 = full)</label>
            <input type="number" min={0} step={0.5} value={clipAudioEnd} onChange={e => setClipAudioEnd(Number(e.target.value) || 0)} className="w-full p-2 rounded-lg border" />
          </div>
        </div>
      </div>

      <button onClick={encode} disabled={busy || loadingEngine || !audio || items.length === 0}
        className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-indigo-500">
        {(busy || loadingEngine) ? (
          <><Loader2 className="w-5 h-5 animate-spin" />{status || 'Working…'} {progress > 0 && !loadingEngine && `${progress}%`}</>
        ) : (
          <><Play className="w-5 h-5" /> Create Video</>
        )}
      </button>

      {busy && progress > 0 && !loadingEngine && (
        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {logs.length > 0 && (
        <details className="mt-3 text-xs text-slate-500">
          <summary className="cursor-pointer">FFmpeg log (last lines)</summary>
          <pre className="mt-2 p-3 bg-slate-50 rounded-lg overflow-auto max-h-40">{logs.join('\n')}</pre>
        </details>
      )}

      {result && (
        <div className="mt-8 text-center space-y-4">
          <video src={result} controls className="w-full max-h-80 rounded-xl border shadow-sm" />
          <a href={result} download="song2vid-output.mp4" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500">
            <Download className="w-5 h-5" /> Open Your Video
          </a>
        </div>
      )}

      <div className="mt-10 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800">
        <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">100% Private</p>
          <p className="mt-0.5">Powered by FFmpeg.wasm. Files never leave your device. Recommended total input under 600 MB (depends on RAM).</p>
        </div>
      </div>
    </div>
  )
}
