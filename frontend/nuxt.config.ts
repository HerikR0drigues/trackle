import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: '2026-05-01',
  devtools: { enabled: true },
  ssr: true,

  modules: ['@pinia/nuxt'],

  css: [
    '@mdi/font/css/materialdesignicons.css',
    'vuetify/styles',
    '~/styles/main.sass',
  ],

  build: {
    transpile: ['vuetify'],
  },

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  hooks: {
    'vite:extendConfig': (config) => {
      config.plugins ??= []
      config.plugins.push(
        vuetify({
          autoImport: true,
          styles: { configFile: 'styles/_vuetify-settings.scss' },
        }),
      )
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
    },
  },

  app: {
    head: {
      title: 'Trackle',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Daily music quiz — guess the song that\'s playing.' },
      ],
    },
  },
})
