import type { SeedTerm } from '@prisma/client'
import { prisma } from '../lib/prisma'

export const seedTermRepository = {
  count(): Promise<number> {
    return prisma.seedTerm.count()
  },

  findPendingOrFailed(flavorId: string): Promise<SeedTerm[]> {
    return prisma.seedTerm.findMany({
      where: { flavorId, status: { in: ['pending', 'failed'] } },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    })
  },

  async countByStatus(flavorId: string): Promise<Record<string, number>> {
    const rows = await prisma.seedTerm.groupBy({
      by: ['status'],
      where: { flavorId },
      _count: true,
    })
    return Object.fromEntries(rows.map((r) => [r.status, r._count]))
  },

  markSuccess(id: string, tracksFound: number) {
    return prisma.seedTerm.update({
      where: { id },
      data: {
        status: 'success',
        tracksFound,
        lastTriedAt: new Date(),
        lastError: null,
      },
    })
  },

  markFailed(id: string, error: string) {
    return prisma.seedTerm.update({
      where: { id },
      data: {
        status: 'failed',
        lastTriedAt: new Date(),
        lastError: error.slice(0, 500),
      },
    })
  },

  async bulkInsert(rows: Array<{ flavorId: string; term: string }>): Promise<number> {
    const result = await prisma.seedTerm.createMany({
      data: rows,
      skipDuplicates: true,
    })
    return result.count
  },
}

export type SeedTermRepository = typeof seedTermRepository
