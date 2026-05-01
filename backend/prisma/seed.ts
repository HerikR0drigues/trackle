/**
 * Seeds the Postgres database with the initial Rock flavor and a curated
 * pool of tracks pulled from the iTunes Search API.
 *
 * Usage: `npm run seed` (idempotent — safe to re-run; uses upsert by itunesId).
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { searchTracks, type NormalizedTrack } from '../src/services/itunes'

const prisma = new PrismaClient()

interface FlavorSeed {
  id: string
  name: string
  description: string
  searchTerms: string[]
  /** Min number of unique tracks we want in the pool. */
  targetTracks: number
}

const FLAVORS: FlavorSeed[] = [
  {
    id: 'rock',
    name: 'Rock',
    description: "Rockin' and rollin'",
    targetTracks: 60,
    searchTerms: [
      'Queen Bohemian Rhapsody',
      'Queen Don\'t Stop Me Now',
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
      'The Who Baba O\'Riley',
      'The Doors Light My Fire',
      'Pink Floyd Comfortably Numb',
      'Pink Floyd Wish You Were Here',
      'Eagles Hotel California',
      'Lynyrd Skynyrd Sweet Home Alabama',
      'Boston More Than a Feeling',
      'Twisted Sister I Wanna Rock',
      'Steel Panther Eyes of a Panther',
    ],
  },
]

const dedupeByItunesId = (tracks: NormalizedTrack[]): NormalizedTrack[] => {
  const seen = new Set<string>()
  const out: NormalizedTrack[] = []
  for (const t of tracks) {
    if (seen.has(t.itunesId)) continue
    seen.add(t.itunesId)
    out.push(t)
  }
  return out
}

const seedFlavor = async (flavor: FlavorSeed): Promise<void> => {
  console.log(`\n[flavor:${flavor.id}] upserting flavor row`)
  await prisma.flavor.upsert({
    where: { id: flavor.id },
    update: { name: flavor.name, description: flavor.description },
    create: { id: flavor.id, name: flavor.name, description: flavor.description },
  })

  const collected: NormalizedTrack[] = []
  for (const term of flavor.searchTerms) {
    try {
      const tracks = await searchTracks({ term, limit: 5 })
      const top = tracks[0]
      if (top) {
        collected.push(top)
        if (tracks[1]) collected.push(tracks[1])
      }
      process.stdout.write('.')
    } catch (err) {
      console.warn(`\n[flavor:${flavor.id}] search "${term}" failed:`, (err as Error).message)
    }
  }
  process.stdout.write('\n')

  const unique = dedupeByItunesId(collected)
  console.log(`[flavor:${flavor.id}] fetched ${collected.length} tracks (${unique.length} unique)`)

  let upserted = 0
  for (const t of unique) {
    await prisma.track.upsert({
      where: { itunesId: t.itunesId },
      update: {
        title: t.title,
        artist: t.artist,
        album: t.album,
        year: t.year,
        genre: t.genre,
        artworkUrl: t.artworkUrl,
        previewUrl: t.previewUrl,
        flavorId: flavor.id,
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
        flavorId: flavor.id,
      },
    })
    upserted += 1
  }

  const total = await prisma.track.count({ where: { flavorId: flavor.id } })
  console.log(`[flavor:${flavor.id}] upserted ${upserted}; total in DB: ${total}`)
  if (total < flavor.targetTracks) {
    console.warn(
      `[flavor:${flavor.id}] WARNING: pool is ${total}, target was ${flavor.targetTracks}. ` +
        `Extend FLAVORS[].searchTerms to grow the pool.`,
    )
  }
}

const main = async (): Promise<void> => {
  for (const flavor of FLAVORS) {
    await seedFlavor(flavor)
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
