import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, Square, Volume2 } from 'lucide-react'

export default function TextToSpeech() {
  const [text, setText] = useState('Type or paste anything here, then press play to hear it read aloud.')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [unsupported, setUnsupported] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setUnsupported(true)
      return
    }
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices()
      setVoices(list)
      if (list.length && !voiceURI) {
        const preferred = list.find((v) => v.localService && v.lang.startsWith('en')) || list.find((v) => v.localService) || list[0]
        setVoiceURI(preferred.voiceURI)
      }
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const selectedVoice = useMemo(() => voices.find((v) => v.voiceURI === voiceURI) || null, [voices, voiceURI])

  const speak = () => {
    if (!text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    if (selectedVoice) utterance.voice = selectedVoice
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.onstart = () => { setSpeaking(true); setPaused(false) }
    utterance.onend = () => { setSpeaking(false); setPaused(false) }
    utterance.onerror = () => { setSpeaking(false); setPaused(false) }
    window.speechSynthesis.speak(utterance)
  }

  const togglePause = () => {
    if (!speaking) return
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  if (unsupported) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">Text to Speech</h1>
        <p className="text-slate-500">Your browser doesn't support the Web Speech API. Try a recent version of Chrome, Edge, or Safari.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Text to Speech Reader</h1>
        <p className="text-slate-500">
          Have any text read aloud using your device&apos;s own voices — a free, private{' '}
          <strong>online text to speech</strong> reader with no uploads or accounts.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-36 p-4 rounded-xl border border-slate-200 text-sm resize-none"
          placeholder="Type or paste text here..."
        />

        <div>
          <label className="block text-sm font-medium mb-1">Voice</label>
          <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm">
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}){!v.localService ? ' — network voice' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Speed: {rate.toFixed(1)}x</label>
            <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pitch: {pitch.toFixed(1)}</label>
            <input type="range" min="0" max="2" step="0.1" value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="w-full" />
          </div>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          {!speaking || !paused ? (
            <button
              onClick={speaking ? togglePause : speak}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              {speaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {speaking ? 'Pause' : 'Play'}
            </button>
          ) : (
            <button onClick={togglePause} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
              <Play className="w-5 h-5" /> Resume
            </button>
          )}
          <button
            onClick={stop}
            disabled={!speaking}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 disabled:opacity-40 text-slate-700 font-medium"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
        </div>
      </div>

      <section className="mt-16 pt-10 border-t border-slate-200 text-center">
        <Volume2 className="w-5 h-5 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Uses your browser's built-in Web Speech API and your operating system's own voices. Voices marked "network voice"
          are provided by your browser/OS vendor (not Pridocs) and may process audio off-device — local voices are selected
          by default wherever available.
        </p>
      </section>
    </div>
  )
}
