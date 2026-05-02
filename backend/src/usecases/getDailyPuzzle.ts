/**
 * Use case — generate (or fetch from cache) the daily puzzle for a flavor.
 *
 * Pure business logic: receives repositories as dependencies, never touches
 * Prisma directly. Easy to unit-test by passing in fake repositories.
 */
import type { Flavor, Track } from '@prisma/client'
import type { FlavorRepository } from '../repositories/flavorRepository'
import type { TrackRepository } from '../repositories/trackRepository'
import type { DailyPuzzleCacheRepository } from '../repositories/dailyPuzzleCacheRepository'
import { mulberry32, shuffleInPlace, stringHashToU32 } from '../services/seedRandom'

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

export class FlavorNotFoundError extends Error {
  status = 404
  constructor(flavorId: string) {
    super(`Flavor "${flavorId}" not found`)
  }
}

export class InsufficientTracksError extends Error {
  status = 422
  constructor(flavorId: string, have: number, need: number) {
    super(`Not enough tracks for flavor "${flavorId}": have ${have}, need at least ${need}.`)
  }
}

export interface GetDailyPuzzleDeps {
  flavorRepo: FlavorRepository
  trackRepo: TrackRepository
  cacheRepo: DailyPuzzleCacheRepository
}

export interface GetDailyPuzzleArgs {
  flavorId: string
  date: string
}

const dayNumberFromDate = (date: string): number => {
  const epochMs = Date.parse(`${PROJECT_EPOCH}T00:00:00Z`)
  const dateMs = Date.parse(`${date}T00:00:00Z`)
  return Math.max(1, Math.floor((dateMs - epochMs) / 86_400_000) + 1)
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

const pickN = <T>(rand: () => number, source: T[], count: number): T[] => {
  const pool = [...source]
  shuffleInPlace(pool, rand)
  return pool.slice(0, count)
}

const buildDecoys = (rand: () => number, target: Track, flavorTracks: Track[]): Track[] => {
  const need = OPTIONS_PER_COLUMN - 1
  const taken = new Set<string>([target.id])
  const decoys: Track[] = []

  const drawFrom = (pool: Track[]) => {
    const filtered = pool.filter((t) => !taken.has(t.id))
    for (const t of pickN(rand, filtered, need - decoys.length)) {
      decoys.push(t)
      taken.add(t.id)
    }
  }

  // Tier 1 — same artist
  drawFrom(
    flavorTracks.filter((t) => t.artist.toLowerCase() === target.artist.toLowerCase() && t.id !== target.id),
  )

  // Tier 2 — year ±5
  if (decoys.length < need && target.year !== null) {
    const ty = target.year
    drawFrom(flavorTracks.filter((t) => t.year !== null && Math.abs(t.year - ty) <= 5))
  }

  // Tier 3 — same genre
  if (decoys.length < need && target.genre) {
    drawFrom(flavorTracks.filter((t) => t.genre === target.genre))
  }

  // Tier 4 — random fallback
  if (decoys.length < need) drawFrom(flavorTracks)

  return decoys
}

const buildColumn = (rand: () => number, target: Track, flavorTracks: Track[]): PuzzleColumn => {
  const decoys = buildDecoys(rand, target, flavorTracks)
  const options = [target, ...decoys].map(toOption)
  shuffleInPlace(options, rand)
  return { audio: target.previewUrl, options }
}

const generate = (flavor: Flavor, date: string, flavorTracks: Track[]): DailyPuzzle => {
  if (flavorTracks.length < OPTIONS_PER_COLUMN * COLUMN_COUNT) {
    throw new InsufficientTracksError(flavor.id, flavorTracks.length, OPTIONS_PER_COLUMN * COLUMN_COUNT)
  }
  const seed = stringHashToU32(`${flavor.id}|${date}`)
  const rand = mulberry32(seed)

  const targetPool = [...flavorTracks]
  shuffleInPlace(targetPool, rand)
  const targets = targetPool.slice(0, COLUMN_COUNT)

  return {
    flavor: { id: flavor.id, name: flavor.name, description: flavor.description },
    day: dayNumberFromDate(date),
    date,
    columns: targets.map((t) => buildColumn(rand, t, flavorTracks)),
  }
}

export const makeGetDailyPuzzle =
  ({ flavorRepo, trackRepo, cacheRepo }: GetDailyPuzzleDeps) =>
  async ({ flavorId, date }: GetDailyPuzzleArgs): Promise<DailyPuzzle> => {
    const flavor = await flavorRepo.findById(flavorId)
    if (!flavor) throw new FlavorNotFoundError(flavorId)

    const cached = await cacheRepo.findPayload(flavorId, date)
    if (cached) return cached as DailyPuzzle

    const tracks = await trackRepo.findByFlavorId(flavorId)
    const puzzle = generate(flavor, date, tracks)
    await cacheRepo.save(flavorId, date, puzzle as unknown as object)
    return puzzle
  }
