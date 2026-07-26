// Cloudflare Pages Function.
//
// Pridocs is a client-side React SPA — without this function, every /tools/:id
// page is served with the same generic <title>/<meta description> baked into
// index.html, because the real per-tool title is only set client-side (after
// React mounts) via ToolSEO.tsx. Search engines and link-preview bots that
// don't fully execute JS see the generic homepage tags instead of the correct
// per-tool ones, which suppresses indexing and produces wrong social previews.
//
// This function intercepts each /tools/:id request at the edge, fetches the
// built index.html shell, and rewrites the relevant <head> tags in-place
// using the same metadata the client already relies on — before the SPA ever
// boots. The app behaves exactly as before once React mounts.
import { toolsMeta } from '../../src/data/toolsMeta.ts'
import { tools } from '../../src/data/tools.ts'

const SITE_URL = 'https://pridocs.org'

const toolKeywords = Object.fromEntries(tools.map((t) => [t.id, t.keywords.join(', ')]))

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function onRequest(context) {
  const { request, env, params } = context
  const toolId = params.id
  const meta = toolsMeta[toolId]

  // Always serve the real built app shell so the SPA boots normally either way.
  const assetResponse = await env.ASSETS.fetch(new URL('/index.html', request.url))

  if (!meta) {
    // Unknown tool id — let the SPA's own client-side routing handle it.
    return assetResponse
  }

  const title = meta.title
  const description = meta.description
  const canonicalUrl = `${SITE_URL}/tools/${toolId}`
  const keywords = toolKeywords[toolId]
  const bareName = title.split('|')[0].trim()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: bareName,
    url: canonicalUrl,
    description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (runs in the browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'Pridocs', url: SITE_URL },
  }

  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(title)
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', description)
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', title)
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', description)
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute('content', canonicalUrl)
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute('content', title)
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute('content', description)
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute('href', canonicalUrl)
      },
    })
    .on('head', {
      element(el) {
        if (keywords) {
          el.append(`<meta name="keywords" content="${escapeHtml(keywords)}">`, { html: true })
        }
        el.append(
          `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
          { html: true },
        )
      },
    })

  return rewriter.transform(assetResponse)
}
