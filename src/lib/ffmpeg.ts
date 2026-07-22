import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null

export async function getFFmpeg(onStatus?: (s: string) => void): Promise<FFmpeg> {
  if (instance?.loaded) return instance
  if (loading) return loading

  loading = (async () => {
    const ffmpeg = new FFmpeg()
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    onStatus?.('Downloading FFmpeg core…')
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
    onStatus?.('Downloading FFmpeg WASM…')
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    onStatus?.('Initializing…')
    await ffmpeg.load({ coreURL, wasmURL })
    instance = ffmpeg
    loading = null
    return ffmpeg
  })()

  return loading
}
