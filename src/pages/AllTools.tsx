import { Link } from 'react-router-dom'
import { tools } from '../data/tools'
import ThemeToggle from '../components/ThemeToggle'

const categoryOrder = ['pdf', 'document', 'image', 'spreadsheet', 'audio', 'data', 'utility']
const categoryLabels: Record<string, string> = {
  pdf: 'PDF Tools',
  document: 'Document Converters',
  image: 'Image Converters & Editors',
  spreadsheet: 'Spreadsheet Tools',
  audio: 'Audio & Video Tools',
  data: 'Data Converters',
  utility: 'Utilities & Generators',
}

export default function AllTools() {
  const grouped = categoryOrder.map(cat => ({
    category: cat,
    label: categoryLabels[cat] || cat,
    items: tools.filter(t => t.category === cat)
  })).filter(g => g.items.length > 0)

  return (
    <div className="min-h-full flex flex-col bg-[#f8fafc] dark:bg-slate-900">
      {/* Header with logo */}
      <header className="border-b border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Pridocs" className="w-9 h-9 rounded-full object-cover" />
            <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
              Pridocs
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 flex-1">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">All Pridocs Tools</h1>
        <p className="text-center text-slate-500 mb-10">Privacy-first tools that run entirely in your browser</p>
        
        <div className="space-y-10">
          {grouped.map(group => (
            <div key={group.category}>
              <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">
                {group.label}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {group.items.map((tool) => (
                  <Link 
                    key={tool.id} 
                    to={tool.path}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">{tool.name}</div>
                    <div className="text-sm text-slate-500">{tool.description}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
