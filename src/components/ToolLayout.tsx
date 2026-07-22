import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import ToolSEO from './ToolSEO'
import PaymentButton from './PaymentButton'
import ThemeToggle from './ThemeToggle'

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const toolId = location.pathname.replace(/^\/tools\//, '')

  return (
    <div className="min-h-full flex flex-col bg-[#f8fafc] dark:bg-slate-900">
      <ToolSEO id={toolId} />
      
      <header className="border-b border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Pridocs" className="w-9 h-9 rounded-full object-cover" />
            <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
              Pridocs
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/all-tools"
              className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All tools
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        <p className="mb-1 font-medium text-slate-700">
          Privacy First. Simplicity Always.
        </p>
        <p className="mb-1">
          Files never leave your device · Processing happens locally
        </p>
        <p className="text-slate-400 max-w-md mx-auto mb-5">
          Recommended max size: 50–100 MB (depends on your device RAM). Large files may be slow or fail in the browser.
        </p>

        <div className="mb-5">
          <p className="text-sm font-medium text-slate-700 mb-2">Support Pridocs / Buy Us a Coffee</p>
          <PaymentButton />
        </div>

        <p className="mt-3 flex flex-wrap items-center justify-center gap-4">
          <Link to="/privacy-pledge" className="underline hover:text-slate-600">Privacy Pledge</Link>
          <Link to="/about" className="underline hover:text-slate-600">About</Link>
          <Link to="/how-it-works" className="underline hover:text-slate-600">How it Works</Link>
          <Link to="/blog" className="underline hover:text-slate-600">Blog</Link>
          <Link to="/contact" className="underline hover:text-slate-600">Contact Us</Link>
        </p>
      </footer>
    </div>
  )
}
