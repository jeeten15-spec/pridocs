import { Link } from 'react-router-dom'

export default function BrowserAudioEditingHubArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Audacity is powerful — and also a 200 MB install when you just need to trim a voice memo. Pridocs ships a full{' '}
        <strong>browser audio & video toolkit</strong>: record, edit, effects, analyze, export, and optional local
        Whisper — without uploading a single byte.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Record & edit</h2>
      <ul className="space-y-2">
        <li><Link to="/tools/internal-audio-recorder" className="text-indigo-600 hover:underline font-medium">Internal Audio Recorder</Link> — system / loopback audio</li>
        <li><Link to="/tools/audio-trimmer" className="text-indigo-600 hover:underline font-medium">Audio Trimmer</Link> — cut with waveform + fade</li>
        <li><Link to="/tools/split-audio" className="text-indigo-600 hover:underline font-medium">Split Audio</Link> — silence or fixed intervals</li>
        <li><Link to="/tools/reverse-audio" className="text-indigo-600 hover:underline font-medium">Reverse Audio</Link> — play backwards</li>
        <li><Link to="/tools/remove-silence" className="text-indigo-600 hover:underline font-medium">Remove Silence</Link> — truncate dead air</li>
        <li><Link to="/tools/audio-merger" className="text-indigo-600 hover:underline font-medium">Merge Audio</Link> — join with crossfade</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Effects</h2>
      <ul className="space-y-2">
        <li><Link to="/tools/audio-normalizer" className="text-indigo-600 hover:underline font-medium">Normalizer / Volume Booster</Link></li>
        <li><Link to="/tools/audio-speed-changer" className="text-indigo-600 hover:underline font-medium">Speed Changer</Link></li>
        <li><Link to="/tools/noise-reducer" className="text-indigo-600 hover:underline font-medium">Noise Reducer</Link> — hiss & hum</li>
        <li><Link to="/tools/audio-fader" className="text-indigo-600 hover:underline font-medium">Fade In / Out</Link></li>
        <li><Link to="/tools/audio-eq" className="text-indigo-600 hover:underline font-medium">Audio EQ</Link> — bass / mid / treble</li>
        <li><Link to="/tools/audio-compressor" className="text-indigo-600 hover:underline font-medium">Audio Compressor</Link> — dynamics</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Analyze & export</h2>
      <ul className="space-y-2">
        <li><Link to="/tools/audio-analyzer" className="text-indigo-600 hover:underline font-medium">Waveform & Spectrum Analyzer</Link> — peak / RMS loudness</li>
        <li><Link to="/tools/song-analyzer" className="text-indigo-600 hover:underline font-medium">Song Analyzer</Link> — BPM, key, mood</li>
        <li><Link to="/tools/audio-converter" className="text-indigo-600 hover:underline font-medium">Audio Converter</Link> — MP3 / WAV / AAC / FLAC / Opus + bitrate presets</li>
        <li><Link to="/tools/local-whisper" className="text-indigo-600 hover:underline font-medium">Local Whisper</Link> — optional on-device transcription</li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Video</h2>
      <ul className="space-y-2">
        <li><Link to="/tools/video-trimmer" className="text-indigo-600 hover:underline font-medium">Video Trimmer</Link></li>
        <li><Link to="/tools/video-compressor" className="text-indigo-600 hover:underline font-medium">Video Compressor</Link></li>
        <li><Link to="/tools/merge-videos" className="text-indigo-600 hover:underline font-medium">Merge Videos</Link></li>
        <li><Link to="/tools/add-audio-to-video" className="text-indigo-600 hover:underline font-medium">Add / Replace Audio on Video</Link></li>
        <li><Link to="/tools/video-to-mp3" className="text-indigo-600 hover:underline font-medium">Video to MP3</Link> · <Link to="/tools/video-to-gif" className="text-indigo-600 hover:underline font-medium">Video to GIF</Link> · <Link to="/tools/song2vid" className="text-indigo-600 hover:underline font-medium">Song2Vid</Link></li>
      </ul>

      <p className="font-medium text-slate-900 mt-8">
        Start with{' '}
        <Link to="/tools/audio-trimmer" className="text-indigo-600 hover:underline">Audio Trimmer</Link>
        {' '}or{' '}
        <Link to="/tools/noise-reducer" className="text-indigo-600 hover:underline">Noise Reducer</Link>
        {' '}— free, no signup.
      </p>
    </div>
  )
}
