<script setup lang="ts">
useSeoMeta({
  title: 'Musicle — daily music quiz',
})
</script>

<template>
  <section class="home">
    <h1 class="title">musicle</h1>
    <p class="subtitle">A daily music quiz. Listen, then guess the song.</p>
    <p class="muted">Phase 4 lists the available flavors here.</p>
  </section>
</template>

<style scoped lang="sass">
.home
  text-align: center
  padding: var(--space-12) 0

.title
  font-size: var(--font-2xl)
  font-weight: 700
  margin: 0 0 var(--space-2)
  letter-spacing: -0.02em

.subtitle
  font-size: var(--font-lg)
  margin: 0 0 var(--space-8)
  color: var(--color-text)

.muted
  color: var(--color-text-muted)
  font-size: var(--font-sm)
</style>
