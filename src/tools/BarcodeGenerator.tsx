import { useEffect, useRef, useState } from 'react'
import { Download, Barcode as BarcodeIcon } from 'lucide-react'
import JsBarcode from 'jsbarcode'

const FORMATS = [
  { id: 'CODE128', label: 'CODE128 (any text)' },
  { id: 'EAN13', label: 'EAN-13 (12-13 digits)' },
  { id: 'UPC', label: 'UPC-A (11-12 digits)' },
  { id: 'CODE39', label: 'CODE39' },
  { id: 'ITF14', label: 'ITF-14 (14 digits)' },
  { id: 'MSI', label: 'MSI' },
  { id: 'pharmacode', label: 'Pharmacode (number)' },
]

export default function BarcodeGenerator() {
  const [value, setValue] = useState('123456789012')
  const [format, setFormat] = useState('CODE128')
  const [error, setError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return
    try {
      JsBarcode(canvas, value, {
        format,
        width: 2,
        height: 100,
        displayValue: true,
        margin: 10,
        background: '#ffffff',
      })
      setError('')
    } catch (err: any) {
      setError(err?.message || `"${value}" is not valid for ${format}`)
    }
  }, [value, format])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `barcode-${format}.png`
    a.click()
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Barcode Generator</h1>
        <p className="text-slate-500">Generate CODE128, EAN-13, UPC and other barcode formats — 100% locally.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Value</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 font-mono"
            placeholder="Enter text or number..."
          />
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-x-auto">
          <canvas ref={canvasRef} />
        </div>

        <button
          onClick={download}
          disabled={!!error || !value}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" /> Open Your File
        </button>
      </div>

      <section className="mt-16 pt-10 border-t border-slate-200 text-center">
        <BarcodeIcon className="w-5 h-5 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Generated entirely on your device using an open-source barcode library. Nothing is uploaded anywhere.
        </p>
      </section>
    </div>
  )
}
