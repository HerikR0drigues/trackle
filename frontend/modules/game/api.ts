import { useApi } from '~/shared/composables/useApi'
import type { ApiResponse } from '~/shared/types/api-response'
import type { DailyPuzzle } from './types'

export interface FetchDailyArgs {
  flavor: string
  date?: string
}

export const fetchDailyPuzzle = (args: FetchDailyArgs): Promise<ApiResponse<DailyPuzzle>> =>
  useApi().get<DailyPuzzle>('/puzzles/daily', { query: args })
