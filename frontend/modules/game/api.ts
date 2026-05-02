import { useApi } from '~/shared/composables/useApi'
import type { ApiResponse } from '~/shared/types/api-response'
import { useGameStore } from './store'
import type { AlbumOption, DailyPuzzle, GuessResult } from './types'

export interface FetchDailyArgs {
  flavor: string
  date?: string
}

export async function fetchDailyPuzzle(
  args: FetchDailyArgs,
): Promise<ApiResponse<DailyPuzzle>> {
  const store = useGameStore()
  store.setLoading(true)
  store.setError(null)
  try {
    const res = await useApi().get<DailyPuzzle>('/puzzles/daily', { query: args })
    if (res.value) {
      store.setPuzzle(res.value)
    } else {
      store.setError(res.message)
    }
    return res
  } finally {
    store.setLoading(false)
  }
}

/**
 * Validate a guess locally (MVP). Updates the store with the result and
 * returns it. In v2 with leaderboards this becomes a POST to the backend.
 */
export function submitGuess(columnIndex: number, option: AlbumOption): GuessResult | null {
  const store = useGameStore()
  if (!store.puzzle) return null
  if (store.results[columnIndex]) return store.results[columnIndex]
  const audio = store.puzzle.columns[columnIndex]?.audio
  if (!audio) return null
  const result: GuessResult = option.previewUrl === audio ? 'correct' : 'wrong'
  store.setGuess(columnIndex, option, result)
  return result
}
