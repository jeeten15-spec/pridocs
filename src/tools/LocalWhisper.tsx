import { useRef, useState } from 'react'
import { Upload, Loader2, Copy, Check, Mic } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

const MAX_BYTES = 40 * 1024 * 1024

type ModelId = 'tiny.en' | 'base.en'

const MODELS: { id: ModelId; label: string; hub: string; note: string }[] = [
  {
    id: 'tiny.en',
    label: 'Whisper Tiny (English) — fastest',
    hub: 'Xenova/whisper-tiny.en',
    note: '~40 MB first download',
  },
  {
    id: 'base.en',
    label: 'Whisper Base (English) — better accuracy',
    hub: 'Xenova/whisper-base.en',
    note: '~75 MB first download',
  },
]

/**
 * Optional local Whisper transcription via Transformers.js (ONNX in-browser).
 * Model downloads once to the browser cache; audio stays on-device.
 */
export default function LocalWhisper() {
  const [file, setFile] = useState<File | null>(null)
  const [model, setModel] = useState<ModelId>('tiny.en')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [drag, setDrag] = useState(false)
  const pipelineRef = useRef<any>(null)
  const loadedModelRef = useRef<string | null>(null)

  const loadPipeline = async (hub: string) => {
    if (pipelineRef.current && loadedModelRef.current === hub) return pipelineRef.current
    setStatus('Loading Transformers.js…')
    const { pipeline, env } = await import('@huggingface/transformers')
    env.allowLocalModels = false
    env.useBrowserCache = true
    setStatus(`Downloading Whisper model (${hub}) — first time only…`)
    const asr = await pipeline('automatic-speech-recognition', hub, {
      dtype: 'q8',
      progress_callback: (p: { status?: string; progress?: number }) => {
        if (p?.status === 'progress' && typeof p.progress === 'number') {
          setStatus(`Downloading model… ${Math.round(p.progress)}%`)
        }
      },
    })
    pipelineRef.current = asr
    loadedModelRef.current = hub
    return asr
  }

  const transcribe = async (f: File) => {
    if (f.size > MAX_BYTES) {
      setError('Keep audio under ~40 MB for Whisper in the browser.')
      return
    }
    setFile(f)
    setBusy(true)
    setError('')
    setText('')
    try {
      const hub = MODELS.find((m) => m.id === model)?.hub || MODELS[0].hub
      const asr = await loadPipeline(hub)
      setStatus('Transcribing locally…')
      const url = URL.createObjectURL(f)
      try {
        const out = await asr(url, {
          chunk_length_s: 30,
          stride_length_s: 5,
          return_timestamps: false,
        })
        const t = typeof out === 'string' ? out : out?.text || JSON.stringify(out)
        setText(String(t).trim())
        setStatus('')
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Transcription failed'
      setError(
        msg.includes('Failed to fetch') || msg.includes('network')
          ? 'Could not download the Whisper model. Check your connection and try again.'
          : msg
      )
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Local Whisper Transcription</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Transcribe audio to text with Whisper running in your browser (WASM/ONNX). Optional &amp; private — model downloads once; your audio never uploads.
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Unlike browser dictation, this path keeps audio on-device after the model is cached. First run downloads Whisper (~40–75 MB). Prefer short clips on phones; desktop works best.
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium">Model</label>
        <select value={model} onChange={(e) => setModel(e.target.value as ModelId)} disabled={busy} className="w-full p-3 rounded-xl border dark:bg-slate-800 mt-1">
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label} — {m.note}</option>
          ))}
        </select>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) transcribe(f) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Mic className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop audio / voice recording'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {status && <p className="text-sm text-indigo-500 mt-2">{status}</p>}
        </div>
        <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.flac" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) transcribe(f) }} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {text && (
        <div className="mt-8 space-y-3">
          <div className="min-h-[160px] p-4 rounded-2xl border bg-white dark:bg-slate-800 whitespace-pre-wrap text-sm">
            {text}
          </div>
          <button type="button" onClick={copy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border font-medium">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy transcript'}
          </button>
        </div>
      )}

      <p className="mt-6 text-xs text-slate-500 text-center">
        Need live mic dictation instead? Use{' '}
        <a href="/tools/speech-to-text" className="text-indigo-600 hover:underline">Speech to Text</a>
        {' '}(browser API — may send audio to the vendor).
      </p>
    </div>
  )
}
