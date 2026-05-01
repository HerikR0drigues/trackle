import { useApi } from '~/shared/composables/useApi'
import type { ApiResponse } from '~/shared/types/api-response'
import type { Flavor } from './types'

export const fetchFlavors = (): Promise<ApiResponse<Flavor[]>> => useApi().get<Flavor[]>('/flavors')
