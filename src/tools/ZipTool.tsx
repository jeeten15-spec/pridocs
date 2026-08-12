import { useState } from 'react'
import { Download, Upload, Loader2, FileArchive } from 'lucide-react'
import JSZip from 'jszip'
import { cn, formatBytes } from '../lib/utils'

type Mode = 'create' | 'extract'

export default function ZipTool() {
  const [mode, setMode] = useState<Mode>('create')
  const [files, setFiles] = useState<File[]>([])
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [entries, setEntries] = useState<{ name: string; blob: Blob }[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)

  const createZip = async () => {
    if (!files.length) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const zip = new JSZip()
      for (const f of files) zip.file(f.name, f)
      const blob = await zip.generateAsync({ type: 'blob' })
      setResult(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err?.message || 'Could not create ZIP')
    } finally {
      setBusy(false)
    }
  }

  const extractZip = async (f: File) => {
    setBusy(true)
    setError('')
    setEntries([])
    try {
      const zip = await JSZip.loadAsync(f)
      const out: { name: string; blob: Blob }[] = []
      const names = Object.keys(zip.files)
      for (const name of names) {
        const entry = zip.files[name]
        if (entry.dir) continue
        const blob = await entry.async('blob')
        out.push({ name, blob })
      }
      setEntries(out)
    } catch (err: any) {
      setError(err?.message || 'Could not read ZIP')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">ZIP Create &amp; Extract</h1>
        <p className="text-slate-500">Pack or unpack ZIP archives locally in your browser.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['create', 'extract'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium capitalize',
              mode === m ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'create' ? (
        <>
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDrag(false)
              const list = Array.from(e.dataTransfer.files || [])
              if (list.length) setFiles((prev) => [...prev, ...list])
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
              drag ? 'border-indigo-400' : 'border-slate-200'
            )}
          >
            <Upload className="w-8 h-8 text-slate-400" />
            <p className="font-medium">Drop files to zip (or click)</p>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files || [])
                if (list.length) setFiles((prev) => [...prev, ...list])
              }}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-4 text-sm text-slate-600 space-y-1">
              {files.map((f) => (
                <li key={f.name + f.size}>
                  {f.name} · {formatBytes(f.size)}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={createZip}
            disabled={!files.length || busy}
            className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5" />}
            Create ZIP
          </button>
          {result && (
            <a href={result} download="archive.zip" className="mt-3 inline-flex items-center gap-2 text-indigo-600 hover:underline">
              <Download className="w-4 h-4" /> Download archive.zip
            </a>
          )}
        </>
      ) : (
        <>
          <label className="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer bg-white">
            <Upload className="w-8 h-8 text-slate-400" />
            <p className="font-medium">{zipFile ? zipFile.name : 'Choose a .zip file'}</p>
            <input
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setZipFile(f)
                if (f) extractZip(f)
              }}
            />
          </label>
          {busy && <p className="mt-3 text-sm text-indigo-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Extracting…</p>}
          {entries.length > 0 && (
            <ul className="mt-4 space-y-2">
              {entries.map((e) => (
                <li key={e.name} className="flex items-center justify-between text-sm border rounded-xl px-3 py-2">
                  <span className="truncate mr-3">{e.name}</span>
                  <a
                    href={URL.createObjectURL(e.blob)}
                    download={e.name.split('/').pop()}
                    className="text-indigo-600 hover:underline shrink-0"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  )
}
