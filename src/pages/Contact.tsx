import { useState } from 'react'
import { Link } from 'react-router-dom'
import PaymentButton from '../components/PaymentButton'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Pridocs Feedback from ${name || 'Anonymous'}`)
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )
    window.location.href = `mailto:feedback@pridocs.org?subject=${subject}&body=${body}`
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold text-slate-900 mb-2">Contact Us</h1>
      <p className="text-slate-500 mb-8">
        Have feedback, a feature request, or found a bug? We’d love to hear from you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-10">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            rows={5}
            className="w-full p-3 rounded-xl border border-slate-200"
            placeholder="Write your message here..."
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500"
        >
          Open Email to Send Message
        </button>
        <p className="text-xs text-slate-500 text-center">
          This opens your email app with the message ready to send to feedback@pridocs.org
        </p>
      </form>

      <div className="pt-8 border-t border-slate-200 text-center">
        <p className="text-sm font-medium text-slate-700 mb-3">Support Pridocs / Buy Us a Coffee</p>
        <PaymentButton />
      </div>

      <div className="mt-10 text-sm">
        <Link to="/" className="text-indigo-600 hover:underline">← Home</Link>
      </div>
    </div>
  )
}
