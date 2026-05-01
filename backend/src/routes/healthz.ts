import { Router } from 'express'
import { ok } from '../types/api'

const router = Router()

router.get('/', (_req, res) => {
  res.json(ok({ ok: true }))
})

export default router
