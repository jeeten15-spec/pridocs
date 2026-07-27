// Cloudflare Pages auto-redirects requests for *.html static assets to their
// extension-less "clean URL" (e.g. /foo.html -> /foo), and that behaviour
// isn't overridable via _redirects for classic Pages projects. Yandex's
// site-verification crawler requires this exact literal .html URL to return
// a direct 200, so it's served from a Function instead of a static asset --
// Functions run ahead of that built-in redirect.
export async function onRequest() {
  const html = `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 12ca997a31ee67f7</body>
</html>
`
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  })
}
