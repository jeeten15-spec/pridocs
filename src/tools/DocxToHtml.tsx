import { useState } from 'react'
import { Code, Download, Loader2, Upload } from 'lucide-react'
import mammoth from 'mammoth'
import { cn, formatBytes } from '../lib/utils'

export default function DocxToHtml() {
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
      const { value } = await mammoth.convertToHtml({ arrayBuffer })
      setResult(value)
    } catch (err: any) {
      setError(err?.message || 'Conversion failed')
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
    const blob = new Blob([result], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name.replace(/\.docx$/i, '.html')
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">DOCX to HTML</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Turn Word documents into clean, semantic HTML. 100% private — runs entirely in your browser.
          </p>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
          <div className="text-center">
            <p className="font-medium text-slate-700">{file ? file.name : 'Drop a .docx file here or click to browse'}</p>
            {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          </div>
          <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </label>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-slate-800 flex items-center gap-2"><Code className="w-4 h-4" /> Result</h2>
              <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium">
                <Download className="w-4 h-4" /> Open HTML
              </button>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 overflow-auto max-h-96 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: result }} />
          </div>
        )}

        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>Powered by <strong>mammoth.js</strong>, which produces clean, semantic HTML from .docx files while preserving headings, lists, links, tables and basic formatting.</p>
            <p>Everything runs locally. Your document is never uploaded. When you close the tab, the data is gone.</p>
          </div>
        </section>
      </div>
    </>
  )
}
