import { useMemo, useState } from 'react'
import { Download, Loader2, Plus, Trash2 } from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

type Line = { description: string; qty: number; rate: number }

export default function InvoicePdf() {
  const [business, setBusiness] = useState('Your Business')
  const [client, setClient] = useState('Client Name')
  const [invoiceNo, setInvoiceNo] = useState('INV-001')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [taxPct, setTaxPct] = useState(0)
  const [notes, setNotes] = useState('Thank you for your business.')
  const [lines, setLines] = useState<Line[]>([{ description: 'Service', qty: 1, rate: 100 }])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0),
    [lines]
  )
  const tax = subtotal * ((Number(taxPct) || 0) / 100)
  const total = subtotal + tax

  const updateLine = (i: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  const generate = async () => {
    setBusy(true)
    setResult(null)
    try {
      const pdf = await PDFDocument.create()
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
      const page = pdf.addPage([595, 842])
      const { height } = page.getSize()
      let y = height - 50

      const draw = (text: string, x: number, size = 11, f = font) => {
        page.drawText(text, { x, y, size, font: f, color: rgb(0.1, 0.1, 0.1) })
      }

      draw(business || 'Invoice', 50, 18, bold)
      y -= 28
      draw(`Invoice #: ${invoiceNo}`, 50, 11, bold)
      draw(`Date: ${date}`, 320, 11)
      y -= 22
      draw(`Bill to: ${client}`, 50, 11)
      y -= 30
      draw('Description', 50, 10, bold)
      draw('Qty', 320, 10, bold)
      draw('Rate', 380, 10, bold)
      draw('Amount', 460, 10, bold)
      y -= 14
      page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
      y -= 16

      for (const line of lines) {
        const amt = (Number(line.qty) || 0) * (Number(line.rate) || 0)
        const desc = (line.description || '').slice(0, 42)
        draw(desc, 50)
        draw(String(line.qty), 320)
        draw(amt.toFixed(2) === '0.00' && !line.rate ? '0.00' : Number(line.rate).toFixed(2), 380)
        draw(amt.toFixed(2), 460)
        y -= 18
        if (y < 120) break
      }

      y -= 10
      draw(`Subtotal: ${subtotal.toFixed(2)}`, 400, 11, bold)
      y -= 16
      draw(`Tax (${taxPct}%): ${tax.toFixed(2)}`, 400)
      y -= 16
      draw(`Total: ${total.toFixed(2)}`, 400, 13, bold)
      y -= 36
      if (notes) {
        draw('Notes', 50, 11, bold)
        y -= 16
        for (const part of notes.match(/.{1,80}/g) || []) {
          draw(part, 50, 10)
          y -= 14
        }
      }

      const bytes = await pdf.save()
      setResult(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Invoice / Estimate PDF</h1>
        <p className="text-slate-500">Build a simple invoice and download a PDF — entirely on your device.</p>
      </div>

      <div className="space-y-3 mb-4">
        <input className="w-full p-3 rounded-xl border dark:bg-slate-800" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name" />
        <input className="w-full p-3 rounded-xl border dark:bg-slate-800" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" />
        <div className="grid grid-cols-2 gap-3">
          <input className="w-full p-3 rounded-xl border dark:bg-slate-800" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Invoice #" />
          <input type="date" className="w-full p-3 rounded-xl border dark:bg-slate-800" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <input
          type="number"
          className="w-full p-3 rounded-xl border dark:bg-slate-800"
          value={taxPct}
          onChange={(e) => setTaxPct(Number(e.target.value))}
          placeholder="Tax %"
        />
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm font-medium">Line items</p>
        {lines.map((line, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input
              className="col-span-5 p-2 rounded-lg border dark:bg-slate-800 text-sm"
              value={line.description}
              onChange={(e) => updateLine(i, { description: e.target.value })}
              placeholder="Description"
            />
            <input
              type="number"
              className="col-span-2 p-2 rounded-lg border dark:bg-slate-800 text-sm"
              value={line.qty}
              onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
            />
            <input
              type="number"
              className="col-span-3 p-2 rounded-lg border dark:bg-slate-800 text-sm"
              value={line.rate}
              onChange={(e) => updateLine(i, { rate: Number(e.target.value) })}
            />
            <button type="button" className="col-span-2 text-red-500 flex justify-center" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((p) => [...p, { description: '', qty: 1, rate: 0 }])}
          className="inline-flex items-center gap-1 text-sm text-indigo-600"
        >
          <Plus className="w-4 h-4" /> Add line
        </button>
      </div>

      <textarea
        className="w-full p-3 rounded-xl border dark:bg-slate-800 mb-4 min-h-[80px]"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
      />

      <p className="text-sm text-slate-500 mb-3">
        Subtotal {subtotal.toFixed(2)} · Tax {tax.toFixed(2)} · <strong>Total {total.toFixed(2)}</strong>
      </p>

      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        Generate PDF
      </button>

      {result && (
        <a href={result} download={`${invoiceNo || 'invoice'}.pdf`} className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline">
          <Download className="w-4 h-4" /> Download invoice PDF
        </a>
      )}
    </div>
  )
}
