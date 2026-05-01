import type { ErrorRequestHandler, RequestHandler } from 'express'
import { fail } from '../types/api'

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(fail(404, 'Not found'))
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err?.status === 'number' ? err.status : 500
  const message = err?.message ?? 'Internal server error'
  if (status >= 500) console.error('[errorHandler]', err)
  res.status(status).json(fail(status, message))
}
