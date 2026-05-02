import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import healthzRoute from './routes/healthz'
import flavorsRoute from './routes/flavors'
import puzzlesRoute from './routes/puzzles'
import { errorHandler, notFound } from './middleware/errorHandler'

const app = express()
const PORT = Number(process.env.PORT) || 3001

const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const allowAny = allowedOrigins.length === 0 || allowedOrigins.includes('*')
const isDev = process.env.NODE_ENV !== 'production'
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true) // same-origin / curl / SSR
      if (allowAny) return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      if (isDev && localhostRegex.test(origin)) return cb(null, true)
      cb(new Error(`CORS: origin ${origin} not allowed`))
    },
  }),
)
app.use(express.json())

app.use('/healthz', healthzRoute)
app.use('/flavors', flavorsRoute)
app.use('/puzzles', puzzlesRoute)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`[trackle-backend] listening on http://localhost:${PORT}`)
})
