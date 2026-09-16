import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Loader2, BarChart3 } from 'lucide-react'
import { MAX_AUDIO_BYTES, buildWaveformPeaks, formatTime, getMediaDuration } from '../lib/audioToolUtils'
import { cn, formatBytes } from '../lib/utils'

function dbFromRms(rms: number) {
  if (rms <= 1e-9) return -100
  return 20 * Math.log10(rms)
}

export default function AudioAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [peaks, setPeaks] = useState<number[]>([])
  const [spectrum, setSpectrum] = useState<number[]>([])
  const [peakDb, setPeakDb] = useState(0)
  const [rmsDb, setRmsDb] = useState(0)
  const [sampleRate, setSampleRate] = useState(0)
  const [channels, setChannels] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const waveRef = useRef<HTMLCanvasElement>(null)
  const specRef = useRef<HTMLCanvasElement>(null)
  const audioUrlRef = useRef<string | null>(null)

  useEffect(() => () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
  }, [])

  const drawWave = useCallback((data: number[]) => {
    const canvas = waveRef.current
    if (!canvas || !data.length) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#f1f5f9'
    ctx.fillRect(0, 0, w, h)
    const barW = w / data.length
    data.forEach((p, i) => {
      const bh = Math.max(1, p * (h - 10))
      ctx.fillStyle = '#4f46e5'
      ctx.fillRect(i * barW + 0.5, (h - bh) / 2, Math.max(1, barW - 1), bh)
    })
  }, [])

  const drawSpectrum = useCallback((mags: number[]) => {
    const canvas = specRef.current
    if (!canvas || !mags.length) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)
    const barW = w / mags.length
    mags.forEach((m, i) => {
      const bh = Math.max(1, m * (h - 8))
      const hue = 200 + (i / mags.length) * 80
      ctx.fillStyle = `hsl(${hue} 70% 55%)`
      ctx.fillRect(i * barW, h - bh, Math.max(1, barW - 0.5), bh)
    })
  }, [])

  useEffect(() => { drawWave(peaks) }, [peaks, drawWave])
  useEffect(() => { drawSpectrum(spectrum) }, [spectrum, drawSpectrum])

  const analyze = async (f: File) => {
    if (f.size > MAX_AUDIO_BYTES) {
      setError('Keep files under ~100 MB.')
      return
    }
    setFile(f)
    setBusy(true)
    setError('')
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = URL.createObjectURL(f)

    try {
      const d = await getMediaDuration(f)
      setDuration(d)
      const wf = await buildWaveformPeaks(f, 160)
      setPeaks(wf)

      const ctx = new AudioContext()
      const buf = await f.arrayBuffer()
      const audio = await ctx.decodeAudioData(buf.slice(0))
      setSampleRate(audio.sampleRate)
      setChannels(audio.numberOfChannels)

      const ch = audio.getChannelData(0)
      let peak = 0
      let sumSq = 0
      for (let i = 0; i < ch.length; i++) {
        const a = Math.abs(ch[i])
        if (a > peak) peak = a
        sumSq += ch[i] * ch[i]
      }
      const rms = Math.sqrt(sumSq / ch.length)
      setPeakDb(dbFromRms(peak))
      setRmsDb(dbFromRms(rms))

      // Average spectrum over several windows from middle of file
      const fftSize = 2048
      const offline = new OfflineAudioContext(1, fftSize, audio.sampleRate)
      const src = offline.createBufferSource()
      src.buffer = audio
      const analyser = offline.createAnalyser()
      analyser.fftSize = fftSize
      src.connect(analyser)
      analyser.connect(offline.destination)
      const mid = Math.max(0, Math.floor(audio.length / 2) - fftSize)
      src.start(0, mid / audio.sampleRate)
      await offline.startRendering()

      // Use AnalyserNode via realtime context on a short slice instead
      const live = new AudioContext()
      const liveBuf = live.createBuffer(1, Math.min(ch.length, audio.sampleRate * 2), audio.sampleRate)
      liveBuf.copyToChannel(ch.subarray(0, liveBuf.length), 0)
      const liveSrc = live.createBufferSource()
      liveSrc.buffer = liveBuf
      const an = live.createAnalyser()
      an.fftSize = 2048
      an.smoothingTimeConstant = 0.8
      liveSrc.connect(an)
      // silent destination
      const gain = live.createGain()
      gain.gain.value = 0
      an.connect(gain)
      gain.connect(live.destination)
      liveSrc.start()
      await new Promise((r) => setTimeout(r, 120))
      const bins = new Float32Array(an.frequencyBinCount)
      an.getFloatFrequencyData(bins)
      liveSrc.stop()
      await live.close()
      await ctx.close()

      // Take first ~half of bins (lower frequencies), normalize 0–1
      const usable = bins.slice(0, Math.floor(bins.length * 0.45))
      const minDb = -100
      const maxDb = -10
      const mags = Array.from(usable).map((v) => {
        const n = (v - minDb) / (maxDb - minDb)
        return Math.max(0, Math.min(1, n))
      })
      // Downsample for display
      const bars = 96
      const step = Math.max(1, Math.floor(mags.length / bars))
      const display: number[] = []
      for (let i = 0; i < bars; i++) {
        let max = 0
        for (let j = 0; j < step; j++) max = Math.max(max, mags[i * step + j] || 0)
        display.push(max)
      }
      setSpectrum(display)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Waveform & Spectrum Analyzer</h1>
        <p className="text-slate-500 dark:text-slate-400">
          View waveform, frequency spectrum, peak/RMS loudness — analyze audio privately without uploading.
        </p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) analyze(f) }}
        className={cn('flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white dark:bg-slate-800', drag ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-600')}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <BarChart3 className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop audio to analyze'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) analyze(f) }} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {file && !busy && peaks.length > 0 && (
        <div className="mt-8 space-y-6">
          {audioUrlRef.current && <audio src={audioUrlRef.current} controls className="w-full" />}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Metric label="Duration" value={formatTime(duration)} />
            <Metric label="Peak" value={`${peakDb.toFixed(1)} dBFS`} />
            <Metric label="RMS" value={`${rmsDb.toFixed(1)} dBFS`} />
            <Metric label="Format" value={`${sampleRate / 1000} kHz · ${channels}ch`} />
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Waveform</h2>
            <canvas ref={waveRef} width={640} height={100} className="w-full rounded-xl border dark:border-slate-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Spectrum (approx.)</h2>
            <canvas ref={specRef} width={640} height={140} className="w-full rounded-xl border dark:border-slate-700" />
            <p className="text-xs text-slate-500 mt-1">Low frequencies left → high right. Snapshot from mid-file.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
    </div>
  )
}
