<script setup lang="ts">
import { useFlavorsStore } from '~/modules/flavors/store'
import { flavorsApi } from '~/modules/flavors/api'
import FlavorCard from '~/modules/flavors/components/FlavorCard.vue'

const store = useFlavorsStore()

await useAsyncData('flavors', async () => {
  if (store.flavors.length === 0) await flavorsApi.list()
  return store.flavors
})
</script>

<template>
  <section class="home">
    <header class="hero">
      <h1 class="title">Today's Trackle</h1>
      <p class="subtitle">Pick a flavor. Listen. Guess the song.</p>
    </header>

    <div v-if="store.error" class="error" role="alert">
      Couldn't reach the API: {{ store.error }}
    </div>

    <div v-else-if="store.loading && store.flavors.length === 0" class="skeleton">
      <v-skeleton-loader v-for="n in 3" :key="n" type="list-item-avatar-two-line" />
    </div>

    <ul v-else class="flavor-list">
      <li v-for="f in store.flavors" :key="f.id">
        <FlavorCard :flavor="f" />
      </li>
    </ul>
  </section>
</template>

<style scoped lang="sass">
.home
  display: flex
  flex-direction: column
  gap: var(--space-8)
  padding: var(--space-6) 0

.hero
  text-align: center

.title
  margin: 0
  font-size: var(--font-2xl)
  letter-spacing: -0.02em

.subtitle
  margin: var(--space-2) 0 0
  color: var(--color-text-muted)

.flavor-list
  list-style: none
  margin: 0
  padding: 0
  display: flex
  flex-direction: column
  gap: var(--space-3)

.error
  padding: var(--space-4)
  border-radius: var(--radius-md)
  background-color: var(--color-primary-soft)
  color: var(--color-text)
  text-align: center

.skeleton
  display: flex
  flex-direction: column
  gap: var(--space-3)
</style>
