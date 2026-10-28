import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isEmail, isPhone, phoneKey, validateOrderInput } from '../utils/validate.js'

const good = () => ({
  items: [{ productId: 'a'.repeat(24), color: 'Black', size: 'M', qty: 2, price: 1 }],
  contact: { email: 'Test@Example.com', phone: '+20 100 123 4567' },
  address: { fullName: 'Mohamed Ahmed', address: '12 Street', city: 'Alexandria' },
  shippingMethod: 'standard',
  paymentMethod: 'cod',
  discountCode: ' soolect10 ',
})

test('valid order input is cleaned and client prices are dropped', () => {
  const out = validateOrderInput(good())
  assert.deepEqual(out.items, [{ productId: 'a'.repeat(24), color: 'black', size: 'M', qty: 2 }])
  assert.equal(out.contact.email, 'test@example.com')
  assert.equal(out.discountCode, 'SOOLECT10')
})

test('empty cart, bad ids and bad quantities are rejected', () => {
  assert.throws(() => validateOrderInput({ ...good(), items: [] }), /empty/)
  const bad = (patch) => ({ ...good(), items: [{ ...good().items[0], ...patch }] })
  assert.throws(() => validateOrderInput(bad({ productId: '123' })), /Invalid product/)
  assert.throws(() => validateOrderInput(bad({ qty: 0 })), /Quantity/)
  assert.throws(() => validateOrderInput(bad({ qty: 21 })), /Quantity/)
  assert.throws(() => validateOrderInput(bad({ qty: 1.5 })), /Quantity/)
  assert.throws(() => validateOrderInput(bad({ size: '' })), /color and size/)
})

test('contact, address and method checks', () => {
  assert.throws(() => validateOrderInput({ ...good(), contact: { email: 'nope', phone: '01001234567' } }), /email/)
  assert.equal(validateOrderInput({ ...good(), contact: { phone: '01001234567' } }).contact.email, undefined) // email is optional
  assert.throws(() => validateOrderInput({ ...good(), contact: { email: 'a@b.co', phone: '12' } }), /phone/)
  assert.throws(() => validateOrderInput({ ...good(), address: { fullName: '', address: 'x', city: 'y' } }), /required/)
  assert.throws(() => validateOrderInput({ ...good(), shippingMethod: 'drone' }), /shipping/)
  assert.throws(() => validateOrderInput({ ...good(), paymentMethod: 'bitcoin' }), /payment/)
})

test('phone matching ignores formatting and country code', () => {
  assert.equal(phoneKey('+20 100 123 4567'), phoneKey('0100-123-4567'))
  assert.ok(isPhone('01001234567'))
  assert.ok(!isPhone('123'))
  assert.ok(isEmail('a@b.co'))
  assert.ok(!isEmail('a b@c.co'))
})

test('review names are shortened for the homepage', async () => {
  const { publicName } = await import('../utils/validate.js')
  assert.equal(publicName('Mohamed Ahmed Ali'), 'Mohamed A.')
  assert.equal(publicName('  sara  '), 'sara')
  assert.equal(publicName(''), 'Customer')
})
