<script setup lang="ts">
import { useSnackbarStore, type SnackbarType } from '~/shared/stores/snackbar'

const store = useSnackbarStore()

const current = computed(() => store.queue[0] ?? null)
const open = computed({
  get: () => !!current.value,
  set: (v) => {
    if (!v && current.value) store.remove(current.value.id)
  },
})

const colorOf: Record<SnackbarType, string> = {
  success: 'success',
  info: 'primary',
  warning: 'warning',
  error: 'error',
}

const iconOf: Record<SnackbarType, string> = {
  success: 'mdi-check-circle',
  info: 'mdi-information',
  warning: 'mdi-alert',
  error: 'mdi-alert-circle',
}
</script>

<template>
  <ClientOnly>
    <v-snackbar
      v-if="current"
      v-model="open"
      :color="colorOf[current.type]"
      :timeout="current.timeout"
      location="bottom end"
      variant="elevated"
    >
      <div class="snack">
        <v-icon size="20">{{ iconOf[current.type] }}</v-icon>
        <span>{{ current.text }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" size="small" @click="open = false">Close</v-btn>
      </template>
    </v-snackbar>
  </ClientOnly>
</template>

<style scoped lang="sass">
.snack
  display: inline-flex
  align-items: center
  gap: var(--space-2)
</style>
