// Tiny Cloudflare Pages Function that returns the visitor's country code,
// as already inferred by Cloudflare's edge network for routing/caching
// purposes (request.cf.country). No IP address is logged or stored by us,
// and no third-party geolocation service is called — this just reads a
// signal Cloudflare's edge already has for the request that's already
// happening. Used only to pick a sensible *default* currency in tools like
// the EMI/Mortgage calculator; users can always override it manually.
export async function onRequest(context) {
  const country = context.request.cf?.country || null
  return new Response(JSON.stringify({ country }), {
    headers: {
      'content-type': 'application/json',
      // "private" so this is never cached by Cloudflare's shared edge cache
      // (which would risk serving one visitor's country to another) — the
      // browser may still cache it for this session only.
      'cache-control': 'private, max-age=3600',
    },
  })
}
