<script setup lang="ts">
import { gameApi } from '~/modules/game/api'
import { useGameStore } from '~/modules/game/store'
import { useAudio } from '~/shared/composables/useAudio'
import type { AlbumOption, GuessResult } from '~/modules/game/types'

const props = defineProps<{
  open: boolean
  option: AlbumOption | null
  columnIndex: number
  viewOnly?: boolean
}>()

const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const game = useGameStore()
const audio = useAudio()
const result = ref<GuessResult | null>(null)

watch(
  () => props.open,
  (isOpen, wasOpen) => {
    if (isOpen) {
      result.value = null
      return
    }
    if (!wasOpen) return
    if (!result.value) return
    if (!game.puzzle) return
    const nextIdx = game.unlockedUntil
    if (nextIdx < game.puzzle.columns.length) {
      audio.play(game.puzzle.columns[nextIdx].audio)
    } else {
      audio.pause()
    }
  },
)

const dialogModel = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const phase = computed(() => {
  if (result.value) return 'reveal'
  if (props.viewOnly) return 'view'
  return 'confirm'
})

const correctOption = computed<AlbumOption | null>(() => {
  if (!game.puzzle) return null
  const col = game.puzzle.columns[props.columnIndex]
  if (!col) return null
  return col.options.find((o) => o.previewUrl === col.audio) ?? null
})

const confirm = () => {
  if (!props.option) return
  result.value = gameApi.submitGuess(props.columnIndex, props.option)
}

const close = () => emit('update:open', false)
</script>

<template>
  <v-dialog v-model="dialogModel" max-width="320" :transition="false">
    <div v-if="option" class="guess-card">
      <button type="button" class="close-x" aria-label="Close" @click="close">
        <v-icon size="16">mdi-close</v-icon>
      </button>

      <img class="cover" :src="option.albumCover" :alt="`${option.album} — ${option.artist}`" />

      <div class="meta">
        <strong class="song">{{ option.songTitle }}</strong>
        <span class="artist">{{ option.artist }}</span>
        <span class="album">{{ option.album }}<span v-if="option.year"> · {{ option.year }}</span></span>
      </div>

      <button v-if="phase === 'confirm'" type="button" class="confirm-btn" @click="confirm">
        Is this it?
      </button>

      <div
        v-else-if="phase === 'reveal'"
        class="reveal"
        :class="result === 'correct' ? 'reveal-correct' : 'reveal-wrong'"
      >
        <div class="reveal-banner">
          <v-icon size="20">{{ result === 'correct' ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
          <span>{{ result === 'correct' ? 'Correct!' : 'Wrong' }}</span>
        </div>
        <p v-if="result === 'correct'" class="reveal-text">Nice ear. Move on.</p>
        <p v-else-if="correctOption" class="reveal-text">
          The correct one was <strong>{{ correctOption.songTitle }}</strong> by
          <strong>{{ correctOption.artist }}</strong>.
        </p>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped lang="sass">
.guess-card
  position: relative
  background-color: var(--color-surface)
  border-radius: var(--radius-lg)
  padding: var(--space-3)
  display: flex
  flex-direction: column
  gap: var(--space-3)

.close-x
  position: absolute
  top: calc(var(--space-3) + 2px)
  right: calc(var(--space-3) + 2px)
  width: 28px
  height: 28px
  border: none
  border-radius: 50%
  background-color: rgba(0, 0, 0, 0.45)
  color: #fff
  cursor: pointer
  display: flex
  align-items: center
  justify-content: center
  padding: 0
  z-index: 2
  backdrop-filter: blur(4px)
  -webkit-backdrop-filter: blur(4px)
  transition: background-color var(--duration-fast), transform var(--duration-fast)

  &:hover
    background-color: rgba(0, 0, 0, 0.65)
    transform: scale(1.05)

  &:focus-visible
    outline: 2px solid var(--color-primary)
    outline-offset: 2px

.cover
  width: 100%
  aspect-ratio: 1 / 1
  object-fit: cover
  border-radius: var(--radius-md)
  display: block

.meta
  display: flex
  flex-direction: column
  gap: 2px
  text-align: center

.song
  font-size: var(--font-md)
  color: var(--color-text)
  line-height: 1.2

.artist
  font-size: var(--font-sm)
  color: var(--color-text)
  font-weight: 500

.album
  font-size: var(--font-xs)
  color: var(--color-text-muted)

.confirm-btn
  border: none
  border-radius: var(--radius-md)
  padding: var(--space-3) var(--space-4)
  background-color: var(--color-primary)
  color: #fff
  font-size: var(--font-md)
  font-weight: 600
  cursor: pointer
  transition: background-color var(--duration-base), transform var(--duration-fast)

  &:hover
    background-color: var(--color-primary-hover)
    transform: translateY(-1px)

.reveal
  display: flex
  flex-direction: column
  gap: var(--space-2)
  align-items: stretch

.reveal-banner
  display: inline-flex
  align-items: center
  justify-content: center
  gap: var(--space-2)
  padding: var(--space-2) var(--space-3)
  border-radius: var(--radius-md)
  font-weight: 700

.reveal-correct .reveal-banner
  background-color: color-mix(in srgb, var(--color-success) 20%, transparent)
  color: var(--color-success)

.reveal-wrong .reveal-banner
  background-color: color-mix(in srgb, var(--color-danger) 20%, transparent)
  color: var(--color-danger)

.reveal-text
  margin: 0
  font-size: var(--font-sm)
  color: var(--color-text)
  text-align: center
</style>
