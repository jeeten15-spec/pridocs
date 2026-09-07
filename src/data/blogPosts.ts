export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  dateLabel: string
  category: string
  keywords: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'heic-to-jpg-free-no-upload-private',
    title: 'Convert HEIC to JPG Free Without Uploading — Private iPhone Photo Converter (2026)',
    description:
      'Convert iPhone HEIC photos to JPG in your browser — free, no upload, no watermark. Plus related private tools for compress, EXIF strip, and JPG to PDF.',
    date: '2026-09-06',
    dateLabel: 'September 6, 2026',
    category: 'Image Tools',
    keywords: [
      'heic to jpg',
      'heic to jpg converter',
      'heic to jpg free',
      'convert heic to jpg online',
      'heic to jpg no upload',
      'iphone heic to jpg',
      'private heic converter',
      'heic to png',
    ],
  },
  {
    slug: 'daily-word-scramble-themed-puzzle',
    title: 'Daily Scramble: Free Themed Word Scramble Game (No Ads)',
    description:
      'Play Pridocs Daily Scramble — a free themed word scramble every day. Unscramble letters, keep your streak, or use the full word unscrambler.',
    date: '2026-08-22',
    dateLabel: 'August 22, 2026',
    category: 'Word Games & Vocabulary',
    keywords: [
      'word scramble',
      'word scrambler',
      'unscramble words',
      'word unscrambler',
      'word scramble solver',
      'daily word scramble',
      'unscramble letters',
    ],
  },
  {
    slug: 'free-word-tools-unscrambler-crossword-daily-puzzle',
    title: 'Free Word Tools Online: Unscrambler, Crossword Solver, Rhymes & Daily Word Game',
    description:
      'Use Pridocs word unscrambler, anagram finder, rhyme finder, crossword solver, Word Daily, and Daily Scramble — free, private, no ads.',
    date: '2026-08-11',
    dateLabel: 'August 11, 2026',
    category: 'Word Games & Vocabulary',
    keywords: [
      'word unscrambler',
      'unscramble words',
      'crossword solver',
      'word scramble',
      'daily word game',
      'scrabble word finder',
      'word solver',
    ],
  },
  {
    slug: 'free-ai-background-remover-no-upload',
    title: 'Free AI Background Remover — No Upload, No Watermark',
    description:
      'Remove image backgrounds privately in your browser with Pridocs. No uploads, no watermark, no account.',
    date: '2026-07-30',
    dateLabel: 'July 30, 2026',
    category: 'Image Tools',
    keywords: ['ai background remover', 'remove background', 'transparent png', 'no watermark'],
  },
  {
    slug: 'compress-images-online-without-uploading',
    title: 'Compress Images Online Without Uploading — Private, Free, and Ad-Free',
    description:
      'Compress and resize JPG/PNG images entirely in your browser. Private image compression with no signup.',
    date: '2026-07-26',
    dateLabel: 'July 26, 2026',
    category: 'Image Tools',
    keywords: ['compress images', 'reduce image size', 'image compressor', 'compress jpg'],
  },
  {
    slug: 'stop-uploading-sensitive-files-to-online-converters',
    title: 'Why You Should Stop Uploading Your Sensitive Files to Online Converters',
    description:
      'Learn why browser-based converters like Pridocs keep your PDFs and photos private — files never leave your device.',
    date: '2026-07-01',
    dateLabel: 'July 1, 2026',
    category: 'Privacy & Security',
    keywords: ['private file converter', 'no upload converter', 'secure online tools'],
  },
]

export function getBlogPost(slug: string | undefined) {
  if (!slug) return undefined
  return blogPosts.find((p) => p.slug === slug)
}
