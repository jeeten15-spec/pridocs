import { rewritePageMeta, SITE_URL } from './_lib/pageMeta.js'

export async function onRequest(context) {
  return rewritePageMeta({
    request: context.request,
    env: context.env,
    title: 'Privacy Pledge — Your Files Never Leave Your Device | Pridocs',
    description:
      'Pridocs privacy pledge: file processing runs in your browser. No uploads, no ads, no tracking of your documents.',
    canonicalPath: '/privacy-pledge',
    keywords: 'pridocs privacy, no upload converter, private online tools',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Pridocs Privacy Pledge',
      url: `${SITE_URL}/privacy-pledge`,
    },
  })
}
