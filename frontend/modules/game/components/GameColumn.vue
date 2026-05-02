<script setup lang="ts">
import { useAudio } from '~/shared/composables/useAudio'
import { useGameStore } from '~/modules/game/store'
import AlbumCard from '~/modules/game/components/AlbumCard.vue'
import GuessModal from '~/modules/game/components/GuessModal.vue'
import type { AlbumOption, PuzzleColumn } from '~/modules/game/types'

const props = defineProps<{
  column: PuzzleColumn
  columnIndex: number
  isLocked: boolean
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

const togglePlay = () => {
  if (props.isLocked) return
  audio.toggle(props.column.audio)
}

const modalOpen = ref(false)
const modalOption = ref<AlbumOption | null>(null)

const openGuess = (option: AlbumOption) => {
  if (props.isLocked || result.value) return
  modalOption.value = option
  modalOpen.value = true
}
</script>

<template>
  <section
    class="game-col"
    :class="{
      active: isPlaying,
      resolved: !!result,
      locked: isLocked,
    }"
  >
    <button
      type="button"
      class="play-btn"
      :aria-label="isPlaying ? 'Pause preview' : 'Play preview'"
      :disabled="isLocked"
      @click="togglePlay"
    >
      <v-icon size="22">{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
    </button>

    <div class="cards">
      <AlbumCard
        v-for="opt in column.options"
        :key="opt.id"
        :option="opt"
        :state="cardState(opt.id)"
        @select="openGuess"
      />
    </div>

    <div v-if="isLocked" class="lock-overlay" aria-hidden="true">
      <v-icon size="36" class="lock-icon">mdi-lock-outline</v-icon>
    </div>

    <GuessModal
      v-model:open="modalOpen"
      :option="modalOption"
      :column-index="columnIndex"
    />
  </section>
</template>

<style scoped lang="sass">
@use '~/styles/mixins' as m

.game-col
  position: relative
  display: grid
  grid-template-rows: auto 1fr
  gap: var(--space-3)
  padding: var(--space-4)
  background-color: var(--color-surface)
  border: 2px solid transparent
  border-radius: var(--radius-md)
  transition: border-color var(--duration-base)
  min-height: 0
  width: max-content

  &.active
    border-color: var(--color-primary)
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 30%, transparent)

  &.resolved
    opacity: 0.96

.play-btn
  width: 40px
  height: 40px
  border-radius: var(--radius-pill)
  border: none
  cursor: pointer
  background-color: var(--color-primary)
  color: #fff
  justify-self: center
  display: flex
  align-items: center
  justify-content: center
  box-shadow: var(--shadow-sm)
  transition: transform var(--duration-fast), background-color var(--duration-base)

  &:hover:not(:disabled)
    background-color: var(--color-primary-hover)
    transform: scale(1.05)

  &:disabled
    opacity: 0.4
    cursor: not-allowed

  &:focus-visible
    outline: 2px solid var(--color-primary)
    outline-offset: 3px

.cards
  display: grid
  grid-template-columns: minmax(0, max-content)
  grid-auto-rows: minmax(0, 1fr)
  gap: var(--space-2)
  min-height: 0
  justify-items: center
  align-items: center
  justify-content: center

.lock-overlay
  position: absolute
  inset: 0
  border-radius: var(--radius-md)
  background-color: var(--color-surface)
  display: flex
  align-items: center
  justify-content: center
  pointer-events: auto
  z-index: 2

.lock-icon
  color: var(--color-text-muted)
  opacity: 0.7

@include m.until-mobile
  .game-col
    min-height: 60vh
</style>
