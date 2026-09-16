export const AUDIO_OUTPUTS = [
  { id: 'mp3', label: 'MP3', mime: 'audio/mpeg', ext: '.mp3', args: ['-c:a', 'libmp3lame', '-b:a', '192k'] },
  { id: 'wav', label: 'WAV', mime: 'audio/wav', ext: '.wav', args: ['-c:a', 'pcm_s16le'] },
  { id: 'm4a', label: 'AAC (M4A)', mime: 'audio/mp4', ext: '.m4a', args: ['-c:a', 'aac', '-b:a', '192k'] },
] as const

export type AudioOutId = (typeof AUDIO_OUTPUTS)[number]['id']

export const MAX_AUDIO_BYTES = 100 * 1024 * 1024
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024

export function extOf(name: string) {
  const m = name.match(/\.[^.]+$/)
  return m ? m[0].toLowerCase() : ''
}

export function baseName(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'output'
}

export function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const el = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      const d = el.duration
      URL.revokeObjectURL(url)
      if (!Number.isFinite(d) || d <= 0) reject(new Error('Could not read duration'))
      else resolve(d)
    }
    el.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load file metadata'))
    }
    el.src = url
  })
}

export async function buildWaveformPeaks(file: File, bars = 120): Promise<number[]> {
  const ctx = new AudioContext()
  try {
    const buf = await file.arrayBuffer()
    const audio = await ctx.decodeAudioData(buf.slice(0))
    const ch = audio.getChannelData(0)
    const block = Math.max(1, Math.floor(ch.length / bars))
    const peaks: number[] = []
    for (let i = 0; i < bars; i++) {
      let max = 0
      const start = i * block
      const end = Math.min(ch.length, start + block)
      for (let j = start; j < end; j++) {
        const v = Math.abs(ch[j])
        if (v > max) max = v
      }
      peaks.push(max)
    }
    return peaks
  } finally {
    await ctx.close()
  }
}

export function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.floor((sec % 1) * 10)
  return ms > 0 && m < 10 ? `${m}:${String(s).padStart(2, '0')}.${ms}` : `${m}:${String(s).padStart(2, '0')}`
}

export function chainAtempo(speed: number): string {
  const parts: string[] = []
  let s = speed
  while (s > 2.0) {
    parts.push('atempo=2.0')
    s /= 2.0
  }
  while (s < 0.5) {
    parts.push('atempo=0.5')
    s /= 0.5
  }
  parts.push(`atempo=${s.toFixed(4)}`)
  return parts.join(',')
}
