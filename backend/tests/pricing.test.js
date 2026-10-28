import assert from 'node:assert/strict'
import { test } from 'node:test'
import { couponDiscount, shippingFor } from '../services/pricing.js'

test('standard shipping is 50 EGP below 1000 and free from 1000', () => {
  assert.equal(shippingFor('standard', 999), 50)
  assert.equal(shippingFor('standard', 1000), 0)
})

test('express shipping is always 100 EGP', () => {
  assert.equal(shippingFor('express', 100), 100)
  assert.equal(shippingFor('express', 5000), 100)
})

test('the free method is only allowed from 1000 EGP', () => {
  assert.equal(shippingFor('free', 1000), 0)
  assert.throws(() => shippingFor('free', 999), /over 1000/)
})

test('unknown shipping methods are rejected (including prototype keys)', () => {
  assert.throws(() => shippingFor('drone', 1000), /Invalid shipping/)
  assert.throws(() => shippingFor('constructor', 1000), /Invalid shipping/)
})

test('percent coupon rounds to whole EGP and respects maxDiscount', () => {
  const c = { active: true, type: 'percent', value: 10 }
  assert.equal(couponDiscount(c, 1255), 126)
  assert.equal(couponDiscount({ ...c, maxDiscount: 100 }, 1255), 100)
})

test('fixed coupon never exceeds the subtotal', () => {
  assert.equal(couponDiscount({ active: true, type: 'fixed', value: 500 }, 300), 300)
  assert.equal(couponDiscount({ active: true, type: 'fixed', value: 50 }, 300), 50)
})

test('coupon rejects inactive, missing, expired, exhausted and too-small orders', () => {
  const base = { active: true, type: 'percent', value: 10 }
  assert.throws(() => couponDiscount(null, 500), /Invalid code/)
  assert.throws(() => couponDiscount({ ...base, active: false }, 500), /Invalid code/)
  assert.throws(() => couponDiscount({ ...base, expiresAt: new Date('2020-01-01') }, 500), /expired/)
  assert.throws(() => couponDiscount({ ...base, usageLimit: 5, usedCount: 5 }, 500), /usage limit/)
  assert.throws(() => couponDiscount({ ...base, minSubtotal: 800 }, 500), /at least 800/)
})
