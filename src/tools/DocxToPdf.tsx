import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import mammoth from 'mammoth'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { cn, formatBytes } from '../lib/utils'

export default function DocxToPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const arrayBuffer = await f.arrayBuffer()
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer })

      // Strip HTML to plain text with basic structure
      let text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

      // pdf-lib StandardFonts only support WinAnsi encoding.
      // Remove ALL control characters (including tab 0x09) except newline (0x0A) and keep printable text
      text = text.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ' ')
      // Replace characters outside Latin-1 / WinAnsi
      text = text.replace(/[^\x0A\x20-\xFF]/g, (ch) => {
        const map: Record<string, string> = {
          '✉': '(email)', '•': '-', '–': '-', '—': '-',
          '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"', '…': '...',
          '€': 'EUR', '£': 'GBP', '¥': 'YEN', '©': '(c)', '®': '(R)', '™': '(TM)',
        }
        return map[ch] || '?'
      })

      const pdf = await PDFDocument.create()
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const _fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
      let page = pdf.addPage([595, 842]) // A4
      const { width, height } = page.getSize()
      const fontSize = 11
      const lineHeight = 15
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
          const test = currentLine ? `${currentLine} ${word}` : word
          const w = font.widthOfTextAtSize(test, fontSize)
          if (w > width - margin * 2 && currentLine) {
            page.drawText(currentLine, {
              x: margin,
              y,
              size: fontSize,
              font,
              color: rgb(0.1, 0.1, 0.1),
            })
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
          page.drawText(currentLine, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          })
          y -= lineHeight
        }
      }

      const bytes = await pdf.save()
      setResult(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Conversion failed. Please try a different document.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">DOCX to PDF Converter Online - Free & Private</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Convert Microsoft Word documents to PDF entirely in your browser. Text and basic structure are preserved. Complex layouts and embedded images have limited support in pure browser mode.
        </p>
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault()
          setDrag(false)
          const f = e.dataTransfer.files?.[0]
          if (f) { setFile(f); convert(f) }
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white transition-all',
          drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium text-slate-700">{file ? file.name : 'Drop a DOCX file here or click to browse'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) { setFile(f); convert(f) }
          }}
        />
      </label>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 text-center">
          <a
            href={result}
            download={file?.name.replace(/\.docx$/i, '.pdf') || 'document.pdf'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">
        Note: This is a text-focused conversion. Complex tables, images, and advanced formatting may not appear exactly as in Word. For pixel-perfect results a private server mode is planned.
      </p>
    </div>
  )
}
