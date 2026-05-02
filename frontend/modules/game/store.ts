import { defineStore } from 'pinia'
import type { AlbumOption, DailyPuzzle, GuessResult } from './types'

export const useGameStore = defineStore('game', () => {
  const puzzle = ref<DailyPuzzle | null>(null)
  const guesses = ref<Record<number, AlbumOption>>({})
  const results = ref<Record<number, GuessResult>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const score = computed(() => Object.values(results.value).filter((r) => r === 'correct').length)

  const isComplete = computed(() => {
    if (!puzzle.value) return false
    return Object.keys(results.value).length === puzzle.value.columns.length
  })

  const activeColumn = computed(() => {
    if (!puzzle.value) return -1
    for (let i = 0; i < puzzle.value.columns.length; i++) {
      if (!results.value[i]) return i
    }
    return -1
  })

  /** Index of the next unresolved column. Anything ≤ this index is unlocked. */
  const unlockedUntil = computed(() => {
    if (!puzzle.value) return 0
    let i = 0
    while (i < puzzle.value.columns.length && results.value[i]) i++
    return i
  })

  function isColumnLocked(idx: number): boolean {
    return idx > unlockedUntil.value
  }

  const shareString = computed(() => {
    if (!puzzle.value) return ''
    const flavorName = puzzle.value.flavor.name
    const day = puzzle.value.day
    const tiles = puzzle.value.columns
      .map((_c, i) => (results.value[i] === 'correct' ? '🟢' : results.value[i] === 'wrong' ? '🔴' : '⬜'))
      .join('')
    return `Trackle ${flavorName} #${day}  ${tiles}`
  })

  function setPuzzle(p: DailyPuzzle) {
    puzzle.value = p
    guesses.value = {}
    results.value = {}
  }

  function setGuess(columnIndex: number, option: AlbumOption, result: GuessResult) {
    guesses.value = { ...guesses.value, [columnIndex]: option }
    results.value = { ...results.value, [columnIndex]: result }
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(message: string | null) {
    error.value = message
  }

  function clearAll() {
    puzzle.value = null
    guesses.value = {}
    results.value = {}
    loading.value = false
    error.value = null
  }

  return {
    puzzle,
    guesses,
    results,
    loading,
    error,
    score,
    isComplete,
    activeColumn,
    unlockedUntil,
    isColumnLocked,
    shareString,
    setPuzzle,
    setGuess,
    setLoading,
    setError,
    clearAll,
  }
})
