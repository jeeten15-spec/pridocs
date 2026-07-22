import { Link } from 'react-router-dom'
import { Film } from 'lucide-react'

export default function VideoToGif() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
        <Film className="w-8 h-8 text-indigo-600" />
      </div>
      <h1 className="text-3xl font-semibold text-slate-900 mb-3">Video to GIF</h1>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        Convert short video clips to high-quality GIFs entirely in your browser using FFmpeg.wasm.
      </p>
      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-left space-y-4">
        <p className="text-sm text-slate-600">
          This tool is powered by the same FFmpeg.wasm engine used in <strong>Audio to Video (Song2Vid)</strong>. 
          Full interactive conversion (trim, resize, fps control, multi-thread) is available there.
        </p>
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <strong>File size limit:</strong> Keep videos under ~50–80 MB for reliable browser performance.
          Multi-threading is automatically used when your browser supports it (Chrome / Edge with SharedArrayBuffer).
        </div>
        <Link to="/tools/song2vid" className="inline-block mt-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium">
          Go to Audio to Video / Media Tools
        </Link>
      </div>
    </div>
  )
}
