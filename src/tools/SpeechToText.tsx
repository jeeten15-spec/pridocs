import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Copy, Check } from 'lucide-react'

type Rec = SpeechRecognition

export default function SpeechToText() {
  const [supported, setSupported] = useState(true)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [finalText, setFinalText] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const recRef = useRef<Rec | null>(null)

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setSupported(false)
      return
    }
    const rec: Rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interimBuf = ''
      let finalBuf = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) finalBuf += r[0].transcript + ' '
        else interimBuf += r[0].transcript
      }
      if (finalBuf) setFinalText((t) => (t + finalBuf).replace(/\s+/g, ' ').trim() + ' ')
      setInterim(interimBuf)
    }
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setError(e.error || 'Speech recognition error')
      setListening(false)
    }
    rec.onend = () => setListening(false)
    recRef.current = rec
    return () => {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const toggle = () => {
    const rec = recRef.current
    if (!rec) return
    setError('')
    if (listening) {
      rec.stop()
      setListening(false)
      return
    }
    try {
      rec.start()
      setListening(true)
    } catch (err: any) {
      setError(err?.message || 'Could not start microphone')
    }
  }

  const copy = async () => {
    const text = (finalText + ' ' + interim).trim()
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Speech to Text</h1>
        <p className="text-slate-500">Dictate notes with your browser&apos;s built-in speech recognition.</p>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Speech recognition is provided by your browser/OS. Some browsers send audio to the vendor for transcription —
        choose a local voice/engine when available, or use this only for non-sensitive dictation.
      </div>

      {!supported ? (
        <p className="text-red-600 text-sm">Your browser does not support the Web Speech API. Try Chrome or Edge.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              type="button"
              onClick={toggle}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium ${
                listening ? 'bg-red-600' : 'bg-indigo-600'
              }`}
            >
              {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {listening ? 'Stop' : 'Start listening'}
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white font-medium"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFinalText('')
                setInterim('')
              }}
              className="px-5 py-3 rounded-xl text-slate-600 hover:underline text-sm"
            >
              Clear
            </button>
          </div>
          <div className="min-h-[180px] p-4 rounded-2xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-600 text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
            {finalText}
            <span className="text-slate-400">{interim}</span>
            {!finalText && !interim && <span className="text-slate-400">Transcript will appear here…</span>}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  )
}
