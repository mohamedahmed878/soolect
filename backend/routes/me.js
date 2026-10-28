import { Router } from 'express'
import { requireUser } from '../middleware/auth.js'
import User from '../models/User.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { isObjectId, str } from '../utils/validate.js'

const router = Router()
router.use(requireUser)

const load = async (req) => {
  const user = await User.findById(req.auth.id)
  if (!user) throw new HttpError(401, 'Please log in')
  return user
}

router.get('/wishlist', asyncHandler(async (req, res) => {
  res.json({ ids: (await load(req)).wishlist.map(String) })
}))

// Replaces the whole list (the app syncs its local list in one call).
router.put('/wishlist', asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? [...new Set(req.body.ids.filter(isObjectId))].slice(0, 100) : null
  if (!ids) throw new HttpError(400, 'ids must be an array')
  const user = await load(req)
  user.wishlist = ids
  await user.save()
  res.json({ ids })
}))

router.get('/addresses', asyncHandler(async (req, res) => {
  res.json((await load(req)).addresses)
}))

router.put('/addresses', asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.addresses)) throw new HttpError(400, 'addresses must be an array')
  if (req.body.addresses.length > 20) throw new HttpError(400, 'You can save up to 20 addresses')
  const addresses = req.body.addresses.map((a) => ({
    label: str(a.label, 30), fullName: str(a.fullName, 80), phone: str(a.phone, 30), address: str(a.address, 200),
    city: str(a.city, 60), isDefault: !!a.isDefault,
  }))
  const firstDefault = addresses.findIndex((a) => a.isDefault)
  addresses.forEach((a, i) => { a.isDefault = firstDefault === -1 ? i === 0 : i === firstDefault })
  const user = await load(req)
  user.addresses = addresses
  await user.save()
  res.json(user.addresses)
}))

export default router
