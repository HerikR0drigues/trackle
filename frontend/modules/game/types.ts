export interface AlbumOption {
  id: string
  songTitle: string
  artist: string
  album: string
  year: number | null
  albumCover: string
  /** MVP: client compares with the column's audio URL to validate the guess. */
  previewUrl: string
}

export interface PuzzleColumn {
  audio: string
  options: AlbumOption[]
}

export interface DailyPuzzle {
  flavor: { id: string; name: string; description: string }
  day: number
  date: string
  columns: PuzzleColumn[]
}

export type GuessResult = 'correct' | 'wrong'
