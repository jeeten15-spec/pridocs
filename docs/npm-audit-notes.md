# npm audit notes

Last reviewed: 2026-07-26

Running `npm audit` currently reports **10 high severity** advisories. All of
them trace back to two root packages. Neither requires an urgent fix — both
are explained below, along with what would actually resolve them and why we
haven't applied that yet.

## 1. `brace-expansion` (via `vite-plugin-pwa` → `workbox-build` → `jake` → `ejs` → `minimatch`)

- **What it is:** a denial-of-service bug in `brace-expansion` where a
  crafted glob pattern can cause unbounded memory use.
- **Where it lives:** deep inside `workbox-build`'s own internal build
  tooling (via `jake`/`ejs`, which `workbox-build` uses to template its
  generated service worker). It is a **devDependency-only** chain — it never
  ships to `pridocs.org` visitors' browsers, it only runs on our machine
  during `npm run build`.
- **Real-world exposure:** effectively none for us. Exploiting this requires
  feeding an attacker-controlled glob pattern into `brace-expansion`. Our
  build only ever globs our own repo's file paths (configured by us in
  `vite.config.ts`), never anything user-supplied.
- **Why not fixed:** `npm audit fix --force` "fixes" this only by
  *downgrading* `vite-plugin-pwa` from `1.3.0` (current latest) to `1.2.0`.
  That's not an upstream fix, just an older version that happens to pin an
  older `workbox-build`. `workbox-build@7.4.1` — the latest release as of
  this writing — still has this vulnerable chain, so there's currently no
  real fixed version to move to. Downgrading would lose the current PWA
  plugin version for no real security benefit.
- **Action:** none needed now. Re-run `npm audit` every month or two, or
  after any `npm install`, and check if a newer `workbox-build`/
  `vite-plugin-pwa` release has dropped `jake`/`ejs` from its dependency
  tree — if so, a plain `npm update vite-plugin-pwa` would clear this.

## 2. `react-router` 7.12.0–8.2.x ("RSC Mode CSRF Bypass")

- **What it is:** [GHSA-qwww-vcr4-c8h2](https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2) —
  a CSRF bypass in React Router's **unstable React Server Components (RSC)**
  request-handling code path.
- **Real-world exposure:** none for Pridocs. The advisory explicitly states
  "this only affects your application if you are using the unstable RSC
  APIs." Pridocs is a plain client-side SPA — it renders with `<BrowserRouter>`
  and `<Routes>/<Route>`, and never touches React Router's RSC APIs at all.
- **Why not fixed:** the patched version is `react-router@8.3.0`, which is a
  **major version bump** from the `7.x` line we're on (`react-router-dom` is
  currently pinned to `^7.5.0`, resolving to `7.18.1`). `npm audit fix`
  (non-force) can't apply a major bump automatically, and React Router 7→8
  is a real migration with API changes — not something to force through
  without testing, especially for a feature that doesn't affect us anyway.
- **Action:** plan a deliberate React Router 8 upgrade + smoke test of every
  route/tool page as a normal maintenance task at some point (not urgent),
  rather than force-upgrading blind.

## Summary

| Issue | Ships to production? | Exploitable for Pridocs? | Action taken |
|---|---|---|---|
| `brace-expansion` DoS (via workbox-build) | No — devDependency only | No — no untrusted glob input | None; monitor for upstream fix |
| React Router RSC CSRF bypass | Yes (react-router-dom is a runtime dep) | No — Pridocs doesn't use RSC | None now; plan a deliberate v8 migration later |

`npm audit fix` was run and made no changes (nothing could be safely
auto-applied without a major bump or a downgrade). `npm audit fix --force`
was deliberately **not** run, for the reasons above.
