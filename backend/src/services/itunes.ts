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

export interface SearchOptions {
  term: string
  limit?: number
  country?: string
}

export const searchTracks = async ({
  term,
  limit = 25,
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
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Musicle/0.1 (+study project)' },
  })
  if (!res.ok) {
    throw new Error(`iTunes Search failed: HTTP ${res.status}`)
  }
  const data = (await res.json()) as ItunesSearchResponse
  const out: NormalizedTrack[] = []
  for (const r of data.results) {
    const n = normalize(r)
    if (n) out.push(n)
  }
  return out
}
