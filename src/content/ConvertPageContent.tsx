// Shared static layout for /convert/:slug landing pages — the H1, intro, and
// FAQ section. Used both by the client page (src/pages/ConvertLandingPage.tsx)
// and rendered server-side (functions/convert/[slug].js) via
// react-dom/server, so the real copy is present in the initial HTML crawlers
// see. The embedded, interactive conversion tool itself is passed in as
// `children` since it's inherently tool-specific and JS-only.
import React from 'react'
import type { ConvertPage } from '../data/convertPages'
import { tools } from '../data/tools'

export default function ConvertPageContent({ page, children }: { page: ConvertPage; children?: React.ReactNode }) {
  const primary = tools.find((t) => t.id === page.toolId)
  const related = tools
    .filter((t) => t.id !== page.toolId && (t.category === primary?.category || t.popular))
    .slice(0, 6)

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

      {(primary || related.length > 0) && (
        <section className="mb-12 pt-8 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Related tools</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {primary && (
              <>
                Open the full tool page:{' '}
                <a href={primary.path} className="text-indigo-600 hover:underline">
                  {primary.name}
                </a>
                {related.length > 0 ? '. Also try: ' : '.'}
              </>
            )}
            {related.map((t, i) => (
              <span key={t.id}>
                <a href={t.path} className="text-indigo-600 hover:underline">
                  {t.shortName}
                </a>
                {i < related.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </section>
      )}

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
