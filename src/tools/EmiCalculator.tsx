import { useMemo, useState } from 'react'
import { ChevronDown, TrendingDown } from 'lucide-react'
import { CURRENCIES, useDetectedCurrency, formatCurrency, currencySymbol } from '../lib/currency'
import { cn } from '../lib/utils'

interface YearRow {
  year: number
  principalPaid: number
  interestPaid: number
  balance: number
}

interface Simulation {
  months: number
  totalInterest: number
  totalPaid: number
  yearly: YearRow[]
}

/** Simulates a reducing-balance loan month by month so extra payments can be modeled accurately. */
function simulate(principal: number, monthlyRate: number, emi: number, extraMonthly: number): Simulation {
  let balance = principal
  let month = 0
  let totalInterest = 0
  let totalPaid = 0
  const yearly: YearRow[] = []
  let yearPrincipal = 0
  let yearInterest = 0

  while (balance > 0.5 && month < 1200) {
    month++
    const interest = balance * monthlyRate
    let principalComponent = emi - interest + extraMonthly
    if (principalComponent > balance) principalComponent = balance
    if (principalComponent < 0) principalComponent = 0

    balance -= principalComponent
    totalInterest += interest
    totalPaid += principalComponent + interest
    yearPrincipal += principalComponent
    yearInterest += interest

    if (month % 12 === 0 || balance <= 0.5) {
      yearly.push({ year: Math.ceil(month / 12), principalPaid: yearPrincipal, interestPaid: yearInterest, balance: Math.max(balance, 0) })
      yearPrincipal = 0
      yearInterest = 0
    }
  }

  return { months: month, totalInterest, totalPaid, yearly }
}

