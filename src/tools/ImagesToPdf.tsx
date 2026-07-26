import { useState } from 'react'
import { Files, Download, Loader2, Upload, Trash2, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { cn, formatBytes } from '../lib/utils'

// A4 in PDF points (72pt/inch)
const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 24

interface ImagesToPdfProps {
  embedded?: boolean
}

export default function ImagesToPdf({ embedded = false }: ImagesToPdfProps) {
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const images = Array.from(newFiles).filter((f) => f.type.startsWith('image/'))
    setFiles((prev) => [...prev, ...images])
    setOutputUrl(null)
    setError('')
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setOutputUrl(null)
  }

  const move = (index: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const convert = async () => {
    if (files.length === 0) {
      setError('Please add at least one image')
      return
    }
    setBusy(true)
    setError('')
    setOutputUrl(null)
    try {
      const pdfDoc = await PDFDocument.create()

      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
        let image
        if (isPng) {
          image = await pdfDoc.embedPng(bytes)
        } else {
          // Non-JPG/PNG images (webp, gif, bmp, etc.) are decoded via canvas and re-encoded as JPEG first.
          const isJpg = file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name)
          if (isJpg) {
            image = await pdfDoc.embedJpg(bytes)
          } else {
            const jpgBytes = await toJpegBytes(file)
            image = await pdfDoc.embedJpg(jpgBytes)
          }
        }

        const page = pdfDoc.addPage([PAGE_W, PAGE_H])
        const maxW = PAGE_W - MARGIN * 2
        const maxH = PAGE_H - MARGIN * 2
        const scale = Math.min(maxW / image.width, maxH / image.height, 1)
        const w = image.width * scale
        const h = image.height * scale
        page.drawImage(image, {
          x: (PAGE_W - w) / 2,
          y: (PAGE_H - h) / 2,
          width: w,
          height: h,
        })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      setOutputUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err?.message || 'Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={embedded ? '' : 'max-w-3xl mx-auto px-4 py-10'}>
      {!embedded && (
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">JPG / PNG to PDF Converter (Free & Private)</h1>
          <p className="text-slate-500 max-w-xl mx-auto">Combine one or more photos into a single PDF document, entirely in your browser. Reorder pages before converting.</p>
        </div>
      )}

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
          drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <Upload className="w-10 h-10 text-slate-400" />
        <div className="text-center">
          <p className="font-medium text-slate-700">Drop images here or click to browse</p>
          <p className="text-sm text-slate-400 mt-1">JPG, PNG, WebP and more — select multiple files</p>
        </div>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </label>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-xs font-medium text-slate-400 w-5 text-center">{i + 1}</span>
              <ImageIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
              </div>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === files.length - 1} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30">
                <ArrowDown className="w-4 h-4" />
              </button>
              <button onClick={() => removeFile(i)} className="p-1.5 text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <button
          onClick={convert}
          disabled={busy || files.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Files className="w-5 h-5" />}
          {busy ? 'Converting…' : `Convert ${files.length || ''} to PDF`}
        </button>
        {outputUrl && (
          <a href={outputUrl} download="images.pdf" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        )}
      </div>

      {!embedded && (
        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>
              Each image is embedded into a new page of a PDF document using <strong>pdf-lib</strong>, a pure
              JavaScript PDF library that runs entirely in your browser.
            </p>
            <p>Nothing is uploaded — your photos are read, converted and assembled locally on your device.</p>
          </div>
        </section>
      )}
    </div>
  )
}

function toJpegBytes(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) {
            reject(new Error('Could not encode image'))
            return
          }
          blob.arrayBuffer().then(resolve).catch(reject)
        },
        'image/jpeg',
        0.92
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}
