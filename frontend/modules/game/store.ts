import { defineStore } from 'pinia'
import type { AlbumOption, DailyPuzzle, GuessResult } from './types'

export const useGameStore = defineStore('game', () => {
  const puzzle = ref<DailyPuzzle | null>(null)
  const guesses = ref<Record<number, AlbumOption>>({})
  const results = ref<Record<number, GuessResult>>({})

  const score = computed(() => Object.values(results.value).filter((r) => r === 'correct').length)

  const isComplete = computed(() => {
    if (!puzzle.value) return false
    return Object.keys(results.value).length === puzzle.value.columns.length
  })

  /**
   * Index of the first column without a result yet, or -1 if all are resolved.
   * Used to highlight the "active" column in the UI.
   */
  const activeColumn = computed(() => {
    if (!puzzle.value) return -1
    for (let i = 0; i < puzzle.value.columns.length; i++) {
      if (!results.value[i]) return i
    }
    return -1
  })

  const init = (p: DailyPuzzle) => {
    puzzle.value = p
    guesses.value = {}
    results.value = {}
  }

  const guess = (columnIndex: number, option: AlbumOption): GuessResult | null => {
    if (!puzzle.value) return null
    if (results.value[columnIndex]) return results.value[columnIndex]
    const audio = puzzle.value.columns[columnIndex]?.audio
    if (!audio) return null
    const next: GuessResult = option.previewUrl === audio ? 'correct' : 'wrong'
    guesses.value = { ...guesses.value, [columnIndex]: option }
    results.value = { ...results.value, [columnIndex]: next }
    return next
  }

  const reset = () => {
    guesses.value = {}
    results.value = {}
  }

  /**
   * Wordle-style summary: "Trackle Rock #42  ✅✅❌"
   */
  const shareString = computed(() => {
    if (!puzzle.value) return ''
    const flavorName = puzzle.value.flavor.name
    const day = puzzle.value.day
    const tiles = puzzle.value.columns
      .map((_c, i) => (results.value[i] === 'correct' ? '🟢' : results.value[i] === 'wrong' ? '🔴' : '⬜'))
      .join('')
    return `Trackle ${flavorName} #${day}  ${tiles}`
  })

  return {
    puzzle,
    guesses,
    results,
    score,
    isComplete,
    activeColumn,
    shareString,
    init,
    guess,
    reset,
  }
})
