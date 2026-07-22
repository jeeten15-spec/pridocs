import { useEffect } from 'react'
import { toolsMeta } from '../data/toolsMeta'

export default function ToolSEO({ id }: { id: string }) {
  useEffect(() => {
    const meta = toolsMeta[id]
    if (!meta) return

    document.title = meta.title

    let descTag = document.querySelector('meta[name="description"]')
    if (!descTag) {
      descTag = document.createElement('meta')
      descTag.setAttribute('name', 'description')
      document.head.appendChild(descTag)
    }
    descTag.setAttribute('content', meta.description)

    // Cleanup on unmount – restore default
    return () => {
      document.title = 'Pridocs | Free, Secure & Ad-Free Document and Media Converter'
    }
  }, [id])

  return null
}
