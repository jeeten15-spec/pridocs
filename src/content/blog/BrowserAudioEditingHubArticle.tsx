import { Link } from 'react-router-dom'

export default function BrowserAudioEditingHubArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Audacity is powerful — and also a 200 MB install, a learning curve, and a privacy question when you just need to
        trim a voice memo. Pridocs now ships a full <strong>browser audio & video toolkit</strong>: record, cut,
        normalize, speed-change, merge, and compress — without uploading a single byte.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">The private audio editing stack (2026)</h2>
      <ul className="space-y-3">
        <li>
          <Link to="/tools/internal-audio-recorder" className="text-indigo-600 hover:underline font-medium">Internal Audio Recorder</Link>
          {' '}— capture system sound (loopback or tab audio)
        </li>
        <li>
          <Link to="/tools/audio-trimmer" className="text-indigo-600 hover:underline font-medium">Audio Trimmer</Link>
          {' '}— cut MP3/WAV with waveform + fade
        </li>
        <li>
          <Link to="/tools/remove-silence" className="text-indigo-600 hover:underline font-medium">Remove Silence</Link>
          {' '}— strip dead air from podcasts
        </li>
        <li>
          <Link to="/tools/audio-normalizer" className="text-indigo-600 hover:underline font-medium">Audio Normalizer</Link>
          {' '}— fix quiet or uneven levels
        </li>
        <li>
          <Link to="/tools/audio-speed-changer" className="text-indigo-600 hover:underline font-medium">Speed Changer</Link>
          {' '}— 0.5× to 4× tempo control
        </li>
        <li>
          <Link to="/tools/audio-merger" className="text-indigo-600 hover:underline font-medium">Merge Audio</Link>
          {' '}— join tracks with crossfade
        </li>
        <li>
          <Link to="/tools/audio-converter" className="text-indigo-600 hover:underline font-medium">Audio Converter</Link>
          {' '}— MP3, WAV, FLAC, AAC, OGG
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Video tools that pair with audio</h2>
      <ul className="space-y-3">
        <li>
          <Link to="/tools/video-trimmer" className="text-indigo-600 hover:underline font-medium">Video Trimmer</Link>
          {' '}— cut MP4 locally
        </li>
        <li>
          <Link to="/tools/video-compressor" className="text-indigo-600 hover:underline font-medium">Video Compressor</Link>
          {' '}— shrink for email & WhatsApp
        </li>
        <li>
          <Link to="/tools/video-to-mp3" className="text-indigo-600 hover:underline font-medium">Video to MP3</Link>
          {' '}— extract audio track
        </li>
        <li>
          <Link to="/tools/song2vid" className="text-indigo-600 hover:underline font-medium">Song2Vid</Link>
          {' '}— turn audio into a shareable video
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Why this beats random &quot;online editors&quot;</h2>
      <p>
        Upload-based tools monetize your files — ads, upsells, retention policies you never read. Pridocs uses FFmpeg.wasm
        and Web Audio APIs so processing happens on <strong>your</strong> CPU. First use downloads the engine (~25 MB);
        your media stays local. That is the same privacy posture that drives our PDF and HEIC tools — now for audio and
        video too.
      </p>

      <p className="font-medium text-slate-900 mt-8">
        Start with{' '}
        <Link to="/tools/audio-trimmer" className="text-indigo-600 hover:underline">Audio Trimmer</Link>
        {' '}or{' '}
        <Link to="/tools/internal-audio-recorder" className="text-indigo-600 hover:underline">Internal Audio Recorder</Link>
        {' '}— free, no signup.
      </p>
    </div>
  )
}
