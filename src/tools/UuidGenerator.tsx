import { useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'

export default function UuidGenerator() {
  const [uuid, setUuid] = useState('')

  const generate = () => {
    const newUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    setUuid(newUuid)
  }

  const copy = () => {
    navigator.clipboard.writeText(uuid)
    alert('UUID copied!')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">UUID Generator</h1>
      
      <button onClick={generate} className="w-full py-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center gap-2 mb-4">
        <RefreshCw className="w-4 h-4" /> Generate UUID v4
      </button>

      {uuid && (
        <div className="p-4 rounded-xl bg-white border flex items-center justify-between font-mono">
          <span className="break-all">{uuid}</span>
          <button onClick={copy} className="text-indigo-600 ml-2"><Copy className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  )
}
