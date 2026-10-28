import { HttpError } from './errors.js'

export const PAYMENT_METHODS = ['card', 'vodafone', 'cod', 'paypal']
export const SHIPPING_IDS = ['standard', 'express', 'free']
const OBJECT_ID = /^[a-f\d]{24}$/i

export const isObjectId = (v) => typeof v === 'string' && OBJECT_ID.test(v)
export const isEmail = (s) => typeof s === 'string' && s.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
export const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
export const digits = (s) => String(s ?? '').replace(/\D/g, '')
export const isPhone = (s) => { const d = digits(s); return d.length >= 8 && d.length <= 15 }
// Compare phones by their last 10 digits so "+20 100 123 4567" matches "0100 123 4567".
export const phoneKey = (s) => digits(s).slice(-10)
// "Mohamed Ahmed Ali" -> "Mohamed A." : the homepage never shows a customer's full name.
export const publicName = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Customer'
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const bad = (msg) => new HttpError(400, msg)

export function validateOrderInput(body = {}) {
  const rawItems = Array.isArray(body.items) ? body.items : []
  if (!rawItems.length) throw bad('Your cart is empty')
  if (rawItems.length > 50) throw bad('Too many items')

  const items = rawItems.map((i) => {
    const qty = Number(i?.qty)
    if (!isObjectId(i?.productId)) throw bad('Invalid product in cart')
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw bad('Quantity must be between 1 and 20')
    const color = str(i.color, 30).toLowerCase()
    const size = str(i.size, 20)
    if (!color || !size) throw bad('Choose a color and size for every item')
    return { productId: i.productId, color, size, qty }
  })

  const email = str(body.contact?.email, 120).toLowerCase()
  const phone = str(body.contact?.phone, 30)
  if (!isEmail(email)) throw bad('A valid email is required')
  if (!isPhone(phone)) throw bad('A valid phone number is required')

  const a = body.address || {}
  const address = { fullName: str(a.fullName, 80), address: str(a.address, 200), city: str(a.city, 60) }
  if (!address.fullName || !address.address || !address.city) throw bad('Name, address and city are required')

  const shippingMethod = str(body.shippingMethod, 20)
  if (!SHIPPING_IDS.includes(shippingMethod)) throw bad('Invalid shipping method')
  const paymentMethod = str(body.paymentMethod, 20)
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw bad('Invalid payment method')

  const discountCode = str(body.discountCode, 40).toUpperCase() || null
  // Marketer referral code from the `?ref=` link. Optional, and an unknown code never blocks an order.
  const refCode = str(body.refCode, 20).toUpperCase() || null
  return { items, contact: { email, phone }, address, shippingMethod, paymentMethod, discountCode, refCode }
}
