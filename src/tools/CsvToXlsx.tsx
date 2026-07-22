import { useState } from 'react'
import { Download, Upload, Loader2 } from 'lucide-react'
import { cn, formatBytes } from '../lib/utils'

function csvToExcelXml(csv: string): string {
  const rows = csv.trim().split(/\r?\n/).map(row => {
    // Very simple CSV parse (handles basic quoted fields)
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      const c = row[i]
      if (c === '"') {
        inQuotes = !inQuotes
      } else if (c === ',' && !inQuotes) {
        cells.push(current)
        current = ''
      } else {
        current += c
      }
    }
    cells.push(current)
    return cells
  })

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Sheet1">
  <Table>
`
  for (const row of rows) {
    xml += '   <Row>\n'
    for (const cell of row) {
      const escaped = cell.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      xml += `    <Cell><Data ss:Type="String">${escaped}</Data></Cell>\n`
    }
    xml += '   </Row>\n'
  }
  xml += `  </Table>
 </Worksheet>
</Workbook>`
  return xml
}

export default function CsvToXlsx() {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const convert = async (f: File) => {
    setBusy(true)
    try {
      const text = await f.text()
      const xml = csvToExcelXml(text)
      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
      setResult(URL.createObjectURL(blob))
    } catch {
      alert('Conversion failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">CSV to Excel</h1>
        <p className="text-slate-500">Convert CSV files into an Excel-compatible spreadsheet.</p>
      </div>

      <label
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) { setFile(f); convert(f) } }}
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer bg-white',
          drag ? 'border-indigo-400' : 'border-slate-200'
        )}
      >
        {busy ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-slate-400" />}
        <div className="text-center">
          <p className="font-medium">{file ? file.name : 'Drop a CSV file here'}</p>
          {file && <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>}
        </div>
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => {
          const f = e.target.files?.[0]
          if (f) { setFile(f); convert(f) }
        }} />
      </label>

      {result && (
        <div className="mt-8 text-center">
          <a href={result} download={(file?.name || 'data').replace(/\.csv$/i, '.xls')} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl">
            <Download className="w-5 h-5" /> Open Your Document
          </a>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">
        Generates an Excel 2003 XML spreadsheet that opens in Excel, Google Sheets and LibreOffice.
        Recommended max size: ~20–30 MB.
      </p>
    </div>
  )
}
