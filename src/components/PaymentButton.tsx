import { Coffee } from 'lucide-react'

const RZP_BUTTON_ID = 'pl_TFeetQX2tkOcK5'
const RZP_URL = `https://razorpay.com/payment-button/${RZP_BUTTON_ID}/view`

/**
 * Reliable support button.
 * Razorpay's embed script is blocked by COEP headers (needed for some WASM tools)
 * and by many ad blockers, so we use a direct payment-button link instead.
 */
export default function PaymentButton() {
  return (
    <a
      href={RZP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold shadow-md shadow-amber-500/25 transition-colors"
    >
      <Coffee className="w-4 h-4" />
      Buy Us a Coffee
    </a>
  )
}
