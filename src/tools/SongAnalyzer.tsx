import { useState } from 'react'
import { Upload, Loader2, Music2, Copy, Check } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'
import {
  ANALYSIS_MAX_SECONDS,
  MAX_SONG_BYTES,
  analyzeSong,
  type SongAnalysisResult,
} from '../lib/songAnalyzer'

function ScoreBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-sm tabular-nums text-slate-500">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function SongAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SongAnalysisResult | null>(null)
  const [drag, setDrag] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleFile = (f: File | null) => {
    if (!f) return
    if (!f.type.startsWith('audio/') && !/\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(f.name)) {
      setError('Please choose an audio file (MP3, WAV, M4A, OGG, FLAC, etc.).')
      return
    }
    if (f.size > MAX_SONG_BYTES) {
      setError(
        `File is too large (${formatBytes(f.size)}). Recommended max is ~80 MB — large files can exhaust browser memory.`
      )
      return
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setFile(f)
    setAudioUrl(URL.createObjectURL(f))
    setResult(null)
    setError('')
  }

  const run = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    setResult(null)
    setProgress(0)
    setStatus('Starting…')
    try {
      const out = await analyzeSong(file, (label, pct) => {
        setStatus(label)
        if (typeof pct === 'number') setProgress(pct)
      })
      setResult(out)
      setStatus('')
    } catch (err: any) {
      console.error(err)
      setError(
        err?.message ||
          'Analysis failed. Try a smaller file, or free up memory and reload the page.'
      )
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  const copySummary = async () => {
    if (!result) return
    const lines = [
      `Song Analyzer — ${result.fileName}`,
      `Duration: ${result.durationSec.toFixed(1)}s (analyzed ${result.analyzedSec.toFixed(1)}s)`,
      `BPM: ${result.bpm}`,
      `Key: ${result.key} ${result.scale}`,
      result.loudnessLufs != null ? `Loudness: ${result.loudnessLufs} LUFS` : null,
      `Energy: ${result.energy}`,
      `Danceability: ${result.danceability}`,
      result.acousticness != null ? `Acousticness: ${result.acousticness}` : null,
      result.genres.length ? `Genres: ${result.genres.map((g) => `${g.label} ${g.score}`).join(', ')}` : null,
      result.moods.length ? `Moods: ${result.moods.map((m) => `${m.label} ${m.score}`).join(', ')}` : null,
    ].filter(Boolean)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Free Song Analyzer (100% Private)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Estimate BPM, key, loudness, energy, danceability, genre, and mood from a local audio file — entirely in your
          browser. No uploads, no YouTube links, no account.
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        <strong>File size:</strong> Recommended under ~80 MB (same ballpark as our other media tools). Very large files
        may be slow or fail if the browser tab runs out of memory. Analysis uses up to the first{' '}
        {ANALYSIS_MAX_SECONDS} seconds of audio.
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
        Powered by <strong>Essentia.js</strong> (WASM) for tempo, key, loudness and energy, plus{' '}
        <strong>TensorFlow.js MusiCNN</strong> models for genre, mood, danceability and acousticness. On first use your
        browser downloads those model files (a few MB each) and caches them — your audio never leaves this device.
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
          handleFile(e.dataTransfer.files?.[0] || null)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800',
          drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 dark:border-slate-600'
        )}
      >
        {busy ? (
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-slate-400" />
        )}
        <div className="text-center">
          <p className="font-medium text-slate-800 dark:text-slate-100">
            {file ? file.name : 'Drop an audio file here or click to browse'}
          </p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          {!file && (
            <p className="text-sm text-slate-400 mt-1">MP3, WAV, M4A, OGG, FLAC — local files only</p>
          )}
        </div>
        <input
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
      </label>

      {audioUrl && (
        <audio src={audioUrl} controls className="w-full mt-4" />
      )}

      <button
        type="button"
        onClick={run}
        disabled={!file || busy}
        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music2 className="w-5 h-5" />}
        {busy ? 'Analyzing…' : 'Analyze song'}
      </button>

      {busy && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Results</h2>
            <button
              type="button"
              onClick={copySummary}
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy summary'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="BPM" value={String(result.bpm || '—')} sub="tempo estimate" />
            <MetricCard
              label="Key"
              value={`${result.key} ${result.scale}`.trim()}
              sub={result.keyStrength ? `strength ${result.keyStrength}` : undefined}
            />
            <MetricCard
              label="Loudness"
              value={result.loudnessLufs != null ? `${result.loudnessLufs}` : '—'}
              sub={result.loudnessLufs != null ? 'LUFS (EBU R128)' : 'unavailable'}
            />
            <MetricCard
              label="Duration"
              value={`${result.durationSec.toFixed(1)}s`}
              sub={
                result.analyzedSec < result.durationSec
                  ? `analyzed first ${result.analyzedSec.toFixed(0)}s`
                  : 'full track'
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
            <ScoreBar label="Energy" value={result.energy} hint="How intense / powerful the track feels (0–100)" />
            <ScoreBar
              label="Danceability"
              value={result.danceability}
              hint="How suitable the track is for dancing (0–100)"
            />
            {result.acousticness != null && (
              <ScoreBar
                label="Acousticness"
                value={result.acousticness}
                hint="Likelihood the track is acoustic vs electronic (0–100)"
              />
            )}
          </div>

          {result.genres.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Genre (top matches)</h3>
              <div className="space-y-3">
                {result.genres.map((g) => (
                  <ScoreBar key={g.label} label={g.label} value={g.score} />
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">
                GTZAN-style classifier (blues, classical, country, disco, hip-hop, jazz, metal, pop, reggae, rock) —
                estimates, not Spotify labels.
              </p>
            </div>
          )}

          {result.moods.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Mood</h3>
              <div className="space-y-3">
                {result.moods.map((m) => (
                  <ScoreBar key={m.label} label={m.label} value={m.score} />
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Engines used: {result.engines.join(' · ')}. Scores are research-model estimates for creative reference —
            not identical to commercial streaming “audio features.”
          </p>
        </div>
      )}
    </div>
  )
}
