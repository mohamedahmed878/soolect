import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { errorHandler, notFound } from './middleware/error.js'
import admin from './routes/admin.js'
import auth from './routes/auth.js'
import coupons from './routes/coupons.js'
import me from './routes/me.js'
import orders from './routes/orders.js'
import products from './routes/products.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1) // Vercel sits behind a proxy; needed for correct client IPs in rate limiting
app.use(helmet())
const origins = env.clientOrigins
if (origins.length) app.use(cors({ origin: origins }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Open (or reuse) the MongoDB connection before any other API route.
app.use('/api', async (req, res, next) => {
  try { await connectDB(); next() } catch (e) { next(e) }
})

app.use('/api/auth', auth)
app.use('/api/products', products)
app.use('/api/coupons', coupons)
app.use('/api/orders', orders)
app.use('/api/me', me)
app.use('/api/admin', admin)

app.use(notFound)
app.use(errorHandler)

export default app
