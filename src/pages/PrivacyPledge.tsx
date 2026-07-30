import { Link } from 'react-router-dom'
import PaymentButton from '../components/PaymentButton'

export default function PrivacyPledge() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6">Privacy Pledge</h1>
      
      <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
        <p>
          At Pridocs we make a simple promise: <strong>Your files never leave your device.</strong>
        </p>
        
        <p>
          All processing happens locally in your browser using WebAssembly and pure JavaScript libraries.
          We do not operate conversion servers for Phase 1 tools, we do not store your files, and we do not
          track the content of what you convert.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 pt-4">What this means in practice</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>No uploads</strong> — files stay on your device.</li>
          <li><strong>No accounts required</strong> — use every tool anonymously.</li>
          <li><strong>No tracking of file contents</strong> — we cannot see what you convert.</li>
          <li><strong>No retention</strong> — when you close the tab, the data is gone from memory.</li>
          <li><strong>Open about limitations</strong> — if a conversion needs a private server in the future (Phase 2), we will clearly label it and delete files immediately after processing.</li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 pt-4">How we achieve this</h2>
        <p>
          We use mature open-source WebAssembly and JavaScript libraries such as PDF.js, pdf-lib,
          mammoth.js, Tesseract.js and FFmpeg.wasm. These libraries run locally on your device.
        </p>
        <p>
          Pridocs itself is open source — you can inspect the code or contribute on{' '}
          <a
            href="https://github.com/jeeten15-spec/pridocs"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:underline"
          >
            GitHub
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold text-slate-900 pt-4">Browser extension</h2>
        <p>
          The Pridocs browser extension is a shortcut to Pridocs tools. It does not transmit,
          retain or analyse selected page content, browsing history, downloads or clipboard data,
          and it does not upload files or use analytics. If you open tools from its popup, it
          remembers up to four recent tool choices only in your browser&apos;s extension storage. You
          can remove that data by clearing the extension&apos;s storage or uninstalling the extension.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 pt-4">Contact</h2>
        <p>
          If you ever have questions about our privacy practices, please{' '}
          <Link to="/contact" className="text-indigo-600 hover:underline">reach out</Link>.
          We take this pledge seriously.
        </p>
      </div>

      <div className="mt-10 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
        <p className="text-sm font-medium text-slate-700 mb-3">Support Pridocs / Buy Me a Coffee</p>
        <PaymentButton />
      </div>

      <div className="mt-8 flex flex-wrap gap-6 text-sm">
        <Link to="/" className="text-indigo-600 hover:underline">← Home</Link>
        <Link to="/about" className="text-indigo-600 hover:underline">About</Link>
        <Link to="/contact" className="text-indigo-600 hover:underline">Contact Us</Link>
      </div>
    </div>
  )
}
