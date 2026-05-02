<script setup lang="ts">
import { useGameStore } from '~/modules/game/store'
import { useStatsStore } from '~/modules/stats/store'
import { hydrateStats, recordResult } from '~/modules/stats/api'

const game = useGameStore()
const stats = useStatsStore()

const open = ref(false)
const copied = ref(false)

watch(
  () => game.isComplete,
  (done) => {
    if (!done || !game.puzzle) return
    hydrateStats()
    recordResult({
      date: game.puzzle.date,
      flavorId: game.puzzle.flavor.id,
      day: game.puzzle.day,
      score: game.score,
      total: game.puzzle.columns.length,
    })
    open.value = true
  },
)

const total = computed(() => game.puzzle?.columns.length ?? 3)

const copyResult = async () => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(game.shareString)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.warn('clipboard write failed', err)
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="420" persistent>
    <div class="result">
      <header class="head">
        <h2 class="title">{{ game.score === total ? 'Perfect!' : 'Nice try' }}</h2>
        <p class="score">{{ game.score }} / {{ total }}</p>
      </header>

      <div class="streaks">
        <div class="streak-cell">
          <span class="num">{{ stats.currentStreak }}</span>
          <span class="label">Streak</span>
        </div>
        <div class="streak-cell">
          <span class="num">{{ stats.maxStreak }}</span>
          <span class="label">Best</span>
        </div>
        <div class="streak-cell">
          <span class="num">{{ stats.totalPlayed }}</span>
          <span class="label">Played</span>
        </div>
      </div>

      <pre class="share-string">{{ game.shareString }}</pre>

      <div class="actions">
        <v-btn variant="tonal" color="primary" @click="copyResult">
          {{ copied ? 'Copied!' : 'Copy result' }}
        </v-btn>
        <v-btn variant="text" @click="open = false">Close</v-btn>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped lang="sass">
.result
  background-color: var(--color-surface)
  border-radius: var(--radius-lg)
  padding: var(--space-6)
  display: flex
  flex-direction: column
  gap: var(--space-5)

.head
  text-align: center

.title
  margin: 0
  font-size: var(--font-xl)
  letter-spacing: -0.01em

.score
  margin: var(--space-2) 0 0
  font-size: var(--font-lg)
  color: var(--color-primary)
  font-weight: 600

.streaks
  display: grid
  grid-template-columns: repeat(3, 1fr)
  gap: var(--space-3)
  text-align: center

.streak-cell
  display: flex
  flex-direction: column
  gap: 2px
  padding: var(--space-3)
  background-color: var(--color-surface-alt)
  border-radius: var(--radius-md)

.num
  font-size: var(--font-xl)
  font-weight: 700
  color: var(--color-text)

.label
  font-size: var(--font-xs)
  color: var(--color-text-muted)
  text-transform: uppercase
  letter-spacing: 0.05em

.share-string
  margin: 0
  padding: var(--space-3)
  background-color: var(--color-surface-alt)
  border-radius: var(--radius-md)
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace
  font-size: var(--font-sm)
  text-align: center
  white-space: pre-wrap

.actions
  display: flex
  gap: var(--space-3)
  justify-content: flex-end
</style>
