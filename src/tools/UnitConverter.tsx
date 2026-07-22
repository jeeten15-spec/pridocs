import { useState } from 'react'

const categories = {
  Length: {
    units: ['Meter', 'Kilometer', 'Centimeter', 'Millimeter', 'Mile', 'Yard', 'Foot', 'Inch'],
    toBase: {
      Meter: 1,
      Kilometer: 1000,
      Centimeter: 0.01,
      Millimeter: 0.001,
      Mile: 1609.344,
      Yard: 0.9144,
      Foot: 0.3048,
      Inch: 0.0254,
    }
  },
  Weight: {
    units: ['Kilogram', 'Gram', 'Milligram', 'Pound', 'Ounce', 'Ton'],
    toBase: {
      Kilogram: 1,
      Gram: 0.001,
      Milligram: 0.000001,
      Pound: 0.453592,
      Ounce: 0.0283495,
      Ton: 1000,
    }
  },
  Temperature: {
    units: ['Celsius', 'Fahrenheit', 'Kelvin'],
    toBase: null // special handling
  },
  Digital: {
    units: ['Byte', 'Kilobyte', 'Megabyte', 'Gigabyte', 'Terabyte'],
    toBase: {
      Byte: 1,
      Kilobyte: 1024,
      Megabyte: 1024 ** 2,
      Gigabyte: 1024 ** 3,
      Terabyte: 1024 ** 4,
    }
  }
}

export default function UnitConverter() {
  const [category, setCategory] = useState<keyof typeof categories>('Length')
  const [fromUnit, setFromUnit] = useState('Meter')
  const [toUnit, setToUnit] = useState('Kilometer')
  const [value, setValue] = useState('1')
  const [result, setResult] = useState('')

  const convert = () => {
    const num = parseFloat(value)
    if (isNaN(num)) {
      setResult('')
      return
    }

    if (category === 'Temperature') {
      let celsius = num
      if (fromUnit === 'Fahrenheit') celsius = (num - 32) * 5 / 9
      if (fromUnit === 'Kelvin') celsius = num - 273.15

      let out = celsius
      if (toUnit === 'Fahrenheit') out = celsius * 9 / 5 + 32
      if (toUnit === 'Kelvin') out = celsius + 273.15
      setResult(out.toFixed(4))
      return
    }

    const cat = categories[category]
    const base = num * (cat.toBase as any)[fromUnit]
    const converted = base / (cat.toBase as any)[toUnit]
    setResult(converted.toFixed(6).replace(/\.?0+$/, ''))
  }

  const handleCategoryChange = (cat: keyof typeof categories) => {
    setCategory(cat)
    setFromUnit(categories[cat].units[0])
    setToUnit(categories[cat].units[1] || categories[cat].units[0])
    setResult('')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 mb-3">Unit Converter</h1>
        <p className="text-slate-500">Convert length, weight, temperature and digital storage units instantly.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={category}
            onChange={e => handleCategoryChange(e.target.value as any)}
            className="w-full p-3 rounded-xl border"
          >
            {Object.keys(categories).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Value</label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full p-3 rounded-xl border"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <select value={fromUnit} onChange={e => setFromUnit(e.target.value)} className="w-full p-3 rounded-xl border">
              {categories[category].units.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <select value={toUnit} onChange={e => setToUnit(e.target.value)} className="w-full p-3 rounded-xl border">
              {categories[category].units.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={convert}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium"
        >
          Convert
        </button>

        {result && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-sm text-emerald-700 mb-1">Result</div>
            <div className="text-2xl font-semibold text-emerald-900">{result} {toUnit}</div>
          </div>
        )}
      </div>
    </div>
  )
}
