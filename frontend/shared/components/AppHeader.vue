<script setup lang="ts">
import ThemeToggle from '~/shared/components/ThemeToggle.vue'
import StreakBadge from '~/modules/stats/components/StreakBadge.vue'
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <NuxtLink to="/" class="brand">
        <span class="dot dot-1" />
        <span class="dot dot-2" />
        <span class="dot dot-3" />
        <span class="brand-name">trackle</span>
      </NuxtLink>
      <div class="actions">
        <StreakBadge />
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>

<style scoped lang="sass">
.app-header
  border-bottom: 1px solid var(--color-border)
  background-color: var(--color-bg)
  flex-shrink: 0

.header-inner
  display: flex
  align-items: center
  justify-content: space-between
  width: 100%
  max-width: var(--max-width-page)
  margin: 0 auto
  padding: var(--space-2) var(--space-4)

.brand
  display: inline-flex
  align-items: center
  gap: var(--space-2)
  color: var(--color-text)
  font-weight: 700
  font-size: var(--font-md)
  text-decoration: none

  &:hover
    text-decoration: none
    color: var(--color-text)

.dot
  width: 10px
  height: 22px
  border-radius: var(--radius-sm)
  background-color: var(--color-primary)

  &.dot-2
    height: 18px
    opacity: 0.8

  &.dot-3
    height: 14px
    opacity: 0.55

.brand-name
  margin-left: var(--space-1)
  letter-spacing: -0.01em

.actions
  display: flex
  align-items: center
  gap: var(--space-2)
</style>
