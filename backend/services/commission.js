// Commission is earned on the goods the customer actually paid for:
// subtotal minus any coupon discount, never on shipping. Whole EGP, like the coupon maths.
export function commissionFor(subtotal, discount, ratePercent) {
  const rate = Number(ratePercent)
  if (!Number.isFinite(rate) || rate <= 0) return 0
  const base = Math.max(0, Number(subtotal) - Number(discount || 0))
  return Math.round((base * Math.min(rate, 100)) / 100)
}
