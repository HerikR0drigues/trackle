<script setup lang="ts">
import AppHeader from '~/shared/components/AppHeader.vue'
import AppFooter from '~/shared/components/AppFooter.vue'
import AppSnackbar from '~/shared/components/AppSnackbar.vue'
import { useTheme } from '~/shared/composables/useTheme'

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
    <AppSnackbar />
  </div>
</template>

<style scoped lang="sass">
@use '~/styles/mixins' as m

.app-shell
  display: flex
  flex-direction: column
  height: 100vh
  overflow: hidden

.app-main
  flex: 1 1 auto
  width: 100%
  max-width: var(--max-width-page)
  margin: 0 auto
  padding: var(--space-3) var(--space-4)
  min-height: 0
  overflow: hidden

  @include m.until-mobile
    overflow-y: auto
    padding: var(--space-3)
</style>
