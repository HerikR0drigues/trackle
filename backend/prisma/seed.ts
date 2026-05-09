/**
 * Seeds the Postgres database. Two-phase, fully idempotent:
 *
 * 1. Bootstrap: ensures Flavor rows exist and inserts curated terms into
 *    SeedTerm. Uses createMany({ skipDuplicates: true }) so adding new
 *    flavors/terms to BOOTSTRAP_FLAVORS and re-running picks up only the diff.
 *
 * 2. Process: fetches SeedTerm rows where status IN (pending, failed) per
 *    flavor and queries iTunes for each — concurrent (p-limit(4)) with
 *    exponential backoff on 429/5xx (handled inside services/itunes.ts).
 *    Results are filtered by:
 *      - flavor.yearRange (era flavors reject anything outside the window)
 *      - per-term expectedArtist (rejects covers / re-recordings by other artists)
 *      - title/album blacklist (rejects "cover", "karaoke", "tribute", etc.)
 *    On success, upserts up to maxPerTerm tracks and marks the term success.
 *    On error, marks failed and stores the error message.
 *
 * Re-running only retries pending+failed terms. To grow the pool, add more
 * entries to BOOTSTRAP_FLAVORS[].terms and re-run.
 *
 * CLI flags:
 *   --flavor=<id>             process only this flavor (bootstrap still runs for all)
 *   --bootstrap-only          bootstrap then exit (no iTunes calls)
 *   --retry-success           also re-process terms with status=success
 *   --clear-flavor=<csv>      delete Track + SeedTerm + DailyPuzzleCache rows for
 *                             these flavor ids before bootstrap. Useful when the
 *                             pool was poisoned by relevance noise and you want
 *                             a clean re-seed.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import pLimit from 'p-limit'
import { searchTracks, type NormalizedTrack } from '../src/services/itunes'
import { seedTermRepository } from '../src/repositories/seedTermRepository'

const prisma = new PrismaClient()
const CONCURRENCY = 4
const SEARCH_LIMIT = 25
const DEFAULT_MAX_TRACKS_PER_TERM = 5

type RawTerm = string | { query: string; artist?: string }

interface FlavorBootstrap {
  id: string
  name: string
  description: string
  /** When set, tracks released outside this inclusive window are rejected. */
  yearRange?: [number, number]
  /** How many tracks to keep per term. Defaults to 5; era flavors use 2. */
  maxPerTerm?: number
  terms: RawTerm[]
}

