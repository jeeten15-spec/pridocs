import { useEffect, useState } from 'react'
import { Download, Loader2, Upload, Wand2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

const BG_OPTIONS: { id: string; label: string; color: string | null }[] = [
  { id: 'transparent', label: 'Transparent', color: null },
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'black', label: 'Black', color: '#000000' },
]

interface BackgroundRemoverProps {
  embedded?: boolean
}

function compositeWithColor(imageUrl: string, color: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not render image'))), 'image/png')
    }
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = imageUrl
  })
}

export default function BackgroundRemover({ embedded = false }: BackgroundRemoverProps) {
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progressLabel, setProgressLabel] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [error, setError] = useState('')
  const [bgOption, setBgOption] = useState('transparent')
  const [customColor, setCustomColor] = useState('#22c55e')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const process = async (f: File) => {
    setBusy(true)
    setError('')
    setCutoutUrl(null)
    setDownloadUrl(null)
    setProgressPct(0)
    setProgressLabel('Loading AI model…')
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(f, {
        device: 'gpu',
        model: 'isnet_quint8',
        progress: (key: string, current: number, total: number) => {
          const pct = total > 0 ? Math.round((current / total) * 100) : 0
          setProgressPct(pct)
          setProgressLabel(
            key.includes('fetch') || key.includes('model') || key.includes('wasm')
              ? `Downloading AI model… ${pct}%`
              : `Processing… ${pct}%`
          )
        },
      })
      setCutoutUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      console.error(err)
      setError(
        err?.message ||
          'Background removal failed. Your browser or device may not have enough memory for this image — try a smaller photo.'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    setOriginalUrl(URL.createObjectURL(f))
    process(f)
  }

  // Recompute the downloadable file whenever the chosen background changes.
  useEffect(() => {
    if (!cutoutUrl) return
    const opt = BG_OPTIONS.find((o) => o.id === bgOption)
    const color = bgOption === 'custom' ? customColor : opt?.color

    if (!color) {
      setDownloadUrl(cutoutUrl)
      return
    }
    let cancelled = false
    compositeWithColor(cutoutUrl, color).then((blob) => {
      if (!cancelled) setDownloadUrl(URL.createObjectURL(blob))
    })
    return () => {
      cancelled = true
    }
  }, [cutoutUrl, bgOption, customColor])

  const previewBg = bgOption === 'transparent' ? undefined : bgOption === 'custom' ? customColor : BG_OPTIONS.find((o) => o.id === bgOption)?.color

  return (
    <div className={embedded ? '' : 'max-w-3xl mx-auto px-4 py-10'}>
      {!embedded && (
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">Free AI Background Remover (100% Private, Unlimited)</h1>
          <p className="text-slate-500 max-w-xl mx-auto">Remove the background from any photo using an on-device AI model. No uploads, no watermark, no daily limit.</p>
        </div>
      )}

      {!cutoutUrl && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
          className={cn(
            'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
            drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
          )}
        >
          {originalUrl ? (
            <img src={originalUrl} alt="Preview" className="max-h-48 rounded-lg object-contain" />
          ) : (
            <Wand2 className="w-10 h-10 text-slate-400" />
          )}
          <div className="text-center">
            <p className="font-medium text-slate-700">{file ? file.name : 'Drop a photo here or click to browse'}</p>
            {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        </label>
      )}

      {busy && (
        <div className="mt-6 p-5 rounded-2xl bg-white border border-slate-200 text-center">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">{progressLabel}</p>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden max-w-xs mx-auto">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-3 text-xs text-slate-400">First use downloads a one-time AI model (~40MB), cached by your browser afterwards. Later images are much faster.</p>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {cutoutUrl && (
        <div className="mt-2 space-y-5">
          <div
            className="rounded-2xl border border-slate-200 flex items-center justify-center p-6 min-h-[16rem]"
            style={{
              backgroundColor: previewBg,
              backgroundImage: previewBg
                ? undefined
                : 'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          >
            <img src={cutoutUrl} alt="Background removed" className="max-h-96 max-w-full object-contain" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Background:</span>
            {BG_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setBgOption(opt.id)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  bgOption === opt.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                {opt.label}
              </button>
            ))}
            <label className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5',
              bgOption === 'custom' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
            )}>
              <input
                type="color"
                value={customColor}
                onChange={(e) => { setCustomColor(e.target.value); setBgOption('custom') }}
                className="w-4 h-4 rounded-full border-none p-0 cursor-pointer"
              />
              Custom
            </label>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={(file?.name.replace(/\.[^.]+$/, '') || 'image') + '-no-bg.png'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                <Download className="w-5 h-5" /> Open Your File
              </a>
            )}
            <button
              onClick={() => { setFile(null); setOriginalUrl(null); setCutoutUrl(null); setDownloadUrl(null); setError('') }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-medium"
            >
              Try another photo
            </button>
          </div>
        </div>
      )}

      {!embedded && (
        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">How it works</h2>
          <div className="text-slate-600 text-sm space-y-3">
            <p>
              This tool runs an open-source AI segmentation model (<strong>IS-Net</strong>) directly in your browser
              using WebAssembly and, where supported, your GPU via WebGPU — the same technology used by paid,
              upload-based background removers, except your photo never leaves your device.
            </p>
            <p>
              On first use your browser downloads the AI model once (it's cached afterwards, so future images are
              fast). No account, no watermark, and no daily limit.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
