import { useStatsStore } from './store'
import { EMPTY_STATS, type StatsState } from './types'

const KEY = 'trackle:stats:v1'

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

function readFromStorage(): StatsState {
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

function writeToStorage(state: StatsState): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* quota / disabled */
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

/** Hydrate the store from localStorage. Idempotent. */
export function hydrateStats(): void {
  const store = useStatsStore()
  if (store.hydrated) return
  store.setState(readFromStorage())
  store.setHydrated(true)
}

/** Record a finished game; persists to localStorage and updates the store. */
export function recordResult(args: RecordResultArgs): void {
  const store = useStatsStore()
  if (!store.hydrated) hydrateStats()

  const current = store.state
  const alreadyRecorded = current.history.some(
    (h) => h.date === args.date && h.flavorId === args.flavorId,
  )
  if (alreadyRecorded) return

  const played = args.score > 0
  let nextStreak: number
  if (!played) {
    nextStreak = 0
  } else if (current.lastPlayedDate === yesterdayOf(args.date)) {
    nextStreak = current.currentStreak + 1
  } else if (current.lastPlayedDate === args.date) {
    nextStreak = current.currentStreak
  } else {
    nextStreak = 1
  }

  const next: StatsState = {
    lastPlayedDate: args.date,
    currentStreak: nextStreak,
    maxStreak: Math.max(current.maxStreak, nextStreak),
    history: [
      ...current.history,
      { date: args.date, flavorId: args.flavorId, day: args.day, score: args.score, total: args.total },
    ],
  }

  store.setState(next)
  writeToStorage(next)
}