const BOOTSTRAP_FLAVORS: FlavorBootstrap[] = [
  {
    id: 'rock',
    name: 'Rock',
    description: "Rockin' and rollin'",
    terms: [
      'Queen Bohemian Rhapsody',
      "Queen Don't Stop Me Now",
      'Led Zeppelin Stairway to Heaven',
      'Led Zeppelin Whole Lotta Love',
      'AC/DC Back in Black',
      'AC/DC Highway to Hell',
      'Aerosmith Dream On',
      'Aerosmith Walk This Way',
      'Bon Jovi Livin on a Prayer',
      'Bon Jovi Wanted Dead or Alive',
      'The Rolling Stones Satisfaction',
      'The Rolling Stones Paint It Black',
      'ZZ Top La Grange',
      'ZZ Top Sharp Dressed Man',
      'Guns N Roses Sweet Child O Mine',
      'Guns N Roses November Rain',
      'Nirvana Smells Like Teen Spirit',
      'Pearl Jam Alive',
      'Foo Fighters Everlong',
      'Metallica Enter Sandman',
      'Black Sabbath Iron Man',
      'Deep Purple Smoke on the Water',
      "The Who Baba O'Riley",
      'The Doors Light My Fire',
      'Pink Floyd Comfortably Numb',
      'Pink Floyd Wish You Were Here',
      'Eagles Hotel California',
      'Lynyrd Skynyrd Sweet Home Alabama',
      'Boston More Than a Feeling',
      'Twisted Sister I Wanna Rock',
      'Steel Panther Eyes of a Panther',
      'The Beatles Come Together',
      'The Beatles Hey Jude',
      'The Beatles Let It Be',
      'David Bowie Heroes',
      'David Bowie Space Oddity',
      'Fleetwood Mac Dreams',
      'Fleetwood Mac Go Your Own Way',
      'U2 With or Without You',
      'U2 One',
      'Foo Fighters The Pretender',
      'Foo Fighters Best of You',
      'Green Day Basket Case',
      'Green Day American Idiot',
      'Linkin Park In the End',
      'Linkin Park Numb',
      'Red Hot Chili Peppers Californication',
      'Red Hot Chili Peppers Under the Bridge',
      'Soundgarden Black Hole Sun',
      'Alice in Chains Man in the Box',
      'Stone Temple Pilots Plush',
      'Rage Against the Machine Killing in the Name',
      'System of a Down Chop Suey',
      'Muse Uprising',
      'Muse Supermassive Black Hole',
      'Arctic Monkeys Do I Wanna Know',
      'The Killers Mr Brightside',
      'Kings of Leon Sex on Fire',
      'Coldplay Yellow',
      'Coldplay Fix You',
      'Radiohead Creep',
      'Oasis Wonderwall',
      'The Clash London Calling',
      'Ramones Blitzkrieg Bop',
    ],
  },
  {
    id: 'pop',
    name: 'Pop',
    description: 'Catchy hits that stick',
    terms: [
      'Michael Jackson Billie Jean',
      'Michael Jackson Thriller',
      'Michael Jackson Beat It',
      'Madonna Like a Prayer',
      'Madonna Material Girl',
      'Whitney Houston I Wanna Dance with Somebody',
      'Whitney Houston I Will Always Love You',
      'Cyndi Lauper Girls Just Want to Have Fun',
      'George Michael Careless Whisper',
      'A-ha Take On Me',
      'Spice Girls Wannabe',
      'Backstreet Boys I Want It That Way',
      'Britney Spears Baby One More Time',
      'Britney Spears Toxic',
      'Christina Aguilera Genie in a Bottle',
      'Mariah Carey Always Be My Baby',
      'Celine Dion My Heart Will Go On',
      'Beyonce Crazy in Love',
      'Beyonce Halo',
      'Rihanna Umbrella',
      'Rihanna Diamonds',
      'Lady Gaga Bad Romance',
      'Lady Gaga Poker Face',
      'Katy Perry Roar',
      'Katy Perry Firework',
      'Adele Rolling in the Deep',
      'Adele Hello',
      'Bruno Mars Uptown Funk',
      'Taylor Swift Shake It Off',
      'Taylor Swift Blank Space',
      'Justin Bieber Sorry',
      'Ed Sheeran Shape of You',
      'Ariana Grande 7 Rings',
      'The Weeknd Blinding Lights',
      'Dua Lipa Levitating',
      'Billie Eilish Bad Guy',
      'Olivia Rodrigo Drivers License',
      'Harry Styles As It Was',
      'Doja Cat Say So',
      'Miley Cyrus Flowers',
      'Maroon 5 Sugar',
      'Coldplay Viva la Vida',
      'Shakira Hips Dont Lie',
      'Sia Cheap Thrills',
      'Black Eyed Peas I Gotta Feeling',
      'OneRepublic Counting Stars',
      'Imagine Dragons Believer',
    ],
  },
  {
    id: 'hiphop',
    name: 'Hip Hop',
    description: 'Drop the beat',
    terms: [
      { query: 'Tupac California Love', artist: '2Pac' },
      { query: 'Tupac Changes', artist: '2Pac' },
      { query: 'Notorious BIG Juicy', artist: 'The Notorious B.I.G.' },
      { query: 'Notorious BIG Hypnotize', artist: 'The Notorious B.I.G.' },
      { query: 'Eminem Lose Yourself', artist: 'Eminem' },
      { query: 'Eminem Stan', artist: 'Eminem' },
      { query: 'Eminem My Name Is', artist: 'Eminem' },
      { query: 'Jay-Z Empire State of Mind', artist: 'JAY-Z' },
      { query: 'Jay-Z 99 Problems', artist: 'JAY-Z' },
      { query: 'Nas NY State of Mind', artist: 'Nas' },
      { query: 'Kendrick Lamar HUMBLE', artist: 'Kendrick Lamar' },
      { query: 'Kendrick Lamar Alright', artist: 'Kendrick Lamar' },
      { query: 'Drake Hotline Bling', artist: 'Drake' },
      { query: "Drake God's Plan", artist: 'Drake' },
      { query: 'Kanye West Stronger', artist: 'Kanye West' },
      { query: 'Kanye West Heartless', artist: 'Kanye West' },
      { query: 'Snoop Dogg Gin and Juice', artist: 'Snoop Dogg' },
      { query: 'Dr Dre Still Dre', artist: 'Dr. Dre' },
      { query: 'Outkast Hey Ya', artist: 'Outkast' },
      { query: 'Outkast Ms Jackson', artist: 'Outkast' },
      { query: 'Wu-Tang Clan CREAM', artist: 'Wu-Tang Clan' },
      { query: 'Run DMC Walk This Way', artist: 'RUN-DMC' },
      { query: 'NWA Straight Outta Compton', artist: 'N.W.A' },
      { query: '50 Cent In Da Club', artist: '50 Cent' },
      { query: 'Lil Wayne A Milli', artist: 'Lil Wayne' },
      { query: 'J Cole No Role Modelz', artist: 'J. Cole' },
      { query: 'Travis Scott SICKO MODE', artist: 'Travis Scott' },
      { query: 'Future Mask Off', artist: 'Future' },
      { query: 'Missy Elliott Get Ur Freak On', artist: 'Missy Elliott' },
      { query: 'Lauryn Hill Doo Wop', artist: 'Lauryn Hill' },
    ],
  },
  {
    id: 'hitparade',
    name: 'Hit Parade',
    description: "What's hot this week",
    yearRange: [2018, 2030],
    maxPerTerm: 2,
    terms: [
      { query: 'Taylor Swift Anti-Hero', artist: 'Taylor Swift' },
      { query: 'Taylor Swift Cruel Summer', artist: 'Taylor Swift' },
      { query: 'Bad Bunny Tití Me Preguntó', artist: 'Bad Bunny' },
      { query: 'Olivia Rodrigo Vampire', artist: 'Olivia Rodrigo' },
      { query: 'Harry Styles As It Was', artist: 'Harry Styles' },
      { query: 'Dua Lipa Levitating', artist: 'Dua Lipa' },
      { query: 'The Weeknd Blinding Lights', artist: 'The Weeknd' },
      { query: 'Sabrina Carpenter Espresso', artist: 'Sabrina Carpenter' },
      { query: 'Billie Eilish Birds of a Feather', artist: 'Billie Eilish' },
      { query: 'Doja Cat Paint The Town Red', artist: 'Doja Cat' },
      { query: 'SZA Kill Bill', artist: 'SZA' },
      { query: 'Morgan Wallen Last Night', artist: 'Morgan Wallen' },
      { query: 'Post Malone Circles', artist: 'Post Malone' },
      { query: 'Justin Bieber Peaches', artist: 'Justin Bieber' },
      { query: 'Lil Nas X Old Town Road', artist: 'Lil Nas X' },
      { query: 'Beyonce Texas Hold Em', artist: 'Beyoncé' },
      { query: 'Charli XCX 360', artist: 'Charli xcx' },
      { query: 'Tyla Water', artist: 'Tyla' },
      { query: 'Miley Cyrus Flowers', artist: 'Miley Cyrus' },
      { query: 'Bruno Mars 24K Magic', artist: 'Bruno Mars' },
      { query: 'Taylor Swift Shake It Off', artist: 'Taylor Swift' },
      { query: 'Drake One Dance', artist: 'Drake' },
      { query: 'Ed Sheeran Shape of You', artist: 'Ed Sheeran' },
      { query: 'Ariana Grande 7 Rings', artist: 'Ariana Grande' },
      { query: 'Justin Bieber Stay', artist: 'Justin Bieber' },
    ],
  },
  {
    id: '90s',
    name: 'The 90s',
    description: 'Come as you are',
    yearRange: [1990, 1999],
    maxPerTerm: 2,
    terms: [
      { query: 'Nirvana Smells Like Teen Spirit', artist: 'Nirvana' },
      { query: 'Backstreet Boys I Want It That Way', artist: 'Backstreet Boys' },
      { query: 'Spice Girls Wannabe', artist: 'Spice Girls' },
      { query: 'Britney Spears Baby One More Time', artist: 'Britney Spears' },
      { query: 'Whitney Houston I Will Always Love You', artist: 'Whitney Houston' },
      { query: 'Mariah Carey Always Be My Baby', artist: 'Mariah Carey' },
      { query: 'Celine Dion My Heart Will Go On', artist: 'Céline Dion' },
      { query: 'Madonna Vogue', artist: 'Madonna' },
      { query: 'MC Hammer U Cant Touch This', artist: 'MC Hammer' },
      { query: 'Vanilla Ice Ice Ice Baby', artist: 'Vanilla Ice' },
      { query: 'TLC Waterfalls', artist: 'TLC' },
      { query: "Destiny's Child Bills Bills Bills", artist: "Destiny's Child" },
      { query: 'Aqua Barbie Girl', artist: 'Aqua' },
      { query: 'Eiffel 65 Blue', artist: 'Eiffel 65' },
      { query: 'Cher Believe', artist: 'Cher' },
      { query: "Coolio Gangsta's Paradise", artist: 'Coolio' },
      { query: 'Sir Mix-a-Lot Baby Got Back', artist: 'Sir Mix-A-Lot' },
      { query: 'Alanis Morissette Ironic', artist: 'Alanis Morissette' },
      { query: 'Smashing Pumpkins 1979', artist: 'The Smashing Pumpkins' },
      { query: 'Pearl Jam Alive', artist: 'Pearl Jam' },
      { query: 'Soundgarden Black Hole Sun', artist: 'Soundgarden' },
      { query: 'Red Hot Chili Peppers Under the Bridge', artist: 'Red Hot Chili Peppers' },
      { query: 'Sheryl Crow All I Wanna Do', artist: 'Sheryl Crow' },
      { query: 'REM Losing My Religion', artist: 'R.E.M.' },
      { query: 'Oasis Wonderwall', artist: 'Oasis' },
      { query: 'Radiohead Creep', artist: 'Radiohead' },
      { query: 'Bryan Adams Everything I Do', artist: 'Bryan Adams' },
      { query: 'Spin Doctors Two Princes', artist: 'Spin Doctors' },
    ],
  },
  {
    id: '2000s',
    name: 'The 2000s',
    description: 'I gotta feeling',
    yearRange: [2000, 2009],
    maxPerTerm: 2,
    terms: [
      { query: 'Beyonce Crazy in Love', artist: 'Beyoncé' },
      { query: 'Rihanna Umbrella', artist: 'Rihanna' },
      { query: 'Lady Gaga Just Dance', artist: 'Lady Gaga' },
      { query: 'Lady Gaga Bad Romance', artist: 'Lady Gaga' },
      { query: 'Kanye West Stronger', artist: 'Kanye West' },
      { query: 'Eminem Lose Yourself', artist: 'Eminem' },
      { query: 'Coldplay Yellow', artist: 'Coldplay' },
      { query: 'Coldplay Viva la Vida', artist: 'Coldplay' },
      { query: 'Linkin Park In the End', artist: 'Linkin Park' },
      { query: 'Linkin Park Numb', artist: 'Linkin Park' },
      { query: 'The Killers Mr Brightside', artist: 'The Killers' },
      { query: 'Outkast Hey Ya', artist: 'Outkast' },
      { query: 'Black Eyed Peas I Gotta Feeling', artist: 'The Black Eyed Peas' },
      { query: 'Justin Timberlake Cry Me a River', artist: 'Justin Timberlake' },
      { query: 'Britney Spears Toxic', artist: 'Britney Spears' },
      { query: 'Avril Lavigne Complicated', artist: 'Avril Lavigne' },
      { query: 'Christina Aguilera Beautiful', artist: 'Christina Aguilera' },
      { query: 'Pink So What', artist: 'P!nk' },
      { query: 'Maroon 5 This Love', artist: 'Maroon 5' },
      { query: 'Snow Patrol Chasing Cars', artist: 'Snow Patrol' },
      { query: 'Green Day American Idiot', artist: 'Green Day' },
      { query: "Fall Out Boy Sugar We're Going Down", artist: 'Fall Out Boy' },
      { query: 'MIA Paper Planes', artist: 'M.I.A.' },
      { query: 'Lil Wayne Lollipop', artist: 'Lil Wayne' },
      { query: 'Usher Yeah', artist: 'Usher' },
      { query: 'Daft Punk One More Time', artist: 'Daft Punk' },
      { query: 'Gnarls Barkley Crazy', artist: 'Gnarls Barkley' },
      { query: 'MGMT Kids', artist: 'MGMT' },
      { query: 'OneRepublic Apologize', artist: 'OneRepublic' },
      { query: 'Kelly Clarkson Since U Been Gone', artist: 'Kelly Clarkson' },
    ],
  },
]

