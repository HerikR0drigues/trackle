export interface DailyStat {
  date: string         // YYYY-MM-DD
  flavorId: string
  day: number          // puzzle day number
  score: number        // correct guesses
  total: number        // total columns
}

export interface StatsState {
  lastPlayedDate: string | null
  currentStreak: number
  maxStreak: number
  history: DailyStat[]
}

export const EMPTY_STATS: StatsState = {
  lastPlayedDate: null,
  currentStreak: 0,
  maxStreak: 0,
  history: [],
}
