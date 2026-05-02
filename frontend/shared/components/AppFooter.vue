<template>
  <footer class="app-footer">
    <span>
      Music data and audio previews provided by
      <a href="https://www.apple.com/itunes/" target="_blank" rel="noreferrer noopener">Apple Inc. (iTunes)</a>
      · Trackle — study project
    </span>
  </footer>
</template>

<style scoped lang="sass">
.app-footer
  flex-shrink: 0
  height: 28px
  display: flex
  align-items: center
  justify-content: center
  padding: 0 var(--space-3)
  color: var(--color-text-muted)
  font-size: 11px
  border-top: 1px solid var(--color-border)
  background-color: var(--color-bg)
  text-align: center

  a
    color: var(--color-text-muted)
    text-decoration: underline

    &:hover
      color: var(--color-primary)
</style>
