import type { Track } from '@prisma/client'
import { prisma } from '../lib/prisma'

export const trackRepository = {
  findByFlavorId(flavorId: string): Promise<Track[]> {
    return prisma.track.findMany({
      where: { flavorId },
      orderBy: { id: 'asc' },
    })
  },
}

export type TrackRepository = typeof trackRepository
