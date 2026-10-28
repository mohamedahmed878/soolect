import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth, requireUser, safeEqual } from '../middleware/auth.js'
import Order from '../models/Order.js'
import { changeStatus, createOrder } from '../services/orderService.js'
import { publishOrderUpdate } from '../services/pusher.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { isObjectId, phoneKey, str, validateOrderInput } from '../utils/validate.js'

const router = Router()
const limiter = (limit) => rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Try again in a few minutes.' } })

// Guests may order: no login needed. A logged-in customer's order is linked to their account.
router.post('/', limiter(30), optionalAuth, asyncHandler(async (req, res) => {
  const { order, accessToken } = await createOrder(validateOrderInput(req.body), req.auth)
  res.status(201).json({ ...order.toJSON(), accessToken })
}))

router.get('/my', requireUser, asyncHandler(async (req, res) => {
  res.json(await Order.find({ userId: req.auth.id }).sort({ createdAt: -1 }).limit(100))
}))

// Guests find their order with the order number + the phone used at checkout.
router.post('/track', limiter(15), asyncHandler(async (req, res) => {
  const number = str(req.body.number, 20).toUpperCase().replace(/^#/, '')
  const phone = phoneKey(req.body.phone)
  const order = number && phone.length >= 8 ? await Order.findOne({ number }).select('+accessToken') : null
  if (!order || phoneKey(order.contact.phone) !== phone) throw new HttpError(404, 'No order found with that number and phone')
  res.json({ ...order.toJSON(), accessToken: order.accessToken })
}))

// Owner (JWT), or anyone holding the order's secret token (?token=), or the admin.
async function loadAllowed(req, { adminOk = true } = {}) {
  const order = isObjectId(req.params.id) ? await Order.findById(req.params.id).select('+accessToken') : null
  const token = str(req.query.token || req.body?.token, 100)
  const allowed = order && (
    (adminOk && req.auth?.role === 'admin') ||
    (req.auth?.role === 'user' && order.userId && String(order.userId) === req.auth.id) ||
    (token && safeEqual(token, order.accessToken))
  )
  if (!allowed) throw new HttpError(404, 'Order not found') // 404, not 403: don't reveal which ids exist
  return order
}

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  res.json(await loadAllowed(req))
}))

// The customer can cancel their own order while it is still new. Stock and coupon use are restored.
// Once the store has shipped it, they contact us instead.
router.post('/:id/cancel', limiter(15), optionalAuth, asyncHandler(async (req, res) => {
  const order = await loadAllowed(req, { adminOk: false })
  if (order.status === 'cancelled') return res.json(order)
  if (order.status !== 'processing') throw new HttpError(400, 'This order is already on its way and can no longer be cancelled. Please contact us on WhatsApp.')
  const updated = await changeStatus(order, 'cancelled')
  await publishOrderUpdate(updated)
  res.json(updated)
}))

export default router
