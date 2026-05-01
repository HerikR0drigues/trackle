<script setup lang="ts">
import type { Flavor } from '~/modules/flavors/types'

defineProps<{ flavor: Flavor }>()
</script>

<template>
  <NuxtLink :to="`/play/${flavor.id}`" class="flavor-card">
    <div class="badge">
      <v-icon size="20" color="primary">mdi-play</v-icon>
    </div>
    <div class="content">
      <h2 class="name">{{ flavor.name }}</h2>
      <p class="desc">{{ flavor.description }}</p>
    </div>
    <v-icon size="22" class="chevron">mdi-chevron-right</v-icon>
  </NuxtLink>
</template>

<style scoped lang="sass">
.flavor-card
  display: flex
  align-items: center
  gap: var(--space-4)
  padding: var(--space-5) var(--space-6)
  background-color: var(--color-surface)
  border: 1px solid var(--color-border)
  border-radius: var(--radius-lg)
  text-decoration: none
  color: var(--color-text)
  transition: transform var(--duration-fast), border-color var(--duration-base), box-shadow var(--duration-base)

  &:hover
    border-color: var(--color-primary)
    box-shadow: var(--shadow-md)
    transform: translateY(-2px)
    text-decoration: none
    color: var(--color-text)

.badge
  width: 48px
  height: 48px
  border-radius: var(--radius-pill)
  background-color: var(--color-primary-soft)
  display: flex
  align-items: center
  justify-content: center
  flex-shrink: 0

.content
  flex: 1
  min-width: 0

.name
  margin: 0
  font-size: var(--font-lg)
  font-weight: 600
  letter-spacing: -0.01em

.desc
  margin: 2px 0 0
  color: var(--color-text-muted)
  font-size: var(--font-sm)

.chevron
  color: var(--color-text-muted)
  flex-shrink: 0
</style>
