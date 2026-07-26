import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registration is done manually in src/main.tsx via `virtual:pwa-register`,
      // so don't have the plugin also inject its own registration script.
      injectRegister: null,
      includeAssets: ['favicon.svg', 'logo.png', 'robots.txt'],
      manifest: {
        name: 'Pridocs - Private Document & Media Tools',
        short_name: 'Pridocs',
        description:
          'Free, ad-free document, image, audio and video tools that run entirely in your browser. No uploads, no accounts.',
        theme_color: '#0A2540',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // Note: the existing logo art fills the full canvas edge-to-edge (the
        // "PRIDOCS" wordmark sits right at the bottom edge), so it's declared
        // "any" only. Marking it "maskable" too would let Android's adaptive-icon
        // mask crop into that text. A dedicated icon with ~20% safe padding
        // would be needed for a proper maskable variant.
        icons: [{ src: '/logo.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' }],
      },
      workbox: {
        // Precache only the app shell (JS/CSS/HTML). The heavy per-tool engines
        // (ffmpeg.wasm, tesseract.js models, pdf.js) are lazy-loaded chunks —
        // precaching all of them would bloat the initial install. They're
        // cached at runtime instead, the first time each tool is opened, so
        // tools become available offline after their first use.
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'pridocs-app-assets' },
          },
          {
            urlPattern: /\.(wasm|data|traineddata|gz)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pridocs-tool-engines',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: [
      'pdfjs-dist',
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util',
      '@ffmpeg/core',
    ],
  },
  worker: {
    format: 'es',
  },
})
