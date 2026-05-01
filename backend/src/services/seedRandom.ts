/**
 * Deterministic PRNG used by the puzzle generator. Two utilities:
 *
 *   stringHashToU32 — turns "rock|2026-05-01" into a stable 32-bit unsigned int.
 *   mulberry32      — small, well-distributed PRNG seeded by that int.
 *
 * Same input → same output, forever. That is the whole point: the puzzle for
 * a given (flavor, date) pair is reproducible across restarts.
 */

export const stringHashToU32 = (input: string): number => {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pickIndex = (rand: () => number, length: number): number => {
  return Math.floor(rand() * length)
}

/** Fisher–Yates with provided PRNG. */
export const shuffleInPlace = <T>(arr: T[], rand: () => number): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
