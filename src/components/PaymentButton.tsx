import { Coffee } from 'lucide-react'

/** Production Razorpay Payment Button ID for Pridocs */
const RZP_BUTTON_ID = 'pl_TGwj6FqUO82fTm'
const RZP_URL = `https://razorpay.com/payment-button/${RZP_BUTTON_ID}/view`

/**
 * Single "Buy Me a Coffee" button.
 * Uses the official Razorpay payment-button page (reliable; no double embed).
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
      Buy Me a Coffee
    </a>
  )
}
