/**
 * In-browser song analysis via Essentia.js (WASM) + TensorFlow.js MusiCNN models.
 * Audio never leaves the device; models/engines download on first use and are cached by the browser.
 */

export const MAX_SONG_BYTES = 80 * 1024 * 1024 // ~80 MB — same ballpark as other media tools
export const ANALYSIS_MAX_SECONDS = 120

export const GENRE_LABELS = [
  'blues',
  'classical',
  'country',
  'disco',
  'hiphop',
  'jazz',
  'metal',
  'pop',
  'reggae',
  'rock',
] as const

export type GenreLabel = (typeof GENRE_LABELS)[number]

export interface SongAnalysisResult {
  fileName: string
  fileSize: number
  durationSec: number
  analyzedSec: number
  sampleRate: number
  bpm: number
  key: string
  scale: string
  keyStrength: number
  loudnessLufs: number | null
  energy: number
  danceability: number
  acousticness: number | null
  moods: { label: string; score: number }[]
  genres: { label: string; score: number }[]
  engines: string[]
}

type ProgressFn = (label: string, pct?: number) => void

declare global {
  interface Window {
    EssentiaWASM?: (() => Promise<any>) & { ready?: Promise<any> }
  }
}

let wasmModule: any = null
let essentiaInstance: any = null
let tfModule: typeof import('@tensorflow/tfjs') | null = null
let modelApi: any = null
const loadedModels = new Map<string, any>()

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-essentia-src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.dataset.essentiaSrc = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

async function getWasmModule(onProgress?: ProgressFn) {
  if (wasmModule) return wasmModule
  onProgress?.('Loading Essentia audio engine…', 5)
  await loadScript('/essentia/essentia-wasm.web.js')
  const factory = window.EssentiaWASM
  if (!factory) throw new Error('Essentia WASM failed to initialize')
  wasmModule = typeof factory === 'function' ? await factory() : await (factory as any).ready
  return wasmModule
}

async function getEssentia(onProgress?: ProgressFn) {
  if (essentiaInstance) return essentiaInstance
  const [wasm, coreMod] = await Promise.all([
    getWasmModule(onProgress),
    import('essentia.js/dist/essentia.js-core.es.js'),
  ])
  const Essentia = coreMod.default
  essentiaInstance = new Essentia(wasm)
  return essentiaInstance
}

async function getTfAndModels(onProgress?: ProgressFn) {
  if (!tfModule) {
    onProgress?.('Loading TensorFlow.js…', 40)
    tfModule = await import('@tensorflow/tfjs')
  }
  if (!modelApi) {
    modelApi = await import('essentia.js/dist/essentia.js-model.es.js')
  }
  return { tf: tfModule, modelApi }
}

async function getMusiCNN(modelKey: string, modelUrl: string, onProgress?: ProgressFn) {
  const cached = loadedModels.get(modelKey)
  if (cached) return cached
  const { tf, modelApi } = await getTfAndModels(onProgress)
  onProgress?.(`Downloading AI model (${modelKey})…`, 50)
  const model = new modelApi.TensorflowMusiCNN(tf, modelUrl)
  await model.initialize()
  loadedModels.set(modelKey, model)
  return model
}

function monoFromBuffer(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)
  const out = new Float32Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) out[i] = (left[i] + right[i]) * 0.5
  return out
}

function sliceSeconds(signal: Float32Array, sampleRate: number, maxSec: number): Float32Array {
  const maxSamples = Math.floor(maxSec * sampleRate)
  if (signal.length <= maxSamples) return signal
  return signal.subarray(0, maxSamples)
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

function pct(n: number) {
  return Math.round(clamp01(n) * 100)
}

function averagePatches(predictions: number[][], classIndex: number): number {
  if (!predictions?.length) return 0
  let sum = 0
  for (const row of predictions) sum += row[classIndex] ?? 0
  return sum / predictions.length
}

function averageVector(predictions: number[][]): number[] {
  if (!predictions?.length) return []
  const dims = predictions[0].length
  const out = new Array(dims).fill(0)
  for (const row of predictions) {
    for (let i = 0; i < dims; i++) out[i] += row[i] ?? 0
  }
  for (let i = 0; i < dims; i++) out[i] /= predictions.length
  return out
}

async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const ctx = new AudioContext()
  try {
    const ab = await file.arrayBuffer()
    return await ctx.decodeAudioData(ab.slice(0))
  } finally {
    await ctx.close().catch(() => undefined)
  }
}

const MODEL_BASE = '/models/essentia'

