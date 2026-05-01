export interface ApiResponse<T> {
  status: number
  value: T | null
  message: string
}
