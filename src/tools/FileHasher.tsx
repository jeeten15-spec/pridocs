import { useState } from 'react'
import { Hash, Upload } from 'lucide-react'

export default function FileHasher() {
  const [hashes, setHashes] = useState<any>(null)
  const [fileName, setFileName] = useState('')

  const handleFile = async (file: File) => {
    setFileName(file.name)
    const buffer = await file.arrayBuffer()
    
    const hashResults: any = {}
    
    // SHA-256
    const sha256 = await crypto.subtle.digest('SHA-256', buffer)
    hashResults.sha256 = Array.from(new Uint8Array(sha256)).map(b => b.toString(16).padStart(2, '0')).join('')
    
    // SHA-512
    const sha512 = await crypto.subtle.digest('SHA-512', buffer)
    hashResults.sha512 = Array.from(new Uint8Array(sha512)).map(b => b.toString(16).padStart(2, '0')).join('')
    
    setHashes(hashResults)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">File Hasher</h1>
      
      <label className="flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 cursor-pointer bg-white">
        <Upload className="w-10 h-10 text-slate-400" />
        <div className="text-center">
          <p className="font-medium">Drop a file or click to browse</p>
          <p className="text-sm text-slate-500">Calculate SHA-256 and SHA-512 hashes</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          onChange={(e) => e.target.files && handleFile(e.target.files[0])} 
        />
      </label>

      {hashes && (
        <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <Hash className="w-5 h-5" /> {fileName}
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">SHA-256</div>
            <div className="font-mono text-sm break-all bg-slate-50 p-3 rounded">{hashes.sha256}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">SHA-512</div>
            <div className="font-mono text-sm break-all bg-slate-50 p-3 rounded">{hashes.sha512}</div>
          </div>
        </div>
      )}
    </div>
  )
}
