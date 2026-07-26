// Shared, framework-agnostic content for the /how-it-works trust page.
//
// This file is imported from two places:
//  1. src/pages/HowItWorks.tsx — normal client-side React rendering.
//  2. functions/how-it-works.js — rendered to a static HTML string at request
//     time with react-dom/server, so the real content is present in the
//     initial server response (not just injected after JS loads).
//
// Keep this component free of hooks/browser-only APIs so it renders
// identically in both places.
import React from 'react'

const REPO_URL = 'https://github.com/jeeten15-spec/pridocs'

export default function HowItWorksContent() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900 mb-3">How Pridocs Converts Files Without Uploading Them</h1>
      <p className="text-slate-500 mb-10">
        This page explains, in plain language, exactly what happens on your device when you use a Pridocs tool — no marketing claims, just what the code actually does.
      </p>

      <div className="prose prose-slate max-w-none text-slate-700 space-y-5">
        <h2 className="text-xl font-semibold text-slate-900 mt-2">What happens when you drop a file</h2>
        <p>
          When you drag a file onto a Pridocs tool (or click to choose one), your browser hands the page a <strong>File object</strong> using the standard, built-in <strong>File API</strong> — the same browser feature every website uses to let you attach a file to a form. At this point the file exists only as data in your browser tab's memory. Pridocs' code never calls a network function like <code>fetch</code> or <code>XMLHttpRequest</code> to send that file anywhere; there is simply no upload step in the code path.
        </p>
        <p>
          What happens next depends on the tool, because different file types need different processing engines — all of which run inside your browser tab:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Viewing or rasterizing a PDF</strong> (PDF to JPG/PNG, and reading pages for OCR) uses <strong>PDF.js</strong>, the open-source PDF renderer built by Mozilla for Firefox. It parses the PDF and draws each page onto an HTML <strong>&lt;canvas&gt;</strong> element, from which the image is exported.
          </li>
          <li>
            <strong>Editing a PDF's structure</strong> (merge, split, rotate, crop, watermark, page numbers, redact, sign) uses <strong>pdf-lib</strong>, a JavaScript library that reads and rewrites the PDF file format directly, byte by byte, without ever rasterizing it.
          </li>
          <li>
            <strong>Word document conversion</strong> (DOCX to HTML, Markdown, TXT, or PDF) uses <strong>Mammoth.js</strong> to parse the DOCX file's internal XML and turn it into clean HTML, which is then reformatted as needed.
          </li>
          <li>
            <strong>OCR</strong> (making a scanned PDF searchable) uses <strong>Tesseract.js</strong>, a JavaScript port of the Tesseract OCR engine compiled to <strong>WebAssembly (WASM)</strong> — real, compiled C++ image-recognition code running at near-native speed in your browser — inside a background <strong>Web Worker</strong> so the page doesn't freeze while it reads text off the page image.
          </li>
          <li>
            <strong>Audio and video tools</strong> (audio conversion, video to MP3/GIF, Song2Vid) use <strong>FFmpeg.wasm</strong>, which compiles the real FFmpeg encoder/decoder to WebAssembly. The first time you use one of these tools, your browser downloads the FFmpeg engine itself (a few megabytes of code, currently served from the public unpkg.com CDN) — this is the <em>software</em>, not your file. Once it's loaded, your actual audio/video data is processed by that engine locally and is never sent anywhere.
          </li>
          <li>
            <strong>Simple image tools</strong> (resize, format conversion, filters) use the browser's built-in <strong>Canvas 2D API</strong> directly — no external library is even needed to read pixels, resize, or re-encode an image.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Why your file never reaches a server</h2>
        <p>
          All of the processing described above — PDF.js, pdf-lib, Mammoth.js, Tesseract.js, FFmpeg.wasm, and the Canvas API — runs using APIs your browser already provides locally. None of it requires sending your file's bytes to a remote server, so Pridocs' code simply never does. The only network requests a Pridocs tool can make are: loading the page itself, and, for the two exceptions noted above (FFmpeg's engine binary and Tesseract's language-data file), a one-time download of that <em>processing software</em> — never your file.
        </p>
        <p>
          You don't have to take our word for it. Open your browser's Developer Tools (<strong>F12</strong>), go to the <strong>Network</strong> tab, and convert a file. You will not see any outgoing request containing your file's data.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">Source code</h2>
        <p>
          Pridocs' source code is public on GitHub, so you can verify everything on this page yourself instead of trusting a description of it: <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{REPO_URL}</a>
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">File size &amp; performance</h2>
        <p>
          Because everything runs on your device rather than a server, performance depends on your device's own RAM and CPU rather than ours. We recommend keeping individual files under roughly <strong>50–100 MB</strong> for a smooth experience — very large PDFs, videos, or image batches can run slowly or fail if your browser tab runs out of memory.
        </p>

        <h2 className="text-xl font-semibold text-slate-900 mt-8">What about very large files or higher quality than a browser can deliver?</h2>
        <p>
          This does not exist today — every tool on Pridocs right now runs exactly as described above, entirely in your browser. We are considering an optional, clearly-labeled <strong>paid subscription tier in the future</strong> for cases the free browser-only tools genuinely cannot handle well, such as very large media files or conversions where in-browser processing can't match server-grade quality. If it ships, it will be an explicit, separate, opt-in choice — clearly marked wherever it's offered — and files sent to it would be deleted immediately after processing. It would never be silently mixed into the free tools described on this page.
        </p>
      </div>

      <div className="mt-10 text-sm">
        <a href="/" className="text-indigo-600 hover:underline">← Back to home</a>
      </div>
    </div>
  )
}

// Referenced so bundlers using the classic JSX transform (which requires
// `React` in scope) work the same as the automatic runtime.
void React
