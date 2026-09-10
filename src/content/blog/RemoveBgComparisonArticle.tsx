import { Link } from 'react-router-dom'

export default function RemoveBgComparisonArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Searching <strong>remove background from image</strong> usually dumps you into a buffet of credits, watermarks,
        and &quot;free trials&quot; that expire mid-cutout. PhotoRoom, Canva, and remove.bg are polished — and they bid
        hard on ads — but they are not the only path to a clean <strong>transparent background PNG</strong>.
      </p>
      <p>
        Pridocs is a{' '}
        <Link to="/tools/background-remover" className="text-indigo-600 hover:underline font-medium">
          background remover with no signup
        </Link>
        : an on-device AI cut-out where{' '}
        <strong>remove background online files stay on device</strong>. Think of it as a calm{' '}
        <strong>remove.bg alternative</strong> / <strong>PhotoRoom alternative</strong> when you refuse to upload
        product shots or family portraits.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">What you get (and what you skip)</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>No watermark</strong> — your PNG leaves as clean as your conscience.
        </li>
        <li>
          <strong>No signup</strong> — open the page, drop an image, export.
        </li>
        <li>
          <strong>Local AI</strong> — the model runs in the browser; photos are not farmed to a mystery GPU farm.
        </li>
      </ul>
      <p>
        Is it identical to every Canva brush stroke? No — and we will not pretend otherwise. For marketplace listings,
        thumbnails, and quick cut-outs, it is fast, free, and private. That is the point.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">How to remove a background privately</h2>
      <ol className="list-decimal pl-6 space-y-2">
        <li>
          Visit the{' '}
          <Link to="/tools/background-remover" className="text-indigo-600 hover:underline font-medium">
            AI Background Remover
          </Link>
          .
        </li>
        <li>Drop a JPG or PNG. Wait for the on-device model (first run may download weights).</li>
        <li>Export a transparent PNG. Optional: tidy size with{' '}
          <Link to="/tools/image-resize" className="text-indigo-600 hover:underline">
            Image Compress
          </Link>
          .
        </li>
      </ol>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Canva background remover vs Pridocs</h2>
      <p>
        Canva wins on design suites and templates. Pridocs wins when the brief is shorter: <em>cut the background, keep
        the file private, do not make me create an account</em>. Same story versus remove.bg credits. Use the big brands
        when you need their ecosystem; use Pridocs when the file should never leave the laptop.
      </p>

      <p className="font-medium text-slate-900 mt-8">
        Try it:{' '}
        <Link to="/tools/background-remover" className="text-indigo-600 hover:underline">
          Remove background — no signup, files stay on device
        </Link>
        .
      </p>
    </div>
  )
}
