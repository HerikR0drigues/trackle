import { createVuetify, type ThemeDefinition } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const trackleLight: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#f5f5f7',
    surface: '#ececef',
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    error: '#ef4444',
    info: '#7c3aed',
    success: '#10b981',
    warning: '#f59e0b',
    'on-background': '#0a0a0a',
    'on-surface': '#0a0a0a',
    'on-primary': '#ffffff',
  },
}

const trackleDark: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0a0a0a',
    surface: '#161616',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    error: '#f87171',
    info: '#8b5cf6',
    success: '#34d399',
    warning: '#fbbf24',
    'on-background': '#f5f5f7',
    'on-surface': '#f5f5f7',
    'on-primary': '#ffffff',
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  // Read cookie at plugin time so SSR renders with the correct theme already.
  const cookie = useCookie<'light' | 'dark'>('trackle-theme', { default: () => 'dark' })
  const initial = cookie.value === 'light' ? 'trackleLight' : 'trackleDark'

  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    theme: {
      defaultTheme: initial,
      themes: { trackleLight, trackleDark },
    },
    defaults: {
      VBtn: { rounded: 'md', class: 'text-none', style: 'letter-spacing: 0.01em' },
      VCard: { rounded: 'lg' },
      VDialog: { transition: false },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
