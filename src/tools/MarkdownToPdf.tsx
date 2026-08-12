import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

function markdownToPlain(md: string) {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

export default function MarkdownToPdf() {
  const [md, setMd] = useState('# Hello from Pridocs\n\nWrite **Markdown** here and download a simple PDF.\n\n- Private\n- Local\n- Free')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const convert = async () => {
    setBusy(true)
    setResult(null)
    try {
      const text = markdownToPlain(md)
      const pdf = await PDFDocument.create()
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      let page = pdf.addPage([595, 842])
      const { width, height } = page.getSize()
      const fontSize = 11
      const lineHeight = 16
      const margin = 50
      let y = height - margin

      for (const line of text.split('\n')) {
        const words = line.split(' ')
        let current = ''
        for (const word of words) {
          const test = current ? current + ' ' + word : word
          if (font.widthOfTextAtSize(test, fontSize) > width - margin * 2 && current) {
            if (y < margin + lineHeight) {
              page = pdf.addPage([595, 842])
              y = height - margin
            }
            page.drawText(current, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
            y -= lineHeight
            current = word
          } else {
            current = test
          }
        }
        if (y < margin + lineHeight) {
          page = pdf.addPage([595, 842])
          y = height - margin
        }
        if (current) {
          page.drawText(current, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
        }
        y -= lineHeight
      }

      const bytes = await pdf.save()
      setResult(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Markdown to PDF</h1>
        <p className="text-slate-500">
          Convert Markdown notes to a text-focused PDF in your browser (not a full CSS print engine).
        </p>
      </div>
      <textarea
        value={md}
        onChange={(e) => setMd(e.target.value)}
        className="w-full min-h-[280px] p-4 rounded-2xl border font-mono text-sm dark:bg-slate-800 dark:border-slate-600"
      />
      <button
        type="button"
        onClick={convert}
        disabled={busy || !md.trim()}
        className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        Convert to PDF
      </button>
      {result && (
        <a href={result} download="markdown.pdf" className="mt-3 inline-flex items-center gap-2 text-indigo-600 hover:underline">
          <Download className="w-4 h-4" /> Download PDF
        </a>
      )}
    </div>
  )
}
