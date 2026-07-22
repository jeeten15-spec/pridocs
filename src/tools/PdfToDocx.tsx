import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

// Minimal DOCX generator (Office Open XML)
function createSimpleDocx(text: string): Blob {
  const paragraphs = text.split(/\n+/).filter(p => p.trim())
  const bodyContent = paragraphs.map(p => {
    const escaped = p
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<w:p><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`
  }).join('')

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyContent}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`

  // Create a simple ZIP using the browser CompressionStream if available, otherwise fallback
  // For maximum compatibility we use a minimal pre-built structure with Blob
  // Note: True ZIP creation without a library is limited; we use a well-known minimal approach

  // Using a data URL approach for a basic valid DOCX is complex.
  // Instead we return a .docx that many apps can open by using the XML Spreadsheet-like approach
  // or simply provide a clean .txt + instruction. For better UX we create a proper minimal DOCX
  // using the fact that modern browsers + Office can open certain structures.

  // Practical approach: return the text as a downloadable .docx with correct MIME
  // Many systems accept the document.xml wrapped properly.

  const zipParts: { name: string; content: string }[] = [
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rels },
    { name: 'word/document.xml', content: documentXml },
    { name: 'word/_rels/document.xml.rels', content: wordRels },
  ]

  // Simple ZIP writer (store method only – no compression)
  function createZip(files: { name: string; content: string }[]): Blob {
    const encoder = new TextEncoder()
    const chunks: Uint8Array[] = []
    const centralDirectory: Uint8Array[] = []
    let offset = 0

    for (const file of files) {
      const nameBytes = encoder.encode(file.name)
      const dataBytes = encoder.encode(file.content)
      const localHeader = new Uint8Array(30 + nameBytes.length)
      const view = new DataView(localHeader.buffer)
      view.setUint32(0, 0x04034b50, true) // signature
      view.setUint16(8, 0, true) // compression = store
      view.setUint16(26, nameBytes.length, true)
      view.setUint32(18, dataBytes.length, true) // compressed size
      view.setUint32(22, dataBytes.length, true) // uncompressed size
      localHeader.set(nameBytes, 30)

      chunks.push(localHeader, dataBytes)

      // Central directory header
      const central = new Uint8Array(46 + nameBytes.length)
      const cview = new DataView(central.buffer)
      cview.setUint32(0, 0x02014b50, true)
      cview.setUint16(28, nameBytes.length, true)
      cview.setUint32(16, dataBytes.length, true)
      cview.setUint32(20, dataBytes.length, true)
      cview.setUint32(42, offset, true)
      central.set(nameBytes, 46)
      centralDirectory.push(central)

      offset += localHeader.length + dataBytes.length
    }

    const centralStart = offset
    for (const c of centralDirectory) {
      chunks.push(c)
      offset += c.length
    }

    // End of central directory
    const end = new Uint8Array(22)
    const eview = new DataView(end.buffer)
    eview.setUint32(0, 0x06054b50, true)
    eview.setUint16(8, files.length, true)
    eview.setUint16(10, files.length, true)
    eview.setUint32(12, offset - centralStart, true)
    eview.setUint32(16, centralStart, true)
    chunks.push(end)

    return new Blob(chunks, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  }

  return createZip(zipParts)
}

export default function PdfToDocx() {
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
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

      const data = new Uint8Array(await f.arrayBuffer())
      const pdf = await pdfjs.getDocument({ data }).promise
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((item: any) => item.str).join(' ')
        fullText += pageText + '\n\n'
      }

      const blob = createSimpleDocx(fullText.trim())
      setResult(URL.createObjectURL(blob))
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Conversion failed. Please try a different PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">PDF to DOCX Converter Online - Free & Private</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Extract text from PDF and create an editable Word document entirely in your browser. Best for text-heavy PDFs. Complex layouts and images are not fully reconstructed.
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
          <p className="font-medium text-slate-700">{file ? file.name : 'Drop a PDF file here or click to browse'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input
          type="file"
          accept="application/pdf"
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
            download={file?.name.replace(/\.pdf$/i, '.docx') || 'document.docx'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">
        Note: This extracts text content into a clean editable Word file. Original fonts, images, and complex multi-column layouts are not preserved. For perfect fidelity a private server mode is planned.
      </p>
    </div>
  )
}
