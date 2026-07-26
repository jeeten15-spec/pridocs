import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getConvertPage } from '../data/convertPages'
import ConvertPageContent from '../content/ConvertPageContent'
import ToolLayout from '../components/ToolLayout'
import HeicToJpg from '../tools/HeicToJpg'
import PdfToJpg from '../tools/PdfToJpg'
import PdfToPng from '../tools/PdfToPng'
import JpgToPng from '../tools/JpgToPng'
import PngToJpg from '../tools/PngToJpg'
import DocxToPdf from '../tools/DocxToPdf'
import PdfToDocx from '../tools/PdfToDocx'
import DocxToHtml from '../tools/DocxToHtml'
import DocxToTxt from '../tools/DocxToTxt'
import DocxToMarkdown from '../tools/DocxToMarkdown'
import HtmlToPdf from '../tools/HtmlToPdf'
import ImageToWebp from '../tools/ImageToWebp'
import VideoToMp3 from '../tools/VideoToMp3'
import AudioConverter from '../tools/AudioConverter'
import XlsxToCsv from '../tools/XlsxToCsv'
import CsvToXlsx from '../tools/CsvToXlsx'

// Maps a ConvertPage's `toolId` to the actual embeddable tool. Every entry
// hides its own H1 via the `embedded` prop (the landing page supplies its
// own, keyword-targeted H1 instead). Some pairs reuse a generic tool
// component with a narrower `accept` or pre-selected `defaultFormat`.
const toolRegistry: Record<string, () => React.ReactElement> = {
  'heic-to-jpg': () => <HeicToJpg embedded />,
  'pdf-to-jpg': () => <PdfToJpg embedded />,
  'pdf-to-png': () => <PdfToPng embedded />,
  'jpg-to-png': () => <JpgToPng embedded />,
  'png-to-jpg': () => <PngToJpg embedded />,
  'docx-to-pdf': () => <DocxToPdf embedded />,
  'pdf-to-word': () => <PdfToDocx embedded />,
  'word-to-html': () => <DocxToHtml embedded />,
  'word-to-txt': () => <DocxToTxt embedded />,
  'word-to-markdown': () => <DocxToMarkdown embedded />,
  'html-to-pdf': () => <HtmlToPdf embedded />,
  'jpg-to-webp': () => <ImageToWebp embedded accept="image/jpeg,.jpg,.jpeg" />,
  'png-to-webp': () => <ImageToWebp embedded accept="image/png,.png" />,
  'mp4-to-mp3': () => <VideoToMp3 embedded />,
  'mp3-to-wav': () => <AudioConverter embedded defaultFormat="wav" />,
  'wav-to-mp3': () => <AudioConverter embedded defaultFormat="mp3" />,
  'excel-to-csv': () => <XlsxToCsv embedded />,
  'csv-to-excel': () => <CsvToXlsx embedded />,
}

const SITE_URL = 'https://pridocs.org'
const DEFAULT_TITLE = 'Pridocs | Free, Secure & Ad-Free Document and Media Converter'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export default function ConvertLandingPage() {
  const { slug } = useParams()
  const page = getConvertPage(slug)

  useEffect(() => {
    if (!page) return
    const canonicalUrl = `${SITE_URL}/convert/${page.slug}`

    document.title = page.title
    setMeta('name', 'description', page.description)
    setMeta('property', 'og:title', page.title)
    setMeta('property', 'og:description', page.description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('name', 'twitter:title', page.title)
    setMeta('name', 'twitter:description', page.description)

    let canonicalTag = document.querySelector('link[rel="canonical"]')
    if (!canonicalTag) {
      canonicalTag = document.createElement('link')
      canonicalTag.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalTag)
    }
    canonicalTag.setAttribute('href', canonicalUrl)

    let schemaTag = document.getElementById('convert-page-schema') as HTMLScriptElement | null
    if (!schemaTag) {
      schemaTag = document.createElement('script')
      schemaTag.id = 'convert-page-schema'
      schemaTag.type = 'application/ld+json'
      document.head.appendChild(schemaTag)
    }
    schemaTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    })

    return () => {
      document.title = DEFAULT_TITLE
      schemaTag?.remove()
    }
  }, [page])

  if (!page) {
    return (
      <ToolLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Page not found</h1>
          <p className="text-slate-500 mb-6">This conversion page doesn't exist yet.</p>
          <Link to="/all-tools" className="text-indigo-600 hover:underline">Browse all tools</Link>
        </div>
      </ToolLayout>
    )
  }

  const renderTool = toolRegistry[page.toolId]

  return (
    <ToolLayout>
      <ConvertPageContent page={page}>
        {renderTool ? renderTool() : <p className="text-center text-slate-500">Converter coming soon.</p>}
      </ConvertPageContent>
    </ToolLayout>
  )
}
