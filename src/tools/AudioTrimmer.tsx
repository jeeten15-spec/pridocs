import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'

export default function AudioTrimmer() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-6">
        <Music className="w-8 h-8 text-violet-600" />
      </div>
      <h1 className="text-3xl font-semibold text-slate-900 mb-3">Audio Trimmer</h1>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        Trim, fade, and normalize audio tracks locally in your browser.
      </p>
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-left space-y-4">
        <p className="text-sm text-slate-600">
          Advanced audio processing (trim, fade in/out, volume, loop) is available inside the 
          <strong> Audio to Video (Song2Vid)</strong> tool which uses FFmpeg.wasm for high-quality local processing.
        </p>
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <strong>File size limit:</strong> Recommended under 50–100 MB. Multi-thread mode is used automatically when supported by your browser.
        </div>
        <Link to="/tools/song2vid" className="inline-block mt-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium">
          Open Audio to Video / Media Tools
        </Link>
      </div>
    </div>
  )
}
