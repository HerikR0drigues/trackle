import { defineStore } from 'pinia'
import { readStats, recordResult, writeStats, type RecordResultArgs } from './api'
import { EMPTY_STATS, type StatsState } from './types'

export const useStatsStore = defineStore('stats', () => {
  const state = ref<StatsState>({ ...EMPTY_STATS })
  const hydrated = ref(false)

  /** Lazy hydration from localStorage; safe to call from onMounted. */
  const hydrate = () => {
    if (hydrated.value) return
    state.value = readStats()
    hydrated.value = true
  }

  const record = (args: RecordResultArgs): void => {
    if (!hydrated.value) hydrate()
    const next = recordResult(state.value, args)
    if (next !== state.value) {
      state.value = next
      writeStats(next)
    }
  }

  const currentStreak = computed(() => state.value.currentStreak)
  const maxStreak = computed(() => state.value.maxStreak)
  const totalPlayed = computed(() => state.value.history.length)

  return { state, hydrated, hydrate, record, currentStreak, maxStreak, totalPlayed }
})
