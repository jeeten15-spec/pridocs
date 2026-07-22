import { useState } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export default function HtmlToPdf() {
  const [html, setHtml] = useState('<h1>Hello from Pridocs</h1>\n<p>This is a simple HTML to PDF converter that runs entirely in your browser.</p>')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const convert = async () => {
    setBusy(true)
    try {
      // Strip tags for a simple text-based PDF (full CSS rendering needs heavier libraries)
      const text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()

      const pdf = await PDFDocument.create()
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      let page = pdf.addPage([595, 842]) // A4
      const { width, height } = page.getSize()
      const fontSize = 11
      const lineHeight = 16
      const margin = 50
      let y = height - margin

      const lines = text.split('\n')
      for (const line of lines) {
        if (y < margin + lineHeight) {
          page = pdf.addPage([595, 842])
          y = height - margin
        }
        // Simple word wrap
        const words = line.split(' ')
        let currentLine = ''
        for (const word of words) {
          const test = currentLine ? currentLine + ' ' + word : word
          const w = font.widthOfTextAtSize(test, fontSize)
          if (w > width - margin * 2 && currentLine) {
            page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
            y -= lineHeight
            currentLine = word
            if (y < margin + lineHeight) {
              page = pdf.addPage([595, 842])
              y = height - margin
            }
          } else {
            currentLine = test
          }
        }
        if (currentLine) {
          page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
          y -= lineHeight
        }
      }

      const bytes = await pdf.save()
      setResult(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } catch {
      alert('Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">HTML to PDF</h1>
        <p className="text-slate-500">Convert HTML content to a clean PDF. Text-focused (CSS layout limited in pure browser).</p>
      </div>

      <textarea
        value={html}
        onChange={e => setHtml(e.target.value)}
        className="w-full h-64 p-4 rounded-xl border font-mono text-sm mb-4"
        placeholder="Paste HTML here..."
      />

      <button
        onClick={convert}
        disabled={busy || !html.trim()}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
        Convert to PDF
      </button>

      {result && (
        <div className="mt-8 text-center">
          <a href={result} download="document.pdf" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl">
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        Note: Complex CSS layouts and images are not fully rendered. For pixel-perfect HTML→PDF, a private server mode (Phase 2) is planned.
      </p>
    </div>
  )
}
