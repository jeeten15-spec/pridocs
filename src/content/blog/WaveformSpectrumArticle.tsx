import { Link } from 'react-router-dom'

export default function WaveformSpectrumArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Before you compress, normalize, or denoise — look at the file. A <strong>waveform viewer</strong> shows clipping
        and silence. A <strong>spectrum analyzer</strong> hints at hiss and hum. Peak and RMS numbers tell you if a
        quiet recording needs a boost.
      </p>
      <p>
        Pridocs{' '}
        <Link to="/tools/audio-analyzer" className="text-indigo-600 hover:underline font-medium">
          Waveform & Spectrum Analyzer
        </Link>{' '}
        does all of that locally. No upload. No account.
      </p>
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">What the meters mean</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Peak dBFS</strong> — loudest sample; near 0 dB risks clipping</li>
        <li><strong>RMS dBFS</strong> — average loudness; useful for comparing voice clips</li>
        <li><strong>Spectrum</strong> — energy by frequency (low left, high right)</li>
      </ul>
      <p>
        Next:{' '}
        <Link to="/tools/audio-normalizer" className="text-indigo-600 hover:underline">normalize</Link>,{' '}
        <Link to="/tools/noise-reducer" className="text-indigo-600 hover:underline">denoise</Link>, or{' '}
        <Link to="/tools/song-analyzer" className="text-indigo-600 hover:underline">detect BPM & key</Link>.
      </p>
      <p className="font-medium text-slate-900 mt-8">
        <Link to="/tools/audio-analyzer" className="text-indigo-600 hover:underline">
          Analyze audio free — waveform & spectrum
        </Link>
      </p>
    </div>
  )
}
