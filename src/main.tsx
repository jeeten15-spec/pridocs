import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Registers the Workbox service worker (installability + offline caching).
// autoUpdate silently activates new versions on the next navigation — no
// user-facing "refresh to update" prompt needed for this app.
registerSW({ immediate: true })
