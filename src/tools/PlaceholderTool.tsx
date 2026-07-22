import { tools } from '../data/tools'
import { Construction } from 'lucide-react'

export default function PlaceholderTool({ id }: { id: string }) {
  const tool = tools.find((t) => t.id === id)

  return (
    <>

      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <Construction className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">
          {tool?.name || 'Tool'}
        </h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          {tool?.description}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-sm text-slate-600">
          Coming very soon · Phase {tool?.phase || 1}
        </div>
      </div>
    </>
  )
}
