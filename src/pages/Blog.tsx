import { Link } from 'react-router-dom'
import { blogPosts } from '../data/blogPosts'
import PaymentButton from '../components/PaymentButton'
import PageSEO from '../components/PageSEO'

export default function Blog() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <PageSEO
        title="Pridocs Blog — Private Tools Guides & Tips"
        description="Guides on private file tools, image workflows, word games, and browser-based converters from Pridocs."
        path="/blog"
        keywords="pridocs blog, private file tools, background remover guide, word tools"
      />
      <div className="mb-8">
        <Link to="/" className="text-sm text-indigo-600 hover:underline">
          ← Home
        </Link>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Pridocs Blog</h1>
      <p className="text-slate-500 mb-10">
        Guides on private file tools, image workflows, and word games — written to help you find the right free tool
        without uploading your data.
      </p>

      <div className="space-y-8">
        {blogPosts.map((post) => (
          <article key={post.slug} className="border-b border-slate-200 pb-8">
            <p className="text-xs text-slate-400 mb-2">
              {post.dateLabel} · {post.category}
            </p>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              <Link to={`/blog/${post.slug}`} className="hover:text-indigo-600">
                {post.title}
              </Link>
            </h2>
            <p className="text-slate-600 mb-3">{post.description}</p>
            <Link to={`/blog/${post.slug}`} className="text-sm font-medium text-indigo-600 hover:underline">
              Read article →
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200 text-center">
        <p className="text-sm font-medium text-slate-700 mb-3">Support Pridocs / Buy Me a Coffee</p>
        <PaymentButton />
      </div>
    </div>
  )
}
