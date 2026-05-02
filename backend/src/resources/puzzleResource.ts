/**
 * Resource layer — HTTP boundary for the puzzles endpoints.
 * Validates input with zod, calls the use case, maps domain errors to HTTP.
 */
import type { RequestHandler } from 'express'
import { z } from 'zod'
import { flavorRepository } from '../repositories/flavorRepository'
import { trackRepository } from '../repositories/trackRepository'
import { dailyPuzzleCacheRepository } from '../repositories/dailyPuzzleCacheRepository'
import {
  FlavorNotFoundError,
  InsufficientTracksError,
  makeGetDailyPuzzle,
} from '../usecases/getDailyPuzzle'
import { fail, ok } from '../types/api'

const getDailyPuzzle = makeGetDailyPuzzle({
  flavorRepo: flavorRepository,
  trackRepo: trackRepository,
  cacheRepo: dailyPuzzleCacheRepository,
})

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const dailyQuerySchema = z.object({
  flavor: z.string().min(1).max(64),
  date: z.string().regex(dateRegex).optional(),
})

const todayUtc = (): string => new Date().toISOString().slice(0, 10)

export const puzzleResource = {
  getDaily: <RequestHandler>(async (req, res, next) => {
    const parsed = dailyQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json(fail(400, parsed.error.issues[0]?.message ?? 'Invalid query'))
      return
    }

    const { flavor: flavorId, date } = parsed.data
    try {
      const puzzle = await getDailyPuzzle({ flavorId, date: date ?? todayUtc() })
      res.json(ok(puzzle))
    } catch (err) {
      if (err instanceof FlavorNotFoundError) {
        res.status(404).json(fail(404, err.message))
        return
      }
      if (err instanceof InsufficientTracksError) {
        res.status(422).json(fail(422, err.message))
        return
      }
      next(err)
    }
  }),
}
