/** Themed daily scramble answers. One puzzle per calendar day (cycled). */

export interface ScramblePuzzle {
  word: string
  theme: string
  hint: string
}

export const DAILY_SCRAMBLE_PUZZLES: ScramblePuzzle[] = [
  { word: 'tiger', theme: 'Animals', hint: 'Big striped cat' },
  { word: 'eagle', theme: 'Animals', hint: 'Bird of prey' },
  { word: 'whale', theme: 'Animals', hint: 'Ocean giant' },
  { word: 'zebra', theme: 'Animals', hint: 'Striped horse-like' },
  { word: 'panda', theme: 'Animals', hint: 'Bamboo bear' },
  { word: 'camel', theme: 'Animals', hint: 'Desert hump' },
  { word: 'otter', theme: 'Animals', hint: 'Playful river mammal' },
  { word: 'koala', theme: 'Animals', hint: 'Aussie eucalyptus eater' },
  { word: 'llama', theme: 'Animals', hint: 'Andean pack animal' },
  { word: 'bison', theme: 'Animals', hint: 'American plains beast' },
  { word: 'apple', theme: 'Food', hint: 'Crisp orchard fruit' },
  { word: 'bread', theme: 'Food', hint: 'Loaf staple' },
  { word: 'pasta', theme: 'Food', hint: 'Italian noodles' },
  { word: 'mango', theme: 'Food', hint: 'Tropical stone fruit' },
  { word: 'lemon', theme: 'Food', hint: 'Sour yellow citrus' },
  { word: 'sushi', theme: 'Food', hint: 'Japanese rice rolls' },
  { word: 'tacos', theme: 'Food', hint: 'Folded Mexican dish' },
  { word: 'bagel', theme: 'Food', hint: 'Chewy ring bread' },
  { word: 'honey', theme: 'Food', hint: 'Bee-made sweetener' },
  { word: 'cocoa', theme: 'Food', hint: 'Chocolate bean powder' },
  { word: 'river', theme: 'Nature', hint: 'Flowing freshwater' },
  { word: 'ocean', theme: 'Nature', hint: 'Vast saltwater' },
  { word: 'storm', theme: 'Nature', hint: 'Thunder and wind' },
  { word: 'coral', theme: 'Nature', hint: 'Reef builder' },
  { word: 'petal', theme: 'Nature', hint: 'Flower part' },
  { word: 'mossy', theme: 'Nature', hint: 'Covered in soft green' },
  { word: 'cedar', theme: 'Nature', hint: 'Fragrant evergreen' },
  { word: 'oasis', theme: 'Nature', hint: 'Desert water spot' },
  { word: 'flame', theme: 'Nature', hint: 'Fire tongue' },
  { word: 'frost', theme: 'Nature', hint: 'Icy morning coat' },
  { word: 'chair', theme: 'Home', hint: 'Seat with a back' },
  { word: 'table', theme: 'Home', hint: 'Flat dining surface' },
  { word: 'couch', theme: 'Home', hint: 'Living-room sofa' },
  { word: 'lamp', theme: 'Home', hint: 'Light fixture' },
  { word: 'clock', theme: 'Home', hint: 'Tells the time' },
  { word: 'shelf', theme: 'Home', hint: 'Books rest here' },
  { word: 'pillow', theme: 'Home', hint: 'Soft for sleeping' },
  { word: 'mirror', theme: 'Home', hint: 'Reflective glass' },
  { word: 'curtain', theme: 'Home', hint: 'Window covering' },
  { word: 'kettle', theme: 'Home', hint: 'Boils water' },
  { word: 'train', theme: 'Travel', hint: 'Rail transport' },
  { word: 'plane', theme: 'Travel', hint: 'Flies the skies' },
  { word: 'hotel', theme: 'Travel', hint: 'Overnight stay' },
  { word: 'map', theme: 'Travel', hint: 'Navigation chart' },
  { word: 'passport', theme: 'Travel', hint: 'Border ID book' },
  { word: 'luggage', theme: 'Travel', hint: 'Packed bags' },
  { word: 'ticket', theme: 'Travel', hint: 'Boarding pass cousin' },
  { word: 'cabin', theme: 'Travel', hint: 'Ship or forest stay' },
  { word: 'cruise', theme: 'Travel', hint: 'Ship holiday' },
  { word: 'safari', theme: 'Travel', hint: 'Wildlife trip' },
  { word: 'soccer', theme: 'Sports', hint: 'Goal-net football' },
  { word: 'tennis', theme: 'Sports', hint: 'Racket court game' },
  { word: 'hockey', theme: 'Sports', hint: 'Puck or ball stick game' },
  { word: 'golf', theme: 'Sports', hint: 'Clubs and greens' },
  { word: 'boxing', theme: 'Sports', hint: 'Ring punches' },
  { word: 'skiing', theme: 'Sports', hint: 'Snow slopes' },
  { word: 'surfing', theme: 'Sports', hint: 'Ride the waves' },
  { word: 'rowing', theme: 'Sports', hint: 'Boat oars' },
  { word: 'racing', theme: 'Sports', hint: 'Speed contest' },
  { word: 'archery', theme: 'Sports', hint: 'Bow and arrow' },
  { word: 'piano', theme: 'Music', hint: 'Black-and-white keys' },
  { word: 'guitar', theme: 'Music', hint: 'Six-string classic' },
  { word: 'violin', theme: 'Music', hint: 'Bowed string' },
  { word: 'drums', theme: 'Music', hint: 'Percussion kit' },
  { word: 'flute', theme: 'Music', hint: 'Woodwind pipe' },
  { word: 'choir', theme: 'Music', hint: 'Group of singers' },
  { word: 'melody', theme: 'Music', hint: 'Tuneful line' },
  { word: 'rhythm', theme: 'Music', hint: 'Beat pattern' },
  { word: 'opera', theme: 'Music', hint: 'Sung drama' },
  { word: 'jazz', theme: 'Music', hint: 'Improvised genre' },
  { word: 'comet', theme: 'Space', hint: 'Icy sky visitor' },
  { word: 'orbit', theme: 'Space', hint: 'Path around a planet' },
  { word: 'lunar', theme: 'Space', hint: 'Of the moon' },
  { word: 'solar', theme: 'Space', hint: 'Of the sun' },
  { word: 'nebula', theme: 'Space', hint: 'Cosmic cloud' },
  { word: 'rocket', theme: 'Space', hint: 'Launch vehicle' },
  { word: 'planet', theme: 'Space', hint: 'World in orbit' },
  { word: 'galaxy', theme: 'Space', hint: 'Star island' },
  { word: 'meteor', theme: 'Space', hint: 'Shooting star rock' },
  { word: 'cosmos', theme: 'Space', hint: 'The universe' },
  { word: 'cloud', theme: 'Weather', hint: 'Sky fluff' },
  { word: 'rainy', theme: 'Weather', hint: 'Wet day vibe' },
  { word: 'windy', theme: 'Weather', hint: 'Breezy day' },
  { word: 'sunny', theme: 'Weather', hint: 'Bright skies' },
  { word: 'humid', theme: 'Weather', hint: 'Sticky air' },
  { word: 'blizzard', theme: 'Weather', hint: 'Heavy snowstorm' },
  { word: 'thunder', theme: 'Weather', hint: 'Storm boom' },
  { word: 'drizzle', theme: 'Weather', hint: 'Light rain' },
  { word: 'breeze', theme: 'Weather', hint: 'Gentle wind' },
  { word: 'foggy', theme: 'Weather', hint: 'Low visibility mist' },
  { word: 'pencil', theme: 'School', hint: 'Graphite writer' },
  { word: 'eraser', theme: 'School', hint: 'Rub-out tool' },
  { word: 'ruler', theme: 'School', hint: 'Straight edge' },
  { word: 'globe', theme: 'School', hint: 'Classroom Earth' },
  { word: 'essay', theme: 'School', hint: 'Written composition' },
  { word: 'quiz', theme: 'School', hint: 'Short test' },
  { word: 'lesson', theme: 'School', hint: 'Class period' },
  { word: 'library', theme: 'School', hint: 'Book building' },
  { word: 'teacher', theme: 'School', hint: 'Classroom guide' },
  { word: 'student', theme: 'School', hint: 'Learner' },
]

export function getPuzzleForDay(dayNumber: number): ScramblePuzzle {
  const list = DAILY_SCRAMBLE_PUZZLES
  const idx = ((dayNumber % list.length) + list.length) % list.length
  return list[idx]
}

/** Deterministic letter scramble so everyone sees the same puzzle layout today. */
export function scrambleWord(word: string, dayNumber: number): string[] {
  const letters = word.toLowerCase().split('')
  let seed = (dayNumber * 2654435761) >>> 0
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x100000000
  }
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  if (letters.join('') === word.toLowerCase()) {
    ;[letters[0], letters[letters.length - 1]] = [letters[letters.length - 1], letters[0]]
  }
  return letters
}
