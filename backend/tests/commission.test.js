import assert from 'node:assert/strict'
import { test } from 'node:test'
import { commissionFor } from '../services/commission.js'
import { validateOrderInput } from '../utils/validate.js'

test('commission is a percentage of the goods, rounded to whole EGP', () => {
  assert.equal(commissionFor(1000, 0, 10), 100)
  assert.equal(commissionFor(999, 0, 10), 100) // 99.9 -> 100
  assert.equal(commissionFor(333, 0, 5), 17) // 16.65 -> 17
})

test('commission is calculated after the coupon discount', () => {
  assert.equal(commissionFor(1000, 200, 10), 80)
})

test('commission never goes negative or above the order value', () => {
  assert.equal(commissionFor(100, 500, 10), 0)
  assert.equal(commissionFor(100, 0, 250), 100) // rate is capped at 100%
  assert.equal(commissionFor(100, 0, -5), 0)
})

test('commission is 0 for a missing or invalid rate', () => {
  assert.equal(commissionFor(1000, 0, 0), 0)
  assert.equal(commissionFor(1000, 0, undefined), 0)
  assert.equal(commissionFor(1000, 0, 'abc'), 0)
})

const baseOrder = {
  items: [{ productId: 'a'.repeat(24), color: 'Black', size: 'M', qty: 1 }],
  contact: { email: 'a@b.co', phone: '01001234567' },
  address: { fullName: 'A B', address: 'Street 1', city: 'Alexandria' },
  shippingMethod: 'standard',
  paymentMethod: 'cod',
}

test('refCode is optional, trimmed and upper-cased', () => {
  assert.equal(validateOrderInput(baseOrder).refCode, null)
  assert.equal(validateOrderInput({ ...baseOrder, refCode: '  sara-k4p ' }).refCode, 'SARA-K4P')
})

test('refCode must be a string (no objects that could reach the database query)', () => {
  assert.equal(validateOrderInput({ ...baseOrder, refCode: { $ne: '' } }).refCode, null)
})
