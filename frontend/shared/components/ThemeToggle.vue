<script setup lang="ts">
import { useTheme } from '~/shared/composables/useTheme'

const { mode, toggle } = useTheme()
const icon = computed(() => (mode.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'))
const ariaLabel = computed(() => (mode.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'))
</script>

<template>
  <v-btn
    :icon="icon"
    variant="text"
    color="primary"
    :aria-label="ariaLabel"
    @click="toggle"
  />
</template>