// ===== helpers =====================================================

const queryOf = (t: RawTerm): string => (typeof t === 'string' ? t : t.query)
const artistOf = (t: RawTerm): string | undefined => (typeof t === 'string' ? undefined : t.artist)

/** Per-flavor and per-term filtering hints, populated from BOOTSTRAP_FLAVORS. */
const flavorYearRange = new Map<string, [number, number]>()
const flavorMaxPerTerm = new Map<string, number>()
const termArtistHint = new Map<string, string>() // key: `${flavorId}::${query}`

for (const f of BOOTSTRAP_FLAVORS) {
  if (f.yearRange) flavorYearRange.set(f.id, f.yearRange)
  if (typeof f.maxPerTerm === 'number') flavorMaxPerTerm.set(f.id, f.maxPerTerm)
  for (const t of f.terms) {
    const a = artistOf(t)
    if (a) termArtistHint.set(`${f.id}::${queryOf(t)}`, a)
  }
}

const stripDiacritics = (s: string): string =>
  s.normalize('NFD').replaceAll(/[̀-ͯ]/g, '')

const cleanArtistName = (name: string): string =>
  stripDiacritics(name)
    .toLowerCase()
    .replaceAll(/\(.*?\)|\[.*?\]/g, '')
    .replaceAll(/\s+(?:feat\.?|featuring|with|presents|ft\.?)\s+.+$/gi, '')
    .replaceAll(/[,&].+$/g, '')
    .replaceAll(/[^a-z0-9]/g, '')
    .trim()

