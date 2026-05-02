<script setup lang="ts">
import { useGameStore } from '~/modules/game/store'
import { fetchDailyPuzzle } from '~/modules/game/api'
import GameBoard from '~/modules/game/components/GameBoard.vue'
import ResultModal from '~/modules/stats/components/ResultModal.vue'

const props = defineProps<{ flavorId: string }>()

const game = useGameStore()

await useAsyncData(`puzzle:${props.flavorId}`, async () => {
  await fetchDailyPuzzle({ flavor: props.flavorId })
  return game.puzzle
})

useSeoMeta({
  title: () => (game.puzzle ? `Trackle ${game.puzzle.flavor.name} #${game.puzzle.day}` : 'Trackle'),
})
</script>

<template>
  <section class="play">
    <header class="header">
      <h1 class="title">
        <span class="brand-tail">{{ game.puzzle?.flavor.name ?? '...' }}</span>
        <span v-if="game.puzzle" class="day">#{{ game.puzzle.day }}</span>
      </h1>
      <p class="subtitle">{{ game.puzzle?.flavor.description ?? '' }}</p>
    </header>

    <div v-if="game.error" class="error" role="alert">
      Couldn't load today's puzzle: {{ game.error }}
    </div>

    <template v-else>
      <GameBoard />
      <ResultModal />
    </template>

    <p v-if="game.puzzle && !game.isComplete" class="hint">
      Press play, then pick the album cover that matches what you hear.
    </p>
    <p v-else-if="game.isComplete" class="hint result">
      You scored {{ game.score }} / {{ game.puzzle?.columns.length ?? 3 }}.
    </p>
  </section>
</template>

<style scoped lang="sass">
.play
  display: flex
  flex-direction: column
  gap: var(--space-6)

.header
  text-align: center

.title
  margin: 0
  font-size: var(--font-2xl)
  letter-spacing: -0.02em
  display: inline-flex
  align-items: baseline
  gap: var(--space-3)

.day
  color: var(--color-text-muted)
  font-size: var(--font-lg)
  font-weight: 500

.subtitle
  margin: var(--space-2) 0 0
  color: var(--color-text-muted)

.error
  padding: var(--space-4)
  border-radius: var(--radius-md)
  background-color: var(--color-primary-soft)
  text-align: center

.hint
  text-align: center
  color: var(--color-text-muted)
  margin: var(--space-2) 0 0

  &.result
    color: var(--color-text)
    font-weight: 600
    font-size: var(--font-lg)
</style>
