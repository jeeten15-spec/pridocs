import { Link } from 'react-router-dom'

export default function HowItWorks() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6">How Pridocs Works</h1>
      
      <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
        <p>
          Pridocs is a <strong>free online converter</strong> and privacy-first productivity platform that runs 100% in your browser. 
          Convert PDF, Word, Excel, images, audio, and more without uploading files to any server.
        </p>
        
        <p>
          Looking for a <strong>fast PDF converter online</strong>, <strong>MP3 to video converter</strong>, 
          <strong>image to PDF converter</strong>, or <strong>free file converter no signup</strong>? 
          Pridocs uses powerful WebAssembly libraries (PDF.js, pdf-lib, FFmpeg.wasm, Tesseract.js) 
          to perform all conversions locally on your device.
        </p>
        
        <p>
          Popular tools like <strong>SmallPDF</strong>, <strong>CloudConvert</strong>, and <strong>FreeConvert</strong> 
          require uploads. Pridocs keeps everything private — your documents, images, and media 
          never leave your computer.
        </p>

        <h2 className="text-xl font-semibold text-slate-800 mt-8">File Size & Performance</h2>
        <p>
          Because everything runs in your browser, performance depends on your device’s RAM and CPU.
          We recommend keeping individual files under <strong>50–100 MB</strong> for the best experience.
          Very large PDFs, videos or image batches may run slowly or fail if the browser runs out of memory.
        </p>
        <p>
          Media tools that use FFmpeg.wasm support <strong>multi-threading</strong> automatically when your browser 
          allows SharedArrayBuffer (most modern Chrome / Edge builds). This significantly speeds up encoding.
        </p>
        
        <p>
          Whether you need a <strong>secure online PDF editor</strong>, <strong>QR code generator online</strong>, 
          <strong>JSON to CSV converter</strong>, or <strong>file hasher online</strong>, Pridocs offers 
          fast, private, browser-based solutions with no account required.
        </p>
        
        <p>
          For advanced needs (complex Office layouts, very large files, full RAR/7z support), we plan optional 
          private server processing in Phase 2 where files are deleted immediately after use.
        </p>
      </div>

      <div className="mt-8">
        <Link to="/" className="text-indigo-600 hover:underline">← Back to home</Link>
      </div>
    </div>
  )
}
