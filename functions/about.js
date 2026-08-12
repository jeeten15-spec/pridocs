import { rewritePageMeta, SITE_URL } from './_lib/pageMeta.js'

export async function onRequest(context) {
  return rewritePageMeta({
    request: context.request,
    env: context.env,
    title: 'About Pridocs — Private, Ad-Free Browser Tools',
    description:
      'Pridocs processes files in your browser so they never leave your device. Learn about our privacy-first, ad-free tool suite.',
    canonicalPath: '/about',
    keywords: 'about pridocs, private file converter, browser based tools',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Pridocs',
      url: `${SITE_URL}/about`,
    },
  })
}
