<script setup lang="ts">
import { useGameStore } from '~/modules/game/store'
import { gameApi } from '~/modules/game/api'
import { useAudio } from '~/shared/composables/useAudio'
import GameBoard from '~/modules/game/components/GameBoard.vue'
// import ResultModal from '~/modules/stats/components/ResultModal.vue'

const props = defineProps<{ flavorId: string }>()

const game = useGameStore()
const audio = useAudio()

onMounted(() => {
  const first = game.puzzle?.columns[0]
  if (first?.audio) audio.play(first.audio)
})

onBeforeUnmount(() => {
  audio.pause()
})

await useAsyncData(`puzzle:${props.flavorId}`, async () => {
  await gameApi.fetchDailyPuzzle({ flavor: props.flavorId })
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
        <span v-if="game.puzzle" class="dot-sep">·</span>
        <span v-if="game.puzzle" class="desc">{{ game.puzzle.flavor.description }}</span>
      </h1>
    </header>

    <div v-if="game.error" class="error" role="alert">
      Couldn't load today's puzzle: {{ game.error }}
    </div>

    <GameBoard v-else class="board-area" />

    <!-- <ResultModal /> -->
  </section>
</template>

<style scoped lang="sass">
.play
  display: flex
  flex-direction: column
  gap: var(--space-2)
  height: 100%
  min-height: 0

.header
  flex-shrink: 0
  text-align: center
  padding: var(--space-1) 0

.title
  margin: 0
  font-size: var(--font-lg)
  letter-spacing: -0.01em
  display: inline-flex
  align-items: baseline
  gap: var(--space-2)
  flex-wrap: wrap
  justify-content: center

.day
  color: var(--color-text-muted)
  font-size: var(--font-md)
  font-weight: 500

.dot-sep
  color: var(--color-text-muted)

.desc
  color: var(--color-text-muted)
  font-size: var(--font-sm)
  font-weight: 400

.error
  padding: var(--space-3)
  border-radius: var(--radius-md)
  background-color: var(--color-primary-soft)
  text-align: center

.board-area
  flex: 1 1 auto
  min-height: 0
</style>
