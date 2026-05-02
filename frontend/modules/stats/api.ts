import { EMPTY_STATS, type StatsState } from './types'

const KEY = 'trackle:stats:v1'

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const readStats = (): StatsState => {
  if (!isBrowser()) return { ...EMPTY_STATS }
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY_STATS }
    const parsed = JSON.parse(raw) as Partial<StatsState>
    return {
      lastPlayedDate: parsed.lastPlayedDate ?? null,
      currentStreak: parsed.currentStreak ?? 0,
      maxStreak: parsed.maxStreak ?? 0,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return { ...EMPTY_STATS }
  }
}

export const writeStats = (state: StatsState): void => {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // ignore quota / disabled storage
  }
}

const yesterdayOf = (date: string): string => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export interface RecordResultArgs {
  date: string
  flavorId: string
  day: number
  score: number
  total: number
}

export const recordResult = (state: StatsState, args: RecordResultArgs): StatsState => {
  // Idempotent: don't double-count if the same (flavor, date) is replayed.
  const alreadyRecorded = state.history.some(
    (h) => h.date === args.date && h.flavorId === args.flavorId,
  )
  if (alreadyRecorded) return state

  const played = args.score > 0
  let nextStreak: number
  if (!played) {
    nextStreak = 0
  } else if (state.lastPlayedDate === yesterdayOf(args.date)) {
    nextStreak = state.currentStreak + 1
  } else if (state.lastPlayedDate === args.date) {
    nextStreak = state.currentStreak
  } else {
    nextStreak = 1
  }

  return {
    lastPlayedDate: args.date,
    currentStreak: nextStreak,
    maxStreak: Math.max(state.maxStreak, nextStreak),
    history: [
      ...state.history,
      { date: args.date, flavorId: args.flavorId, day: args.day, score: args.score, total: args.total },
    ],
  }
}
