import { useState } from 'react'
import { Upload, Check, Copy, Image as ImageIcon, Palette } from 'lucide-react'
import { cn } from '../lib/utils'

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360
  s /= 100
  l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let [r, g, b] = [0, 0, 0]
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function extractDominantColors(img: HTMLImageElement, count: number): string[] {
  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 150 / Math.max(img.naturalWidth, img.naturalHeight))
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>()
  const step = 24
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 128) continue
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const key = `${Math.round(r / step)},${Math.round(g / step)},${Math.round(b / step)}`
    const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 }
    bucket.r += r
    bucket.g += g
    bucket.b += b
    bucket.n += 1
    buckets.set(key, bucket)
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.n - a.n)
  return sorted.slice(0, count).map((b) => rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n))
}

function buildSchemes(hex: string) {
  const [r, g, b] = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const toHex = (hh: number, ss: number, ll: number) => rgbToHex(...hslToRgb(hh, ss, ll))

  return {
    Complementary: [hex, toHex(h + 180, s, l)],
    Analogous: [toHex(h - 30, s, l), hex, toHex(h + 30, s, l)],
    Triadic: [hex, toHex(h + 120, s, l), toHex(h + 240, s, l)],
    Monochromatic: [
      toHex(h, s, Math.min(90, l + 30)),
      toHex(h, s, Math.min(75, l + 15)),
      hex,
      toHex(h, s, Math.max(15, l - 15)),
      toHex(h, s, Math.max(5, l - 30)),
    ],
  }
}

interface Swatch {
  hex: string
}

function SwatchRow({ colors }: { colors: string[] }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex)
      setTimeout(() => setCopied(null), 1500)
    }).catch(() => {})
  }
  return (
    <div className="flex rounded-xl overflow-hidden border border-slate-200">
      {colors.map((hex, i) => (
        <button
          key={i}
          onClick={() => copy(hex)}
          className="flex-1 h-24 flex items-end justify-center pb-2 relative group"
          style={{ backgroundColor: hex }}
        >
          <span className={cn(
            'text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-white flex items-center gap-1 opacity-90 group-hover:opacity-100'
          )}>
            {copied === hex ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {hex.toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  )
}

interface ColorPaletteProps {
  embedded?: boolean
}

export default function ColorPalette({ embedded = false }: ColorPaletteProps) {
  const [mode, setMode] = useState<'image' | 'color'>('color')
  const [baseColor, setBaseColor] = useState('#6366f1')
  const [imageColors, setImageColors] = useState<Swatch[] | null>(null)
  const [drag, setDrag] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFile = (f: File | null) => {
    if (!f) return
    const img = new Image()
    const url = URL.createObjectURL(f)
    img.onload = () => {
      setImageColors(extractDominantColors(img, 6).map((hex) => ({ hex })))
      setPreviewUrl(url)
    }
    img.src = url
  }

  const schemes = buildSchemes(baseColor)

  return (
    <div className={embedded ? '' : 'max-w-2xl mx-auto px-4 py-10'}>
      {!embedded && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Color Palette Generator</h1>
          <p className="text-slate-500 max-w-xl mx-auto">Extract a palette from a photo, or generate matching color schemes from a base color — click any swatch to copy its hex code.</p>
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setMode('color')}
          className={cn('px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5', mode === 'color' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600')}
        >
          <Palette className="w-4 h-4" /> From a color
        </button>
        <button
          onClick={() => setMode('image')}
          className={cn('px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5', mode === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600')}
        >
          <ImageIcon className="w-4 h-4" /> From an image
        </button>
      </div>

      {mode === 'color' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="w-14 h-12 rounded-lg border cursor-pointer" />
            <input
              type="text"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="p-3 rounded-xl border font-mono w-32 text-center"
            />
          </div>
          {Object.entries(schemes).map(([name, colors]) => (
            <div key={name}>
              <p className="text-sm font-medium text-slate-600 mb-2">{name}</p>
              <SwatchRow colors={colors} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
            className={cn(
              'flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
              drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
            )}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="max-h-40 rounded-lg object-contain" />
            ) : (
              <Upload className="w-10 h-10 text-slate-400" />
            )}
            <p className="font-medium text-slate-700 text-sm">Drop a photo here or click to browse</p>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
          </label>

          {imageColors && (
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Dominant colors</p>
              <SwatchRow colors={imageColors.map((c) => c.hex)} />
            </div>
          )}
        </div>
      )}

      {!embedded && (
        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>Image colors are sampled directly from the pixels of your photo on an in-memory canvas. Color schemes are generated using standard HSL color-wheel math.</p>
            <p>Everything happens locally — your photo is never uploaded anywhere.</p>
          </div>
        </section>
      )}
    </div>
  )
}
