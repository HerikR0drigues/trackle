<script setup lang="ts">
import { useGameStore } from '~/modules/game/store'
import GameColumn from '~/modules/game/components/GameColumn.vue'

const game = useGameStore()
</script>

<template>
  <div v-if="game.puzzle" class="board">
    <GameColumn
      v-for="(col, idx) in game.puzzle.columns"
      :key="idx"
      :column="col"
      :column-index="idx"
      :is-locked="game.isColumnLocked(idx)"
    />
  </div>
</template>

<style scoped lang="sass">
@use '~/styles/mixins' as m

.board
  display: grid
  grid-template-columns: repeat(3, minmax(0, max-content))
  justify-content: center
  gap: var(--space-3)
  height: 100%
  min-height: 0

  @include m.until-mobile
    grid-template-columns: repeat(3, minmax(0, 1fr))
    gap: var(--space-2)
    height: auto
    width: 100%
</style>
