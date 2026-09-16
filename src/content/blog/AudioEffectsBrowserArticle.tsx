import { Link } from 'react-router-dom'

export default function AudioEffectsBrowserArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Audacity packs dozens of effects. Most everyday jobs need five: <strong>compress</strong>, <strong>EQ</strong>,{' '}
        <strong>fade</strong>, <strong>reverse</strong>, and <strong>split</strong>. Pridocs ships each as a one-job
        browser tool — no install, no upload.
      </p>
      <ul className="space-y-3">
        <li>
          <Link to="/tools/audio-compressor" className="text-indigo-600 hover:underline font-medium">Audio Compressor</Link>
          {' '}— even out podcast dynamics
        </li>
        <li>
          <Link to="/tools/audio-eq" className="text-indigo-600 hover:underline font-medium">Audio EQ</Link>
          {' '}— bass / mid / treble + high/low-pass
        </li>
        <li>
          <Link to="/tools/audio-fader" className="text-indigo-600 hover:underline font-medium">Fade In / Out</Link>
          {' '}— smooth starts and endings
        </li>
        <li>
          <Link to="/tools/reverse-audio" className="text-indigo-600 hover:underline font-medium">Reverse Audio</Link>
          {' '}— play tracks backwards
        </li>
        <li>
          <Link to="/tools/split-audio" className="text-indigo-600 hover:underline font-medium">Split Audio</Link>
          {' '}— cut at silence or fixed intervals
        </li>
        <li>
          <Link to="/tools/noise-reducer" className="text-indigo-600 hover:underline font-medium">Noise Reducer</Link>
          {' '}— hiss & hum
        </li>
      </ul>
      <p>
        Export with bitrate presets and Opus via{' '}
        <Link to="/tools/audio-converter" className="text-indigo-600 hover:underline">Audio Converter</Link>.
      </p>
      <p className="font-medium text-slate-900 mt-8">
        <Link to="/blog/browser-audio-video-editing-no-upload-2026" className="text-indigo-600 hover:underline">
          See the full private audio & video toolkit
        </Link>
      </p>
    </div>
  )
}
