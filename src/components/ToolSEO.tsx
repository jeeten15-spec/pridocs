import { useEffect } from 'react'
import { toolsMeta } from '../data/toolsMeta'
import { tools } from '../data/tools'

const SITE_URL = 'https://pridocs.org'
const DEFAULT_TITLE = 'Pridocs | Free, Secure & Ad-Free Document and Media Converter'

const toolKeywords = Object.fromEntries(tools.map((t) => [t.id, t.keywords.join(', ')]))

function setMetaByAttr(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/**
 * Cloudflare Pages Function (functions/tools/[id].js) already injects correct
 * per-tool title/description/OG/canonical/JSON-LD for the initial (server)
 * request, which is what matters for crawlers and link-preview bots. This
 * component keeps the same tags in sync for pure client-side SPA navigation
 * (e.g. clicking between tools without a full page reload), where the edge
 * function never runs again.
 */
export default function ToolSEO({ id }: { id: string }) {
  useEffect(() => {
    const meta = toolsMeta[id]
    if (!meta) return

    document.title = meta.title
    setMetaByAttr('name', 'description', meta.description)

    const canonicalUrl = `${SITE_URL}/tools/${id}`
    setMetaByAttr('property', 'og:title', meta.title)
    setMetaByAttr('property', 'og:description', meta.description)
    setMetaByAttr('property', 'og:url', canonicalUrl)
    setMetaByAttr('name', 'twitter:title', meta.title)
    setMetaByAttr('name', 'twitter:description', meta.description)

    let canonicalTag = document.querySelector('link[rel="canonical"]')
    if (!canonicalTag) {
      canonicalTag = document.createElement('link')
      canonicalTag.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalTag)
    }
    canonicalTag.setAttribute('href', canonicalUrl)

    const keywords = toolKeywords[id]
    if (keywords) setMetaByAttr('name', 'keywords', keywords)

    let schemaTag = document.getElementById('tool-schema') as HTMLScriptElement | null
    if (!schemaTag) {
      schemaTag = document.createElement('script')
      schemaTag.id = 'tool-schema'
      schemaTag.type = 'application/ld+json'
      document.head.appendChild(schemaTag)
    }
    schemaTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: meta.title.split('|')[0].trim(),
      url: canonicalUrl,
      description: meta.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (runs in the browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'Pridocs', url: SITE_URL },
    })

    return () => {
      document.title = DEFAULT_TITLE
      schemaTag?.remove()
    }
  }, [id])

  return null
}
