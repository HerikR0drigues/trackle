import { defineStore } from 'pinia'
import { EMPTY_STATS, type StatsState } from './types'

export const useStatsStore = defineStore('stats', () => {
  const state = ref<StatsState>({ ...EMPTY_STATS })
  const hydrated = ref(false)

  const currentStreak = computed(() => state.value.currentStreak)
  const maxStreak = computed(() => state.value.maxStreak)
  const totalPlayed = computed(() => state.value.history.length)

  function setState(next: StatsState) {
    state.value = next
  }

  function setHydrated(value: boolean) {
    hydrated.value = value
  }

  function clearAll() {
    state.value = { ...EMPTY_STATS }
    hydrated.value = false
  }

  return { state, hydrated, currentStreak, maxStreak, totalPlayed, setState, setHydrated, clearAll }
})
