import crypto from 'node:crypto'
import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import Affiliate from '../models/Affiliate.js'
import Coupon from '../models/Coupon.js'
import Order, { ORDER_STATUSES, PAYMENT_STATUSES } from '../models/Order.js'
import Product from '../models/Product.js'
import { changeStatus } from '../services/orderService.js'
import { publishOrderUpdate } from '../services/pusher.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { isObjectId, str } from '../utils/validate.js'

const router = Router()
router.use(requireAdmin)

const need = (id, what) => { if (!isObjectId(id)) throw new HttpError(404, `${what} not found`) }
const num = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v))

/* ------------------------------ dashboard ------------------------------ */
router.get('/stats', asyncHandler(async (req, res) => {
  const [byStatus, revenue, products] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Product.find({}, 'name variants'),
  ])
  const lowStock = products.flatMap((p) => p.variants.filter((v) => v.stock <= 3).map((v) => ({ productId: p._id, name: p.name, sku: v.sku, color: v.color, size: v.size, stock: v.stock })))
  res.json({
    orders: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    revenue: revenue[0]?.total || 0,
    paidOrDueOrders: revenue[0]?.orders || 0,
    lowStock: lowStock.slice(0, 50),
  })
}))

/* ------------------------------- products ------------------------------ */
const CATEGORIES = ['hoodies', 'tshirts', 'accessories']
const TYPES = ['hoodie', 'tee', 'cap']

// Whitelist the fields: never pass req.body straight to the model.
function cleanProduct(b = {}) {
  const out = {}
  if ('name' in b) out.name = str(b.name, 120)
  if ('category' in b) out.category = str(b.category, 30)
  if ('type' in b) out.type = str(b.type, 20)
  if ('description' in b) out.description = str(b.description, 2000)
  if ('price' in b) out.price = num(b.price)
  if ('oldPrice' in b) out.oldPrice = num(b.oldPrice)
  if ('active' in b) out.active = !!b.active
  if ('rating' in b) out.rating = num(b.rating)
  if ('reviews' in b) out.reviews = num(b.reviews)
  if ('images' in b) out.images = (Array.isArray(b.images) ? b.images : []).map((u) => str(u, 500)).filter(Boolean).slice(0, 10)
  if ('variants' in b) {
    if (!Array.isArray(b.variants)) throw new HttpError(400, 'variants must be an array')
    out.variants = b.variants.slice(0, 100).map((v) => ({
      sku: str(v?.sku, 60), color: str(v?.color, 30), size: str(v?.size, 20),
      price: num(v?.price), stock: num(v?.stock) ?? 0, image: str(v?.image, 500) || undefined,
    }))
  }
  if (out.category && !CATEGORIES.includes(out.category)) throw new HttpError(400, 'Invalid category')
  if (out.type && !TYPES.includes(out.type)) throw new HttpError(400, 'Invalid type')
  return out
}

router.get('/products', asyncHandler(async (req, res) => {
  res.json(await Product.find().sort({ createdAt: -1 }).limit(500))
}))

router.post('/products', asyncHandler(async (req, res) => {
  res.status(201).json(await Product.create(cleanProduct(req.body)))
}))

router.put('/products/:id', asyncHandler(async (req, res) => {
  need(req.params.id, 'Product')
  const product = await Product.findById(req.params.id)
  if (!product) throw new HttpError(404, 'Product not found')
  product.set(cleanProduct(req.body))
  await product.save() // save() (not update) so schema validation and the duplicate-SKU check run
  res.json(product)
}))

router.delete('/products/:id', asyncHandler(async (req, res) => {
  need(req.params.id, 'Product')
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) throw new HttpError(404, 'Product not found')
  res.json({ ok: true }) // old orders keep their own snapshot of name/price/sku
}))

/* -------------------------------- orders ------------------------------- */
router.get('/orders', asyncHandler(async (req, res) => {
  const filter = {}
  const status = str(req.query.status, 20)
  if (status) {
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status')
    filter.status = status
  }
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200)
  const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0)
  const [orders, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments(filter)])
  res.json({ orders, total })
}))

