// Data-driven template for long-tail SEO landing pages at /convert/:slug.
//
// To add a new format pair, add one object here (and, if it needs a new
// converter that doesn't exist yet, build the tool component and register it
// in the `toolRegistry` map in src/pages/ConvertLandingPage.tsx). No routing
// or Cloudflare Function changes are needed per page — both are generic and
// read from this array by slug.
export interface ConvertPageFaq {
  q: string
  a: string
}

export interface ConvertPage {
  /** URL slug — page is served at /convert/<slug> */
  slug: string
  /** <title> tag content */
  title: string
  /** <meta name="description"> content */
  description: string
  /** H1 — should match the exact search phrase being targeted */
  h1: string
  /** 2-3 sentence intro paragraphs, rendered above the embedded tool */
  intro: string[]
  /** id of the tool component to embed, keyed in the toolRegistry map in ConvertLandingPage.tsx */
  toolId: string
  /** 3-4 FAQ entries, also used to generate FAQPage schema.org markup */
  faq: ConvertPageFaq[]
}

const PRIVACY_FAQ = (thing = 'file'): ConvertPageFaq => ({
  q: `Is my ${thing} uploaded to a server?`,
  a: `No. The conversion runs entirely inside your browser. Your ${thing} is never sent over the network — see our How It Works page for the technical details.`,
})

