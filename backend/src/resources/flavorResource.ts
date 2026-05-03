import type { RequestHandler } from 'express'
import { flavorRepository } from '../repositories/flavorRepository'
import { makeListFlavors } from '../usecases/listFlavors'
import { ok } from '../types/api'

const listFlavors = makeListFlavors({ flavorRepo: flavorRepository })

export const flavorResource = {
  list: <RequestHandler>(async (_req, res, next) => {
    try {
      const flavors = await listFlavors()
      res.json(ok(flavors))
    } catch (err) {
      next(err)
    }
  }),
}
