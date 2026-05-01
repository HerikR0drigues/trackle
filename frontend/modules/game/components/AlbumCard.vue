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
    <div v-if="state === 'correct'" class="overlay correct" aria-hidden="true">
      <v-icon size="32" class="overlay-icon">mdi-check</v-icon>
    </div>
    <div v-else-if="state === 'wrong'" class="overlay wrong" aria-hidden="true">
      <v-icon size="32" class="overlay-icon">mdi-close</v-icon>
    </div>
  </button>
</template>

<style scoped lang="sass">
.album-card
  position: relative
  width: 100%
  aspect-ratio: 1 / 1
  padding: 0
  border: none
  background: none
  cursor: pointer
  border-radius: var(--radius-md)
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
    box-shadow: 0 0 0 3px var(--color-success), var(--shadow-md)
    cursor: default

  &.state-wrong
    cursor: default
    img
      opacity: 0.55
      filter: grayscale(0.7)

  &.state-locked
    cursor: not-allowed
    img
      opacity: 0.4
      filter: grayscale(0.4)

.overlay
  position: absolute
  top: 8px
  right: 8px
  width: 40px
  height: 40px
  border-radius: var(--radius-pill)
  display: flex
  align-items: center
  justify-content: center
  box-shadow: var(--shadow-sm)
  background-color: var(--color-surface)

  &.correct .overlay-icon
    color: var(--color-success)

  &.wrong .overlay-icon
    color: var(--color-danger)
</style>
