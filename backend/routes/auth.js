import bcrypt from 'bcryptjs'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { requireAuth, safeEqual, signToken } from '../middleware/auth.js'
import User from '../models/User.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { isEmail, isPhone, str } from '../utils/validate.js'

const router = Router()
// Per-instance memory on serverless, so this slows brute force down rather than stopping it.
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Try again in a few minutes.' } })

const adminUser = () => ({ _id: 'admin', name: 'Admin', email: env.adminEmail, role: 'admin' })
const password = (v) => (typeof v === 'string' ? v : '')

router.post('/register', limiter, asyncHandler(async (req, res) => {
  const name = str(req.body.name, 80)
  const email = str(req.body.email, 120).toLowerCase()
  const phone = str(req.body.phone, 30)
  const pass = password(req.body.password)
  if (!name) throw new HttpError(400, 'Name is required')
  if (!isEmail(email)) throw new HttpError(400, 'A valid email is required')
  if (!isPhone(phone)) throw new HttpError(400, 'A valid phone number is required')
  if (pass.length < 6 || pass.length > 72) throw new HttpError(400, 'Password must be 6 to 72 characters')
  if ((env.adminEmail && email === env.adminEmail) || (await User.exists({ email }))) throw new HttpError(409, 'Email already registered')

  const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(pass, 10) })
  res.status(201).json({ token: signToken(user.id, 'user'), user })
}))

router.post('/login', limiter, asyncHandler(async (req, res) => {
  const email = str(req.body.email, 120).toLowerCase()
  const pass = password(req.body.password)
  const fail = new HttpError(401, 'Wrong email or password')

  // The one admin lives in environment variables, not in the database.
  if (env.adminEmail && email === env.adminEmail) {
    if (!env.adminPassword || !safeEqual(pass, env.adminPassword)) throw fail
    return res.json({ token: signToken('admin', 'admin'), user: adminUser() })
  }

  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user || !(await bcrypt.compare(pass, user.passwordHash))) throw fail
  res.json({ token: signToken(user.id, 'user'), user })
}))

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  if (req.auth.role === 'admin') return res.json(adminUser())
  const user = await User.findById(req.auth.id)
  if (!user) throw new HttpError(401, 'Please log in')
  res.json(user)
}))

export default router
