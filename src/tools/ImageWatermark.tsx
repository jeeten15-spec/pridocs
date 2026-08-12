import { useEffect, useRef, useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

type Pos = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export default function ImageWatermark() {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('Pridocs')
  const [opacity, setOpacity] = useState(0.35)
  const [pos, setPos] = useState<Pos>('bottom-right')
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const render = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()

      const fontSize = Math.max(16, Math.round(canvas.width * 0.04))
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillStyle = `rgba(255,255,255,${opacity})`
      ctx.strokeStyle = `rgba(0,0,0,${opacity * 0.5})`
      ctx.lineWidth = Math.max(1, fontSize / 16)
      const metrics = ctx.measureText(text)
      const pad = fontSize
      let x = canvas.width / 2 - metrics.width / 2
      let y = canvas.height / 2
      if (pos === 'top-left') {
        x = pad
        y = pad + fontSize
      } else if (pos === 'top-right') {
        x = canvas.width - metrics.width - pad
        y = pad + fontSize
      } else if (pos === 'bottom-left') {
        x = pad
        y = canvas.height - pad
      } else if (pos === 'bottom-right') {
        x = canvas.width - metrics.width - pad
        y = canvas.height - pad
      }
      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
      setPreview(canvas.toDataURL('image/png'))
    } catch (err: any) {
      setError(err?.message || 'Watermark failed')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (file) render()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, text, opacity, pos])

  const handle = (f: File | null) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image')
      return
    }
    setFile(f)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Image Watermark</h1>
        <p className="text-slate-500">Add a text watermark to photos locally — no upload.</p>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handle(e.dataTransfer.files?.[0] || null)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white mb-4',
          drag ? 'border-indigo-400' : 'border-slate-200'
        )}
      >
        {busy ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /> : <Upload className="w-8 h-8 text-slate-400" />}
        <p className="font-medium">{file ? file.name : 'Drop an image'}</p>
        {file && <p className="text-sm text-slate-400">{formatBytes(file.size)}</p>}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handle(e.target.files?.[0] || null)} />
      </label>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <input className="p-3 rounded-xl border" value={text} onChange={(e) => setText(e.target.value)} placeholder="Watermark text" />
        <select className="p-3 rounded-xl border" value={pos} onChange={(e) => setPos(e.target.value as Pos)}>
          <option value="center">Center</option>
          <option value="top-left">Top left</option>
          <option value="top-right">Top right</option>
          <option value="bottom-left">Bottom left</option>
          <option value="bottom-right">Bottom right</option>
        </select>
      </div>
      <label className="block text-sm mb-4">
        Opacity: {Math.round(opacity * 100)}%
        <input type="range" min={0.1} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" />
      </label>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {preview && (
        <div>
          <img ref={imgRef} src={preview} alt="Watermarked" className="rounded-xl border max-h-96 mx-auto object-contain" />
          <a
            href={preview}
            download={(file?.name || 'image').replace(/\.[^.]+$/, '') + '-watermarked.png'}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium"
          >
            <Download className="w-4 h-4" /> Download PNG
          </a>
        </div>
      )}
    </div>
  )
}
