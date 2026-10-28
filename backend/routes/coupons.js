import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import Coupon from '../models/Coupon.js'
import { couponDiscount } from '../services/pricing.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { str } from '../utils/validate.js'

const router = Router()
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Try again in a few minutes.' } })

// Preview only. The real discount is recalculated from the database when the order is placed.
router.post('/validate', limiter, asyncHandler(async (req, res) => {
  const code = str(req.body.code, 40).toUpperCase()
  const subtotal = Number(req.body.subtotal)
  if (!code) throw new HttpError(400, 'Enter a code')
  if (!Number.isFinite(subtotal) || subtotal < 0) throw new HttpError(400, 'Invalid subtotal')
  const coupon = await Coupon.findOne({ code })
  res.json({ code, amount: couponDiscount(coupon, subtotal) })
}))

export default router
