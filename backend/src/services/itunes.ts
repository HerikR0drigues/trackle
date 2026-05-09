// Client for iTunes Search API. Free, no auth.
// Docs: https://performance-partners.apple.com/search-api
//
// Apple Terms note: data and audio previews must be hot-linked from Apple's CDN.
// We persist metadata + URL pointers, never the .m4a payloads themselves.

const BASE_URL = process.env.ITUNES_BASE_URL ?? 'https://itunes.apple.com'

export interface ItunesTrackRaw {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  collectionId: number
  releaseDate?: string
  primaryGenreName?: string
  artworkUrl100?: string
  previewUrl?: string
}

export interface ItunesSearchResponse {
  resultCount: number
  results: ItunesTrackRaw[]
}

export interface NormalizedTrack {
  itunesId: string
  title: string
  artist: string
  album: string
  year: number | null
  genre: string | null
  artworkUrl: string
  previewUrl: string
}

const upgradeArtwork = (url: string): string =>
  url.replace('100x100bb', '400x400bb').replace('100x100', '400x400')

const yearFromIso = (iso?: string): number | null => {
  if (!iso) return null
  const y = Number.parseInt(iso.slice(0, 4), 10)
  return Number.isFinite(y) ? y : null
}

export const normalize = (raw: ItunesTrackRaw): NormalizedTrack | null => {
  if (!raw.previewUrl || !raw.artworkUrl100) return null
  return {
    itunesId: String(raw.trackId),
    title: raw.trackName.trim(),
    artist: raw.artistName.trim(),
    album: raw.collectionName.trim(),
    year: yearFromIso(raw.releaseDate),
    genre: raw.primaryGenreName?.trim() ?? null,
    artworkUrl: upgradeArtwork(raw.artworkUrl100),
    previewUrl: raw.previewUrl,
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const RETRY_DELAYS: ReadonlyArray<{ base: number; spread: number }> = [
  { base: 1_500, spread: 500 },
  { base: 5_000, spread: 1_500 },
  { base: 15_000, spread: 5_000 },
  { base: 40_000, spread: 10_000 },
]

// iTunes returns 403 when our IP is being throttled; treat it as transient.
const isRetriableStatus = (status: number): boolean =>
  status === 403 || status === 429 || status >= 500

const jitteredDelay = (base: number, spread: number): number =>
  Math.max(0, base + (Math.random() - 0.5) * 2 * spread)

class ItunesHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly retriable: boolean,
  ) {
    super(`iTunes Search failed: HTTP ${status}`)
  }
}

const fetchWithRetry = async (
  url: string,
  headers: Record<string, string>,
): Promise<Response> => {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await fetch(url, { headers })
      if (res.ok) return res
      const httpError = new ItunesHttpError(res.status, isRetriableStatus(res.status))
      if (!httpError.retriable) throw httpError
      lastError = httpError
    } catch (err) {
      if (err instanceof ItunesHttpError && !err.retriable) throw err
      lastError = err as Error
    }
    if (attempt < RETRY_DELAYS.length) {
      const { base, spread } = RETRY_DELAYS[attempt]
      await sleep(jitteredDelay(base, spread))
    }
  }
  throw lastError ?? new Error('iTunes Search failed after retries')
}

export interface SearchOptions {
  term: string
  limit?: number
  country?: string
}

export const searchTracks = async ({
  term,
  limit = 15,
  country = 'US',
}: SearchOptions): Promise<NormalizedTrack[]> => {
  const params = new URLSearchParams({
    media: 'music',
    entity: 'song',
    term,
    limit: String(limit),
    country,
  })
  const url = `${BASE_URL}/search?${params.toString()}`
  const headers = { 'User-Agent': 'Trackle/0.1 (+study project)' }

  const res = await fetchWithRetry(url, headers)
  const data = (await res.json()) as ItunesSearchResponse
  const out: NormalizedTrack[] = []
  for (const r of data.results) {
    const n = normalize(r)
    if (n) out.push(n)
  }
  return out
}
