import { Link } from 'react-router-dom'

export default function NoiseReducerArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Tape hiss. Laptop fan. A 50 Hz electrical hum under your voiceover. Audacity&apos;s Noise Reduction is famous
        for this — but you should not have to install a desktop DAW to <strong>remove hiss from audio</strong> once.
      </p>
      <p>
        Pridocs{' '}
        <Link to="/tools/noise-reducer" className="text-indigo-600 hover:underline font-medium">
          Noise Reducer
        </Link>{' '}
        runs denoise presets for hiss, hum, and general background noise <strong>in your browser</strong>. No upload.
        No watermark. Best for constant noise — not for removing talking under music.
      </p>
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">How to denoise in three steps</h2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>Open the Noise Reducer and pick Hiss, Hum, Gentle, or Strong.</li>
        <li>Drop your MP3 or WAV.</li>
        <li>Preview and download. Then{' '}
          <Link to="/tools/audio-normalizer" className="text-indigo-600 hover:underline">normalize</Link> if levels drop.
        </li>
      </ol>
      <p className="font-medium text-slate-900 mt-8">
        <Link to="/tools/noise-reducer" className="text-indigo-600 hover:underline">
          Remove hiss & hum free — no upload
        </Link>
      </p>
    </div>
  )
}
