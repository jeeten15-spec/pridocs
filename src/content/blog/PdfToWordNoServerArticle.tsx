import { Link } from 'react-router-dom'

export default function PdfToWordNoServerArticle() {
  return (
    <div className="space-y-5 text-slate-700 leading-relaxed">
      <p>
        Converting a PDF to Word should not require surrendering the document to a stranger&apos;s OCR farm. If you need{' '}
        <strong>PDF to Word without uploading</strong>, Pridocs extracts text locally and builds a DOCX you can edit —
        a quieter <strong>Adobe Acrobat online</strong> alternative for everyday text PDFs.
      </p>
      <p>
        Start here:{' '}
        <Link to="/tools/pdf-to-docx" className="text-indigo-600 hover:underline font-medium">
          PDF to DOCX / Word
        </Link>
        . Going the other direction?{' '}
        <Link to="/tools/docx-to-pdf" className="text-indigo-600 hover:underline font-medium">
          Word to PDF / DOCX to PDF with no upload
        </Link>{' '}
        is equally browser-bound.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">What local PDF → Word does well</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Text-heavy PDFs and reports you need to tweak.</li>
        <li>Privacy-sensitive drafts (HR, legal, finance) that should not hit a conversion API.</li>
        <li>Quick edits without installing desktop Acrobat.</li>
      </ul>
      <p>
        Scanned image-only PDFs may need{' '}
        <Link to="/tools/pdf-ocr" className="text-indigo-600 hover:underline">
          PDF OCR
        </Link>{' '}
        or{' '}
        <Link to="/tools/image-to-text" className="text-indigo-600 hover:underline">
          Image to Text
        </Link>{' '}
        first — still on-device, still no upload.
      </p>

      <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Honest limits</h2>
      <p>
        Complex layouts (magazines, multi-column design PDFs) will not emerge as perfect InDesign clones. Cloud Acrobat
        still wins some fidelity battles. Pridocs wins the &quot;do not upload this&quot; battle every time.
      </p>

      <p className="font-medium text-slate-900 mt-8">
        <Link to="/tools/pdf-to-docx" className="text-indigo-600 hover:underline">
          Convert PDF to Word without a server
        </Link>
        .
      </p>
    </div>
  )
}
