import { Link } from 'react-router-dom'

export default function RecordSystemAudioArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        You need to <strong>record system audio</strong> — a Zoom call highlight, a YouTube clip for notes, game
        commentary, or a training video — without installing Audacity or paying for desktop capture software. Most
        &quot;online voice recorders&quot; only hear your microphone. What you actually want is an{' '}
        <strong>internal audio recorder</strong>: capture what the PC is playing, cleanly, at full quality.
      </p>
      <p>
        Pridocs now ships a free, browser-only{' '}
        <Link to="/tools/internal-audio-recorder" className="text-indigo-600 hover:underline font-medium">
          Internal Audio Recorder
        </Link>{' '}
        that gets as close as the web allows to Audacity&apos;s Windows WASAPI loopback workflow — no upload, no
        account, no watermark.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        What &quot;WASAPI loopback&quot; means (and what browsers can do)
      </h2>
      <p>
        In Audacity you set <strong>Audio Setup → Host → Windows WASAPI</strong>, then choose a{' '}
        <strong>Speakers (loopback)</strong> or <strong>Headphones (loopback)</strong> device. That loopback path
        records internal sound instead of the mic.
      </p>
      <p>
        Browsers cannot open that exact control panel. On Windows Chrome and Edge, though, the same loopback endpoints
        often appear in the device list after you allow microphone access once. Pridocs surfaces those devices first,
        and when they are missing offers a reliable fallback: <strong>share a tab or screen with system audio</strong>
        — only the audio track is saved.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        How to record computer sound online (no install)
      </h2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>
          Open the{' '}
          <Link to="/tools/internal-audio-recorder" className="text-indigo-600 hover:underline font-medium">
            Internal Audio Recorder
          </Link>
          .
        </li>
        <li>
          Prefer <strong>Loopback device</strong> and pick Speakers/Headphones (loopback) or Stereo Mix if listed.
        </li>
        <li>
          Or choose <strong>System / tab audio</strong>, select a Chrome tab or entire screen, and enable{' '}
          <strong>Share tab audio</strong> / <strong>Share system audio</strong>.
        </li>
        <li>Hit record. Stop when done. Download WebM instantly — or convert to WAV / MP3 in the browser.</li>
      </ol>
      <p>
        Echo cancellation and noise suppression are turned off for cleaner capture. Nothing leaves your device.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">
        Better than &quot;record microphone&quot; tools for meetings and tutorials
      </h2>
      <p>
        People searching for <strong>record internal audio</strong>, <strong>capture tab audio</strong>,{' '}
        <strong>stereo mix recorder</strong>, or <strong>record computer sound without Audacity</strong> are tired of
        desk-mic bleed and missing playback. Loopback or tab audio share records the digital stream — clearer for
        transcription, clips, and demos. After recording, trim or join files with{' '}
        <Link to="/tools/audio-trimmer" className="text-indigo-600 hover:underline">
          Audio Trimmer
        </Link>{' '}
        and{' '}
        <Link to="/tools/audio-merger" className="text-indigo-600 hover:underline">
          Merge Audio
        </Link>
        .
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Privacy: why local recording matters</h2>
      <p>
        Call recordings, lecture audio, and client demos are sensitive. Cloud &quot;voice note&quot; sites that upload
        every take create a retention risk you never signed up for. Pridocs runs the recorder in your browser — same
        privacy posture as our PDF and image tools: process on-device, download when you are ready.
      </p>

      <p className="font-medium text-slate-900 mt-8">
        Ready:{' '}
        <Link to="/tools/internal-audio-recorder" className="text-indigo-600 hover:underline">
          Record system audio free — Internal Audio Recorder
        </Link>
        .
      </p>
    </div>
  )
}
