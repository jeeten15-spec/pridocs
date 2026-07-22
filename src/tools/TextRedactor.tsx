import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import mammoth from 'mammoth'

export default function TextRedactor() {
  const [input, setInput] = useState('')
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [fileName, setFileName] = useState('')

  const extractTextFromFile = async (file: File) => {
    setBusy(true)
    setFileName(file.name)
    try {
      const name = file.name.toLowerCase()
      if (name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        setInput(result.value)
      } else if (name.endsWith('.pdf')) {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
        const data = new Uint8Array(await file.arrayBuffer())
        const pdf = await pdfjs.getDocument({ data }).promise
        let fullText = ''
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          const pageText = content.items.map((item: any) => item.str).join(' ')
          fullText += pageText + '\n\n'
        }
        setInput(fullText.trim())
      } else if (name.endsWith('.txt') || file.type.startsWith('text/')) {
        const text = await file.text()
        setInput(text)
      } else {
        alert('Supported formats: PDF, DOCX, TXT')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to extract text from file')
    } finally {
      setBusy(false)
    }
  }

  const redact = () => {
    if (!findText) return
    const result = input.split(findText).join(replaceText || '█'.repeat(Math.min(findText.length, 8)))
    setOutput(result)
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    alert('Copied to clipboard!')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2 text-center">Text Redactor</h1>
      <p className="text-center text-slate-500 mb-8">Find, replace or redact sensitive text. Upload PDF / Word / TXT or paste text.</p>
      
      {/* File upload */}
      <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 cursor-pointer bg-white mb-6">
        {busy ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /> : <Upload className="w-8 h-8 text-slate-400" />}
        <div className="text-center text-sm">
          <p className="font-medium">{fileName || 'Drop PDF, DOCX or TXT file here'}</p>
          <p className="text-slate-400 mt-1">or click to browse</p>
        </div>
        <input
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && extractTextFromFile(e.target.files[0])}
        />
      </label>

      <div className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text here or upload a file above..."
          className="w-full h-40 p-4 rounded-xl border border-slate-200"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <input 
            value={findText} 
            onChange={(e) => setFindText(e.target.value)} 
            placeholder="Text to find / redact" 
            className="p-3 rounded-xl border border-slate-200" 
          />
          <input 
            value={replaceText} 
            onChange={(e) => setReplaceText(e.target.value)} 
            placeholder="Replace with (leave empty to redact)" 
            className="p-3 rounded-xl border border-slate-200" 
          />
        </div>
        
        <button onClick={redact} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500">
          Redact / Replace
        </button>
        
        {output && (
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Result</span>
              <button onClick={copy} className="text-sm text-indigo-600 hover:underline">Copy</button>
            </div>
            <textarea value={output} readOnly className="w-full h-40 p-4 rounded-xl border border-slate-200 bg-slate-50" />
          </div>
        )}
      </div>
    </div>
  )
}
