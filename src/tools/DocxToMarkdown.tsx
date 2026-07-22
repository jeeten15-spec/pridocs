import { useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'
import mammoth from 'mammoth'
import { cn, formatBytes } from '../lib/utils'

export default function DocxToMarkdown() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const arrayBuffer = await f.arrayBuffer()

      // Basic validation – DOCX must be a ZIP (starts with PK)
      const header = new Uint8Array(arrayBuffer.slice(0, 4))
      if (header[0] !== 0x50 || header[1] !== 0x4b) {
        throw new Error('This does not appear to be a valid .docx file. It may be corrupted, password-protected, or a different format.')
      }

      const { value } = await (mammoth as any).convertToMarkdown({ arrayBuffer })
      
      if (!value || value.trim().length === 0) {
        throw new Error('No readable text could be extracted. The document may be empty, heavily redacted, or contain only images.')
      }

      setResult(value)
    } catch (err: any) {
      const msg = err?.message || String(err)
      if (msg.includes('xmldom') || msg.includes('invalid doc source') || msg.includes('Could not find')) {
        setError('This document could not be parsed. It may be corrupted, password-protected, or heavily redacted. Please try a different file.')
      } else {
        setError(msg || 'Conversion failed')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    if (!f.name.match(/\.docx$/i)) {
      setError('Please select a .docx file')
      return
    }
    setFile(f)
    convert(f)
  }

  const download = () => {
    if (!result || !file) return
    const blob = new Blob([result], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name.replace(/\.docx$/i, '.md')
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">DOCX to Markdown Converter Online - Free & Private</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Convert Microsoft Word DOCX documents to clean Markdown text. Tables and original layout formatting are preserved safely on your local device.
        </p>
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
          drag ? 'border-indigo-400' : 'border-slate-200'
        )}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop a DOCX file here'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input type="file" accept=".docx" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8">
          <pre className="p-4 rounded-xl bg-slate-50 border text-sm overflow-auto max-h-64 mb-4 whitespace-pre-wrap">{result.slice(0, 2000)}{result.length > 2000 ? '…' : ''}</pre>
          <div className="text-center">
            <button onClick={download} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium">
              <Download className="w-5 h-5" /> Open Your Document
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
