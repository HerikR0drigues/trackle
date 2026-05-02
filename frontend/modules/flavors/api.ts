import { BaseApi, type CallOptions } from '~/shared/api/BaseApi'
import type { ApiResponse } from '~/shared/types/api-response'
import { useFlavorsStore } from './store'
import type { Flavor } from './types'

class FlavorsApi extends BaseApi {
  async list(opts?: CallOptions): Promise<ApiResponse<Flavor[]>> {
    const store = useFlavorsStore()
    store.setLoading(true)
    store.setError(null)
    try {
      const res = await this.get<Flavor[]>('/flavors', undefined, opts)
      if (res.value) store.setFlavors(res.value)
      else store.setError(res.message)
      return res
    } finally {
      store.setLoading(false)
    }
  }
}

export const flavorsApi = new FlavorsApi()
