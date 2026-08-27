import { useEffect, useId, useRef } from 'react'

/** PayPal Hosted Buttons — Buy Me a Coffee / support Pridocs */
const PAYPAL_CLIENT_ID =
  'BAAY-NrgK6PrSduATvNMOG5HYyMLDG61OTFS_BHzyAAjJcz-1fBRRwMXmemDx03BojVXz_T_Xj9or7i3QU'
const HOSTED_BUTTON_ID = 'GELQR22XT2MTG'
const SCRIPT_SRC = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=USD`

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (opts: { hostedButtonId: string }) => {
        render: (selector: string) => void | Promise<void>
      }
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadPayPalScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.paypal?.HostedButtons) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src^="https://www.paypal.com/sdk/js"]'
    )
    if (existing) {
      if (window.paypal?.HostedButtons) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('PayPal SDK failed to load')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('PayPal SDK failed to load'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

/**
 * PayPal Hosted Button (replaces the old Razorpay "Buy Me a Coffee" link).
 * Loads the official PayPal SDK once and renders the hosted button into a unique container.
 */
export default function PaymentButton() {
  const reactId = useId().replace(/:/g, '')
  const containerId = `paypal-container-${HOSTED_BUTTON_ID}-${reactId}`
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    let cancelled = false

    loadPayPalScript()
      .then(() => {
        if (cancelled || !mounted.current || !window.paypal?.HostedButtons) return
        const el = document.getElementById(containerId)
        if (!el) return
        el.innerHTML = ''
        return window.paypal.HostedButtons({ hostedButtonId: HOSTED_BUTTON_ID }).render(
          `#${containerId}`
        )
      })
      .catch(() => {
        /* SDK blocked / offline — leave empty container */
      })

    return () => {
      cancelled = true
      mounted.current = false
    }
  }, [containerId])

  // Do not put `display:flex` on the PayPal mount node — it collapses the
  // hosted button and stacks label text one character per line.
  return (
    <div className="w-full flex justify-center">
      <div
        id={containerId}
        className="w-full max-w-sm min-h-[45px] text-left"
        aria-label="Support Pridocs with PayPal"
      />
    </div>
  )
}
