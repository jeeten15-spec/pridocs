import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

export default function ImageFilters() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('none')
  const [brightness, setBrightness] = useState(100)
  const [drag, setDrag] = useState(false)

  const applyFilter = async (f: File, selectedFilter: string, bright: number) => {
    setBusy(true)
    try {
      const bitmap = await createImageBitmap(f)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')!
      
      // Apply CSS filter style
      let filterStr = ''
      if (selectedFilter === 'grayscale') filterStr = 'grayscale(100%)'
      else if (selectedFilter === 'sepia') filterStr = 'sepia(100%)'
      else if (selectedFilter === 'invert') filterStr = 'invert(100%)'
      
      filterStr += ` brightness(${bright}%)`
      ctx.filter = filterStr
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      
      setResult(canvas.toDataURL('image/png'))
    } catch (err) {
      alert('Failed to apply filter')
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (f: File | null) => {
    if (!f) return
    setFile(f)
    applyFilter(f, filter, brightness)
  }

  const update = () => {
    if (file) applyFilter(file, filter, brightness)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">Image Filters</h1>
        <p className="text-slate-500">Apply grayscale, sepia, invert and brightness adjustments.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Filter</label>
          <select value={filter} onChange={e => { setFilter(e.target.value); }} className="w-full p-3 rounded-xl border">
            <option value="none">None</option>
            <option value="grayscale">Grayscale</option>
            <option value="sepia">Sepia</option>
            <option value="invert">Invert</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Brightness: {brightness}%</label>
          <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-full" />
        </div>
      </div>

      <button onClick={update} disabled={!file} className="w-full py-2.5 mb-6 rounded-xl bg-indigo-600 text-white disabled:opacity-50">
        Apply Filters
      </button>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0] || null) }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all bg-white',
          drag ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium text-slate-700">{file ? file.name : 'Drop an image here or click to browse'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
      </label>

      {result && (
        <div className="mt-8 text-center">
          <img src={result} alt="Filtered" className="max-h-96 mx-auto rounded-xl border border-slate-200 shadow-sm mb-4" />
          <a href={result} download="filtered.png" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium">
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}
    </div>
  )
}
