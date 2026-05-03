/**
 * One-shot cleanup: removes duplicate Track rows where (artist, title) refer
 * to the same song across different albums/versions.
 *
 * Strategy:
 *   - Groups tracks by `songKey` (normalized artist::title).
 *   - Keeps the earliest-year track per group (likely the original release).
 *     Ties broken by oldest fetchedAt.
 *   - Deletes the rest.
 *
 * Usage: `npx ts-node --transpile-only scripts/dedupeTracks.ts`
 *
 * Safe to re-run: idempotent (a clean DB has nothing to delete).
 */
import 'dotenv/config'
import { PrismaClient, type Track } from '@prisma/client'

const prisma = new PrismaClient()

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .replaceAll(/\(.*?\)|\[.*?\]/g, '')
    .replaceAll(/\s*-\s*(remaster(ed)?|live|radio edit|instrumental|deluxe|mono|stereo|version).*/gi, '')
    .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const songKey = (t: Track): string => `${normalize(t.artist)}::${normalize(t.title)}`

const pickCanonical = (group: Track[]): Track => {
  return [...group].sort((a, b) => {
    const ay = a.year ?? 9999
    const by = b.year ?? 9999
    if (ay !== by) return ay - by
    return a.fetchedAt.getTime() - b.fetchedAt.getTime()
  })[0]
}

const main = async (): Promise<void> => {
  const tracks = await prisma.track.findMany()
  console.log(`[dedupe] inspecting ${tracks.length} tracks`)

  const groups = new Map<string, Track[]>()
  for (const t of tracks) {
    const key = songKey(t)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }

  const toDelete: string[] = []
  for (const [, group] of groups) {
    if (group.length === 1) continue
    const keep = pickCanonical(group)
    for (const t of group) {
      if (t.id !== keep.id) toDelete.push(t.id)
    }
  }

  console.log(
    `[dedupe] ${groups.size} unique songs, ${tracks.length - groups.size} duplicates → deleting ${toDelete.length}`,
  )

  if (toDelete.length === 0) {
    console.log('[dedupe] nothing to do.')
    return
  }

  const result = await prisma.track.deleteMany({ where: { id: { in: toDelete } } })
  console.log(`[dedupe] deleted ${result.count} rows.`)

  const remaining = await prisma.track.count()
  console.log(`[dedupe] tracks remaining: ${remaining}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