export async function analyzeSong(
  file: File,
  onProgress?: ProgressFn
): Promise<SongAnalysisResult> {
  if (file.size > MAX_SONG_BYTES) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Keep audio under ~80 MB for reliable browser analysis.`
    )
  }

  onProgress?.('Decoding audio…', 10)
  const buffer = await decodeAudioFile(file)
  const durationSec = buffer.duration
  const analyzedSec = Math.min(durationSec, ANALYSIS_MAX_SECONDS)
  const fullMono = monoFromBuffer(buffer)
  const mono = sliceSeconds(fullMono, buffer.sampleRate, ANALYSIS_MAX_SECONDS)

  const essentia = await getEssentia(onProgress)
  const vector = essentia.arrayToVector(mono)
  const engines = ['Essentia.js (WASM)']

  onProgress?.('Estimating tempo & key…', 25)
  let bpm = 0
  try {
    bpm = Number(essentia.PercivalBpmEstimator(vector).bpm) || 0
  } catch {
    bpm = 0
  }

  let key = '—'
  let scale = '—'
  let keyStrength = 0
  try {
    const keyOut = essentia.KeyExtractor(vector)
    key = keyOut.key || '—'
    scale = keyOut.scale || '—'
    keyStrength = Number(keyOut.strength) || 0
  } catch {
    /* keep defaults */
  }

  onProgress?.('Measuring loudness & energy…', 35)
  let loudnessLufs: number | null = null
  try {
    const left = essentia.arrayToVector(mono)
    const right = essentia.arrayToVector(mono)
    const loud = essentia.LoudnessEBUR128(left, right, undefined, buffer.sampleRate)
    loudnessLufs = Number(loud.integratedLoudness)
    left.delete?.()
    right.delete?.()
  } catch {
    try {
      const dyn = essentia.DynamicComplexity(vector)
      // DynamicComplexity loudness is not LUFS; surface as approximate energy proxy only.
      loudnessLufs = null
      void dyn
    } catch {
      loudnessLufs = null
    }
  }

  let energy = 0
  try {
    const rms = Number(essentia.RMS(vector).rms) || 0
    // Map typical music RMS (~0–0.3) into a readable 0–1 score.
    energy = clamp01(rms / 0.25)
  } catch {
    energy = 0
  }

  let danceability = 0
  try {
    const d = Number(essentia.Danceability(vector).danceability) || 0
    danceability = clamp01(d / 3)
  } catch {
    danceability = 0
  }

  // --- TensorFlow.js MusiCNN classifiers (download on first use) ---
  let acousticness: number | null = null
  const moods: { label: string; score: number }[] = []
  let genres: { label: string; score: number }[] = []

  try {
    onProgress?.('Preparing AI features (first use may download models)…', 45)
    const wasm = await getWasmModule(onProgress)
    const { modelApi } = await getTfAndModels(onProgress)
    const extractor = new modelApi.EssentiaTFInputExtractor(wasm, 'musicnn', false)

    // Downsample whole AudioBuffer via OfflineAudioContext, then trim.
    const downsampledFull: Float32Array = await extractor.downsampleAudioBuffer(buffer)
    const downsampled = sliceSeconds(downsampledFull, 16000, ANALYSIS_MAX_SECONDS)
    const features = extractor.computeFrameWise(downsampled, 256)

    const genreModel = await getMusiCNN(
      'genre',
      `${MODEL_BASE}/genre_tzanetakis/model.json`,
      onProgress
    )
    onProgress?.('Classifying genre…', 65)
    const genrePred = await genreModel.predict(features, true)
    const genreAvg = averageVector(genrePred as number[][])
    const genreSum = genreAvg.reduce((a, b) => a + Math.max(0, b), 0) || 1
    const genreProbs = genreAvg.map((v) => clamp01(Math.max(0, v) / genreSum))
    genres = GENRE_LABELS.map((label, i) => ({ label, score: pct(genreProbs[i] ?? 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    const danceModel = await getMusiCNN(
      'danceability',
      `${MODEL_BASE}/danceability/model.json`,
      onProgress
    )
    onProgress?.('Estimating danceability…', 75)
    const dancePred = await danceModel.predict(features, true)
    danceability = clamp01(averagePatches(dancePred as number[][], 0))

    const acousticModel = await getMusiCNN(
      'acoustic',
      `${MODEL_BASE}/mood_acoustic/model.json`,
      onProgress
    )
    onProgress?.('Estimating acousticness…', 80)
    const acousticPred = await acousticModel.predict(features, true)
    acousticness = pct(averagePatches(acousticPred as number[][], 0))

    const moodDefs = [
      { key: 'happy', label: 'Happy', url: `${MODEL_BASE}/mood_happy/model.json` },
      { key: 'sad', label: 'Sad', url: `${MODEL_BASE}/mood_sad/model.json` },
      { key: 'relaxed', label: 'Relaxed', url: `${MODEL_BASE}/mood_relaxed/model.json` },
      { key: 'aggressive', label: 'Aggressive', url: `${MODEL_BASE}/mood_aggressive/model.json` },
    ] as const

    onProgress?.('Estimating mood…', 88)
    for (const m of moodDefs) {
      const model = await getMusiCNN(m.key, m.url, onProgress)
      const pred = await model.predict(features, true)
      moods.push({ label: m.label, score: pct(averagePatches(pred as number[][], 0)) })
    }
    moods.sort((a, b) => b.score - a.score)

    engines.push('TensorFlow.js MusiCNN models')
    extractor.delete?.()
  } catch (err) {
    console.warn('AI classifiers unavailable; classical Essentia metrics still shown.', err)
  }

  vector.delete?.()
  onProgress?.('Done', 100)

  return {
    fileName: file.name,
    fileSize: file.size,
    durationSec,
    analyzedSec,
    sampleRate: buffer.sampleRate,
    bpm: Math.round(bpm * 10) / 10,
    key,
    scale,
    keyStrength: Math.round(keyStrength * 1000) / 1000,
    loudnessLufs: loudnessLufs != null && Number.isFinite(loudnessLufs) ? Math.round(loudnessLufs * 10) / 10 : null,
    energy: pct(energy),
    danceability: pct(danceability),
    acousticness,
    moods,
    genres,
    engines,
  }
}
