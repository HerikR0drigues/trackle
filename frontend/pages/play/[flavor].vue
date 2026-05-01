<script setup lang="ts">
import PlayView from '~/modules/game/views/PlayView.vue'

const route = useRoute()
const flavorId = computed(() => String(route.params.flavor))
</script>

<template>
  <PlayView :flavor-id="flavorId" />
</template>
