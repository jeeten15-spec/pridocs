import { useEffect, useState } from 'react'

export interface CurrencyOption {
  code: string
  label: string
  symbol: string
}

// Covers the large majority of Pridocs' likely audience by search volume.
// Not exhaustive — users can always pick manually from the dropdown.
export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'AED' },
  { code: 'SAR', label: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
  { code: 'PKR', label: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', label: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'PHP', label: 'Philippine Peso', symbol: '₱' },
  { code: 'IDR', label: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', label: 'Thai Baht', symbol: '฿' },
  { code: 'VND', label: 'Vietnamese Dong', symbol: '₫' },
  { code: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', label: 'Mexican Peso', symbol: 'MX$' },
  { code: 'NZD', label: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', label: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', label: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', label: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', label: 'Polish Zloty', symbol: 'zł' },
  { code: 'TRY', label: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', label: 'Russian Ruble', symbol: '₽' },
  { code: 'KRW', label: 'South Korean Won', symbol: '₩' },
  { code: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'ILS', label: 'Israeli Shekel', symbol: '₪' },
  { code: 'EGP', label: 'Egyptian Pound', symbol: 'E£' },
]

const EUR_COUNTRIES = new Set([
  'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'PT', 'FI', 'GR', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT', 'HR',
])

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', IN: 'INR', GB: 'GBP', CA: 'CAD', AU: 'AUD', AE: 'AED', SA: 'SAR', SG: 'SGD',
  JP: 'JPY', CN: 'CNY', ZA: 'ZAR', NG: 'NGN', PK: 'PKR', BD: 'BDT', PH: 'PHP', ID: 'IDR',
  MY: 'MYR', TH: 'THB', VN: 'VND', BR: 'BRL', MX: 'MXN', NZ: 'NZD', CH: 'CHF', SE: 'SEK',
  NO: 'NOK', DK: 'DKK', PL: 'PLN', TR: 'TRY', RU: 'RUB', KR: 'KRW', HK: 'HKD', IL: 'ILS', EG: 'EGP',
}

export function currencyForCountry(country: string | null | undefined): string {
  if (!country) return 'USD'
  if (EUR_COUNTRIES.has(country)) return 'EUR'
  return COUNTRY_TO_CURRENCY[country] || 'USD'
}

/** Best-effort, fully client-side fallback when the /api/geo call isn't available (e.g. local dev). */
function currencyFromBrowserLocale(): string {
  try {
    const locale = new Intl.Locale(navigator.language)
    const region = locale.maximize().region
    return currencyForCountry(region || null)
  } catch {
    return 'USD'
  }
}

/**
 * Detects a sensible default currency for the visitor using Cloudflare's
 * edge country signal (see functions/api/geo.js), falling back to the
 * browser's own locale, then USD. Always just a *default* — every tool using
 * this should let the user override it via a dropdown.
 */
export function useDetectedCurrency(): string {
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof sessionStorage !== 'undefined') {
      const cached = sessionStorage.getItem('pridocs_currency')
      if (cached) return cached
    }
    return 'USD'
  })

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('pridocs_currency')) {
      return // already resolved earlier this session
    }
    let cancelled = false

    fetch('/api/geo')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { country: string | null }) => {
        if (cancelled) return
        const code = currencyForCountry(data.country)
        setCurrency(code)
        sessionStorage.setItem('pridocs_currency', code)
      })
      .catch(() => {
        if (cancelled) return
        const code = currencyFromBrowserLocale()
        setCurrency(code)
        sessionStorage.setItem('pridocs_currency', code)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return currency
}

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code
}

export function formatCurrency(value: number, code: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${currencySymbol(code)}${Math.round(value).toLocaleString()}`
  }
}