router.get('/orders/:id', asyncHandler(async (req, res) => {
  need(req.params.id, 'Order')
  const order = await Order.findById(req.params.id)
  if (!order) throw new HttpError(404, 'Order not found')
  res.json(order)
}))

router.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  need(req.params.id, 'Order')
  const status = str(req.body.status, 20)
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status')
  const order = await Order.findById(req.params.id)
  if (!order) throw new HttpError(404, 'Order not found')
  const updated = await changeStatus(order, status)
  await publishOrderUpdate(updated)
  res.json(updated)
}))

// Used to confirm manual payments (Vodafone Cash transfer, etc.).
router.patch('/orders/:id/payment', asyncHandler(async (req, res) => {
  need(req.params.id, 'Order')
  const paymentStatus = str(req.body.paymentStatus, 20)
  if (!PAYMENT_STATUSES.includes(paymentStatus)) throw new HttpError(400, 'Invalid payment status')
  const order = await Order.findByIdAndUpdate(req.params.id, { paymentStatus }, { new: true })
  if (!order) throw new HttpError(404, 'Order not found')
  res.json(order)
}))

/* ------------------------------- coupons ------------------------------- */
function cleanCoupon(b = {}) {
  const out = {}
  if ('code' in b) out.code = str(b.code, 40).toUpperCase()
  if ('type' in b) out.type = str(b.type, 10)
  if ('value' in b) out.value = num(b.value)
  if ('maxDiscount' in b) out.maxDiscount = num(b.maxDiscount)
  if ('minSubtotal' in b) out.minSubtotal = num(b.minSubtotal) ?? 0
  if ('usageLimit' in b) out.usageLimit = num(b.usageLimit)
  if ('expiresAt' in b) out.expiresAt = b.expiresAt ? new Date(b.expiresAt) : undefined
  if ('active' in b) out.active = !!b.active
  if (out.expiresAt && Number.isNaN(out.expiresAt.getTime())) throw new HttpError(400, 'Invalid expiry date')
  return out
}

router.get('/coupons', asyncHandler(async (req, res) => {
  res.json(await Coupon.find().sort({ createdAt: -1 }).limit(200))
}))

router.post('/coupons', asyncHandler(async (req, res) => {
  res.status(201).json(await Coupon.create(cleanCoupon(req.body)))
}))

router.put('/coupons/:id', asyncHandler(async (req, res) => {
  need(req.params.id, 'Coupon')
  const coupon = await Coupon.findById(req.params.id)
  if (!coupon) throw new HttpError(404, 'Coupon not found')
  coupon.set(cleanCoupon(req.body))
  await coupon.save()
  res.json(coupon)
}))

router.delete('/coupons/:id', asyncHandler(async (req, res) => {
  need(req.params.id, 'Coupon')
  const coupon = await Coupon.findByIdAndDelete(req.params.id)
  if (!coupon) throw new HttpError(404, 'Coupon not found')
  res.json({ ok: true })
}))

/* ------------------------- affiliates (marketers) ------------------------ */
function cleanAffiliate(b = {}) {
  const out = {}
  if ('name' in b) out.name = str(b.name, 80)
  if ('code' in b) out.code = str(b.code, 20).toUpperCase()
  if ('email' in b) out.email = str(b.email, 120).toLowerCase()
  if ('phone' in b) out.phone = str(b.phone, 30)
  if ('notes' in b) out.notes = str(b.notes, 300)
  if ('commissionRate' in b) out.commissionRate = num(b.commissionRate)
  if ('active' in b) out.active = !!b.active
  if (out.commissionRate !== undefined && !Number.isFinite(out.commissionRate)) throw new HttpError(400, 'Commission rate must be a number')
  return out
}

// Used when the admin leaves the code empty: letters from the name + 3 random characters, e.g. SARA-K4P.
const autoCode = (name) => `${String(name).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'AFF'}-${crypto.randomBytes(2).toString('hex').slice(0, 3).toUpperCase()}`

const ZERO = { orders: 0, sales: 0, pending: 0, payable: 0, paid: 0 }

