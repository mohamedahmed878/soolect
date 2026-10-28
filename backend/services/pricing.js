import { HttpError } from '../utils/errors.js'

// Keep in sync with frontend/src/context/CartContext.jsx
export const FREE_SHIPPING_OVER = 1000
export const SHIPPING_PRICES = { standard: 50, express: 100, free: 0 }

// `subtotal` is the items total BEFORE any coupon.
export function shippingFor(method, subtotal) {
  if (!Object.hasOwn(SHIPPING_PRICES, method)) throw new HttpError(400, 'Invalid shipping method')
  if (method === 'free') {
    if (subtotal < FREE_SHIPPING_OVER) throw new HttpError(400, `Free shipping needs an order over ${FREE_SHIPPING_OVER} EGP`)
    return 0
  }
  if (method === 'standard') return subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_PRICES.standard
  return SHIPPING_PRICES.express
}

// Returns the discount in whole EGP, or throws a 400 explaining why the coupon can't be used.
export function couponDiscount(coupon, subtotal, now = new Date()) {
  if (!coupon || !coupon.active) throw new HttpError(400, 'Invalid code')
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) throw new HttpError(400, 'This code has expired')
  if (coupon.usageLimit != null && (coupon.usedCount || 0) >= coupon.usageLimit) throw new HttpError(400, 'This code has reached its usage limit')
  if (subtotal < (coupon.minSubtotal || 0)) throw new HttpError(400, `This code needs an order of at least ${coupon.minSubtotal} EGP`)

  let amount = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value
  if (coupon.type === 'percent' && coupon.maxDiscount) amount = Math.min(amount, coupon.maxDiscount)
  return Math.max(0, Math.min(amount, subtotal))
}