export const convertPages: ConvertPage[] = [
  {
    slug: 'heic-to-jpg',
    title: 'Convert HEIC to JPG Online — Free, No Upload | Pridocs',
    description:
      'Convert HEIC to JPG online for free, entirely in your browser. No upload, no signup, no ads — your iPhone photos never leave your device.',
    h1: 'Convert HEIC to JPG online — free, no upload',
    intro: [
      "iPhone photos are often saved in Apple's HEIC format, which many websites, Windows PCs, and older apps can't open directly. This tool converts HEIC to JPG instantly, right here in your browser.",
      'Because the conversion runs locally using WebAssembly, your photo is never uploaded to a server — it never leaves your device.',
    ],
    toolId: 'heic-to-jpg',
    faq: [
      {
        q: 'Is this HEIC to JPG converter really free?',
        a: 'Yes. There is no limit on how many photos you can convert, no account required, and no watermark added to your images.',
      },
      PRIVACY_FAQ('photo'),
      {
        q: 'Why do iPhone photos use the HEIC format?',
        a: "HEIC (High Efficiency Image Format) stores photos at a smaller file size than JPG while keeping similar visual quality, which is why Apple uses it by default on iPhone. Not every device or website supports opening HEIC directly, which is why converting to JPG is often necessary.",
      },
      {
        q: 'Will converting HEIC to JPG reduce photo quality?',
        a: 'There is a small, generally unnoticeable quality trade-off since JPG compresses differently than HEIC, but this tool converts at high quality (90%) by default to keep images looking sharp.',
      },
    ],
  },
  {
    slug: 'pdf-to-jpg',
    title: 'Convert PDF to JPG Online — Free, No Upload | Pridocs',
    description:
      'Convert PDF pages to JPG images online for free, entirely in your browser. No upload, no signup, no watermark.',
    h1: 'Convert PDF to JPG online — free, no upload',
    intro: [
      'Need PDF pages as images — for a presentation, a thumbnail, or to share on social media? This tool renders every page of your PDF as a high-quality JPG, right in your browser.',
      'Your PDF is parsed and drawn using PDF.js, the same open-source engine Firefox uses to display PDFs — nothing is uploaded anywhere.',
    ],
    toolId: 'pdf-to-jpg',
    faq: [
      { q: 'Can I convert a multi-page PDF?', a: 'Yes. Every page in the PDF is converted to its own JPG image, which you can download individually.' },
      PRIVACY_FAQ('PDF'),
      { q: 'Will scanned or password-protected PDFs work?', a: 'Scanned PDFs (that are just images) work fine. Password-protected PDFs are not currently supported — remove the password first using a PDF editor.' },
      { q: 'Is there a file size limit?', a: "There's no hard limit, but very large PDFs (100+ MB or hundreds of pages) may be slow since everything is processed by your device's own CPU." },
    ],
  },
  {
    slug: 'pdf-to-png',
    title: 'Convert PDF to PNG Online — Free, No Upload | Pridocs',
    description:
      'Convert PDF pages to high-quality PNG images online for free, entirely in your browser. No upload, no signup, no watermark.',
    h1: 'Convert PDF to PNG online — free, no upload',
    intro: [
      'PNG keeps sharper edges and supports transparency, which makes it a better choice than JPG for diagrams, screenshots, or documents with text. This tool renders each PDF page as a PNG locally in your browser.',
      'No file is uploaded — PDF.js parses and draws your document directly on your device.',
    ],
    toolId: 'pdf-to-png',
    faq: [
      { q: 'Why choose PNG instead of JPG for a PDF?', a: 'PNG uses lossless compression, so text and line art stay crisp with no compression artifacts — ideal for documents, screenshots, and diagrams.' },
      PRIVACY_FAQ('PDF'),
      { q: 'Can I convert just one page instead of the whole PDF?', a: 'Currently all pages are converted at once; you can simply download only the page images you need from the results.' },
      { q: 'Does this work on mobile?', a: 'Yes, it works in any modern mobile browser, though very large PDFs may be slower on phones with limited memory.' },
    ],
  },
  {
    slug: 'jpg-to-png',
    title: 'Convert JPG to PNG Online — Free, No Upload | Pridocs',
    description:
      'Convert JPG to PNG online for free, entirely in your browser using the HTML5 Canvas API. No upload, no signup, no ads.',
    h1: 'Convert JPG to PNG online — free, no upload',
    intro: [
      "Need a JPG in PNG format for a design tool, a logo, or to add transparency later? This converts your JPG to PNG instantly using your browser's built-in Canvas API.",
      'Everything happens locally on your device — your image is never uploaded.',
    ],
    toolId: 'jpg-to-png',
    faq: [
      { q: 'Will this add transparency to my JPG?', a: "No — JPG files don't store transparency data, so the PNG output will still have a solid background. To add transparency you'd need a background-removal tool." },
      PRIVACY_FAQ('image'),
      { q: 'Does converting to PNG reduce quality?', a: 'No — PNG is lossless, so no additional compression artifacts are introduced during this conversion.' },
      { q: 'Will the PNG file be larger than the original JPG?', a: 'Usually yes. PNG is lossless and typically produces larger files than JPG for photographic images.' },
    ],
  },
  {
    slug: 'png-to-jpg',
    title: 'Convert PNG to JPG Online — Free, No Upload | Pridocs',
    description:
      'Convert PNG to JPG online for free, entirely in your browser. Adjustable quality, no upload, no signup, no ads.',
    h1: 'Convert PNG to JPG online — free, no upload',
    intro: [
      'PNG files are often much larger than they need to be for photos or web use. This tool converts PNG to JPG locally in your browser, with an adjustable quality slider to control file size.',
      'Nothing is uploaded — the conversion runs using your browser\'s Canvas API.',
    ],
    toolId: 'png-to-jpg',
    faq: [
      { q: 'What happens to transparent areas in my PNG?', a: "JPG doesn't support transparency, so any transparent areas in your PNG are filled with a white background." },
      PRIVACY_FAQ('image'),
      { q: 'Can I control the output quality?', a: 'Yes — use the quality slider before converting to balance file size against visual quality.' },
      { q: 'Why convert PNG to JPG at all?', a: 'JPG files are usually much smaller than PNG for photos, which makes them faster to upload, email, or use on a website.' },
    ],
  },
  {
    slug: 'word-to-pdf',
    title: 'Convert Word to PDF Online — Free, No Upload | Pridocs',
    description:
      'Convert DOCX Word documents to PDF online for free, entirely in your browser. No upload, no signup, no ads.',
    h1: 'Convert Word to PDF online — free, no upload',
    intro: [
      'Turn a .docx Word document into a PDF for sharing or printing, without installing anything or uploading your document anywhere.',
      'This tool reads your document\'s text using Mammoth.js and lays it out into a PDF using pdf-lib, both running locally in your browser.',
    ],
    toolId: 'docx-to-pdf',
    faq: [
      { q: 'Will my formatting be preserved exactly?', a: "This conversion focuses on text content and basic paragraph structure. Complex layouts, embedded images, and advanced formatting (multi-column layouts, custom fonts) are not fully reproduced." },
      PRIVACY_FAQ('document'),
      { q: 'What file types are supported?', a: 'Only Microsoft Word .docx files are supported (the modern Word format, not the older .doc format).' },
      { q: 'Is there a way to get pixel-perfect Word-to-PDF conversion?', a: "Not currently — that would require a full document rendering engine. We're considering an optional paid, server-assisted tier in the future for cases like this; see our How It Works page." },
    ],
  },
  {
    slug: 'pdf-to-word',
    title: 'Convert PDF to Word Online — Free, No Upload | Pridocs',
    description:
      'Convert PDF to an editable Word (.docx) document online for free, entirely in your browser. No upload, no signup, no ads.',
    h1: 'Convert PDF to Word online — free, no upload',
    intro: [
      'Extract the text from a PDF into an editable Word document, without uploading your file anywhere.',
      'This works best for text-heavy PDFs — it reads the text with PDF.js and builds a real, valid .docx file locally in your browser.',
    ],
    toolId: 'pdf-to-word',
    faq: [
      { q: 'Will tables, images and layout be preserved?', a: 'No — this extracts plain text content into a clean, editable document. Original fonts, images, tables and multi-column layouts are not reconstructed.' },
      PRIVACY_FAQ('PDF'),
      { q: 'Will scanned PDFs (images of text) work?', a: "Not with this tool — it reads text that's already embedded in the PDF. For scanned documents, use our PDF OCR tool first to extract the text." },
      { q: 'What Word format is the output?', a: 'A standard .docx file that opens in Microsoft Word, Google Docs, and LibreOffice.' },
    ],
  },
  {
    slug: 'word-to-html',
    title: 'Convert Word to HTML Online — Free, No Upload | Pridocs',
    description:
      'Convert DOCX Word documents to clean, semantic HTML online for free, entirely in your browser. No upload, no signup, no ads.',
    h1: 'Convert Word to HTML online — free, no upload',
    intro: [
      'Turn a Word document into clean HTML you can paste into a website, CMS, or email — headings, lists, links, and tables are preserved.',
      'Powered by Mammoth.js, running entirely in your browser — your document is never uploaded.',
    ],
    toolId: 'word-to-html',
    faq: [
      { q: 'Is the HTML output clean, or full of Word clutter?', a: 'Mammoth.js is specifically designed to strip out the messy inline styles Word normally generates, producing clean, semantic HTML.' },
      PRIVACY_FAQ('document'),
      { q: 'Are images in my document included?', a: 'Basic embedded images are converted where possible, but very complex layouts may not translate perfectly to HTML.' },
      { q: 'Can I edit the HTML before downloading?', a: 'The tool shows a live preview and lets you download the raw HTML file, which you can then edit in any code editor.' },
    ],
  },
  {
    slug: 'word-to-txt',
    title: 'Convert Word to TXT Online — Free, No Upload | Pridocs',
    description:
      'Extract plain text from a DOCX Word document online for free, entirely in your browser. No upload, no signup, no ads.',
    h1: 'Convert Word to plain text (TXT) online — free, no upload',
    intro: [
      'Sometimes you just need the raw text from a Word document — no formatting, no styles. This extracts it instantly, right in your browser.',
      'Your document is processed locally using Mammoth.js and never uploaded.',
    ],
    toolId: 'word-to-txt',
    faq: [
      { q: 'Will paragraph breaks be preserved?', a: 'Yes, the tool intelligently handles paragraph and heading structure so the extracted text remains readable.' },
      PRIVACY_FAQ('document'),
      { q: 'Does this work with .doc (older Word format) files?', a: 'No, only the modern .docx format is supported.' },
      { q: 'Can I copy the text without downloading a file?', a: 'Yes — the extracted text is shown directly on the page, so you can select and copy it, or download it as a .txt file.' },
    ],
  },
  {
    slug: 'word-to-markdown',
    title: 'Convert Word to Markdown Online — Free, No Upload | Pridocs',
    description:
      'Convert DOCX Word documents to Markdown online for free, entirely in your browser. No upload, no signup, no ads.',
    h1: 'Convert Word to Markdown online — free, no upload',
    intro: [
      'Writers and developers often need Word content as Markdown for blogs, documentation, or static site generators. This converts your .docx file to clean Markdown locally in your browser.',
      'Headings, lists, links, and basic formatting are converted automatically — nothing is uploaded.',
    ],
    toolId: 'word-to-markdown',
    faq: [
      { q: 'Are tables converted to Markdown tables?', a: 'Basic tables are converted where possible, though very complex table layouts may need manual cleanup.' },
      PRIVACY_FAQ('document'),
      { q: 'What Markdown flavor is used?', a: 'Standard/CommonMark-style Markdown, compatible with most blogs, static site generators, and documentation tools.' },
      { q: 'Can I preview the Markdown before downloading?', a: 'Yes, the converted Markdown is shown on the page before you download it as a .md file.' },
    ],
  },
  {
    slug: 'html-to-pdf',
    title: 'Convert HTML to PDF Online — Free, No Upload | Pridocs',
    description:
      'Convert HTML content to PDF online for free, entirely in your browser. No upload, no signup, no ads.',
    h1: 'Convert HTML to PDF online — free, no upload',
    intro: [
      'Paste in HTML content and get back a clean, text-based PDF — useful for quick notes, snippets, or simple documents.',
      'This is a text-focused converter: it strips tags and lays out the text using pdf-lib, running entirely in your browser.',
    ],
    toolId: 'html-to-pdf',
    faq: [
      { q: 'Will CSS styling and images be rendered?', a: "No — this is a text-focused converter. Complex CSS layouts, custom fonts, and images are not rendered; only the text content is extracted and laid out in the PDF." },
      { q: 'Is my HTML content uploaded anywhere?', a: 'No. The conversion happens entirely inside your browser using pdf-lib. Nothing you paste in is sent over the network.' },
      { q: 'What if I need pixel-perfect HTML-to-PDF conversion?', a: "For full CSS/layout fidelity you'd need a headless browser rendering engine, which isn't feasible purely client-side today. We're considering this as part of a possible future optional paid tier — see our How It Works page." },
      { q: 'Is there a length limit for the HTML I paste in?', a: 'No hard limit, but very long content will produce a multi-page PDF, which may take a moment longer to generate.' },
    ],
  },
  {
    slug: 'jpg-to-webp',
    title: 'Convert JPG to WebP Online — Free, No Upload | Pridocs',
    description:
      'Convert JPG to the modern WebP format online for free, entirely in your browser. Smaller files for faster websites.',
    h1: 'Convert JPG to WebP online — free, no upload',
    intro: [
      'WebP images are typically 25–35% smaller than JPG at similar visual quality, which makes pages load faster. This converts your JPG to WebP locally in your browser.',
      'Nothing is uploaded — the conversion uses your browser\'s built-in Canvas API.',
    ],
    toolId: 'jpg-to-webp',
    faq: [
      { q: 'Do all browsers support WebP?', a: 'Yes — WebP is supported by all modern browsers (Chrome, Firefox, Safari, Edge).' },
      PRIVACY_FAQ('image'),
      { q: 'Can I control the compression quality?', a: 'Yes, use the quality slider to balance file size against image quality before converting.' },
      { q: 'Why would I convert JPG to WebP?', a: "WebP generally produces smaller files than JPG at the same visual quality, which helps your website load faster and use less bandwidth." },
    ],
  },
  {
    slug: 'png-to-webp',
    title: 'Convert PNG to WebP Online — Free, No Upload | Pridocs',
    description:
      'Convert PNG to the modern WebP format online for free, entirely in your browser. Smaller files, transparency supported.',
    h1: 'Convert PNG to WebP online — free, no upload',
    intro: [
      'WebP supports transparency just like PNG, but usually produces significantly smaller files — great for icons, logos, and graphics on the web.',
      'The conversion runs entirely in your browser using the Canvas API; your image is never uploaded.',
    ],
    toolId: 'png-to-webp',
    faq: [
      { q: 'Does WebP keep my PNG transparency?', a: 'Yes — WebP supports an alpha (transparency) channel, so transparent areas in your PNG are preserved.' },
      PRIVACY_FAQ('image'),
      { q: 'How much smaller will the file be?', a: 'It varies by image, but WebP often produces noticeably smaller files than PNG, especially for photos or complex graphics.' },
      { q: 'Is WebP a lossy or lossless format?', a: 'WebP supports both. This tool uses adjustable lossy compression by default, controlled by the quality slider.' },
    ],
  },
  {
    slug: 'excel-to-csv',
    title: 'Convert Excel to CSV Online — Free, No Upload | Pridocs',
    description:
      'Convert Excel (.xlsx/.xls) spreadsheets to CSV online for free, entirely in your browser using SheetJS. No upload, no signup, no ads.',
    h1: 'Convert Excel to CSV online — free, no upload',
    intro: [
      'Turn a real .xlsx or .xls spreadsheet into a plain CSV file for import into another system, a script, or a database — without uploading it anywhere.',
      'Parsing runs entirely in your browser using SheetJS, a widely-used open-source spreadsheet library.',
    ],
    toolId: 'excel-to-csv',
    faq: [
      { q: 'Does this handle multi-sheet workbooks?', a: 'Yes — if your workbook has more than one sheet, you can preview and download the CSV for each sheet individually.' },
      PRIVACY_FAQ('spreadsheet'),
      { q: 'Will formulas be converted too?', a: 'Formulas are converted to their last calculated values, since CSV is a plain-text format with no support for formulas.' },
      { q: 'Does this work with the older .xls format too?', a: 'Yes — both the modern .xlsx format and the legacy .xls format are supported.' },
    ],
  },
  {
    slug: 'csv-to-excel',
    title: 'Convert CSV to Excel Online — Free, No Upload | Pridocs',
    description:
      'Convert CSV to a real, native Excel (.xlsx) spreadsheet online for free, entirely in your browser using SheetJS. No upload, no signup.',
    h1: 'Convert CSV to Excel online — free, no upload',
    intro: [
      'Turn a plain CSV file into a real, native .xlsx workbook that opens cleanly in Excel, Google Sheets, or LibreOffice.',
      'The conversion runs entirely in your browser using SheetJS — your data is never uploaded.',
    ],
    toolId: 'csv-to-excel',
    faq: [
      { q: 'Is the output a real .xlsx file, or a workaround format?', a: 'A real, native .xlsx workbook is generated using SheetJS — not a legacy XML trick — so it opens cleanly in modern Excel, Google Sheets, and LibreOffice.' },
      PRIVACY_FAQ('CSV file'),
      { q: 'Does this handle commas inside quoted fields correctly?', a: 'Yes — CSV parsing uses SheetJS\'s parser, which correctly handles quoted fields containing commas, line breaks, and escaped quotes.' },
      { q: 'Can I convert very large CSV files?', a: 'Yes, though very large files (tens of thousands of rows) will take longer since everything is processed by your own device.' },
    ],
  },
  {
    slug: 'mp4-to-mp3',
    title: 'Convert MP4 to MP3 Online — Free, No Upload | Pridocs',
    description:
      'Extract audio from an MP4 video as MP3 online for free, entirely in your browser using FFmpeg.wasm. No upload, no signup.',
    h1: 'Convert MP4 to MP3 online — free, no upload',
    intro: [
      "Need just the audio from a video — a podcast, a lecture, a song? This extracts the audio track as an MP3, entirely on your device.",
      'It uses FFmpeg.wasm, a real build of the FFmpeg encoder compiled to WebAssembly. The engine itself is downloaded once (a few MB); your video file is never uploaded.',
    ],
    toolId: 'mp4-to-mp3',
    faq: [
      { q: 'Does this work with video formats other than MP4?', a: 'Yes, most common video formats are accepted — the tool detects the input format automatically.' },
      PRIVACY_FAQ('video'),
      { q: 'Is there a video size limit?', a: 'We recommend keeping videos under roughly 100–200 MB depending on your device\'s RAM, since everything is processed by your own browser.' },
      { q: 'Why does the first conversion take longer?', a: 'The first time you use this tool, your browser downloads the FFmpeg engine (about 25 MB). It\'s cached after that, so later conversions start faster.' },
    ],
  },
  {
    slug: 'mp3-to-wav',
    title: 'Convert MP3 to WAV Online — Free, No Upload | Pridocs',
    description:
      'Convert MP3 to uncompressed WAV audio online for free, entirely in your browser using FFmpeg.wasm. No upload, no signup.',
    h1: 'Convert MP3 to WAV online — free, no upload',
    intro: [
      "Need an uncompressed WAV file for audio editing software, or a format required by specific hardware or software? This converts MP3 to WAV locally in your browser.",
      'Powered by FFmpeg.wasm — a real audio engine compiled to WebAssembly. Your audio file is never uploaded.',
    ],
    toolId: 'mp3-to-wav',
    faq: [
      { q: 'Will the WAV file be much larger than the MP3?', a: 'Yes — WAV is uncompressed, so it will typically be 5-10x larger than the original MP3.' },
      PRIVACY_FAQ('audio file'),
      { q: 'Will converting MP3 to WAV improve the audio quality?', a: "No — MP3 is already a lossy format, so converting to WAV preserves the current quality but can't add back detail that was lost during the original MP3 compression." },
      { q: 'Can I convert to other formats too?', a: 'Yes, the embedded converter also supports AAC, OGG, and FLAC output — just choose a different format from the dropdown.' },
    ],
  },
  {
    slug: 'wav-to-mp3',
    title: 'Convert WAV to MP3 Online — Free, No Upload | Pridocs',
    description:
      'Convert WAV audio to compressed MP3 online for free, entirely in your browser using FFmpeg.wasm. No upload, no signup.',
    h1: 'Convert WAV to MP3 online — free, no upload',
    intro: [
      'WAV files are uncompressed and often huge. This converts WAV to MP3 locally in your browser, shrinking the file size dramatically for sharing or storage.',
      'Powered by FFmpeg.wasm — a real audio engine compiled to WebAssembly. Your audio file is never uploaded.',
    ],
    toolId: 'wav-to-mp3',
    faq: [
      { q: 'How much smaller will the MP3 be than the WAV?', a: 'Typically 5-10x smaller, depending on the MP3 bitrate — this tool encodes at 192kbps by default.' },
      PRIVACY_FAQ('audio file'),
      { q: 'Is MP3 lossy or lossless?', a: 'MP3 is a lossy format, meaning some audio detail is discarded to reduce file size. At 192kbps the difference is generally hard to notice for most listening.' },
      { q: 'Can I choose a different output format instead of MP3?', a: 'Yes — the embedded converter also supports WAV, AAC, OGG, and FLAC; just pick a different format from the dropdown.' },
    ],
  },
]

export function getConvertPage(slug: string | undefined): ConvertPage | undefined {
  return slug ? convertPages.find((p) => p.slug === slug) : undefined
}
