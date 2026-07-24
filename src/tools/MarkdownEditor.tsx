import { useState } from 'react'

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState('# Hello Pridocs\n\nThis is a **live preview** markdown editor.')

  // Simple markdown to HTML (basic)
  const toHtml = (md: string) => {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">Markdown Editor + Preview</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Markdown</label>
          <textarea 
            value={markdown} 
            onChange={e => setMarkdown(e.target.value)} 
            className="w-full h-[500px] p-4 rounded-xl border font-mono text-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Preview</label>
          <div 
            className="w-full h-[500px] p-4 rounded-xl border bg-white overflow-auto prose prose-sm"
            dangerouslySetInnerHTML={{ __html: toHtml(markdown) }} 
          />
        </div>
      </div>
    </div>
  )
}
