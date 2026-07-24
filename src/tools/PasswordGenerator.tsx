import { useState } from 'react'
import { Copy, RefreshCw } from 'lucide-react'

export default function PasswordGenerator() {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [includeSymbols, setIncludeSymbols] = useState(true)

  const generate = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    let charset = chars
    if (includeSymbols) charset += symbols

    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setPassword(result)
  }

  const copy = () => {
    navigator.clipboard.writeText(password)
    alert('Password copied!')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">Password Generator</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Length: {length}</label>
          <input type="range" min="8" max="32" value={length} onChange={e => setLength(Number(e.target.value))} className="w-full" />
        </div>
        
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeSymbols} onChange={e => setIncludeSymbols(e.target.checked)} />
          Include symbols
        </label>

        <button onClick={generate} className="w-full py-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" /> Generate Password
        </button>

        {password && (
          <div className="p-4 rounded-xl bg-white border flex items-center justify-between">
            <span className="font-mono text-lg break-all">{password}</span>
            <button onClick={copy} className="text-indigo-600"><Copy className="w-5 h-5" /></button>
          </div>
        )}
      </div>
    </div>
  )
}
