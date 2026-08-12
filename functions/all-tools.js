import { rewritePageMeta, SITE_URL } from './_lib/pageMeta.js'

export async function onRequest(context) {
  return rewritePageMeta({
    request: context.request,
    env: context.env,
    title: 'All Tools — Free Private Converters & Utilities | Pridocs',
    description:
      'Browse every Pridocs tool: HEIC to JPG, background remover, PDF converters, OCR, Word Daily, invoice PDF, ZIP, and more. Free, ad-free, no uploads.',
    canonicalPath: '/all-tools',
    keywords: 'all tools, free online converters, private file tools, heic to jpg, background remover',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'All Pridocs Tools',
      url: `${SITE_URL}/all-tools`,
      description: 'Complete list of free private browser tools on Pridocs.',
    },
  })
}
