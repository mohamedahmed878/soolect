import { Router } from 'express'
import Product from '../models/Product.js'
import { asyncHandler, HttpError } from '../utils/errors.js'
import { escapeRegex, isObjectId, str } from '../utils/validate.js'

const router = Router()

router.get('/', asyncHandler(async (req, res) => {
  const filter = { active: true }
  const category = str(req.query.category, 30)
  if (category) filter.category = category
  const q = str(req.query.q, 60)
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' }
  res.json(await Product.find(filter).sort({ createdAt: -1 }).limit(200))
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const product = isObjectId(req.params.id) ? await Product.findOne({ _id: req.params.id, active: true }) : null
  if (!product) throw new HttpError(404, 'Product not found')
  res.json(product)
}))

export default router
