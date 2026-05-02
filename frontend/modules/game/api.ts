import { BaseApi, type CallOptions } from '~/shared/api/BaseApi'
import type { ApiResponse } from '~/shared/types/api-response'
import { useGameStore } from './store'
import type { AlbumOption, DailyPuzzle, GuessResult } from './types'

export interface FetchDailyArgs {
  flavor: string
  date?: string
}

class GameApi extends BaseApi {
  async fetchDailyPuzzle(
    args: FetchDailyArgs,
    opts?: CallOptions,
  ): Promise<ApiResponse<DailyPuzzle>> {
    const store = useGameStore()
    store.setLoading(true)
    store.setError(null)
    try {
      const res = await this.get<DailyPuzzle>('/puzzles/daily', { ...args }, opts)
      if (res.value) store.setPuzzle(res.value)
      else store.setError(res.message)
      return res
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Validate the guess locally (MVP) and update the store.
   * In v2 this becomes a POST to the backend.
   */
  submitGuess(columnIndex: number, option: AlbumOption): GuessResult | null {
    const store = useGameStore()
    if (!store.puzzle) return null
    if (store.results[columnIndex]) return store.results[columnIndex]
    const audio = store.puzzle.columns[columnIndex]?.audio
    if (!audio) return null
    const result: GuessResult = option.previewUrl === audio ? 'correct' : 'wrong'
    store.setGuess(columnIndex, option, result)
    return result
  }
}

export const gameApi = new GameApi()
