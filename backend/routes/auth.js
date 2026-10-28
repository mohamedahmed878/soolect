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
 
// What goes into the token: 'admin' for admins, 'user' for everyone else
// (same values the app already used, so the rest of the backend keeps working).
const tokenRole = (user) => (user.role === 'admin' ? 'admin' : 'user')
 
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
 
  // role is never taken from the request: everyone who registers is a customer.
  const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(pass, 10) })
  res.status(201).json({ token: signToken(user.id, 'user'), user })
}))
 
router.post('/login', limiter, asyncHandler(async (req, res) => {
  const email = str(req.body.email, 120).toLowerCase()
  const pass = password(req.body.password)
  const fail = new HttpError(401, 'Wrong email or password')
 
  // The env admin (ADMIN_EMAIL / ADMIN_PASSWORD) still works.
  if (env.adminEmail && email === env.adminEmail) {
    if (!env.adminPassword || !safeEqual(pass, env.adminPassword)) throw fail
    return res.json({ token: signToken('admin', 'admin'), user: adminUser() })
  }
 
  // Any user in MongoDB whose role is 'admin' also becomes an admin.
  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user || !(await bcrypt.compare(pass, user.passwordHash))) throw fail
  res.json({ token: signToken(user.id, tokenRole(user)), user })
}))
 
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  // Only the env admin has the fake id 'admin'; DB admins have a real user id.
  if (req.auth.id === 'admin') return res.json(adminUser())
  const user = await User.findById(req.auth.id)
  if (!user) throw new HttpError(401, 'Please log in')
  res.json(user)
}))
 
export default router