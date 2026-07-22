import { useState } from 'react'

export default function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const convert = () => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(input))
      } else {
        setOutput(atob(input))
      }
    } catch {
      alert('Invalid input for ' + mode)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">Base64 Encoder / Decoder</h1>
      
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('encode')} className={`flex-1 py-2 rounded-xl ${mode === 'encode' ? 'bg-indigo-600 text-white' : 'border'}`}>Encode</button>
        <button onClick={() => setMode('decode')} className={`flex-1 py-2 rounded-xl ${mode === 'decode' ? 'bg-indigo-600 text-white' : 'border'}`}>Decode</button>
      </div>

      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text..." className="w-full h-32 p-4 rounded-xl border mb-4" />
      
      <button onClick={convert} className="w-full py-3 rounded-xl bg-indigo-600 text-white mb-4">Convert</button>

      {output && <textarea value={output} readOnly className="w-full h-32 p-4 rounded-xl border bg-slate-50" />}
    </div>
  )
}
