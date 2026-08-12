import { rewritePageMeta, SITE_URL } from './_lib/pageMeta.js'

export async function onRequest(context) {
  return rewritePageMeta({
    request: context.request,
    env: context.env,
    title: 'Pridocs Blog — Private Tools Guides & Tips',
    description:
      'Guides on private file tools, image workflows, word games, and browser-based converters from Pridocs.',
    canonicalPath: '/blog',
    keywords: 'pridocs blog, private file tools, background remover guide, word tools',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Pridocs Blog',
      url: `${SITE_URL}/blog`,
    },
  })
}
