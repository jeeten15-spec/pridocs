// Runs on every Pages Function request.
// Note: Cloudflare does NOT apply `_redirects` to URLs served by Functions,
// so host + trailing-slash normalization must live here.
export async function onRequest(context) {
  const url = new URL(context.request.url)

  if (url.hostname === 'www.pridocs.org') {
    url.hostname = 'pridocs.org'
    return Response.redirect(url.toString(), 301)
  }

  // Prefer non-trailing-slash URLs (except `/`) so Google does not treat
  // `/path/` as a duplicate of `/path`.
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '') || '/'
    return Response.redirect(url.toString(), 301)
  }

  return context.next()
}
