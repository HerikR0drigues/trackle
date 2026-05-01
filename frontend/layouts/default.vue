<script setup lang="ts">
import AppShell from '~/shared/components/AppShell.vue'
</script>

<template>
  <v-app>
    <AppShell>
      <slot />
    </AppShell>
  </v-app>
</template>
