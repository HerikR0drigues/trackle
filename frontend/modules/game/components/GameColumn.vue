<script setup lang="ts">
import { useAudio } from '~/shared/composables/useAudio'
import { useGameStore } from '~/modules/game/store'
import { submitGuess } from '~/modules/game/api'
import AlbumCard from '~/modules/game/components/AlbumCard.vue'
import type { PuzzleColumn } from '~/modules/game/types'

const props = defineProps<{
  column: PuzzleColumn
  columnIndex: number
  isActive: boolean
}>()

const game = useGameStore()
const audio = useAudio()

const isPlaying = computed(() => audio.isPlayingUrl(props.column.audio))
const result = computed(() => game.results[props.columnIndex])
const guessedId = computed(() => game.guesses[props.columnIndex]?.id)

const cardState = (optionId: string): 'idle' | 'correct' | 'wrong' | 'locked' => {
  if (!result.value) return 'idle'
  if (guessedId.value !== optionId) return 'locked'
  return result.value
}

const togglePlay = () => audio.toggle(props.column.audio)
</script>

<template>
  <section class="game-col" :class="{ active: isActive, locked: !!result }">
    <button
      type="button"
      class="play-btn"
      :aria-label="isPlaying ? 'Pause preview' : 'Play preview'"
      @click="togglePlay"
    >
      <v-icon size="32">{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
    </button>

    <div class="cards">
      <AlbumCard
        v-for="opt in column.options"
        :key="opt.id"
        :option="opt"
        :state="cardState(opt.id)"
        @select="submitGuess(columnIndex, $event)"
      />
    </div>
  </section>
</template>

<style scoped lang="sass">
@use '~/styles/mixins' as m

.game-col
  display: flex
  flex-direction: column
  gap: var(--space-4)
  padding: var(--space-4)
  background-color: var(--color-surface)
  border: 2px solid transparent
  border-radius: var(--radius-lg)
  transition: border-color var(--duration-base), opacity var(--duration-base)

  &.active
    border-color: var(--color-primary)
    box-shadow: var(--shadow-md)

  &.locked
    opacity: 0.95

.play-btn
  width: 64px
  height: 64px
  border-radius: var(--radius-pill)
  border: none
  cursor: pointer
  background-color: var(--color-primary)
  color: var(--color-surface)
  align-self: center
  display: flex
  align-items: center
  justify-content: center
  box-shadow: var(--shadow-sm)
  transition: transform var(--duration-fast), background-color var(--duration-base)

  &:hover
    background-color: var(--color-primary-hover)
    transform: scale(1.05)

  &:focus-visible
    outline: 2px solid var(--color-primary)
    outline-offset: 3px

.cards
  display: grid
  grid-template-columns: 1fr
  gap: var(--space-3)
</style>
