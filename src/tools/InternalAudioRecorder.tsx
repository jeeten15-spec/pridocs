import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Square, Download, Loader2, RefreshCw, Radio } from 'lucide-react'
import { fetchFile } from '@ffmpeg/util'
import { getFFmpeg } from '../lib/ffmpeg'
import { cn, formatBytes } from '../lib/utils'

type CaptureMode = 'loopback' | 'system' | 'microphone'
type OutFormat = 'webm' | 'wav' | 'mp3'

interface InputDevice {
  deviceId: string
  label: string
  loopback: boolean
}

function isLoopbackLabel(label: string) {
  return /loopback|stereo mix|what u hear|wave out|monitor|wasapi|speakers \(/i.test(label)
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Route any MediaStream through an audio-only destination (drops video tracks cleanly). */
function audioOnlyStream(stream: MediaStream): MediaStream {
  const ctx = new AudioContext()
  const dest = ctx.createMediaStreamDestination()
  const source = ctx.createMediaStreamSource(stream)
  source.connect(dest)
  // Keep context alive on stream object so it is not GC'd mid-record
  ;(dest.stream as MediaStream & { _ctx?: AudioContext })._ctx = ctx
  return dest.stream
}

export default function InternalAudioRecorder() {
  const [devices, setDevices] = useState<InputDevice[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [mode, setMode] = useState<CaptureMode>('loopback')
  const [outFormat, setOutFormat] = useState<OutFormat>('webm')
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewMime, setPreviewMime] = useState('audio/webm')
  const [previewBytes, setPreviewBytes] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState('recording.webm')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const refreshDevices = useCallback(async () => {
    setError('')
    try {
      // One-time permission unlocks device labels in most browsers.
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ audio: true })
        tmp.getTracks().forEach((t) => t.stop())
      } catch {
        /* labels may stay generic without mic permission */
      }
      const list = await navigator.mediaDevices.enumerateDevices()
      const inputs = list
        .filter((d) => d.kind === 'audioinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Audio input ${d.deviceId.slice(0, 6)}`,
          loopback: isLoopbackLabel(d.label || ''),
        }))
      inputs.sort((a, b) => {
        if (a.loopback !== b.loopback) return a.loopback ? -1 : 1
        return a.label.localeCompare(b.label)
      })
      setDevices(inputs)
      const loop = inputs.find((d) => d.loopback)
      if (loop) setDeviceId(loop.deviceId)
      else if (inputs[0]) setDeviceId(inputs[0].deviceId)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not list audio devices')
    }
  }, [])

  useEffect(() => {
    refreshDevices()
    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices)
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices)
      stopStream()
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [refreshDevices, stopStream])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (downloadUrl && downloadUrl !== previewUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [downloadUrl, previewUrl])

  const acquireStream = async (): Promise<MediaStream> => {
    if (mode === 'system') {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        // Chrome / Edge: capture system audio with screen or tab share
        systemAudio: 'include',
      } as DisplayMediaStreamOptions)
      return audioOnlyStream(stream)
    }

    if (!deviceId) throw new Error('Choose a recording device first.')

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: deviceId },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: { ideal: 2 },
        sampleRate: { ideal: 48000 },
      },
      video: false,
    })
    return stream
  }

  const startRecording = async () => {
    setError('')
    setPreviewUrl(null)
    setDownloadUrl(null)
    chunksRef.current = []

    try {
      const stream = await acquireStream()
      streamRef.current = stream

      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''

      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 320000 })
        : new MediaRecorder(stream)

      recorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onerror = () => setError('Recording failed')
      recorder.onstop = () => {
        stopStream()
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        setPreviewBytes(blob.size)
        setPreviewMime(blob.type || 'audio/webm')
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setDownloadUrl(url)
        setDownloadName(`pridocs-internal-audio-${Date.now()}.webm`)
      }

      recorder.start(250)
      setRecording(true)
      setElapsed(0)
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch (e: unknown) {
      stopStream()
      const msg = e instanceof Error ? e.message : 'Could not start recording'
      if (mode === 'system' && msg.includes('Permission')) {
        setError(
          'System audio capture was cancelled. Pick a screen or tab and enable “Share system audio” / “Share tab audio”.'
        )
      } else if (mode === 'loopback') {
        setError(
          `${msg}. On Windows, enable Stereo Mix or use Chrome/Edge — look for a device labeled “loopback” in the list, or switch to System audio (tab share).`
        )
      } else {
        setError(msg)
      }
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    recorderRef.current = null
    setRecording(false)
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const convertWithFfmpeg = async (target: 'wav' | 'mp3') => {
    if (!previewUrl) return
    setBusy(true)
    setStatus('Converting…')
    setError('')
    try {
      const blob = await fetch(previewUrl).then((r) => r.blob())
      const ffmpeg = await getFFmpeg(setStatus)
      const inName = 'rec.webm'
      const outName = target === 'wav' ? 'out.wav' : 'out.mp3'
      await ffmpeg.writeFile(inName, await fetchFile(blob))
      const args =
        target === 'wav'
          ? ['-i', inName, '-c:a', 'pcm_s16le', outName]
          : ['-i', inName, '-c:a', 'libmp3lame', '-b:a', '320k', outName]
      const code = await ffmpeg.exec(args)
      if (code !== 0) throw new Error('Conversion failed')
      const data = await ffmpeg.readFile(outName)
      const outBlob = new Blob([data as BlobPart], {
        type: target === 'wav' ? 'audio/wav' : 'audio/mpeg',
      })
      if (downloadUrl && downloadUrl !== previewUrl) URL.revokeObjectURL(downloadUrl)
      const url = URL.createObjectURL(outBlob)
      setDownloadUrl(url)
      setDownloadName(`pridocs-internal-audio-${Date.now()}.${target}`)
      setStatus('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Conversion failed')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  const loopbackDevices = devices.filter((d) => d.loopback)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Internal Audio Recorder — Capture System Sound
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Record what your PC is playing — browser-only, no upload. On Windows Chrome/Edge, pick a{' '}
          <strong>loopback</strong> input (like Audacity&apos;s WASAPI loopback) or use tab/system audio
          share.
        </p>
      </div>

      <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">
            Capture source
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['loopback', 'Loopback device (WASAPI-style)'],
                ['system', 'System / tab audio (share)'],
                ['microphone', 'Microphone only'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={recording}
                onClick={() => setMode(id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  mode === id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {(mode === 'loopback' || mode === 'microphone') && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Recording device
              </label>
              <button
                type="button"
                onClick={refreshDevices}
                disabled={recording}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              disabled={recording || devices.length === 0}
              className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600 text-sm"
            >
              {devices.length === 0 && <option value="">No inputs found — allow microphone once</option>}
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.loopback ? '🔊 ' : '🎤 '}
                  {d.label}
                </option>
              ))}
            </select>
            {mode === 'loopback' && loopbackDevices.length === 0 && devices.length > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                No device labeled “loopback” yet. In Windows Sound settings, enable <strong>Stereo Mix</strong>, or
                use <strong>System / tab audio</strong> mode. Chrome on Windows often lists loopback devices after
                refresh.
              </p>
            )}
          </div>
        )}

        {mode === 'system' && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            When prompted, choose a <strong>Chrome tab</strong> (best for YouTube/meetings) or{' '}
            <strong>Entire screen</strong>, then check <strong>Share system audio</strong> or{' '}
            <strong>Share tab audio</strong>. Video is not saved — only audio is recorded.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">
            Export format (after recording)
          </label>
          <select
            value={outFormat}
            onChange={(e) => setOutFormat(e.target.value as OutFormat)}
            disabled={recording || busy}
            className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-600 text-sm"
          >
            <option value="webm">WebM (instant, high quality)</option>
            <option value="wav">WAV (convert with FFmpeg)</option>
            <option value="mp3">MP3 320kbps (convert with FFmpeg)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mb-6">
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center transition-colors',
            recording ? 'bg-red-500 animate-pulse' : 'bg-indigo-100 dark:bg-indigo-900/40'
          )}
        >
          {recording ? (
            <Radio className="w-9 h-9 text-white" />
          ) : (
            <Mic className="w-9 h-9 text-indigo-600 dark:text-indigo-300" />
          )}
        </div>
        <p className="text-2xl font-mono tabular-nums text-slate-800 dark:text-slate-100">
          {formatTime(elapsed)}
        </p>
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
          >
            <Mic className="w-5 h-5" /> Start recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500"
          >
            <Square className="w-5 h-5" /> Stop
          </button>
        )}
        {status && (
          <p className="text-sm text-indigo-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> {status}
          </p>
        )}
        {error && <p className="text-sm text-red-600 text-center max-w-md">{error}</p>}
      </div>

      {previewUrl && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-center space-y-4">
          <audio src={previewUrl} controls className="w-full max-w-md mx-auto" />
          <p className="text-xs text-slate-500">{formatBytes(previewBytes)} · {previewMime}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <a
              href={downloadUrl || previewUrl}
              download={downloadName}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
            >
              <Download className="w-4 h-4" /> Open Your File
            </a>
            {outFormat === 'wav' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => convertWithFfmpeg('wav')}
                className="px-4 py-2.5 rounded-xl border text-sm font-medium disabled:opacity-50"
              >
                Export WAV
              </button>
            )}
            {outFormat === 'mp3' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => convertWithFfmpeg('mp3')}
                className="px-4 py-2.5 rounded-xl border text-sm font-medium disabled:opacity-50"
              >
                Export MP3
              </button>
            )}
          </div>
        </div>
      )}

      <section className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Audacity-style loopback on Windows (browser limits)
        </h2>
        <p>
          Desktop apps like Audacity expose <strong>Windows WASAPI</strong> and explicit{' '}
          <strong>Speakers (loopback)</strong> devices. Browsers cannot open that full control panel, but Chrome and
          Edge on Windows often list the same loopback endpoints under <strong>Recording device</strong> after you
          allow microphone access once. Pick the loopback entry, disable enhancements, and record — all locally.
        </p>
        <p>
          Nothing is uploaded. For editing, send the file to{' '}
          <a href="/tools/audio-trimmer" className="text-indigo-600 hover:underline">
            Audio Trimmer
          </a>{' '}
          or{' '}
          <a href="/tools/audio-merger" className="text-indigo-600 hover:underline">
            Merge Audio
          </a>
          .
        </p>
      </section>
    </div>
  )
}
