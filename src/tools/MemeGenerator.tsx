import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Upload, Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

interface TextLayer {
  id: string
  text: string
  x: number // 0-1, fraction of canvas width
  y: number // 0-1, fraction of canvas height
  size: number // font size as fraction of canvas width
  color: string
}

function defaultLayers(): TextLayer[] {
  return [
    { id: 'top', text: 'TOP TEXT', x: 0.5, y: 0.08, size: 0.09, color: '#ffffff' },
    { id: 'bottom', text: 'BOTTOM TEXT', x: 0.5, y: 0.88, size: 0.09, color: '#ffffff' },
  ]
}

interface MemeGeneratorProps {
  embedded?: boolean
}

export default function MemeGenerator({ embedded = false }: MemeGeneratorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [fileName, setFileName] = useState('meme')
  const [layers, setLayers] = useState<TextLayer[]>(defaultLayers())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragLayerRef = useRef<string | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    ctx.drawImage(image, 0, 0)

    for (const layer of layers) {
      if (!layer.text) continue
      const fontSize = Math.max(canvas.width * layer.size, 14)
      ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = fontSize * 0.08
      ctx.strokeStyle = '#000000'
      ctx.fillStyle = layer.color

      const x = layer.x * canvas.width
      const y = layer.y * canvas.height
      const maxWidth = canvas.width * 0.92
      wrapText(ctx, layer.text.toUpperCase(), x, y, maxWidth, fontSize * 1.1)
    }
  }, [image, layers])

  useEffect(() => {
    draw()
  }, [draw])

  const handleFile = (f: File | null) => {
    if (!f) return
    setFileName(f.name.replace(/\.[^.]+$/, '') || 'meme')
    const img = new Image()
    img.onload = () => setImage(img)
    img.src = URL.createObjectURL(f)
  }

  const updateLayer = (id: string, patch: Partial<TextLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const addLayer = () => {
    const id = `layer-${Date.now()}`
    setLayers((prev) => [...prev, { id, text: 'NEW TEXT', x: 0.5, y: 0.5, size: 0.08, color: '#ffffff' }])
    setActiveId(id)
  }

  const removeLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
  }

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    // find nearest layer (by y distance, since text spans full width)
    let nearest: TextLayer | null = null
    let minDist = Infinity
    for (const l of layers) {
      const dist = Math.abs(l.y - py) + Math.abs(l.x - px) * 0.3
      if (dist < minDist) {
        minDist = dist
        nearest = l
      }
    }
    if (nearest) {
      dragLayerRef.current = nearest.id
      setActiveId(nearest.id)
    }
  }

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragLayerRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
    const py = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1)
    updateLayer(dragLayerRef.current, { x: px, y: py })
  }

  const stopDrag = () => {
    dragLayerRef.current = null
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}-meme.png`
    a.click()
  }

  return (
    <div className={embedded ? '' : 'max-w-3xl mx-auto px-4 py-10'}>
      {!embedded && (
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Free Meme Generator (No Watermark, No Upload)</h1>
          <p className="text-slate-500 max-w-xl mx-auto">Add classic top/bottom captions or freely positioned text to any image, entirely in your browser.</p>
        </div>
      )}

      {!image ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          <ImageIcon className="w-10 h-10 text-slate-400" />
          <div className="text-center">
            <p className="font-medium text-slate-700">Drop an image here or click to browse</p>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </label>
      ) : (
        <div className="space-y-5">
          <canvas
            ref={canvasRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
            className="w-full rounded-2xl border border-slate-200 cursor-move touch-none"
          />
          <p className="text-center text-xs text-slate-400">Drag any caption directly on the image to reposition it</p>

          <div className="space-y-3">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={cn(
                  'p-3 rounded-xl border transition-colors',
                  activeId === layer.id ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    value={layer.text}
                    onChange={(e) => updateLayer(layer.id, { text: e.target.value })}
                    onFocus={() => setActiveId(layer.id)}
                    className="flex-1 p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-600 text-sm"
                    placeholder="Caption text"
                  />
                  <input
                    type="color"
                    value={layer.color}
                    onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                    className="w-9 h-9 rounded-lg border-none cursor-pointer"
                    title="Text color"
                  />
                  <button onClick={() => removeLayer(layer.id)} className="p-2 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-400 w-14">Size</span>
                  <input
                    type="range"
                    min="0.03"
                    max="0.16"
                    step="0.005"
                    value={layer.size}
                    onChange={(e) => updateLayer(layer.id, { size: Number(e.target.value) })}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addLayer}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-slate-300 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add text
            </button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={download}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              <Download className="w-5 h-5" /> Open Your File
            </button>
            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-medium cursor-pointer">
              <Upload className="w-5 h-5" /> Change image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>
      )}

      {!embedded && (
        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>Your image is drawn onto an HTML canvas together with your captions, then exported as a PNG — all in your browser.</p>
            <p>Nothing is uploaded anywhere, and there's no watermark added to your image.</p>
          </div>
        </section>
      )}
    </div>
  )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)

  const totalHeight = lines.length * lineHeight
  const startY = y - totalHeight / 2 + lineHeight / 2
  lines.forEach((line, i) => {
    const ly = startY + i * lineHeight
    ctx.strokeText(line, x, ly)
    ctx.fillText(line, x, ly)
  })
}
