import { prisma } from '../lib/prisma'

export const dailyPuzzleCacheRepository = {
  async findPayload(flavorId: string, date: string): Promise<unknown | null> {
    const row = await prisma.dailyPuzzleCache.findUnique({
      where: { flavorId_date: { flavorId, date } },
    })
    return row?.payload ?? null
  },

  async save(flavorId: string, date: string, payload: object): Promise<void> {
    await prisma.dailyPuzzleCache.create({
      data: { flavorId, date, payload },
    })
  },
}

export type DailyPuzzleCacheRepository = typeof dailyPuzzleCacheRepository
