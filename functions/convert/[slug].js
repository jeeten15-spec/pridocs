// Cloudflare Pages Function for the data-driven /convert/:slug long-tail SEO
// landing pages (see src/data/convertPages.ts). Server-renders the real H1,
// intro, and FAQ copy via react-dom/server (same source component the client
// uses), injects per-page meta/canonical/OG tags, and adds FAQPage schema
// generated from the same FAQ data — so both the visible content and the
// rich-result markup are crawlable without JavaScript.
//
// The embedded conversion tool itself is inherently interactive (file input,
// WASM processing) and can't be meaningfully server-rendered, so a static,
// non-functional placeholder stands in for it until React hydrates.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getConvertPage } from '../../src/data/convertPages.ts'
import ConvertPageContent from '../../src/content/ConvertPageContent.tsx'

const SITE_URL = 'https://pridocs.org'

function toolPlaceholder() {
  return createElement('div', {
    className: 'flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white',
    dangerouslySetInnerHTML: {
      __html:
        '<div class="text-center"><p class="font-medium text-slate-700">Loading converter…</p>' +
        '<p class="text-sm text-slate-400 mt-1">Enable JavaScript to use this tool</p></div>',
    },
  })
}

export async function onRequest(context) {
  const { request, env, params } = context
  const page = getConvertPage(params.slug)

  const assetResponse = await env.ASSETS.fetch(new URL('/index.html', request.url))
  if (!page) return assetResponse

  const canonicalUrl = `${SITE_URL}/convert/${page.slug}`
  const fullHtml = renderToStaticMarkup(createElement(ConvertPageContent, { page }, toolPlaceholder()))

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  const rewriter = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(page.title) } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', page.description) } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute('content', page.title) } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', page.description) } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute('content', canonicalUrl) } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute('content', page.title) } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute('content', page.description) } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', canonicalUrl) } })
    .on('head', {
      element(el) {
        el.append(`<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`, { html: true })
      },
    })
    .on('#root', {
      element(el) {
        el.setInnerContent(fullHtml, { html: true })
      },
    })

  return rewriter.transform(assetResponse)
}
