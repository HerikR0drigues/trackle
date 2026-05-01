import type { ApiResponse } from '~/shared/types/api-response'

interface FetchOptions {
  query?: Record<string, unknown>
  signal?: AbortSignal
}

const toApiError = (e: unknown): ApiResponse<null> => {
  const err = e as { statusCode?: number; message?: string; data?: { message?: string } }
  return {
    status: err.statusCode ?? 500,
    value: null,
    message: err.data?.message ?? err.message ?? 'Network error',
  }
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase

  return {
    async get<T>(path: string, opts: FetchOptions = {}): Promise<ApiResponse<T>> {
      try {
        return await $fetch<ApiResponse<T>>(path, {
          baseURL,
          query: opts.query,
          signal: opts.signal,
        })
      } catch (e) {
        return toApiError(e)
      }
    },
  }
}
