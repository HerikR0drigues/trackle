<script setup lang="ts">
import ThemeToggle from '~/shared/components/ThemeToggle.vue'
</script>

<template>
  <header class="app-header">
    <NuxtLink to="/" class="brand">
      <span class="dot dot-1" />
      <span class="dot dot-2" />
      <span class="dot dot-3" />
      <span class="brand-name">musicle</span>
    </NuxtLink>
    <div class="actions">
      <ThemeToggle />
    </div>
  </header>
</template>

<style scoped lang="sass">
@use '~/styles/mixins' as m

.app-header
  display: flex
  align-items: center
  justify-content: space-between
  padding: var(--space-4) var(--space-6)
  border-bottom: 1px solid var(--color-border)
  background-color: var(--color-surface)

.brand
  display: inline-flex
  align-items: center
  gap: var(--space-2)
  color: var(--color-text)
  font-weight: 700
  font-size: var(--font-lg)
  text-decoration: none

  &:hover
    text-decoration: none
    color: var(--color-text)

.dot
  width: 12px
  height: 28px
  border-radius: var(--radius-sm)
  background-color: var(--color-primary)

  &.dot-2
    height: 22px
    opacity: 0.8

  &.dot-3
    height: 16px
    opacity: 0.55

.brand-name
  margin-left: var(--space-2)
  letter-spacing: -0.01em

.actions
  display: flex
  align-items: center
  gap: var(--space-2)
</style>
