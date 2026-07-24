import { WORD_LIST } from '../data/wordList'

const CACHE_KEY = 'pridocs_dictionary_v1'
const CACHE_META = 'pridocs_dictionary_meta_v1'

let cached: string[] | null = null
let loading: Promise<string[]> | null = null

function parseWordList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 2 && /^[a-z]+$/.test(w))
}

/**
 * Load English word list once per browser.
 * 1) memory cache
 * 2) localStorage (after first successful fetch on this device)
 * 3) /dictionary.txt from this site (you deploy it once)
 * 4) built-in common words (~5k) as last resort
 *
 * End users never run curl — they just open the tool; the site serves the file.
 */
export async function loadDictionary(): Promise<string[]> {
  if (cached) return cached
  if (loading) return loading

  loading = (async () => {
    // Try localStorage first (instant on return visits)
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const words = JSON.parse(raw) as string[]
        if (Array.isArray(words) && words.length > 1000) {
          cached = words
          return cached
        }
      }
    } catch {
      // ignore quota / private mode
    }

    // Fetch from same origin (deployed with the site)
    try {
      const res = await fetch('/dictionary.txt', { cache: 'force-cache' })
      if (res.ok) {
        const text = await res.text()
        const words = parseWordList(text)
        if (words.length > 1000) {
          cached = words
          try {
            // Store for next visits (may fail if list is huge / quota exceeded)
            localStorage.setItem(CACHE_KEY, JSON.stringify(words))
            localStorage.setItem(CACHE_META, JSON.stringify({ count: words.length, at: Date.now() }))
          } catch {
            // quota exceeded — still fine for this session
          }
          return cached
        }
      }
    } catch {
      // network / file missing
    }

    cached = WORD_LIST
    return cached
  })()

  return loading
}

export function getDictionarySync(): string[] {
  return cached || WORD_LIST
}
