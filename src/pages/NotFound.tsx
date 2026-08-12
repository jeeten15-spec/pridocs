import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-20 text-center bg-[#f8fafc]">
      <p className="text-sm font-medium text-indigo-600 mb-2">404</p>
      <h1 className="text-3xl font-semibold text-slate-900 mb-3">Page not found</h1>
      <p className="text-slate-500 max-w-md mb-8">
        That URL doesn&apos;t match a Pridocs tool or page. Try search from the home page or browse all tools.
      </p>
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        <Link to="/" className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-medium">
          Home
        </Link>
        <Link to="/all-tools" className="px-5 py-2.5 rounded-full border border-slate-200 bg-white font-medium text-slate-700">
          All tools
        </Link>
        <Link to="/blog" className="px-5 py-2.5 rounded-full border border-slate-200 bg-white font-medium text-slate-700">
          Blog
        </Link>
      </div>
    </div>
  )
}
