import { Link } from 'react-router-dom'

export default function MergeVideosArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Two phone clips. One screen recording. A logo sting. You need one MP4 — without uploading raw footage to a
        random &quot;free merger.&quot;
      </p>
      <p>
        Pridocs{' '}
        <Link to="/tools/merge-videos" className="text-indigo-600 hover:underline font-medium">
          Merge Videos
        </Link>{' '}
        joins clips locally. Reorder with arrows, export a single MP4. Then attach sound with{' '}
        <Link to="/tools/add-audio-to-video" className="text-indigo-600 hover:underline">
          Add Audio to Video
        </Link>
        .
      </p>
      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Recommended flow</h2>
      <ol className="list-decimal pl-6 space-y-2">
        <li><Link to="/tools/video-trimmer" className="text-indigo-600 hover:underline">Trim</Link> each clip</li>
        <li>Merge in order</li>
        <li><Link to="/tools/video-compressor" className="text-indigo-600 hover:underline">Compress</Link> for email if needed</li>
      </ol>
      <p className="font-medium text-slate-900 mt-8">
        <Link to="/tools/merge-videos" className="text-indigo-600 hover:underline">
          Merge videos free — no upload
        </Link>
      </p>
    </div>
  )
}
