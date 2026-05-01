import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const musicleLight: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#faf8ff',
    surface: '#ffffff',
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    error: '#ef4444',
    info: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    'on-background': '#1a1325',
    'on-surface': '#1a1325',
    'on-primary': '#ffffff',
  },
}

const musicleDark: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0f0a1a',
    surface: '#1a1428',
    primary: '#a78bfa',
    secondary: '#8b5cf6',
    error: '#f87171',
    info: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    'on-background': '#ede9fe',
    'on-surface': '#ede9fe',
    'on-primary': '#1a1325',
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  // Read cookie at plugin time so SSR renders with the correct theme already.
  const cookie = useCookie<'light' | 'dark'>('musicle-theme', { default: () => 'dark' })
  const initial = cookie.value === 'light' ? 'musicleLight' : 'musicleDark'

  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      defaultTheme: initial,
      themes: { musicleLight, musicleDark },
    },
    defaults: {
      VBtn: { rounded: 'md', class: 'text-none', style: 'letter-spacing: 0.01em' },
      VCard: { rounded: 'lg' },
      VDialog: { transition: 'fade-transition' },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
