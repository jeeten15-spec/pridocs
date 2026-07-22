import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import Fuse from 'fuse.js'
import { tools, popularTools } from '../data/tools'
import PaymentButton from '../components/PaymentButton'
import ThemeToggle from '../components/ThemeToggle'
import { cn } from '../lib/utils'

const fuse = new Fuse(tools, {
  keys: ['name', 'shortName', 'description', 'keywords'],
  threshold: 0.35,
  includeScore: true,
})

export default function Landing() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<typeof tools>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      setShowResults(false)
      return
    }
    const found = fuse.search(query).map((r) => r.item).slice(0, 8)
    setResults(found)
    setShowResults(true)
    setActiveIndex(0)
  }, [query])

  const goToTool = (path: string) => {
    setQuery('')
    setShowResults(false)
    navigate(path)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      goToTool(results[activeIndex].path)
    } else if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-[#f8fafc] dark:bg-slate-900">
        {/* Top bar with theme toggle */}
        <div className="flex justify-end px-4 pt-4">
          <ThemeToggle />
        </div>
        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-4">
          {/* Logo + Hero Text (Google-like) */}
          <div className="mb-4 flex flex-col items-center text-center">
            <img 
              src="/logo.png" 
              alt="Pridocs Logo" 
              className="w-20 h-20 mb-3 drop-shadow-xl" 
            />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-[#0A2540] dark:text-slate-100 mb-2">
              PRIDOCS
            </h1>
            <p className="text-lg text-slate-600 max-w-md">
              Your files never leave your computer. Processing happens locally.
            </p>
          </div>

          {/* Search */}
          <div className="w-full max-w-xl relative">
            <div
              className={cn(
                'flex items-center gap-3 bg-white rounded-full border border-slate-200 shadow-sm px-5 py-3.5 transition-all',
                'focus-within:border-indigo-300 focus-within:shadow-md focus-within:shadow-indigo-100'
              )}
            >
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query && setShowResults(true)}
                placeholder="What do you need to do? (e.g., 'Convert MP3 to MP4', 'PDF to JPG')"
                className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-[15px]"
                autoComplete="off"
              />
            </div>

            {/* Results dropdown */}
            {showResults && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-20">
                {results.map((tool, idx) => (
                  <button
                    key={tool.id}
                    onClick={() => goToTool(tool.path)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      'w-full text-left px-5 py-3 flex items-center gap-3 transition-colors',
                      idx === activeIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900">{tool.name}</div>
                      <div className="text-sm text-slate-500 truncate">{tool.description}</div>
                    </div>
                    {tool.phase === 2 && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Phase 2
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular tools */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <span>Popular Tools:</span>
            {popularTools.map((tool, i) => (
              <span key={tool.id} className="flex items-center gap-2">
                <Link
                  to={tool.path}
                  className="text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-2"
                >
                  {tool.shortName}
                </Link>
                {i < popularTools.length - 1 && <span className="text-slate-300">|</span>}
              </span>
            ))}
          </div>

          {/* Prominent All Tools CTA */}
          <div className="mt-8">
            <Link
              to="/all-tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/25 hover:bg-indigo-500 hover:shadow-lg transition-all"
            >
              View All Tools →
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-6 mb-5">
            <Link to="/how-it-works" className="hover:text-slate-600 transition-colors">How it Works</Link>
            <Link to="/about" className="hover:text-slate-600 transition-colors">About Us</Link>
            <Link to="/privacy-pledge" className="hover:text-slate-600 transition-colors">Privacy Pledge</Link>
            <Link to="/blog" className="hover:text-slate-600 transition-colors">Blog</Link>
            <Link to="/contact" className="hover:text-slate-600 transition-colors">Contact Us</Link>
          </div>
          
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-700 mb-2">Support Pridocs / Buy Us a Coffee</p>
            <PaymentButton />
          </div>
          
          <p className="text-xs font-medium">Privacy First. Simplicity Always.</p>
        </footer>
      </div>
  )
}
