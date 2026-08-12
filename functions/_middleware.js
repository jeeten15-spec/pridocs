// Runs on every Pages Function request. Keep apex host as the only indexed host.
export async function onRequest(context) {
  const url = new URL(context.request.url)
  if (url.hostname === 'www.pridocs.org') {
    url.hostname = 'pridocs.org'
    return Response.redirect(url.toString(), 301)
  }
  return context.next()
}
