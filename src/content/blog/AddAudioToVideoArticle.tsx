import { Link } from 'react-router-dom'

export default function AddAudioToVideoArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Your screen recording has no mic track. Your montage needs a new song. Or the original soundtrack is wrong —
        you need to <strong>replace the audio track</strong> without CapCut or Premiere.
      </p>
      <p>
        Pridocs{' '}
        <Link to="/tools/add-audio-to-video" className="text-indigo-600 hover:underline font-medium">
          Add / Replace Audio on Video
        </Link>{' '}
        lets you swap the soundtrack or mix new audio with the original — privately in the browser.
      </p>
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Replace vs mix</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li><strong>Replace</strong> — discard original audio, keep video + new track</li>
        <li><strong>Mix</strong> — blend both (great for voiceover over music)</li>
      </ul>
      <p>
        Pair with{' '}
        <Link to="/tools/video-trimmer" className="text-indigo-600 hover:underline">Video Trimmer</Link> and{' '}
        <Link to="/tools/audio-trimmer" className="text-indigo-600 hover:underline">Audio Trimmer</Link> for a clean
        export.
      </p>
      <p className="font-medium text-slate-900 mt-8">
        <Link to="/tools/add-audio-to-video" className="text-indigo-600 hover:underline">
          Add audio to video free — no upload
        </Link>
      </p>
    </div>
  )
}
