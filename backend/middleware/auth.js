import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { HttpError } from '../utils/errors.js'

export const signToken = (sub, role = 'user') => jwt.sign({ sub: String(sub), role }, env.jwtSecret, { algorithm: 'HS256', expiresIn: '7d' })

function readToken(req) {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return null
  try { return jwt.verify(h.slice(7), env.jwtSecret, { algorithms: ['HS256'] }) } catch { return null }
}

// Guests and logged-in customers both may call the route. A bad/stale token is treated as "guest".
export function optionalAuth(req, res, next) {
  const p = readToken(req)
  req.auth = p ? { id: p.sub, role: p.role } : null
  next()
}

export function requireAuth(req, res, next) {
  const p = readToken(req)
  if (!p) return next(new HttpError(401, 'Please log in'))
  req.auth = { id: p.sub, role: p.role }
  next()
}

export function requireUser(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err)
    if (req.auth.role !== 'user') return next(new HttpError(403, 'Customer accounts only'))
    next()
  })
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err)
    if (req.auth.role !== 'admin') return next(new HttpError(403, 'Admins only'))
    next()
  })
}

// Constant-time comparison (hash first so lengths are equal).
export function safeEqual(a, b) {
  const h = (v) => crypto.createHash('sha256').update(String(v)).digest()
  return crypto.timingSafeEqual(h(a), h(b))
}
