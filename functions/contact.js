import { rewritePageMeta, SITE_URL } from './_lib/pageMeta.js'

export async function onRequest(context) {
  return rewritePageMeta({
    request: context.request,
    env: context.env,
    title: 'Contact Pridocs',
    description: 'Contact the Pridocs team. Questions, feedback, and support for our free private browser tools.',
    canonicalPath: '/contact',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Pridocs',
      url: `${SITE_URL}/contact`,
    },
  })
}
