import { Link } from 'react-router-dom'

export default function LocalWhisperArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Browser dictation is convenient — and often sends audio to Google or Apple. For interviews, medical notes, or
        anything sensitive, you want <strong>transcription that never leaves the device</strong>.
      </p>
      <p>
        Pridocs{' '}
        <Link to="/tools/local-whisper" className="text-indigo-600 hover:underline font-medium">
          Local Whisper Transcription
        </Link>{' '}
        runs OpenAI&apos;s Whisper (via Transformers.js / ONNX) <strong>inside your browser</strong>. The model
        downloads once (~40–75 MB). Your audio file stays local.
      </p>
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Tiny vs Base</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Tiny.en</strong> — fastest, good for clear English voice notes</li>
        <li><strong>Base.en</strong> — better accuracy, slower, larger download</li>
      </ul>
      <p>
        For live mic dictation (vendor API), use{' '}
        <Link to="/tools/speech-to-text" className="text-indigo-600 hover:underline">Speech to Text</Link>. For private
        file transcription, use Local Whisper.
      </p>
      <p className="font-medium text-slate-900 mt-8">
        <Link to="/tools/local-whisper" className="text-indigo-600 hover:underline">
          Transcribe with Whisper locally — free, no upload
        </Link>
      </p>
    </div>
  )
}
