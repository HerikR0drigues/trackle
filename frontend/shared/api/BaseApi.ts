import type { NitroFetchOptions } from 'nitropack'
import type { ApiResponse } from '~/shared/types/api-response'
import { useSnackbar } from '~/shared/stores/snackbar'

export interface CallOptions {
  /** Skip the global error snackbar on failure. Default false. */
  silent?: boolean
  /** Custom message used in the snackbar instead of the API's. */
  errorMessage?: string
}

/**
 * Base class for feature API services.
 *
 * Concrete services extend this and call `this.request<T>(path, opts)` (or the
 * `get` shortcut). Network errors and non-2xx responses are caught here, mapped
 * to `ApiResponse<T>`, and surfaced through the global snackbar — feature code
 * just receives a typed result and decides what to do with `value`/`message`.
 */
export class BaseApi {
  protected get baseURL(): string {
    return useRuntimeConfig().public.apiBase as string
  }

  protected async request<T>(
    path: string,
    fetchOpts: NitroFetchOptions<string> = {},
    callOpts: CallOptions = {},
  ): Promise<ApiResponse<T>> {
    try {
      const res = await $fetch<ApiResponse<T>>(path, {
        baseURL: this.baseURL,
        ...fetchOpts,
      })
      if (res.value === null && !callOpts.silent) {
        useSnackbar().error(callOpts.errorMessage ?? res.message)
      }
      return res
    } catch (err) {
      const e = err as {
        statusCode?: number
        message?: string
        data?: { message?: string }
      }
      const status = e.statusCode ?? 500
      const message = callOpts.errorMessage ?? e.data?.message ?? e.message ?? 'Network error'
      if (!callOpts.silent) useSnackbar().error(message)
      return { status, value: null, message }
    }
  }

  protected get<T>(
    path: string,
    query?: Record<string, unknown>,
    callOpts?: CallOptions,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET', query }, callOpts)
  }
}
