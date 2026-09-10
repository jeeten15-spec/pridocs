import { Link } from 'react-router-dom'

export default function SaferInBrowserConvertersArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        ID scans, contracts, medical letters, salary slips — the files you convert when you are already slightly stressed
        — are exactly the files that should never hitch a ride to a random conversion server. Yet the first Google result
        for many chores still says: upload here.
      </p>
      <p>
        In-browser converters flip the model. The engine comes to you (WebAssembly, Canvas, pdf.js, on-device AI). Your
        document stays put. That is why phrases like <strong>private file converter</strong> and{' '}
        <strong>files never uploaded</strong> belong on every serious privacy page — including ours.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">What &quot;safer&quot; actually means</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>No transit of file bytes to a vendor you cannot audit in thirty seconds.</li>
        <li>No retention policy written in legalese for a free tool you used once.</li>
        <li>Verifiable in DevTools: watch the Network tab while you convert.</li>
      </ul>
      <p>
        It does not mean &quot;immune to every threat on Earth.&quot; A compromised laptop is still a compromised laptop.
        It does mean you removed an unnecessary third party from the path of your passport scan.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Pridocs tools built for sensitive chores</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <Link to="/tools/compress-pdf" className="text-indigo-600 hover:underline">
            Compress PDF
          </Link>{' '}
          for portal size caps
        </li>
        <li>
          <Link to="/tools/merge-pdf" className="text-indigo-600 hover:underline">
            Merge PDF
          </Link>{' '}
          for application packets
        </li>
        <li>
          <Link to="/tools/heic-to-jpg" className="text-indigo-600 hover:underline">
            HEIC to JPG
          </Link>{' '}
          for iPhone photos of documents
        </li>
        <li>
          <Link to="/tools/exif-remover" className="text-indigo-600 hover:underline">
            EXIF remover
          </Link>{' '}
          before you email a selfie-with-ID
        </li>
        <li>
          <Link to="/tools/redact-pdf" className="text-indigo-600 hover:underline">
            Redact PDF
          </Link>{' '}
          when black bars must be permanent
        </li>
      </ul>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Public Wi‑Fi note</h2>
      <p>
        People also search <strong>best VPN for public wifi</strong> — smart habit. Pair a VPN with a no-upload converter
        and you have removed two common leak paths: the café network sniffing uploads, and the converter vendor storing
        them. Pridocs handles the second half.
      </p>

      <p className="font-medium text-slate-900 mt-8">
        Start with the{' '}
        <Link to="/privacy-pledge" className="text-indigo-600 hover:underline">
          Privacy Pledge
        </Link>{' '}
        or jump straight to{' '}
        <Link to="/all-tools" className="text-indigo-600 hover:underline">
          All Tools
        </Link>
        .
      </p>
    </div>
  )
}