const matchesArtist = (trackArtist: string, expected: string): boolean =>
  cleanArtistName(trackArtist) === cleanArtistName(expected)

const inYearRange = (year: number | null, range: [number, number]): boolean => {
  if (year === null) return false
  return year >= range[0] && year <= range[1]
}

const BLACKLIST_PATTERNS =
  /\b(cover|covered by|karaoke|tribute|backing track|piano version|orchestra(l)?|instrumental|kids version|sleep|lullaby|brass band|made famous by|originally performed|in the style of|reggae version|8-?bit|acapella)\b/i

const isBlacklistedTitle = (track: NormalizedTrack): boolean =>
  BLACKLIST_PATTERNS.test(track.title) || BLACKLIST_PATTERNS.test(track.album)

const filterCandidates = (
  tracks: NormalizedTrack[],
  flavorId: string,
  query: string,
): NormalizedTrack[] => {
  const expectedArtist = termArtistHint.get(`${flavorId}::${query}`)
  const yearRange = flavorYearRange.get(flavorId)
  const out: NormalizedTrack[] = []
  for (const t of tracks) {
    if (isBlacklistedTitle(t)) continue
    if (expectedArtist && !matchesArtist(t.artist, expectedArtist)) continue
    if (yearRange && !inYearRange(t.year, yearRange)) continue
    out.push(t)
  }
  return out
}

