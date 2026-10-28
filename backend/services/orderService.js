import crypto from 'node:crypto'
import Affiliate from '../models/Affiliate.js'
import Coupon from '../models/Coupon.js'
import Counter from '../models/Counter.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { HttpError } from '../utils/errors.js'
import { isObjectId, phoneKey } from '../utils/validate.js'
import { commissionFor } from './commission.js'
import { couponDiscount, shippingFor } from './pricing.js'

const TRANSITIONS = { processing: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'], delivered: [], cancelled: [] }

const label = (l) => `${l.name} (${l.color} / ${l.size})`

async function releaseStock(lines) {
  await Promise.all(lines.map((l) => Product.updateOne({ _id: l.productId, 'variants.sku': l.sku }, { $inc: { 'variants.$.stock': l.qty } })))
}

// Prices, stock, coupon and shipping are ALL decided here from the database.
// The browser only sends what the customer chose (product, color, size, qty), never a price.
export async function createOrder(input, auth) {
  const products = await Product.find({ _id: { $in: [...new Set(input.items.map((i) => i.productId))] }, active: true })
  const byId = new Map(products.map((p) => [String(p._id), p]))

  const merged = new Map()
  for (const i of input.items) {
    const product = byId.get(i.productId)
    if (!product) throw new HttpError(400, 'A product in your cart is no longer available')
    const variant = product.variants.find((v) => v.color === i.color && v.size.toLowerCase() === i.size.toLowerCase())
    if (!variant) throw new HttpError(400, `${product.name} is not available in ${i.color} / ${i.size}`)
    const key = `${product._id}|${variant.sku}`
    const line = merged.get(key) || {
      productId: product._id, name: product.name, type: product.type, sku: variant.sku, color: variant.color, size: variant.size,
      image: variant.image || product.images?.[0], qty: 0, price: product.variantPrice(variant), stock: variant.stock,
    }
    line.qty += i.qty
    merged.set(key, line)
  }

  const lines = [...merged.values()]
  for (const l of lines) {
    if (l.qty > 20) throw new HttpError(400, `You can order up to 20 of ${label(l)}`)
    if (l.stock < l.qty) throw new HttpError(409, l.stock > 0 ? `Only ${l.stock} left of ${label(l)}` : `${label(l)} is out of stock`)
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const shipping = shippingFor(input.shippingMethod, subtotal)
  let coupon = null
  let discount = 0
  if (input.discountCode) {
    coupon = await Coupon.findOne({ code: input.discountCode })
    discount = couponDiscount(coupon, subtotal)
  }
  const total = subtotal - discount + shipping

  // Credit the marketer, if any. A bad/inactive code is ignored, and a marketer can't earn on their own order.
  let affiliate = input.refCode ? await Affiliate.findOne({ code: input.refCode, active: true }) : null
  // No email at checkout any more, so self-referral is also caught by phone number.
  if (affiliate && ((affiliate.email && affiliate.email === input.contact.email) || (affiliate.phone && phoneKey(affiliate.phone) === phoneKey(input.contact.phone)))) affiliate = null
  const commission = affiliate ? commissionFor(subtotal, discount, affiliate.commissionRate) : 0

  // No multi-document transaction (keeps it simple on serverless): reserve atomically, undo on any failure.
  const reserved = []
  let couponUsed = false
  try {
    for (const l of lines) {
      const r = await Product.updateOne(
        { _id: l.productId, variants: { $elemMatch: { sku: l.sku, stock: { $gte: l.qty } } } },
        { $inc: { 'variants.$.stock': -l.qty } }
      )
      if (r.modifiedCount !== 1) throw new HttpError(409, `${label(l)} just sold out`)
      reserved.push(l)
    }

    if (coupon) {
      const r = await Coupon.updateOne(
        { _id: coupon._id, active: true, $or: [{ usageLimit: { $exists: false } }, { usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
        { $inc: { usedCount: 1 } }
      )
      if (r.modifiedCount !== 1) throw new HttpError(400, 'This code has reached its usage limit')
      couponUsed = true
    }

    const accessToken = crypto.randomBytes(24).toString('hex')
    const now = new Date()
    const doc = {
      userId: auth?.role === 'user' && isObjectId(auth.id) ? auth.id : undefined,
      accessToken,
      items: lines.map(({ stock, ...item }) => item),
      contact: input.contact,
      address: input.address,
      shippingMethod: input.shippingMethod,
      paymentMethod: input.paymentMethod,
      discountCode: coupon?.code,
      ...(affiliate && { affiliateId: affiliate._id, affiliateCode: affiliate.code, commissionRate: affiliate.commissionRate, commission }),
      subtotal, discount, shipping, total,
      timeline: [{ status: 'placed', at: now }, { status: 'processing', at: now }],
    }
    const order = await createWithOrderNumber(doc)
    return { order, accessToken }
  } catch (e) {
    await releaseStock(reserved).catch((err) => console.error('Stock rollback failed:', err))
    if (couponUsed) await Coupon.updateOne({ _id: coupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }).catch(() => {})
    throw e
  }
}

// Order numbers come from an atomic counter. If the counter ever falls behind the real orders
// (collection cleared/restored/edited by hand), create() hits a duplicate "number". Heal the counter and retry.
async function nextOrderNumber() {
  const c = await Counter.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { upsert: true, new: true })
  return `SO${10000 + c.seq}`
}

async function syncOrderCounter() {
  const [last] = await Order.find().sort({ number: -1 }).limit(1).select('number').lean()
  const seq = last ? parseInt(String(last.number).replace(/\D/g, ''), 10) - 10000 : 0
  if (Number.isFinite(seq) && seq > 0) await Counter.updateOne({ _id: 'order', seq: { $lt: seq } }, { $set: { seq } }, { upsert: true }).catch(() => {})
}

// Only `_id` and `number` may be unique on orders. Any other unique index is a leftover from an old version of the
// schema (e.g. on contact.email) and makes every second order fail with "Already exists", so drop it.
async function dropStaleOrderIndexes() {
  const indexes = await Order.collection.indexes()
  const stale = indexes.filter((i) => i.unique && i.name !== '_id_' && i.name !== 'number_1')
  for (const i of stale) {
    await Order.collection.dropIndex(i.name).catch((err) => console.error('Could not drop index', i.name, err.message))
    console.warn('Dropped stale unique index on orders:', i.name)
  }
  return stale.length
}

async function createWithOrderNumber(doc) {
  let healedIndexes = false
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await Order.create({ ...doc, number: await nextOrderNumber() })
    } catch (e) {
      if (e?.code !== 11000 || attempt === 4) throw e
      if (e.keyPattern?.number) { await syncOrderCounter(); continue }
      // A duplicate on some other field: a stale unique index. Clean it up once, then retry.
      if (healedIndexes || !(await dropStaleOrderIndexes().catch(() => 0))) throw e
      healedIndexes = true
    }
  }
}

export async function changeStatus(order, next) {
  if (!TRANSITIONS[order.status]?.includes(next)) throw new HttpError(400, `Cannot change an order from ${order.status} to ${next}`)

  const set = { status: next }
  if (next === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') set.paymentStatus = 'paid'

  // The status filter makes this atomic: two admins clicking at once can't both cancel (and double-restock) an order.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: set, $push: { timeline: { status: next, at: new Date() } } },
    { new: true }
  )
  if (!updated) throw new HttpError(409, 'This order was just changed by someone else. Refresh and try again.')

  if (next === 'cancelled') {
    await releaseStock(updated.items)
    if (updated.discountCode) await Coupon.updateOne({ code: updated.discountCode, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } })
  }
  return updated
}
