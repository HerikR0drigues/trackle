<script setup lang="ts">
import { useStatsStore } from '~/modules/stats/store'

const stats = useStatsStore()

onMounted(() => stats.hydrate())

// Hide entirely until hydrated to avoid SSR mismatch (server has 0).
const visible = computed(() => stats.hydrated && stats.currentStreak > 0)
</script>

<template>
  <ClientOnly>
    <span v-if="visible" class="streak-badge" :title="`Max streak: ${stats.maxStreak}`">
      <v-icon size="16" class="icon">mdi-fire</v-icon>
      {{ stats.currentStreak }}
    </span>
  </ClientOnly>
</template>

<style scoped lang="sass">
.streak-badge
  display: inline-flex
  align-items: center
  gap: var(--space-1)
  padding: 4px 10px
  border-radius: var(--radius-pill)
  background-color: var(--color-primary-soft)
  color: var(--color-primary)
  font-weight: 600
  font-size: var(--font-sm)

.icon
  color: inherit
</style>