const normalizeForKey = (s: string): string =>
  stripDiacritics(s)
    .toLowerCase()
    .replaceAll(/\(.*?\)|\[.*?\]/g, '')
    .replaceAll(/\s*-\s*(remaster(ed)?|live|radio edit|instrumental|deluxe|mono|stereo|version).*/gi, '')
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const songKeyOf = (artist: string, title: string): string =>
  `${normalizeForKey(artist)}::${normalizeForKey(title)}`

const loadExistingSongKeys = async (): Promise<Set<string>> => {
  const all = await prisma.track.findMany({ select: { artist: true, title: true } })
  return new Set(all.map((t) => songKeyOf(t.artist, t.title)))
}

const upsertTrack = (t: NormalizedTrack, flavorId: string) =>
  prisma.track.upsert({
    where: { itunesId: t.itunesId },
    update: {
      title: t.title,
      artist: t.artist,
      album: t.album,
      year: t.year,
      genre: t.genre,
      artworkUrl: t.artworkUrl,
      previewUrl: t.previewUrl,
      flavorId,
    },
    create: {
      itunesId: t.itunesId,
      title: t.title,
      artist: t.artist,
      album: t.album,
      year: t.year,
      genre: t.genre,
      artworkUrl: t.artworkUrl,
      previewUrl: t.previewUrl,
      flavorId,
    },
  })

