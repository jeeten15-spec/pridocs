import { useMemo, useState } from 'react'

export default function EmiCalculator() {
  const [principal, setPrincipal] = useState(2500000)
  const [rate, setRate] = useState(8.5)
  const [years, setYears] = useState(20)

  const result = useMemo(() => {
    const P = principal
    const r = rate / 12 / 100
    const n = years * 12
    if (P <= 0 || n <= 0) return null
    if (r === 0) {
      const emi = P / n
      return { emi, total: P, interest: 0, n }
    }
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const total = emi * n
    return { emi, total, interest: total - P, n }
  }, [principal, rate, years])

  const fmt = (n: number) =>
    n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">EMI / Mortgage Calculator</h1>
        <p className="text-slate-500 dark:text-slate-400">Calculate loan EMI, total interest and payment — privately in your browser.</p>
      </div>

      <div className="space-y-5 p-6 rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700">
        <div>
          <label className="block text-sm font-medium mb-1">Loan amount (₹)</label>
          <input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Annual interest rate (%)</label>
          <input type="number" step="0.1" value={rate} onChange={e => setRate(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tenure (years)</label>
          <input type="number" value={years} onChange={e => setYears(Number(e.target.value) || 0)} className="w-full p-3 rounded-xl border dark:bg-slate-900 dark:border-slate-600" />
        </div>
      </div>

      {result && (
        <div className="mt-6 grid gap-3">
          <div className="p-5 rounded-2xl bg-indigo-600 text-white text-center">
            <div className="text-sm opacity-90">Monthly EMI</div>
            <div className="text-3xl font-bold mt-1">{fmt(result.emi)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Total interest</div>
              <div className="text-lg font-semibold mt-1">{fmt(result.interest)}</div>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 text-center">
              <div className="text-xs text-slate-500">Total payment</div>
              <div className="text-lg font-semibold mt-1">{fmt(result.total)}</div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500">{result.n} monthly payments</p>
        </div>
      )}
    </div>
  )
}
