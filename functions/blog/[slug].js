import { rewritePageMeta, SITE_URL } from '../_lib/pageMeta.js'
import { getBlogPost } from '../../src/data/blogPosts.ts'

export async function onRequest(context) {
  const { request, env, params } = context
  const post = getBlogPost(params.slug)

  if (!post) {
    return env.ASSETS.fetch(new URL('/index.html', request.url))
  }

  return rewritePageMeta({
    request,
    env,
    title: `${post.title} | Pridocs Blog`,
    description: post.description,
    canonicalPath: `/blog/${post.slug}`,
    keywords: post.keywords.join(', '),
    schema: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: { '@type': 'Organization', name: 'Pridocs', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'Pridocs', url: SITE_URL },
      mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    },
  })
}
