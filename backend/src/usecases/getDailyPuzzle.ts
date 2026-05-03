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

const MAX_SAME_ARTIST_DECOYS = 1
const MAX_SAME_ALBUM_DECOYS = 1

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replaceAll(/\(.*?\)|\[.*?\]/g, '')
    .replaceAll(/\s*-\s*(remaster(ed)?|live|radio edit|instrumental|deluxe|mono|stereo|version).*/gi, '')
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const songKey = (t: Track): string => `${normalize(t.artist)}::${normalize(t.title)}`

const dedupeBySong = (tracks: Track[]): Track[] => {
  const seen = new Set<string>()
  const out: Track[] = []
  for (const t of tracks) {
    const key = songKey(t)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

const buildDecoys = (
  rand: () => number,
  target: Track,
  flavorTracks: Track[],
  globalTaken: Set<string>,
): Track[] => {
  const need = OPTIONS_PER_COLUMN - 1
  const targetArtist = target.artist.toLowerCase()
  const targetAlbumKey = normalize(target.album)
  const decoys: Track[] = []
  let sameArtistUsed = 0
  let sameAlbumUsed = 0

  const isAvailable = (t: Track): boolean => !globalTaken.has(songKey(t))
  const isSameArtist = (t: Track): boolean => t.artist.toLowerCase() === targetArtist
  const isSameAlbum = (t: Track): boolean => normalize(t.album) === targetAlbumKey

  const tryAdd = (t: Track, enforceCaps: boolean): boolean => {
    if (!isAvailable(t)) return false
    if (enforceCaps && isSameArtist(t) && sameArtistUsed >= MAX_SAME_ARTIST_DECOYS) return false
    if (enforceCaps && isSameAlbum(t) && sameAlbumUsed >= MAX_SAME_ALBUM_DECOYS) return false
    decoys.push(t)
    globalTaken.add(songKey(t))
    if (isSameArtist(t)) sameArtistUsed += 1
    if (isSameAlbum(t)) sameAlbumUsed += 1
    return true
  }

  const drawFrom = (pool: Track[], enforceCaps: boolean) => {
    if (decoys.length >= need) return
    const shuffled = [...pool]
    shuffleInPlace(shuffled, rand)
    for (const t of shuffled) {
      if (decoys.length >= need) return
      tryAdd(t, enforceCaps)
    }
  }

  // Tier 1 — same artist (cap enforced per item)
  drawFrom(
    flavorTracks.filter((t) => isSameArtist(t) && t.id !== target.id),
    true,
  )

  // Tier 2 — year ±5, different artist
  if (decoys.length < need && target.year !== null) {
    const ty = target.year
    drawFrom(
      flavorTracks.filter((t) => t.year !== null && Math.abs(t.year - ty) <= 5 && !isSameArtist(t)),
      true,
    )
  }

  // Tier 3 — same genre, different artist
  if (decoys.length < need && target.genre) {
    drawFrom(
      flavorTracks.filter((t) => t.genre === target.genre && !isSameArtist(t)),
      true,
    )
  }

  // Tier 4 — random fallback (caps still enforced)
  if (decoys.length < need) drawFrom(flavorTracks, true)

  // Tier 5 — emergency: relax all caps (only if pool too small to satisfy)
  if (decoys.length < need) drawFrom(flavorTracks, false)

  return decoys
}

const buildColumn = (
  rand: () => number,
  target: Track,
  flavorTracks: Track[],
  globalTaken: Set<string>,
): PuzzleColumn => {
  const decoys = buildDecoys(rand, target, flavorTracks, globalTaken)
  const options = [target, ...decoys].map(toOption)
  shuffleInPlace(options, rand)
  return { audio: target.previewUrl, options }
}

const generate = (flavor: Flavor, date: string, flavorTracks: Track[]): DailyPuzzle => {
  const uniqueTracks = dedupeBySong(flavorTracks)

  if (uniqueTracks.length < OPTIONS_PER_COLUMN * COLUMN_COUNT) {
    throw new InsufficientTracksError(flavor.id, uniqueTracks.length, OPTIONS_PER_COLUMN * COLUMN_COUNT)
  }
  const seed = stringHashToU32(`${flavor.id}|${date}`)
  const rand = mulberry32(seed)

  const targetPool = [...uniqueTracks]
  shuffleInPlace(targetPool, rand)
  const targets = targetPool.slice(0, COLUMN_COUNT)

  const globalTaken = new Set<string>(targets.map(songKey))

  return {
    flavor: { id: flavor.id, name: flavor.name, description: flavor.description },
    day: dayNumberFromDate(date),
    date,
    columns: targets.map((t) => buildColumn(rand, t, uniqueTracks, globalTaken)),
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
