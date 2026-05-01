export interface ApiResponse<T> {
  status: number
  value: T | null
  message: string
}

export const ok = <T>(value: T, message = 'ok', status = 200): ApiResponse<T> => ({
  status,
  value,
  message,
})

export const fail = (status: number, message: string): ApiResponse<null> => ({
  status,
  value: null,
  message,
})
