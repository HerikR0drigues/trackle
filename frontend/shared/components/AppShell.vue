<script setup lang="ts">
import AppHeader from '~/shared/components/AppHeader.vue'
import AppFooter from '~/shared/components/AppFooter.vue'
import { useTheme } from '~/shared/composables/useTheme'

// Initialise theme + sync data-theme attribute on <html>.
const { mode } = useTheme()
useHead({
  htmlAttrs: { 'data-theme': mode },
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped lang="sass">
.app-shell
  display: flex
  flex-direction: column
  min-height: 100vh

.app-main
  flex: 1
  width: 100%
  max-width: var(--max-width-page)
  margin: 0 auto
  padding: var(--space-6) var(--space-6)
</style>
