import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('dark')

  const setMode = (next: ThemeMode) => {
    mode.value = next
  }

  return { mode, setMode }
})
