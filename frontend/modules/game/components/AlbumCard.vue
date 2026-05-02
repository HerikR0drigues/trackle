<script setup lang="ts">
import type { AlbumOption } from '~/modules/game/types'

type CardState = 'idle' | 'correct' | 'wrong' | 'locked'

const props = defineProps<{
  option: AlbumOption
  state: CardState
}>()

const emit = defineEmits<{ (e: 'select', option: AlbumOption): void }>()

const onClick = () => {
  if (props.state === 'idle') emit('select', props.option)
}

const stateClass = computed(() => `state-${props.state}`)
</script>

<template>
  <button
    type="button"
    class="album-card"
    :class="stateClass"
    :disabled="state !== 'idle'"
    :aria-label="`${option.songTitle} by ${option.artist}`"
    @click="onClick"
  >
    <img :src="option.albumCover" :alt="`${option.album} — ${option.artist}`" loading="lazy" />
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
    box-shadow: 0 0 0 2px var(--color-success), var(--shadow-sm)
    cursor: default

  &.state-wrong
    cursor: default
    img
      opacity: 0.5
      filter: grayscale(0.7)

  &.state-locked
    cursor: not-allowed
    img
      opacity: 0.35
      filter: grayscale(0.4)
</style>
