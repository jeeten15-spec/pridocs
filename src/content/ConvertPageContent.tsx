// Shared static layout for /convert/:slug landing pages — the H1, intro, and
// FAQ section. Used both by the client page (src/pages/ConvertLandingPage.tsx)
// and rendered server-side (functions/convert/[slug].js) via
// react-dom/server, so the real copy is present in the initial HTML crawlers
// see. The embedded, interactive conversion tool itself is passed in as
// `children` since it's inherently tool-specific and JS-only.
import React from 'react'
import type { ConvertPage } from '../data/convertPages'

export default function ConvertPageContent({ page, children }: { page: ConvertPage; children?: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">{page.h1}</h1>
        {page.intro.map((paragraph, i) => (
          <p key={i} className="text-slate-500 max-w-xl mx-auto mb-2">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mb-16">{children}</div>

      <section className="pt-10 border-t border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Frequently asked questions</h2>
        <div className="space-y-6">
          {page.faq.map((item, i) => (
            <div key={i}>
              <h3 className="font-medium text-slate-800 mb-1">{item.q}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

void React
