import { useState } from 'react'

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#3b82f6')
  const [rgb, setRgb] = useState('59, 130, 246')
  const [hsl, setHsl] = useState('217°, 91%, 60%')

  const updateFromHex = (value: string) => {
    setHex(value)
    const rgbObj = hexToRgb(value)
    if (rgbObj) {
      setRgb(`${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`)
      const hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b)
      setHsl(`${hslObj.h}°, ${hslObj.s}%, ${hslObj.l}%`)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 mb-6 text-center">Color Converter</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">HEX</label>
          <div className="flex gap-3">
            <input 
              type="color" 
              value={hex} 
              onChange={e => updateFromHex(e.target.value)} 
              className="w-14 h-12 rounded-lg border cursor-pointer" 
            />
            <input 
              type="text" 
              value={hex} 
              onChange={e => updateFromHex(e.target.value)} 
              className="flex-1 p-3 rounded-xl border font-mono" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">RGB</label>
          <input type="text" value={rgb} readOnly className="w-full p-3 rounded-xl border bg-slate-50 font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">HSL</label>
          <input type="text" value={hsl} readOnly className="w-full p-3 rounded-xl border bg-slate-50 font-mono" />
        </div>
        
        <div className="h-20 rounded-xl border shadow-inner" style={{ backgroundColor: hex }}></div>
      </div>
    </div>
  )
}
