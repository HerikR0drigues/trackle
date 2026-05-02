import type { Flavor } from '@prisma/client'
import { prisma } from '../lib/prisma'

export type FlavorSummary = Pick<Flavor, 'id' | 'name' | 'description'>

export const flavorRepository = {
  findAllSummaries(): Promise<FlavorSummary[]> {
    return prisma.flavor.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    })
  },

  findById(id: string): Promise<Flavor | null> {
    return prisma.flavor.findUnique({ where: { id } })
  },
}

export type FlavorRepository = typeof flavorRepository
