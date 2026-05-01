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
      :is-active="game.activeColumn === idx"
    />
  </div>
</template>

<style scoped lang="sass">
@use '~/styles/mixins' as m

.board
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: var(--space-4)

  @include m.until-mobile
    grid-template-columns: 1fr
</style>
