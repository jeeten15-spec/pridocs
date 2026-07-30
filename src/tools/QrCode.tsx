import { useState } from 'react'
import { QrCode, Download, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'

export default function QrCodeTool() {
  const [text, setText] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!text) return
    setError('')
    try {
      const url = await QRCode.toDataURL(text, { width: 512, margin: 2 })
      setQrUrl(url)
    } catch (err: any) {
      setError(err?.message || 'Could not generate QR code')
    }
  }

  const download = () => {
    if (!qrUrl) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = 'qrcode.png'
    a.click()
  }

  const copyText = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">QR Code Generator</h1>
        <p className="text-slate-500">
          Free QR code generator for text, URLs, Wi‑Fi details and more — generated locally in your browser, nothing
          uploaded anywhere.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text or URL..."
          className="w-full h-24 p-4 rounded-xl border border-slate-200 text-sm resize-none"
        />

        <button
          onClick={generate}
          disabled={!text}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
        >
          <QrCode className="w-5 h-5" /> Generate QR Code
        </button>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        {qrUrl && (
          <div className="text-center space-y-4">
            <img src={qrUrl} alt="QR Code" className="mx-auto rounded-xl border border-slate-200" />
            <div className="flex gap-3 justify-center">
              <button onClick={download} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Open Your File
              </button>
              <button onClick={copyText} className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        Generated entirely on your device using the open-source <code>qrcode</code> library — your text is never sent
        to any server. Perfect for <strong>free QR codes</strong> for links, contact cards and offline posters.
      </div>
    </div>
  )
}