// Per-marketer numbers. Cancelled orders earn nothing.
//   pending = order not delivered yet; payable = delivered and not yet paid out; paid = already paid out.
async function statsFor(ids) {
  const live = { $ne: ['$status', 'cancelled'] }
  const delivered = { $eq: ['$status', 'delivered'] }
  const isPaid = { $eq: ['$commissionPaid', true] }
  const rows = await Order.aggregate([
    { $match: { affiliateId: { $in: ids } } },
    { $group: {
      _id: '$affiliateId',
      orders: { $sum: { $cond: [live, 1, 0] } },
      sales: { $sum: { $cond: [live, '$total', 0] } },
      pending: { $sum: { $cond: [{ $in: ['$status', ['processing', 'shipped']] }, '$commission', 0] } },
      payable: { $sum: { $cond: [{ $and: [delivered, { $not: [isPaid] }] }, '$commission', 0] } },
      paid: { $sum: { $cond: [{ $and: [delivered, isPaid] }, '$commission', 0] } },
    } },
  ])
  return new Map(rows.map(({ _id, ...s }) => [String(_id), s]))
}

router.get('/affiliates', asyncHandler(async (req, res) => {
  const list = await Affiliate.find().sort({ createdAt: -1 }).limit(200)
  const stats = await statsFor(list.map((a) => a._id))
  res.json(list.map((a) => ({ ...a.toJSON(), stats: stats.get(String(a._id)) || ZERO })))
}))

router.post('/affiliates', asyncHandler(async (req, res) => {
  const data = cleanAffiliate(req.body)
  if (!data.code && data.name) data.code = autoCode(data.name)
  res.status(201).json({ ...(await Affiliate.create(data)).toJSON(), stats: ZERO })
}))

// Changing the rate only affects FUTURE orders: each order keeps the rate it was placed with.
router.put('/affiliates/:id', asyncHandler(async (req, res) => {
  need(req.params.id, 'Marketer')
  const affiliate = await Affiliate.findById(req.params.id)
  if (!affiliate) throw new HttpError(404, 'Marketer not found')
  affiliate.set(cleanAffiliate(req.body))
  await affiliate.save()
  res.json({ ...affiliate.toJSON(), stats: (await statsFor([affiliate._id])).get(String(affiliate._id)) || ZERO })
}))

router.delete('/affiliates/:id', asyncHandler(async (req, res) => {
  need(req.params.id, 'Marketer')
  if (await Order.exists({ affiliateId: req.params.id })) throw new HttpError(409, 'This marketer has orders. Deactivate them instead of deleting.')
  const affiliate = await Affiliate.findByIdAndDelete(req.params.id)
  if (!affiliate) throw new HttpError(404, 'Marketer not found')
  res.json({ ok: true })
}))

router.get('/affiliates/:id/orders', asyncHandler(async (req, res) => {
  need(req.params.id, 'Marketer')
  // .lean() skips the customer-facing toJSON, which hides the commission fields.
  res.json(await Order.find({ affiliateId: req.params.id })
    .select('number status total commission commissionRate commissionPaid commissionPaidAt createdAt')
    .sort({ createdAt: -1 }).limit(200).lean())
}))

// Marks every delivered, unpaid order of this marketer as paid. Call it after sending them the money.
router.post('/affiliates/:id/payout', asyncHandler(async (req, res) => {
  need(req.params.id, 'Marketer')
  const affiliate = await Affiliate.findById(req.params.id)
  if (!affiliate) throw new HttpError(404, 'Marketer not found')
  const due = await Order.find({ affiliateId: affiliate._id, status: 'delivered', commissionPaid: { $ne: true }, commission: { $gt: 0 } }).select('commission').lean()
  const result = await Order.updateMany(
    { _id: { $in: due.map((o) => o._id) }, commissionPaid: { $ne: true } },
    { $set: { commissionPaid: true, commissionPaidAt: new Date() } }
  )
  res.json({ paidOrders: result.modifiedCount, amount: due.reduce((s, o) => s + o.commission, 0) })
}))

export default router
