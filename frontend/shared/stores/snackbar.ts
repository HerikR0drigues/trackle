import { defineStore } from 'pinia'

export type SnackbarType = 'success' | 'info' | 'warning' | 'error'

export interface SnackbarMessage {
  id: number
  type: SnackbarType
  text: string
  timeout: number
}

let nextId = 0

export const useSnackbarStore = defineStore('snackbar', () => {
  const queue = ref<SnackbarMessage[]>([])

  function push(msg: Omit<SnackbarMessage, 'id'>) {
    queue.value = [...queue.value, { ...msg, id: ++nextId }]
  }

  function remove(id: number) {
    queue.value = queue.value.filter((m) => m.id !== id)
  }

  function clear() {
    queue.value = []
  }

  return { queue, push, remove, clear }
})

/**
 * Convenience helpers for callers (api classes, components).
 */
export const useSnackbar = () => {
  const store = useSnackbarStore()
  const make = (type: SnackbarType, defaultTimeout: number) => (text: string, timeout?: number) =>
    store.push({ type, text, timeout: timeout ?? defaultTimeout })
  return {
    success: make('success', 3000),
    info: make('info', 3000),
    warning: make('warning', 4000),
    error: make('error', 5000),
  }
}
