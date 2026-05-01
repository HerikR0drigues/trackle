import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Phase 3 will replace this with full theme config (musicleLight / musicleDark).
export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    ssr: true,
  })
  nuxtApp.vueApp.use(vuetify)
})
