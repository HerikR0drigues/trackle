import { useApi } from '~/shared/composables/useApi'
import type { ApiResponse } from '~/shared/types/api-response'
import { useFlavorsStore } from './store'
import type { Flavor } from './types'

export async function listFlavors(): Promise<ApiResponse<Flavor[]>> {
  const store = useFlavorsStore()
  store.setLoading(true)
  store.setError(null)
  try {
    const res = await useApi().get<Flavor[]>('/flavors')
    if (res.value) {
      store.setFlavors(res.value)
    } else {
      store.setError(res.message)
    }
    return res
  } finally {
    store.setLoading(false)
  }
}
