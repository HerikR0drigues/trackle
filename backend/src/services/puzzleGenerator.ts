/**
 * Generates a daily Trackle puzzle deterministically:
 *   - 3 columns, each with one "target" track (the audio that plays) and 4
 *     options (the target plus 3 decoys chosen to be plausibly similar).
 *   - The same (flavorId, date) always produces the same puzzle. Cached in
 *     DailyPuzzleCache after first computation.
 */
import type { Flavor, Track } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { mulberry32, shuffleInPlace, stringHashToU32 } from './seedRandom'

const PROJECT_EPOCH = '2026-05-01'
const COLUMN_COUNT = 3
const OPTIONS_PER_COLUMN = 4

export interface PuzzleOption {
  id: string
  songTitle: string
  artist: string
  album: string
  year: number | null
  albumCover: string
  // previewUrl is included so the client can verify the guess locally (MVP).
  // In v2 with leaderboards, validation moves to the server and this field
  // would be stripped from non-target options.
  previewUrl: string
}

export interface PuzzleColumn {
  audio: string
  options: PuzzleOption[]
}

export interface DailyPuzzle {
  flavor: { id: string; name: string; description: string }
  day: number
  date: string
  columns: PuzzleColumn[]
}

const toOption = (t: Track): PuzzleOption => ({
  id: t.id,
  songTitle: t.title,
  artist: t.artist,
  album: t.album,
  year: t.year,
  albumCover: t.artworkUrl,
  previewUrl: t.previewUrl,
})

const dayNumberFromDate = (date: string): number => {
  const epochMs = Date.parse(`${PROJECT_EPOCH}T00:00:00Z`)
  const dateMs = Date.parse(`${date}T00:00:00Z`)
  return Math.max(1, Math.floor((dateMs - epochMs) / 86_400_000) + 1)
}

const pickN = <T>(rand: () => number, source: T[], count: number, excludeIds: Set<string>, idOf: (t: T) => string): T[] => {
  const pool = source.filter((t) => !excludeIds.has(idOf(t)))
  shuffleInPlace(pool, rand)
  return pool.slice(0, count)
}

const buildDecoys = (
  rand: () => number,
  target: Track,
  flavorTracks: Track[],
): Track[] => {
  const need = OPTIONS_PER_COLUMN - 1 // 3 decoys
  const taken = new Set<string>([target.id])
  const decoys: Track[] = []

  // Tier 1 — same artist, different track
  const sameArtist = flavorTracks.filter(
    (t) => t.artist.toLowerCase() === target.artist.toLowerCase() && t.id !== target.id,
  )
  for (const t of pickN(rand, sameArtist, need - decoys.length, taken, (t) => t.id)) {
    decoys.push(t)
    taken.add(t.id)
  }

  // Tier 2 — year ±5
  if (decoys.length < need && target.year !== null) {
    const ty = target.year
    const sameEra = flavorTracks.filter(
      (t) => t.year !== null && Math.abs(t.year - ty) <= 5 && !taken.has(t.id),
    )
    for (const t of pickN(rand, sameEra, need - decoys.length, taken, (t) => t.id)) {
      decoys.push(t)
      taken.add(t.id)
    }
  }

  // Tier 3 — same genre
  if (decoys.length < need && target.genre) {
    const sameGenre = flavorTracks.filter(
      (t) => t.genre === target.genre && !taken.has(t.id),
    )
    for (const t of pickN(rand, sameGenre, need - decoys.length, taken, (t) => t.id)) {
      decoys.push(t)
      taken.add(t.id)
    }
  }

  // Tier 4 — random fallback
  if (decoys.length < need) {
    const rest = flavorTracks.filter((t) => !taken.has(t.id))
    for (const t of pickN(rand, rest, need - decoys.length, taken, (t) => t.id)) {
      decoys.push(t)
      taken.add(t.id)
    }
  }

  return decoys
}

const buildColumn = (
  rand: () => number,
  target: Track,
  flavorTracks: Track[],
): PuzzleColumn => {
  const decoys = buildDecoys(rand, target, flavorTracks)
  const options = [target, ...decoys].map(toOption)
  shuffleInPlace(options, rand)
  return { audio: target.previewUrl, options }
}

export interface GeneratePuzzleArgs {
  flavor: Flavor
  date: string // YYYY-MM-DD
}

export const generatePuzzle = async ({ flavor, date }: GeneratePuzzleArgs): Promise<DailyPuzzle> => {
  const cached = await prisma.dailyPuzzleCache.findUnique({
    where: { flavorId_date: { flavorId: flavor.id, date } },
  })
  if (cached) {
    return cached.payload as unknown as DailyPuzzle
  }

  const flavorTracks = await prisma.track.findMany({
    where: { flavorId: flavor.id },
    orderBy: { id: 'asc' },
  })

  if (flavorTracks.length < OPTIONS_PER_COLUMN * COLUMN_COUNT) {
    throw new Error(
      `Not enough tracks for flavor "${flavor.id}": have ${flavorTracks.length}, need at least ${
        OPTIONS_PER_COLUMN * COLUMN_COUNT
      }.`,
    )
  }

  const seed = stringHashToU32(`${flavor.id}|${date}`)
  const rand = mulberry32(seed)

  const targetPool = [...flavorTracks]
  shuffleInPlace(targetPool, rand)
  const targets = targetPool.slice(0, COLUMN_COUNT)

  const columns = targets.map((t) => buildColumn(rand, t, flavorTracks))

  const puzzle: DailyPuzzle = {
    flavor: { id: flavor.id, name: flavor.name, description: flavor.description },
    day: dayNumberFromDate(date),
    date,
    columns,
  }

  await prisma.dailyPuzzleCache.create({
    data: { flavorId: flavor.id, date, payload: puzzle as unknown as object },
  })

  return puzzle
}
