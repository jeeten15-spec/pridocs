import { useState } from 'react'

export default function JwtDecoder() {
  const [jwt, setJwt] = useState('')
  const [decoded, setDecoded] = useState<any>(null)

  const decode = () => {
    try {
      const parts = jwt.split('.')
      if (parts.length !== 3) throw new Error('Invalid JWT')
      const header = JSON.parse(atob(parts[0]))
      const payload = JSON.parse(atob(parts[1]))
      setDecoded({ header, payload })
    } catch {
      alert('Invalid JWT token')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">JWT Decoder</h1>
      
      <textarea value={jwt} onChange={e => setJwt(e.target.value)} placeholder="Paste JWT token here..." className="w-full h-24 p-4 rounded-xl border mb-4 font-mono text-sm" />
      
      <button onClick={decode} className="w-full py-3 rounded-xl bg-indigo-600 text-white mb-6">Decode JWT</button>

      {decoded && (
        <div className="space-y-4">
          <div>
            <div className="font-medium mb-1">Header</div>
            <pre className="p-4 rounded-xl bg-slate-50 text-sm overflow-auto">{JSON.stringify(decoded.header, null, 2)}</pre>
          </div>
          <div>
            <div className="font-medium mb-1">Payload</div>
            <pre className="p-4 rounded-xl bg-slate-50 text-sm overflow-auto">{JSON.stringify(decoded.payload, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
