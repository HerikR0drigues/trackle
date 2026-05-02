import { defineStore } from 'pinia'
import type { Flavor } from './types'

export const useFlavorsStore = defineStore('flavors', () => {
  const flavors = ref<Flavor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function setFlavors(value: Flavor[]) {
    flavors.value = value
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(message: string | null) {
    error.value = message
  }

  function clearAll() {
    flavors.value = []
    loading.value = false
    error.value = null
  }

  return { flavors, loading, error, setFlavors, setLoading, setError, clearAll }
})
