// Cloudflare Pages Function — server-renders the actual /how-it-works page
// content into the initial HTML response.
//
// This page exists specifically to be a credible, crawlable trust artifact,
// so its real paragraph content (not just <title>/meta tags) needs to be
// present in the HTML a crawler fetches, before any JavaScript runs. We
// achieve that with react-dom/server's renderToStaticMarkup, using the exact
// same component (src/content/HowItWorksContent.tsx) the client app renders
// after hydration — so the two can never drift out of sync.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HowItWorksContent from '../src/content/HowItWorksContent.tsx'

const SITE_URL = 'https://pridocs.org'
const TITLE = 'How Pridocs Works — No Uploads, No Server Processing | Pridocs'
const DESCRIPTION =
  "A plain-language, technical explanation of exactly how Pridocs converts files entirely in your browser using PDF.js, pdf-lib, Mammoth.js, Tesseract.js and FFmpeg.wasm — with a link to the public source code."

export async function onRequest(context) {
  const { request, env } = context
  const canonicalUrl = `${SITE_URL}/how-it-works`

  const assetResponse = await env.ASSETS.fetch(new URL('/index.html', request.url))
  const contentHtml = renderToStaticMarkup(createElement(HowItWorksContent))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'How Pridocs Works',
    url: canonicalUrl,
    description: DESCRIPTION,
    isPartOf: { '@type': 'WebSite', name: 'Pridocs', url: SITE_URL },
  }

  const rewriter = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(TITLE) } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', DESCRIPTION) } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', TITLE) } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', DESCRIPTION) } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', canonicalUrl) } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute('content', TITLE) } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute('content', DESCRIPTION) } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', canonicalUrl) } })
    .on('head', {
      element(el) {
        el.append(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`, { html: true })
      },
    })
    .on('#root', {
      element(el) {
        // Pre-fill the mount point with the real rendered content. React
        // simply re-renders over this once it hydrates client-side — no
        // functional difference for users, but crawlers see real content
        // in the initial response instead of an empty div.
        el.setInnerContent(contentHtml, { html: true })
      },
    })

  return rewriter.transform(assetResponse)
}
