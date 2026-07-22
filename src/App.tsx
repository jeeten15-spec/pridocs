import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ToolLayout from './components/ToolLayout'
import PrivacyPledge from './pages/PrivacyPledge'
import HowItWorks from './pages/HowItWorks'
import AllTools from './pages/AllTools'
import About from './pages/About'
import Blog from './pages/Blog'
import Contact from './pages/Contact'
import PdfToJpg from './tools/PdfToJpg'
import PdfToPng from './tools/PdfToPng'
import MergePdf from './tools/MergePdf'
import SplitPdf from './tools/SplitPdf'
import RotatePdf from './tools/RotatePdf'
import CompressPdf from './tools/CompressPdf'
import PdfOcr from './tools/PdfOcr'
import DocxToMarkdown from './tools/DocxToMarkdown'
import DocxToHtml from './tools/DocxToHtml'
import DocxToTxt from './tools/DocxToTxt'
import Song2Vid from './tools/Song2Vid'
import CropPdf from './tools/CropPdf'
import SignPdf from './tools/SignPdf'
import JpgToPng from './tools/JpgToPng'
import PngToJpg from './tools/PngToJpg'
import XlsxToCsv from './tools/XlsxToCsv'
import CsvToXlsx from './tools/CsvToXlsx'
import QrCode from './tools/QrCode'
import JsonToCsv from './tools/JsonToCsv'
import FileHasher from './tools/FileHasher'
import TextRedactor from './tools/TextRedactor'
import ImageResize from './tools/ImageResize'
import PasswordGenerator from './tools/PasswordGenerator'
import UuidGenerator from './tools/UuidGenerator'
import Base64Tool from './tools/Base64Tool'
import JwtDecoder from './tools/JwtDecoder'
import ColorConverter from './tools/ColorConverter'
import MarkdownEditor from './tools/MarkdownEditor'
import ImageToWebp from './tools/ImageToWebp'
import TextDiff from './tools/TextDiff'
import LoremIpsum from './tools/LoremIpsum'
import ImageFilters from './tools/ImageFilters'
import VideoToGif from './tools/VideoToGif'
import AudioTrimmer from './tools/AudioTrimmer'
import PdfWatermark from './tools/PdfWatermark'
import PdfPageNumbers from './tools/PdfPageNumbers'
import RedactPdf from './tools/RedactPdf'
import HtmlToPdf from './tools/HtmlToPdf'
import DocxToPdf from './tools/DocxToPdf'
import PdfToDocx from './tools/PdfToDocx'
import UnitConverter from './tools/UnitConverter'
import AudioConverter from './tools/AudioConverter'
import VideoToMp3 from './tools/VideoToMp3'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy-pledge" element={<PrivacyPledge />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/all-tools" element={<AllTools />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/contact" element={<Contact />} />

      {/* PDF Tools */}
      <Route path="/tools/pdf-to-jpg" element={<ToolLayout><PdfToJpg /></ToolLayout>} />
      <Route path="/tools/pdf-to-png" element={<ToolLayout><PdfToPng /></ToolLayout>} />
      <Route path="/tools/merge-pdf" element={<ToolLayout><MergePdf /></ToolLayout>} />
      <Route path="/tools/split-pdf" element={<ToolLayout><SplitPdf /></ToolLayout>} />
      <Route path="/tools/compress-pdf" element={<ToolLayout><CompressPdf /></ToolLayout>} />
      <Route path="/tools/rotate-pdf" element={<ToolLayout><RotatePdf /></ToolLayout>} />
      <Route path="/tools/pdf-ocr" element={<ToolLayout><PdfOcr /></ToolLayout>} />
      <Route path="/tools/sign-pdf" element={<ToolLayout><SignPdf /></ToolLayout>} />
      <Route path="/tools/crop-pdf" element={<ToolLayout><CropPdf /></ToolLayout>} />
      <Route path="/tools/redact-pdf" element={<ToolLayout><RedactPdf /></ToolLayout>} />
      <Route path="/tools/html-to-pdf" element={<ToolLayout><HtmlToPdf /></ToolLayout>} />
      <Route path="/tools/pdf-watermark" element={<ToolLayout><PdfWatermark /></ToolLayout>} />
      <Route path="/tools/pdf-page-numbers" element={<ToolLayout><PdfPageNumbers /></ToolLayout>} />

      {/* Document Tools */}
      <Route path="/tools/docx-to-markdown" element={<ToolLayout><DocxToMarkdown /></ToolLayout>} />
      <Route path="/tools/docx-to-html" element={<ToolLayout><DocxToHtml /></ToolLayout>} />
      <Route path="/tools/docx-to-txt" element={<ToolLayout><DocxToTxt /></ToolLayout>} />
      <Route path="/tools/docx-to-pdf" element={<ToolLayout><DocxToPdf /></ToolLayout>} />
      <Route path="/tools/pdf-to-docx" element={<ToolLayout><PdfToDocx /></ToolLayout>} />

      {/* Audio / Video */}
      <Route path="/tools/song2vid" element={<ToolLayout><Song2Vid /></ToolLayout>} />
      <Route path="/tools/video-to-gif" element={<ToolLayout><VideoToGif /></ToolLayout>} />
      <Route path="/tools/audio-trimmer" element={<ToolLayout><AudioTrimmer /></ToolLayout>} />

      {/* Image Tools */}
      <Route path="/tools/jpg-to-png" element={<ToolLayout><JpgToPng /></ToolLayout>} />
      <Route path="/tools/png-to-jpg" element={<ToolLayout><PngToJpg /></ToolLayout>} />
      <Route path="/tools/image-resize" element={<ToolLayout><ImageResize /></ToolLayout>} />
      <Route path="/tools/image-to-webp" element={<ToolLayout><ImageToWebp /></ToolLayout>} />
      <Route path="/tools/image-filters" element={<ToolLayout><ImageFilters /></ToolLayout>} />

      {/* Spreadsheet */}
      <Route path="/tools/xlsx-to-csv" element={<ToolLayout><XlsxToCsv /></ToolLayout>} />
      <Route path="/tools/csv-to-xlsx" element={<ToolLayout><CsvToXlsx /></ToolLayout>} />

      {/* Data & Utility */}
      <Route path="/tools/qr-code" element={<ToolLayout><QrCode /></ToolLayout>} />
      <Route path="/tools/json-to-csv" element={<ToolLayout><JsonToCsv /></ToolLayout>} />
      <Route path="/tools/file-hasher" element={<ToolLayout><FileHasher /></ToolLayout>} />
      <Route path="/tools/text-redactor" element={<ToolLayout><TextRedactor /></ToolLayout>} />
      <Route path="/tools/password-generator" element={<ToolLayout><PasswordGenerator /></ToolLayout>} />
      <Route path="/tools/uuid-generator" element={<ToolLayout><UuidGenerator /></ToolLayout>} />
      <Route path="/tools/base64-tool" element={<ToolLayout><Base64Tool /></ToolLayout>} />
      <Route path="/tools/jwt-decoder" element={<ToolLayout><JwtDecoder /></ToolLayout>} />
      <Route path="/tools/color-converter" element={<ToolLayout><ColorConverter /></ToolLayout>} />
      <Route path="/tools/markdown-editor" element={<ToolLayout><MarkdownEditor /></ToolLayout>} />
      <Route path="/tools/text-diff" element={<ToolLayout><TextDiff /></ToolLayout>} />
      <Route path="/tools/lorem-ipsum" element={<ToolLayout><LoremIpsum /></ToolLayout>} />
      <Route path="/tools/unit-converter" element={<ToolLayout><UnitConverter /></ToolLayout>} />
      <Route path="/tools/audio-converter" element={<ToolLayout><AudioConverter /></ToolLayout>} />
      <Route path="/tools/video-to-mp3" element={<ToolLayout><VideoToMp3 /></ToolLayout>} />

      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
