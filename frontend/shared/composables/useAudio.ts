/**
 * Tiny singleton audio controller. Only one preview plays at a time across
 * all columns. Reactive `currentUrl` lets components show their playing state
 * without each instantiating its own HTMLAudioElement.
 */
const currentUrl = ref<string | null>(null)
const isPlaying = ref(false)

let audioEl: HTMLAudioElement | null = null

const ensureAudio = (): HTMLAudioElement => {
  if (audioEl) return audioEl
  audioEl = new Audio()
  audioEl.preload = 'none'
  audioEl.addEventListener('ended', () => {
    isPlaying.value = false
  })
  audioEl.addEventListener('pause', () => {
    isPlaying.value = false
  })
  audioEl.addEventListener('play', () => {
    isPlaying.value = true
  })
  return audioEl
}

export const useAudio = () => {
  const play = (url: string) => {
    if (typeof window === 'undefined') return
    const el = ensureAudio()
    if (currentUrl.value !== url) {
      el.pause()
      el.src = url
      currentUrl.value = url
    }
    void el.play().catch((err) => {
      console.warn('[useAudio] play() failed:', err)
      isPlaying.value = false
    })
  }

  const pause = () => {
    audioEl?.pause()
  }

  const toggle = (url: string) => {
    if (currentUrl.value === url && isPlaying.value) {
      pause()
    } else {
      play(url)
    }
  }

  const isPlayingUrl = (url: string) => currentUrl.value === url && isPlaying.value

  return {
    currentUrl: readonly(currentUrl),
    isPlaying: readonly(isPlaying),
    play,
    pause,
    toggle,
    isPlayingUrl,
  }
}
