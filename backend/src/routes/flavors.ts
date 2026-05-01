import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { ok } from '../types/api'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const flavors = await prisma.flavor.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    })
    res.json(ok(flavors))
  } catch (err) {
    next(err)
  }
})

export default router
