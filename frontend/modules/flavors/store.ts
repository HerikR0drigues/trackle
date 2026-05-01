import { defineStore } from 'pinia'
import { fetchFlavors } from './api'
import type { Flavor } from './types'

export const useFlavorsStore = defineStore('flavors', () => {
  const flavors = ref<Flavor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const load = async (): Promise<Flavor[]> => {
    if (flavors.value.length > 0) return flavors.value
    loading.value = true
    error.value = null
    const res = await fetchFlavors()
    if (res.value) {
      flavors.value = res.value
    } else {
      error.value = res.message
    }
    loading.value = false
    return flavors.value
  }

  return { flavors, loading, error, load }
})