const bootstrap = async (): Promise<void> => {
  for (const f of BOOTSTRAP_FLAVORS) {
    await prisma.flavor.upsert({
      where: { id: f.id },
      update: { name: f.name, description: f.description },
      create: { id: f.id, name: f.name, description: f.description },
    })

    const rows = f.terms.map((t) => ({ flavorId: f.id, term: queryOf(t) }))
    const inserted = await seedTermRepository.bulkInsert(rows)
    if (inserted > 0) {
      console.log(`[bootstrap] +${inserted} new terms for ${f.id}`)
    }
  }
}

const clearFlavorData = async (flavorIds: string[]): Promise<void> => {
  for (const id of flavorIds) {
    const cache = await prisma.dailyPuzzleCache.deleteMany({ where: { flavorId: id } })
    const tracks = await prisma.track.deleteMany({ where: { flavorId: id } })
    const terms = await prisma.seedTerm.deleteMany({ where: { flavorId: id } })
    console.log(
      `[clear] flavor "${id}": removed ${tracks.count} tracks, ${terms.count} terms, ${cache.count} cached puzzles`,
    )
  }
}

interface CliArgs {
  flavorId: string | null
  bootstrapOnly: boolean
  retrySuccess: boolean
  clearFlavors: string[]
}

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = { flavorId: null, bootstrapOnly: false, retrySuccess: false, clearFlavors: [] }
  for (const a of argv) {
    if (a === '--bootstrap-only') args.bootstrapOnly = true
    else if (a === '--retry-success') args.retrySuccess = true
    else if (a.startsWith('--flavor=')) args.flavorId = a.slice('--flavor='.length)
    else if (a.startsWith('--clear-flavor=')) {
      args.clearFlavors = a
        .slice('--clear-flavor='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return args
}

const fetchTermsToProcess = async (flavorId: string, retrySuccess: boolean) => {
  if (retrySuccess) {
    return prisma.seedTerm.findMany({
      where: { flavorId },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    })
  }
  return seedTermRepository.findPendingOrFailed(flavorId)
}

const processFlavor = async (
  flavorId: string,
  existingSongKeys: Set<string>,
  limit: ReturnType<typeof pLimit>,
  retrySuccess: boolean,
): Promise<void> => {
  const todo = await fetchTermsToProcess(flavorId, retrySuccess)
  if (todo.length === 0) {
    const counts = await seedTermRepository.countByStatus(flavorId)
    console.log(`[${flavorId}] nothing to process (success=${counts.success ?? 0})`)
    return
  }

  const maxPerTerm = flavorMaxPerTerm.get(flavorId) ?? DEFAULT_MAX_TRACKS_PER_TERM
  const yearRange = flavorYearRange.get(flavorId)
  const filterDesc = yearRange ? ` year=${yearRange[0]}-${yearRange[1]}` : ''
  console.log(
    `[${flavorId}] processing ${todo.length} terms (concurrency=${CONCURRENCY} maxPerTerm=${maxPerTerm}${filterDesc})`,
  )

  await Promise.all(
    todo.map((seedTerm) =>
      limit(async () => {
        try {
          const raw = await searchTracks({ term: seedTerm.term, limit: SEARCH_LIMIT })
          const candidates = filterCandidates(raw, flavorId, seedTerm.term)
          let inserted = 0
          for (const t of candidates) {
            if (inserted >= maxPerTerm) break
            const key = songKeyOf(t.artist, t.title)
            if (existingSongKeys.has(key)) continue
            existingSongKeys.add(key)
            await upsertTrack(t, flavorId)
            inserted += 1
          }
          await seedTermRepository.markSuccess(seedTerm.id, inserted)
          process.stdout.write(inserted === 0 ? '·' : '.')
        } catch (err) {
          const msg = (err as Error).message
          await seedTermRepository.markFailed(seedTerm.id, msg)
          process.stdout.write('x')
        }
      }),
    ),
  )
  process.stdout.write('\n')

  const counts = await seedTermRepository.countByStatus(flavorId)
  const trackTotal = await prisma.track.count({ where: { flavorId } })
  console.log(
    `[${flavorId}] success=${counts.success ?? 0} failed=${counts.failed ?? 0} pending=${counts.pending ?? 0} | tracks in DB: ${trackTotal}`,
  )
}

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2))
  const flagsTxt = [
    args.flavorId ? `flavor=${args.flavorId}` : '',
    args.bootstrapOnly ? 'bootstrap-only' : '',
    args.retrySuccess ? 'retry-success' : '',
    args.clearFlavors.length ? `clear=${args.clearFlavors.join(',')}` : '',
  ]
    .filter(Boolean)
    .join(' ')
  console.log(`[seed] args: ${flagsTxt || '(default)'}`)

  if (args.clearFlavors.length > 0) {
    await clearFlavorData(args.clearFlavors)
  }

  await bootstrap()

  if (args.bootstrapOnly) {
    console.log('[seed] --bootstrap-only — exiting without iTunes calls')
    return
  }

  const existingSongKeys = await loadExistingSongKeys()
  console.log(`[seed] ${existingSongKeys.size} unique song keys already in DB`)

  const allFlavors = await prisma.flavor.findMany({ select: { id: true } })
  const flavorIds = args.flavorId
    ? allFlavors.filter((f) => f.id === args.flavorId).map((f) => f.id)
    : allFlavors.map((f) => f.id)

  if (args.flavorId && flavorIds.length === 0) {
    console.error(`[seed] flavor "${args.flavorId}" not found`)
    process.exit(1)
  }

  const limit = pLimit(CONCURRENCY)
  for (const flavorId of flavorIds) {
    await processFlavor(flavorId, existingSongKeys, limit, args.retrySuccess)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('\nDone.')
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
