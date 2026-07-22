import { useState } from 'react'
import { Copy } from 'lucide-react'

const PARAGRAPHS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.",
  "Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.",
  "Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat."
]

export default function LoremIpsum() {
  const [count, setCount] = useState(3)
  const [text, setText] = useState('')

  const generate = () => {
    const result = Array.from({ length: count }, (_, i) => PARAGRAPHS[i % PARAGRAPHS.length]).join('\n\n')
    setText(result)
  }

  const copy = () => {
    navigator.clipboard.writeText(text)
    alert('Copied!')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">Lorem Ipsum Generator</h1>
      
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium">Paragraphs:</label>
        <input type="number" min="1" max="20" value={count} onChange={e => setCount(Number(e.target.value))} className="w-20 p-2 rounded-lg border" />
        <button onClick={generate} className="px-6 py-2 rounded-xl bg-indigo-600 text-white">Generate</button>
      </div>

      {text && (
        <div>
          <div className="flex justify-end mb-2">
            <button onClick={copy} className="text-sm text-indigo-600 flex items-center gap-1"><Copy className="w-4 h-4" /> Copy</button>
          </div>
          <textarea value={text} readOnly className="w-full h-80 p-4 rounded-xl border bg-slate-50" />
        </div>
      )}
    </div>
  )
}
