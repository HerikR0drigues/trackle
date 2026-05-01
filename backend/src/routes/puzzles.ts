import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ok } from '../types/api'
import { generatePuzzle } from '../services/puzzleGenerator'

const router = Router()

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const dailyQuerySchema = z.object({
  flavor: z.string().min(1).max(64),
  date: z.string().regex(dateRegex).optional(),
})

const todayUtc = (): string => new Date().toISOString().slice(0, 10)

router.get('/daily', async (req, res, next) => {
  try {
    const parsed = dailyQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res
        .status(400)
        .json({ status: 400, value: null, message: parsed.error.issues[0]?.message ?? 'Invalid query' })
    }

    const flavorId = parsed.data.flavor
    const date = parsed.data.date ?? todayUtc()

    const flavor = await prisma.flavor.findUnique({ where: { id: flavorId } })
    if (!flavor) {
      return res.status(404).json({ status: 404, value: null, message: `Flavor "${flavorId}" not found` })
    }

    const puzzle = await generatePuzzle({ flavor, date })
    return res.json(ok(puzzle))
  } catch (err) {
    return next(err)
  }
})

export default router
