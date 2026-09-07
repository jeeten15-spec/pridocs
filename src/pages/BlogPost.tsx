import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { getBlogPost } from '../data/blogPosts'
import PaymentButton from '../components/PaymentButton'
import WordToolsArticle from '../content/blog/WordToolsArticle'
import DailyScrambleArticle from '../content/blog/DailyScrambleArticle'
import HeicToJpgArticle from '../content/blog/HeicToJpgArticle'
import BackgroundRemoverArticle from '../content/blog/BackgroundRemoverArticle'
import CompressImagesArticle from '../content/blog/CompressImagesArticle'
import PrivacyConvertersArticle from '../content/blog/PrivacyConvertersArticle'

const SITE = 'https://pridocs.org'
const DEFAULT_TITLE = 'Pridocs | Free, Secure & Ad-Free Document and Media Converter'

const bodies: Record<string, () => React.ReactElement> = {
  'heic-to-jpg-free-no-upload-private': () => <HeicToJpgArticle />,
  'daily-word-scramble-themed-puzzle': () => <DailyScrambleArticle />,
  'free-word-tools-unscrambler-crossword-daily-puzzle': () => <WordToolsArticle />,
  'free-ai-background-remover-no-upload': () => <BackgroundRemoverArticle />,
  'compress-images-online-without-uploading': () => <CompressImagesArticle />,
  'stop-uploading-sensitive-files-to-online-converters': () => <PrivacyConvertersArticle />,
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export default function BlogPost() {
  const { slug } = useParams()
  const post = getBlogPost(slug)

  useEffect(() => {
    if (!post) return
    const url = `${SITE}/blog/${post.slug}`
    document.title = `${post.title} | Pridocs Blog`
    setMeta('name', 'description', post.description)
    setMeta('name', 'keywords', post.keywords.join(', '))
    setMeta('property', 'og:title', post.title)
    setMeta('property', 'og:description', post.description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', post.title)
    setMeta('name', 'twitter:description', post.description)
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)

    let schema = document.getElementById('blog-post-schema') as HTMLScriptElement | null
    if (!schema) {
      schema = document.createElement('script')
      schema.id = 'blog-post-schema'
      schema.type = 'application/ld+json'
      document.head.appendChild(schema)
    }
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: { '@type': 'Organization', name: 'Pridocs', url: SITE },
      publisher: { '@type': 'Organization', name: 'Pridocs', url: SITE },
      mainEntityOfPage: url,
    })

    return () => {
      document.title = DEFAULT_TITLE
      schema?.remove()
    }
  }, [post])

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Article not found</h1>
        <Link to="/blog" className="text-indigo-600 hover:underline">
          ← Back to blog
        </Link>
      </div>
    )
  }

  const Body = bodies[post.slug]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-wrap gap-4 text-sm">
        <Link to="/" className="text-indigo-600 hover:underline">
          ← Home
        </Link>
        <Link to="/blog" className="text-indigo-600 hover:underline">
          Blog
        </Link>
      </div>

      <article className="prose prose-slate max-w-none">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">{post.title}</h1>
        <p className="text-slate-500 text-sm mb-8">
          Published {post.dateLabel} · Pridocs Blog · {post.category}
        </p>
        {Body ? <Body /> : <p>Content unavailable.</p>}
      </article>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-slate-700 mb-3">Support Pridocs / Buy Me a Coffee</p>
          <PaymentButton />
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <Link to="/blog" className="text-indigo-600 hover:underline">
            ← All articles
          </Link>
          <Link to="/all-tools" className="text-indigo-600 hover:underline">
            All Tools
          </Link>
        </div>
      </div>
    </div>
  )
}
