import { useState } from 'react'
import { PenTool, Download, Upload, Loader2 } from 'lucide-react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { cn } from '../lib/utils'

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [signatureText, setSignatureText] = useState('Signed by: Your Name')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [drag] = useState(false)

  const sign = async (f: File) => {
    setBusy(true)
    try {
      const arrayBuffer = await f.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = pdf.getPages()
      const font = await pdf.embedFont(StandardFonts.Helvetica)

      pages.forEach(page => {
        const { width } = page.getSize()
        page.drawText(signatureText, {
          x: width - 200,
          y: 40,
          size: 12,
          font,
          color: rgb(0.2, 0.2, 0.2),
        })
      })

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      setResult(URL.createObjectURL(blob))
    } catch (err) {
      alert('Signing failed')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    setResult(null)
  }

  const download = () => {
    if (!result || !file) return
    const a = document.createElement('a')
    a.href = result
    a.download = file.name.replace('.pdf', '-signed.pdf')
    a.click()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Sign PDF</h1>
        <p className="text-slate-500">Add a simple text signature to all pages.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Signature Text</label>
          <input
            type="text"
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200"
            placeholder="Signed by: Your Name • Date"
          />
        </div>

        <label className={cn(
          'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
          drag ? 'border-indigo-400' : 'border-slate-200'
        )}>
          <Upload className="w-8 h-8 text-slate-400" />
          <div className="text-center text-sm">{file ? file.name : 'Drop PDF here'}</div>
          <input type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
        </label>

        <button
          onClick={() => file && sign(file)}
          disabled={!file || busy}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
          {busy ? 'Signing...' : 'Add Signature to All Pages'}
        </button>

        {result && (
          <div className="text-center">
            <button onClick={download} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl">
              <Download className="w-5 h-5" /> Open Your Document
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
