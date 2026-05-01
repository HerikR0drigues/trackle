import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.PORT) || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) ?? '*'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

app.get('/healthz', (_req, res) => {
  res.json({ status: 200, value: { ok: true }, message: 'ok' })
})

app.listen(PORT, () => {
  console.log(`[musicle-backend] listening on http://localhost:${PORT}`)
})