export default function EmiCalculator() {
  const detectedCurrency = useDetectedCurrency()
  const [currency, setCurrency] = useState<string | null>(null)
  const activeCurrency = currency || detectedCurrency

  const [useHomePrice, setUseHomePrice] = useState(false)
  const [homePrice, setHomePrice] = useState(3500000)
  const [downPaymentPct, setDownPaymentPct] = useState(20)
  const [loanAmount, setLoanAmount] = useState(2500000)

  const [rate, setRate] = useState(8.5)
  const [years, setYears] = useState(20)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [extraMonthly, setExtraMonthly] = useState(0)
  const [processingFee, setProcessingFee] = useState(0)
  const [annualTaxPct, setAnnualTaxPct] = useState(0)
  const [annualInsurance, setAnnualInsurance] = useState(0)

  const [showSchedule, setShowSchedule] = useState(false)

  const principal = useHomePrice ? Math.max(homePrice - (homePrice * downPaymentPct) / 100, 0) : loanAmount

  const result = useMemo(() => {
    const P = principal
    const r = rate / 12 / 100
    const n = Math.round(years * 12)
    if (P <= 0 || n <= 0) return null

    const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)

    const base = simulate(P, r, emi, 0)
    const withExtra = extraMonthly > 0 ? simulate(P, r, emi, extraMonthly) : base

    const monthlyTax = (P * (annualTaxPct / 100)) / 12
    const monthlyInsurance = annualInsurance / 12
    const totalMonthlyPayment = emi + monthlyTax + monthlyInsurance

    return {
      emi,
      principal: P,
      base,
      withExtra,
      monthlyTax,
      monthlyInsurance,
      totalMonthlyPayment,
      hasEscrow: annualTaxPct > 0 || annualInsurance > 0,
      interestSaved: base.totalInterest - withExtra.totalInterest,
      monthsSaved: base.months - withExtra.months,
      totalCost: withExtra.totalPaid + processingFee,
    }
  }, [principal, rate, years, extraMonthly, annualTaxPct, annualInsurance, processingFee])

  const fmt = (n: number) => formatCurrency(n, activeCurrency)
  const sym = currencySymbol(activeCurrency)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">EMI / Mortgage Calculator</h1>
        <p className="text-slate-500 dark:text-slate-400">Calculate loan EMI, total interest, prepayment savings and a full amortization schedule — privately in your browser.</p>
      </div>

      <div className="flex justify-center mb-6">
        <select
          value={activeCurrency}
          onChange={(e) => setCurrency(e.target.value)}
          className="text-sm p-2.5 rounded-xl border dark:bg-slate-800 dark:border-slate-600"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.symbol} — {c.label} ({c.code})</option>
          ))}
        </select>
      </div>

      <div className="space-y-5 p-6 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
          <input type="checkbox" checked={useHomePrice} onChange={(e) => setUseHomePrice(e.target.checked)} className="rounded" />
          Enter home price &amp; down payment instead of loan amount
        </label>

        {useHomePrice ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Home price ({sym})</label>
              <input type="number" value={homePrice} onChange={e => setHomePrice(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Down payment: {downPaymentPct}% ({fmt((homePrice * downPaymentPct) / 100)})</label>
              <input type="range" min="0" max="90" step="1" value={downPaymentPct} onChange={e => setDownPaymentPct(Number(e.target.value))} className="w-full" />
            </div>
            <p className="text-sm text-slate-500">Loan amount: <strong>{fmt(principal)}</strong></p>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Loan amount ({sym})</label>
            <input type="number" value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Annual interest rate (%)</label>
          <input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tenure (years)</label>
          <input type="number" value={years} onChange={e => setYears(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" />
        </div>

        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400"
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')} />
          {showAdvanced ? 'Hide' : 'Show'} advanced options
        </button>

        {showAdvanced && (
          <div className="space-y-5 pt-2 border-t dark:border-slate-700">
            <div>
              <label className="block text-sm font-medium mb-1">Extra monthly payment ({sym})</label>
              <input type="number" value={extraMonthly} onChange={e => setExtraMonthly(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" placeholder="0" />
              <p className="text-xs text-slate-500 mt-1">Extra principal paid every month on top of your EMI — pays off the loan faster.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">One-time processing / origination fee ({sym})</label>
              <input type="number" value={processingFee} onChange={e => setProcessingFee(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Annual property tax (% of loan amount)</label>
              <input type="number" step="0.1" value={annualTaxPct} onChange={e => setAnnualTaxPct(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Annual home insurance ({sym})</label>
              <input type="number" value={annualInsurance} onChange={e => setAnnualInsurance(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" placeholder="0" />
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-6 grid gap-3">
          <div className="p-5 rounded-2xl bg-indigo-600 text-white text-center">
            <div className="text-sm opacity-90">Monthly EMI</div>
            <div className="text-3xl font-bold mt-1">{fmt(result.emi)}</div>
          </div>

          {result.hasEscrow && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Est. total monthly payment (EMI + tax + insurance)</div>
              <div className="text-lg font-semibold mt-1">{fmt(result.totalMonthlyPayment)}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Total interest</div>
              <div className="text-lg font-semibold mt-1">{fmt(result.withExtra.totalInterest)}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Total cost (incl. fees)</div>
              <div className="text-lg font-semibold mt-1">{fmt(result.totalCost)}</div>
            </div>
          </div>

          {/* Principal vs interest visual */}
          <div>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="bg-indigo-500" style={{ width: `${(result.principal / result.totalCost) * 100}%` }} />
              <div className="bg-amber-400" style={{ width: `${(result.withExtra.totalInterest / result.totalCost) * 100}%` }} />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1.5">
              <span><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-1" />Principal {fmt(result.principal)}</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />Interest {fmt(result.withExtra.totalInterest)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500">{result.withExtra.months} monthly payments ({(result.withExtra.months / 12).toFixed(1)} years)</p>

          {extraMonthly > 0 && result.monthsSaved > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-900">
                Paying an extra {fmt(extraMonthly)}/month saves you <strong>{fmt(result.interestSaved)}</strong> in interest and pays off the loan <strong>{result.monthsSaved} months earlier</strong> ({(result.monthsSaved / 12).toFixed(1)} years).
              </p>
            </div>
          )}

          <button
            onClick={() => setShowSchedule(v => !v)}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 mt-2"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', showSchedule && 'rotate-180')} />
            {showSchedule ? 'Hide' : 'Show'} yearly amortization schedule
          </button>

          {showSchedule && (
            <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="text-left p-3 font-medium">Year</th>
                    <th className="text-right p-3 font-medium">Principal Paid</th>
                    <th className="text-right p-3 font-medium">Interest Paid</th>
                    <th className="text-right p-3 font-medium">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.withExtra.yearly.map((row) => (
                    <tr key={row.year} className="border-t dark:border-slate-700">
                      <td className="p-3">{row.year}</td>
                      <td className="p-3 text-right">{fmt(row.principalPaid)}</td>
                      <td className="p-3 text-right">{fmt(row.interestPaid)}</td>
                      <td className="p-3 text-right">{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">
        Currency is auto-detected from your region (via Cloudflare's edge, not any third-party tracker) and can be changed above. All calculations happen locally in your browser.
      </p>
    </div>
  )
}
