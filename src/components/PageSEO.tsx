import { useEffect } from 'react'

const SITE_URL = 'https://pridocs.org'
const DEFAULT_TITLE = 'Pridocs | Free Private File Tools — HEIC, Images, Audio & More'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/** Client-side head sync for marketing pages (edge Functions handle first paint). */
export default function PageSEO({
  title,
  description,
  path,
  keywords,
}: {
  title: string
  description: string
  path: string
  keywords?: string
}) {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path}`
    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    if (keywords) setMeta('name', 'keywords', keywords)

    let canonicalTag = document.querySelector('link[rel="canonical"]')
    if (!canonicalTag) {
      canonicalTag = document.createElement('link')
      canonicalTag.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalTag)
    }
    canonicalTag.setAttribute('href', canonicalUrl)

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title, description, path, keywords])

  return null
}
