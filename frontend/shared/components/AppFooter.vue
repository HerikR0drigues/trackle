<template>
  <footer class="app-footer">
    <p class="attribution">
      Music data and audio previews provided by
      <a href="https://www.apple.com/itunes/" target="_blank" rel="noreferrer noopener">Apple Inc. (iTunes)</a>.
    </p>
    <p class="meta">
      Musicle clone — study project. Inspired by
      <a href="https://www.musicle.app/" target="_blank" rel="noreferrer noopener">musicle.app</a>.
    </p>
  </footer>
</template>

<style scoped lang="sass">
.app-footer
  padding: var(--space-6)
  text-align: center
  color: var(--color-text-muted)
  font-size: var(--font-xs)
  border-top: 1px solid var(--color-border)
  background-color: var(--color-surface)

.attribution, .meta
  margin: 0

.meta
  margin-top: var(--space-1)
  opacity: 0.8
</style>
