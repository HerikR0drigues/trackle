import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import healthzRoute from './routes/healthz'
import flavorsRoute from './routes/flavors'
import puzzlesRoute from './routes/puzzles'
import { errorHandler, notFound } from './middleware/errorHandler'

const app = express()
const PORT = Number(process.env.PORT) || 3001

const corsOriginEnv = process.env.CORS_ORIGIN
const corsOrigin =
  !corsOriginEnv || corsOriginEnv === '*' ? true : corsOriginEnv.split(',').map((s) => s.trim())

app.use(cors({ origin: corsOrigin }))
app.use(express.json())

app.use('/healthz', healthzRoute)
app.use('/flavors', flavorsRoute)
app.use('/puzzles', puzzlesRoute)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`[trackle-backend] listening on http://localhost:${PORT}`)
})
