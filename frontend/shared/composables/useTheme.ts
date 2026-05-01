import { useTheme as useVuetifyTheme } from 'vuetify'
import { useThemeStore, type ThemeMode } from '~/shared/stores/theme'

const COOKIE_KEY = 'musicle-theme'
const VUETIFY_NAME = { light: 'musicleLight', dark: 'musicleDark' } as const

/**
 * Single source of truth for theme:
 *   - Pinia store holds reactive `mode`
 *   - Vuetify theme name kept in sync so v-* components recolor
 *   - Cookie persists across reloads (SSR-safe — no FOUC since the cookie
 *     is read on the server during the initial render)
 */
export const useTheme = () => {
  const store = useThemeStore()
  const cookie = useCookie<ThemeMode>(COOKIE_KEY, {
    default: () => 'dark',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
  const vuetify = useVuetifyTheme()

  // First call: hydrate store from cookie (works on server and client).
  if (store.mode !== cookie.value) {
    store.setMode(cookie.value)
  }

  const apply = (next: ThemeMode) => {
    store.setMode(next)
    cookie.value = next
    vuetify.global.name.value = VUETIFY_NAME[next]
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next)
    }
  }

  // Keep Vuetify in sync if mode changes elsewhere.
  watch(
    () => store.mode,
    (next) => {
      if (vuetify.global.name.value !== VUETIFY_NAME[next]) {
        vuetify.global.name.value = VUETIFY_NAME[next]
      }
    },
    { immediate: true },
  )

  const toggle = () => apply(store.mode === 'dark' ? 'light' : 'dark')

  return {
    mode: computed(() => store.mode),
    toggle,
    setMode: apply,
  }
}
