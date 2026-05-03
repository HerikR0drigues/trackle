<script setup lang="ts">
import type { AlbumOption } from '~/modules/game/types'

type CardState = 'idle' | 'correct' | 'wrong' | 'locked' | 'correct-reveal'

const props = defineProps<{
  option: AlbumOption
  state: CardState
}>()

const emit = defineEmits<{ (e: 'select', option: AlbumOption): void }>()

const onClick = () => emit('select', props.option)

const stateClass = computed(() => `state-${props.state}`)
const showCheck = computed(() => props.state === 'correct' || props.state === 'correct-reveal')
const showX = computed(() => props.state === 'wrong')
</script>

<template>
  <button
    type="button"
    class="album-card"
    :class="stateClass"
    :aria-label="`${option.songTitle} by ${option.artist}`"
    @click="onClick"
  >
    <img :src="option.albumCover" :alt="`${option.album} — ${option.artist}`" loading="lazy" />

    <span v-if="showCheck" class="badge badge-correct" aria-hidden="true">
      <v-icon size="20">mdi-check-circle</v-icon>
    </span>
    <span v-else-if="showX" class="badge badge-wrong" aria-hidden="true">
      <v-icon size="20">mdi-close-circle</v-icon>
    </span>
  </button>
</template>

<style scoped lang="sass">
.album-card
  position: relative
  height: 100%
  width: auto
  aspect-ratio: 1 / 1
  max-width: 100%
  max-height: 100%
  padding: 0
  border: none
  background: none
  cursor: pointer
  border-radius: var(--radius-sm)
  overflow: hidden
  transition: transform var(--duration-fast), box-shadow var(--duration-base), opacity var(--duration-base), filter var(--duration-base)

  img
    width: 100%
    height: 100%
    object-fit: cover
    display: block
    border-radius: inherit
    transition: filter var(--duration-base)

  &.state-idle:hover
    transform: scale(1.03)
    box-shadow: var(--shadow-md)

  &.state-idle:focus-visible
    outline: 2px solid var(--color-primary)
    outline-offset: 2px

  &.state-correct
    box-shadow: 0 0 0 4px var(--color-success), var(--shadow-sm)

  &.state-wrong
    box-shadow: 0 0 0 4px var(--color-danger), var(--shadow-sm)
    img
      opacity: 0.7
      filter: grayscale(0.3)

  &.state-correct-reveal
    img
      opacity: 1
      filter: none

  &.state-locked
    img
      opacity: 0.35
      filter: grayscale(0.4)

.badge
  position: absolute
  top: 6px
  right: 6px
  width: 28px
  height: 28px
  border-radius: 50%
  display: flex
  align-items: center
  justify-content: center
  background-color: var(--color-surface)
  box-shadow: var(--shadow-sm)
  z-index: 1

.badge-correct
  color: var(--color-success)

.badge-wrong
  color: var(--color-danger)
</style>
