// Shared helpers for Cloudflare Pages Functions that rewrite SPA head tags.
export const SITE_URL = 'https://pridocs.org'

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Fetch the SPA shell and rewrite title/description/canonical/OG for crawlers.
 * @param {object} opts
 * @param {Request} opts.request
 * @param {any} opts.env
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.canonicalPath absolute path starting with /
 * @param {string} [opts.keywords]
 * @param {object} [opts.schema] JSON-LD object
 */
export async function rewritePageMeta({
  request,
  env,
  title,
  description,
  canonicalPath,
  keywords,
  schema,
}) {
  const assetResponse = await env.ASSETS.fetch(new URL('/index.html', request.url))
  const canonicalUrl = `${SITE_URL}${canonicalPath}`

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
        if (schema) {
          el.append(
            `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
            { html: true },
          )
        }
      },
    })

  return rewriter.transform(assetResponse)
}
