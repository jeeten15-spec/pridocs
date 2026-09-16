import { useCallback, useState } from 'react'
import { Upload, Loader2, Download, ArrowUp, ArrowDown, Trash2, Plus, Film } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { MAX_VIDEO_BYTES, baseName, extOf } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

interface Clip {
  id: string
  file: File
}

export default function MergeVideos() {
  const [clips, setClips] = useState<Clip[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const addFiles = useCallback((list: FileList | File[] | null) => {
    if (!list || list.length === 0) return
    const next = Array.from(list)
      .filter((f) => f.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(f.name))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        file,
      }))
    setClips((prev) => [...prev, ...next])
    setResult(null)
    setError('')
  }, [])

  const move = (index: number, dir: -1 | 1) => {
    setClips((prev) => {
      const j = index + dir
      if (j < 0 || j >= prev.length) return prev
      const copy = [...prev]
      ;[copy[index], copy[j]] = [copy[j], copy[index]]
      return copy
    })
  }

  const merge = async () => {
    if (clips.length < 2) {
      setError('Add at least two videos.')
      return
    }
    const total = clips.reduce((n, c) => n + c.file.size, 0)
    if (total > MAX_VIDEO_BYTES * 1.5) {
      setError('Combined size too large for the browser (~120 MB max). Trim clips first.')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    const written: string[] = []
    try {
      const ffmpeg = await getFFmpeg(setStatus)
      // Re-encode each to consistent MP4 then concat — most reliable in WASM
      const parts: string[] = []
      for (let i = 0; i < clips.length; i++) {
        const inName = `in${i}${extOf(clips[i].file.name) || '.mp4'}`
        const partName = `part${i}.mp4`
        setStatus(`Preparing clip ${i + 1}/${clips.length}…`)
        await ffmpeg.writeFile(inName, await fetchFile(clips[i].file))
        written.push(inName)
        const code = await ffmpeg.exec([
          '-i', inName,
          '-vf', "scale=1280:-2:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
          '-r', '30',
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
          '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
          '-movflags', '+faststart',
          partName,
        ])
        if (code !== 0) throw new Error(`Failed to prepare clip ${i + 1}. Try converting to MP4 first.`)
        parts.push(partName)
        written.push(partName)
      }

      const listContent = parts.map((p) => `file '${p}'`).join('\n')
      await ffmpeg.writeFile('list.txt', new TextEncoder().encode(listContent))
      written.push('list.txt')
      setStatus('Merging…')
      const code = await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c', 'copy',
        'merged.mp4',
      ])
      if (code !== 0) throw new Error('Merge failed.')
      const data = await ffmpeg.readFile('merged.mp4')
      setResult(URL.createObjectURL(new Blob([data as BlobPart], { type: 'video/mp4' })))
      setStatus('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Merge failed')
      setStatus('')
    } finally {
      try {
        const ffmpeg = await getFFmpeg()
        for (const name of written) {
          try { await ffmpeg.deleteFile(name) } catch { /* ignore */ }
        }
        try { await ffmpeg.deleteFile('merged.mp4') } catch { /* ignore */ }
      } catch { /* ignore */ }
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Merge Videos</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Combine multiple video clips into one MP4 — private browser merge, no upload.
        </p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
        className={cn('flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800 mb-4', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        <Plus className="w-8 h-8 text-slate-400" />
        <p className="font-medium">Drop videos or click to add</p>
        <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </label>

      {clips.length > 0 && (
        <ul className="space-y-2 mb-4">
          {clips.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 p-3 rounded-xl border bg-white dark:bg-slate-800 text-sm">
              <Film className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 truncate">{c.file.name} · {formatBytes(c.file.size)}</span>
              <button type="button" onClick={() => move(i, -1)} className="p-1 hover:bg-slate-100 rounded" aria-label="Move up"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => move(i, 1)} className="p-1 hover:bg-slate-100 rounded" aria-label="Move down"><ArrowDown className="w-4 h-4" /></button>
              <button type="button" onClick={() => setClips((prev) => prev.filter((x) => x.id !== c.id))} className="p-1 text-red-500" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={merge} disabled={clips.length < 2 || busy} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {busy ? status || 'Merging…' : 'Merge videos'}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 text-center space-y-3">
          <video src={result} controls className="w-full max-w-md mx-auto rounded-lg" />
          <a href={result} download={`${baseName(clips[0]?.file.name || 'videos')}-merged.mp4`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your File
          </a>
        </div>
      )}
    </div>
  )
}
